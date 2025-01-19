import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Definir la ruta del archivo db.json
const filePath = join(__dirname, 'db.json');

// Función auxiliar para leer datos desde db.json
const readData = () => {
  const data = readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

// Función para escribir datos en db.json
const writeData = (data) => {
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// Función que maneja CRUD
export async function handler(event, context) {
  // Lee la data de db.json
  const data = readData();

  //obtiene el category ID si lo hay
  const categoryId = (event.path.split('/').pop() || -1);

  // Verifica el metodo http para ejecutar esa accion
  switch (event.httpMethod) {
    case 'GET':
      // Obtiene las categorías
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify(data.categories)
        };

    case 'POST':
        // Crea nueva categoría
        const requestBody = JSON.parse(event.body);
        // asigna un ID basandose en el ID de la ultima categoria
        const newCategoryId = data.categories.length ? data.categories[data.categories.length - 1].id + 1 : 1;
        const newCategory = { id: newCategoryId, ...requestBody };
        data.categories.push(newCategory);
        writeData(data);
        return {
            statusCode: 201,
            body: JSON.stringify({message: 'Categoría creada' }),
        };

    case 'PUT':
        // Actualiza categorías
        const putRequestBody = JSON.parse(event.body);
        const categoryIndex = data.categories.findIndex((category) => category.id === categoryId);
        // en caso de no encontrar el index
        if (categoryIndex === -1) {
            return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Categoría no encontrada' }),
            };
        }
        // Actualiza la catoria sin sobre escribirla
        data.categories[categoryIndex] = { ...data.categories[categoryIndex], ...putRequestBody };
        writeData(data);
        return {
            statusCode: 200,
            body: JSON.stringify({category: data.categories[categoryIndex], message: 'Categoría actualizada' }),
        };

    case 'DELETE':
        // Elimina categorías
        data.categories = data.categories.filter((category) => category.id !== categoryId);
        writeData(data);
        return {
          statusCode: 204,
          body: JSON.stringify({ message: 'Categoría eliminada' }),
        };

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método no permitido' }),
      };
  }
}
