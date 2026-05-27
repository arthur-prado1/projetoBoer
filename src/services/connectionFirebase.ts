import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Exemplo para autenticação
import { getDatabase } from 'firebase/database'; // Exemplo para o Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyDAQP9ksnr5liXHEVy0ALyRnIeRKqZS1X8",
  authDomain: "projetoboerfatec.firebaseapp.com",
  projectId: "projetoboerfatec",
  storageBucket: "projetoboerfatec.firebasestorage.app",
  messagingSenderId: "119162071809",
  appId: "1:119162071809:web:8550f225e6f8aa0a59c900",
  baseUrl:"https://projetoboerfatec-default-rtdb.firebaseio.com/"
};


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta serviços
export const auth = getAuth(app);
export const database = getDatabase(app);

// Se precisar do app em outro lugar, pode exportá-lo também
export default app;