import express from 'express';
import { calculateMatch } from '../services/matcher.js';

const router = express.Router();

router.post('/api/match', async (req, res) => {
  try {
    const { cvText, jobText, cvTags, jobTags } = req.body;

    if (!cvText && (!cvTags || cvTags.length === 0)) {
      return res.status(400).json({ error: 'Keine CV-Daten oder CV-Tags übergeben.' });
    }

    if (!jobText && (!jobTags || jobTags.length === 0)) {
      return res.status(400).json({ error: 'Keine Stellenbeschreibungs-Daten oder Job-Tags übergeben.' });
    }

    const result = await calculateMatch(cvText, jobText, cvTags, jobTags);
    return res.json(result);
  } catch (error) {
    console.error('API Route Express Error:', error);
    return res.status(500).json({ error: 'Interner Serverfehler beim Berechnen des Matchings.' });
  }
});

export default router;