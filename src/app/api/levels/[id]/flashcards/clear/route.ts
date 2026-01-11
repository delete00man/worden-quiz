import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/lib/auth"

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuth()

        if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { id: levelId } = await params

        await prisma.flashcard.deleteMany({
            where: { levelId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Clear flashcards error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la suppression des flashcards" },
            { status: 500 }
        )
    }
}
