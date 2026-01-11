"use client"

import { useState, useCallback } from "react"
import { createWorker, Worker } from "tesseract.js"
import * as pdfjsLib from "pdfjs-dist"

// Set worker path for pdf.js
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

interface ParsedCard {
    front: string
    back: string
}

interface PdfOcrUploaderProps {
    levelId: string
    onComplete: (cards: ParsedCard[]) => void
}

export function PdfOcrUploader({ levelId, onComplete }: PdfOcrUploaderProps) {
    const [status, setStatus] = useState<string>("")
    const [progress, setProgress] = useState<number>(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const [extractedText, setExtractedText] = useState<string>("")
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([])
    const [step, setStep] = useState<"upload" | "review" | "done">("upload")

    const processPage = async (
        pdf: pdfjsLib.PDFDocumentProxy,
        pageNum: number,
        worker: Worker,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ): Promise<string> => {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        } as unknown as Parameters<typeof page.render>[0]).promise

        const imageData = canvas.toDataURL("image/png")
        const { data } = await worker.recognize(imageData)
        return data.text
    }

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.name.endsWith(".pdf")) {
            setStatus("Veuillez sélectionner un fichier PDF")
            return
        }

        setIsProcessing(true)
        setProgress(0)
        setStatus("Initialisation de l'OCR...")

        try {
            // Initialize Tesseract worker
            const worker = await createWorker("nld+fra", 1, {
                logger: (m) => {
                    if (m.status === "recognizing text") {
                        // Sub-progress within page
                    }
                }
            })

            setStatus("Chargement du PDF...")

            // Load PDF
            const arrayBuffer = await file.arrayBuffer()
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            const totalPages = pdf.numPages

            setStatus(`PDF chargé: ${totalPages} pages`)

            // Create canvas for rendering
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")!

            let fullText = ""

            // Process each page
            for (let i = 1; i <= totalPages; i++) {
                setStatus(`OCR page ${i}/${totalPages}...`)
                setProgress(Math.round((i / totalPages) * 100))

                const pageText = await processPage(pdf, i, worker, canvas, ctx)
                fullText += pageText + "\n\n"
            }

            await worker.terminate()

            setExtractedText(fullText)
            setStatus("OCR terminé ! Vérifiez le texte extrait.")

            // Auto-parse cards
            const cards = parseTextToCards(fullText)
            setParsedCards(cards)
            setStep("review")
            setProgress(100)

        } catch (error) {
            console.error("OCR error:", error)
            setStatus(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
        } finally {
            setIsProcessing(false)
        }
    }, [])

    const parseTextToCards = (text: string): ParsedCard[] => {
        const lines = text.split("\n").filter(l => l.trim())
        const cards: ParsedCard[] = []

        for (const line of lines) {
            // Try different separators: =, :, -, tab
            const separators = ["=", ":", " - ", "\t"]
            let found = false

            for (const sep of separators) {
                if (line.includes(sep)) {
                    const parts = line.split(sep)
                    if (parts.length >= 2) {
                        const front = parts[0].trim()
                        const back = parts.slice(1).join(sep).trim()

                        // Filter out noise (too short, just numbers, etc.)
                        if (front.length > 1 && back.length > 1 && !/^\d+$/.test(front)) {
                            cards.push({ front, back })
                            found = true
                            break
                        }
                    }
                }
            }

            // If no separator found, skip the line
        }

        return cards
    }

    const handleSaveCards = async () => {
        if (parsedCards.length === 0) return

        setStatus("Sauvegarde des cartes...")
        setIsProcessing(true)

        try {
            // Clear existing flashcards
            await fetch(`/api/levels/${levelId}/flashcards/clear`, { method: "DELETE" })

            // Add new flashcards
            const res = await fetch(`/api/levels/${levelId}/flashcards`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ flashcards: parsedCards })
            })

            if (res.ok) {
                setStatus(`${parsedCards.length} cartes sauvegardées !`)
                setStep("done")
                onComplete(parsedCards)
            } else {
                setStatus("Erreur lors de la sauvegarde")
            }
        } catch (error) {
            setStatus("Erreur réseau")
        } finally {
            setIsProcessing(false)
        }
    }

    const removeCard = (index: number) => {
        setParsedCards(cards => cards.filter((_, i) => i !== index))
    }

    const updateCard = (index: number, field: "front" | "back", value: string) => {
        setParsedCards(cards =>
            cards.map((card, i) =>
                i === index ? { ...card, [field]: value } : card
            )
        )
    }

    return (
        <div className="space-y-6">
            {step === "upload" && (
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={isProcessing}
                        className="hidden"
                        id="pdf-upload"
                    />
                    <label
                        htmlFor="pdf-upload"
                        className={`cursor-pointer block ${isProcessing ? "opacity-50" : ""}`}
                    >
                        <div className="text-4xl mb-4">📄</div>
                        <p className="text-lg font-medium mb-2">
                            {isProcessing ? "Traitement en cours..." : "Glisse ton PDF ici"}
                        </p>
                        <p className="text-sm text-gray-400">
                            ou clique pour sélectionner
                        </p>
                    </label>
                </div>
            )}

            {isProcessing && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>{status}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {step === "review" && !isProcessing && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                            {parsedCards.length} cartes détectées
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setStep("upload")}
                                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                            >
                                Recommencer
                            </button>
                            <button
                                onClick={handleSaveCards}
                                className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500"
                            >
                                Sauvegarder les cartes
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {parsedCards.map((card, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
                                <input
                                    type="text"
                                    value={card.front}
                                    onChange={(e) => updateCard(i, "front", e.target.value)}
                                    className="flex-1 px-3 py-2 bg-gray-700 rounded text-sm"
                                />
                                <span className="text-gray-500">=</span>
                                <input
                                    type="text"
                                    value={card.back}
                                    onChange={(e) => updateCard(i, "back", e.target.value)}
                                    className="flex-1 px-3 py-2 bg-gray-700 rounded text-sm"
                                />
                                <button
                                    onClick={() => removeCard(i)}
                                    className="px-2 py-1 text-red-400 hover:text-red-300"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <details className="text-sm">
                        <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                            Voir le texte brut extrait
                        </summary>
                        <pre className="mt-2 p-4 bg-gray-900 rounded-lg overflow-auto max-h-64 text-xs whitespace-pre-wrap">
                            {extractedText}
                        </pre>
                    </details>
                </div>
            )}

            {step === "done" && (
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">✅</div>
                    <p className="text-lg font-medium">{status}</p>
                </div>
            )}
        </div>
    )
}
