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
const readData = async (collection = 'products') => {
  const snapshot = await db.collection(collection).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// verifica si el producto existe
const checkIfProductExits = async (productRef) => {
  // Obtiene un posible producto
  const productDoc = await productRef.get();

  return productDoc.exists
}

// Función que maneja CRUD
export async function handler(event, context) {

  //obtiene el product ID si lo hay
  const productId = (event.path.split('/').pop() || -1);

  // Verifica el metodo http para ejecutar esa accion
  switch (event.httpMethod) {
    case 'GET':
      const queryParams = event.queryStringParameters || {}; // query params
      const searchTerm = queryParams.search || ''; // si no hay search, un empty string
      const categoryId = queryParams.categoryId || ''; // si no categoryId, un empty string
    
      // Funcion para filtrar los productos
      const filterProducts = (products, searchTerm) => {
        return products.filter(product => {
          // query params para el filtrado
          return product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.categoryId == categoryId;
        });
      };

      // Funcion para agregar el category name a cada producto
      const enhanceProductsWithCategory = (products, categories) => {
        return products.map(product => {
          const category = categories.find(cat => cat.id === product.categoryId);
          return {
            ...product,
            categoryName: category ? category.name : 'Unknown',
          };
        });
      };

      // carga data de las colleciones 'products' y 'categories'
      return Promise.all([readData(), readData('categories')]) 
        .then(([products, categories]) => {
          // filta productos basados en los query params
          const filteredProducts = filterProducts(products, searchTerm);
          // agrega el category name a los productos
          const enhancedProducts = enhanceProductsWithCategory(filteredProducts, categories);

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(enhancedProducts),
          };
        })
        .catch(() => {
          return {
            statusCode: 500,
            body: JSON.stringify({ message: 'No se obtuvieron los productos' }),
          };
        });

    case 'POST':
      // Crea nuevo producto
      const requestBody = JSON.parse(event.body);
      // Reference to the products collection in Firestore
      const productsRef = db.collection('products');
      // Agrega el nuevo producto a Firestore
      return productsRef.add(requestBody)
        .then(() => {
          return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Producto creado' }),
          };
        })
        .catch((error) => {
          return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creando el producto', error: error.message }),
          };
        });

    case 'PUT':
      // Actualiza Productos
      const putRequestBody = JSON.parse(event.body);

      // Crea referencia al objeto en la fire store.
      const productRef = db.collection('products').doc(productId);
      
      const productExists = await checkIfProductExits(productRef);

      if (!productExists) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Producto no encontrado' }),
        };
      }

      return productRef.update(putRequestBody)
      .then(() => {
        // Obtiene el producto que se actualizo
        return productRef.get();
      })
      .then((updatedProductDoc) => {
        return {
          statusCode: 200,
          body: JSON.stringify({
            product: updatedProductDoc.data(),
            message: 'Producto actualizado',
          }),
        };
      })
      .catch(() => {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error al actualizar el producto' }),
        };
      });

    // Elimina un producto
    case 'DELETE':
      // Crea referencia al objeto en la fire store
      const productDelRef = db.collection('products').doc(productId);
      
      const productDelExists = await checkIfProductExits(productDelRef);

      if (!productDelExists) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Producto no encontrado' }),
        };
      }

      return productDelRef.delete()
      .then(() => {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Producto eliminado' }),
        };
      })
      .catch(() => {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error al eliminar el producto' }),
        };
      });

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método no permitido' }),
      };
  }
}
