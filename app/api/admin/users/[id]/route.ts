import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from '@prisma/client'
import bcrypt from "bcryptjs"

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, role, password } = body

    const updateData: Prisma.UserUpdateInput = {
      name,
      email,
      role: role === "ADMIN" ? "ADMIN" : "SALES_USER",
    }

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("PUT /api/admin/users/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}