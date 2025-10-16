import { NextResponse } from "next/server"
import { PDFDocument, rgb } from "pdf-lib"

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
    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || (typeof puppeteer.executablePath === 'function' ? await puppeteer.executablePath() : undefined)
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

      // Viewport auf volle (begrenzte) Höhe setzen, damit eine einzelne lange Seite erzeugt werden kann
      const usedHeight = Math.min(fullHeight, 30_000)
      await page.setViewport({ width: targetWidth, height: usedHeight })
      // Hinweis: Puppeteer limitiert Seitenhöhe (~30k px). Wir matchen die PDF-Höhe exakt auf den verwendeten Viewport.

      let buffer: Buffer
      try {
        const pdfBuffer: Uint8Array = await page.pdf({
          printBackground: true,
          width: `${targetWidth}px`,
          height: `${usedHeight}px`,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          preferCSSPageSize: true,
          pageRanges: "1",
          displayHeaderFooter: false,
          landscape: false,
        })
        buffer = Buffer.from(pdfBuffer)
      } catch (e) {
        // Fallback: PNG Screenshot -> PDF einbetten
        const png = await page.screenshot({ type: 'png', fullPage: true }) as Buffer
        const pdfDoc = await PDFDocument.create()
        const page1 = pdfDoc.addPage([targetWidth, fullHeight])
        const pngEmbed = await pdfDoc.embedPng(png)
        page1.drawRectangle({ x: 0, y: 0, width: targetWidth, height: fullHeight, color: rgb(1,1,1) })
        page1.drawImage(pngEmbed, { x: 0, y: 0, width: targetWidth, height: fullHeight })
        const out = await pdfDoc.save()
        buffer = Buffer.from(out)
      }

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(buffer))
          controller.close()
        }
      })
      return new NextResponse(stream as unknown as BodyInit, {
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


