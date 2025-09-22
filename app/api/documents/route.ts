import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select(`
        *,
        analysis_jobs (
          id,
          status,
          analysis_type,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (documentsError) {
      console.error("Documents error:", documentsError)
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }

    const { count, error: countError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      console.error("Count error:", countError)
      return NextResponse.json({ error: "Failed to get document count" }, { status: 500 })
    }

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Documents API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    // CORRECTED: Fetch both storage_path and text_storage_path
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("storage_path, text_storage_path")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (documentError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // --- NEW LOGIC: Prepare a list of all files to be deleted ---
    const filesToDelete: string[] = [];
    if (document.storage_path) {
      filesToDelete.push(document.storage_path);
    }
    if (document.text_storage_path) {
      filesToDelete.push(document.text_storage_path);
    }
    // --- END NEW LOGIC ---

    if (filesToDelete.length > 0) {
      // CORRECTED: Delete all associated files from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove(filesToDelete);

      if (storageError) {
        // Log the error but don't block the process, as the database record is the source of truth
        console.error("Partial storage deletion error:", storageError.message);
      }
    }

    // Delete from database (this will cascade to analysis_jobs and reports)
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Database deletion error:", deleteError)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    return NextResponse.json({ message: "Document and all associated files deleted successfully" })
  } catch (error) {
    console.error("Delete document error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}