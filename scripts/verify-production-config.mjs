const required = [
  'DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

if (process.env.NODE_ENV !== 'production') {
  console.log('Production config check skipped: NODE_ENV is not production.');
  process.exit(0);
}

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing required production environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

if (process.env.DB_ADAPTER === 'local-json') {
  console.error('DB_ADAPTER=local-json is forbidden in production.');
  process.exit(1);
}

console.log('Production configuration checks passed.');
