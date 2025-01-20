import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
dotenv.config();

const serviceAccount = {
  type: process.env.SERVICE_ACCOUNT_TYPE,
  project_id: process.env.SERVICE_ACCOUNT_PROJECT_ID,
  private_key_id: process.env.SERVICE_ACCOUNT_PRIVATE_KEY_ID,
  private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
  client_id: process.env.SERVICE_ACCOUNT_CLIENT_ID,
  auth_uri: process.env.SERVICE_ACCOUNT_AUTH_URI,
  token_uri: process.env.SERVICE_ACCOUNT_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.SERVICE_ACCOUNT_CLIENT_CERT_URL,
  universe_domain: process.env.SERVICE_ACCOUNT_UNIVERSE_DOMAIN
};

// inicia la applicacion
if (!admin.apps.length) {
  // Inicializa solo si no se ha inicializado
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  // Usa la aplicacion ya inicializada
  admin.app();
}

const db = admin.firestore();

// funcion para leer datos de Fire store
const readData = async () => {
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Compara la contraseña proporcionada con la contraseña cifrada almacenada
const comparePassword = async (providedPassword, storedPasswordHash) => {
  return compare(providedPassword, storedPasswordHash);
};

// Generar token JWT
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };
  // retorna la clave secreta que debe ser almacenada de manera segura
  return sign(payload, 'your_jwt_secret_key', { expiresIn: '1h' });
};


// Función que maneja el login
export async function handler(event, context) {
  // si no es un post method, enviar un mensaje de error
  if( event.httpMethod !== 'POST' ){
      return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Método HTTP no permitido' }),
      };
  }

  const { username, password } = JSON.parse(event.body);

  // Encuentra el usuario por username
  const users = await readData();
  const user = users.find((user) => user.username === username);

  // si no se encuentra ese username, retorna mensaje de error
  if (!user) {
      return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Credenciales inválidas' }),
      };
  }

  // Compara las constraseñas hacen match
  const isMatch = await comparePassword(password, user.password);

  // si hay un match retorna 200, si no retorna 401 con mensaje de error
  if (isMatch) {
      // Genera un token JWT
      const token = generateToken(user);
      return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Inicio de sesión exitoso', token }),
      };
  } else {
      return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Credenciales inválidas' }),
      };
  }
}
