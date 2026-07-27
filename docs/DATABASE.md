# Database Documentation

## Entity Relationships & Schemas

### 1. User Model (`User.model.js`)
- Fields: `name`, `email` (unique), `password` (select: false), `role` (`buyer` | `seller` | `admin`), `isActive` (boolean), `refreshToken` (select: false), `createdAt`, `updatedAt`.

### 2. Store Model (`Store.model.js`)
- Fields: `seller` (Ref -> User), `name`, `slug` (unique), `description`, `businessEmail`, `businessPhone`, `status` (`pending` | `approved` | `rejected` | `suspended`), `rejectionReason`, `createdAt`.

### 3. Product Model (`Product.model.js`)
- Fields: `seller` (Ref -> User), `store` (Ref -> Store), `name`, `slug` (unique), `description`, `category`, `brand`, `price`, `discountPrice`, `stock`, `images` (Array of Cloudinary URLs), `ratingsAverage`, `ratingsCount`, `isActive`.

### 4. Order Model (`Order.model.js`)
- Fields: `orderNumber` (unique), `buyer` (Ref -> User), `items` (Array of `{ product, seller, store, productName, productImage, quantity, unitPrice, subtotal, status, statusHistory }`), `shippingAddress`, `subtotal`, `shippingAmount`, `taxAmount`, `totalAmount`, `paymentMethod`, `paymentStatus`, `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `orderStatus`.

### 5. Review Model (`Review.model.js`)
- Fields: `user` (Ref -> User), `product` (Ref -> Product), `store` (Ref -> Store), `order` (Ref -> Order), `rating` (1–5), `comment`, `isVerifiedPurchase` (boolean).
