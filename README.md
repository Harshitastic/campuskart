# CampusKart — College E-Commerce & Peer-to-Peer Classifieds Platform

Live Demo : https://campuskart-phi.vercel.app/#/

CampusKart is a premium, full-stack, responsive web application designed exclusively for college campuses in India. It integrates a platform-managed e-commerce store (selling academic textbooks, calculators, engineering kits, and hostel essentials) with a commission-free student **Buy & Sell** exchange directory.

The application features a clean SPA (Single Page Application) frontend, a modular Express backend, and a Mongoose-based database, fully optimized for serverless deployments on Vercel.

---

## 🚀 Tech Stack

### Frontend (SPA Client)
*   **Core Logic:** Vanilla Javascript (ES6 Modules)
*   **Routing:** Custom client-side hash router with dynamic views hydration
*   **Styling:** Custom CSS design system (Notion-inspired minimalism, Apple-inspired glassmorphism)
*   **Typography:** Google Poppins font families
*   **Charts:** Chart.js (CDN-integrated) for administrative telemetries
*   **Icons:** Bootstrap Icons font set
*   **State Management:** LocalStorage-backed shopping cart and authorization stores

### Backend (REST API Server)
*   **Runtime:** Node.js & Express.js
*   **Database:** MongoDB & Mongoose ODM
*   **Authentication:** JSON Web Tokens (JWT) stored in HTTP-Only cookies & fallback headers
*   **Security:** BCrypt password hashing & role-based middleware guards
*   **File Uploads:** Multer memory storage parser
*   **Image Storage:** Dual-mode setup (Cloudinary upload stream with a zero-config base64 database fallback)
*   **Mock gateways:** In-app sandbox simulator for checkout confirmation

---

## ✨ Features

### 1. Student E-Commerce Store
*   **Categorized Filters:** Quick search and filtering across books, tools, Merch, and stationery.
*   **Product Magnifier:** Hover-over image coordinates zoom on details pages.
*   **Verified Buyer Reviews:** Reviews can only be submitted for products that have a completed order in the database with a status of `Delivered`.

### 2. Peer Buy & Sell Board
*   **Classifieds Postings:** Post used study desks, cycles, or keyboards.
*   **Direct Contact:** Generates mailto pre-filled templates so buyers can contact sellers directly.
*   **Moderation Flagger:** Peer-to-peer reporting system to mark listings as spam.

### 3. Order Checkout & Payments
*   **Coupons Settings:** Dynamic coupon validation (minimum order value and expiry date checks).
*   **Simulated Gateway:** Mock Razorpay checkout popup letting developers trigger payment success/failure.
*   **Dispatch Tracker:** Visual timelines on profile grids showing fulfillment stages (*Pending* ➔ *Confirmed* ➔ *Shipped* ➔ *Delivered*).

### 4. Admin Control Center (`#/admin`)
*   **Analytics Dashboard:** Visual Chart.js telemetry mapping category sales shares and best-selling lists.
*   **Product & Category CRUD:** Manage catalog inventory items and upload fresh banners.
*   **Order Dispatcher:** Step-by-step dispatch dropdowns.
*   **Spam Listings Audit:** Flagger moderator which lets admins delete flagged listings.
*   **Coupons Settings:** CRUD settings for active discount coupons.
*   **User Admin:** Toggles to suspend/unsuspend student accounts.

---

## 🛠️ Local Installation & Setup

### Prerequisites
*   Node.js (v18 or higher recommended)
*   MongoDB installed and running locally on port `27017` (or MongoDB Atlas URI)

### Setup Steps
1.  **Clone the Repository & Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Settings:**
    Create a `.env` file in the root directory (defaults are pre-configured in `.env` for localhost):
    ```env
    PORT=5001
    MONGODB_URI=mongodb://localhost:27017/campuskart
    JWT_SECRET=campuskart_jwt_secret_token
    # Optional Cloudinary (will fallback to Base64 in DB if empty)
    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=
    ```
3.  **Seed the Database:**
    Populate database collections with initial mock students, categories, products (using local Gemini images), listings, and coupons:
    ```bash
    npm run seed
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
5.  **Open in Browser:**
    Load [http://localhost:5001](http://localhost:5001) in your browser.

---

## 🔐 Mock Credentials

Use the following pre-seeded credentials to explore the roles:

### 🎒 Student Account
*   **Email:** `student@campuskart.com`
*   **Password:** `student123`

### 🛡️ Administrator Account
*   **Email:** `admin@campuskart.com`
*   **Password:** `admin123`

---

## ☁️ Vercel Serverless Integration

CampusKart is pre-configured to run serverless on Vercel without adjustments:
*   [vercel.json](file:///Users/harshitastic/Desktop/Thiranex%20Internship/CampusKart/vercel.json) rewrites all `/api/*` requests to the [api/server.js](file:///Users/harshitastic/Desktop/Thiranex%20Internship/CampusKart/api/server.js) serverless handler.
*   Remaining paths are served statically from the `/public` static folder.
*   No external storage setup is required for mock testing: image uploads automatically convert to inline base64 formats, and the mock checkout operates completely in-memory.
