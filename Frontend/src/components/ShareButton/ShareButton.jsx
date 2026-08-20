import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import './ShareButton.css';

const buildShareUrl = (platform, { url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || '');
  switch (platform) {
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'twitter':  return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case 'whatsapp':  return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    case 'telegram':  return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
    case 'linkedin':  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    default: return null;
  }
};

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: 'fab fa-facebook-f' },
  { id: 'twitter',  label: 'X / Twitter', icon: 'fab fa-twitter' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp' },
  { id: 'telegram', label: 'Telegram', icon: 'fab fa-telegram-plane' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin-in' },
];

const ShareButton = ({ url, title, label = 'Share' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const fullUrl = url?.startsWith('http') ? url : `${window.location.origin}${url}`;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Link copied!');
      setOpen(false);
    } catch {
      toast.error('Could not copy link.');
    }
  };

  const handlePlatformClick = (platformId) => {
    const shareUrl = buildShareUrl(platformId, { url: fullUrl, title });
    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    setOpen(false);
  };

  return (
    <div className="share-btn" ref={ref}>
      <button type="button" className="share-btn__trigger" onClick={() => setOpen((v) => !v)}>
        <i className="fas fa-share-alt"></i> {label}
      </button>
      {open && (
        <div className="share-btn__menu">
          {PLATFORMS.map((p) => (
            <button key={p.id} type="button" className="share-btn__item" onClick={() => handlePlatformClick(p.id)}>
              <i className={p.icon}></i> {p.label}
            </button>
          ))}
          <button type="button" className="share-btn__item" onClick={handleCopy}>
            <i className="fas fa-link"></i> Copy link
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
