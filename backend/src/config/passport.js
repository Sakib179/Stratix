const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: LinkedInStrategy } = require('passport-linkedin-oauth2');
const db = require('./db');
const env = require('./env');

const findOrCreateOAuthUser = async (provider, profile) => {
  const email = profile.emails?.[0]?.value;
  if (!email) throw new Error('No email returned from OAuth provider');

  const { rows: existing } = await db.query(
    `SELECT * FROM users WHERE email = $1 AND is_deleted = FALSE`, [email.toLowerCase()]
  );

  if (existing[0]) {
    if (!existing[0].oauth_provider) {
      await db.query(
        `UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE id = $3`,
        [provider, profile.id, existing[0].id]
      );
    }
    return existing[0];
  }

  const displayName = profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`.trim() || email.split('@')[0];

  const { rows } = await db.query(
    `INSERT INTO users (full_name, email, role, oauth_provider, oauth_id, is_active)
     VALUES ($1,$2,'employee',$3,$4,TRUE)
     RETURNING *`,
    [displayName, email.toLowerCase(), provider, profile.id]
  );
  return rows[0];
};

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID:     env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${env.API_BASE_URL}/api/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateOAuthUser('google', profile);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));
}

if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy(
    {
      clientID:     env.FACEBOOK_APP_ID,
      clientSecret: env.FACEBOOK_APP_SECRET,
      callbackURL:  `${env.API_BASE_URL}/api/v1/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'emails', 'name'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateOAuthUser('facebook', profile);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));
}

if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy(
    {
      clientID:     env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
      callbackURL:  `${env.API_BASE_URL}/api/v1/auth/linkedin/callback`,
      scope:        ['r_emailaddress', 'r_liteprofile'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateOAuthUser('linkedin', profile);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));
}

module.exports = passport;
