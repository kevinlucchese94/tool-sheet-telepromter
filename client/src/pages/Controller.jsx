import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSong } from '../lib/api.js';
import { socket } from '../lib/socket.js';

const DEFAULT_STATE = { scrollFraction: 0, fontSize: 48 };
const STEP = 0.12;

export default function Controller() {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [state, setState] = useState(DEFAULT_STATE);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSong(id)
      .then(setSong)
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    socket.emit('song:select', { songId: id });

    function onState(s) {
      setState(s);
    }
    socket.on('state:update', onState);
    return () => socket.off('state:update', onState);
  }, [id]);

  useEffect(() => {
    function onKeyDown(e) {
      const forward =
        e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
      const backward =
        e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if (!forward && !backward) return;
      e.preventDefault();
      socket.emit('scroll:step', { delta: forward ? STEP : -STEP });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (error) return <div className="page">{error}</div>;
  if (!song) return <div className="page">Caricamento…</div>;

  const previewIndex = Math.min(Math.round(state.scrollFraction * (song.lines.length - 1)), song.lines.length - 1);
  const currentLine = song.lines[previewIndex]?.text ?? '';

  return (
    <div className="page controller">
      <header className="header">
        <Link className="btn btn-ghost" to="/">
          ← Repertorio
        </Link>
        <h1>{song.title}</h1>
      </header>

      <div className="lyrics-preview">
        <div className="line-now">{currentLine}</div>
      </div>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${state.scrollFraction * 100}%` }} />
      </div>

      <div className="controls">
        <button className="btn btn-big" onClick={() => socket.emit('scroll:step', { delta: -STEP })}>
          ⬆ Indietro
        </button>
        <button className="btn btn-big btn-primary" onClick={() => socket.emit('scroll:step', { delta: STEP })}>
          Avanti ⬇
        </button>
      </div>

      <div className="font-controls">
        <span>Dimensione testo (schermo gobbo)</span>
        <div className="font-buttons">
          <button className="btn" onClick={() => socket.emit('settings:fontSize', { fontSize: state.fontSize - 8 })}>
            A-
          </button>
          <button className="btn" onClick={() => socket.emit('settings:fontSize', { fontSize: state.fontSize + 8 })}>
            A+
          </button>
        </div>
      </div>

      <p className="hint">
        Con una tastiera o un pedale Bluetooth: freccia giù / spazio = avanti, freccia su / shift+spazio =
        indietro. Funziona sia qui che collegato direttamente al gobbo.
      </p>
    </div>
  );
}
