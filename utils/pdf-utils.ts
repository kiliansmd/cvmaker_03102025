/**
 * Hilfsfunktionen für die PDF-Generierung
 */

// Konvertiert Pixel in Punkte (pt) für PDF-Dokumente
export function pxToPt(px: number): number {
  return px * 0.75 // Ungefähre Umrechnung von Pixel zu Punkten
}

// Optimiert Bilder für PDF-Export
export async function optimizeImageForPDF(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Canvas context not available"))
        return
      }

      // Setze die Canvas-Größe auf die Bildgröße
      canvas.width = img.width
      canvas.height = img.height

      // Zeichne das Bild auf den Canvas
      ctx.drawImage(img, 0, 0)

      // Konvertiere zu PNG mit hoher Qualität
      try {
        const optimizedImageUrl = canvas.toDataURL("image/png", 1.0)
        resolve(optimizedImageUrl)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = (error) => {
      reject(error)
    }

    img.src = imageUrl
  })
}

// Fügt Metadaten zum PDF hinzu
export function addPDFMetadata(
  pdf: any,
  metadata: {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
  },
) {
  if (metadata.title) pdf.setProperties({ title: metadata.title })
  if (metadata.author) pdf.setProperties({ author: metadata.author })
  if (metadata.subject) pdf.setProperties({ subject: metadata.subject })
  if (metadata.keywords) pdf.setProperties({ keywords: metadata.keywords })
  if (metadata.creator) pdf.setProperties({ creator: metadata.creator })

  return pdf
}

// PDF utility functions for candidate profile export
export const generatePDF = async (elementId: string, filename: string) => {
  try {
    // This would typically use a library like jsPDF or Puppeteer
    // For now, we'll use the browser's print functionality
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error("Element not found")
    }

    // Open print dialog
    window.print()
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}

export const formatForPrint = () => {
  // Add print-specific styles
  const printStyles = `
    @media print {
      .no-print { display: none !important; }
      .page-break-after { page-break-after: always; }
      .keep-together { page-break-inside: avoid; }
      body { -webkit-print-color-adjust: exact; }
    }
  `

  const styleSheet = document.createElement("style")
  styleSheet.textContent = printStyles
  document.head.appendChild(styleSheet)
}
