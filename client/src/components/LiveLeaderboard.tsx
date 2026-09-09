import type { PlayerPublic } from '../types';
import { getAvatarColor, getInitials, getRankEmoji } from '../lib/utils';

interface LiveLeaderboardProps {
  players: PlayerPublic[];
  currentPlayerId?: string;
}

export default function LiveLeaderboard({ players, currentPlayerId }: LiveLeaderboardProps) {
  const sorted = [...players]
    .filter(p => p.status !== 'disconnected')
    .sort((a, b) => {
      if (b.progress !== a.progress) return b.progress - a.progress;
      return b.wpm - a.wpm;
    })
    .slice(0, 8); // Show top 8 in live view

  return (
    <div
      className="glass-card"
      style={{ padding: '16px', minWidth: 220 }}
    >
      <p className="section-title">LIVE RACE</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((player, idx) => {
          const isMe = player.id === currentPlayerId;
          const rank = idx + 1;
          return (
            <div
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: isMe ? 'var(--accent-primary-subtle)' : 'transparent',
                border: isMe ? '1px solid var(--border-accent)' : '1px solid transparent',
                transition: 'all 0.3s',
              }}
            >
              <span style={{
                width: 20,
                fontSize: 14,
                textAlign: 'center',
                flexShrink: 0,
              }}>
                {rank <= 3 ? getRankEmoji(rank) : `${rank}`}
              </span>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: getAvatarColor(player.nickname),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                {getInitials(player.nickname)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: isMe ? 'var(--accent-primary-light)' : 'var(--text-primary)',
                }}>
                  {player.nickname}
                  {isMe && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>you</span>}
                </div>
                <div className="progress-bar-track" style={{ height: 4, marginTop: 3 }}>
                  <div className="progress-bar-fill" style={{ width: `${player.progress}%` }} />
                </div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: player.status === 'finished' ? 'var(--color-success)' : 'var(--accent-cyan-light)',
                minWidth: 50,
                textAlign: 'right',
              }}>
                {player.wpm > 0 ? `${player.wpm} WPM` : '—'}
              </span>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
            Waiting for players...
          </p>
        )}
      </div>
    </div>
  );
}
