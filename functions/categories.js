import admin from 'firebase-admin';
import dotenv from 'dotenv';
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
  const snapshot = await db.collection('categories').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// verifica si la categoria existe
const checkIfCategoryExits = async (categoryRef) => {
  // Obtiene una posible categoria
  const categoryDoc = await categoryRef.get();

  return categoryDoc.exists
}

// Función que maneja CRUD
export async function handler(event, context) {

  //obtiene el category ID si lo hay
  const categoryId = (event.path.split('/').pop() || -1);

  // Verifica el metodo http para ejecutar esa accion
  switch (event.httpMethod) {
    case 'GET':
      const queryParams = event.queryStringParameters || {}; // query params
      const searchTerm = queryParams.search || ''; // si no hay search, un empty string
    
      // funcion para filtrar las categorias
      const filterCategories = (categories, searchTerm) => {
        // cuando se manda el id, se quiere solo esa cagetoria
        if(categoryId != -1 || categoryId != 'categories'){
          return categories.find(category => category.id === categoryId);
        }

        return categories.filter(category => {
          // el criterio para hacer la busqueda
          return category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  category.description.toLowerCase().includes(searchTerm.toLowerCase());
        });
      };
    
      return readData()
        .then((data) => {
          const filteredData = filterCategories(data, searchTerm); // filtrar las categorias basado en el search

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(filteredData), // retornar las categorias filtradas
          };
        })
        .catch(() => {
          return {
            statusCode: 500,
            body: JSON.stringify({ message: 'No se obtuvieron las categorias'}),
          };
        });

    case 'POST':
      // Crea nueva categoria
      const requestBody = JSON.parse(event.body);
      const { name } = requestBody;
      // Referencia las categorias en Firestore
      const categoriesRef = db.collection('categories');

      // Verifica si la categoria ya existe con el nombre
      const categories = await readData();
      const existingCategory = categories.find(category => category.name === name);

      if (existingCategory) {
        return {
          statusCode: 409,  // categoria ya existe
          body: JSON.stringify({ message: 'La categoria ya existe' }),
        };
      }

      // Agrega la categoria nueva a Firestore
      return categoriesRef.add(requestBody)
        .then(() => {
          return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Categoria creada' }),
          };
        })
        .catch((error) => {
          return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creando la categoria', error: error.message }),
          };
        });

    case 'PUT':
      // Actualiza Categoria
      const putRequestBody = JSON.parse(event.body);

      // Crea referencia al objeto en Firestore
      const categoryRef = db.collection('categories').doc(categoryId);
      
      // verifica que la categoria exista para actualizarla
      const categoryExists = await checkIfCategoryExits(categoryRef);

      if (!categoryExists) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Categoria no encontrada' }),
        };
      }

      return categoryRef.update(putRequestBody)
      .then(() => {
        // Obtiene la categoria que se actualizo
        return categoryRef.get();
      })
      .then((updatedCategoryDoc) => {
        return {
          statusCode: 200,
          body: JSON.stringify({
            category: updatedCategoryDoc.data(),
            message: 'Categoria actualizada',
          }),
        };
      })
      .catch(() => {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error al actualizar la categoria' }),
        };
      });

    // Elimina una categoria
    case 'DELETE':
      // Crea referencia al objeto en la fire store
      const categoryDelRef = db.collection('categories').doc(categoryId);
      
      const categoryDelExists = await checkIfCategoryExits(categoryDelRef);

      if (!categoryDelExists) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Categoria no encontrada' }),
        };
      }

      return categoryDelRef.delete()
      .then(() => {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Categoria eliminada' }),
        };
      })
      .catch(() => {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error al eliminar la Categoria' }),
        };
      });

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método no permitido' }),
      };
  }
}
