const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { getCurrentSeason } = require('../services/season.service');

const prisma = new PrismaClient();

const eventSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
  frequency: z.string().min(1, 'La frecuencia es requerida'),
  plantId: z.number().int().positive(),
  season: z.enum(['PRIMAVERA', 'VERANO', 'OTONO', 'INVIERNO']).optional(),
  notes: z.string().optional(),
  repeatEnabled: z.boolean().optional(),
  repeatEvery: z.number().int().positive().optional(),
  repeatUnit: z.enum(['dias', 'semanas', 'meses']).optional(),
});

// Genera todas las fechas de repetición hasta `limitMonths` meses desde startDate
function generateDates(startDate, repeatEvery, repeatUnit, limitMonths = 6) {
  const dates = [new Date(startDate)];
  const limit = new Date(startDate);
  limit.setMonth(limit.getMonth() + limitMonths);

  let current = new Date(startDate);
  while (true) {
    const next = new Date(current);
    if (repeatUnit === 'dias')    next.setDate(next.getDate() + repeatEvery);
    else if (repeatUnit === 'semanas') next.setDate(next.getDate() + repeatEvery * 7);
    else if (repeatUnit === 'meses')   next.setMonth(next.getMonth() + repeatEvery);
    if (next > limit) break;
    dates.push(new Date(next));
    current = next;
  }
  return dates;
}

const eventUpdateSchema = eventSchema.partial();

async function listEvents(req, res) {
  const { start, end, plantId } = req.query;
  const where = { userId: req.userId };

  if (start || end) {
    where.date = {};
    if (start) where.date.gte = new Date(start);
    if (end) where.date.lte = new Date(end);
  }

  if (plantId) where.plantId = Number(plantId);

  const events = await prisma.wateringEvent.findMany({
    where,
    include: { plant: { select: { id: true, name: true, tag: true } } },
    orderBy: { date: 'asc' },
  });

  return res.json(events);
}

async function createEvent(req, res) {
  const result = eventSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      issues: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  const { title, date, frequency, plantId, notes, repeatEnabled, repeatEvery, repeatUnit } = result.data;

  const plant = await prisma.plant.findFirst({ where: { id: plantId, userId: req.userId } });
  if (!plant) return res.status(404).json({ error: 'Planta no encontrada' });

  // Evento recurrente: crear uno por cada fecha generada
  if (repeatEnabled && repeatEvery && repeatUnit) {
    const dates = generateDates(new Date(date), repeatEvery, repeatUnit);
    const events = await Promise.all(
      dates.map((d) =>
        prisma.wateringEvent.create({
          data: { title, date: d, frequency, season: getCurrentSeason(d), notes, plantId, userId: req.userId },
          include: { plant: { select: { id: true, name: true, tag: true } } },
        })
      )
    );
    return res.status(201).json(events);
  }

  // Evento simple
  const eventDate = new Date(date);
  const season = result.data.season ?? getCurrentSeason(eventDate);
  const event = await prisma.wateringEvent.create({
    data: { title, date: eventDate, frequency, season, notes, plantId, userId: req.userId },
    include: { plant: { select: { id: true, name: true, tag: true } } },
  });

  return res.status(201).json(event);
}

async function updateEvent(req, res) {
  const result = eventUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      issues: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  const existing = await prisma.wateringEvent.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });

  const data = { ...result.data };
  if (data.date) {
    data.date = new Date(data.date);
    if (!data.season) data.season = getCurrentSeason(data.date);
  }

  const event = await prisma.wateringEvent.update({
    where: { id: existing.id },
    data,
    include: { plant: { select: { id: true, name: true, tag: true } } },
  });

  return res.json(event);
}

async function deleteEvent(req, res) {
  const existing = await prisma.wateringEvent.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });

  await prisma.wateringEvent.delete({ where: { id: existing.id } });
  return res.status(204).end();
}

async function completeEvent(req, res) {
  const existing = await prisma.wateringEvent.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });

  const event = await prisma.wateringEvent.update({
    where: { id: existing.id },
    data: { completed: true },
    include: { plant: { select: { id: true, name: true, tag: true } } },
  });

  return res.json(event);
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent, completeEvent };
