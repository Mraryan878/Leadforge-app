import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pipeline/stages - Get all pipeline stages
export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stages = await prisma.pipelineStage.findMany({
      orderBy: { position: "asc" }
    })

    return NextResponse.json(stages)
  } catch (error) {
    console.error("GET /api/pipeline/stages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}