# E-commerce API Documentation

## Table of Contents
1. [Authentication](#1-authentication)
2. [User APIs](#2-user-apis)
3. [Product APIs](#3-product-apis)
4. [Cart APIs](#4-cart-apis)
5. [Order APIs](#5-order-apis)
6. [Admin APIs](#6-admin-apis)

## 1. Authentication

### 1.1 User Registration (Two-Step Process)

#### 1.1.1 Request OTP
Sends a one-time password (OTP) to the specified email address for verification.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/register/send-otp?email=user@example.com"
```

**Example Response:**
```json
{
    "success": true,
    "message": "OTP sent successfully to user@example.com"
}
```

#### 1.1.2 Verify OTP and Complete Registration
Verifies the OTP and creates a new user account.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/register/verify-otp?password=userpassword" \
-H "Content-Type: application/json" \
-d "{\"email\": \"user@example.com\", \"otp\": \"123456\"}"
```

**Example Response:**
```json
{
    "success": true,
    "message": "Registration successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "USER"
    }
}
```

### 1.2 User Login
Authenticates a user and returns a JWT token.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/login" \
-H "Content-Type: application/json" \
-d "{\"email\": \"user@example.com\", \"password\": \"userpassword\"}"
```

**Example Response:**
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "USER"
    }
}
```

### 1.3 Admin Registration
Creates a new admin account using a secure admin key.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/admin/auth/register?adminKey=admin-secret-key-12345" \
-H "Content-Type: application/json" \
-d "{\"email\": \"admin@example.com\", \"password\": \"adminpassword\"}"
```

**Example Response:**
```json
{
    "success": true,
    "message": "Admin registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 2,
        "email": "admin@example.com",
        "role": "ADMIN"
    }
}
```

### 1.4 Admin Login
Authenticates an admin user.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/admin/auth/login" \
-H "Content-Type: application/json" \
-d "{\"email\": \"admin@example.com\", \"password\": \"adminpassword\"}"
```

**Example Response:**
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 2,
        "email": "admin@example.com",
        "role": "ADMIN"
    }
}
```

### 1.5 Password Reset Request
Initiates the password reset process by sending a reset token to the user's email.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/forgot-password?email=user@example.com"
```

**Example Response:**
```json
{
    "success": true,
    "message": "Password reset instructions sent to your email"
}
```

### 1.6 Password Reset
Resets the user's password using the token received via email.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/reset-password?token=RESET_TOKEN&newPassword=newpassword"
```

**Example Response:**
```json
{
    "success": true,
    "message": "Password reset successful"
}
```

## 2. User APIs

### 2.1 Get User Details
Retrieves the authenticated user's profile information.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/user-details" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
    "id": 1,
    "email": "user@example.com",
    "role": "USER",
    "createdAt": "2024-03-15T10:30:00Z",
    "orders": [...],
    "cart": {...}
}
```

## 3. Product APIs

### 3.1 Get All Products (Public)
Retrieves a paginated list of active products.

**Request:**
```bash
# Get first page (10 products per page)
curl -X GET "http://localhost:5000/api/products?page=0&size=10"
```

**Example Response:**
```json
{
    "content": [
        {
            "id": 1,
            "name": "Smartphone X",
            "description": "Latest smartphone model",
            "price": 999.99,
            "category": "Electronics",
            "imageUrl": "http://example.com/smartphone.jpg",
            "averageRating": 4.5
        }
    ],
    "totalPages": 5,
    "totalElements": 50,
    "currentPage": 0
}
```

### 3.2 Get Product Details
Retrieves detailed information about a specific product.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/product/1"
```

**Example Response:**
```json
{
    "id": 1,
    "name": "Smartphone X",
    "description": "Latest smartphone model",
    "price": 999.99,
    "category": "Electronics",
    "imageUrl": "http://example.com/smartphone.jpg",
    "averageRating": 4.5,
    "reviews": [
        {
            "id": 1,
            "rating": 5,
            "comment": "Great product!",
            "userId": 1,
            "createdAt": "2024-03-15T10:30:00Z"
        }
    ]
}
```

### 3.3 Search Products
Searches products based on keywords.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/product-search?query=smartphone"
```

**Example Response:**
```json
{
    "results": [
        {
            "id": 1,
            "name": "Smartphone X",
            "description": "Latest smartphone model",
            "price": 999.99,
            "category": "Electronics"
        }
    ],
    "totalResults": 1
}
```

### 3.4 Get Products by Category
Retrieves products filtered by category.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/products/category/Electronics"
```

**Example Response:**
```json
{
    "content": [
        {
            "id": 1,
            "name": "Smartphone X",
            "price": 999.99,
            "category": "Electronics"
        }
    ],
    "totalProducts": 10
}
```

### 3.5 Product Reviews

#### 3.5.1 Add Review
Adds a review for a specific product.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/product/1/review?rating=5&comment=Great%20product!" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
    "success": true,
    "review": {
        "id": 1,
        "productId": 1,
        "userId": 1,
        "rating": 5,
        "comment": "Great product!",
        "createdAt": "2024-03-15T10:30:00Z"
    }
}
```

#### 3.5.2 Get Product Reviews
Retrieves all reviews for a specific product.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/product/1/reviews"
```

**Example Response:**
```json
{
    "reviews": [
        {
            "id": 1,
            "rating": 5,
            "comment": "Great product!",
            "userId": 1,
            "createdAt": "2024-03-15T10:30:00Z"
        }
    ],
    "averageRating": 5.0,
    "totalReviews": 1
}
```

## 4. Cart APIs

### 4.1 Get Cart Items
Retrieves the current user's shopping cart.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/cart" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
    "items": [
        {
            "id": 1,
            "productId": 1,
            "name": "Smartphone X",
            "quantity": 2,
            "price": 999.99,
            "totalPrice": 1999.98
        }
    ],
    "totalItems": 2,
    "subtotal": 1999.98
}
```

### 4.2 Add to Cart
Adds a product to the shopping cart.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/cart-add/1?quantity=1" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
    "success": true,
    "message": "Product added to cart",
    "cart": {
        "items": [...],
        "totalItems": 3,
        "subtotal": 2999.97
    }
}
```

### 4.3 Update Cart Item
Updates the quantity of a cart item.

**Request:**
```bash
curl -X PATCH "http://localhost:5000/api/cart-update/1?quantity=3" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
    "success": true,
    "message": "Cart updated",
    "cart": {
        "items": [...],
        "totalItems": 4,
        "subtotal": 3999.96
    }
}
```

### 4.4 Remove from Cart
Removes an item from the cart.

**Request:**
```bash
curl -X DELETE "http://localhost:5000/api/cart-delete/1" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
    "success": true,
    "message": "Item removed from cart",
    "cart": {
        "items": [],
        "totalItems": 0,
        "subtotal": 0
    }
}
```

## 5. Order APIs

### 5.1 Place Order
Creates a new order from the current cart.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/order-place?shippingAddress=123%20Main%20St%2C%20City" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
    "success": true,
    "order": {
        "id": 1,
        "items": [...],
        "totalAmount": 1999.98,
        "shippingAddress": "123 Main St, City",
        "status": "PENDING",
        "createdAt": "2024-03-15T10:30:00Z"
    }
}
```

### 5.2 Get Orders
Retrieves all orders for the current user.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/orders" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
    "orders": [
        {
            "id": 1,
            "totalAmount": 1999.98,
            "status": "PENDING",
            "createdAt": "2024-03-15T10:30:00Z"
        }
    ],
    "totalOrders": 1
}
```

### 5.3 Get Order Details
Retrieves detailed information about a specific order.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/order/1" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
    "id": 1,
    "items": [
        {
            "productId": 1,
            "name": "Smartphone X",
            "quantity": 2,
            "price": 999.99
        }
    ],
    "totalAmount": 1999.98,
    "shippingAddress": "123 Main St, City",
    "status": "PENDING",
    "createdAt": "2024-03-15T10:30:00Z"
}
```

## 6. Admin APIs

### 6.1 Product Management

#### 6.1.1 Get All Products (Admin View)
Retrieves all products with additional administrative information.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/products?page=0&size=10" \
-H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Example Response:**
```json
{
    "content": [
        {
            "id": 1,
            "name": "Smartphone X",
            "price": 999.99,
            "stock": 50,
            "active": true,
            "createdAt": "2024-03-15T10:30:00Z",
            "lastModified": "2024-03-15T10:30:00Z"
        }
    ],
    "totalPages": 5,
    "totalElements": 50
}
```

#### 6.1.2 Add Product
Creates a new product.

**Request:**
```bash
curl -X POST "http://localhost:5000/api/admin/product" \
-H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d "{\"name\": \"New Product\", \"description\": \"Product Description\", \"price\": 99.99, \"imageUrl\": \"http://example.com/image.jpg\", \"category\": \"Electronics\", \"active\": true}"
```

**Example Response:**
```json
{
    "success": true,
    "product": {
        "id": 2,
        "name": "New Product",
        "description": "Product Description",
        "price": 99.99,
        "category": "Electronics",
        "active": true
    }
}
```

#### 6.1.3 Update Product
Updates an existing product.

**Request:**
```bash
curl -X PATCH "http://localhost:5000/api/admin/product/1" \
-H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d "{\"name\": \"Updated Name\", \"price\": 89.99}"
```

**Example Response:**
```json
{
    "success": true,
    "product": {
        "id": 1,
        "name": "Updated Name",
        "price": 89.99,
        "lastModified": "2024-03-15T11:30:00Z"
    }
}
```

### 6.2 Order Management

#### 6.2.1 Get All Orders
Retrieves all orders in the system.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/orders" \
-H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Example Response:**
```json
{
    "orders": [
        {
            "id": 1,
            "userId": 1,
            "totalAmount": 1999.98,
            "status": "PENDING",
            "createdAt": "2024-03-15T10:30:00Z"
        }
    ],
    "totalOrders": 1
}
```

#### 6.2.2 Update Order Status
Updates the status of an order.

**Request:**
```bash
curl -X PATCH "http://localhost:5000/api/admin/order/1/status?status=SHIPPED" \
-H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Example Response:**
```json
{
    "success": true,
    "order": {
        "id": 1,
        "status": "SHIPPED",
        "lastModified": "2024-03-15T11:30:00Z"
    }
}
```

### 6.3 User Management

#### 6.3.1 Get All Users
Retrieves all users in the system.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/users" \
-H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Example Response:**
```json
{
    "users": [
        {
            "id": 1,
            "email": "user@example.com",
            "role": "USER",
            "createdAt": "2024-03-15T10:30:00Z"
        }
    ],
    "totalUsers": 1
}
```

#### 6.3.2 Update User Role
Updates a user's role.

**Request:**
```bash
curl -X PATCH "http://localhost:5000/api/admin/user/1/role?role=ADMIN" \
-H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Example Response:**
```json
{
    "success": true,
    "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "ADMIN",
        "lastModified": "2024-03-15T11:30:00Z"
    }
}
```
