// ===== CART STATE =====
let cart = [];

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

// ===== FILTER PRODUCTS =====
function filterProducts(cat, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.product-card').forEach(card => {
    if (cat === 'all' || card.dataset.cat === cat) {
      card.classList.remove('hidden');
      card.style.animation = 'fadeUp .4s both';
    } else {
      card.classList.add('hidden');
    }
  });
}

// ===== CART =====
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  renderCart();
  showToast(`${name} added to cart!`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cartCount').textContent = count;

  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="empty-cart">Your cart is empty 🛒</p>';
    footerEl.style.display = 'none';
    return;
  }

  footerEl.style.display = 'block';
  document.getElementById('cartTotal').textContent = '₹' + total.toLocaleString('en-IN');

  itemsEl.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <div>
        <div class="cart-item-name">${item.name}</div>
        <small style="color:var(--text-muted)">Qty: ${item.qty}</small>
      </div>
      <div style="display:flex;align-items:center;gap:1rem">
        <span class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
        <button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button>
      </div>
    </div>
  `).join('');
}

function checkout() {
  // Populate order modal with cart items
  const cartSummary = cart.map(i => `${i.name} (x${i.qty})`).join(', ');
  document.getElementById('oProducts').value = cartSummary;
  toggleCart();
  document.getElementById('orderModal').classList.add('open');
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);
    background:var(--dark);color:var(--cream);
    padding:12px 24px;font-family:Jost,sans-serif;font-size:0.85rem;
    z-index:9999;letter-spacing:1px;box-shadow:0 8px 32px rgba(0,0,0,.3);
    animation:fadeUp .3s both;
  `;
  t.textContent = '✦  ' + msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ===== CONTACT FORM =====
async function submitContact(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Sending...'; btn.disabled = true;
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('cName').value,
        email: document.getElementById('cEmail').value,
        phone: document.getElementById('cPhone').value,
        message: document.getElementById('cMsg').value,
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('contactSuccess').style.display = 'block';
      e.target.reset();
    } else { alert('Something went wrong. Please try again.'); }
  } catch {
    // If backend not running, show success for demo
    document.getElementById('contactSuccess').style.display = 'block';
    e.target.reset();
  }
  btn.textContent = 'Send Message'; btn.disabled = false;
}

// ===== ORDER FORM =====
let lastOrderData = {};
let currentRating = 0;

async function submitOrder(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Placing Order...'; btn.disabled = true;

  const orderData = {
    name: document.getElementById('oName').value,
    phone: document.getElementById('oPhone').value,
    address: document.getElementById('oAddress').value,
    city: document.getElementById('oCity').value,
    pincode: document.getElementById('oPincode').value,
    products: document.getElementById('oProducts').value,
    payment_method: document.getElementById('oPayment').value,
    total_amount: cart.reduce((s, i) => s + i.price * i.qty, 0),
    cart_items: JSON.stringify(cart),
  };
  lastOrderData = { ...orderData, cartSnapshot: [...cart] };

  let orderId = 'AS-' + String(Math.floor(Math.random() * 90000) + 10000);

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (data.success) {
      orderId = 'AS-' + String(data.order_id).padStart(5, '0');
    }
  } catch { /* demo fallback, orderId already set */ }

  document.getElementById('orderSuccess').style.display = 'block';
  setTimeout(() => {
    document.getElementById('orderModal').classList.remove('open');
    document.getElementById('orderSuccess').style.display = 'none';
    showReceipt(orderId, orderData);
    cart = [];
    renderCart();
    e.target.reset();
    // Save order to localStorage for the orders page
    saveOrderLocally(orderId, orderData);
  }, 1200);

  btn.textContent = 'Place Order ✦'; btn.disabled = false;
}

function saveOrderLocally(orderId, data) {
  const orders = JSON.parse(localStorage.getItem('aakruti_orders') || '[]');
  orders.unshift({
    id: orderId,
    name: data.name,
    phone: data.phone,
    address: data.address,
    city: data.city,
    pincode: data.pincode,
    products: data.products,
    payment_method: data.payment_method,
    total_amount: data.total_amount,
    cart_items: lastOrderData.cartSnapshot,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  });
  localStorage.setItem('aakruti_orders', JSON.stringify(orders.slice(0, 50)));
}

// ===== RECEIPT =====
function showReceipt(orderId, data) {
  const paymentLabels = { cod: 'Cash on Delivery', upi: 'UPI / GPay', card: 'Credit/Debit Card' };
  document.getElementById('rOrderId').textContent = '#' + orderId;
  document.getElementById('rDate').textContent = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  document.getElementById('rPayment').textContent = paymentLabels[data.payment_method] || data.payment_method;
  document.getElementById('rAddress').innerHTML = `
    <strong>${data.name}</strong><br/>
    ${data.address}, ${data.city} – ${data.pincode}<br/>
    📞 ${data.phone}
  `;
  const cartSnap = lastOrderData.cartSnapshot || [];
  if (cartSnap.length > 0) {
    document.getElementById('rItems').innerHTML = cartSnap.map(item => `
      <div class="receipt-item-row">
        <span>${item.name} <small style="color:var(--text-muted)">×${item.qty}</small></span>
        <span>₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
      </div>
    `).join('');
  } else {
    document.getElementById('rItems').innerHTML = `<div class="receipt-item-row"><span>${data.products}</span><span></span></div>`;
  }
  document.getElementById('rTotal').textContent = '₹' + Number(data.total_amount).toLocaleString('en-IN');
  document.getElementById('receiptModal').classList.add('open');
}

function closeReceipt() {
  document.getElementById('receiptModal').classList.remove('open');
}

function printReceipt() {
  window.print();
}

// ===== FEEDBACK =====
function openFeedback() {
  document.getElementById('receiptModal').classList.remove('open');
  document.getElementById('feedbackModal').classList.add('open');
}

function setRating(val) {
  currentRating = val;
  const labels = ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🌟'];
  document.getElementById('ratingLabel').textContent = labels[val];
  document.querySelectorAll('#starRating span').forEach((s, i) => {
    s.style.color = i < val ? 'var(--gold)' : '#ddd';
  });
}

async function submitFeedback(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Submitting...'; btn.disabled = true;
  const feedback = {
    name: document.getElementById('fbName').value,
    category: document.getElementById('fbCategory').value,
    rating: currentRating,
    message: document.getElementById('fbMsg').value,
    order_id: document.getElementById('rOrderId').textContent,
  };
  // Save locally
  const feedbacks = JSON.parse(localStorage.getItem('aakruti_feedbacks') || '[]');
  feedbacks.unshift({ ...feedback, created_at: new Date().toISOString() });
  localStorage.setItem('aakruti_feedbacks', JSON.stringify(feedbacks.slice(0, 50)));

  try {
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: feedback.name, email: 'feedback@aakruti.local', message: `[FEEDBACK – ${feedback.category} – ${feedback.rating}★] ${feedback.message}` })
    });
  } catch { /* demo ok */ }

  document.getElementById('feedbackSuccess').style.display = 'block';
  e.target.reset();
  currentRating = 0;
  setRating(0);
  btn.textContent = 'Submit Feedback ✦'; btn.disabled = false;
}

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.animation = 'fadeUp .7s both';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.feat-card, .product-card, .testi-card').forEach(el => {
  el.style.opacity = '0';
  observer.observe(el);
});
