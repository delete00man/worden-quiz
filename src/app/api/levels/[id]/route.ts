import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/lib/auth"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const level = await prisma.level.findUnique({
            where: { id },
            include: {
                flashcards: {
                    orderBy: { order: "asc" }
                }
            }
        })

        if (!level) {
            return NextResponse.json(
                { error: "Niveau non trouvé" },
                { status: 404 }
            )
        }

        return NextResponse.json(level)
    } catch (error) {
        console.error("Get level error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération du niveau" },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuth()

        if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { id } = await params
        const { name, description, published } = await request.json()

        const level = await prisma.level.update({
            where: { id },
            data: { name, description, published }
        })

        return NextResponse.json(level)
    } catch (error) {
        console.error("Update level error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour du niveau" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuth()

        if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { id } = await params

        await prisma.level.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete level error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la suppression du niveau" },
            { status: 500 }
        )
    }
}
