import { getSheetData } from '../lib/googleSheets';

function parseEuro(value) {
  if (!value) return 0;
  const cleaned = value.replace('€', '').trim().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function getServerSideProps() {
  const rows = await getSheetData('Saldi_Conti');
  const dataRows = rows.slice(4); // salta titolo, riga vuota, nota, intestazioni

  const conti = dataRows
    .filter(r => r[0])
    .map(r => ({
      nome: r[0],
      banca: r[1],
      tipo: r[2],
      saldo: parseEuro(r[3]),
    }));

  const liquido = conti
    .filter(c => c.tipo === 'Corrente' || c.tipo === 'Deposito')
    .reduce((sum, c) => sum + c.saldo, 0);

  const investito = conti
    .filter(c => c.tipo === 'Investimento')
    .reduce((sum, c) => sum + c.saldo, 0);

  const totale = liquido + investito;

  return {
    props: { conti, liquido, investito, totale },
  };
}

function formatEuro(n) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Home({ conti, liquido, investito, totale }) {
  return (
    <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>💰 Finanze Personali</h1>

      <div style={{
        background: '#1a1d24',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <p style={{ fontSize: '13px', color: '#9aa0a6', marginBottom: '4px' }}>
          Patrimonio Totale
        </p>
        <p style={{ fontSize: '32px', fontWeight: 'bold' }}>
          € {formatEuro(totale)}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: '#1a1d24', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Liquido</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>€ {formatEuro(liquido)}</p>
        </div>
        <div style={{ flex: 1, background: '#1a1d24', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Investito</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>€ {formatEuro(investito)}</p>
        </div>
      </div>

      <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#9aa0a6' }}>I tuoi conti</h2>
      {conti.map((c, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px solid #2a2d34'
        }}>
          <div>
            <p style={{ fontSize: '14px' }}>{c.nome}</p>
            <p style={{ fontSize: '12px', color: '#9aa0a6' }}>{c.banca} · {c.tipo}</p>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 'bold' }}>€ {formatEuro(c.saldo)}</p>
        </div>
      ))}
    </div>
  );
}
