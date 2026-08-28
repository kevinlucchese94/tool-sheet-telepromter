const BASE = '/api/songs';

export async function fetchSongs() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Impossibile caricare le canzoni');
  return res.json();
}

export async function fetchSong(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Canzone non trovata');
  return res.json();
}

export async function uploadSong({ file, title, artist, lines }) {
  const form = new FormData();
  form.append('pdf', file);
  form.append('lines', JSON.stringify(lines));
  if (title) form.append('title', title);
  if (artist) form.append('artist', artist);

  const res = await fetch(BASE, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload fallito');
  return data;
}

export function pdfUrl(songId) {
  return `${BASE}/${songId}/pdf`;
}

export async function deleteSong(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Cancellazione fallita');
}
