const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google profile'));

        let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

        if (!user) {
          user = await prisma.user.findUnique({ where: { email } });

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id },
            });
          } else {
            user = await prisma.user.create({
              data: {
                email,
                googleId: profile.id,
                name: profile.displayName || email.split('@')[0],
              },
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
