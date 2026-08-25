export default function Home() {
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
          € 4.790,21
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{
          flex: 1,
          background: '#1a1d24',
          borderRadius: '16px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Liquido</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>€ 3.686,00</p>
        </div>
        <div style={{
          flex: 1,
          background: '#1a1d24',
          borderRadius: '16px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#9aa0a6' }}>Investito</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>€ 1.104,21</p>
        </div>
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: '#666' }}>
        (dati di esempio — presto collegati al tuo Google Sheet)
      </p>
    </div>
  );
}
