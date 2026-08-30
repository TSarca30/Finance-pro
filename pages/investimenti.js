import NavBar from '../components/NavBar';
import { getSheetData } from '../lib/googleSheets';

function parseEuro(value) {
  if (!value) return 0;
  const cleaned = String(value).replace('€', '').trim().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parsePercent(value) {
  if (!value) return 0;
  const cleaned = String(value).replace('%', '').trim().replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function getServerSideProps() {
  const rows = await getSheetData('Investimenti');

  const acquisti = [];
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0] || !row[1]) continue;
    acquisti.push({
      data: row[0],
      conto: row[1],
      descrizione: row[2] || '',
      quote: row[3] || '',
      prezzoUnitario: parseEuro(row[4]),
      importo: parseEuro(row[5]),
    });
  }

  const riepilogo = [];
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[7] || row[7] === 'TOTALE COMPLESSIVO') continue;
    riepilogo.push({
      conto: row[7],
      quote: row[8] || '',
      totInvestito: parseEuro(row[9]),
      valoreAttuale: parseEuro(row[10]),
      plusMinus: parseEuro(row[11]),
      rendimento: parsePercent(row[12]),
    });
  }

  const totaleInvestito = riepilogo.reduce(function(s, r) { return s + r.totInvestito; }, 0);
  const totaleValoreAttuale = riepilogo.reduce(function(s, r) { return s + r.valoreAttuale; }, 0);
  const totalePlusMinus = totaleValoreAttuale - totaleInvestito;
  const rendimentoMedio = totaleInvestito > 0 ? (totalePlusMinus / totaleInvestito) * 100 : 0;

  acquisti.reverse();

  return {
    props: { acquisti, riepilogo, totaleInvestito, totaleValoreAttuale, totalePlusMinus, rendimentoMedio },
  };
}

function formatEuro(n) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(n) {
  const sign = n >= 0 ? '+' : '';
  return sign + n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

export default function Investimenti(props) {
  const acquisti = props.acquisti;
  const riepilogo = props.riepilogo;
  const totaleInvestito = props.totaleInvestito;
  const totaleValoreAttuale = props.totaleValoreAttuale;
  const totalePlusMinus = props.totalePlusMinus;
  const rendimentoMedio = props.rendimentoMedio;

  const positivo = rendimentoMedio >= 0;

  return (
    <div style={{ padding: '24px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>Investimenti</h1>

      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', color: '#9aa0a6', marginBottom: '4px' }}>Valore Attuale</p>
        <p style={{ fontSize: '30px', fontWeight: 'bold' }}>€ {formatEuro(totaleValoreAttuale)}</p>
        <p style={{ fontSize: '13px', color: positivo ? '#4ade80' : '#f87171', marginTop: '6px' }}>
          {positivo ? '+' : ''}€ {formatEuro(totalePlusMinus)} ({formatPercent(rendimentoMedio)})
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: '#1a1d24', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Capitale investito</p>
          <p style={{ fontSize: '17px', fontWeight: 'bold' }}>€ {formatEuro(totaleInvestito)}</p>
        </div>
        <div style={{ flex: 1, background: '#1a1d24', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Guadagno</p>
          <p style={{ fontSize: '17px', fontWeight: 'bold', color: positivo ? '#4ade80' : '#f87171' }}>
            {positivo ? '+' : ''}€ {formatEuro(totalePlusMinus)}
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#9aa0a6' }}>Per conto</h2>
      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
        {riepilogo.map(function(r, i) {
          const rPositivo = r.rendimento >= 0;
          return (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < riepilogo.length - 1 ? '1px solid #2a2d34' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{r.conto}</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>€ {formatEuro(r.valoreAttuale)}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                <p style={{ fontSize: '11px', color: '#9aa0a6' }}>Capitale: € {formatEuro(r.totInvestito)}</p>
                <p style={{ fontSize: '11px', color: rPositivo ? '#4ade80' : '#f87171' }}>
                  {rPositivo ? '+' : ''}€ {formatEuro(r.plusMinus)} ({formatPercent(r.rendimento)})
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#9aa0a6' }}>Storico acquisti</h2>
      {acquisti.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
          Nessun acquisto registrato
        </p>
      ) : null}
      {acquisti.map(function(a, i) {
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #2a2d34' }}>
            <div>
              <p style={{ fontSize: '13px' }}>{a.descrizione || a.conto}</p>
              <p style={{ fontSize: '11px', color: '#9aa0a6' }}>{a.data} - {a.conto}</p>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 'bold' }}>€ {formatEuro(a.importo)}</p>
          </div>
        );
      })}

      <NavBar />
    </div>
  );
}
