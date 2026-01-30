import { useEffect, useRef, useState } from 'react'
import html2pdf from 'html2pdf.js'

function App() {
  const [htmlValue, setHtmlValue] = useState('')
  const [status, setStatus] = useState('Carregando template...')
  const pageRef = useRef(null)

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

  const handleDownload = () => {
    if (!pageRef.current) return
    const options = {
      margin: 0,
      filename: 'curriculo.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }

    html2pdf().set(options).from(pageRef.current).save()
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
            <div
              ref={pageRef}
              className="page"
              dangerouslySetInnerHTML={{ __html: htmlValue }}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
