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
  const rows = await getSheetData('Budget_Obiettivi');

  const budgets = [];
  for (let i = 5; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0] || row[0] === 'Categoria') continue;
    budgets.push({
      categoria: row[0],
      mese: row[1] || '',
      budgetMensile: parseEuro(row[2]),
      speso: parseEuro(row[3]),
      percUsato: parsePercent(row[4]),
      stato: row[5] || '',
    });
  }

  const obiettivi = [];
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[7] || row[7] === 'Obiettivo') continue;
    obiettivi.push({
      nome: row[7],
      importoTarget: parseEuro(row[8]),
      importoAttuale: parseEuro(row[9]),
      dataTarget: row[10] || '',
      percRaggiunto: parsePercent(row[11]),
    });
  }

  const totaleBudget = rows[2] ? parseEuro(rows[2][1]) : 0;
  const totaleSpeso = rows[3] ? parseEuro(rows[3][1]) : 0;
  const percTotaleUsato = rows[4] ? parsePercent(rows[4][1]) : 0;

  return {
    props: { budgets, obiettivi, totaleBudget, totaleSpeso, percTotaleUsato },
  };
}

function formatEuro(n) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Budget(props) {
  const budgets = props.budgets;
  const obiettivi = props.obiettivi;
  const totaleBudget = props.totaleBudget;
  const totaleSpeso = props.totaleSpeso;
  const percTotaleUsato = props.percTotaleUsato;

  return (
    <div style={{ padding: '24px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>Budget & Obiettivi</h1>

      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: '#9aa0a6', marginBottom: '4px' }}>Budget mese corrente</p>
        <p style={{ fontSize: '28px', fontWeight: 'bold' }}>€ {formatEuro(totaleSpeso)} <span style={{ fontSize: '15px', color: '#9aa0a6', fontWeight: 'normal' }}>/ € {formatEuro(totaleBudget)}</span></p>
        <div style={{ background: '#2a2d34', borderRadius: '4px', height: '6px', overflow: 'hidden', marginTop: '10px' }}>
          <div style={{ background: percTotaleUsato > 90 ? '#f87171' : '#60a5fa', height: '100%', width: Math.min(percTotaleUsato, 100) + '%' }}></div>
        </div>
        <p style={{ fontSize: '12px', color: '#9aa0a6', marginTop: '6px' }}>{percTotaleUsato.toFixed(2)}% usato</p>
      </div>

      <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#9aa0a6' }}>Budget per categoria</h2>
      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
        {budgets.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>Nessun budget impostato</p>
        ) : null}
        {budgets.map(function(b, i) {
          const oltre = b.percUsato > 100;
          return (
            <div key={i} style={{ marginBottom: i < budgets.length - 1 ? '16px' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{b.categoria}</p>
                <p style={{ fontSize: '13px' }}>€ {formatEuro(b.speso)} / € {formatEuro(b.budgetMensile)}</p>
              </div>
              <div style={{ background: '#2a2d34', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ background: oltre ? '#f87171' : '#4ade80', height: '100%', width: Math.min(b.percUsato, 100) + '%' }}></div>
              </div>
              <p style={{ fontSize: '11px', color: '#9aa0a6', marginTop: '4px' }}>{b.percUsato.toFixed(2)}% - {b.stato}</p>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#9aa0a6' }}>Obiettivi di risparmio</h2>
      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '16px' }}>
        {obiettivi.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>Nessun obiettivo impostato</p>
        ) : null}
        {obiettivi.map(function(o, i) {
          return (
            <div key={i} style={{ marginBottom: i < obiettivi.length - 1 ? '16px' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{o.nome}</p>
                <p style={{ fontSize: '13px' }}>€ {formatEuro(o.importoAttuale)} / € {formatEuro(o.importoTarget)}</p>
              </div>
              <div style={{ background: '#2a2d34', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ background: '#60a5fa', height: '100%', width: Math.min(o.percRaggiunto, 100) + '%' }}></div>
              </div>
              <p style={{ fontSize: '11px', color: '#9aa0a6', marginTop: '4px' }}>{o.percRaggiunto.toFixed(2)}% - Entro {o.dataTarget}</p>
            </div>
          );
        })}
      </div>

      <NavBar />
    </div>
  );
}
