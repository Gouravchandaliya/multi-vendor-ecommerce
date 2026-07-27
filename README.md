# Multi-Vendor E-Commerce Marketplace (MERN)

A production-grade, full-stack multi-vendor e-commerce marketplace built using the **MERN** stack (MongoDB, Express.js, React, Node.js). Features role-based access control (Buyer, Seller, Admin), real-time MongoDB analytics, server-side Razorpay test mode payment processing, Cloudinary image management, and an AI-powered Seller Product Content Assistant using Google Gemini.

---

## 🌟 Live Demo & Architecture Overview

- **Frontend**: Deployed on **Vercel** (React, Redux Toolkit, Tailwind CSS, React Router v7)
- **Backend API**: Deployed on **Render** (Node.js, Express.js, Mongoose)
- **Database**: **MongoDB Atlas** (Cloud Database)
- **External Services**: Razorpay (Payments), Cloudinary (Media Uploads), Google Gemini API (AI Assistant)

---

## ✨ Features by Role

### 🛍️ Buyer Features
- **Authentication**: Secure sign-up, login, HttpOnly refresh token rotation, and persistent sessions.
- **Product Discovery**: Global search with regex escaping, category filter sidebar, price range slider, star rating filter, whitelisted sorting, and server-side pagination.
- **Product Details**: Multi-image preview, store details, discount badges, and customer reviews with verified purchaser badges.
- **Cart & Wishlist**: Multi-vendor store grouping, quantity controls, guest cart merging upon login, and item migration to/from wishlist.
- **Checkout & Payments**: Delivery address manager, server-calculated totals, and Razorpay payment gateway integration.
- **Order Tracking**: Detailed order history and 6-step visual order tracking timeline tracker (`Placed` -> `Confirmed` -> `Processing` -> `Shipped` -> `Out for Delivery` -> `Delivered`).
- **Product Reviews**: Submit star ratings (1★ to 5★) and written reviews after product delivery.

### 🏢 Seller Features
- **Store Onboarding**: Create a store application subject to admin approval.
- **Product Management**: Full CRUD operations with multi-image upload via Cloudinary.
- **✨ AI Content Assistant**: Generate e-commerce product titles, descriptions, key highlights, and search keywords using Google Gemini API (`gemini-2.5-flash`). Includes tone selection (`Professional`, `Concise`, `Friendly`).
- **Order Fulfillment**: Track multi-vendor orders, update fulfillment statuses per store item, and manage stock inventory.
- **Seller Analytics**: Interactive SVG revenue trend line chart, order status donut chart, top-selling products, and low stock inventory alerts (`stock <= 5`).

### 🛡️ Admin Features
- **Marketplace Control Center**: Real-time aggregate KPIs (Gross Revenue, Total Orders, Total Users, Total Sellers, Approved Stores, Pending Applications, Total Products, Low Stock Alerts).
- **Time Range Filtering**: Filter marketplace analytics by `7 Days`, `30 Days`, `90 Days`, or `1 Year`.
- **Store Approval Workflow**: Review, approve, reject with reason, or suspend seller stores.
- **User Directory**: View paginated directory of buyers and sellers, filter by role, search, and activate/deactivate user accounts.
- **Review & Order Moderation**: Monitor global marketplace orders and reviews.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite, React Router v7 |
| **State Management** | Redux Toolkit |
| **Styling** | Tailwind CSS v3 |
| **Backend API** | Node.js, Express.js (v5) |
| **Database & ODM** | MongoDB Atlas, Mongoose v8 |
| **Authentication** | JWT (Short-lived Access Token in Redux memory + Long-lived Refresh Token in `HttpOnly` cookie) |
| **Payment Gateway** | Razorpay Node.js SDK (HMAC SHA256 cryptographic verification) |
| **Image Hosting** | Cloudinary API |
| **AI Assistant** | Google Gemini REST API (`gemini-2.5-flash`) |

---

## 🔒 Security Architecture

1. **Token Storage**: Access token stored in Redux memory; Refresh token stored in `HttpOnly`, `SameSite=None`, `Secure` cookies with token rotation.
2. **Server-Side Pricing**: Order subtotals and totals are calculated 100% server-side from MongoDB products. Client prices are ignored.
3. **Atomic Stock Decrements**: Inventory decrements use conditional query `{ _id: productId, stock: { $gte: quantity } }` to prevent negative stock and race conditions.
4. **Object-Level Authorization (IDOR Protection)**: Database ownership checks (`product.seller == req.user._id`, `address.user == req.user._id`) prevent unauthorized access.
5. **NoSQL & ReDoS Protection**: All search and filter query strings pass through `escapeRegex` utility.

---

## 🚀 Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/marketplace?retryWrites=true&w=majority
ACCESS_TOKEN_SECRET=your_access_token_secret_string
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret_string
REFRESH_TOKEN_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

---

## 💻 Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Gouravchandaliya/multi-vendor-ecommerce.git
   cd multi-vendor-ecommerce
   ```

2. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

4. **Run Server**:
   ```bash
   cd ../server
   npm run dev
   ```

5. **Run Client**:
   ```bash
   cd ../client
   npm run dev
   ```

6. **Run Backend Integration Tests**:
   ```bash
   cd ../server
   node --test seller-ai-phase12.test.js admin-analytics-phase11.test.js seller-analytics-phase10.test.js product-search-phase9.test.js review-phase9.test.js
   ```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).