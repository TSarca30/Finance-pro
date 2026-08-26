import { getSheetData, updateRange } from '../../lib/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const rows = await getSheetData('Transazioni');

    let targetRowIndex = -1;
    for (let i = 3; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      return res.status(400).json({ success: false, error: 'Nessuna riga libera disponibile nel foglio' });
    }

    const sheetRowNumber = targetRowIndex + 1;
    const range = 'Transazioni!B' + sheetRowNumber + ':I' + sheetRowNumber;

    const importoConSegno = body.tipo === 'Uscita' ? -Math.abs(body.importo) : Math.abs(body.importo);

    await updateRange(range, [
      body.data,
      body.conto,
      body.categoria,
      body.sottocategoria || '',
      body.descrizione || '',
      importoConSegno,
      body.tipo,
      body.note || '',
    ]);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
