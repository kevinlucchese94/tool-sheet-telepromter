// Il ruolo ("chi sono su questo dispositivo") resta salvato nel browser:
// si sceglie una volta sola e si può cambiare dalla pagina /ruolo.

export const ROLES = [
  { id: 'cantante', label: 'Cantante' },
  { id: 'chitarra', label: 'Chitarrista' },
  { id: 'batteria', label: 'Batterista' },
];

const STORAGE_KEY = 'gobbo.role';

export function getRole() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return ROLES.some((r) => r.id === stored) ? stored : null;
  } catch {
    // Safari in navigazione privata: lo storage può non essere disponibile.
    return null;
  }
}

export function setRole(role) {
  try {
    localStorage.setItem(STORAGE_KEY, role);
  } catch {
    // Senza storage il ruolo verrà richiesto di nuovo alla prossima apertura.
  }
}

export function roleLabel(id) {
  return ROLES.find((r) => r.id === id)?.label ?? id;
}
