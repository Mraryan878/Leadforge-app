import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total businesses
    const totalBusinesses = await prisma.business.count()

    // Get new leads (businesses in "New" stage)
    const newLeads = await prisma.leadPipeline.count({
      where: {
        stage: {
          name: "New"
        }
      }
    })

    // Get contacted leads
    const contactedLeads = await prisma.leadPipeline.count({
      where: {
        stage: {
          name: "Contacted"
        }
      }
    })

    // Get interested leads
    const interestedLeads = await prisma.leadPipeline.count({
      where: {
        stage: {
          name: "Interested"
        }
      }
    })

    // Get won leads
    const wonLeads = await prisma.leadPipeline.count({
      where: {
        stage: {
          name: "Won"
        }
      }
    })

    // Get lost leads
    const lostLeads = await prisma.leadPipeline.count({
      where: {
        stage: {
          name: "Lost"
        }
      }
    })

    return NextResponse.json({
      totalBusinesses,
      newLeads,
      contactedLeads,
      interestedLeads,
      wonLeads,
      lostLeads,
    })
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}