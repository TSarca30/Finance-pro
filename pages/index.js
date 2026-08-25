import { useState } from 'react';
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
  const saldiRows = await getSheetData('Saldi_Conti');
  const investRows = await getSheetData('Investimenti');

  const contiData = saldiRows.slice(4).filter(r => r[0]);
  const conti = contiData.map(r => ({
    nome: r[0],
    banca: r[1],
    tipo: r[2],
    saldo: parseEuro(r[3]),
  }));

  const contiLiquidi = conti.filter(c => c.tipo === 'Corrente' || c.tipo === 'Deposito');
  const liquido = contiLiquidi.reduce((sum, c) => sum + c.saldo, 0);

  const investSummaryRows = investRows.slice(4).filter(r => r[7] && r[7] !== 'TOTALE COMPLESSIVO');
  const investimenti = investSummaryRows.map(r => ({
    conto: r[7],
    quote: r[8],
    totInvestito: parseEuro(r[9]),
    valoreAttuale: parseEuro(r[10]),
    plusMinus: parseEuro(r[11]),
    rendimento: parsePercent(r[12]),
  }));

  const totaleInvestito = investimenti.reduce((s, i) => s + i.totInvestito, 0);
  const totaleValoreAttuale = investimenti.reduce((s, i) => s + i.valoreAttuale, 0);
  const rendimentoMedio = totaleInvestito > 0
    ? ((totaleValoreAttuale - totaleInvestito) / totaleInvestito) * 100
    : 0;

  const totale = liquido + totaleValoreAttuale;

  return {
    props: { contiLiquidi, liquido, investimenti, totaleInvestito, totaleValoreAttuale, rendimentoMedio, totale },
  };
}

function formatEuro(n) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(n) {
  const sign = n >= 0 ? '+' : '';
  return sign + n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

export default function Home(props) {
  const contiLiquidi = props.contiLiquidi;
  const investimenti = props.investimenti;
  const liquido = props.liquido;
  const totaleInvestito = props.totaleInvestito;
  const totaleValoreAttuale = props.totaleValoreAttuale;
  const rendimentoMedio = props.rendimentoMedio;
  const totale = props.totale;

  const [openLiquido, setOpenLiquido] = useState(false);
  const [openInvestito, setOpenInvestito] = useState(false);

  const positivo = rendimentoMedio >= 0;

  return (
    <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>Finanze Personali</h1>

      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', color: '#9aa0a6', marginBottom: '4px' }}>Patrimonio Totale</p>
        <p style={{ fontSize: '32px', fontWeight: 'bold' }}>€ {formatEuro(totale)}</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div onClick={function() { setOpenLiquido(!openLiquido); }} style={{ flex: 1, background: '#1a1d24', borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Liquido</p>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{openLiquido ? '▲' : '▼'}</span>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>€ {formatEuro(liquido)}</p>
        </div>

        <div onClick={function() { setOpenInvestito(!openInvestito); }} style={{ flex: 1, background: '#1a1d24', borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Investito</p>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{openInvestito ? '▲' : '▼'}</span>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>€ {formatEuro(totaleValoreAttuale)}</p>
          <p style={{ fontSize: '11px', color: positivo ? '#4ade80' : '#f87171', marginTop: '2px' }}>
            € {formatEuro(totaleInvestito)} cap. - {formatPercent(rendimentoMedio)}
          </p>
        </div>
      </div>

      {openLiquido && (
        <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
          {contiLiquidi.map(function(c, i) {
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < contiLiquidi.length - 1 ? '1px solid #2a2d34' : 'none' }}>
                <div>
                  <p style={{ fontSize: '14px' }}>{c.nome}</p>
                  <p style={{ fontSize: '11px', color: '#9aa0a6' }}>{c.banca} - {c.tipo}</p>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>€ {formatEuro(c.saldo)}</p>
              </div>
            );
          })}
        </div>
      )}

      {openInvestito && (
        <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
          {investimenti.map(function(inv, i) {
            const invPositivo = inv.rendimento >= 0;
            return (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < investimenti.length - 1 ? '1px solid #2a2d34' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{inv.conto}</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold' }}>€ {formatEuro(inv.valoreAttuale)}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <p style={{ fontSize: '11px', color: '#9aa0a6' }}>Capitale: € {formatEuro(inv.totInvestito)}</p>
                  <p style={{ fontSize: '11px', color: invPositivo ? '#4ade80' : '#f87171' }}>{formatPercent(inv.rendimento)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ fontSize: '16px', marginTop: '24px', marginBottom: '12px', color: '#9aa0a6' }}>Analitiche</h2>
      <div style={{ background: '#1a1d24', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>In arrivo nel prossimo passo</p>
      </div>
    </div>
  );
}
