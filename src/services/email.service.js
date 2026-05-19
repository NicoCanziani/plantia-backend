const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendWateringReminder(email, userName, plants) {
  const plantList = plants
    .map((p) => `<li><strong>${p.plant.name}</strong> — ${p.title}</li>`)
    .join('');

  await transporter.sendMail({
    from: `"Plantia 🌿" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🌱 Recordatorio de riego — Plantia',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #203b14;">Hola ${userName} 👋</h2>
        <p>Hoy tenés las siguientes plantas para regar:</p>
        <ul style="color: #0a1d08;">${plantList}</ul>
        <p style="color: #c5ccb6; font-size: 12px;">
          Podés cambiar tus preferencias de notificación desde la app.
        </p>
      </div>
    `,
  });
}

module.exports = { sendWateringReminder };
