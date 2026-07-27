# API Documentation

## Auth Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register new user (`buyer` or `seller`). Blocks `admin` role. |
| `POST` | `/login` | Public | Authenticate user, return access token and set HttpOnly refresh cookie. |
| `POST` | `/logout` | Authenticated | Clear refreshToken in DB and clear browser cookie. |
| `POST` | `/refresh-token` | Public (Cookie) | Rotate access and refresh tokens. |
| `GET` | `/me` | Authenticated | Fetch current authenticated user. |

## Product Endpoints (`/api/v1/products`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/public` | Public | Search, filter, sort & paginate products. |
| `GET` | `/public/:slug` | Public | Fetch product details by slug. |
| `GET` | `/seller` | Seller | Get seller's listed products with search & pagination. |
| `POST` | `/` | Seller | Create new product with Cloudinary image upload. |
| `PUT` | `/:id` | Seller | Update seller product. |
| `DELETE` | `/:id` | Seller | Delete seller product. |

## Seller AI Assistant (`/api/v1/seller/ai`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/generate-product-content` | Seller | Generate AI title, description, highlights, and keywords (rate limited to 10 req/15 min). |

## Order & Payment Endpoints (`/api/v1/payments`, `/api/v1/orders`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/payments/create-order` | Buyer | Initialize Razorpay order with server-calculated totals. |
| `POST` | `/payments/verify` | Buyer | Cryptographically verify payment signature & create order. |
| `GET` | `/orders/my-orders` | Buyer | Get buyer order history. |
| `GET` | `/orders/:id` | Buyer/Admin | Get order details by ID or order number. |
| `GET` | `/seller/orders` | Seller | Get seller-specific order items and subtotals. |
| `PATCH` | `/seller/orders/:id/status` | Seller | Update seller item fulfillment status. |

## Admin Endpoints (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/analytics` | Admin | Get marketplace KPIs, revenue trends, top sellers, top products. |
| `GET` | `/admin/users` | Admin | Get user directory with role and search filters. |
| `PATCH` | `/admin/users/:id/toggle-status` | Admin | Activate or deactivate user account. |
