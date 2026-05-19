// Lógica de estaciones para hemisferio sur (Argentina)
function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  if (month === 12 || month === 1 || month === 2) return 'VERANO';
  if (month >= 3 && month <= 5) return 'OTONO';
  if (month >= 6 && month <= 8) return 'INVIERNO';
  return 'PRIMAVERA'; // septiembre, octubre, noviembre
}

module.exports = { getCurrentSeason };
