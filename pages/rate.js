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
    if (row[0].indexOf('Totale') === 0) continue;
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

    function parseDataItToIcs(dataStr) {
    const parts = dataStr.split('/');
    if (parts.length !== 3) return null;
    return parts[2] + parts[1] + parts[0];
  }

  function handleAddCalendar(r) {
    const dataIcs = parseDataItToIcs(r.prossimaScadenza);
    if (!dataIcs) {
      alert('Data non valida per questa rata');
      return;
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FinanzePersonali//Rate//IT',
      'BEGIN:VEVENT',
      'UID:' + r.rowNumber + '-' + dataIcs + '@finanzepersonali',
      'DTSTAMP:' + dataIcs + 'T090000Z',
      'DTSTART;VALUE=DATE:' + dataIcs,
      'DTEND;VALUE=DATE:' + dataIcs,
      'SUMMARY:' + r.descrizione + ' - Rata € ' + formatEuro(r.importo),
      'DESCRIPTION:Pagamento rata ' + r.descrizione + ' su ' + r.conto,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Promemoria rata',
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = r.descrizione.replace(/\s+/g, '_') + '.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  function handleDescrizioneChange(e) {
    setDescrizione(e.target.value);
  }

  function handleCategoriaChange(e) {
    setCategoria(e.target.value);
  }

  function handleImportoChange(e) {
    setImporto(e.target.value);
  }

  function handleContoChange(e) {
    setConto(e.target.value);
  }

  function handleFrequenzaChange(e) {
    setFrequenza(e.target.value);
  }

  function handleDataChange(e) {
    setProssimaScadenza(e.target.value);
  }

  function handleNumeroRateChange(e) {
    setNumeroRateTotali(e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/add-rata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descrizione: descrizione,
          categoria: categoria,
          importo: parseFloat(importo),
          conto: conto,
          frequenza: frequenza,
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
        body: JSON.stringify({ rowNumber: rowNumber }),
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
        body: JSON.stringify({ rowNumber: rowNumber }),
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
    background: '#1a1d24',
    color: '#f5f5f5',
    border: '1px solid #2a2d34',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    width: '100%',
  };

  const pageStyle = {
    padding: '24px',
    paddingBottom: '100px',
    maxWidth: '480px',
    margin: '0 auto',
    fontFamily: '-apple-system, sans-serif',
  };

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 100,
  };

  const sheetStyle = {
    background: '#14161b',
    borderRadius: '24px 24px 0 0',
    padding: '24px',
    width: '100%',
    maxWidth: '480px',
    paddingBottom: '40px',
    maxHeight: '85vh',
    overflowY: 'auto',
  };

  function closeOverlay() {
    setShowForm(false);
  }

  function stopClick(e) {
    e.stopPropagation();
  }

  function openForm() {
    setShowForm(true);
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>Rate</h1>

      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', color: '#9aa0a6', marginBottom: '4px' }}>Totale da versare</p>
        <p style={{ fontSize: '28px', fontWeight: 'bold' }}>€ {formatEuro(totaleDaVersare)}</p>
      </div>

      <button
        onClick={openForm}
        style={{
          background: '#60a5fa',
          color: '#0f1115',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: '100%',
          marginBottom: '20px',
        }}
      >
        + Aggiungi rata
      </button>

      {rate.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
          Nessuna rata registrata
        </p>
      ) : null}

      {rate.map(function(r, i) {
        const completata = r.numeroRateTotali && r.ratePagate >= r.numeroRateTotali;
        const perc = r.numeroRateTotali ? (r.ratePagate / r.numeroRateTotali) * 100 : 0;
        const percClamped = perc > 100 ? 100 : perc;

        function pagaClick() {
          handlePaga(r.rowNumber);
        }

        function eliminaClick() {
          handleElimina(r.rowNumber);
        }

        return (
          <div key={i} style={{ background: '#1a1d24', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>{r.descrizione}</p>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>€ {formatEuro(r.importo)}</p>
            </div>
            <p style={{ fontSize: '12px', color: '#9aa0a6', marginBottom: '8px' }}>
              {r.categoria} - {r.conto} - {r.frequenza}
            </p>
            <p style={{ fontSize: '12px', color: '#9aa0a6', marginBottom: '10px' }}>
              Prossima scadenza: {r.prossimaScadenza} {r.giorniRimanenti ? '(' + r.giorniRimanenti + ')' : ''}
            </p>

            {r.numeroRateTotali ? (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Rate pagate</p>
                  <p style={{ fontSize: '12px', fontWeight: 'bold' }}>{r.ratePagate} di {r.numeroRateTotali}</p>
                </div>
                <div style={{ background: '#2a2d34', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ background: completata ? '#4ade80' : '#60a5fa', height: '100%', width: percClamped + '%' }}></div>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {!completata ? (
                <button
                  onClick={pagaClick}
                  disabled={loading}
                  style={{ flex: 1, background: '#2a2d34', color: '#f5f5f5', border: 'none', borderRadius: '10px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Segna pagata
                </button>
              ) : null}
              <button
                onClick={function() { handleAddCalendar(r); }}
                style={{ flex: 1, background: '#2a2d34', color: '#60a5fa', border: 'none', borderRadius: '10px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
              >
                📅 Calendario
              </button>
              <button
                onClick={eliminaClick}
                disabled={loading}
                style={{ flex: 1, background: '#2a2d34', color: '#f87171', border: 'none', borderRadius: '10px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
              >
                Elimina
              </button>
            </div>
          </div>
        );
      })}

      {showForm ? (
        <div style={overlayStyle} onClick={closeOverlay}>
          <div style={sheetStyle} onClick={stopClick}>
            <div style={{ width: '40px', height: '4px', background: '#3a3d44', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Nuova rata</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>
                  Descrizione
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={descrizione}
                  onChange={handleDescrizioneChange}
                  required
                  placeholder="es. iPhone Pro"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>
                  Categoria
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={categoria}
                  onChange={handleCategoriaChange}
                  required
                  placeholder="es. Rate"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>
                  Importo rata (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  style={inputStyle}
                  value={importo}
                  onChange={handleImportoChange}
                  required
                  placeholder="0.00"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>
                  Conto abituale
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={conto}
                  onChange={handleContoChange}
                  required
                  placeholder="es. Revolut Rate"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>
                  Frequenza
                </label>
                <select
                  style={inputStyle}
                  value={frequenza}
                  onChange={handleFrequenzaChange}
                >
                  <option value="Mensile">Mensile</option>
                  <option value="Annuale">Annuale</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>
                  Prossima scadenza
                </label>
                <input
                  type="date"
                  style={inputStyle}
                  value={prossimaScadenza}
                  onChange={handleDataChange}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#9aa0a6' }}>
                  Numero rate totali (opzionale)
                </label>
                <input
                  type="number"
                  style={inputStyle}
                  value={numeroRateTotali}
                  onChange={handleNumeroRateChange}
                  placeholder="es. 12"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ background: '#60a5fa', color: '#0f1115', border: 'none', borderRadius: '999px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
              >
                {loading ? 'Salvataggio...' : 'Salva rata'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <NavBar />
    </div>
  );
}
