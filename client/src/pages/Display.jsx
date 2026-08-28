import { useEffect, useRef, useState } from 'react';
import { fetchSong } from '../lib/api.js';
import { socket } from '../lib/socket.js';
import PdfLyricsView from '../components/PdfLyricsView.jsx';
import TextScroll from '../components/TextScroll.jsx';

const DEFAULT_STATE = { songId: null, scrollFraction: 0, fontSize: 48 };
const DEFAULT_STEP = 0.12;

export default function Display() {
  const [song, setSong] = useState(null);
  const [state, setState] = useState(DEFAULT_STATE);
  const [mode, setMode] = useState('pdf'); // 'pdf' | 'text'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewRef = useRef(null);

  useEffect(() => {
    function onState(s) {
      setState(s);
    }
    socket.on('state:update', onState);
    return () => socket.off('state:update', onState);
  }, []);

  useEffect(() => {
    if (!state.songId) {
      setSong(null);
      return;
    }
    if (song?.id === state.songId) return;
    fetchSong(state.songId).then(setSong).catch(console.error);
  }, [state.songId]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      const forward =
        e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
      const backward =
        e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if (!forward && !backward) return;
      e.preventDefault();
      const step = viewRef.current?.getStepFraction() ?? DEFAULT_STEP;
      socket.emit('scroll:step', { delta: forward ? step : -step });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  const controls = (
    <div className="display-controls">
      <button className="chip" onClick={() => setMode(mode === 'pdf' ? 'text' : 'pdf')}>
        {mode === 'pdf' ? 'Vedi solo testo' : 'Vedi PDF/accordi'}
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
        <p>In attesa di una canzone dal controller…</p>
      </div>
    );
  }

  const zoom = state.fontSize / 48;

  return (
    <div className="display-root">
      {controls}
      {mode === 'pdf' ? (
        <PdfLyricsView ref={viewRef} songId={song.id} zoom={zoom} scrollFraction={state.scrollFraction} />
      ) : (
        <TextScroll ref={viewRef} lines={song.lines} fontSize={state.fontSize} scrollFraction={state.scrollFraction} />
      )}
    </div>
  );
}
