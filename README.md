# 🍽️ Restaurant POS & Order Management API

A robust **Point of Sale (POS) backend system** built with Node.js, Express, and MongoDB for managing restaurant operations including orders, customers, daily financial records, and reporting.

---

## 🚀 Features

### 🧾 Order Management

* Create, update, and fetch orders
* Automatic payment status handling:

  * `unpaid`
  * `partial`
  * `paid`
* Dynamic balance calculation
* Filter orders by:

  * Date / Date range
  * Month / Year / Week
  * Customer (phone)
  * Status (paid, pending, cancelled)
  * User (cashier)

---

### 📊 Advanced Filtering & Pagination

* Fully flexible query system
* Pagination support with global totals
* Supports:

  * `page`, `limit`
  * `startDate`, `endDate`
  * `month`, `year`, `week`

---

### 💰 Financial Calculations (Global Totals)

* Total Sales
* Confirmed Payments
* Pending Payments
* Aggregated across **all pages (not paginated)**

---

### 📅 Daily Record System (POS-style)

* Open daily record (start of business day)
* Attach orders automatically
* Track:

  * Total sales
  * Paid amounts
  * Pending balances
* Close daily record with final reconciliation
* Reopen record with audit trail

---

### 👥 Customer Management

* Create and fetch customers
* Search by name or phone
* Track:

  * Customer activity
  * Order linkage

---

### 📈 Dashboard API

* Total Orders
* Total Customers
* Total Sales vs Paid vs Pending
* Monthly analytics
* Recent Orders (last 5)
* New Customers (last 5)

---

### 📄 PDF Report Generation

* Export filtered orders into PDF
* Includes:

  * Full dataset (no pagination)
  * Financial summaries
  * Tabular format (POS-ready)
* Supports all filters:

  * Date range
  * Customer
  * Status
  * User

---

## 🏗️ Project Structure

```
project-root/
│
├── controllers/
│   ├── orderController.js
│   ├── customerController.js
│   ├── dailyRecordController.js
│   └── dashboardController.js
│
├── services/
│   └── dailyRecordService.js
│
├── models/
│   ├── orderModel.js
│   ├── customerModel.js
│   └── dailyRecord.js
│
├── routes/
│   └── apiRoutes.js
│
├── utils/
│   └── helpers.js
│
└── app.js
```

---

## ⚙️ Tech Stack

* **Backend:** Node.js, Express
* **Database:** MongoDB (Mongoose)
* **PDF Generation:** PDFKit
* **Date Handling:** Moment.js

---

## 🔌 API Endpoints

### 📦 Orders

* `GET /orders` → Fetch orders with filters + global totals
* `PUT /orders/:id` → Update order
* `GET /orders/report` → Generate PDF report

---

### 👥 Customers

* `GET /customers` → Fetch customers
* `POST /customers` → Create customer

---

### 📅 Daily Records

* `POST /daily-record/open`
* `POST /daily-record/close`
* `GET /daily-record/active`
* `POST /daily-record/reopen`
* `GET /daily-record/:id`

---

### 📊 Dashboard

* `GET /dashboard`
* Returns:

  * totals
  * monthly stats
  * recent orders
  * new customers

---

## 🧠 Key Concepts

### ✅ Global Totals vs Pagination

Unlike traditional APIs:

* Pagination applies only to displayed data
* Totals are calculated using MongoDB aggregation across **all filtered data**

---

### ✅ Payment Logic

```js
if (paid <= 0) → unpaid
if (paid < total) → partial
if (paid >= total) → paid
```

---

### ✅ Daily Record Integrity

* Only ONE active record at a time
* Cannot open a new record if another is active
* Automatic recalculation ensures financial accuracy

---

## 🧪 Example Query

```bash
GET /orders?month=March&year=2026&status=pending&page=1&limit=10
```

---

## 📦 Installation

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo

npm install
```

---

## ▶️ Run the App

```bash
npm run dev
```

---

## 🌍 Environment Variables

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret
```

---

## 📌 Future Improvements

* ✅ Excel export for reports
* ✅ Role-based authentication (Admin/Cashier)
* ✅ Real-time dashboard (WebSockets)
* ✅ Inventory integration
* ✅ Multi-branch support

---

## 🤝 Contributing

Pull requests are welcome. For major changes:

1. Fork the repo
2. Create a feature branch
3. Submit a PR

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Jean Anderson**
MERN Stack Developer | Backend Engineer


