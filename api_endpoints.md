# RakaRituals API Documentation

This document provide a comprehensive guide for testing all API endpoints.

**Base URL:** `http://localhost:5000`

---

## 🔐 Authentication
**Base Path:** `/api/auth`

### 1. Register User
- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Auth Required:** No
- **Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Login User
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Auth Required:** No
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
*Note: Copy the `token` from the response for subsequent requests.*

> [!IMPORTANT]
> **Test Admin Credentials:**
> - **Email:** `admin@example.com`
> - **Password:** `admin123`
> Use these to login and get an admin token for product management.

---

## 📦 Products
**Base Path:** `/api/products`

### 1. Get All Products
- **URL:** `/api/products?keyword=ritual&pageNumber=1`
- **Method:** `GET`
- **Auth Required:** No

### 2. Get Best Sellers
- **URL:** `/api/products/best`
- **Method:** `GET`
- **Auth Required:** No

### 3. Get Product By ID
- **URL:** `/api/products/:id`
- **Method:** `GET`
- **Auth Required:** No

### 4. Create Product (Admin Only)
- **URL:** `/api/products`
- **Method:** `POST`
- **Auth Required:** Yes (Admin Token)
- **Body:**
```json
{
  "name": "Raka Special Ritual",
  "price": 49.99,
  "description": "Premium ritual experience.",
  "image": "/images/sample.jpg",
  "category": "Rituals",
  "countInStock": 10,
  "isBestSeller": true
}
```

---

## 🛒 Shopping Cart
**Base Path:** `/api/cart`

### 1. Get User Cart
- **URL:** `/api/cart`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token)

### 2. Add to Cart
- **URL:** `/api/cart`
- **Method:** `POST`
- **Auth Required:** Yes (Bearer Token)
- **Body:**
```json
{
  "productId": "PRODUCT_ID_HERE",
  "quantity": 2
}
```

### 3. Update Cart Item
- **URL:** `/api/cart/:productId`
- **Method:** `PUT`
- **Auth Required:** Yes (Bearer Token)
- **Body:**
```json
{
  "quantity": 5
}
```

---

## 🧾 Orders
**Base Path:** `/api/orders`

### 1. Place Order (Create Razorpay Order)
- **URL:** `/api/orders`
- **Method:** `POST`
- **Auth Required:** Yes (Bearer Token)
- **Body:**
```json
{
  "shippingAddress": {
    "fullName": "Jane Doe",
    "phone": "+919876543210",
    "addressLine": "Flat 405, Lotus Apartments",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "referralCode": "RAKA_VIP_777",
  "referral": "Friend Recommend"
}
```
- **Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "647ef5c8bc82512f45ea2e9f",
    "user": "647ef59cbc82512f45ea2e8d",
    "orderItems": [
      {
        "product": "647ef459bc82512f45ea2e6c",
        "name": "Healing Meditational Bowl",
        "quantity": 1,
        "price": 2500
      }
    ],
    "totalPrice": 2500,
    "isPaid": false,
    "shippingAddress": { ... },
    "paymentStatus": "Pending",
    "referralCode": "RAKA_VIP_777",
    "referral": "Friend Recommend",
    "razorpayOrderId": "order_Lu5tM772Gf9K3N",
    "createdAt": "2026-05-18T07:35:00.000Z",
    "updatedAt": "2026-05-18T07:35:02.000Z"
  },
  "razorpayOrder": {
    "id": "order_Lu5tM772Gf9K3N",
    "entity": "order",
    "amount": 250000,
    "amount_paid": 0,
    "amount_due": 250000,
    "currency": "INR",
    "receipt": "647ef5c8bc82512f45ea2e9f",
    "status": "created",
    "attempts": 0,
    "notes": [],
    "created_at": 1686036900
  },
  "razorpayKey": "rzp_test_SqiW7RUSCgka8N"
}
```
*Note: Clears the cart upon success and returns necessary Razorpay credentials directly to the frontend.*

### 2. Verify and Capture Payment
- **URL:** `/api/orders/:id/pay`
- **Method:** `POST`
- **Auth Required:** Yes (Bearer Token)
- **Body:**
```json
{
  "razorpay_payment_id": "pay_Lu5uF12NqF8T9m",
  "razorpay_order_id": "order_Lu5tM772Gf9K3N",
  "razorpay_signature": "5e174b0cb997fa44b3fb24cbce8006e864703a55bd442c5ee15d97f269a8b1c4"
}
```
- **Logics:**
  - Verifies the integrity of the payment using the `RAZORPAY_API_SECRET` to validate the signature.
  - Updates `isPaid` to `true`, saves the payment timestamp in `paidAt`, and updates `paymentStatus` to `"Success"`.
- **Response:**
```json
{
  "message": "Payment verified and captured successfully!",
  "order": {
    "_id": "647ef5c8bc82512f45ea2e9f",
    "user": "647ef59cbc82512f45ea2e8d",
    "orderItems": [
      {
        "product": { ... },
        "name": "Healing Meditational Bowl",
        "quantity": 1,
        "price": 2500
      }
    ],
    "totalPrice": 2500,
    "isPaid": true,
    "paidAt": "2026-05-18T07:36:00.000Z",
    "razorpayOrderId": "order_Lu5tM772Gf9K3N",
    "razorpayPaymentId": "pay_Lu5uF12NqF8T9m",
    "razorpaySignature": "5e174b0cb997fa44b3fb24cbce8006e864703a55bd442c5ee15d97f269a8b1c4",
    "paymentStatus": "Success",
    "referralCode": "RAKA_VIP_777",
    "referral": "Friend Recommend"
  }
}
```

### 3. Get Single Order by ID
- **URL:** `/api/orders/:id`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token)
- **Response:** Returns all order items, pricing details, shipping details, payment info (status, paidAt, IDs), and referral details.

### 4. Get My Orders
- **URL:** `/api/orders`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token)

---

## 🛠️ Testing Instructions

### Using Postman/Insomnia
1. Set the **Authorization** header to `Bearer <YOUR_TOKEN>`.
2. Set **Content-Type** to `application/json`.
3. Use the raw JSON bodies provided above.

### Using VS Code (REST Client Extension)
Create a `.http` file with the following content:
```http
@baseUrl = http://localhost:5000
@token = YOUR_JWT_TOKEN_HERE

### Register
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@test.com",
  "password": "password"
}

### Login
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "password"
}
```
