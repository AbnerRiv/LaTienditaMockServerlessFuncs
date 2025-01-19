# LaTienditaMockServerlessFuncs

Mock Serverless Functions en Netlify

1) login<br>
POST: devuelve un token jwt para guardar sesion activa

2) users<br>
GET: obtiene los usuarios creados<br>
POST: crea o registra un usuario<br>
PUT: actualiza un usuario existente<br>
DELETE: elimina un usuario<br>

3) products<br>
GET: obtiene una lista de los productos<br>
POST: crea un producto<br>
PUT: actualiza un producto existente<br>
DELETE: elimina un producto<br>

4) categories<br>
GET: obtiene una lista de categorias creadas<br>
POST: crea una nueva categoría<br>
PUT: actualiza una categoría existente<br>
DELETE: elimina una categoría<br>

Estructura para Usuarios, Productos, y Categorias:<br>

Users
```json
{
"id": "1",
"username": "asdfewere",
"email": "john.doe@example.com",
"password": "password132",
"role": "customer",
}
```

Products:
```json
{
"id": "1",
"name": "Sample Product",
"description": "This is a sample product.",
"price": 19.99,
"stockQuantity": 50,
"imageUrl": "http://example.com/image.jpg",
"categoryId": "1",
}
```

Categories:
```json
{
"id": "1",
"name": "Electronics",
"description": "Electronics products like phones, laptops, etc.",
}
```

