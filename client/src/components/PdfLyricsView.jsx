import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { loadPdfDocument } from '../lib/pdfjs.js';
import { pdfUrl } from '../lib/api.js';

const PAGE_GAP = 24;
const STEP_RATIO = 0.85; // frazione di uno "schermo" avanzata ad ogni pressione, con un po' di sovrapposizione per contesto

/**
 * Mostra le pagine originali del PDF (accordi inclusi) impilate in un
 * contenitore scorrevole, a schermo intero e in negativo (sfondo nero,
 * scritte bianche). Lo scroll è guidato dall'esterno tramite `scrollFraction`
 * (0 = inizio, 1 = fondo del documento) — la stessa frazione sincronizzata
 * su tutti i display, ciascuno la applica alla propria altezza scrollabile.
 */
const PdfLyricsView = forwardRef(function PdfLyricsView({ songId, zoom, scrollFraction }, ref) {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return undefined;

    setReady(false);
    wrapper.innerHTML = '';

    async function render() {
      const pdfDoc = await loadPdfDocument({ url: pdfUrl(songId) });
      if (cancelled) return;

      const containerWidth = container.clientWidth;
      let top = 0;

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;

        const unscaled = page.getViewport({ scale: 1 });
        const scale = (containerWidth / unscaled.width) * zoom;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.top = `${top}px`;
        canvas.style.left = '0';
        wrapper.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;

        top += viewport.height + PAGE_GAP;
      }

      wrapper.style.height = `${top}px`;
      if (!cancelled) setReady(true);
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [songId, zoom]);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const container = containerRef.current;
    const max = Math.max(container.scrollHeight - container.clientHeight, 0);
    container.scrollTo({ top: scrollFraction * max, behavior: 'smooth' });
  }, [ready, scrollFraction]);

  useImperativeHandle(ref, () => ({
    getStepFraction() {
      const container = containerRef.current;
      if (!container) return 0.12;
      const max = container.scrollHeight - container.clientHeight;
      if (max <= 0) return 1;
      return (container.clientHeight * STEP_RATIO) / max;
    },
  }));

  return (
    <div ref={containerRef} className="pdf-scroll">
      <div ref={wrapperRef} className="pdf-wrapper" />
    </div>
  );
});

export default PdfLyricsView;
