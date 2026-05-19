const { identifyPlant, generateCareSummary, suggestWateringFrequency } = require('../services/groq.service');
const { z } = require('zod');

const careSummarySchema = z.object({
  plantName: z.string().min(1),
  plantType: z.string().min(1),
});

const wateringSuggestionSchema = z.object({
  plantName: z.string().min(1),
  plantType: z.string().min(1),
  season: z.enum(['PRIMAVERA', 'VERANO', 'OTONO', 'INVIERNO']),
});

async function identify(req, res) {
  let imageSource;

  if (req.file) {
    // Archivo subido: convertir a data URI base64
    const base64 = req.file.buffer.toString('base64');
    imageSource = `data:${req.file.mimetype};base64,${base64}`;
  } else if (req.body?.imageUrl) {
    imageSource = req.body.imageUrl;
  } else {
    return res.status(400).json({ error: 'Se requiere una imagen (archivo o URL)' });
  }

  const result = await identifyPlant(imageSource);
  return res.json(result);
}

async function careSummary(req, res) {
  const parsed = careSummarySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'plantName y plantType son requeridos' });
  }

  const summary = await generateCareSummary(parsed.data.plantName, parsed.data.plantType);
  return res.json({ caresSummary: summary });
}

async function wateringSuggestion(req, res) {
  const parsed = wateringSuggestionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'plantName, plantType y season son requeridos' });
  }

  const { plantName, plantType, season } = parsed.data;
  const frequency = await suggestWateringFrequency(plantName, plantType, season);
  return res.json({ frequency });
}

module.exports = { identify, careSummary, wateringSuggestion };
