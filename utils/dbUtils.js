const fs = require('fs');
const path = require('path');

// Definir la ruta del archivo db.json
const filePath = path.join(__dirname, '../db.json');

// Función auxiliar para leer datos desde db.json
const readData = () => {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

// Función para escribir datos en db.json
const writeData = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// Exportar las funciones para que puedan ser utilizadas en otros archivos
module.exports = { readData, writeData };