require('dotenv').config();
const { sendOtpEmail } = require('./src/utils/mailer');

(async () => {
  const targets = [
    'admin@alertocalbayog.com',
    'pnp@gmail.com',
    'responder1@gmail.com',
    'teoricakeith@gmail.com',
  ];

  for (const email of targets) {
    try {
      console.log('SENDING', email);
      await sendOtpEmail(email, '123456');
      console.log('SENT ok', email);
    } catch (err) {
      console.error('ERROR', email, err && err.message ? err.message : err);
    }
    console.log('----');
  }
})();