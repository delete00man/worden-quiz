"use client"

import { useSwipeable } from "react-swipeable"
import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react"

export interface SwipeContainerRef {
    swipeLeft: () => void
    swipeRight: () => void
}

interface SwipeContainerProps {
    children: React.ReactNode
    onSwipeLeft: () => void // Unknown (Red)
    onSwipeRight: () => void // Known (Green)
    disabled?: boolean
}

export const SwipeContainer = forwardRef<SwipeContainerRef, SwipeContainerProps>(
    ({ children, onSwipeLeft, onSwipeRight, disabled = false }, ref) => {
        const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
        const [deltaX, setDeltaX] = useState(0)

        // Expose methods to parent
        useImperativeHandle(ref, () => ({
            swipeLeft: () => handleSwipeLeft(),
            swipeRight: () => handleSwipeRight()
        }))

        const handleSwipeLeft = useCallback(() => {
            if (disabled) return
            setSwipeDirection("left")
            setTimeout(() => {
                onSwipeLeft()
                setSwipeDirection(null)
                setDeltaX(0)
            }, 300)
        }, [disabled, onSwipeLeft])

        const handleSwipeRight = useCallback(() => {
            if (disabled) return
            setSwipeDirection("right")
            setTimeout(() => {
                onSwipeRight()
                setSwipeDirection(null)
                setDeltaX(0)
            }, 300)
        }, [disabled, onSwipeRight])

        const handlers = useSwipeable({
            onSwipedLeft: handleSwipeLeft,
            onSwipedRight: handleSwipeRight,
            onSwiping: (e) => setDeltaX(e.deltaX),
            onTouchEndOrOnMouseUp: () => setDeltaX(0),
            trackMouse: true,
            trackTouch: true,
            delta: 50
        })

        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (disabled) return
                if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    handleSwipeLeft()
                } else if (e.key === "ArrowRight") {
                    e.preventDefault()
                    handleSwipeRight()
                }
            }

            window.addEventListener("keydown", handleKeyDown)
            return () => window.removeEventListener("keydown", handleKeyDown)
        }, [disabled, handleSwipeLeft, handleSwipeRight])

        // Calculate rotation and opacity based on drag
        const rotation = deltaX * 0.1
        const xOffset = swipeDirection === "left" ? -1000 : swipeDirection === "right" ? 1000 : deltaX
        const transition = swipeDirection ? "transform 0.3s ease-out" : "none"

        // Opacity for overlays
        const leftOpacity = Math.min(Math.max(-deltaX / 100, 0), 1)
        const rightOpacity = Math.min(Math.max(deltaX / 100, 0), 1)

        // Force full opacity if programmed swipe
        const finalLeftOpacity = swipeDirection === "left" ? 1 : leftOpacity
        const finalRightOpacity = swipeDirection === "right" ? 1 : rightOpacity

        return (
            <div className="relative w-full max-w-md perspective-1000">
                <div
                    {...handlers}
                    className="relative w-full cursor-grab active:cursor-grabbing"
                    style={{
                        transform: `translate3d(${xOffset}px, 0, 0) rotate(${rotation}deg)`,
                        transition
                    }}
                >
                    {children}

                    {/* Overlay: À REVOIR (Swipe Left - Red) */}
                    <div
                        className="absolute top-8 right-8 border-4 border-red-500 rounded-lg p-2 transform rotate-12 pointer-events-none transition-opacity duration-200"
                        style={{ opacity: finalLeftOpacity }}
                    >
                        <span className="text-red-500 font-bold text-2xl uppercase tracking-widest border-red-500">
                            À revoir
                        </span>
                    </div>

                    {/* Overlay: CONNU (Swipe Right - Green) */}
                    <div
                        className="absolute top-8 left-8 border-4 border-green-500 rounded-lg p-2 transform -rotate-12 pointer-events-none transition-opacity duration-200"
                        style={{ opacity: finalRightOpacity }}
                    >
                        <span className="text-green-500 font-bold text-2xl uppercase tracking-widest border-green-500">
                            Connu
                        </span>
                    </div>
                </div>
            </div>
        )
    }
)

SwipeContainer.displayName = "SwipeContainer"
