import { useState } from 'react';
import NavBar from '../components/NavBar';
import { getSheetData } from '../lib/googleSheets';

export async function getServerSideProps() {
  const catRows = await getSheetData('Categorie');
  const saldiRows = await getSheetData('Saldi_Conti');

  const categorieMap = {};
  for (let i = 4; i < catRows.length; i++) {
    const row = catRows[i];
    if (!row || !row[0]) continue;
    const cat = row[0];
    const sub = row[1] || '';
    if (!categorieMap[cat]) categorieMap[cat] = [];
    if (sub && categorieMap[cat].indexOf(sub) === -1) categorieMap[cat].push(sub);
  }

  const conti = [];
  for (let i = 4; i < saldiRows.length; i++) {
    const row = saldiRows[i];
    if (!row || !row[0]) continue;
    conti.push(row[0]);
  }

  return { props: { categorieMap: categorieMap, conti: conti } };
}

function oggiIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function formatDateForSheet(isoDate) {
  const parts = isoDate.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

export default function Transazioni(props) {
  const categorieMap = props.categorieMap;
  const conti = props.conti;
  const categorie = Object.keys(categorieMap);

  const [showPanel, setShowPanel] = useState(false);
  const [tipoForm, setTipoForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [importo, setImporto] = useState('');
  const [data, setData] = useState(oggiIso());
  const [conto, setConto] = useState(conti[0] || '');
  const [categoria, setCategoria] = useState(categorie[0] || '');
  const [sottocategoria, setSottocategoria] = useState('');
  const [tipoMovimento, setTipoMovimento] = useState('Uscita');
  const [nota, setNota] = useState('');

  const sottocategorieDisponibili = categorieMap[categoria] || [];

  function handleCategoriaChange(e) {
    const nuovaCategoria = e.target.value;
    setCategoria(nuovaCategoria);
    setSottocategoria('');
  }

  function openPanel() {
    setShowPanel(true);
  }

  function closePanel() {
    setShowPanel(false);
  }

  function selezionaSpesa() {
    setTipoForm('spesa');
    setShowPanel(false);
  }

  function selezionaInvestimento() {
    setTipoForm('investimento');
    setShowPanel(false);
  }

  function selezionaRata() {
    setTipoForm('rata');
    setShowPanel(false);
  }

  function chiudiForm() {
    setTipoForm(null);
    setSuccess(false);
  }

  async function handleSubmitSpesa(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/add-transazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: formatDateForSheet(data),
          conto: conto,
          categoria: categoria,
          sottocategoria: sottocategoria,
          descrizione: nota,
          importo: parseFloat(importo),
          tipo: tipoMovimento,
          note: '',
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        setImporto('');
        setNota('');
      } else {
        alert('Errore: ' + result.error);
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

  function stopClick(e) {
    e.stopPropagation();
  }

  const optionStyle = {
    background: '#1a1d24',
    borderRadius: '16px',
    padding: '18px',
    marginBottom: '12px',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    color: '#f5f5f5',
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>Transazioni</h1>

      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', marginBottom: '16px' }}>Inserisci la tua spesa in un TAP</p>
        <button
          onClick={openPanel}
          style={{
            background: '#60a5fa',
            color: '#0f1115',
            border: 'none',
            borderRadius: '999px',
            padding: '12px 28px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          + Aggiungi
        </button>
      </div>

      {showPanel ? (
        <div style={overlayStyle} onClick={closePanel}>
          <div style={sheetStyle} onClick={stopClick}>
            <div style={{ width: '40px', height: '4px', background: '#3a3d44', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Cosa vuoi aggiungere?</h2>
            <p style={{ fontSize: '13px', color: '#9aa0a6', marginBottom: '20px' }}>Scegli il tipo di spesa da tracciare.</p>

            <button style={optionStyle} onClick={selezionaSpesa}>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>Spesa Giornaliera</p>
              <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Una spesa singola di oggi o di un giorno specifico</p>
            </button>

            <button style={optionStyle} onClick={selezionaInvestimento}>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>Investimenti</p>
              <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Acquisto ETF o rientro Safeback</p>
            </button>

            <button style={optionStyle} onClick={selezionaRata}>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>Rata</p>
              <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Nuovo promemoria di pagamento ricorrente</p>
            </button>
          </div>
        </div>
      ) : null}

      {tipoForm === 'spesa' ? (
        <div style={overlayStyle} onClick={chiudiForm}>
          <div style={sheetStyle} onClick={stopClick}>
            <div style={{ width: '40px', height: '4px', background: '#3a3d44', borderRadius: '2px', margin: '0 auto 20px' }}></div>

            {success ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '18px', marginBottom: '16px' }}>Spesa salvata correttamente</p>
                <button
                  onClick={chiudiForm}
                  style={{ background: '#60a5fa', color: '#0f1115', border: 'none', borderRadius: '999px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Chiudi
                </button>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Nuova spesa</h2>

                <form onSubmit={handleSubmitSpesa}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Importo (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      style={inputStyle}
                      value={importo}
                      onChange={function(e) { setImporto(e.target.value); }}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Tipo</label>
                    <select
                      style={inputStyle}
                      value={tipoMovimento}
                      onChange={function(e) { setTipoMovimento(e.target.value); }}
                    >
                      <option value="Uscita">Uscita</option>
                      <option value="Entrata">Entrata</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Data</label>
                    <input
                      type="date"
                      style={inputStyle}
                      value={data}
                      onChange={function(e) { setData(e.target.value); }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Conto</label>
                    <select
                      style={inputStyle}
                      value={conto}
                      onChange={function(e) { setConto(e.target.value); }}
                    >
                      {conti.map(function(c, i) {
                        return <option key={i} value={c}>{c}</option>;
                      })}
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Categoria</label>
                    <select
                      style={inputStyle}
                      value={categoria}
                      onChange={handleCategoriaChange}
                    >
                      {categorie.map(function(c, i) {
                        return <option key={i} value={c}>{c}</option>;
                      })}
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Sottocategoria</label>
                    <select
                      style={inputStyle}
                      value={sottocategoria}
                      onChange={function(e) { setSottocategoria(e.target.value); }}
                    >
                      <option value="">-</option>
                      {sottocategorieDisponibili.map(function(s, i) {
                        return <option key={i} value={s}>{s}</option>;
                      })}
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', color: '#9aa0a6' }}>Nota (opzionale)</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={nota}
                      onChange={function(e) { setNota(e.target.value); }}
                      placeholder="es. spesa al supermercato"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ background: '#60a5fa', color: '#0f1115', border: 'none', borderRadius: '999px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                  >
                    {loading ? 'Salvataggio...' : 'Salva'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tipoForm === 'investimento' ? (
        <div style={overlayStyle} onClick={chiudiForm}>
          <div style={sheetStyle} onClick={stopClick}>
            <div style={{ width: '40px', height: '4px', background: '#3a3d44', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>Form Investimenti in arrivo nel prossimo passo</p>
          </div>
        </div>
      ) : null}

      {tipoForm === 'rata' ? (
        <div style={overlayStyle} onClick={chiudiForm}>
          <div style={sheetStyle} onClick={stopClick}>
            <div style={{ width: '40px', height: '4px', background: '#3a3d44', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', marginBottom: '16px' }}>
              Per aggiungere una rata, vai alla pagina Rate
            </p>
            
              href="/rate"
              style={{ display: 'block', background: '#60a5fa', color: '#0f1115', textAlign: 'center', borderRadius: '999px', padding: '12px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}
            >
              Vai a Rate →
            </a>
          </div>
        </div>
      ) : null}

      <NavBar />
    </div>
  );
}
