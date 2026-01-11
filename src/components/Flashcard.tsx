"use client"

import { useState } from "react"

interface FlashcardProps {
    front: string
    back: string
    isFlipped?: boolean
    onFlip?: () => void
}

export function Flashcard({ front, back, isFlipped = false, onFlip }: FlashcardProps) {
    const [flipped, setFlipped] = useState(isFlipped)

    const handleFlip = () => {
        setFlipped(!flipped)
        onFlip?.()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            handleFlip()
        }
    }

    return (
        <div
            className="w-full max-w-md h-64 perspective-1000 cursor-pointer select-none"
            onClick={handleFlip}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={flipped ? "Affiche le dos de la carte" : "Affiche le devant de la carte"}
        >
            <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? "rotate-y-180" : ""
                    }`}
            >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center p-6">
                    <p className="text-2xl md:text-3xl font-bold text-white text-center">{front}</p>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl flex items-center justify-center p-6">
                    <p className="text-2xl md:text-3xl font-bold text-white text-center">{back}</p>
                </div>
            </div>
        </div>
    )
}
