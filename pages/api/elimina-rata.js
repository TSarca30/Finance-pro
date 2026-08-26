import { clearRange } from '../../lib/googleSheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const rowNumber = body.rowNumber;
    const range = 'Scadenze!A' + rowNumber + ':K' + rowNumber;

    await clearRange(range);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
