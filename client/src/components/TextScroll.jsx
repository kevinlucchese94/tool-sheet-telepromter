import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const STEP_RATIO = 0.85;

// Stima grezza della larghezza disponibile per riga e della larghezza media
// di un carattere in grassetto, per rimpicciolire le righe troppo lunghe
// invece di farle andare a capo (che romperebbe l'impaginazione fissa).
function fitFontSize(text, baseFontSize) {
  const availableWidth = window.innerWidth * 0.88;
  const estimatedWidth = text.length * baseFontSize * 0.58;
  if (estimatedWidth <= availableWidth) return baseFontSize;
  return Math.max(baseFontSize * (availableWidth / estimatedWidth), baseFontSize * 0.35);
}

/**
 * Vista testo pulita (senza accordi): elenco scorrevole delle righe
 * estratte dal PDF, a schermo intero, sfondo nero. Scroll guidato
 * dall'esterno tramite `scrollFraction`, stessa logica di PdfLyricsView.
 */
const TextScroll = forwardRef(function TextScroll({ lines, fontSize, scrollFraction }, ref) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const max = Math.max(container.scrollHeight - container.clientHeight, 0);
    container.scrollTo({ top: scrollFraction * max, behavior: 'smooth' });
  }, [scrollFraction]);

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
    <div ref={containerRef} className="text-scroll-viewport">
      <div className="text-scroll-track">
        {lines.map((line, i) => (
          <div
            key={i}
            className="text-scroll-line"
            style={{ fontSize: `${fitFontSize(line.text, fontSize)}px`, minHeight: `${fontSize * 1.7}px` }}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
});

export default TextScroll;
