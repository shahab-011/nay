import React from 'react';

/* ── Canvas resize helper ─────────────────────────────────────────── */
export function resizeImage(file, maxPx = 220) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Not an image'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const w = Math.round(img.width  * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/* ── Preset avatar SVG designs ───────────────────────────────────── */
export function AvatarSVG({ id, size = 96 }) {
  if (id && id.startsWith('data:image/')) {
    return (
      <img
        src={id}
        alt="Profile"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
      />
    );
  }

  const s = size;
  const designs = {
    av0: (
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#0d1b35"/>
        <circle cx="50" cy="50" r="50" fill="#00C9A7" fillOpacity="0.06"/>
        <rect x="48.5" y="20" width="3" height="52" rx="1.5" fill="#00C9A7"/>
        <rect x="36" y="68" width="28" height="4" rx="2" fill="#00C9A7"/>
        <rect x="20" y="32" width="60" height="3" rx="1.5" fill="#44e5c2"/>
        <circle cx="50" cy="20" r="3.5" fill="#44e5c2"/>
        <line x1="24" y1="35" x2="24" y2="51" stroke="#44e5c2" strokeWidth="1.5"/>
        <line x1="76" y1="35" x2="76" y2="51" stroke="#44e5c2" strokeWidth="1.5"/>
        <path d="M14 51 Q24 64 34 51" stroke="#44e5c2" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M66 51 Q76 64 86 51" stroke="#44e5c2" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="24" cy="51" r="2" fill="#44e5c2"/>
        <circle cx="76" cy="51" r="2" fill="#44e5c2"/>
      </svg>
    ),
    av1: (
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#080e24"/>
        <circle cx="50" cy="50" r="38" stroke="#00C9A7" strokeWidth="1.5" fill="none" strokeDasharray="6 4" opacity="0.8"/>
        <circle cx="50" cy="50" r="26" stroke="#44e5c2" strokeWidth="1" fill="none" opacity="0.5" strokeDasharray="3 3"/>
        <circle cx="50" cy="50" r="15" stroke="#00C9A7" strokeWidth="0.75" fill="none" opacity="0.4"/>
        <circle cx="50" cy="50" r="6" fill="#00C9A7"/>
        <circle cx="50" cy="50" r="3" fill="white" opacity="0.95"/>
        <circle cx="88" cy="50" r="5" fill="#00C9A7"/>
        <circle cx="12" cy="50" r="3.5" fill="#44e5c2" opacity="0.8"/>
        <circle cx="50" cy="12" r="4" fill="#44e5c2"/>
        <circle cx="50" cy="88" r="3" fill="#00C9A7" opacity="0.7"/>
        <circle cx="77" cy="23" r="3" fill="#44e5c2"/>
        <circle cx="23" cy="77" r="2.5" fill="#00C9A7" opacity="0.7"/>
        <circle cx="77" cy="77" r="2" fill="#44e5c2" opacity="0.5"/>
        <circle cx="23" cy="23" r="2.5" fill="#00C9A7" opacity="0.6"/>
      </svg>
    ),
    av2: (
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#0d1f2a"/>
        <polygon points="50,27 65,36 65,54 50,63 35,54 35,36" stroke="#00C9A7" strokeWidth="2" fill="#00C9A7" fillOpacity="0.15"/>
        <polygon points="50,8 58,13 58,23 50,28 42,23 42,13" stroke="#44e5c2" strokeWidth="1.5" fill="none" opacity="0.8"/>
        <polygon points="69,38 77,43 77,53 69,58 61,53 61,43" stroke="#44e5c2" strokeWidth="1.5" fill="none" opacity="0.8"/>
        <polygon points="31,38 39,43 39,53 31,58 23,53 23,43" stroke="#44e5c2" strokeWidth="1.5" fill="none" opacity="0.8"/>
        <polygon points="69,62 77,67 77,77 69,82 61,77 61,67" stroke="#44e5c2" strokeWidth="1" fill="none" opacity="0.45"/>
        <polygon points="31,62 39,67 39,77 31,82 23,77 23,67" stroke="#44e5c2" strokeWidth="1" fill="none" opacity="0.45"/>
        <polygon points="50,72 58,77 58,87 50,92 42,87 42,77" stroke="#44e5c2" strokeWidth="1" fill="none" opacity="0.45"/>
        <circle cx="50" cy="45" r="6" fill="#00C9A7"/>
        <circle cx="50" cy="45" r="3" fill="white" opacity="0.9"/>
      </svg>
    ),
    av3: (
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#12102a"/>
        <path d="M50 17 L78 30 L78 56 Q78 74 50 86 Q22 74 22 56 L22 30 Z" stroke="#8b5cf6" strokeWidth="1.5" fill="#8b5cf6" fillOpacity="0.1"/>
        <path d="M50 24 L70 34 L70 55 Q70 69 50 79 Q30 69 30 55 L30 34 Z" stroke="#00C9A7" strokeWidth="1.5" fill="none"/>
        <path d="M50 31 L62 38 L62 55 Q62 65 50 73 Q38 65 38 55 L38 38 Z" fill="#00C9A7" fillOpacity="0.1"/>
        <rect x="48.5" y="38" width="3" height="22" rx="1.5" fill="#44e5c2"/>
        <rect x="39" y="42" width="22" height="2.5" rx="1.25" fill="#44e5c2"/>
        <path d="M38 47 Q41.5 53 45 47" stroke="#44e5c2" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M55 47 Q58.5 53 62 47" stroke="#44e5c2" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="50" cy="17" r="3" fill="#8b5cf6"/>
        <circle cx="78" cy="30" r="2.5" fill="#8b5cf6" opacity="0.7"/>
        <circle cx="22" cy="30" r="2.5" fill="#8b5cf6" opacity="0.7"/>
      </svg>
    ),
    av4: (
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ clipPath: 'circle(50%)' }}>
        <rect width="100" height="100" fill="#0a1f1a"/>
        <path d="M0 28 Q13 18 25 28 Q37 38 50 28 Q63 18 75 28 Q87 38 100 28" stroke="#00C9A7" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9"/>
        <path d="M0 40 Q13 30 25 40 Q37 50 50 40 Q63 30 75 40 Q87 50 100 40" stroke="#44e5c2" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.75"/>
        <path d="M0 52 Q13 42 25 52 Q37 62 50 52 Q63 42 75 52 Q87 62 100 52" stroke="#00C9A7" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
        <path d="M0 64 Q13 54 25 64 Q37 74 50 64 Q63 54 75 64 Q87 74 100 64" stroke="#44e5c2" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M0 76 Q13 66 25 76 Q37 86 50 76 Q63 66 75 76 Q87 86 100 76" stroke="#00C9A7" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
        <circle cx="50" cy="50" r="13" fill="#00C9A7" fillOpacity="0.15"/>
        <circle cx="50" cy="50" r="7" fill="#00C9A7" opacity="0.7"/>
        <circle cx="50" cy="50" r="3.5" fill="white" opacity="0.9"/>
      </svg>
    ),
    av5: (
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#0e1a30"/>
        <polygon points="50,14 82,44 50,86 18,44" stroke="#00C9A7" strokeWidth="1.75" fill="none"/>
        <polygon points="50,26 72,44 50,70 28,44" stroke="#44e5c2" strokeWidth="1.5" fill="#00C9A7" fillOpacity="0.12"/>
        <polygon points="50,37 63,44 50,58 37,44" fill="#00C9A7" opacity="0.55"/>
        <line x1="50" y1="14" x2="50" y2="86" stroke="#44e5c2" strokeWidth="0.75" opacity="0.3"/>
        <line x1="18" y1="44" x2="82" y2="44" stroke="#44e5c2" strokeWidth="0.75" opacity="0.3"/>
        <line x1="50" y1="14" x2="82" y2="44" stroke="#44e5c2" strokeWidth="0.6" opacity="0.25"/>
        <line x1="50" y1="14" x2="18" y2="44" stroke="#44e5c2" strokeWidth="0.6" opacity="0.25"/>
        <line x1="18" y1="44" x2="50" y2="86" stroke="#44e5c2" strokeWidth="0.6" opacity="0.25"/>
        <line x1="82" y1="44" x2="50" y2="86" stroke="#44e5c2" strokeWidth="0.6" opacity="0.25"/>
        <circle cx="50" cy="14" r="3.5" fill="#44e5c2"/>
        <circle cx="82" cy="44" r="3" fill="#00C9A7"/>
        <circle cx="50" cy="86" r="3" fill="#44e5c2"/>
        <circle cx="18" cy="44" r="3" fill="#00C9A7" opacity="0.8"/>
        <circle cx="50" cy="44" r="5" fill="white" opacity="0.92"/>
      </svg>
    ),
  };
  return designs[id] || designs['av0'];
}

export const AVATAR_META = [
  { id: 'av0', label: 'Balance',  desc: 'Scales of Justice' },
  { id: 'av1', label: 'Cosmos',   desc: 'Orbital Rings'     },
  { id: 'av2', label: 'Hex Grid', desc: 'Tech Honeycomb'    },
  { id: 'av3', label: 'Shield',   desc: 'Legal Crest'       },
  { id: 'av4', label: 'Wave',     desc: 'Energy Flow'       },
  { id: 'av5', label: 'Crystal',  desc: 'Diamond Facets'    },
];

/* ── AvatarDisplay — drop-in for any size/location ───────────────── */
export default function AvatarDisplay({ user, size = 36, className = '' }) {
  const avatarId = user?.avatarUrl || 'av0';
  const isPhoto  = avatarId.startsWith('data:image/');

  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {isPhoto ? (
        <img
          src={avatarId}
          alt={user?.name || 'Avatar'}
          style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <AvatarSVG id={avatarId} size={size} />
      )}
    </div>
  );
}
