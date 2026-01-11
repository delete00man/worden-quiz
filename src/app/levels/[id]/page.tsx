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

    // New preferences states
    const [isRandom, setIsRandom] = useState(false)
    const [reviewOnlyUnknown, setReviewOnlyUnknown] = useState(false)
    const [displayCards, setDisplayCards] = useState<FlashcardData[]>([])

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

                    // Initial setup of display cards
                    setDisplayCards(levelData.flashcards)
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        }
    }, [status, levelId])

    // Update display cards when preferences change
    useEffect(() => {
        if (!level) return

        let cards = [...level.flashcards]

        if (reviewOnlyUnknown) {
            cards = cards.filter(card => !progress[card.id])
        }

        if (isRandom) {
            cards = cards.sort(() => Math.random() - 0.5)
        } else {
            // Sort by ID or original order if available to keep stable when disabling random
            // If no order in Data, they are usually in DB order
        }

        setDisplayCards(cards)
        setCurrentIndex(0)
        setCompleted(false)
        setIsFlipped(false)
    }, [isRandom, reviewOnlyUnknown, level, progress])

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
            if (displayCards.length === 0) return

            const currentCard = displayCards[currentIndex]
            await saveProgress(currentCard.id, known)

            if (currentIndex < displayCards.length - 1) {
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
        [displayCards, currentIndex, saveProgress]
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
    const sessionTotal = displayCards.length

    if (completed || sessionTotal === 0) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center max-w-sm w-full bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-700/50 shadow-2xl">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold mb-2">
                        {sessionTotal === 0 && reviewOnlyUnknown ? "Tout est maîtrisé !" : "Lot terminé !"}
                    </h2>
                    <p className="text-gray-400 mb-6">
                        {sessionTotal === 0 && reviewOnlyUnknown
                            ? "Tu connais déjà toutes les cartes de ce niveau."
                            : `Tu as vu ${sessionTotal} cartes.`}
                        <br />
                        Global: {knownCount} / {totalCards} connus
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                // Force refresh display cards
                                if (reviewOnlyUnknown) {
                                    setReviewOnlyUnknown(false)
                                } else {
                                    setIsRandom(prev => !prev) // Toggle trigger
                                    setIsRandom(prev => !prev)
                                }
                                setCurrentIndex(0)
                                setIsFlipped(false)
                                setCompleted(false)
                            }}
                            className="w-full py-4 bg-indigo-500 rounded-2xl font-semibold hover:bg-indigo-600 transition active:scale-95 shadow-lg shadow-indigo-900/20"
                        >
                            Recommencer
                        </button>
                        {reviewOnlyUnknown && sessionTotal === 0 && (
                            <button
                                onClick={() => setReviewOnlyUnknown(false)}
                                className="w-full py-4 bg-gray-700 rounded-2xl font-semibold hover:bg-gray-600 transition active:scale-95"
                            >
                                Revoir tout le niveau
                            </button>
                        )}
                        <Link
                            href="/levels"
                            className="w-full py-4 bg-gray-800/50 border border-gray-700/50 rounded-2xl font-semibold hover:bg-gray-700 transition active:scale-95 text-gray-300"
                        >
                            Retour aux niveaux
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    const currentCard = displayCards[currentIndex]

    return (
        <main className="min-h-screen flex flex-col p-4">
            <header className="flex justify-between items-center mb-4 max-w-md mx-auto w-full">
                <Link href="/levels" className="text-gray-400 hover:text-white transition w-8">
                    ✕
                </Link>
                <div className="text-center flex-1">
                    <h1 className="font-semibold text-sm truncate px-4">{level.name}</h1>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                        {currentIndex + 1} / {sessionTotal}
                    </p>
                </div>

                {/* Preferences Menu */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsRandom(!isRandom)}
                        className={`p-2 rounded-lg transition-colors ${isRandom ? "bg-indigo-500/20 text-indigo-400" : "text-gray-500 hover:text-gray-300"}`}
                        title="Mode Aléatoire"
                    >
                        🔀
                    </button>
                    <button
                        onClick={() => setReviewOnlyUnknown(!reviewOnlyUnknown)}
                        className={`p-2 rounded-lg transition-colors ${reviewOnlyUnknown ? "bg-orange-500/20 text-orange-400" : "text-gray-500 hover:text-gray-300"}`}
                        title="Inconnues seulement"
                    >
                        🎯
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm("Voulez-vous vraiment oublier vos progrès pour ce niveau ?")) {
                                await fetch(`/api/levels/${levelId}/reset`, { method: "POST" })
                                setProgress({})
                                setReviewOnlyUnknown(false)
                                setCurrentIndex(0)
                                setCompleted(false)
                            }
                        }}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                        title="Réinitialiser la progression"
                    >
                        🗑️
                    </button>
                </div>
            </header>

            {/* Progress bar */}
            <div className="max-w-md mx-auto w-full mb-8">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / sessionTotal) * 100}%` }}
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
