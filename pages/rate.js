import { useState } from 'react';
import NavBar from '../components/NavBar';
import { getSheetData } from '../lib/googleSheets';

function parseEuro(value) {
  if (!value) return 0;
  const cleaned = String(value).replace('€', '').trim().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function getServerSideProps() {
  const rows = await getSheetData('Scadenze');

  const rate = [];
  for (let i = 5; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    rate.push({
      rowNumber: i + 1,
      descrizione: row[0] || '',
      importo: parseEuro(row[1]),
      categoria: row[2] || '',
      conto: row[3] || '',
      frequenza: row[4] || '',
      prossimaScadenza: row[5] || '',
      giorniRimanenti: row[6] || '',
      stato: row[7] || '',
      numeroRateTotali: row[8] ? parseInt(row[8]) : null,
      ratePagate: row[9] ? parseInt(row[9]) : 0,
    });
  }

  return { props: { rate } };
}

function formatEuro(n) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Rate(props) {
  const [rate, setRate] = useState(props.rate);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [descrizione, setDescrizione] = useState('');
  const [categoria, setCategoria] = useState('');
  const [importo, setImporto] = useState('');
  const [conto, setConto] = useState('');
  const [frequenza, setFrequenza] = useState('Mensile');
  const [prossimaScadenza, setProssimaScadenza] = useState('');
  const [numeroRateTotali, setNumeroRateTotali] = useState('');

  const rateAttive = rate.filter(function(r) {
    return r.numeroRateTotali === null || r.ratePagate < r.numeroRateTotali;
  });

  const totaleDaVersare = rateAttive.reduce(function(sum, r) {
    if (r.numeroRateTotali) {
      const rimanenti = r.numeroRateTotali - r.ratePagate;
      return sum + (r.importo * rimanenti);
    }
    return sum + r.importo;
  }, 0);

  function formatDateForSheet(isoDate) {
    const parts = isoDate.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/add-rata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descrizione,
          categoria,
          importo: parseFloat(importo),
          conto,
          frequenza,
          prossimaScadenza: formatDateForSheet(prossimaScadenza),
          numeroRateTotali: numeroRateTotali ? parseInt(numeroRateTotali) : '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert('Errore: ' + data.error);
      }
    } catch (err) {
      alert('Errore di rete');
    }
    setLoading(false);
  }

  async function handlePaga(rowNumber) {
    setLoading(true);
    try {
      const res = await fetch('/api/paga-rata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowNumber }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (err) {
      alert('Errore di rete');
    }
    setLoading(false);
  }

  async function handleElimina(rowNumber) {
    if (!confirm('Eliminare questo promemoria?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/elimina-rata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowNumber }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (err) {
      alert('Errore di rete');
    }
    setLoading(false);
  }

  const inputStyle = {
    background: '#1a1d24', color: '#f5f5f5', border: '1px solid #2a2d34',
    borderRadius: '8px', padding: '10px 12px', fontSize: '14px', width: '100%',
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>Rate</h1>

      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', color: '#9aa0a6', marginBottom: '4px' }}>Totale da versare</p>
        <p style={{ fontSize: '28px', fontWeight: 'bold' }}>€ {formatEuro(totaleDaVersare)}</p>
      </div>

      <button
        onClick={function() { setShowForm(true); }}
        style={{
          background: '#60a5fa', color: '#0f1115', border: 'none',
          borderRadius: '999px', padding: '12px 20px', fontSize: '14px',
          fontWeight: 'bold', cursor: 'pointer', width: '100%', marginBottom: '20px',
        }}
      >
        + Aggiungi rata
      </button>

      {rate.length === 0 && (
        <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
          Nessuna rata registrata
        </p>
      )}

      {rate.map(function(r, i) {
        const completata = r.numeroRateTotali && r.ratePagate >= r.numeroRateTotali;
        const perc = r.numeroRateTotali ? (r.ratePagate / r.numeroRateTotali) * 100 : 0;
        return (
          <div key={i} style={{ background: '#1a1d24', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>{r.descrizione}</p>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>€ {formatEuro(r.importo)}</p>
            </div>
            <p style={{ fontSize: '12px', color: '#9aa0a6', marginBottom: '8px' }}>
              {r.categoria} · {r.conto} · {r.frequenza}
            </p>
            <p style={{ fontSize: '12px', color: '#9aa0a6', marginBottom: '10px' }}>
              Prossima scadenza: {r.prossimaScadenza} {r.giorniRimanenti ? '(' + r.giorniRimanenti + ')' : ''}
            </p>

            {r.numeroRateTotali && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Rate pagate</p>
                  <p style={{ fontSize: '12px', fontWeight: 'bold' }}>{r.ratePagate} di {r.numeroRateTotali}</p>
                </div>
                <div style={{ background: '#2a2d34', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ background: completata ? '#4ade80' : '#60a5fa', height: '100%', width: Math.min(perc, 100) + '%' }}></div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {!completata && (
                <button
                  onClick={function() { handlePaga(r.rowNumber); }}
                  disabled={loading}
                  style={{ flex: 1, background: '#2a2d34', color: '#f5f5f5', border: 'none', borderRadius: '10px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Segna pagata
                </button>
              )}
              <button
                onClick={function() { handleElimina(r.rowNumber); }}
                disabled={loading}
                style={{ flex: 1, background: '#2a2d34', color: '#f87171', border: 'none', borderRadius: '10px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
              >
                Elimina
              </button>
            </div>
          </div>
        );
      })}

      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={function() { setShowForm(false); }}
        >
          <div
            style={{ background: '#14161b', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px', paddingBottom: '40px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            <div style={{ width: '40px', height: '4px', background: '#3a3d44', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Nuova rata</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Descrizione</label>
                <input type="text" style={inputStyle} value={descrizione} onChange={function(e) { setDescrizione(e.target.value); }} required placeholder="es. iPhone Pro" />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Categoria</label>
                <input type="text" style={inputStyle} value={categoria} onChange={function(e) { setCategoria(e.target.value); }} required placeholder="es. Rate" />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Importo rata (€)</label>
                <input type="number" step="0.01" style={inputStyle} value={importo} onChange={function(e) { setImporto(e.target.value); }} required placeholder="0.00" />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Conto abituale</label>
                <input type="text" style={inputStyle} value={conto} onChange={function(e) { setConto(e.target.value); }} required placeholder="es. Revolut Rate" />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Frequenza</label>
                <select style={inputStyle} value={frequenza} onChange={function(e) { setFrequenza(e.target.value); }}>
                  <option value="Mensile">Mensile</option>
                  <option value="Annuale">Annuale</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Prossima scadenza</label>
                <input type="date"
