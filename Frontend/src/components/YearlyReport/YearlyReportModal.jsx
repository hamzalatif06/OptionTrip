import React, { useEffect, useState } from 'react';
import { getYearlyReport, getYearlyReportCardSvg } from '../../services/yearlyReportService';
import './YearlyReportModal.css';

const currentYear = new Date().getFullYear();

const YearlyReportModal = ({ onClose }) => {
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState(null);
  const [cardSvg, setCardSvg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getYearlyReport(year), getYearlyReportCardSvg(year)]).then(([reportRes, svg]) => {
      if (cancelled) return;
      if (reportRes?.success) setReport(reportRes.data);
      setCardSvg(svg);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year]);

  const handleDownload = () => {
    if (!cardSvg) return;
    const blob = new Blob([cardSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optiontrip-${year}-travel-report.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="yr-overlay" onClick={onClose}>
      <div className="yr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="yr-header">
          <div className="yr-header__year-picker">
            <button type="button" onClick={() => setYear((y) => y - 1)} disabled={year <= 2020}>‹</button>
            <h3>Your {year} Travel Report</h3>
            <button type="button" onClick={() => setYear((y) => y + 1)} disabled={year >= currentYear}>›</button>
          </div>
          <button className="yr-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="yr-body">
          {loading ? (
            <p className="yr-loading">Building your report…</p>
          ) : !report?.hasActivity ? (
            <p className="yr-empty">No travel activity recorded for {year} yet.</p>
          ) : (
            <>
              <div className="yr-stats">
                <div className="yr-stat"><span className="yr-stat__val">{report.countriesVisited}</span><span className="yr-stat__label">Countries</span></div>
                <div className="yr-stat"><span className="yr-stat__val">{report.citiesVisited}</span><span className="yr-stat__label">Cities</span></div>
                <div className="yr-stat"><span className="yr-stat__val">{report.routesTraveled}</span><span className="yr-stat__label">Trips</span></div>
                <div className="yr-stat"><span className="yr-stat__val">{report.tripStoriesCreated}</span><span className="yr-stat__label">Tips shared</span></div>
              </div>

              <div className="yr-highlights">
                {report.mostVisitedCountry && <p>🌍 Most visited: <strong>{report.mostVisitedCountry}</strong></p>}
                {report.longestTrip && <p>🧳 Longest trip: <strong>{report.longestTrip.destination}</strong> ({report.longestTrip.days} days)</p>}
                {report.favoriteDestination && <p>❤️ Favorite destination: <strong>{report.favoriteDestination}</strong></p>}
              </div>

              {cardSvg && (
                <div className="yr-card-preview" dangerouslySetInnerHTML={{ __html: cardSvg }} />
              )}

              <button type="button" className="yr-download-btn" onClick={handleDownload} disabled={!cardSvg}>
                Download share card
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default YearlyReportModal;
