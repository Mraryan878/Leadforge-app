import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/businesses/[id] - Fetch single business
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        notes: {
          include: { user: true },
          orderBy: { createdAt: "desc" }
        },
        pipelineLead: {
          include: { stage: true }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error("GET /api/businesses/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/businesses/[id] - Update business
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    } = body

    // Check if business exists
    const existingBusiness = await prisma.business.findUnique({
      where: { id }
    })

    if (!existingBusiness) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id },
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
        websiteStatus,
      },
    })

    return NextResponse.json(updatedBusiness)
  } catch (error) {
    console.error("PUT /api/businesses/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/businesses/[id] - Delete business (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin can delete
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if business exists
    const existingBusiness = await prisma.business.findUnique({
      where: { id }
    })

    if (!existingBusiness) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Delete business (cascade will delete related notes and pipeline)
    await prisma.business.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Business deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/businesses/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}