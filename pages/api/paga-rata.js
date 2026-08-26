import { getSheetData, updateRange } from '../../lib/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const rowNumber = body.rowNumber;
    const rows = await getSheetData('Scadenze');
    const row = rows[rowNumber - 1];

    const ratePagateAttuali = parseInt(row[9]) || 0;
    const nuoveRatePagate = ratePagateAttuali + 1;

    await updateRange('Scadenze!J' + rowNumber, [nuoveRatePagate]);

    res.status(200).json({ success: true, ratePagate: nuoveRatePagate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
