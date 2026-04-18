# 🌸 AAKRUTI SHRINGAR – Cosmetic Delivery Website

A full-stack cosmetic delivery platform built with:
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python (Flask)
- **Database**: PostgreSQL

---

## 📂 Project Structure

```
aakruti_shringar/
├── index.html          # Main frontend page
├── style.css           # All styling
├── app.js              # Frontend JavaScript
├── app.py              # Flask backend + REST API
├── setup.sql           # PostgreSQL schema + seed data
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variable template
└── README.md           # This file
```

---

## 🚀 Quick Setup

### 1. PostgreSQL Setup

```bash
# Start PostgreSQL and create DB + tables
psql -U postgres -f setup.sql
```

### 2. Python Environment

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL password
```

### 4. Start the Server

```bash
python app.py
```

Open **http://localhost:5000** in your browser.

---

## 🌐 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/` | Serve frontend |
| GET    | `/api/health` | Health check |
| GET    | `/api/products` | List all products |
| GET    | `/api/products?category=lips` | Filter by category |
| POST   | `/api/orders` | Place a new order |
| GET    | `/api/orders` | List all orders (admin) |
| PATCH  | `/api/orders/:id` | Update order status |
| POST   | `/api/contact` | Submit contact message |

### POST /api/orders – Example Body
```json
{
  "name": "Priya Sharma",
  "phone": "9876543210",
  "address": "123 Main Street",
  "city": "Latur",
  "pincode": "413512",
  "products": "Velvet Matte Lipstick, Vitamin C Serum",
  "payment_method": "cod",
  "total_amount": 1398
}
```

---

## 🗄️ Database Tables

- **orders** – customer delivery orders
- **contacts** – contact form messages  
- **products** – cosmetic product catalog

---

## 🚀 Production Deployment

```bash
# Use gunicorn for production
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

*Made with ❤️ for AAKRUTI SHRINGAR, Latur, Maharashtra*
