import { useState } from 'react';
import NavBar from '../components/NavBar';

export default function Transazioni() {
  const [showPanel, setShowPanel] = useState(false);
  const [tipoForm, setTipoForm] = useState(null);

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
  };

  const sheetStyle = {
    background: '#14161b', borderRadius: '24px 24px 0 0', padding: '24px',
    width: '100%', maxWidth: '480px', paddingBottom: '40px',
  };

  const optionStyle = {
    background: '#1a1d24', borderRadius: '16px', padding: '18px',
    marginBottom: '12px', cursor: 'pointer', border: 'none', width: '100%',
    textAlign: 'left', color: '#f5f5f5',
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>Transazioni</h1>

      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', marginBottom: '16px' }}>Inserisci la tua spesa in un TAP</p>
        <button
          onClick={function() { setShowPanel(true); }}
          style={{
            background: '#60a5fa', color: '#0f1115', border: 'none',
            borderRadius: '999px', padding: '12px 28px', fontSize: '15px',
            fontWeight: 'bold', cursor: 'pointer',
          }}
        >
          + Aggiungi
        </button>
      </div>

      {showPanel && (
        <div style={overlayStyle} onClick={function() { setShowPanel(false); }}>
          <div style={sheetStyle} onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ width: '40px', height: '4px', background: '#3a3d44', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Cosa vuoi aggiungere?</h2>
            <p style={{ fontSize: '13px', color: '#9aa0a6', marginBottom: '20px' }}>Scegli il tipo di spesa da tracciare.</p>

            <button style={optionStyle} onClick={function() { setTipoForm('spesa'); setShowPanel(false); }}>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>Spesa Giornaliera</p>
              <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Una spesa singola di oggi o di un giorno specifico</p>
            </button>

            <button style={optionStyle} onClick={function() { setTipoForm('investimento'); setShowPanel(false); }}>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>Investimenti</p>
              <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Acquisto ETF o rientro Safeback</p>
            </button>

            <button style={optionStyle} onClick={function() { setTipoForm('rata'); setShowPanel(false); }}>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>Rata</p>
              <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Nuovo promemoria di pagamento ricorrente</p>
            </button>
          </div>
        </div>
      )}

      {tipoForm && (
        <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Form "{tipoForm}" — lo costruiamo nel prossimo passo
          </p>
        </div>
      )}

      <NavBar />
    </div>
  );
}
