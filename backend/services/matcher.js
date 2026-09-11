import fetch from 'node-fetch';

/**
 * Programmatischer Fallback via Token- und Substring-Matching,
 * falls Ollama offline ist oder ungültiges JSON liefert.
 */
function fallbackTagMatching(cvTags = [], jobTags = []) {
  if (!jobTags || jobTags.length === 0) {
    return {
      score: 0,
      summary: 'Keine Job-Anforderungen für einen Abgleich vorhanden.',
      matched_skills: [],
      missing_skills: []
    };
  }

  const matched = [];
  const missing = [];

  jobTags.forEach(jobTag => {
    const jobTagClean = jobTag.toLowerCase().trim();

    const isMatch = cvTags.some(cvTag => {
      const cvTagClean = cvTag.toLowerCase().trim();
      return cvTagClean.includes(jobTagClean) || jobTagClean.includes(cvTagClean);
    });

    if (isMatch) {
      matched.push(jobTag);
    } else {
      missing.push(jobTag);
    }
  });

  const score = Math.round((matched.length / jobTags.length) * 100);

  return {
    score,
    summary: 'Automatischer Tag-Abgleich (Fallback-Modus ohne KI ausgeführt).',
    matched_skills: matched,
    missing_skills: missing
  };
}

/**
 * Hauptfunktion: Prompting an Ollama und sicheres JSON-Parsing.
 */
export async function calculateMatch(cvText = '', jobText = '', cvTags = [], jobTags = []) {
  const prompt = `
Du bist ein präzises ATS-Matching-System.
Analysiere den folgenden CV/Anschreiben-Text und das Stellenprofil.

STELLENPROFIL TAGS:
${JSON.stringify(jobTags)}

LEBENSLAUF TAGS:
${JSON.stringify(cvTags)}

TEXT STELLENPROFIL:
${jobText.substring(0, 2500)}

TEXT LEBENSLAUF:
${cvText.substring(0, 2500)}

Aufgabe:
1. Gleiche die Skills und Anforderungen ab (Sinnverwandtschaft beachten, z.B. "Fehlerbehebung unter Zeitdruck" matcht "Fehlerbehebung").
2. Erstelle einen Match-Score von 0 bis 100.
3. Liste abgedeckte Anforderungen (matched_skills) und fehlende Anforderungen (missing_skills) auf.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt ohne Markdown-Formatierung, Erklärung oder Codeblock:
{
  "score": 85,
  "summary": "Kurze Zusammenfassung der Eignung...",
  "matched_skills": ["Skill 1", "Skill 2"],
  "missing_skills": ["Skill A"]
}
`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: prompt,
        stream: false,
        format: 'json'
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    let rawOutput = data.response || '';

    // Entfernt eventuelle Markdown-Codeblöcke
    rawOutput = rawOutput.replace(/```json/gi, '').replace(/```/gi, '').trim();

    const parsedData = JSON.parse(rawOutput);

    return {
      score: typeof parsedData.score === 'number' ? parsedData.score : 0,
      summary: parsedData.summary || 'Keine Zusammenfassung generiert.',
      matched_skills: Array.isArray(parsedData.matched_skills) ? parsedData.matched_skills : [],
      missing_skills: Array.isArray(parsedData.missing_skills) ? parsedData.missing_skills : []
    };
  } catch (error) {
    console.error('Fehler in calculateMatch (Ollama/Parsing), verwende Fallback:', error);
    return fallbackTagMatching(cvTags, jobTags);
  }
}