import { NextResponse } from "next/server"

// POST /api/render-pdf
// Body: { url?: string; html?: string; width?: number }
// Renders eine einzige lange PDF-Seite (Breite default 1400px), mit Hintergründen, ohne Ränder/Seitenumbrüche

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const { url, html, width } = body || {}

    if ((!url && !html) || (url && html)) {
      return NextResponse.json(
        { error: "Bitte genau eine Quelle angeben: url ODER html." },
        { status: 400 }
      )
    }

    // Lazy import, damit Build ohne puppeteer durchläuft
    let puppeteer: any
    try {
      const mod: any = await import("puppeteer")
      puppeteer = mod?.default ?? mod
    } catch {}
    if (!puppeteer) {
      return NextResponse.json(
        { error: "Puppeteer ist nicht installiert. Bitte `pnpm add puppeteer` ausführen." },
        { status: 500 }
      )
    }

    // Headless Browser starten
    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || (await puppeteer.executablePath?.()) || undefined
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none",
        "--hide-scrollbars",
      ],
      executablePath: execPath,
    })

    try {
      const page = await browser.newPage()
      const targetWidth = Number(width) > 0 ? Number(width) : 1400

      // Basis-Viewport setzen – Höhe wird später dynamisch angepasst
      await page.setViewport({ width: targetWidth, height: 800 })

      if (url) {
        await page.goto(url, { waitUntil: "networkidle0", timeout: 120_000 })
      } else {
        await page.setContent(String(html), { waitUntil: "networkidle0" })
      }

      // CSS injizieren: keine Ränder/Seitenumbrüche, Hintergründe an
      await page.addStyleTag({
        content: `
          @page { size: ${targetWidth}px auto; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; width: ${targetWidth}px !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break, .page-break-before, .page-break-after { break-before: avoid !important; break-after: avoid !important; page-break-before: avoid !important; page-break-after: avoid !important; }
        `,
      })

      // Volle Dokumenthöhe ermitteln
      const fullHeight = await page.evaluate(() => {
        const max = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
          document.body.clientHeight,
          document.documentElement.clientHeight,
        )
        return max
      })

      // Viewport auf volle Höhe setzen, damit eine einzelne lange Seite erzeugt werden kann
      await page.setViewport({ width: targetWidth, height: Math.min(fullHeight, 30_000) })
      // Hinweis: Puppeteer limitiert Seitenhöhe (~ 30k px). Für sehr lange Seiten wird die PDF dennoch fortlaufend ohne Ränder erzeugt.

      const pdfBuffer: Uint8Array = await page.pdf({
        printBackground: true,
        width: `${targetWidth}px`,
        height: `${fullHeight}px`,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true,
        pageRanges: "1",
        displayHeaderFooter: false,
        landscape: false,
      })

      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="render.pdf"`,
          "Cache-Control": "no-store",
        },
      })
    } finally {
      await browser.close().catch(() => {})
    }
  } catch (error: any) {
    console.error("/api/render-pdf error", error)
    return NextResponse.json(
      { error: error?.message || "Unbekannter Fehler beim PDF-Rendering" },
      { status: 500 }
    )
  }
}


