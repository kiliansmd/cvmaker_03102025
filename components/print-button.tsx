"use client"

import type React from "react"
import { Printer } from "lucide-react"

const PrintButton: React.FC = () => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors no-print z-50"
      title="Profil drucken"
    >
      <Printer className="h-6 w-6" />
    </button>
  )
}

export default PrintButton
