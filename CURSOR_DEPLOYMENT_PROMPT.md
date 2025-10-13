# 🚀 Deployment-Anweisungen für Cursor AI

## Projektübersicht
Dies ist ein Next.js 14 Kandidatenprofil-Generator, der CVs mit OpenAI GPT-4 parst und professionelle Profile im getexperts.io Design generiert.

## Aufgabe
Bereite dieses Projekt für das Deployment auf Railway vor. Stelle sicher, dass alle Konfigurationen korrekt sind und erstelle eine vollständige Deployment-Dokumentation.

## Technologie-Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-4 (gpt-4o-2024-08-06)
- **File Processing**: pdf-parse, mammoth
- **Hosting**: Railway

## Erforderliche Environment Variables
\`\`\`env
OPENAI_API_KEY=sk-...
NODE_ENV=production
\`\`\`

## Deployment-Anforderungen für Railway

### 1. Railway-Konfiguration
Erstelle eine `railway.toml` oder nutze die Railway-Defaults:
- Node.js Version: 18.x oder höher
- Build Command: `npm run build`
- Start Command: `npm start`
- Port: Automatisch von Railway zugewiesen ($PORT)

### 2. Package.json Optimierung
Stelle sicher, dass alle Scripts korrekt sind:
\`\`\`json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
\`\`\`

### 3. Next.js Konfiguration
Erstelle/aktualisiere `next.config.mjs`:
\`\`\`javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimiert für Railway
  images: {
    domains: ['blob.v0.app'],
    unoptimized: true // Für Railway
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb' // Für CV-Uploads
    }
  }
}

export default nextConfig
\`\`\`

### 4. Environment Variables Setup
Erstelle eine `.env.example` Datei:
\`\`\`env
# OpenAI API Key (erforderlich)
OPENAI_API_KEY=sk-your-key-here

# Node Environment
NODE_ENV=production
\`\`\`

### 5. .gitignore Anpassungen
Stelle sicher, dass folgende Zeilen in `.gitignore` sind:
\`\`\`
.env
.env.local
.env*.local
.next/
node_modules/
\`\`\`

### 6. Railway Deployment Steps
Erstelle eine `DEPLOYMENT.md` mit folgenden Schritten:

1. **Railway Project erstellen**
   - Gehe zu railway.app
   - Erstelle neues Projekt
   - Wähle "Deploy from GitHub"

2. **Environment Variables setzen**
   - OPENAI_API_KEY hinzufügen
   - NODE_ENV=production setzen

3. **Build & Deploy**
   - Railway erkennt automatisch Next.js
   - Build läuft automatisch
   - App wird deployed

### 7. Troubleshooting
Häufige Probleme und Lösungen:
- **PDF-Parse Fehler**: Nutze DOCX-Dateien (empfohlen)
- **Memory Limits**: Railway Free Tier hat 512MB RAM
- **Build Timeout**: Optimiere Dependencies

### 8. Post-Deployment Checks
Nach dem Deployment prüfen:
- [ ] OpenAI API Key funktioniert
- [ ] File-Upload funktioniert (max 10MB)
- [ ] CV-Parsing mit DOCX-Dateien
- [ ] PDF-Export funktioniert
- [ ] Responsive Design auf Mobile

## Zusätzliche Optimierungen

### Performance
- Füge Caching für OpenAI-Requests hinzu (optional)
- Komprimiere Bilder für schnellere Ladezeiten
- Nutze Next.js Image Optimization

### Security
- Rate Limiting für CV-Uploads implementieren
- File-Type Validation verbessern
- CORS-Headers konfigurieren (falls nötig)

### Monitoring
- Error Logging mit Sentry (optional)
- Analytics mit Vercel Analytics (bereits integriert)

## Finale Checkliste vor Deployment
- [ ] Alle Dependencies installiert
- [ ] Environment Variables dokumentiert
- [ ] Build läuft lokal erfolgreich (`npm run build`)
- [ ] .env.example erstellt
- [ ] DEPLOYMENT.md dokumentiert
- [ ] README.md aktualisiert
- [ ] Railway-Konfiguration erstellt

## Support
Bei Problemen:
1. Prüfe Railway Logs
2. Prüfe Next.js Build Output
3. Teste lokal mit Production Build: `npm run build && npm start`

---

**Wichtig**: Stelle sicher, dass der OpenAI API Key ausreichend Credits hat und die Rate Limits für Production-Nutzung geeignet sind.
