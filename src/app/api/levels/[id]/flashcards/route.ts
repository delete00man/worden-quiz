import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/lib/auth"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuth()

        if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { id: levelId } = await params
        const { flashcards } = await request.json()

        if (!Array.isArray(flashcards)) {
            return NextResponse.json(
                { error: "Format invalide" },
                { status: 400 }
            )
        }

        const created = await prisma.flashcard.createMany({
            data: flashcards.map((fc: { front: string; back: string }, index: number) => ({
                front: fc.front,
                back: fc.back,
                levelId,
                order: index
            }))
        })

        return NextResponse.json({ count: created.count })
    } catch (error) {
        console.error("Create flashcards error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la création des flashcards" },
            { status: 500 }
        )
    }
}
