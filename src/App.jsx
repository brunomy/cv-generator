import { useEffect, useMemo, useState } from 'react'

function App() {
  const [htmlValue, setHtmlValue] = useState('')
  const [status, setStatus] = useState('Carregando template...')

  const loadTemplate = async () => {
    setStatus('Carregando template...')
    try {
      const response = await fetch('/template.html', { cache: 'no-store' })
      if (!response.ok) throw new Error('template.html não encontrado')
      const text = await response.text()
      if (text.trim().length === 0) throw new Error('template.html vazio')
      setHtmlValue(text.trim() + '\n')
      setStatus('Template carregado')
    } catch (error) {
      setHtmlValue('<!-- Erro ao carregar template.html -->\n')
      setStatus('Falha ao carregar template.html')
    }
  }

  useEffect(() => {
    loadTemplate()
  }, [])

  const normalizeTemplate = (rawHtml) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(
      `<!doctype html><html><head></head><body>${rawHtml}</body></html>`,
      'text/html'
    )

    const headNodes = []
    const styleNodes = doc.querySelectorAll('style, link[rel="stylesheet"]')
    styleNodes.forEach((node) => {
      headNodes.push(node.outerHTML)
      node.remove()
    })

    return {
      head: headNodes.join('\n'),
      body: doc.body.innerHTML,
    }
  }

  const buildPrintHtml = (normalized) => `<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Currículo</title>
    ${normalized.head}
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; }
      body {
        color: #111;
        font-family: Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page {
        width: 210mm;
        height: 297mm;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div class="page">
      ${normalized.body}
    </div>
  </body>
</html>`

  const normalizedTemplate = useMemo(
    () => normalizeTemplate(htmlValue),
    [htmlValue]
  )

  const previewHtml = useMemo(
    () => buildPrintHtml(normalizedTemplate),
    [normalizedTemplate]
  )

  const handleDownload = async () => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.setAttribute('aria-hidden', 'true')
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      iframe.remove()
      return
    }

    const normalized = normalizedTemplate
    doc.open()
    doc.write(buildPrintHtml(normalized))
    doc.close()

    const finalize = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        iframe.remove()
      }, 200)
    }

    if (doc.fonts?.ready) {
      doc.fonts.ready.then(() => setTimeout(finalize, 0))
      return
    }

    iframe.onload = () => setTimeout(finalize, 0)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">CV</div>
          <div>
            <div className="title">Editor A4 em HTML</div>
            <div className="subtitle">Edite o HTML e veja a página A4 ao vivo</div>
          </div>
        </div>
        <div className="actions">
          <button type="button" onClick={loadTemplate}>
            Resetar modelo
          </button>
          <button type="button" className="primary" onClick={handleDownload}>
            Baixar PDF
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel-header">
            <h2>HTML do currículo</h2>
            <div className="small">{status}</div>
          </div>
          <textarea
            id="htmlInput"
            spellCheck="false"
            value={htmlValue}
            onChange={(event) => setHtmlValue(event.target.value)}
          />
        </section>

        <section className="preview">
          <div className="preview-header">
            <div>Pré-visualização A4</div>
            <div className="small">210 × 297 mm</div>
          </div>
          <div className="page-wrap">
            <iframe
              className="page-frame"
              title="Prévia A4"
              srcDoc={previewHtml}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
