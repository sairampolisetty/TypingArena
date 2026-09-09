import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '../lib/utils';

interface RoomCodeProps {
  code: string;
  showInviteLink?: boolean;
}

export default function RoomCode({ code, showInviteLink = true }: RoomCodeProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const inviteLink = `${window.location.origin}/arena/${code}`;

  async function handleCopyCode() {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  async function handleCopyLink() {
    const ok = await copyToClipboard(inviteLink);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p className="section-title" style={{ justifyContent: 'center' }}>
        YOUR ARENA CODE
      </p>
      <div className="room-code" style={{ marginBottom: '16px' }}>
        {code}
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          onClick={handleCopyCode}
          aria-label="Copy room code"
        >
          {codeCopied ? <Check size={16} /> : <Copy size={16} />}
          {codeCopied ? 'Copied!' : 'Copy Code'}
        </button>
        {showInviteLink && (
          <button
            className="btn btn-secondary"
            onClick={handleCopyLink}
            aria-label="Copy invite link"
          >
            {linkCopied ? <Check size={16} /> : <ExternalLink size={16} />}
            {linkCopied ? 'Copied!' : 'Copy Invite Link'}
          </button>
        )}
      </div>
    </div>
  );
}
