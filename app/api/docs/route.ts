// NodeTest/app/api/docs/route.ts
import { NextResponse } from 'next/server';
import { getAllDocs } from '@/lib/docs';

export async function GET() {
  try {
    const docs = getAllDocs();
    return NextResponse.json(docs);
  } catch (error) {
    console.error("Error fetching docs:", error);
    return new NextResponse('Error fetching docs', { status: 500 });
  }
}