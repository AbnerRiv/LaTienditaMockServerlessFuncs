import { readData, writeData } from './dbUtils';
const bcrypt = require('bcryptjs');

// Cifra la contraseña del usuario con bcrypt
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Función que maneja CRUD
exports.handler = async (event, context) => {
  // Lee la data de db.json
  const data = readData();

  // obtiene el user ID si lo hay
  const userId = (event.path.split('/').pop() || -1);

  // Verifica el metodo http para ejecutar esa accion
  switch (event.httpMethod) {
    case 'GET':
        // Obtiene los usuarios
        return {
            statusCode: 200,
            headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(data.users),
        };

    case 'POST':
        // Crea nuevo usuario
        const requestBody = JSON.parse(event.body);
        const { password } = requestBody;
        // cifra la constreña para guardarla junto la otra info del usuario
        const hashedPassword = await hashPassword(password);

        const newUserId = data.users.length ? data.users[data.users.length - 1].id + 1 : 1;
        const newUser = { id: newUserId, ...requestBody, password: hashedPassword };
        data.users.push(newUser);
        writeData(data);
        return {
            statusCode: 201,
            body: JSON.stringify({message: 'Usuario Creado' }),
        };

    case 'PUT':
        // Actualiza usuario
        const putRequestBody = JSON.parse(event.body);
        const userIndex = data.users.findIndex((user) => user.id === userId);
        // en caso de no encontrar el index
        if (userIndex === -1) {
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Usuario no encontrado' }),
          };
        }
        // Si se proporciona una contraseña, se cifra
        if (putRequestBody.password) {
          putRequestBody.password = await hashPassword(putRequestBody.password);
        }
        // Actualiza usuario sin sobre escribirlo
        data.users[userIndex] = { ...data.users[userIndex], ...putRequestBody };
        writeData(data);
        return {
          statusCode: 200,
          body: JSON.stringify({user: data.users[userIndex], message: 'Usuario actualizado' })
        };
      

    case 'DELETE':
        // Elimina un usuario
        const userId = event.path.split('/').pop();
        data.users = data.users.filter((user) => user.id !== userId);
        writeData(data);
        return {
            statusCode: 204,
            body: JSON.stringify({ message: 'User deleted' }),
        };
       


    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
  }
};
