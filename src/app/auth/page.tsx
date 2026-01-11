"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            if (isLogin) {
                const result = await signIn("credentials", {
                    email,
                    password,
                    redirect: false
                })

                if (result?.error) {
                    setError("Email ou mot de passe incorrect")
                } else {
                    router.push("/levels")
                }
            } else {
                const res = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password })
                })

                const data = await res.json()

                if (!res.ok) {
                    setError(data.error || "Erreur lors de l'inscription")
                } else {
                    // Auto login after registration
                    await signIn("credentials", {
                        email,
                        password,
                        redirect: false
                    })
                    router.push("/levels")
                }
            }
        } catch {
            setError("Une erreur est survenue")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        WORDEN QUIZ
                    </h1>
                    <p className="text-gray-400">Apprends le vocabulaire néerlandais</p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 shadow-xl">
                    <div className="flex mb-6">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 text-center rounded-l-lg transition ${isLogin
                                    ? "bg-indigo-500 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }`}
                        >
                            Connexion
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 text-center rounded-r-lg transition ${!isLogin
                                    ? "bg-indigo-500 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }`}
                        >
                            Inscription
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Nom</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                    className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    placeholder="Ton prénom"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                placeholder="ton@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                            {loading
                                ? "Chargement..."
                                : isLogin
                                    ? "Se connecter"
                                    : "S'inscrire"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    )
}
