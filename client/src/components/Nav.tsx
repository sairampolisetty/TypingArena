import { Link, useNavigate } from 'react-router-dom';
import { Shield, Zap } from 'lucide-react';

export default function Nav() {
  const navigate = useNavigate();
  return (
    <nav className="nav">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span className="logo">TYPING<span style={{ color: 'var(--accent-cyan)' }}>ARENA</span></span>
      </Link>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/join')}>
          <Zap size={14} />
          Join Arena
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/create')}>
          <Shield size={14} />
          Create Arena
        </button>
      </div>
    </nav>
  );
}
