import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line import/no-unresolved
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const NOISE_PATTERNS = [
  /https?:\/\//i, // piè di pagina con link (comune nei PDF stampati da siti di accordi)
  /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s*\d{1,2}:\d{2}/, // intestazione con data/ora di stampa pagina
];

function isNoiseLine(text) {
  return NOISE_PATTERNS.some((re) => re.test(text));
}

export function loadPdfDocument(source) {
  return pdfjsLib.getDocument(source).promise;
}

/**
 * Estrae dal PDF un elenco di righe { text, page, y }, raggruppando gli
 * elementi di testo per riga (stessa coordinata y, con una piccola
 * tolleranza) e ordinandoli da sinistra a destra. `page` è 1-indicizzata,
 * `y` è nello spazio PDF nativo (punti, origine in basso) della relativa
 * pagina — utile in seguito per posizionare la vista sulla riga corretta
 * quando si renderizza la pagina originale.
 */
export async function extractLines(pdfDoc) {
  const lines = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();

    const rows = new Map();
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push(item);
    }

    const tolerance = 2;
    const sortedYs = [...rows.keys()].sort((a, b) => b - a);
    const clustered = [];
    for (const y of sortedYs) {
      const last = clustered[clustered.length - 1];
      if (last && Math.abs(last.y - y) <= tolerance) {
        last.items.push(...rows.get(y));
        last.y = (last.y + y) / 2;
      } else {
        clustered.push({ y, items: [...rows.get(y)] });
      }
    }

    for (const row of clustered) {
      const text = row.items
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map((i) => i.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text && !isNoiseLine(text)) {
        const height = Math.max(...row.items.map((i) => i.height || 12));
        lines.push({ text, page: pageNum, y: row.y, height });
      }
    }
  }

  return lines;
}
