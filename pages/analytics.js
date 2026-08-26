import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getSheetData } from '../lib/googleSheets';
import NavBar from '../components/NavBar';

function parseEuro(value) {
  if (!value) return 0;
  const cleaned = String(value).replace('€', '').trim().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseDataIt(value) {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

export async function getServerSideProps() {
  const rows = await getSheetData('Transazioni');
  const dataRows = rows.slice(3);

  const transazioni = dataRows
    .filter(r => r[0] && r[1] && r[2])
    .map(r => ({
      id: r[0],
      data: r[1],
      conto: String(r[2] || '').trim(),
      categoria: String(r[3] || '').trim(),
      sottocategoria: String(r[4] || '').trim(),
      descrizione: r[5] || '',
      importo: parseEuro(r[6]),
      tipo: String(r[7] || '').trim(),
    }));

  return { props: { transazioni } };
}

function formatEuro(n) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Analytics(props) {
  const transazioni = props.transazioni;

  const [filtroConto, setFiltroConto] = useState('Tutti');
  const [filtroCategoria, setFiltroCategoria] = useState('Tutte');
  const [filtroSottocategoria, setFiltroSottocategoria] = useState('Tutte');
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');

  const conti = useMemo(function() {
    const set = new Set(transazioni.map(t => t.conto));
    return ['Tutti'].concat(Array.from(set));
  }, [transazioni]);

  const categorie = useMemo(function() {
    const set = new Set(transazioni.map(t => t.categoria).filter(Boolean));
    return ['Tutte'].concat(Array.from(set));
  }, [transazioni]);

  const sottocategorie = useMemo(function() {
    const filtered = filtroCategoria === 'Tutte'
      ? transazioni
      : transazioni.filter(t => t.categoria === filtroCategoria);
    const set = new Set(filtered.map(t => t.sottocategoria).filter(Boolean));
    return ['Tutte'].concat(Array.from(set));
  }, [transazioni, filtroCategoria]);

  const filtrate = useMemo(function() {
    return transazioni.filter(function(t) {
      if (filtroConto !== 'Tutti' && t.conto !== filtroConto) return false;
      if (filtroCategoria !== 'Tutte' && t.categoria !== filtroCategoria) return false;
      if (filtroSottocategoria !== 'Tutte' && t.sottocategoria !== filtroSottocategoria) return false;

      if (dataInizio || dataFine) {
        const d = parseDataIt(t.data);
        if (!d) return false;
        if (dataInizio && d < new Date(dataInizio)) return false;
        if (dataFine && d > new Date(dataFine)) return false;
      }
      return true;
    });
  }, [transazioni, filtroConto, filtroCategoria, filtroSottocategoria, dataInizio, dataFine]);

  const totaleEntrate = filtrate.filter(t => t.tipo === 'Entrata').reduce((s, t) => s + Math.abs(t.importo), 0);
  const totaleUscite = filtrate.filter(t => t.tipo === 'Uscita').reduce((s, t) => s + Math.abs(t.importo), 0);
  const saldoNetto = totaleEntrate - totaleUscite;

  const selectStyle = {
    background: '#1a1d24',
    color: '#f5f5f5',
    border: '1px solid #2a2d34',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    width: '100%',
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <Link href="/" style={{ fontSize: '13px', color: '#9aa0a6' }}>&larr; Indietro</Link>
      <h1 style={{ fontSize: '22px', margin: '12px 0 20px' }}>Analitiche</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#9aa0a6' }}>Conto</label>
          <select style={selectStyle} value={filtroConto} onChange={function(e) { setFiltroConto(e.target.value); }}>
            {conti.map(function(c, i) { return <option key={i} value={c}>{c}</option>; })}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#9aa0a6' }}>Categoria</label>
          <select style={selectStyle} value={filtroCategoria} onChange={function(e) { setFiltroCategoria(e.target.value); setFiltroSottocategoria('Tutte'); }}>
            {categorie.map(function(c, i) { return <option key={i} value={c}>{c}</option>; })}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#9aa0a6' }}>Sottocategoria</label>
          <select style={selectStyle} value={filtroSottocategoria} onChange={function(e) { setFiltroSottocategoria(e.target.value); }}>
            {sottocategorie.map(function(c, i) { return <option key={i} value={c}>{c}</option>; })}
          </select>
        </div>
        <div></div>
        <div>
          <label style={{ fontSize: '11px', color: '#9aa0a6' }}>Da</label>
          <input type="date" style={selectStyle} value={dataInizio} onChange={function(e) { setDataInizio(e.target.value); }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#9aa0a6' }}>A</label>
          <input type="date" style={selectStyle} value={dataFine} onChange={function(e) { setDataFine(e.target.value); }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1, background: '#1a1d24', borderRadius: '12px', padding: '12px' }}>
          <p style={{ fontSize: '11px', color: '#9aa0a6' }}>Entrate</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ade80' }}>€ {formatEuro(totaleEntrate)}</p>
        </div>
        <div style={{ flex: 1, background: '#1a1d24', borderRadius: '12px', padding: '12px' }}>
          <p style={{ fontSize: '11px', color: '#9aa0a6' }}>Uscite</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#f87171' }}>€ {formatEuro(totaleUscite)}</p>
        </div>
        <div style={{ flex: 1, background: '#1a1d24', borderRadius: '12px', padding: '12px' }}>
          <p style={{ fontSize: '11px', color: '#9aa0a6' }}>Saldo</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: saldoNetto >= 0 ? '#4ade80' : '#f87171' }}>
            € {formatEuro(saldoNetto)}
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: '14px', marginBottom: '10px', color: '#9aa0a6' }}>
        {filtrate.length} transazioni
      </h2>

      {filtrate.map(function(t, i) {
        const isEntrata = t.tipo === 'Entrata';
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2a2d34' }}>
            <div>
              <p style={{ fontSize: '13px' }}>{t.descrizione || t.categoria}</p>
              <p style={{ fontSize: '11px', color: '#9aa0a6' }}>
                {t.data} - {t.conto} - {t.categoria}{t.sottocategoria ? ' / ' + t.sottocategoria : ''}
              </p>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 'bold', color: isEntrata ? '#4ade80' : '#f87171' }}>
              {isEntrata ? '+' : '-'}€ {formatEuro(Math.abs(t.importo))}
            </p>
          </div>
        );
      })}

      {filtrate.length === 0 && (
        <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
          Nessuna transazione trovata con questi filtri
        </p>
      )}

      <NavBar />
    </div>
  );
}
