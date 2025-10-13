# 🎯 Kandidatenprofil Generator

Ein automatisierter CV-Parser und Profil-Generator powered by OpenAI GPT-4, der professionelle Kandidatenprofile im getexperts.io Design erstellt.

## ✨ Features

- 📄 **Automatisches CV-Parsing** mit OpenAI GPT-4
- 🤖 **AI-gestützte Extraktion** von Skills, Erfahrung, Ausbildung
- 🎨 **Professionelles Design** im getexperts.io Brand
- 📱 **Responsive** für alle Geräte
- 📥 **PDF-Export** des generierten Profils
- 🔄 **Multiple Dateiformate**: DOCX (empfohlen), PDF, TXT

## 🚀 Quick Start

### Voraussetzungen
- Node.js 18+ 
- OpenAI API Key

### Installation

1. **Repository klonen/herunterladen**
   \`\`\`bash
   # Projekt-Ordner öffnen
   cd candidate-profile-generator
   \`\`\`

2. **Dependencies installieren**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Variables setzen**
   \`\`\`bash
   # Erstelle .env.local Datei
   echo "OPENAI_API_KEY=sk-your-key-here" > .env.local
   \`\`\`

4. **Development Server starten**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Öffne im Browser**
   \`\`\`
   http://localhost:3000
   \`\`\`

## 🌐 Deployment auf Railway

### Schnellstart

1. **Railway Account erstellen**
   - Gehe zu [railway.app](https://railway.app)
   - Melde dich mit GitHub an

2. **Projekt deployen**
   \`\`\`bash
   # Push zu GitHub (falls noch nicht geschehen)
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   \`\`\`

3. **In Railway**
   - New Project → Deploy from GitHub
   - Repository auswählen
   - Environment Variables hinzufügen:
     - `OPENAI_API_KEY`: Dein OpenAI API Key
     - `NODE_ENV`: `production`

4. **Deploy starten**
   - Railway erkennt automatisch Next.js
   - Build & Deploy läuft automatisch
   - Nach ~2-3 Minuten ist die App live

### Railway Settings

**Build Command**: `npm run build`  
**Start Command**: `npm start`  
**Node Version**: 18.x oder höher

## 📋 Verwendung

1. **CV hochladen**
   - Unterstützte Formate: DOCX (empfohlen), PDF, TXT
   - Max. Größe: 10MB

2. **Kandidaten-Informationen eingeben**
   - Name, Position, Standort (Pflichtfelder)
   - Gehaltsvorstellung, Verfügbarkeit
   - Kontaktperson-Details

3. **Zusätzliche Informationen** (optional)
   - Besondere Qualifikationen
   - Projekt-Schwerpunkte
   - Kontext für AI

4. **Profil generieren**
   - AI analysiert den CV
   - Generiert professionelles Profil
   - Export als PDF möglich

## 🛠️ Technologie-Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **AI**: OpenAI GPT-4o
- **File Processing**: pdf-parse, mammoth
- **PDF Export**: jsPDF, html2canvas

## 📁 Projekt-Struktur

\`\`\`
├── app/
│   ├── actions/          # Server Actions (CV-Processing)
│   ├── page.tsx          # Upload-Formular
│   ├── layout.tsx        # Root Layout
│   └── globals.css       # Global Styles
├── components/
│   ├── ui/               # shadcn/ui Components
│   └── candidate-profile-display.tsx
├── lib/
│   ├── cv-parser.ts      # OpenAI CV-Parsing
│   ├── file-extractor.ts # Datei-Text-Extraktion
│   └── profile-generator.ts # Profil-Generierung
├── public/               # Statische Assets
└── utils/                # Hilfsfunktionen
\`\`\`

## 🔧 Konfiguration

### OpenAI API
- Modell: `gpt-4o-2024-08-06`
- Structured Output für präzises Parsing
- Temperature: 0.1 (hohe Präzision)

### Datei-Verarbeitung
- **DOCX**: Mammoth (empfohlen)
- **PDF**: pdf-parse (mit Fallback)
- **TXT**: Direktes Lesen

## 🐛 Troubleshooting

### PDF-Parsing Fehler
- **Problem**: `ENOENT: no such file or directory`
- **Lösung**: Nutze DOCX-Dateien (zuverlässiger)

### OpenAI Rate Limits
- **Problem**: Zu viele Requests
- **Lösung**: Prüfe API-Limits, upgrade Plan

### Memory Issues
- **Problem**: Railway Out of Memory
- **Lösung**: Upgrade Railway Plan oder optimiere Dateigröße

## 📝 Environment Variables

| Variable | Beschreibung | Erforderlich |
|----------|--------------|--------------|
| `OPENAI_API_KEY` | OpenAI API Key | ✅ Ja |
| `NODE_ENV` | Environment (production) | Empfohlen |

## 🔐 Security

- File-Type Validation
- File-Size Limits (10MB)
- Server-Side Processing
- No Client-Side API Keys

## 📄 Lizenz

Proprietär - getexperts.io

## 🤝 Support

Bei Fragen oder Problemen:
- Check Railway Logs
- Prüfe OpenAI API Status
- Teste lokal mit Production Build

---

**Entwickelt für getexperts.io** | Powered by OpenAI GPT-4
