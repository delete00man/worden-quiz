import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/lib/auth"

export async function GET() {
    try {
        const levels = await prisma.level.findMany({
            where: { published: true },
            include: {
                _count: {
                    select: { flashcards: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json(levels)
    } catch (error) {
        console.error("Get levels error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des niveaux" },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuth()

        if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { name, description } = await request.json()

        if (!name) {
            return NextResponse.json(
                { error: "Le nom est requis" },
                { status: 400 }
            )
        }

        const level = await prisma.level.create({
            data: { name, description }
        })

        return NextResponse.json(level)
    } catch (error) {
        console.error("Create level error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la création du niveau" },
            { status: 500 }
        )
    }
}
