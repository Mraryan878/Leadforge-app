import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/businesses/[id]/notes - Get all notes for a business
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const notes = await prisma.note.findMany({
      where: { businessId: id },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("GET /api/businesses/[id]/notes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/businesses/[id]/notes - Add a note to a business
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content } = await req.json()

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 })
    }

    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        businessId: id,
        userId: userId,
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("POST /api/businesses/[id]/notes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/businesses/[id]/notes/[noteId] - Delete a note
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: businessId } = await params
    
    // Get noteId from URL query parameter
    const url = new URL(req.url)
    const noteId = url.searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 })
    }

    // Check if note exists and belongs to this business
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        businessId: businessId
      }
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    // Only the note creator or admin can delete
    if (note.userId !== session.user?.id && session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.note.delete({
      where: { id: noteId }
    })

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/businesses/[id]/notes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}