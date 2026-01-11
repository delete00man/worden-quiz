import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/lib/auth"

export async function GET(request: Request) {
    try {
        const session = await getAuth()

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const url = new URL(request.url)
        const levelId = url.searchParams.get("levelId")

        const userId = (session.user as { id: string }).id

        const where = levelId
            ? { userId, flashcard: { levelId } }
            : { userId }

        const progress = await prisma.progress.findMany({
            where: where as { userId: string; flashcard?: { levelId: string } },
            select: {
                flashcardId: true,
                known: true
            }
        })

        return NextResponse.json(progress)
    } catch (error) {
        console.error("Get progress error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération de la progression" },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuth()

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
        }

        const { flashcardId, known } = await request.json()
        const userId = (session.user as { id: string }).id

        const progress = await prisma.progress.upsert({
            where: {
                userId_flashcardId: { userId, flashcardId }
            },
            update: { known },
            create: { userId, flashcardId, known }
        })

        return NextResponse.json(progress)
    } catch (error) {
        console.error("Update progress error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour de la progression" },
            { status: 500 }
        )
    }
}
