import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { fetchParts, fetchSong } from '../lib/api.js';
import { socket } from '../lib/socket.js';
import { getRole, roleLabel } from '../lib/role.js';
import PdfLyricsView from '../components/PdfLyricsView.jsx';

const DEFAULT_STEP = 0.12;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;

/**
 * Vista di chitarrista/batterista: mostra la propria parte (o il PDF del
 * cantante se manca) a schermo intero. La canzone la sceglie il cantante;
 * lo scroll è solo di questo ruolo, non muove la schermata degli altri.
 */
export default function Part() {
  const role = getRole();
  const [state, setState] = useState({ songId: null, partScroll: {} });
  const [song, setSong] = useState(null);
  const [parts, setParts] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewRef = useRef(null);

  useEffect(() => {
    function onState(s) {
      setState(s);
    }
    socket.on('state:update', onState);
    socket.emit('state:get');
    return () => socket.off('state:update', onState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSong(null);
    setParts(null);
    if (!state.songId) return undefined;

    fetchSong(state.songId)
      .then((s) => !cancelled && setSong(s))
      .catch(console.error);
    fetchParts(state.songId)
      .then((p) => !cancelled && setParts(p))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [state.songId]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  function scroll(direction) {
    const step = viewRef.current?.getStepFraction() ?? DEFAULT_STEP;
    socket.emit('scroll:step', { delta: direction * step, role });
  }

  useEffect(() => {
    function onKeyDown(e) {
      const forward =
        e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
      const backward =
        e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if (!forward && !backward) return;
      e.preventDefault();
      scroll(forward ? 1 : -1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  if (role !== 'chitarra' && role !== 'batteria') return <Navigate to="/ruolo" replace />;

  const controls = (
    <div className="display-controls">
      <Link className="chip" to="/ruolo">
        Cambia ruolo
      </Link>
      <button className="chip" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.15))}>
        A-
      </button>
      <button className="chip" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.15))}>
        A+
      </button>
      <button className="chip" onClick={toggleFullscreen}>
        {isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
      </button>
    </div>
  );

  if (!song) {
    return (
      <div className="display-empty">
        {controls}
        <p>In attesa che il cantante scelga la canzone…</p>
      </div>
    );
  }

  const usingFallback = parts?.[role] === false;

  return (
    <div className="display-root">
      {controls}
      <div className="part-label">
        {song.title} · {roleLabel(role)}
        {usingFallback && ' · nessuna tua parte trovata, vedi il PDF del cantante'}
      </div>
      <PdfLyricsView
        ref={viewRef}
        songId={song.id}
        role={role}
        zoom={zoom}
        scrollFraction={state.partScroll?.[role] ?? 0}
      />
      <div className="part-nav">
        <button className="part-nav-btn" aria-label="Indietro" onClick={() => scroll(-1)}>
          ▲
        </button>
        <button className="part-nav-btn" aria-label="Avanti" onClick={() => scroll(1)}>
          ▼
        </button>
      </div>
    </div>
  );
}
