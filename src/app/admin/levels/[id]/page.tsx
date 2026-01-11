"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { PdfOcrUploader } from "@/components/PdfOcrUploader"

interface Flashcard {
    id: string
    front: string
    back: string
}

interface Level {
    id: string
    name: string
    description: string | null
    published: boolean
    flashcards: Flashcard[]
}

export default function EditLevelPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const levelId = params.id as string

    const [level, setLevel] = useState<Level | null>(null)
    const [loading, setLoading] = useState(true)
    const [cards, setCards] = useState<{ front: string; back: string }[]>([])
    const [newFront, setNewFront] = useState("")
    const [newBack, setNewBack] = useState("")
    const [saving, setSaving] = useState(false)
    const [bulkText, setBulkText] = useState("")
    const [showOcr, setShowOcr] = useState(false)

    const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth")
        } else if (status === "authenticated" && !isAdmin) {
            router.push("/levels")
        }
    }, [status, isAdmin, router])

    useEffect(() => {
        if (status === "authenticated" && isAdmin && levelId) {
            fetch(`/api/levels/${levelId}`)
                .then((res) => res.json())
                .then((data) => {
                    setLevel(data)
                    setCards(data.flashcards.map((f: Flashcard) => ({ front: f.front, back: f.back })))
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        }
    }, [status, isAdmin, levelId])

    const addCard = () => {
        if (!newFront.trim() || !newBack.trim()) return
        setCards([...cards, { front: newFront.trim(), back: newBack.trim() }])
        setNewFront("")
        setNewBack("")
    }

    const removeCard = (index: number) => {
        setCards(cards.filter((_, i) => i !== index))
    }

    const parseBulkText = () => {
        // Parse text with format: word = translation or word : translation
        const lines = bulkText.split("\n").filter((l) => l.trim())
        const parsed = lines
            .map((line) => {
                const separators = ["=", ":", "-", "\t"]
                for (const sep of separators) {
                    if (line.includes(sep)) {
                        const [front, ...backParts] = line.split(sep)
                        const back = backParts.join(sep)
                        if (front.trim() && back.trim()) {
                            return { front: front.trim(), back: back.trim() }
                        }
                    }
                }
                return null
            })
            .filter((c) => c !== null) as { front: string; back: string }[]

        if (parsed.length > 0) {
            setCards([...cards, ...parsed])
            setBulkText("")
        }
    }

    const saveCards = async () => {
        setSaving(true)

        // First delete existing flashcards
        await fetch(`/api/levels/${levelId}/flashcards/clear`, { method: "DELETE" })

        // Then add new ones
        await fetch(`/api/levels/${levelId}/flashcards`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ flashcards: cards })
        })

        setSaving(false)
        router.push("/admin")
    }

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
                <p className="text-gray-400">Niveau non trouvé</p>
            </main>
        )
    }

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <Link href="/admin" className="text-gray-400 hover:text-white text-sm">
                        ← Retour à l&apos;admin
                    </Link>
                    <h1 className="text-2xl font-bold mt-2">{level.name}</h1>
                    {level.description && (
                        <p className="text-gray-400">{level.description}</p>
                    )}
                </header>

                {/* PDF OCR Import */}
                <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-2xl p-6 mb-8 border border-purple-500/20">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            📄 Import PDF avec OCR
                        </h2>
                        <button
                            onClick={() => setShowOcr(!showOcr)}
                            className="text-sm text-purple-400 hover:text-purple-300"
                        >
                            {showOcr ? "Masquer" : "Afficher"}
                        </button>
                    </div>
                    {showOcr && (
                        <PdfOcrUploader
                            levelId={levelId}
                            onComplete={(newCards) => {
                                setCards(newCards)
                                setShowOcr(false)
                            }}
                        />
                    )}
                    {!showOcr && (
                        <p className="text-gray-400 text-sm">
                            Importe un PDF de vocabulaire (14 pages max recommandé). L&apos;OCR extraira automatiquement les mots.
                        </p>
                    )}
                </div>

                {/* Bulk add */}
                <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Ajout en masse (texte)</h2>
                    <p className="text-gray-400 text-sm mb-2">
                        Colle ton texte avec format: mot = traduction (ou : ou - ou tab)
                    </p>
                    <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="huis = maison
kat = chat
hond = chien"
                        className="w-full h-32 px-4 py-3 bg-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                    />
                    <button
                        onClick={parseBulkText}
                        className="mt-2 px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition"
                    >
                        Parser et ajouter
                    </button>
                </div>

                {/* Single card add */}
                <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Ajouter une carte</h2>
                    <div className="flex gap-4 flex-wrap">
                        <input
                            type="text"
                            value={newFront}
                            onChange={(e) => setNewFront(e.target.value)}
                            placeholder="Mot (néerlandais)"
                            className="flex-1 min-w-[150px] px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                        <input
                            type="text"
                            value={newBack}
                            onChange={(e) => setNewBack(e.target.value)}
                            placeholder="Traduction (français)"
                            className="flex-1 min-w-[150px] px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            onKeyDown={(e) => e.key === "Enter" && addCard()}
                        />
                        <button
                            onClick={addCard}
                            className="px-4 py-3 bg-gray-600 rounded-lg hover:bg-gray-500 transition"
                        >
                            + Ajouter
                        </button>
                    </div>
                </div>

                {/* Cards list */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">
                        Cartes ({cards.length})
                    </h2>
                    {cards.length === 0 ? (
                        <p className="text-gray-400">Aucune carte</p>
                    ) : (
                        <div className="space-y-2">
                            {cards.map((card, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <span className="font-medium">{card.front}</span>
                                        <span className="text-gray-500 mx-2">=</span>
                                        <span className="text-gray-300">{card.back}</span>
                                    </div>
                                    <button
                                        onClick={() => removeCard(i)}
                                        className="text-red-400 hover:text-red-300 px-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Save button */}
                <div className="flex gap-4">
                    <button
                        onClick={saveCards}
                        disabled={saving || cards.length === 0}
                        className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                    >
                        {saving ? "Sauvegarde..." : "Sauvegarder les cartes"}
                    </button>
                    <Link
                        href="/admin"
                        className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                    >
                        Annuler
                    </Link>
                </div>
            </div>
        </main>
    )
}
