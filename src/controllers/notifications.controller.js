const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const settingsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido').optional(),
});

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

async function getSettings(req, res) {
  let settings = await prisma.notificationSettings.findUnique({ where: { userId: req.userId } });

  if (!settings) {
    settings = await prisma.notificationSettings.create({ data: { userId: req.userId } });
  }

  return res.json(settings);
}

async function updateSettings(req, res) {
  const result = settingsSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      issues: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  const settings = await prisma.notificationSettings.upsert({
    where: { userId: req.userId },
    update: result.data,
    create: { userId: req.userId, ...result.data },
  });

  return res.json(settings);
}

async function subscribe(req, res) {
  const result = subscriptionSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }

  const { endpoint, keys } = result.data;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.userId },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: req.userId },
  });

  return res.status(201).json({ ok: true });
}

async function unsubscribe(req, res) {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint requerido' });

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: req.userId },
  });

  return res.status(204).end();
}

module.exports = { getSettings, updateSettings, subscribe, unsubscribe };
