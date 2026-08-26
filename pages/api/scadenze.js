import { getSheetData } from '../../lib/googleSheets';

export default async function handler(req, res) {
  try {
    const rows = await getSheetData('Scadenze');
    res.status(200).json({ success: true, rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
