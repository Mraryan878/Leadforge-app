import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/businesses/[id]/stage - Update business pipeline stage
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: businessId } = await params
    const { stageName } = await req.json()

    if (!stageName) {
      return NextResponse.json({ error: "Stage name is required" }, { status: 400 })
    }

    // Find the stage by name
    const newStage = await prisma.pipelineStage.findFirst({
      where: { name: stageName }
    })

    if (!newStage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    // Get current stage
    const currentPipeline = await prisma.leadPipeline.findUnique({
      where: { businessId: businessId },
      include: { stage: true }
    })

    const oldStageId = currentPipeline?.stageId

    // Update or create pipeline entry for this business
    await prisma.leadPipeline.upsert({
      where: { businessId: businessId },
      update: { stageId: newStage.id },
      create: {
        businessId: businessId,
        stageId: newStage.id,
      },
    })

    // Record stage change history (if stage actually changed)
    if (oldStageId && oldStageId !== newStage.id) {
      await prisma.stageHistory.create({
        data: {
          businessId: businessId,
          fromStageId: oldStageId,
          toStageId: newStage.id,
          changedById: session.user.id!,
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      stage: stageName,
      message: `Moved to ${stageName}`
    })
  } catch (error) {
    console.error("PUT /api/businesses/[id]/stage error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}