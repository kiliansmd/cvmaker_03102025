"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"

interface SimplePDFExporterProps {
  targetId: string
  filename?: string
}

const SimplePDFExporter: React.FC<SimplePDFExporterProps> = ({ targetId, filename = "document.pdf" }) => {
  const [isGenerating, setIsGenerating] = React.useState(false)

  const generatePDF = async () => {
    try {
      setIsGenerating(true)

      // Dynamisch importieren
      const { jsPDF } = await import("jspdf")
      const { default: html2canvas } = await import("html2canvas")

      const element = document.getElementById(targetId)
      if (!element) {
        console.error("Element nicht gefunden")
        return
      }

      // Scrollposition speichern
      const originalScrollPos = window.scrollY

      // Temporäre Styling-Anpassungen für bessere PDF-Qualität
      const originalStyle = element.style.cssText
      document.body.style.overflow = "hidden"

      // Erstelle ein Canvas vom gesamten Dokument
      const canvas = await html2canvas(element, {
        scale: 2, // Höhere Qualität
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      // Berechne die Dimensionen für das PDF
      const imgWidth = 210 // A4 Breite in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Erstelle das PDF im A4-Format
      const pdf = new jsPDF("p", "mm", "a4")

      // Füge das Bild zum PDF hinzu
      const imgData = canvas.toDataURL("image/png")

      // Berechne die Anzahl der benötigten Seiten
      const pageHeight = 297 // A4 Höhe in mm
      const pagesCount = Math.ceil(imgHeight / pageHeight)

      // Füge jede Seite zum PDF hinzu
      let heightLeft = imgHeight
      let position = 0

      // Erste Seite
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Weitere Seiten, falls nötig
      for (let i = 1; i < pagesCount; i++) {
        position = -pageHeight * i
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      }

      // Styling zurücksetzen
      element.style.cssText = originalStyle
      document.body.style.overflow = ""
      window.scrollTo(0, originalScrollPos)

      // PDF speichern
      pdf.save(filename)
    } catch (error) {
      console.error("Fehler beim PDF-Export:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      className="fixed bottom-6 right-6 shadow-lg z-50 bg-[#282550] hover:bg-[#1a1a38] text-white"
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          PDF wird erstellt...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-5 w-5" />
          Als PDF exportieren
        </>
      )}
    </Button>
  )
}

export default SimplePDFExporter
