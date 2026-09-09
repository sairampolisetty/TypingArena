import type { PlayerPublic } from '../types';
import { getAvatarColor, getInitials, getRankEmoji } from '../lib/utils';

interface LeaderboardProps {
  players: PlayerPublic[];
  currentPlayerId?: string;
}

export default function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  const sorted = [...players]
    .filter(p => p.status !== 'disconnected')
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  const podium = sorted.slice(0, 3);

  const podiumClasses: Record<number, string> = {
    0: 'podium-1st',
    1: 'podium-2nd',
    2: 'podium-3rd',
  };

  const podiumSizes = [44, 38, 32];
  const podiumOrderIndex = [1, 0, 2]; // 2nd, 1st, 3rd visual order

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Podium */}
      {podium.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 16,
          marginBottom: 32,
          padding: '0 16px',
        }}>
          {podiumOrderIndex.map(orderIdx => {
            const player = podium[orderIdx];
            if (!player) return null;
            const isMe = player.id === currentPlayerId;

            return (
              <div
                key={player.id}
                className={`card ${podiumClasses[orderIdx] || ''}`}
                style={{
                  flex: 1,
                  maxWidth: 200,
                  padding: '20px 16px',
                  textAlign: 'center',
                  animation: `slide-up ${0.3 + orderIdx * 0.1}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                  border: isMe ? '2px solid var(--accent-primary)' : undefined,
                }}
              >
                <div style={{ fontSize: podiumSizes[orderIdx], lineHeight: 1.2, marginBottom: 8 }}>
                  {getRankEmoji(orderIdx + 1)}
                </div>
                <div style={{
                  width: 52, height: 52,
                  borderRadius: '50%',
                  background: getAvatarColor(player.nickname),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: 'white',
                  margin: '0 auto 12px',
                }}>
                  {getInitials(player.nickname)}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: isMe ? 'var(--accent-primary-light)' : 'var(--text-primary)' }}>
                  {player.nickname}
                  {isMe && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>YOU</span>}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 700,
                  background: orderIdx === 0
                    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                    : orderIdx === 1
                    ? 'linear-gradient(135deg, #d1d5db, #9ca3af)'
                    : 'linear-gradient(135deg, #cd7c50, #b45e3c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {player.wpm}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  WPM
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {player.accuracy.toFixed(1)}% accuracy
                </div>
                {player.finishedAt && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Finished
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rankings table */}
      {sorted.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr 80px 90px 80px',
            gap: 8,
            padding: '12px 16px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <span className="section-title" style={{ marginBottom: 0 }}>RANK</span>
            <span className="section-title" style={{ marginBottom: 0 }}>PLAYER</span>
            <span className="section-title" style={{ marginBottom: 0, textAlign: 'right' }}>WPM</span>
            <span className="section-title" style={{ marginBottom: 0, textAlign: 'right' }}>ACCURACY</span>
            <span className="section-title" style={{ marginBottom: 0, textAlign: 'right' }}>STATUS</span>
          </div>

          {/* Rows */}
          {sorted.map((player, idx) => {
            const isMe = player.id === currentPlayerId;
            return (
              <div
                key={player.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr 80px 90px 80px',
                  gap: 8,
                  padding: '12px 16px',
                  alignItems: 'center',
                  background: isMe ? 'var(--accent-primary-subtle)' : (idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'),
                  borderBottom: idx < sorted.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  borderLeft: isMe ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  animation: `slide-in-left ${0.1 + idx * 0.05}s ease both`,
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                <div style={{ fontSize: 16, textAlign: 'center' }}>
                  {getRankEmoji(player.rank)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: getAvatarColor(player.nickname),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>
                    {getInitials(player.nickname)}
                  </div>
                  <span style={{
                    fontWeight: 600, fontSize: 14,
                    color: isMe ? 'var(--accent-primary-light)' : 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {player.nickname}
                    {isMe && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>YOU</span>}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan-light)' }}>
                  {player.wpm}
                </div>
                <div style={{ textAlign: 'right', fontSize: 14, color: 'var(--color-success)', fontWeight: 600 }}>
                  {player.accuracy.toFixed(1)}%
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${player.status === 'finished' ? 'finished' : 'typing'}`}>
                    {player.status === 'finished' ? 'Done' : `${player.progress}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
