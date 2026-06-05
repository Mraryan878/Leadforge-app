import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: businessId, noteId } = await params

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        businessId: businessId,
      },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    if (note.userId !== session.user?.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.note.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/businesses/[id]/notes/[noteId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
