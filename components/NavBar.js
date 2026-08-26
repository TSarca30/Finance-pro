import { useRouter } from 'next/router';

const items = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/analytics', label: 'Analitiche', icon: 'chart' },
  { href: '/transazioni', label: 'Transazioni', icon: 'list' },
  { href: '/rate', label: 'Rate', icon: 'calendar' },
  { href: '/investimenti', label: 'Investimenti', icon: 'trend' },
  { href: '/budget', label: 'Budget', icon: 'target' },
];

function Icon({ name, active }) {
  const color = active ? '#60a5fa' : '#9aa0a6';
  const size = 20;
  const common = { width: size, height: size, fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (name === 'home') {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    );
  }
  if (name === 'chart') {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 20V10" />
        <path d="M11 20V4" />
        <path d="M18 20v-7" />
      </svg>
    );
  }
  if (name === 'list') {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  }
  if (name === 'calendar') {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  if (name === 'trend') {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M17 7h4v4" />
      </svg>
    );
  }
  if (name === 'target') {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    );
  }
  return null;
}

export default function NavBar() {
  const router = useRouter();
  const current = router.pathname;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1a1d24',
      borderRadius: '28px',
      padding: '10px 14px',
      display: 'flex',
      gap: '4px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      zIndex: 50,
      maxWidth: '95vw',
      overflowX: 'auto',
    }}>
      {items.map(function(item, i) {
        const active = current === item.href;
        return (
          
            key={i}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: active ? '8px 14px' : '8px 10px',
              borderRadius: '20px',
              background: active ? 'rgba(96,165,250,0.15)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            <Icon name={item.icon} active={active} />
            {active && (
              <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}
