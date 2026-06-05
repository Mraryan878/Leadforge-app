import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/businesses/[id]/history - Get stage change history for a business
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: businessId } = await params

    const history = await prisma.stageHistory.findMany({
      where: { businessId: businessId },
      include: {
        fromStage: true,
        toStage: true,
        changedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error("GET /api/businesses/[id]/history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}