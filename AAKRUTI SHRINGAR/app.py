"""
AAKRUTI SHRINGAR – Python Flask Backend
Requires: pip install flask flask-cors psycopg2-binary python-dotenv
Run: python app.py
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
import psycopg2.extras
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

# ─────────────────────────────────────────
# DATABASE CONFIG  (edit .env or set here)
# ─────────────────────────────────────────
DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     os.getenv("DB_PORT", "5432"),
    "dbname":   os.getenv("DB_NAME", "aakruti_shringar"),
    "user":     os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "your_password"),
}


def get_conn():
    """Return a new database connection."""
    return psycopg2.connect(**DB_CONFIG)


# ─────────────────────────────────────────
# INITIALISE TABLES
# ─────────────────────────────────────────
def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id              SERIAL PRIMARY KEY,
            name            VARCHAR(120) NOT NULL,
            phone           VARCHAR(20)  NOT NULL,
            address         TEXT         NOT NULL,
            city            VARCHAR(80)  NOT NULL,
            pincode         VARCHAR(10)  NOT NULL,
            products        TEXT         NOT NULL,
            cart_items      TEXT,
            total_amount    NUMERIC(10,2) DEFAULT 0,
            payment_method  VARCHAR(30)  DEFAULT 'cod',
            status          VARCHAR(30)  DEFAULT 'pending',
            created_at      TIMESTAMP    DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(120) NOT NULL,
            email       VARCHAR(200) NOT NULL,
            phone       VARCHAR(20),
            message     TEXT         NOT NULL,
            created_at  TIMESTAMP    DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(200) NOT NULL,
            category    VARCHAR(50)  NOT NULL,
            description TEXT,
            price       NUMERIC(10,2) NOT NULL,
            emoji       VARCHAR(10),
            in_stock    BOOLEAN      DEFAULT TRUE,
            created_at  TIMESTAMP    DEFAULT NOW()
        );
    """)

    # Seed products if empty
    cur.execute("SELECT COUNT(*) FROM products;")
    if cur.fetchone()[0] == 0:
        products = [
            ("Velvet Matte Lipstick",      "lips",      "Long-lasting 12hr formula in 24 shades", 499,  "💄"),
            ("Glossy Lip Butter",           "lips",      "Hydrating & plumping, 8 sheer shades",   349,  "🫦"),
            ("Vitamin C Brightening Serum", "skin",      "Fade dark spots, boost radiance",        899,  "🧴"),
            ("Kumkumadi Night Cream",        "skin",      "Ayurvedic saffron-based anti-aging cream", 749, "🌿"),
            ("Kohl Kajal Intense",           "eyes",      "Smudge-proof 24hr waterproof formula",   299,  "👁️"),
            ("Shimmer Eye Palette",          "eyes",      "12 ultra-pigmented warm nude shades",   1199,  "✨"),
            ("Rose Oud Eau de Parfum",       "fragrance", "Rich floral oriental, 50ml",            1599,  "🌸"),
            ("Aqua Bloom Body Mist",         "fragrance", "Light fresh citrus daily spritz",        449,  "💎"),
        ]
        cur.executemany(
            "INSERT INTO products (name, category, description, price, emoji) VALUES (%s,%s,%s,%s,%s);",
            products
        )

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database initialised successfully.")


# ─────────────────────────────────────────
# STATIC FILES  (serve the frontend)
# ─────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)


# ─────────────────────────────────────────
# API: ORDERS
# ─────────────────────────────────────────
@app.route('/api/orders', methods=['POST'])
def place_order():
    """Accept a new delivery order."""
    data = request.get_json(force=True)
    required = ['name', 'phone', 'address', 'city', 'pincode', 'products']
    for field in required:
        if not data.get(field, '').strip():
            return jsonify({"success": False, "error": f"'{field}' is required"}), 400

    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO orders
               (name, phone, address, city, pincode, products, cart_items, total_amount, payment_method)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
               RETURNING id;""",
            (
                data['name'].strip(),
                data['phone'].strip(),
                data['address'].strip(),
                data['city'].strip(),
                data['pincode'].strip(),
                data['products'].strip(),
                data.get('cart_items', ''),
                float(data.get('total_amount', 0)),
                data.get('payment_method', 'cod'),
            )
        )
        order_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True, "order_id": order_id,
                        "message": "Order placed! We'll confirm via SMS shortly."}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/orders', methods=['GET'])
def list_orders():
    """List all orders (admin use)."""
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM orders ORDER BY created_at DESC;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"success": True, "orders": [dict(r) for r in rows]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/orders/<int:order_id>', methods=['PATCH'])
def update_order_status(order_id):
    """Update delivery status (admin)."""
    data = request.get_json(force=True)
    status = data.get('status', 'pending')
    valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if status not in valid:
        return jsonify({"success": False, "error": "Invalid status"}), 400
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE orders SET status=%s WHERE id=%s;", (status, order_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True, "message": f"Order {order_id} updated to '{status}'"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────
# API: CONTACT
# ─────────────────────────────────────────
@app.route('/api/contact', methods=['POST'])
def contact():
    """Save a contact form submission."""
    data = request.get_json(force=True)
    if not data.get('name') or not data.get('email') or not data.get('message'):
        return jsonify({"success": False, "error": "Name, email and message are required"}), 400
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO contacts (name, email, phone, message) VALUES (%s,%s,%s,%s);",
            (data['name'], data['email'], data.get('phone', ''), data['message'])
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True, "message": "Message received! We'll reply within 24 hours."}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────
# API: PRODUCTS
# ─────────────────────────────────────────
@app.route('/api/products', methods=['GET'])
def get_products():
    """Return all in-stock products, optionally filtered by category."""
    category = request.args.get('category')
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if category:
            cur.execute("SELECT * FROM products WHERE in_stock=TRUE AND category=%s ORDER BY id;", (category,))
        else:
            cur.execute("SELECT * FROM products WHERE in_stock=TRUE ORDER BY id;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"success": True, "products": [dict(r) for r in rows]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────
# API: HEALTH
# ─────────────────────────────────────────
@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "service": "AAKRUTI SHRINGAR API", "timestamp": datetime.utcnow().isoformat()})


# ─────────────────────────────────────────
# RUN
# ─────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print("🚀 Starting AAKRUTI SHRINGAR backend on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
