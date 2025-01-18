# LaTienditaMockServerlessFuncs

Mock Serverless Functions using JSON Server

Estructura para Usuarios, Productos, y Categoria:
Users
{
"id": "1",
"username": "asdfewere",
"email": "john.doe@example.com",
"password": "password132",
"role": "customer", // only "admin" and "productEditor"
}

Products:
{
"id": "1",
"name": "Sample Product",
"description": "This is a sample product.",
"price": 19.99,
"stockQuantity": 50,
"imageUrl": "http://example.com/image.jpg",
"categoryId": "1", // Reference to ProductCategory and can be nullable
}

ProductCategories:
{
"id": "1",
"name": "Electronics",
"description": "Electronics products like phones, laptops, etc.",
}
