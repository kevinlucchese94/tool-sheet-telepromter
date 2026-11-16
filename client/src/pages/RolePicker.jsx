import { useNavigate } from 'react-router-dom';
import { ROLES, getRole, setRole } from '../lib/role.js';

export default function RolePicker() {
  const navigate = useNavigate();
  const current = getRole();

  function choose(id) {
    setRole(id);
    navigate(id === 'cantante' ? '/' : '/parte', { replace: true });
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Chi sei su questo dispositivo?</h1>
      </header>
      <p className="hint">
        Il cantante sceglie la canzone; chitarrista e batterista vedono la propria parte e la scorrono in
        autonomia. La scelta resta salvata su questo dispositivo.
      </p>
      <div className="role-list">
        {ROLES.map((role) => (
          <button
            key={role.id}
            className={role.id === current ? 'btn btn-big btn-primary' : 'btn btn-big'}
            onClick={() => choose(role.id)}
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  );
}
