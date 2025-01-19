const fs = require('fs');
const path = require('path');

// Definir la ruta del archivo db.json
const filePath = path.join(__dirname, 'db.json');

// Función auxiliar para leer datos desde db.json
const readData = () => {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

// Función para escribir datos en db.json
const writeData = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// Función que maneja CRUD
exports.handler = async (event, context) => {
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
