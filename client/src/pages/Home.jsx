import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSongs, uploadSong, deleteSong } from '../lib/api.js';
import { socket } from '../lib/socket.js';
import { loadPdfDocument, extractLines } from '../lib/pdfjs.js';

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  async function reload() {
    try {
      setSongs(await fetchSongs());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    socket.on('songs:changed', reload);
    return () => socket.off('songs:changed', reload);
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await loadPdfDocument({ data: buffer });
      const lines = await extractLines(pdfDoc);

      if (lines.length === 0) {
        throw new Error('Non è stato possibile estrarre testo dal PDF (probabilmente è una scansione/immagine).');
      }

      const title = window.prompt('Titolo della canzone?', file.name.replace(/\.pdf$/i, '')) || undefined;
      await uploadSong({ file, title, lines });
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm('Rimuovere questa canzone dal repertorio?')) return;
    await deleteSong(id);
    await reload();
  }

  return (
    <div className="page">
      <header className="header">
        <h1>🎤 Repertorio</h1>
        <Link className="btn btn-ghost" to="/display" target="_blank" rel="noreferrer">
          Apri schermo gobbo ↗
        </Link>
      </header>

      <label className="upload-box">
        {uploading ? 'Caricamento in corso…' : '+ Carica PDF canzone'}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          disabled={uploading}
          hidden
        />
      </label>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Caricamento…</p>
      ) : songs.length === 0 ? (
        <p className="hint">Nessuna canzone ancora. Carica un PDF per iniziare.</p>
      ) : (
        <ul className="song-list">
          {songs.map((song) => (
            <li key={song.id} className="song-item" onClick={() => navigate(`/controller/${song.id}`)}>
              <div>
                <div className="song-title">{song.title}</div>
                {song.artist && <div className="song-artist">{song.artist}</div>}
              </div>
              <button className="btn btn-danger" onClick={(e) => handleDelete(song.id, e)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
