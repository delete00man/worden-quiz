import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // params is a Promise in Next.js 15+
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const resolvedParams = await params
        const levelId = resolvedParams.id

        // Delete all progress for this user and level
        // We need to find flashcards for this level first
        const level = await prisma.level.findUnique({
            where: { id: levelId },
            include: { flashcards: { select: { id: true } } }
        })

        if (!level) {
            return NextResponse.json({ error: "Level not found" }, { status: 404 })
        }

        const flashcardIds = level.flashcards.map(f => f.id)

        await prisma.progress.deleteMany({
            where: {
                userId: user.id,
                flashcardId: { in: flashcardIds }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Reset progress error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
