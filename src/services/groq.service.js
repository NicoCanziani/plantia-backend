const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

function extractJSON(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  return match ? match[1].trim() : text.trim();
}

async function identifyPlant(imageSource) {
  // imageSource puede ser una URL o un string base64 con data URI
  const imageUrl = imageSource.startsWith('http') ? imageSource : imageSource;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
          {
            type: 'text',
            text: `Eres un experto botánico. Analiza esta imagen e identifica la planta.
Responde ÚNICAMENTE con un JSON válido sin texto adicional:
{
  "name": "nombre común de la planta en español",
  "type": "nombre científico o tipo/especie",
  "caresSummary": "resumen de cuidados en 2-3 oraciones: riego, luz y temperatura"
}
Si no puedes identificar ninguna planta, responde con los campos en null.`,
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 512,
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(extractJSON(raw));
  } catch {
    return { name: null, type: null, caresSummary: null };
  }
}

async function generateCareSummary(plantName, plantType) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: `Eres un experto botánico. Escribe un resumen conciso (2-3 oraciones) de los cuidados para: ${plantName} (${plantType}).
Incluye riego, luz y temperatura ideal. Responde en español, solo el párrafo sin introducción ni título.`,
      },
    ],
    temperature: 0.4,
    max_tokens: 256,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

async function suggestWateringFrequency(plantName, plantType, season) {
  const seasonNames = {
    PRIMAVERA: 'primavera',
    VERANO: 'verano',
    OTONO: 'otoño',
    INVIERNO: 'invierno',
  };

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: `Eres un experto botánico. ¿Con qué frecuencia se debe regar ${plantName} (${plantType}) durante el ${seasonNames[season] ?? season} en el hemisferio sur (Argentina)?
Responde SOLO con la frecuencia, por ejemplo: "cada 3 días", "una vez por semana", "dos veces por semana". Sin explicación adicional.`,
      },
    ],
    temperature: 0.2,
    max_tokens: 32,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

module.exports = { identifyPlant, generateCareSummary, suggestWateringFrequency };
