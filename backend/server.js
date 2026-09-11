const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

async function getOllamaModel() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        return data.models[0].name;
      }
    }
  } catch (err) {
    console.warn('Ollama Tags nicht erreichbar:', err.message);
  }
  return 'llama3.2';
}

app.get('/api/tags', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Ollama nicht erreichbar' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Verbindung zu Ollama fehlgeschlagen.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Fehler von Ollama empfangen' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Ollama ist lokal nicht gestartet.' });
  }
});

// Extraktion für Lebenslauf-Skills
app.post('/api/extract-cv-skills', async (req, res) => {
  try {
    const { text } = req.body;
    const model = await getOllamaModel();

    const prompt = `Analysiere folgenden Lebenslauf-Text und extrahiere die wichtigsten Kernkompetenzen, Skills, Programmiersprachen und Qualifikationen.

LEBENSLAUF:
${text}

Antworte AUSSCHLIESSLICH mit folgendem JSON-Objekt ohne weiteren Text:
{
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}`;

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: false
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Fehler bei CV-Skill-Extraktion' });
    }

    const data = await response.json();
    let rawContent = data.message ? data.message.content : data.response;

    if (typeof rawContent === 'string') {
      rawContent = rawContent.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const firstBrace = rawContent.indexOf('{');
      const lastBrace = rawContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        rawContent = rawContent.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
    const skillsList = parsed.skills || parsed.keywords || parsed.competencies || [];
    res.json({ skills: skillsList });
  } catch (err) {
    console.error('Fehler bei CV-Extraktion:', err);
    res.status(500).json({ error: 'CV-Extraktion fehlgeschlagen', details: err.message });
  }
});

// Robust erweiterte Extraktion für Stellenanzeigen-Anforderungen
app.post('/api/extract-requirements', async (req, res) => {
  try {
    const { text } = req.body;
    const model = await getOllamaModel();

    const prompt = `Lies folgenden Stellenbeschreibungstext und extrahiere ALLE relevanten fachlichen und technischen Anforderungen, Qualifikationen, Kenntnisse und Kenntnisbereiche als kurze Schlagworte/Phrasen.

STELLENBESCHREIBUNG:
${text}

Antworte AUSSCHLIESSLICH im JSON-Format:
{
  "skills": ["Anforderung 1", "Anforderung 2", "Anforderung 3"]
}`;

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: false
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Fehler bei Skill-Extraktion' });
    }

    const data = await response.json();
    let rawContent = data.message ? data.message.content : data.response;

    if (typeof rawContent === 'string') {
      rawContent = rawContent.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const firstBrace = rawContent.indexOf('{');
      const lastBrace = rawContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        rawContent = rawContent.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsed = {};
    try {
      parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
    } catch (e) {
      console.warn('JSON parsing fallbacks trigger');
    }

    let skillsList = [];
    if (Array.isArray(parsed)) {
      skillsList = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      skillsList =
        parsed.skills ||
        parsed.requirements ||
        parsed.anforderungen ||
        parsed.qualifications ||
        parsed.aufgaben ||
        [];

      if (skillsList.length === 0) {
        for (const key of Object.keys(parsed)) {
          if (Array.isArray(parsed[key])) {
            skillsList = skillsList.concat(parsed[key]);
          }
        }
      }
    }

    if (skillsList.length === 0 && typeof rawContent === 'string') {
      skillsList = rawContent
        .split('\n')
        .map((line) => line.replace(/^[-*•\d.\s]+/, '').trim())
        .filter((line) => line.length > 2 && !line.startsWith('{') && !line.startsWith('}'));
    }

    const cleanedList = skillsList.map((item) =>
      typeof item === 'object' ? JSON.stringify(item) : String(item)
    );

    res.json({ skills: cleanedList });
  } catch (err) {
    console.error('Fehler bei Anforderungsextraktion:', err);
    res.status(500).json({ error: 'Extraktion fehlgeschlagen', details: err.message });
  }
});

// Match-Analyse mit Normalisierung für Empfehlungen
app.post('/api/match', async (req, res) => {
  try {
    const { cvText, jobText, jobTags } = req.body;
    const model = await getOllamaModel();

    const prompt = `Du bist ein erfahrener HR-Tech-Recruiter und ATS-Analyst.
Analysiere die Eignung des Lebenslaufs für die Stellenbeschreibung.

LEBENSLAUF:
${cvText}

STELLENBESCHREIBUNG:
${jobText}

ZUSÄTZLICH EXTRAHIERTE ANFORDERUNGEN:
${JSON.stringify(jobTags || [])}

Gib eine detaillierte, konstruktive Analyse ab. Gib konkrete Handlungsempfehlungen als einfache TEXT-STRINGS (KEINE verschachtelten Objekte), WO und WIE der Lebenslauf optimiert werden muss.

Antworte AUSSCHLIESSLICH im folgenden JSON-Format:
{
  "score": 85,
  "summary": "Gesamteinschätzung der Passung...",
  "matchingSkills": ["Erfüllte Anforderung 1", "Erfüllte Anforderung 2"],
  "missingSkills": ["Fehlende Anforderung 1", "Fehlende Anforderung 2"],
  "recommendations": [
    "Konkreter Tipp 1: Ergänze bei Station X das Stichwort Y...",
    "Konkreter Tipp 2: Formuliere die Erfahrung mit Z aktiver...",
    "Konkreter Tipp 3: Hebe die Führungserfahrung deutlicher im Kopfbereich hervor."
  ]
}`;

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: false
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Ollama-Fehler bei Match-Analyse' });
    }

    const ollamaData = await response.json();
    let raw = ollamaData.message ? ollamaData.message.content : ollamaData.response;

    if (typeof raw === 'string') {
      raw = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first !== -1 && last !== -1) {
        raw = raw.substring(first, last + 1);
      }
    }

    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const rawRecs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    const normalizedRecs = rawRecs.map((rec) => {
      if (typeof rec === 'string') return rec;
      if (typeof rec === 'object' && rec !== null) {
        const parts = [];
        if (rec['Wo']) parts.push(`[Wo: ${rec['Wo']}]`);
        if (rec['Wie']) parts.push(`[Wie: ${rec['Wie']}]`);
        if (rec['Konkreter Tipp']) parts.push(rec['Konkreter Tipp']);
        return parts.length > 0 ? parts.join(' ') : JSON.stringify(rec);
      }
      return String(rec);
    });

    const normalized = {
      score: parsed.score !== undefined ? parsed.score : (parsed.matchScore !== undefined ? parsed.matchScore : 0),
      summary: parsed.summary || parsed.description || 'Keine Zusammenfassung verfügbar.',
      matchingSkills: Array.isArray(parsed.matchingSkills) ? parsed.matchingSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      recommendations: normalizedRecs
    };

    res.json(normalized);
  } catch (error) {
    console.error('Match-Fehler:', error);
    res.status(500).json({ error: 'Match-Analyse fehlgeschlagen', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy-Server läuft auf http://localhost:${PORT}`);
});