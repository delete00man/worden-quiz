import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getAuth()

        if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const levels = await prisma.level.findMany({
            include: {
                _count: {
                    select: { flashcards: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json(levels)
    } catch (error) {
        console.error("Get admin levels error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des niveaux" },
            { status: 500 }
        )
    }
}
