"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Level {
    id: string
    name: string
    description: string | null
    _count: {
        flashcards: number
    }
}

export default function LevelsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [levels, setLevels] = useState<Level[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth")
        }
    }, [status, router])

    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/levels")
                .then((res) => res.json())
                .then((data) => {
                    setLevels(data)
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        }
    }, [status])

    if (status === "loading" || loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Chargement...</div>
            </main>
        )
    }

    const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            WORDEN QUIZ
                        </h1>
                        <p className="text-gray-400">Salut {session?.user?.name} 👋</p>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition"
                            >
                                Admin
                            </Link>
                        )}
                        <button
                            onClick={() => signOut()}
                            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                        >
                            Déconnexion
                        </button>
                    </div>
                </header>

                <h2 className="text-xl font-semibold mb-4">Choisis un niveau</h2>

                {levels.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-lg mb-2">Aucun niveau disponible</p>
                        <p className="text-sm">
                            {isAdmin
                                ? "Va dans l'admin pour créer ton premier niveau !"
                                : "L'admin n'a pas encore créé de niveaux."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {levels.map((level) => (
                            <Link
                                key={level.id}
                                href={`/levels/${level.id}`}
                                className="group p-6 bg-gray-800/50 backdrop-blur rounded-2xl hover:bg-gray-800 transition border border-gray-700/50 hover:border-indigo-500/50"
                            >
                                <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-400 transition">
                                    {level.name}
                                </h3>
                                {level.description && (
                                    <p className="text-gray-400 text-sm mb-3">{level.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>📚 {level._count.flashcards} cartes</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Disclaimer */}
                <p className="mt-12 text-center text-xs text-gray-600">
                    ⚠️ Cette application est un outil d&apos;entraînement. Certains mots peuvent manquer ou contenir des erreurs.
                    Elle ne remplace pas une préparation complète à l&apos;examen.
                </p>
            </div>
        </main>
    )
}
