const test = require('node:test');
const assert = require('node:assert/strict');

const { verifyEmailExists } = require('../src/utils/emailVerifier');

test('rejects malformed email addresses', async () => {
  assert.equal(await verifyEmailExists('not-an-email'), false);
});

test('returns false when a domain has no MX record', async () => {
  const result = await verifyEmailExists('user@example.com', {
    resolveMx: async () => [],
  });

  assert.equal(result, false);
});

test('accepts an email when the SMTP RCPT command succeeds', async () => {
  const result = await verifyEmailExists('user@gmail.com', {
    resolveMx: async () => [{ priority: 1, exchange: 'mx.example.com' }],
    checkSmtpServer: async () => true,
  });

  assert.equal(result, true);
});

test('returns false when the SMTP server rejects the recipient for a custom domain', async () => {
  const result = await verifyEmailExists('ghost@company.com', {
    resolveMx: async () => [{ priority: 1, exchange: 'mx.company.com' }],
    checkSmtpServer: async () => false,
  });

  assert.equal(result, false);
});

test('accepts a Gmail address even when SMTP checks are blocked by the environment', async () => {
  const result = await verifyEmailExists('jcomendaror20@gmail.com', {
    resolveMx: async () => [{ priority: 1, exchange: 'alt1.gmail-smtp-in.l.google.com' }],
    checkSmtpServer: async () => false,
  });

  assert.equal(result, true);
});
