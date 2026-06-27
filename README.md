# Cafe QR: QR-Based Cafe Self-Ordering & Management System

A modern, full-stack web application designed to streamline cafe operations and customer self-ordering. Customers can scan a table-specific QR code, browse a dynamic menu, customize preferences, and place orders directly. The cafe admin panel receives orders in real-time, manages preparation statuses, updates menu availability, and handles billing with PDF invoice generation.

---

## 🚀 Features

### **For Customers**
- **Table-Specific QR Ordering**: Seamless table identification via scanned QR codes.
- **Interactive Menu**: Grouped categories, vegetarian/non-vegetarian filters, search, and item descriptions.
- **Live Cart & Preference Selection**: Customizable order notes/preferences (e.g., sweetness levels, extra ice).
- **Instant Order Confirmations**: Real-time status tracking from preparation to delivery.

### **For Admins**
- **Real-Time Order Dashboard**: Visual progress tracking (Placed ➜ Preparing ➜ Delivered) powered by Socket.io.
- **Menu Management**: Add, update, toggle availability, or delete menu items.
- **Invoice & Bill Generation**: One-click PDF download and printing using `jsPDF`.
- **Table QR Management**: Generate and download unique QR codes mapped to table numbers.
- **Security**: Secure JWT-based admin login with bcrypt password hashing and password recovery support (via Brevo SMTP).

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 19 (Vite)
- **Routing**: React Router DOM v7
- **Styling**: Vanilla CSS (custom tokens, transitions, responsive layout)
- **Icons**: Lucide React
- **Real-Time Communication**: Socket.io Client
- **Utilities**: `qrcode.react` (QR generation), `jspdf` (PDF generation), `react-hot-toast` (alerts)

### **Backend**
- **Runtime & Framework**: Node.js & Express
- **Database**: PostgreSQL (using `pg` pool)
- **Real-Time Server**: Socket.io
- **Auth**: JSON Web Tokens (JWT) & bcrypt
- **Mailing Service**: Nodemailer (via Brevo SMTP)

---

## 📂 Project Structure

```text
cafe_final/
├── backend/
│   ├── controllers/      # Route logic handlers
│   ├── models/           # PostgreSQL query schemas
│   ├── routes/           # Express API endpoints
│   ├── utils/            # Email and SMS helper modules
│   ├── db.js             # PostgreSQL connection pool
│   ├── init.sql          # DB schema definition
│   ├── init_db.js        # Script to initialize tables
│   ├── seed_menu.js      # Script to seed sample menu items
│   ├── server.js         # Entry point for backend & Socket.io server
│   └── .env.example      # Environment variables template
├── frontend/
│   ├── public/           # Static assets (images, icons)
│   ├── src/
│   │   ├── assets/       # App logo & media
│   │   ├── components/   # Protected routes & UI helpers
│   │   ├── pages/
│   │   │   ├── admin/    # Admin Login, ForgotPassword, Dashboard
│   │   │   └── customer/ # Menu, Cart, Preference, OrderConfirmation
│   │   ├── App.jsx       # App routes setup
│   │   ├── config.js     # API & Socket endpoint config
│   │   └── index.css     # Global styles & design system
│   └── vite.config.js    # Vite configuration
└── README.md             # Project documentation (this file)
```

---

## ⚙️ Installation & Setup

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/) database server running locally or in the cloud.

---

### **1. Backend Setup**

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` parameters with your database credentials and SMTP details:
   ```env
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=cafe_db
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   BREVO_SMTP_USER=your_smtp_user
   BREVO_SMTP_KEY=your_smtp_key
   BREVO_SENDER_EMAIL=your_sender_email
   FRONTEND_URL=http://localhost:5173
   ```
5. Initialize the PostgreSQL database schema:
   ```bash
   node init_db.js
   ```
6. Seed the menu database with sample items:
   ```bash
   node seed_menu.js
   ```
7. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server runs by default on `http://localhost:5000`.*

---

### **2. Frontend Setup**

1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify or update the API endpoint config in `src/config.js` if your ports differ:
   ```javascript
   export const API_URL = "http://localhost:5000/api";
   export const SOCKET_URL = "http://localhost:5000";
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The client runs by default on `http://localhost:5173`.*

---

## 🔄 Real-time Communication Flow (WebSockets)
- When a customer places an order via the cart, the frontend emits a `new_order` event.
- The backend server processes the order, saves it to PostgreSQL, and broadcasts the update to all active admin dashboards.
- When an admin updates an order status (e.g. from `Placed` to `Delivered`), the backend emits an `order_status_updated` event to notify the customer page instantly.

## 📝 License
This project is licensed under the MIT License.
