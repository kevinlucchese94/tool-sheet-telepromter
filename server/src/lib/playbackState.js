// Stato di riproduzione condiviso da tutti i display collegati: solo la
// canzone corrente e quanto si è scorso (0 = inizio, 1 = fondo). Ogni
// display traduce questa frazione nella propria scrollTop, quindi la
// sincronizzazione funziona indipendentemente dalle dimensioni/risoluzione
// di ciascuno schermo.
//
// `scrollFraction` è lo scroll del cantante (gobbo + controller).
// `partScroll` tiene lo scroll separato di chitarrista e batterista: ognuno
// scorre la propria parte senza muovere quella degli altri.
// Vive solo in memoria: si resetta ad ogni riavvio del server.

import { PART_ROLES } from './parts.js';

const state = {
  songId: null,
  scrollFraction: 0,
  partScroll: Object.fromEntries(PART_ROLES.map((role) => [role, 0])),
  fontSize: 48,
};

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

export function getState() {
  return { ...state, partScroll: { ...state.partScroll } };
}

export function setSong(songId) {
  state.songId = songId;
  state.scrollFraction = 0;
  for (const role of PART_ROLES) state.partScroll[role] = 0;
  return getState();
}

export function setScroll(fraction, role) {
  if (PART_ROLES.includes(role)) {
    state.partScroll[role] = clamp01(fraction);
  } else {
    state.scrollFraction = clamp01(fraction);
  }
  return getState();
}

export function stepScroll(delta, role) {
  if (PART_ROLES.includes(role)) {
    state.partScroll[role] = clamp01(state.partScroll[role] + delta);
  } else {
    state.scrollFraction = clamp01(state.scrollFraction + delta);
  }
  return getState();
}

export function setFontSize(size) {
  state.fontSize = Math.min(Math.max(size, 20), 140);
  return getState();
}
