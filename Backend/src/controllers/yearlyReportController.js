import { buildYearlyReport } from '../services/yearlyReportService.js';
import { buildYearlyReportCard } from '../services/shareCardService.js';

const resolveYear = (param) => {
  const year = parseInt(param, 10);
  const currentYear = new Date().getFullYear();
  if (!year || year < 2000 || year > currentYear + 1) return currentYear;
  return year;
};

export const getYearlyReport = async (req, res) => {
  try {
    const year = resolveYear(req.params.year);
    const report = await buildYearlyReport(req.user._id, year);
    return res.json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getYearlyReportCard = async (req, res) => {
  try {
    const year = resolveYear(req.params.year);
    const report = await buildYearlyReport(req.user._id, year);
    const svg = buildYearlyReportCard({ name: req.user.name, ...report });

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'private, max-age=3600');
    return res.send(svg);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export default { getYearlyReport, getYearlyReportCard };
