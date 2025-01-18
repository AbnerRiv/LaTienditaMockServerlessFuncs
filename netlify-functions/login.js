import { readData } from './dbUtils';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Compare the provided password with the stored hashed password
const comparePassword = async (providedPassword, storedPasswordHash) => {
  return bcrypt.compare(providedPassword, storedPasswordHash);
};

// Generar token JWT
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };
  // retorna la clave secreta que debe ser almacenada de manera segura
  return jwt.sign(payload, 'your_jwt_secret_key', { expiresIn: '1h' });
};


// Función que maneja el login
exports.handler = async (event, context) => {
  // Lee la data de db.json
  const data = readData();

    if( event.httpMethod !== 'POST' ){
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Método HTTP no permitido' }),
        };
    }

    const { username, password } = JSON.parse(event.body);

    // Encuentra el usuario por username
    const user = data.users.find((u) => u.username === username);

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
};
