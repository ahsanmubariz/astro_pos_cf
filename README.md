# ☕ CoPos: Enterprise Multi-Tenant Coffee POS

A modern, high-performance Point of Sale (POS) system built for the Cloudflare ecosystem. Designed for coffee shop chains and multi-outlet businesses, CoPos provides a premium, mobile-responsive experience with real-time analytics and robust multi-tenant isolation.

![Project Preview](https://img.shields.io/badge/Astro-5.0-orange?style=flat-square) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-blue?style=flat-square) ![D1](https://img.shields.io/badge/Cloudflare-D1-yellow?style=flat-square)

---

## 🚀 Key Features

### 🏢 Multi-Tenancy
- **Isolated Instances**: Each "Tenant" (e.g., `starbeans`, `demo`) has its own branding, users, and product catalog.
- **Role-Based Access**: Specialized roles for **Super Admins** (system-wide), **Tenant Admins** (store managers), and **Cashiers**.

### 🛒 Point of Sale (POS)
- **Mobile-First UI**: Adaptive grid and side-panel cart optimized for tablets and mobile phones.
- **Rupiah Localization**: Automatic IDR formatting.
- **Smart Stock**: Real-time stock alerts and automatic deductions during checkout.
- **Open/Close Shifts**: Strict shift management for financial accountability.

### 📊 Advanced Management
- **Order History & Audit**: Full transaction records with **Audit Logs** (Edit History) and order cancellation support.
- **Inventory Control**: Comprehensive CRUD for products, complete with categories and stock tracking.
- **Store Analytics**: Real-time dashboard showing sales performance, top products, and hourly trends.
- **Custom Branding**: Store manages their own name, address, colors, and receipt footers.

### 🖨️ Receipt Printing
- **Thermal Ready**: Print-optimized 80mm receipts available instantly after checkout or from the history.

---

## 🛠 Tech Stack
- **Framework**: [Astro 5.0 (Server Mode)](https://astro.build)
- **Styling**: Tailwind CSS
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Sessions**: Cloudflare KV
- **Deployment**: Cloudflare Pages

---

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   Initialize and seed your local D1 database:
   ```bash
   # Apply initial schema
   npx wrangler d1 execute demo-db --local --file=./drizzle/0000_majestic_ma_gnuci.sql
   npx wrangler d1 execute demo-db --local --file=./drizzle/0001_wise_kabuki.sql

   # Seed initial data (Includes super admin: admin / 123456)
   npx wrangler d1 execute demo-db --local --file=./seed.sql
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```

---

## ☁️ Deployment

This project is optimized for **Cloudflare Pages**. 

1. **GitHub**: Push your code to a repository.
2. **Cloudflare Dashboard**: Create a new Pages project connected to your repo.
3. **Environment**:
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
4. **Binding Requirements**:
    - **D1 Database**: Bind `DB` to your D1 instance.
    - **KV Namespace**: Bind `SESSION` to a KV namespace for authentication.
5. **Production Migration**:
   ```bash
   npx wrangler d1 migrations apply demo-db --remote
   npx wrangler d1 execute demo-db --remote --file=./seed.sql
   ```

---

## 📄 License
Internal use or Private Repository.
