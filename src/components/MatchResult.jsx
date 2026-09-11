import React from 'react';

export function MatchResult({ result, cvFileName }) {
  if (!result) return null;

  const isCoverLetter =
    cvFileName?.toLowerCase().includes('bewerbung') ||
    cvFileName?.toLowerCase().includes('anschreiben');

  const getScoreBadgeStyle = (score) => {
    if (score >= 75) return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' };
    if (score >= 40) return { bg: '#fff3cd', color: '#856404', border: '#ffeeba' };
    return { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' };
  };

  const badgeStyle = getScoreBadgeStyle(result.score);

  return (
    <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
      {isCoverLetter && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', borderRadius: '6px', marginBottom: '20px' }}>
          ⚠️ <strong>Hinweis:</strong> Die hochgeladene Datei (<em>{cvFileName}</em>) scheint ein Anschreiben zu sein. Für präzise Analysen wird ein strukturierter Lebenslauf empfohlen.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Match-Ergebnis</h3>
        <span
          style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            padding: '6px 16px',
            borderRadius: '20px',
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.color,
            border: `1px solid ${badgeStyle.border}`
          }}
        >
          Score: {result.score}%
        </span>
      </div>

      {result.summary && (
        <p style={{ color: '#4a5568', marginBottom: '20px', lineHeight: '1.5' }}>
          {result.summary}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
          <h4 style={{ color: '#2e7d32', marginTop: 0, marginBottom: '10px' }}>
            ✓ Abgedeckte Anforderungen ({result.matched_skills ? result.matched_skills.length : 0})
          </h4>
          {result.matched_skills && result.matched_skills.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {result.matched_skills.map((skill, idx) => (
                <li key={idx} style={{ color: '#1b5e20', marginBottom: '6px' }}>
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#a0aec0', margin: 0 }}>Keine spezifischen Matches gefunden.</p>
          )}
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
          <h4 style={{ color: '#c62828', marginTop: 0, marginBottom: '10px' }}>
            ⚠️ Fehlende / Optimierbare Skills ({result.missing_skills ? result.missing_skills.length : 0})
          </h4>
          {result.missing_skills && result.missing_skills.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {result.missing_skills.map((skill, idx) => (
                <li key={idx} style={{ color: '#b71c1c', marginBottom: '6px' }}>
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#a0aec0', margin: 0 }}>Keine Lücken identifiziert.</p>
          )}
        </div>
      </div>
    </div>
  );
}