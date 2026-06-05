import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WebsiteStatus } from "@prisma/client"
import type { Prisma } from "@prisma/client"

// GET /api/businesses - Fetch all businesses
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const country = searchParams.get("country") || ""
    const city = searchParams.get("city") || ""
    const category = searchParams.get("category") || ""
    const websiteStatus = searchParams.get("websiteStatus") || ""

    // Build filter conditions
    const where: Prisma.BusinessWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { website: { contains: search, mode: "insensitive" } },
      ]
    }

    if (country) where.country = { contains: country, mode: "insensitive" }
    if (city) where.city = { contains: city, mode: "insensitive" }
    if (category) where.category = { contains: category, mode: "insensitive" }
    const parsedWebsiteStatus =
      websiteStatus &&
      Object.values(WebsiteStatus).includes(websiteStatus as WebsiteStatus)
        ? (websiteStatus as WebsiteStatus)
        : undefined

    if (parsedWebsiteStatus) {
      where.websiteStatus = { equals: parsedWebsiteStatus }
    }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        pipelineLead: {
          include: { stage: true }
        }
      }
    })

    return NextResponse.json(businesses)
  } catch (error) {
    console.error("GET /api/businesses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/businesses - Create a new business
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      category,
      website,
      email,
      phone,
      country,
      state,
      city,
      address,
      websiteStatus,
      notes,
    } = body

    // Validation
    if (!name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 })
    }

    // Create business
    const business = await prisma.business.create({
      data: {
        name,
        category,
        website,
        email,
        phone,
        country,
        state,
        city,
        address,
        websiteStatus: websiteStatus || "UNKNOWN",
      },
    })

    // Get the "New" stage ID
    const newStage = await prisma.pipelineStage.findFirst({
      where: { name: "New" }
    })

    // Create pipeline entry for this business
    if (newStage) {
      await prisma.leadPipeline.create({
        data: {
          businessId: business.id,
          stageId: newStage.id,
        },
      })
    }

    // Add initial note if provided
    if (notes && session.user?.id) {
      await prisma.note.create({
        data: {
          content: notes,
          businessId: business.id,
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error("POST /api/businesses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}