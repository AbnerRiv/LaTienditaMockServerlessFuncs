import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { genSalt, hash } from 'bcryptjs';
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

// verifica si el usuario existe
const checkUserExits = async (userRef) => {
  // Obtiene un posible usuario
  const userDoc = await userRef.get();
  
  return userDoc.exists
}

// Cifra la contraseña del usuario con bcrypt
const hashPassword = async (password) => {
  const salt = await genSalt(10);
  return hash(password, salt);
};

// Función que maneja CRUD
export async function handler(event, context) {

  // obtiene el user ID si lo hay
  const userId = (event.path.split('/').pop() || -1);

  // Verifica el metodo http para ejecutar esa accion
  switch (event.httpMethod) {
    case 'GET':
      const queryParams = event.queryStringParameters || {}; // Captura los query param del request
      const searchTerm = queryParams.search || ''; // If no search term, use an empty string
    
      // funcion para filtrar los usuarios
      const filterUsers = (users, searchTerm) => {
        return users.filter(user => {
          // el criterio para hacer la busqueda
          return user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 user.email.toLowerCase().includes(searchTerm.toLowerCase());
        });
      };
    
      return readData()
        .then((data) => {
          const filteredData = filterUsers(data, searchTerm); // filtrar los usuarios basado en el search

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(filteredData),
          };
        })
        .catch(() => {
          return {
            statusCode: 500,
            body: JSON.stringify({ message: 'No se obtuvieron los usuarios'}),
          };
        });

    // Crea nuevo usuario
    case 'POST':
        // Obtiene el cuerpo de la solicitud (request body)
        const requestBody = JSON.parse(event.body);
        const { password, username } = requestBody;

        // Verifica si el usuario ya existe con el username
        const users = await readData();
        const existingUser = users.find(user => user.username === username);

        if (existingUser) {
          return {
            statusCode: 409,  // usuario ya existe
            body: JSON.stringify({ message: 'El usuario ya existe' }),
          };
        }

        // Cifra la contraseña para guardarla junto a la otra info del usuario
        const hashedPassword = await hashPassword(password);
        const newUser = { password: hashedPassword, ...requestBody };

        // Guarda el nuevo usuario
        return db.collection('users').add(newUser)
          .then(() => {
            return {
              statusCode: 201,  // Usuario creado
              body: JSON.stringify({ message: 'Registro exitoso' }),
            };
          })
          .catch((error) => {
            return {
              statusCode: 500,
              body: JSON.stringify({ message: 'Error al crear el usuario', error: error.message }),
            };
          });

    case 'PUT':
        // Actualiza usuario
        const putRequestBody = JSON.parse(event.body);

        // Crea referencia al objeto en la fire store.
        const userRef = db.collection('users').doc(userId);

        const userExists = await checkUserExits(userRef);

        if (!userExists) {
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Usuario no encontrado' }),
          };
        }

        return userRef.update(putRequestBody)
        .then(() => {
          // Obtiene el usuario que se actualizo
          return userRef.get();
        })
        .then((updatedUserDoc) => {
          return {
            statusCode: 200,
            body: JSON.stringify({
              user: updatedUserDoc.data(),
              message: 'Usuario actualizado',
            }),
          };
        })
        .catch(() => {
          return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al actualizar el usuario' }),
          };
        });
      
    // Elimina un usuario
    case 'DELETE':

      // Crea referencia al objeto en la fire store
      const userDelRef = db.collection('users').doc(userId);
      
      const userDelExists = await checkUserExits(userDelRef);

      if (!userDelExists) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Usuario no encontrado' }),
        };
      }

      return userDelRef.delete()
      .then(() => {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Usuario eliminado' }),
        };
      })
      .catch(() => {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error al eliminar el usuario' }),
        };
      });

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método no permitido' }),
      };
  }
}
