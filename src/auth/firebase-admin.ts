import admin from 'firebase-admin';

let initialized = false;

function ensureEnvVar(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export function initFirebaseAdmin(): void {
  if (initialized) return;

  const projectId = ensureEnvVar('FIREBASE_PROJECT_ID');
  const clientEmail = ensureEnvVar('FIREBASE_CLIENT_EMAIL');
  let privateKey = ensureEnvVar('FIREBASE_PRIVATE_KEY');

  // Support escaped newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      } as any),
    });
    initialized = true;
    console.log('[Firebase Admin] initialized');
  } catch (err) {
    console.error('[Firebase Admin] initialization failed:', err);
    throw err;
  }
}

export function verifyIdToken(idToken: string) {
  if (!initialized) {
    // Attempt to initialize lazily if environment is provided
    try {
      initFirebaseAdmin();
    } catch (err) {
      throw new Error('Firebase Admin not configured: ' + (err as Error).message);
    }
  }
  return admin.auth().verifyIdToken(idToken);
}

export default admin;
