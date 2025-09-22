import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user data to check usage limits
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("usage_count, usage_limit, subscription_tier")
      .eq("id", user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check usage limits
    if (userData.usage_count >= userData.usage_limit) {
      return NextResponse.json({ error: "Usage limit exceeded. Please upgrade your plan." }, { status: 429 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadedDocuments = []

    for (const file of files) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `File type ${file.type} not supported` }, { status: 400 })
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} exceeds 10MB limit` }, { status: 400 })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(7)
      const fileExtension = file.name.split(".").pop()
      const uniqueFilename = `${user.id}/${timestamp}-${randomString}.${fileExtension}`

      // Convert file to buffer for storage
      const buffer = Buffer.from(await file.arrayBuffer())

      // Store file in Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from("documents")
        .upload(uniqueFilename, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (storageError) {
        console.error("Storage error:", storageError)
        return NextResponse.json({ error: `Failed to upload ${file.name}` }, { status: 500 })
      }

      // Save document metadata to database
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storageData.path,
          upload_status: "uploaded",
        })
        .select()
        .single()

      if (documentError) {
        console.error("Database error:", documentError)
        // Clean up uploaded file if database insert fails
        await supabase.storage.from("documents").remove([storageData.path])
        return NextResponse.json({ error: `Failed to save ${file.name} metadata` }, { status: 500 })
      }

      uploadedDocuments.push(documentData)
    }

    return NextResponse.json({
      message: "Files uploaded successfully",
      documents: uploadedDocuments,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
