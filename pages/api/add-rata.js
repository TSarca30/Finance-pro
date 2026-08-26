import { getSheetData, updateRange } from '../../lib/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const rows = await getSheetData('Scadenze');

    let targetRowIndex = -1;
    for (let i = 5; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      return res.status(400).json({ success: false, error: 'Nessuna riga libera disponibile nel foglio' });
    }

    const sheetRowNumber = targetRowIndex + 1;
    const range = 'Scadenze!A' + sheetRowNumber + ':J' + sheetRowNumber;

    await updateRange(range, [
      body.descrizione,
      body.importo,
      body.categoria,
      body.conto,
      body.frequenza,
      body.prossimaScadenza,
      '',
      '',
      body.numeroRateTotali,
      0,
    ]);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
