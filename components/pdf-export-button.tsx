"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { generatePDF, formatForPrint } from "../utils/pdf-utils"

interface PDFExportButtonProps {
  elementId: string
  filename?: string
  className?: string
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  elementId,
  filename = "candidate-profile.pdf",
  className = "",
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const handleExport = async () => {
    try {
      setIsGenerating(true)
      formatForPrint()
      await generatePDF(elementId, filename)
    } catch (error) {
      console.error("Failed to export PDF:", error)
      alert("PDF export failed. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      ref={buttonRef}
      onClick={handleExport}
      disabled={isGenerating}
      className={`fixed bottom-6 right-6 shadow-lg z-50 bg-[#282550] hover:bg-[#1a1a38] text-white ${className}`}
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          PDF wird erstellt...
        </>
      ) : (
        <>
          <Download className="mr-2 h-5 w-5" />
          Als PDF exportieren
        </>
      )}
    </Button>
  )
}

export default PDFExportButton
