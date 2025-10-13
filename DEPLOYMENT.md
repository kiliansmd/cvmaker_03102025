# 🚀 Railway Deployment Guide

## Schritt-für-Schritt Anleitung

### 1. Vorbereitung

**Repository vorbereiten:**
```bash
git init
git add .
git commit -m "Initial commit: Kandidatenprofil Generator"
```

**GitHub Repository erstellen:**
- Gehe zu github.com
- Erstelle neues Repository
- Push Code:
```bash
git remote add origin https://github.com/username/candidate-profile-generator.git
git branch -M main
git push -u origin main
```

### 2. Railway Setup

**Account erstellen:**
1. Gehe zu [railway.app](https://railway.app)
2. Melde dich mit GitHub an
3. Autorisiere Railway für dein Repository

**Neues Projekt erstellen:**
1. Klicke auf "New Project"
2. Wähle "Deploy from GitHub repo"
3. Wähle dein Repository aus
4. Railway erkennt automatisch Next.js

### 3. Environment Variables konfigurieren

**In Railway Dashboard:**
1. Gehe zu deinem Projekt
2. Klicke auf "Variables"
3. Füge hinzu:

```
OPENAI_API_KEY=sk-proj-...your-key...
NODE_ENV=production
```

**OpenAI API Key erhalten:**
- Gehe zu [platform.openai.com](https://platform.openai.com)
- Navigiere zu API Keys
- Erstelle neuen Secret Key
- Kopiere und füge in Railway ein

### 4. Deploy Konfiguration

**Automatische Erkennung (robust):**
Railway Settings:
- ✅ Node.js 18.x
- ✅ Build: `pnpm run build`
- ✅ Start: `pnpm start` (Standalone)
- ✅ Healthcheck: `/api/health`

**Build-Prozess:**
1. Dependencies installieren (~1-2 Min)
2. Next.js Build (~2-3 Min)
3. Production Server starten (~30 Sek)

**Gesamtdauer: ~3-5 Minuten**

### Stabilität & Best Practices

- DOCX‑first (mammoth), PDF via pdfjs‑dist (Uint8Array, kein Worker)
- OpenAI JSON‑Mode statt strict Schema
- Keine React‑Komponenten in Serverdaten (Icons → `null`)
- `next.config.mjs` mit `output: 'standalone'` und Aliases `canvas=false`, `encoding=false`

### 5. Domain Setup

**Custom Domain (optional):**
1. Gehe zu "Settings" → "Domains"
2. Klicke "Generate Domain" (kostenlose .railway.app Domain)
3. Oder füge eigene Domain hinzu

**Railway Domain Format:**
```
your-project-name-production.up.railway.app
```

### 6. Deployment Verifizierung

**Nach erfolgreichem Deploy prüfen:**

✅ **Build Logs:**
```
Building...
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

✅ **Deploy Logs:**
```
Starting server...
ready - started server on 0.0.0.0:$PORT
```

✅ **Funktionstest:**
- [ ] App öffnet sich
- [ ] Upload-Formular sichtbar
- [ ] Datei-Upload funktioniert
- [ ] CV-Parsing mit GPT-4 funktioniert
- [ ] Profil-Generierung erfolgreich

### 7. Post-Deployment Setup

**Monitoring:**
```
- Railway bietet automatische Logs
- Prüfe regelmäßig auf Errors
- Überwache API-Usage bei OpenAI
```

**Performance:**
```
- Railway Free: 512MB RAM, $5 Gratis-Credits
- Bei Bedarf upgraden: Pro Plan $20/Monat
```

### 8. Continuous Deployment

**Automatische Deploys:**
- Jeder Push zu `main` triggert neuen Deploy
- Railway rebuildet automatisch
- Zero-Downtime Deployments

**Rollback:**
```
In Railway Dashboard:
- Gehe zu "Deployments"
- Wähle vorherige Version
- Klicke "Redeploy"
```

## 🐛 Troubleshooting

### Build Fehler

**Problem: "Module not found"**
```bash
Lösung: pnpm add <module-name>
git add package.json pnpm-lock.yaml
git commit -m "Add missing dependency"
git push
```

**Problem: "OpenAI API Error"**
```
Lösung: 
1. Prüfe OPENAI_API_KEY in Railway Variables
2. Prüfe API Credits auf platform.openai.com
3. Prüfe Rate Limits
```

**Problem: "PDF Parse Error"**
```
Lösung:
- Nutze DOCX statt PDF
- Oder upgrade Railway Plan für mehr Memory
```

### Runtime Fehler

**Problem: "Out of Memory"**
```
Railway Free Tier: 512MB RAM
Lösung:
1. Upgrade zu Pro Plan
2. Oder optimiere File-Size Limits
```

**Problem: "Timeout"**
```
Railway Timeout: 5 Minuten
Lösung:
- CV-Processing sollte <30 Sekunden dauern
- Prüfe OpenAI Response Times
```

## 📊 Monitoring

**Railway Dashboard:**
- CPU Usage
- Memory Usage
- Build Times
- Deployment History

**OpenAI Dashboard:**
- API Usage
- Token Consumption
- Rate Limits
- Costs

## 💰 Kosten-Übersicht

### Railway
- **Free Tier**: $5 Gratis-Credits/Monat
- **Pro Plan**: $20/Monat (mehr Resources)

### OpenAI
- **GPT-4o**: ~$0.01-0.03 pro CV-Analyse
- **Empfehlung**: Prepaid $10-20/Monat für Testing

## ✅ Deployment Checkliste

- [ ] Code auf GitHub gepusht
- [ ] Railway Projekt erstellt
- [ ] Environment Variables gesetzt
- [ ] Erster Deploy erfolgreich
- [ ] Domain konfiguriert
- [ ] Funktionstest durchgeführt
- [ ] OpenAI Credits aufgeladen
- [ ] Monitoring aktiv

## 🎉 Erfolg!

Deine App ist jetzt live unter:
```
https://your-project-name-production.up.railway.app
```

## 📞 Support

**Railway Support:**
- Discord: discord.gg/railway
- Docs: docs.railway.app

**OpenAI Support:**
- Help: help.openai.com
- Status: status.openai.com

---

**Happy Deploying! 🚀**
