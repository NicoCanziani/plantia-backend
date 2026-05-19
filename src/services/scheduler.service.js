const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendWateringReminder } = require('./email.service');
const { sendPushNotification } = require('./webpush.service');

const prisma = new PrismaClient();

// Corre cada minuto y evalúa qué usuarios tienen recordatorio en este momento
function startScheduler() {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const settings = await prisma.notificationSettings.findMany({
      where: {
        reminderTime: currentTime,
        OR: [{ pushEnabled: true }, { emailEnabled: true }],
      },
      include: {
        user: {
          include: {
            pushSubscriptions: true,
          },
        },
      },
    });

    for (const setting of settings) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const events = await prisma.wateringEvent.findMany({
        where: {
          userId: setting.userId,
          completed: false,
          date: { gte: todayStart, lt: todayEnd },
        },
        include: { plant: true },
      });

      if (events.length === 0) continue;

      const plantNames = events.map((e) => e.plant.name).join(', ');
      const payload = {
        title: '🌱 Recordatorio de riego',
        body: `Hoy regá: ${plantNames}`,
        icon: '/icons/icon-192.png',
      };

      if (setting.pushEnabled) {
        for (const sub of setting.user.pushSubscriptions) {
          await sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          ).catch(() => {});
        }
      }

      if (setting.emailEnabled) {
        await sendWateringReminder(setting.user.email, setting.user.name, events).catch(() => {});
      }
    }
  });

  console.log('Scheduler de notificaciones activo');
}

module.exports = { startScheduler };
