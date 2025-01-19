# LaTienditaMockServerlessFuncs

Mock Serverless Functions en Netlify

1) login
POST: devuelve un token jwt para guardar sesion activa

2) users
GET: obtiene los usuarios creados
POST: crea o registra un usuario
PUT: actualiza un usuario existente
DELETE: elimina un usuario

3) products
GET: obtiene una lista de los productos
POST: crea un producto
PUT: actualiza un producto existente
DELETE: elimina un producto

4) categories
GET: obtiene una lista de categorias creadas
POST: crea una nueva categoría
PUT: actualiza una categoría existente
DELETE: elimina una categoría

Estructura para Usuarios, Productos, y Categorias:

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

