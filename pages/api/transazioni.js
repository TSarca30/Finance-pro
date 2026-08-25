import { getSheetData } from '../../lib/googleSheets';

export default async function handler(req, res) {
  try {
    const rows = await getSheetData('Transazioni');
    res.status(200).json({ success: true, rows: rows.slice(0, 15) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
