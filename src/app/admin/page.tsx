"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Level {
    id: string
    name: string
    description: string | null
    published: boolean
    _count: {
        flashcards: number
    }
}

export default function AdminPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [levels, setLevels] = useState<Level[]>([])
    const [loading, setLoading] = useState(true)
    const [newLevelName, setNewLevelName] = useState("")
    const [newLevelDesc, setNewLevelDesc] = useState("")
    const [creating, setCreating] = useState(false)

    const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth")
        } else if (status === "authenticated" && !isAdmin) {
            router.push("/levels")
        }
    }, [status, isAdmin, router])

    const fetchLevels = async () => {
        const res = await fetch("/api/levels/admin")
        if (res.ok) {
            setLevels(await res.json())
        }
        setLoading(false)
    }

    useEffect(() => {
        if (status === "authenticated" && isAdmin) {
            fetchLevels()
        }
    }, [status, isAdmin])

    const createLevel = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newLevelName.trim()) return

        setCreating(true)
        const res = await fetch("/api/levels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newLevelName, description: newLevelDesc })
        })

        if (res.ok) {
            const level = await res.json()
            router.push(`/admin/levels/${level.id}`)
        }
        setCreating(false)
    }

    const togglePublish = async (levelId: string, published: boolean) => {
        await fetch(`/api/levels/${levelId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ published: !published })
        })
        fetchLevels()
    }

    const deleteLevel = async (levelId: string) => {
        if (!confirm("Supprimer ce niveau ?")) return
        await fetch(`/api/levels/${levelId}`, { method: "DELETE" })
        fetchLevels()
    }

    if (status === "loading" || loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Chargement...</div>
            </main>
        )
    }

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-purple-400">Admin</h1>
                        <Link href="/levels" className="text-gray-400 hover:text-white text-sm">
                            ← Retour aux niveaux
                        </Link>
                    </div>
                </header>

                {/* Create level form */}
                <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Créer un niveau</h2>
                    <form onSubmit={createLevel} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={newLevelName}
                                onChange={(e) => setNewLevelName(e.target.value)}
                                placeholder="Nom du niveau (ex: Chapitre 1)"
                                className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={newLevelDesc}
                                onChange={(e) => setNewLevelDesc(e.target.value)}
                                placeholder="Description (optionnel)"
                                className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-6 py-3 bg-purple-500 rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
                        >
                            {creating ? "Création..." : "Créer le niveau"}
                        </button>
                    </form>
                </div>

                {/* Levels list */}
                <h2 className="text-xl font-semibold mb-4">Niveaux existants</h2>
                {levels.length === 0 ? (
                    <p className="text-gray-400">Aucun niveau créé</p>
                ) : (
                    <div className="space-y-4">
                        {levels.map((level) => (
                            <div
                                key={level.id}
                                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl"
                            >
                                <div>
                                    <h3 className="font-semibold">{level.name}</h3>
                                    <p className="text-sm text-gray-400">
                                        {level._count.flashcards} cartes •{" "}
                                        {level.published ? (
                                            <span className="text-green-400">Publié</span>
                                        ) : (
                                            <span className="text-yellow-400">Brouillon</span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/admin/levels/${level.id}`}
                                        className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm"
                                    >
                                        Éditer
                                    </Link>
                                    <button
                                        onClick={() => togglePublish(level.id, level.published)}
                                        className={`px-3 py-2 rounded-lg transition text-sm ${level.published
                                                ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                                : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                            }`}
                                    >
                                        {level.published ? "Dépublier" : "Publier"}
                                    </button>
                                    <button
                                        onClick={() => deleteLevel(level.id)}
                                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition text-sm"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
