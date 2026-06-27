# Cafe QR: QR-Based Cafe Self-Ordering & Management System

A full-stack web application designed for cafe operations and customer self-ordering. Customers scan a table-specific QR code to browse the menu, customize preferences, and place orders. The cafe admin panel receives orders in real-time, manages preparation statuses, and generates PDF invoices.

---

## Key Features

- **For Customers**:
  - Scan table-specific QR codes.
  - Browse menu with category, veg/non-veg, and availability filters.
  - Custom notes/preferences for order items.
  

- **For Admins**:
  - Live order tracking dashboard with real-time updates via WebSockets.
  - Menu item management (Add, edit, delete, toggle availability).
  - Print/download PDF QRs
  - Secure login and password recovery with token-based email verification.

---

## Tech Stack

- **Frontend**: React (Vite), React Router, Socket.io Client, jsPDF, qrcode.react, Lucide Icons, CSS.
- **Backend**: Node.js, Express, PostgreSQL, Socket.io, JWT, bcrypt, Nodemailer.
