// Stato di riproduzione condiviso da tutti i display collegati: solo la
// canzone corrente e quanto si è scorso (0 = inizio, 1 = fondo). Ogni
// display traduce questa frazione nella propria scrollTop, quindi la
// sincronizzazione funziona indipendentemente dalle dimensioni/risoluzione
// di ciascuno schermo.
// Vive solo in memoria: si resetta ad ogni riavvio del server.

const state = {
  songId: null,
  scrollFraction: 0,
  fontSize: 48,
};

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

export function getState() {
  return { ...state };
}

export function setSong(songId) {
  state.songId = songId;
  state.scrollFraction = 0;
  return getState();
}

export function setScroll(fraction) {
  state.scrollFraction = clamp01(fraction);
  return getState();
}

export function stepScroll(delta) {
  state.scrollFraction = clamp01(state.scrollFraction + delta);
  return getState();
}

export function setFontSize(size) {
  state.fontSize = Math.min(Math.max(size, 20), 140);
  return getState();
}
