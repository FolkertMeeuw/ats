import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function App() {
  const [cvFileName, setCvFileName] = useState('');
  const [cvText, setCvText] = useState('');
  const [cvTags, setCvTags] = useState([]);
  const [isExtractingCv, setIsExtractingCv] = useState(false);

  const [jobFileName, setJobFileName] = useState('');
  const [jobText, setJobText] = useState('');
  const [jobTags, setJobTags] = useState([]);
  const [isExtractingJob, setIsExtractingJob] = useState(false);

  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const extractTextFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCvFileName(file.name);
    setIsExtractingCv(true);
    setCvTags([]);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else {
        text = await file.text();
      }
      setCvText(text);

      const res = await fetch('http://localhost:3001/api/extract-cv-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.skills && Array.isArray(data.skills)) {
        setCvTags(data.skills);
      }
    } catch (err) {
      console.error('Fehler beim Lesen des CVs:', err);
      alert('Fehler beim Extrahieren des Lebenslauf-Texts.');
    } finally {
      setIsExtractingCv(false);
    }
  };

  const extractJobRequirementsFromText = async (textToExtract) => {
    if (!textToExtract.trim()) return;
    setIsExtractingJob(true);
    setJobTags([]);
    try {
      const res = await fetch('http://localhost:3001/api/extract-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToExtract })
      });
      const data = await res.json();
      if (data.skills && Array.isArray(data.skills)) {
        setJobTags(data.skills);
      } else {
        setJobTags([]);
      }
    } catch (err) {
      console.error('Fehler bei Anforderungsextraktion:', err);
    } finally {
      setIsExtractingJob(false);
    }
  };

  const handleJobUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setJobFileName(file.name);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else {
        text = await file.text();
      }
      setJobText(text);
      await extractJobRequirementsFromText(text);
    } catch (err) {
      console.error('Fehler beim Lesen der Stellenbeschreibung:', err);
      alert('Fehler beim Lesen der Stellenbeschreibung.');
    }
  };

  const handleManualExtractJob = () => {
    extractJobRequirementsFromText(jobText);
  };

  const handleStartMatch = async () => {
    if (!cvText.trim()) {
      alert('Bitte lade zuerst deinen Lebenslauf hoch.');
      return;
    }
    if (!jobText.trim()) {
      alert('Bitte füge eine Stellenbeschreibung ein.');
      return;
    }

    setIsMatching(true);
    setMatchResult(null);

    try {
      const res = await fetch('http://localhost:3001/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText,
          jobText,
          jobTags
        })
      });

      const data = await res.json();
      setMatchResult(data);
    } catch (err) {
      console.error('Fehler bei Match-Analyse:', err);
      alert('Match-Analyse fehlgeschlagen.');
    } finally {
      setIsMatching(false);
    }
  };

  const renderRecommendationText = (rec) => {
    if (typeof rec === 'string') return rec;
    if (typeof rec === 'object' && rec !== null) {
      const tip = rec['Konkreter Tipp'] || rec['tipp'] || '';
      const wo = rec['Wo'] || rec['wo'] || '';
      const wie = rec['Wie'] || rec['wie'] || '';
      return `${wo ? `[Wo: ${wo}] ` : ''}${wie ? `[Wie: ${wie}] ` : ''}${tip}` || JSON.stringify(rec);
    }
    return String(rec);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>ATS Smart Matcher</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>Lokale KI-Analyse & Skill-Matching via Ollama</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* CV Bereich */}
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px' }}>
          <h3>1. Lebenslauf (CV)</h3>
          <input type="file" accept=".pdf,.txt" onChange={handleCvUpload} id="cvInput" style={{ display: 'none' }} />
          <label htmlFor="cvInput" style={{ display: 'block', padding: '20px', border: '2px dashed #aaa', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}>
            {cvFileName || 'Datei auswählen oder PDF hierher ziehen'}
          </label>

          {isExtractingCv && <p style={{ color: '#0066cc', marginTop: '10px' }}>Analysiere Lebenslauf per KI...</p>}

          {!isExtractingCv && cvTags.length > 0 && (
            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <strong>Extrahiertes Profil ({cvTags.length} Skills):</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {cvTags.map((tag, idx) => (
                  <span key={idx} style={{ backgroundColor: '#e6ffe6', border: '1px solid #b3ffb3', color: '#006600', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stellenbeschreibung Bereich */}
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>2. Stellenbeschreibung</h3>
            <input type="file" accept=".pdf,.txt" onChange={handleJobUpload} id="jobInput" style={{ display: 'none' }} />
            <label htmlFor="jobInput" style={{ color: '#0066cc', cursor: 'pointer', fontSize: '14px' }}>
              {jobFileName ? `PDF: ${jobFileName}` : 'PDF auswählen'}
            </label>
          </div>

          <textarea
            rows="6"
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Füge hier den Text der Stellenbeschreibung ein oder ziehe eine PDF-Datei hinein..."
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
          />

          <button
            onClick={handleManualExtractJob}
            disabled={isExtractingJob || !jobText.trim()}
            style={{ width: '100%', padding: '10px', marginTop: '10px', cursor: 'pointer' }}
          >
            {isExtractingJob ? 'Extrahiere Anforderungen...' : 'Anforderungen Extrahieren'}
          </button>

          {isExtractingJob && <p style={{ color: '#0066cc', marginTop: '10px' }}>Analysiere Stellenanzeige per KI...</p>}

          {!isExtractingJob && jobTags.length > 0 && (
            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <strong>Extrahiertes Profil ({jobTags.length} Anforderungen):</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {jobTags.map((tag, idx) => (
                  <span key={idx} style={{ backgroundColor: '#eef4ff', border: '1px solid #cce0ff', color: '#0044cc', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleStartMatch}
        disabled={isMatching || !cvText || !jobText}
        style={{
          width: '100%',
          padding: '15px',
          marginTop: '20px',
          backgroundColor: isMatching ? '#ccc' : '#0066cc',
          color: '#fff',
          fontSize: '16px',
          border: 'none',
          borderRadius: '6px',
          cursor: isMatching ? 'not-allowed' : 'pointer'
        }}
      >
        {isMatching ? '🚀 Ollama KI-Analyse läuft...' : '🚀 Match-Analyse Starten'}
      </button>

      {/* Ergebnisbereich */}
      {matchResult && (
        <div style={{ marginTop: '30px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Match-Ergebnis</h2>
            <span style={{ fontSize: '26px', fontWeight: 'bold', color: matchResult.score >= 70 ? 'green' : 'orange' }}>
              Score: {matchResult.score}%
            </span>
          </div>

          <p style={{ marginTop: '15px', lineHeight: '1.5', fontSize: '15px' }}>{matchResult.summary}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div style={{ backgroundColor: '#e6ffe6', padding: '15px', borderRadius: '6px' }}>
              <h4 style={{ color: 'green', margin: '0 0 10px 0' }}>
                ✓ Abgedeckte Anforderungen ({matchResult.matchingSkills.length})
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {matchResult.matchingSkills.map((skill, i) => (
                  <li key={i} style={{ marginBottom: '5px' }}>
                    {typeof skill === 'object' ? JSON.stringify(skill) : skill}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ backgroundColor: '#fff0f0', padding: '15px', borderRadius: '6px' }}>
              <h4 style={{ color: 'red', margin: '0 0 10px 0' }}>
                ⚠️ Fehlende / Optimierbare Skills ({matchResult.missingSkills.length})
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {matchResult.missingSkills.map((skill, i) => (
                  <li key={i} style={{ marginBottom: '5px' }}>
                    {typeof skill === 'object' ? JSON.stringify(skill) : skill}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {matchResult.recommendations && matchResult.recommendations.length > 0 && (
            <div style={{ marginTop: '20px', backgroundColor: '#fff8e6', border: '1px solid #ffe0b2', padding: '15px', borderRadius: '6px' }}>
              <h4 style={{ color: '#b78103', margin: '0 0 10px 0' }}>
                💡 Wo und wie der Lebenslauf optimiert werden kann:
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {matchResult.recommendations.map((rec, i) => (
                  <li key={i} style={{ marginBottom: '8px', lineHeight: '1.4' }}>
                    {renderRecommendationText(rec)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}