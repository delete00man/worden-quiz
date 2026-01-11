"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { Flashcard } from "@/components/Flashcard"
import { SwipeContainer, SwipeContainerRef } from "@/components/SwipeContainer"

interface FlashcardData {
    id: string
    front: string
    back: string
}

interface Level {
    id: string
    name: string
    flashcards: FlashcardData[]
}

interface Progress {
    flashcardId: string
    known: boolean
}

export default function LevelPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const levelId = params.id as string
    const swipeRef = useRef<SwipeContainerRef>(null)

    const [level, setLevel] = useState<Level | null>(null)
    const [progress, setProgress] = useState<Record<string, boolean>>({})
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [loading, setLoading] = useState(true)
    const [completed, setCompleted] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth")
        }
    }, [status, router])

    useEffect(() => {
        if (status === "authenticated" && levelId) {
            Promise.all([
                fetch(`/api/levels/${levelId}`).then((res) => res.json()),
                fetch(`/api/progress?levelId=${levelId}`).then((res) => res.json())
            ])
                .then(([levelData, progressData]) => {
                    setLevel(levelData)
                    const progressMap: Record<string, boolean> = {}
                    progressData.forEach((p: Progress) => {
                        progressMap[p.flashcardId] = p.known
                    })
                    setProgress(progressMap)
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        }
    }, [status, levelId])

    const saveProgress = useCallback(
        async (flashcardId: string, known: boolean) => {
            setProgress((prev) => ({ ...prev, [flashcardId]: known }))
            await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ flashcardId, known })
            })
        },
        []
    )

    const handleCardResult = useCallback(
        async (known: boolean) => {
            if (!level) return

            const currentCard = level.flashcards[currentIndex]
            await saveProgress(currentCard.id, known)

            if (currentIndex < level.flashcards.length - 1) {
                setTimeout(() => {
                    setCurrentIndex((prev) => prev + 1)
                    setIsFlipped(false)
                }, 300) // Wait for swipe anim
            } else {
                setTimeout(() => {
                    setCompleted(true)
                }, 300)
            }
        },
        [level, currentIndex, saveProgress]
    )

    if (status === "loading" || loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Chargement...</div>
            </main>
        )
    }

    if (!level) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">Niveau non trouvé</p>
                    <Link href="/levels" className="text-indigo-400 hover:underline">
                        ← Retour aux niveaux
                    </Link>
                </div>
            </main>
        )
    }

    const knownCount = Object.values(progress).filter(Boolean).length
    const totalCards = level.flashcards.length

    if (completed) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold mb-2">Niveau terminé !</h2>
                    <p className="text-gray-400 mb-6">
                        Tu connais {knownCount} / {totalCards} mots
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setCurrentIndex(0)
                                setIsFlipped(false)
                                setCompleted(false)
                            }}
                            className="px-6 py-3 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition"
                        >
                            Recommencer
                        </button>
                        <Link
                            href="/levels"
                            className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                        >
                            Autres niveaux
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    const currentCard = level.flashcards[currentIndex]

    return (
        <main className="min-h-screen flex flex-col p-4">
            <header className="flex justify-between items-center mb-4 max-w-md mx-auto w-full">
                <Link href="/levels" className="text-gray-400 hover:text-white transition">
                    ✕
                </Link>
                <div className="text-center">
                    <h1 className="font-semibold">{level.name}</h1>
                    <p className="text-sm text-gray-400">
                        {currentIndex + 1} / {totalCards}
                    </p>
                </div>
                <div className="text-sm text-gray-400 w-8">
                    {/* Spacer */}
                </div>
            </header>

            {/* Progress bar */}
            <div className="max-w-md mx-auto w-full mb-8">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
                <SwipeContainer
                    ref={swipeRef}
                    onSwipeLeft={() => handleCardResult(false)} // Unknown = Left
                    onSwipeRight={() => handleCardResult(true)} // Known = Right
                >
                    <Flashcard
                        front={currentCard.front}
                        back={currentCard.back}
                        isFlipped={isFlipped}
                        onFlip={() => setIsFlipped(!isFlipped)}
                    />
                </SwipeContainer>

                <p className="mt-8 text-sm text-gray-500 animate-pulse">
                    Tap pour retourner
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-8 mt-8">
                    <button
                        onClick={() => swipeRef.current?.swipeLeft()}
                        className="w-16 h-16 rounded-full bg-gray-800 border-2 border-red-500/50 text-red-500 text-2xl flex items-center justify-center hover:bg-red-500/10 hover:scale-110 transition active:scale-95 shadow-lg shadow-red-900/10"
                        aria-label="Je ne sais pas"
                    >
                        ✕
                    </button>

                    <button
                        onClick={() => swipeRef.current?.swipeRight()}
                        className="w-16 h-16 rounded-full bg-gray-800 border-2 border-green-500/50 text-green-500 text-2xl flex items-center justify-center hover:bg-green-500/10 hover:scale-110 transition active:scale-95 shadow-lg shadow-green-900/10"
                        aria-label="Je sais"
                    >
                        ✓
                    </button>
                </div>

                <div className="flex justify-between w-full max-w-xs mt-4 text-xs text-gray-500 font-medium">
                    <span>À revoir</span>
                    <span>Connu</span>
                </div>
            </div>
        </main>
    )
}
