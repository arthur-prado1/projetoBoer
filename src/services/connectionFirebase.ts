import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'PREENCHA_A_API_KEY',
  authDomain: 'PREENCHA_O_AUTH_DOMAIN',
  projectId: 'PREENCHA_O_PROJECT_ID',
  storageBucket: 'PREENCHA_O_STORAGE_BUCKET',
  messagingSenderId: 'PREENCHA_O_MESSAGING_SENDER_ID',
  appId: 'PREENCHA_O_APP_ID',
  databaseURL: 'PREENCHA_A_DATABASE_URL',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;
