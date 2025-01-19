// import { readFileSync, writeFileSync } from 'fs';
// import { join } from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();
//require('dotenv').config();
// const fs = require('fs');
// const path = require('path');
// const admin = require('firebase-admin');


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

// Definir la ruta del archivo db.json
//const filePath = join(__dirname, 'db.json');

// Función auxiliar para leer datos desde db.json
// const readData = () => {
//   const data = readFileSync(filePath, 'utf-8');
//   return JSON.parse(data);
// };

// Función para escribir datos en db.json
// const writeData = (data) => {
//   writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
// };

// funcion para leer datos de Fire store
const readData = async () => {
  const snapshot = await db.collection('products').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// funcion para escribir datos en Fire store
const writeData = async (newData) => {
  await db.collection('products').add(newData);
};

// Función que maneja CRUD
export async function handler(event, context) {
  // Lee la data de db.json
  const data = readData();

  //obtiene el product ID si lo hay
  const productId = (event.path.split('/').pop() || -1);

  // Verifica el metodo http para ejecutar esa accion
  switch (event.httpMethod) {
    case 'GET':
      // Obtiene los productos
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(data.products),
      };
      

    case 'POST':
      // Crea nuevo producto
      const requestBody = JSON.parse(event.body);
      // asigna un ID basandose en el ID del ultimo producto
      const newProductId = data.products.length ? data.products[data.products.length - 1].id + 1 : 1;
      const newProduct = { id: newProductId, ...requestBody };
      data.products.push(newProduct);
      writeData(data);
      return {
        statusCode: 201,
        body: JSON.stringify({message: 'Producto creado' }),
      };

    case 'PUT':
      // Actualiza Productos
      const putRequestBody = JSON.parse(event.body);
      const productIndex = data.products.findIndex((product) => product.id === productId);
      // en caso de no encontrar el index
      if (productIndex === -1) {
          return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Producto no encontrado' }),
          };
      }
      // Actualiza el producto sin sobre escribirlo
      data.products[productIndex] = { ...data.products[productIndex], ...putRequestBody };
      writeData(data);
      return {
          statusCode: 200,
          body: JSON.stringify({product: data.products[productIndex], message: 'Producto actualizado' }),
      };
      

    case 'DELETE':
        // Elimina un producto
        data.products = data.products.filter((product) => product.id !== productId);
        writeData(data);
        return {
          statusCode: 204,
          body: JSON.stringify({ message: 'Producto eliminado' }),
        };

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método no permitido' }),
      };
  }
}
