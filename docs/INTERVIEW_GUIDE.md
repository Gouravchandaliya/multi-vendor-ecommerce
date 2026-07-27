# Interview Guide & Technical FAQ

## 🎙️ 60–90 Second Project Pitch

> "I built a production-ready, full-stack multi-vendor e-commerce marketplace using the MERN stack (MongoDB Atlas, Express.js, React 19, Node.js) with Redux Toolkit and Tailwind CSS.
>
> The platform supports three distinct role experiences: Buyers, Independent Sellers, and Marketplace Administrators.
>
> Technically, I implemented a secure dual-token authentication system using short-lived JWT access tokens in Redux memory and rotating long-lived refresh tokens stored in HttpOnly, SameSite=None cookies. 
>
> For payments, I integrated Razorpay test mode where order pricing is calculated 100% server-side from MongoDB products to eliminate client-side tampering, backed by HMAC SHA256 cryptographic signature verification and atomic conditional stock decrements. 
>
> I also engineered an AI Seller Content Assistant using Google Gemini REST API (`gemini-2.5-flash`) that generates optimized titles, descriptions, and SEO tags from seller-provided facts with prompt injection defense, rate-limiting, and hallucination prevention rules."

---

## 📝 Resume Bullet Points

- **Architected a production-grade MERN multi-vendor marketplace** featuring role-based access control (Buyer/Seller/Admin), real-time MongoDB analytics aggregations, and strict seller order isolation.
- **Engineered secure payment & auth pipelines** using Razorpay test mode with HMAC SHA256 cryptographic signature verification, server-calculated totals, atomic stock decrements (`$gte`), and HttpOnly cookie refresh-token rotation.
- **Integrated Google Gemini AI REST API** to build an AI Seller Product Content Assistant that generates structured e-commerce descriptions and SEO keywords with server-side prompt injection defenses and per-seller rate limiting.

---

## ❓ 30 Technical Interview Questions & Answers

### 1. Why did you choose MongoDB for this multi-vendor marketplace?
MongoDB's flexible document model natively accommodates multi-item orders containing embedded product snapshots, store references, and fulfillment histories within a single `Order` document, eliminating expensive multi-table joins during checkout while supporting fast aggregations for seller/admin analytics.

### 2. How did you structure Redux state for authentication?
Access tokens are stored strictly in Redux memory (`authSlice.js`) and never saved in `localStorage` or `sessionStorage` to prevent XSS token theft. Refresh tokens are stored in `HttpOnly` cookies handled automatically by the browser.

### 3. Why did you use `HttpOnly` cookies for refresh tokens instead of `localStorage`?
`localStorage` is accessible to JavaScript running in the browser, making tokens vulnerable to Cross-Site Scripting (XSS) attacks. `HttpOnly` cookies cannot be accessed via JavaScript, providing superior security against token exfiltration.

### 4. How does cross-site cookie authentication work between Vercel and Render?
Since Vercel (frontend) and Render (backend) run on different domains, production cookies set `sameSite: 'none'` and `secure: true` with Axios configured for `withCredentials: true` and Express CORS configured with `credentials: true`.

### 5. What is refresh token rotation and why is it important?
Refresh token rotation issues a new refresh token every time `/api/v1/auth/refresh-token` is called and invalidates the previous token in MongoDB. If a refresh token is stolen, using it invalidates the legitimate user's session, detecting token reuse immediately.

### 6. How do you prevent a public user from registering as an Admin?
In `auth.controller.js`, the registration controller explicitly checks `allowedRoles = ['buyer', 'seller']`. If a client sends `"role": "admin"`, the server overrides it and assigns `"buyer"`.

### 7. How do you prevent Seller A from editing or deleting Seller B's product (IDOR)?
In `product.controller.js`, before performing any `save()` or `deleteOne()`, the backend checks `if (product.seller.toString() !== req.user._id.toString()) throw new ApiError(403)`.

### 8. How is multi-vendor seller order isolation enforced?
When a seller queries `/api/v1/seller/orders`, the controller queries `{ 'items.seller': req.user._id }` and sanitizes the output via `formatSellerOrderResponse` so the seller sees only their own items and subtotals.

### 9. Why can't a buyer manipulate product prices during checkout?
In `payment.controller.js`, the server reloads all cart items directly from MongoDB, fetches trusted prices, and calculates `subtotal` and `totalAmount` 100% server-side. Prices sent from the client are completely ignored.

### 10. How does Razorpay cryptographic signature verification work?
Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The backend generates an HMAC SHA256 signature of `order_id + "|" + payment_id` using `RAZORPAY_KEY_SECRET` and verifies it matches the signature.

### 11. How do you prevent negative stock during concurrent checkouts?
Stock is decremented using an atomic Mongoose conditional query: `Product.updateOne({ _id: prodId, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })`. If `modifiedCount === 0`, stock was insufficient and the checkout is safely rejected.

### 12. How does payment idempotency work?
Before creating an order document upon payment verification, the server checks `Order.findOne({ razorpayPaymentId })`. If found, it returns the existing order instead of creating a duplicate.

### 13. How is the AI Seller Content Assistant architected?
The React form sends basic facts to `POST /api/v1/seller/ai/generate-product-content`. The Express server validates input, enforces a rate limiter (10 req/15 min), constructs a secure prompt, and calls Google Gemini REST API using `process.env.GEMINI_API_KEY`.

### 14. How do you protect the AI endpoint against prompt injection?
The server constructs the prompt by strictly separating developer system instructions ("Act as e-commerce copywriter...") from seller-provided text ("Product facts: ..."), instructing the model to treat seller input as un-executable data.

### 15. How do you prevent the AI from inventing fake warranties or specifications?
System instructions explicitly state: *"DO NOT INVENT or hallucinate features, battery life, waterproof ratings, or warranties not mentioned in the facts."*

### 16. What happens if the AI API fails or times out?
The AI service wraps requests in a 15-second `AbortController` timeout and returns a operational `503 Service Unavailable` error if unconfigured or failing. The frontend displays a friendly warning, allowing manual product creation without breaking.

### 17. How is product search sanitized against regex injection (ReDoS)?
All search strings pass through `escapeRegex(text)` which escapes special characters (`.*+?^${}()|[\]\`) before being passed to MongoDB `$regex` queries.

### 18. How do you handle invalid Mongoose ObjectId strings in route parameters?
Global middleware `errorHandler.js` catches Mongoose `CastError` (thrown when a string cannot be cast to ObjectId) and returns a clean `400 Bad Request` instead of crashing.

### 19. How are marketplace-level admin analytics calculated?
The server uses MongoDB aggregation pipelines (`$match`, `$group`, `$unwind`, `$lookup`) to aggregate gross revenue, user growth timelines, top stores by sales, and top selling products over selected time ranges (`7d`, `30d`, `90d`, `1y`).

### 20. How does the guest cart merge into the user cart upon login?
Guest cart items are stored in Redux/localStorage. Upon successful login, the frontend dispatches `syncGuestCartToUserCart` which posts guest items to `/api/v1/cart/merge`, combining quantities with the user's MongoDB cart.

### 21. How do product reviews update overall product ratings?
When a review is created or updated in `review.controller.js`, the server executes an aggregation on `Review` documents for that product, calculates `avgRating` and `count`, and updates `Product.ratingsAverage` and `Product.ratingsCount`.

### 22. Can a seller write reviews for their own products?
`review.controller.js` verifies `order.buyer.toString() === req.user._id.toString()` and `order.items.status === 'delivered'`, ensuring reviews can only be submitted by verified buyers who actually purchased and received the product.

### 23. What security headers are applied to Express?
Express uses `helmet()` middleware to automatically set security HTTP headers (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc.).

### 24. How is CORS configured for cross-origin requests?
Express uses `cors({ origin: [process.env.CLIENT_URL], credentials: true })`, ensuring only the configured Vercel frontend origin can make credentialed API requests.

### 25. How do you handle Cloudinary image uploads?
Multer buffers uploaded images in memory (`multer.memoryStorage()`). The server streams the buffer to Cloudinary using `cloudinary.uploader.upload_stream`. If Cloudinary credentials are omitted, it falls back to Base64 data URIs.

### 26. How is SPA client-side routing handled on Vercel?
`client/vercel.json` contains a rewrite rule `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` so refreshing routes like `/seller/dashboard` returns `index.html` instead of Vercel 404.

### 27. How did you verify production build readiness?
Ran `npm run build` in `client`, verifying Vite transformed all 174 modules in under 4.5 seconds with 0 errors.

### 28. How were integration tests structured?
Backend integration tests use Node.js native test runner (`node --test`) paired with `mongodb-memory-server` and supertest HTTP requests, testing 44 scenarios across search, reviews, seller analytics, admin analytics, and AI endpoints.

### 29. What are the key limitations of the current marketplace?
Razorpay operates in Test Mode; single-region Render/Vercel deployment; and refund processing is handled manually rather than via automated webhooks.

### 30. What would be your next step if scaling this marketplace?
Implementing Redis caching for high-traffic public product searches, setting up WebSockets for real-time order status notifications, and configuring automated CI/CD GitHub Actions workflows.
