import { Link, Navigate } from 'react-router-dom';
import { getRole } from '../lib/role.js';

/**
 * Davanti al repertorio: se il dispositivo non ha ancora un ruolo chiede
 * "chi sei?"; chitarrista e batterista vengono mandati alla loro vista,
 * il cantante vede il repertorio esattamente come prima.
 */
export default function RoleGate({ children }) {
  const role = getRole();

  if (!role) return <Navigate to="/ruolo" replace />;
  if (role !== 'cantante') return <Navigate to="/parte" replace />;

  return (
    <>
      {children}
      <div className="role-switch">
        <Link to="/ruolo">Ruolo: Cantante · cambia</Link>
      </div>
    </>
  );
}
