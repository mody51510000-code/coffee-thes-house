// ==========================================================================
// كوفي Thes House 🏠 - محرك جافا سكريبت التفاعلي الهجين (النسخة الآمنة)
// يدعم التشغيل المنفرد (localStorage) أو الشبكي المزدوج (Express API)
// ==========================================================================

// ==========================================================================
// 1. الثوابت وقائمة الرموز وعينات الصور
// ==========================================================================
const ALLOWED_CODES_REVERSED = ["0102rrh", "0102dayaom"];
const WHATSAPP_PHONE = "966504546041";

const SAMPLE_IMAGES = [
  { name: 'لاتيه بارد ☕', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80' },
  { name: 'إسبريسو / كورتادو ☕', url: 'https://images.unsplash.com/photo-1510707577719-ee7c14b5740a?w=500&auto=format&fit=crop&q=80' },
  { name: 'قهوة مقطرة V60 ☕', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80' },
  { name: 'كابتشينو دافئ ☕', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80' },
  { name: 'كوكيز كلاسيك 🍪', url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=80' },
  { name: 'كرواسون مورق 🥐', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80' },
  { name: 'كيك وحلويات 🍰', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80' },
  { name: 'أكواب ومنتجات 🛍️', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80' }
];

// دالة آمنة لرسم الأيقونات لتفادي أي توقف للبرنامج في حال فشل تحميل مكتبة الأيقونات
function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    try {
      lucide.createIcons();
    } catch(e) {
      console.warn("فشل رسم بعض الأيقونات، لكن الأزرار تعمل بشكل طبيعي", e);
    }
  }
}

// ==========================================================================
// 2. إدارة الحالة والمزامنة الآمنة (Failsafe State & Network Sync)
// ==========================================================================
const IS_SERVER_MODE = window.location.protocol.startsWith('http');

let products = [];
let cart = [];
let orders = [];
let isAdmin = false;

// محاولة قراءة البيانات محلياً بشكل آمن لتفادي أخطاء تلف الذاكرة
try {
  cart = JSON.parse(localStorage.getItem('thes_house_cart')) || [];
} catch(e) {
  cart = [];
}

try {
  isAdmin = localStorage.getItem('thes_house_is_admin') === 'true';
} catch(e) {
  isAdmin = false;
}

// جلب المنتجات بشكل آمن
async function loadProducts() {
  if (IS_SERVER_MODE) {
    try {
      const res = await fetch('/api/products');
      products = await res.json();
    } catch (err) {
      console.error("فشل جلب المنتجات من الخادم، استخدام الذاكرة المحلية كبديل", err);
      try {
        products = JSON.parse(localStorage.getItem('thes_house_products')) || [];
      } catch(e) {
        products = [];
      }
    }
  } else {
    try {
      products = JSON.parse(localStorage.getItem('thes_house_products')) || [];
    } catch(e) {
      products = [];
    }
  }
}

// حفظ منتج جديد
async function saveProduct(newProduct) {
  products.push(newProduct);
  if (IS_SERVER_MODE) {
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
    } catch (err) {
      console.error("فشل حفظ المنتج الجديد على الخادم", err);
    }
  } else {
    try {
      localStorage.setItem('thes_house_products', JSON.stringify(products));
    } catch(e) {
      console.error(e);
    }
  }
}

// حذف منتج
async function deleteProductFromServer(prodId) {
  products = products.filter(p => p.id !== prodId);
  if (IS_SERVER_MODE) {
    try {
      await fetch(`/api/products?id=${prodId}`, { method: 'DELETE' });
    } catch (err) {
      console.error("فشل حذف المنتج من الخادم", err);
    }
  } else {
    try {
      localStorage.setItem('thes_house_products', JSON.stringify(products));
    } catch(e) {
      console.error(e);
    }
  }
}

// استعادة المنيو الافتراضي
async function resetProductsToServer() {
  products = window.defaultProducts || [];
  if (IS_SERVER_MODE) {
    try {
      await fetch('/api/products/reset', { method: 'POST' });
      for (const p of products) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
      }
    } catch (err) {
      console.error("فشل استعادة المنتجات الافتراضية على الخادم", err);
    }
  } else {
    try {
      localStorage.setItem('thes_house_products', JSON.stringify(products));
    } catch(e) {
      console.error(e);
    }
  }
}

// جلب سجل الطلبات بشكل آمن
async function loadOrders() {
  if (IS_SERVER_MODE) {
    try {
      const res = await fetch('/api/orders');
      orders = await res.json();
    } catch (err) {
      console.error("فشل جلب الطلبات من الخادم", err);
      try {
        orders = JSON.parse(localStorage.getItem('thes_house_orders')) || [];
      } catch(e) {
        orders = [];
      }
    }
  } else {
    try {
      orders = JSON.parse(localStorage.getItem('thes_house_orders')) || [];
    } catch(e) {
      orders = [];
    }
  }
}

// إرسال طلب جديد للخادم أو حفظه محلياً
async function placeNewOrder(newOrder) {
  orders.unshift(newOrder);
  if (IS_SERVER_MODE) {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
    } catch (err) {
      console.error("فشل إرسال الطلب الجديد للخادم", err);
    }
  } else {
    try {
      localStorage.setItem('thes_house_orders', JSON.stringify(orders));
    } catch(e) {
      console.error(e);
    }
  }
}

// تحديث حالة الطلب
async function updateOrderStatusOnServer(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = newStatus;

  if (IS_SERVER_MODE) {
    try {
      await fetch(`/api/orders/status?id=${orderId}&status=${newStatus}`, { method: 'PUT' });
    } catch (err) {
      console.error("فشل تحديث حالة الطلب على الخادم", err);
    }
  } else {
    try {
      localStorage.setItem('thes_house_orders', JSON.stringify(orders));
    } catch(e) {
      console.error(e);
    }
  }
}

// مسح سجل الطلبات بالكامل
async function clearOrdersOnServer() {
  orders = [];
  if (IS_SERVER_MODE) {
    try {
      await fetch('/api/orders', { method: 'DELETE' });
    } catch (err) {
      console.error("فشل مسح الطلبات من الخادم", err);
    }
  } else {
    try {
      localStorage.setItem('thes_house_orders', JSON.stringify(orders));
    } catch(e) {
      console.error(e);
    }
  }
}

// ==========================================================================
// 3. تعريف عناصر DOM للتحكم بالواجهات
// ==========================================================================
// Views
const menuView = document.getElementById('menu-view');
const ordersView = document.getElementById('orders-view');
const adminView = document.getElementById('admin-view');

// Nav links
const navHomeBtn = document.getElementById('nav-home-btn');
const navOrdersBtn = document.getElementById('nav-orders-btn');
const navAdminBtn = document.getElementById('nav-admin-btn');
const openCodeModalBtn = document.getElementById('open-code-modal-btn');
const codeBtnText = document.getElementById('code-btn-text');

// Modals & Drawers
const codeModalOverlay = document.getElementById('code-modal-overlay');
const closeCodeModalBtn = document.getElementById('close-code-modal-btn');
const cancelCodeBtn = document.getElementById('cancel-code-btn');
const submitCodeBtn = document.getElementById('submit-code-btn');
const adminCodeInput = document.getElementById('admin-code-input');
const codeStatusMsg = document.getElementById('code-status-msg');

const cartOverlay = document.getElementById('cart-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const openCartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCountBadge = document.getElementById('cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');

// Navigation mobile
const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
const navMenu = document.getElementById('nav-menu');

// Products filters
const productsContainer = document.getElementById('products-container');
const searchInput = document.getElementById('search-input');
const categoryTabButtons = document.querySelectorAll('.tab-btn');

// Checkout
const checkoutForm = document.getElementById('checkout-form');

// Admin components
const addProductForm = document.getElementById('add-product-form');
const adminOrdersList = document.getElementById('admin-orders-list');
const adminProductsList = document.getElementById('admin-products-list');
const adminOrdersTabBtn = document.getElementById('admin-orders-tab-btn');
const adminProductsTabBtn = document.getElementById('admin-products-tab-btn');
const clearOrdersBtn = document.getElementById('clear-orders-btn');
const resetProductsBtn = document.getElementById('reset-products-btn');

// Image tabs
const imgTabSelect = document.getElementById('img-tab-select');
const imgTabUrl = document.getElementById('img-tab-url');
const imgTabFile = document.getElementById('img-tab-file');
const containerImgSelect = document.getElementById('container-img-select');
const containerImgUrl = document.getElementById('container-img-url');
const containerImgFile = document.getElementById('container-img-file');
const samplesGrid = document.getElementById('samples-grid');
const selectedSampleUrlInput = document.getElementById('selected-sample-url');
const prodImgUrlInput = document.getElementById('prod-img-url');
const prodImgFileInput = document.getElementById('prod-img-file');
const fileUploadPreview = document.getElementById('file-upload-preview');
const removeFilePreviewBtn = document.getElementById('remove-file-preview-btn');

// ==========================================================================
// 4. نظام الإشعارات المنبثقة الفاخرة (Toast Notifications)
// ==========================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'check-circle2';
  if (type === 'error') iconName = 'alert-circle';
  if (type === 'warning') iconName = 'alert-triangle';

  toast.innerHTML = `
    <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
    <div class="toast-content">${message}</div>
  `;
  
  container.appendChild(toast);
  safeCreateIcons();

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}

// ==========================================================================
// 5. التوجيه وإدارة العروض (View Management)
// ==========================================================================
function switchView(viewName) {
  if (!menuView || !ordersView || !adminView) return;
  
  menuView.style.display = 'none';
  ordersView.style.display = 'none';
  adminView.style.display = 'none';
  
  menuView.className = 'inactive-view';
  ordersView.className = 'inactive-view';
  adminView.className = 'inactive-view';

  if (navHomeBtn) navHomeBtn.classList.remove('active');
  if (navOrdersBtn) navOrdersBtn.classList.remove('active');
  if (navAdminBtn) navAdminBtn.classList.remove('active');

  const heroBanner = document.getElementById('hero-banner');
  
  if (viewName === 'menu') {
    menuView.style.display = 'block';
    menuView.className = 'active-view';
    if (navHomeBtn) navHomeBtn.classList.add('active');
    if (heroBanner) heroBanner.style.display = 'block';
  } else if (viewName === 'orders') {
    ordersView.style.display = 'block';
    ordersView.className = 'active-view';
    if (navOrdersBtn) navOrdersBtn.classList.add('active');
    if (heroBanner) heroBanner.style.display = 'none';
    renderOrdersHistory();
  } else if (viewName === 'admin') {
    if (!isAdmin) {
      showToast('يجب تسجيل الدخول كمدير أولاً!', 'error');
      switchView('menu');
      return;
    }
    adminView.style.display = 'block';
    adminView.className = 'active-view';
    if (navAdminBtn) navAdminBtn.classList.add('active');
    if (heroBanner) heroBanner.style.display = 'none';
    renderAdminProducts();
    renderAdminOrders();
  }
  
  if (navMenu) navMenu.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// 6. التحقق من كود المدير (Reversed Obfuscation Check)
// ==========================================================================
function checkAdminState() {
  if (!navAdminBtn || !openCodeModalBtn || !codeBtnText) return;
  
  if (isAdmin) {
    navAdminBtn.style.display = 'flex';
    openCodeModalBtn.classList.add('admin-unlocked');
    codeBtnText.innerText = "لوحة المدير مفعلة";
  } else {
    navAdminBtn.style.display = 'none';
    openCodeModalBtn.classList.remove('admin-unlocked');
    codeBtnText.innerText = "إدخال الكود";
    if (adminView && adminView.style.display === 'block') {
      switchView('menu');
    }
  }
}

function handleCodeSubmit() {
  if (!adminCodeInput || !codeStatusMsg) return;
  
  const enteredCode = adminCodeInput.value.trim();
  const reversedInput = enteredCode.split('').reverse().join('');
  
  if (ALLOWED_CODES_REVERSED.includes(reversedInput)) {
    isAdmin = true;
    try {
      localStorage.setItem('thes_house_is_admin', 'true');
    } catch(e) {}
    checkAdminState();
    codeStatusMsg.innerText = "تم التحقق بنجاح! تم تفعيل صلاحيات المالك 🔑";
    codeStatusMsg.className = "code-status-msg success";
    showToast("أهلاً بك يا صانع السعادة! تم تفعيل لوحة التحكم ☕");
    setTimeout(() => {
      closeCodeModal();
      switchView('admin');
    }, 1200);
  } else {
    codeStatusMsg.innerText = "رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى.";
    codeStatusMsg.className = "code-status-msg error";
    showToast("الكود المدخل غير صحيح!", "error");
  }
}

function openCodeModal() {
  if (!codeModalOverlay || !adminCodeInput || !codeStatusMsg) return;
  codeModalOverlay.classList.add('active');
  adminCodeInput.value = '';
  codeStatusMsg.innerText = '';
  adminCodeInput.focus();
}

function closeCodeModal() {
  if (codeModalOverlay) codeModalOverlay.classList.remove('active');
}

// ==========================================================================
// 7. إدارة السلة وتجهيز الطلبات
// ==========================================================================
function updateCartCount() {
  if (!cartCountBadge || !cartTotalPrice) return;
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountBadge.innerText = totalItems;
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartTotalPrice.innerText = total;

  try {
    localStorage.setItem('thes_house_cart', JSON.stringify(cart));
  } catch(e) {}
}

function addToCart(prodId) {
  const product = products.find(p => p.id === prodId);
  if (!product) return;

  const cartItem = cart.find(item => item.id === prodId);
  if (cartItem) {
    cartItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }
  
  updateCartCount();
  renderCartDrawer();
  showToast(`تمت إضافة "${product.name}" إلى السلة ☕`);
}

function changeCartQty(prodId, delta) {
  const cartItem = cart.find(item => item.id === prodId);
  if (!cartItem) return;

  cartItem.quantity += delta;
  if (cartItem.quantity <= 0) {
    cart = cart.filter(item => item.id !== prodId);
  }
  
  updateCartCount();
  renderCartDrawer();
}

function removeFromCart(prodId) {
  cart = cart.filter(item => item.id !== prodId);
  updateCartCount();
  renderCartDrawer();
  showToast("تم حذف المنتج من السلة");
}

function renderCartDrawer() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <i data-lucide="shopping-cart" style="width: 48px; height: 48px;"></i>
        <p>سلتك فارغة حالياً.<br>تصفح المنيو وأضف قهوتك المفضلة!</p>
      </div>
    `;
    safeCreateIcons();
    const cartFooter = document.getElementById('cart-footer');
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }

  const cartFooter = document.getElementById('cart-footer');
  if (cartFooter) cartFooter.style.display = 'block';

  cart.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-details">
        <h4 class="cart-item-title">${item.name}</h4>
        <span class="cart-item-price">${item.price} ريال</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn dec-qty" data-id="${item.id}"><i data-lucide="minus" style="width:14px; height:14px;"></i></button>
        <span class="qty-val">${item.quantity}</span>
        <button class="qty-btn inc-qty" data-id="${item.id}"><i data-lucide="plus" style="width:14px; height:14px;"></i></button>
      </div>
      <button class="delete-item-btn remove-btn" data-id="${item.id}">
        <i data-lucide="trash-2" style="width:18px; height:18px;"></i>
      </button>
    `;
    cartItemsContainer.appendChild(itemEl);
  });
  
  safeCreateIcons();

  cartItemsContainer.querySelectorAll('.dec-qty').forEach(btn => {
    btn.addEventListener('click', () => changeCartQty(btn.dataset.id, -1));
  });
  cartItemsContainer.querySelectorAll('.inc-qty').forEach(btn => {
    btn.addEventListener('click', () => changeCartQty(btn.dataset.id, 1));
  });
  cartItemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
  });
}

function toggleCartDrawer(open) {
  if (!cartOverlay || !cartDrawer) return;
  if (open) {
    renderCartDrawer();
    cartOverlay.classList.add('active');
    cartDrawer.classList.add('active');
  } else {
    cartOverlay.classList.remove('active');
    cartDrawer.classList.remove('active');
  }
}

// ==========================================================================
// 8. إرسال الطلب وإتمام الشراء (Checkout & Hybrid Sync)
// ==========================================================================
function handleCheckout(e) {
  e.preventDefault();
  
  if (cart.length === 0) {
    showToast("السلة فارغة!", "error");
    return;
  }

  const nameInput = document.getElementById('order-name');
  const name = nameInput ? nameInput.value.trim() : "";
  const floorOpt = document.querySelector('input[name="order-floor"]:checked');
  const floorVal = floorOpt ? floorOpt.value : "الدور الأول";
  const notesInput = document.getElementById('order-notes');
  const notes = notesInput ? notesInput.value.trim() : "";
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!name) {
    showToast("يرجى كتابة الاسم قبل إتمام الطلب", "error");
    return;
  }

  const orderId = `TH-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toLocaleString('ar-SA', { hour12: true });

  let orderDetailsText = "";
  cart.forEach(item => {
    orderDetailsText += `• ${item.quantity}x ${item.name} - ${item.price * item.quantity} ريال\n`;
  });

  const rawMessage = `☕ *طلب جديد - كوفي Thes House* 🏠\n` +
                     `----------------------------------\n` +
                     `🆔 *رقم الطلب:* ${orderId}\n` +
                     `👤 *اسم العميل:* ${name}\n` +
                     `📍 *الموقع:* ${floorVal}\n` +
                     `📅 *الوقت:* ${timestamp}\n` +
                     `----------------------------------\n` +
                     `📋 *تفاصيل الطلب:*\n${orderDetailsText}\n` +
                     `💰 *الإجمالي الكلي:* ${total} ريال\n` +
                     `💵 *طريقة الدفع:* الدفع عند الاستلام\n` +
                     (notes ? `📝 *ملاحظات إضافية:* ${notes}\n` : '') +
                     `----------------------------------\n` +
                     `⏳ بانتظار التجهيز والتحضير!`;

  const encodedText = encodeURIComponent(rawMessage);
  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedText}`;

  const newOrder = {
    id: orderId,
    customerName: name,
    floor: floorVal,
    date: timestamp,
    items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
    total: total,
    notes: notes,
    status: 'pending'
  };

  placeNewOrder(newOrder);

  cart = [];
  updateCartCount();
  toggleCartDrawer(false);
  if (checkoutForm) checkoutForm.reset();

  showToast(IS_SERVER_MODE ? "تم إرسال طلبك بنجاح للمطبخ! ☕" : "تم تسجيل طلبك بنجاح! سيتم تحويلك الآن لتأكيده عبر الواتساب...");
  
  setTimeout(() => {
    if (!IS_SERVER_MODE) {
      window.open(whatsappUrl, '_blank');
    }
    switchView('orders');
  }, 1500);
}

// ==========================================================================
// 9. عرض قائمة المنتجات وتصفيتها
// ==========================================================================
function renderProducts() {
  if (!productsContainer) return;
  productsContainer.innerHTML = '';
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
        <i data-lucide="compass"></i>
        <p>لا توجد مشروبات أو مأكولات معروضة حالياً.</p>
        ${isAdmin ? `<p style="font-size:0.85rem; color:var(--primary)">أضف منتجك الأول من لوحة التحكم باليسار 👈</p>` : ''}
      </div>
    `;
    safeCreateIcons();
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    let catText = "منتجات";
    if (product.category === 'drinks') catText = "مشروب ☕";
    if (product.category === 'food') catText = "مأكول 🍰";

    card.innerHTML = `
      <div class="product-img-wrapper">
        <span class="product-tag tag-${product.category}">${catText}</span>
        <img src="${product.image}" alt="${product.name}">
        <span class="product-price-badge">${product.price} ريال</span>
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-desc">${product.description || "قهوة دافئة مصنوعة بكل دقة ولذة لتناسب ذوقك الرفيع."}</p>
        <button class="add-to-cart-btn" data-id="${product.id}">
          <i data-lucide="plus"></i> إضافة للسلة
        </button>
      </div>
    `;
    
    productsContainer.appendChild(card);
  });

  safeCreateIcons();

  productsContainer.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.id);
    });
  });
}

// ==========================================================================
// 10. عرض سجل طلبات العائلة وتتبع حالتها
// ==========================================================================
function renderOrdersHistory() {
  const container = document.getElementById('family-orders-list');
  if (!container) return;
  container.innerHTML = '';

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="calendar-heart"></i>
        <p>لا توجد طلبات عائلية حتى الآن. بادر بطلب أول فنجان!</p>
      </div>
    `;
    safeCreateIcons();
    return;
  }

  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    let statusClass = 'status-pending';
    let statusText = 'قيد الانتظار ⏳';
    if (order.status === 'preparing') {
      statusClass = 'status-preparing';
      statusText = 'جاري التحضير ☕';
    } else if (order.status === 'delivered') {
      statusClass = 'status-delivered';
      statusText = 'تم التوصيل بالعافية 🎉';
    }

    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `
        <div class="order-sum-item">
          <span>${item.quantity}x ${item.name}</span>
          <span>${item.price * item.quantity} ريال</span>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="order-card-header">
        <div class="order-meta">
          <span class="order-id-badge">${order.id}</span>
          <span class="order-date">${order.date}</span>
        </div>
        <span class="order-status ${statusClass}">${statusText}</span>
      </div>
      <div class="order-card-body">
        <div class="order-items-summary">
          ${itemsHtml}
        </div>
        <div class="order-details-side">
          <div class="order-detail-info"><i data-lucide="user"></i> <span>العميل: <strong>${order.customerName}</strong></span></div>
          <div class="order-detail-info"><i data-lucide="map-pin"></i> <span>الموقع: <strong>${order.floor}</strong></span></div>
          <div class="order-detail-info"><i data-lucide="banknote"></i> <span>الإجمالي: <strong>${order.total} ريال</strong></span></div>
          ${order.notes ? `<div class="order-notes-box">ملاحظة: ${order.notes}</div>` : ''}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  
  safeCreateIcons();
}

// ==========================================================================
// 11. إدارة لوحة تحكم المالك (Admin Panel Operations)
// ==========================================================================
function loadSampleImages() {
  if (!samplesGrid || !selectedSampleUrlInput) return;
  samplesGrid.innerHTML = '';
  
  SAMPLE_IMAGES.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = `sample-img-option ${index === 0 ? 'selected' : ''}`;
    item.dataset.url = img.url;
    item.innerHTML = `<img src="${img.url}" alt="${img.name}" title="${img.name}">`;
    
    item.addEventListener('click', () => {
      samplesGrid.querySelectorAll('.sample-img-option').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      selectedSampleUrlInput.value = img.url;
    });

    samplesGrid.appendChild(item);
  });

  selectedSampleUrlInput.value = SAMPLE_IMAGES[0].url;
}

function handleImageSourceSwitch(source) {
  selectedImageSource = source;
  if (!imgTabSelect || !imgTabUrl || !imgTabFile || !containerImgSelect || !containerImgUrl || !containerImgFile) return;
  
  imgTabSelect.classList.remove('active');
  imgTabUrl.classList.remove('active');
  imgTabFile.classList.remove('active');
  
  containerImgSelect.classList.add('hidden');
  containerImgUrl.classList.add('hidden');
  containerImgFile.classList.add('hidden');

  if (source === 'select') {
    imgTabSelect.classList.add('active');
    containerImgSelect.classList.remove('hidden');
  } else if (source === 'url') {
    imgTabUrl.classList.add('active');
    containerImgUrl.classList.remove('hidden');
  } else if (source === 'file') {
    imgTabFile.classList.add('active');
    containerImgFile.classList.remove('hidden');
  }
}

function handleProductImageUpload(e) {
  const file = e.target.files[0];
  if (!file || !fileUploadPreview) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    uploadedFileBase64 = evt.target.result;
    const previewImg = fileUploadPreview.querySelector('img');
    if (previewImg) previewImg.src = uploadedFileBase64;
    fileUploadPreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function removeFilePreview() {
  if (prodImgFileInput) prodImgFileInput.value = '';
  uploadedFileBase64 = '';
  if (fileUploadPreview) fileUploadPreview.classList.add('hidden');
}

function handleAddProduct(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('prod-name');
  const name = nameInput ? nameInput.value.trim() : "";
  const priceInput = document.getElementById('prod-price');
  const price = priceInput ? parseFloat(priceInput.value) : 0;
  const categoryInput = document.getElementById('prod-category');
  const category = categoryInput ? categoryInput.value : "drinks";
  const descInput = document.getElementById('prod-desc');
  const desc = descInput ? descInput.value.trim() : "";

  let finalImageUrl = "";
  if (selectedImageSource === 'select' && selectedSampleUrlInput) {
    finalImageUrl = selectedSampleUrlInput.value;
  } else if (selectedImageSource === 'url' && prodImgUrlInput) {
    finalImageUrl = prodImgUrlInput.value.trim() || SAMPLE_IMAGES[0].url;
  } else if (selectedImageSource === 'file') {
    finalImageUrl = uploadedFileBase64 || SAMPLE_IMAGES[0].url;
  }

  if (!name || isNaN(price)) {
    showToast("تأكد من تعبئة جميع الحقول الإلزامية", "error");
    return;
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    name,
    description: desc,
    price,
    category,
    image: finalImageUrl
  };

  saveProduct(newProduct);
  
  if (addProductForm) addProductForm.reset();
  removeFilePreview();
  handleImageSourceSwitch('select');
  
  showToast("تمت إضافة المنتج الجديد بنجاح! 🎉");
  renderProducts();
  renderAdminProducts();
}

function deleteProduct(prodId) {
  const prod = products.find(p => p.id === prodId);
  if (!prod) return;

  if (confirm(`هل أنت متأكد من رغبتك في حذف "${prod.name}" من قائمة الطعام؟`)) {
    deleteProductFromServer(prodId);
    cart = cart.filter(item => item.id !== prodId);
    updateCartCount();
    
    showToast("تم حذف المنتج من المنيو");
    renderProducts();
    renderAdminProducts();
  }
}

function renderAdminProducts() {
  if (!adminProductsList) return;
  adminProductsList.innerHTML = '';
  if (products.length === 0) {
    adminProductsList.innerHTML = `<div class="empty-state"><p>لا توجد منتجات بالمنيو حالياً.</p></div>`;
    return;
  }

  products.forEach(p => {
    const el = document.createElement('div');
    el.className = 'admin-product-item';
    el.innerHTML = `
      <div class="admin-prod-details">
        <img src="${p.image}" alt="${p.name}" class="admin-prod-thumb">
        <div>
          <div class="admin-prod-title">${p.name}</div>
          <div class="admin-prod-price">${p.price} ريال</div>
        </div>
      </div>
      <button class="admin-prod-delete-btn delete-prod-btn" data-id="${p.id}">
        <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
      </button>
    `;
    adminProductsList.appendChild(el);
  });
  
  safeCreateIcons();

  adminProductsList.querySelectorAll('.delete-prod-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
  });
}

function changeOrderStatus(orderId, newStatus) {
  updateOrderStatusOnServer(orderId, newStatus);
  showToast(`تم تحديث حالة الطلب ${orderId} بنجاح`);
  renderAdminOrders();
}

function renderAdminOrders() {
  if (!adminOrdersList) return;
  adminOrdersList.innerHTML = '';
  if (orders.length === 0) {
    adminOrdersList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="clipboard" style="width: 32px; height:32px;"></i>
        <p>لا توجد طلبات واردة حالياً.</p>
      </div>
    `;
    safeCreateIcons();
    return;
  }

  orders.forEach(order => {
    const el = document.createElement('div');
    el.className = 'admin-order-item';
    
    let itemsText = order.items.map(item => `${item.quantity}x ${item.name}`).join(' | ');

    el.innerHTML = `
      <div class="admin-order-top">
        <span class="admin-order-user">${order.customerName} - <strong>${order.floor}</strong></span>
        <select class="admin-order-status-select order-status-select" data-id="${order.id}">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار ⏳</option>
          <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>جاري التجهيز ☕</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التوصيل 🎉</option>
        </select>
      </div>
      <div class="admin-order-body">
        <div class="admin-order-items">${itemsText}</div>
        <div class="admin-order-meta">
          <span>الطلب: <strong>${order.id}</strong> | القيمة: <strong>${order.total} ريال</strong></span>
          <span>التاريخ: ${order.date}</span>
          ${order.notes ? `<div style="color:var(--text-muted); font-size:0.75rem; margin-top:4px;">ملاحظة: ${order.notes}</div>` : ''}
        </div>
      </div>
    `;
    adminOrdersList.appendChild(el);
  });
  
  safeCreateIcons();

  adminOrdersList.querySelectorAll('.order-status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      changeOrderStatus(select.dataset.id, e.target.value);
    });
  });
}

// تهيئة وتشغيل المزامنة الدورية
async function initApp() {
  await loadProducts();
  await loadOrders();
  
  updateCartCount();
  renderProducts();
  loadSampleImages();
  checkAdminState();

  if (IS_SERVER_MODE) {
    setInterval(async () => {
      await loadOrders();
      await loadProducts();
      
      const ordersV = document.getElementById('orders-view');
      const adminV = document.getElementById('admin-view');
      const menuV = document.getElementById('menu-view');
      
      if (ordersV && ordersV.style.display === 'block') {
        renderOrdersHistory();
      }
      if (adminV && adminV.style.display === 'block') {
        renderAdminOrders();
        renderAdminProducts();
      }
      if (menuV && menuV.style.display === 'block' && searchInput && document.activeElement !== searchInput) {
        renderProducts();
      }
    }, 5000);
  }
}

// ==========================================================================
// 12. تشغيل وتهيئة التطبيق (Init & Event Listeners)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  safeCreateIcons();
  initApp();

  // التنقل بين واجهات العرض
  if (navHomeBtn) {
    navHomeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('menu');
    });
  }

  if (navOrdersBtn) {
    navOrdersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('orders');
    });
  }

  if (navAdminBtn) {
    navAdminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('admin');
    });
  }

  const navLogo = document.getElementById('nav-logo');
  if (navLogo) {
    navLogo.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('menu');
    });
  }

  // تشغيل سلة المشتريات
  if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCartDrawer(true));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCartDrawer(false));
  if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCartDrawer(false));

  // إتمام عملية الدفع والطلب
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);

  // تشغيل قائمة الجوال
  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', () => {
      if (navMenu) navMenu.classList.toggle('active');
    });
  }

  // تصفية وبحث المنتجات
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  categoryTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      categoryTabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentCategory = button.dataset.category;
      renderProducts();
    });
  });

  // تشغيل نافذة الكود السري
  if (openCodeModalBtn) {
    openCodeModalBtn.addEventListener('click', () => {
      if (isAdmin) {
        if (confirm("هل تريد تسجيل الخروج وإلغاء تفعيل صلاحيات المدير؟")) {
          isAdmin = false;
          try {
            localStorage.setItem('thes_house_is_admin', 'false');
          } catch(e) {}
          checkAdminState();
          showToast("تم قفل لوحة التحكم وتسجيل الخروج", "warning");
        }
      } else {
        openCodeModal();
      }
    });
  }
  
  if (closeCodeModalBtn) closeCodeModalBtn.addEventListener('click', closeCodeModal);
  if (cancelCodeBtn) cancelCodeBtn.addEventListener('click', closeCodeModal);
  if (codeModalOverlay) {
    codeModalOverlay.addEventListener('click', (e) => {
      if (e.target === codeModalOverlay) closeCodeModal();
    });
  }
  
  if (submitCodeBtn) submitCodeBtn.addEventListener('click', handleCodeSubmit);
  if (adminCodeInput) {
    adminCodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCodeSubmit();
    });
  }

  // تبديل مصادر صور المنتجات بالمدير
  if (imgTabSelect) imgTabSelect.addEventListener('click', () => handleImageSourceSwitch('select'));
  if (imgTabUrl) imgTabUrl.addEventListener('click', () => handleImageSourceSwitch('url'));
  if (imgTabFile) imgTabFile.addEventListener('click', () => handleImageSourceSwitch('file'));
  
  if (prodImgFileInput) prodImgFileInput.addEventListener('change', handleProductImageUpload);
  if (removeFilePreviewBtn) removeFilePreviewBtn.addEventListener('click', removeFilePreview);

  // نموذج إضافة المنتجات
  if (addProductForm) addProductForm.addEventListener('submit', handleAddProduct);

  // تبديلات لوحة تحكم المدير الفرعية
  if (adminOrdersTabBtn) {
    adminOrdersTabBtn.addEventListener('click', () => {
      adminOrdersTabBtn.classList.add('active');
      if (adminProductsTabBtn) adminProductsTabBtn.classList.remove('active');
      const orderSubV = document.getElementById('admin-orders-view');
      const prodSubV = document.getElementById('admin-products-view');
      if (orderSubV) orderSubV.classList.remove('hidden');
      if (prodSubV) prodSubV.classList.add('hidden');
    });
  }

  if (adminProductsTabBtn) {
    adminProductsTabBtn.addEventListener('click', () => {
      adminProductsTabBtn.classList.add('active');
      if (adminOrdersTabBtn) adminOrdersTabBtn.classList.remove('active');
      const orderSubV = document.getElementById('admin-orders-view');
      const prodSubV = document.getElementById('admin-products-view');
      if (prodSubV) prodSubV.classList.remove('hidden');
      if (orderSubV) orderSubV.classList.add('hidden');
    });
  }

  // تفريغ الطلبات والمنيو
  if (clearOrdersBtn) {
    clearOrdersBtn.addEventListener('click', () => {
      if (orders.length === 0) return;
      if (confirm("هل أنت متأكد من مسح جميع سجلات طلبات العائلة بالكامل؟")) {
        clearOrdersOnServer();
        showToast("تم تفريغ السجل بالكامل");
        renderAdminOrders();
        renderOrdersHistory();
      }
    });
  }

  if (resetProductsBtn) {
    resetProductsBtn.addEventListener('click', () => {
      if (confirm("هل تريد استعادة قائمة عينات القهوة للتجربة؟ (سيحذف ما أضفته يدوياً)")) {
        resetProductsToServer();
        showToast("تمت استعادة المنيو الافتراضي");
        renderProducts();
        renderAdminProducts();
      }
    });
  }
});
