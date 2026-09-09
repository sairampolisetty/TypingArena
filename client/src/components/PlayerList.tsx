import type { PlayerPublic, PlayerStatus } from '../types';
import { getAvatarColor, getInitials } from '../lib/utils';

interface StatusBadgeProps {
  status: PlayerStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${status}`}>
      {status === 'typing' && <span className="live-dot" style={{ width: 6, height: 6 }} />}
      {status}
    </span>
  );
}

interface PlayerCardProps {
  player: PlayerPublic;
  isCurrentPlayer?: boolean;
  showProgress?: boolean;
}

export function PlayerCard({ player, isCurrentPlayer, showProgress }: PlayerCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: '14px',
        borderColor: isCurrentPlayer ? 'var(--accent-primary)' : undefined,
        background: isCurrentPlayer ? 'var(--accent-primary-subtle)' : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isCurrentPlayer && (
        <span style={{
          position: 'absolute',
          top: 6, right: 8,
          fontSize: 10, fontWeight: 700,
          color: 'var(--accent-primary-light)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          YOU
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: getAvatarColor(player.nickname),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white',
          flexShrink: 0,
        }}>
          {getInitials(player.nickname)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 14,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {player.nickname}
          </div>
          <StatusBadge status={player.status} />
        </div>
        {showProgress && player.status === 'typing' && (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan-light)' }}>
            {player.wpm > 0 ? `${player.wpm} WPM` : '—'}
          </span>
        )}
      </div>
      {showProgress && (
        <div className="progress-bar-track" style={{ marginTop: 10 }}>
          <div className="progress-bar-fill" style={{ width: `${player.progress}%` }} />
        </div>
      )}
    </div>
  );
}

interface PlayerListProps {
  players: PlayerPublic[];
  currentPlayerId?: string;
  showProgress?: boolean;
  compact?: boolean;
}

export function PlayerList({ players, currentPlayerId, showProgress, compact }: PlayerListProps) {
  const active = players.filter(p => p.status !== 'disconnected');
  const disconnected = players.filter(p => p.status === 'disconnected');

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {active.map(player => (
          <div
            key={player.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: player.id === currentPlayerId ? 'var(--accent-primary-subtle)' : 'var(--border-subtle)',
              border: player.id === currentPlayerId ? '1px solid var(--border-accent)' : '1px solid transparent',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: getAvatarColor(player.nickname),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {getInitials(player.nickname)}
            </div>
            <span style={{ flex: 1, fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.nickname}
              {player.id === currentPlayerId && <span style={{ color: 'var(--accent-primary-light)', marginLeft: 6, fontSize: 11 }}>you</span>}
            </span>
            <StatusBadge status={player.status} />
          </div>
        ))}
        {disconnected.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 8, marginTop: 4 }}>
            {disconnected.length} disconnected
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 10,
    }}>
      {active.map(player => (
        <PlayerCard
          key={player.id}
          player={player}
          isCurrentPlayer={player.id === currentPlayerId}
          showProgress={showProgress}
        />
      ))}
      {disconnected.map(player => (
        <PlayerCard key={player.id} player={player} isCurrentPlayer={false} />
      ))}
    </div>
  );
}
