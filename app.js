
// ==========================================================================
// 1. الثوابت وإعداد عينات الصور الفاخرة
// ==========================================================================
// الكود السري للمدير (مكتوب بشكل مقلوب لحمايته من الفحص العادي بالمتصفح)
// لتغييره، اكتب الكود مقلوباً هنا (مثال: hrr2010 يصبح 0102rrh)
const ALLOWED_CODES_REVERSED = ["0102rrh", "0102dayaom"];
const WHATSAPP_PHONE = "966504546041"; // الرقم الدولي للسعودية بدون أصفار إضافية

const SAMPLE_IMAGES = [
  { name: 'لاتيه بارد', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80' },
  { name: 'إسبريسو / كورتادو', url: 'https://images.unsplash.com/photo-1510707577719-ee7c14b5740a?w=500&auto=format&fit=crop&q=80' },
  { name: 'قهوة مقطرة V60', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80' },
  { name: 'كابتشينو دافئ', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80' },
  { name: 'كوكيز', url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=80' },
  { name: 'كرواسون', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80' },
  { name: 'كيكة وحلويات', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80' },
  { name: 'أكواب ومنتجات', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80' }
];

// ==========================================================================
// 2. إدارة الحالة والمزامنة عبر الشبكة المحلية (State & Network Sync)
// ==========================================================================
const IS_SERVER_MODE = window.location.protocol.startsWith('http');

let products = [];
let cart = JSON.parse(localStorage.getItem('thes_house_cart')) || [];
let orders = [];
let isAdmin = localStorage.getItem('thes_house_is_admin') === 'true';

let currentCategory = 'all';
let searchQuery = '';
let selectedImageSource = 'select'; // 'select' | 'url' | 'file'
let uploadedFileBase64 = '';

// جلب قائمة المنتجات من الخادم أو من الذاكرة المحلية كحالة بديلة
async function loadProducts() {
  if (IS_SERVER_MODE) {
    try {
      const res = await fetch('/api/products');
      products = await res.json();
    } catch (err) {
      console.error("فشل جلب المنتجات من الخادم، استخدام الذاكرة المحلية كبديل", err);
      products = JSON.parse(localStorage.getItem('thes_house_products')) || [];
    }
  } else {
    products = JSON.parse(localStorage.getItem('thes_house_products')) || [];
  }
}

// حفظ منتج جديد في قاعدة بيانات الخادم أو محلياً
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
    localStorage.setItem('thes_house_products', JSON.stringify(products));
  }
}

// حذف منتج من الخادم أو محلياً
async function deleteProductFromServer(prodId) {
  products = products.filter(p => p.id !== prodId);
  if (IS_SERVER_MODE) {
    try {
      await fetch(`/api/products?id=${prodId}`, { method: 'DELETE' });
    } catch (err) {
      console.error("فشل حذف المنتج من الخادم", err);
    }
  } else {
    localStorage.setItem('thes_house_products', JSON.stringify(products));
  }
}

// استعادة المنيو الافتراضي الأصلي
async function resetProductsToServer() {
  products = defaultProducts;
  if (IS_SERVER_MODE) {
    try {
      await fetch('/api/products/reset', { method: 'POST' });
    } catch (err) {
      console.error("فشل استعادة المنتجات الافتراضية على الخادم", err);
    }
  } else {
    localStorage.setItem('thes_house_products', JSON.stringify(products));
  }
}

// جلب سجل الطلبات من الخادم أو محلياً
async function loadOrders() {
  if (IS_SERVER_MODE) {
    try {
      const res = await fetch('/api/orders');
      orders = await res.json();
    } catch (err) {
      console.error("فشل جلب الطلبات من الخادم", err);
      orders = JSON.parse(localStorage.getItem('thes_house_orders')) || [];
    }
  } else {
    orders = JSON.parse(localStorage.getItem('thes_house_orders')) || [];
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
    localStorage.setItem('thes_house_orders', JSON.stringify(orders));
  }
}

// تحديث حالة الطلب (قيد الانتظار -> جاري التحضير -> تم التوصيل)
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
    localStorage.setItem('thes_house_orders', JSON.stringify(orders));
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
    localStorage.setItem('thes_house_orders', JSON.stringify(orders));
  }
}

// تهيئة وتشغيل المزامنة الدورية
async function initApp() {
  await loadProducts();
  await loadOrders();
  
  updateCartCount();
  renderProducts();
  loadSampleImages();
  checkAdminState();

  // تحديث دوري للطلبات كل 5 ثوانٍ عند العمل عبر الخادم (Wi-Fi)
  if (IS_SERVER_MODE) {
    setInterval(async () => {
      await loadOrders();
      await loadProducts();
      
      if (document.getElementById('orders-view').style.display === 'block') {
        renderOrdersHistory();
      }
      if (document.getElementById('admin-view').style.display === 'block') {
        renderAdminOrders();
        renderAdminProducts();
      }
      if (document.getElementById('menu-view').style.display === 'block' && document.activeElement !== searchInput) {
        renderProducts();
      }
    }, 5000);
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

// Navigation toggle mobile
const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
const navMenu = document.getElementById('nav-menu');

// Products Container & Filters
const productsContainer = document.getElementById('products-container');
const searchInput = document.getElementById('search-input');
const categoryTabButtons = document.querySelectorAll('.tab-btn');

// Checkout Form
const checkoutForm = document.getElementById('checkout-form');

// Admin Panel Components
const addProductForm = document.getElementById('add-product-form');
const adminOrdersList = document.getElementById('admin-orders-list');
const adminProductsList = document.getElementById('admin-products-list');
const adminOrdersTabBtn = document.getElementById('admin-orders-tab-btn');
const adminProductsTabBtn = document.getElementById('admin-products-tab-btn');
const clearOrdersBtn = document.getElementById('clear-orders-btn');
const resetProductsBtn = document.getElementById('reset-products-btn');

// Image tabs inputs in Admin
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
// 4. نظام الإشعارات المنبثقة (Toasts System)
// ==========================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
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
  lucide.createIcons();

  // إخفاء وحذف الإشعار بعد 3 ثواني
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
  // إخفاء جميع الصفحات
  menuView.style.display = 'none';
  ordersView.style.display = 'none';
  adminView.style.display = 'none';
  
  menuView.className = 'inactive-view';
  ordersView.className = 'inactive-view';
  adminView.className = 'inactive-view';

  // إلغاء تفعيل روابط القائمة
  navHomeBtn.classList.remove('active');
  navOrdersBtn.classList.remove('active');
  navAdminBtn.classList.remove('active');

  // إخفاء الهيرو في حال لم نكن في القائمة الرئيسية
  const heroBanner = document.getElementById('hero-banner');
  
  if (viewName === 'menu') {
    menuView.style.display = 'block';
    menuView.className = 'active-view';
    navHomeBtn.classList.add('active');
    heroBanner.style.display = 'block';
  } else if (viewName === 'orders') {
    ordersView.style.display = 'block';
    ordersView.className = 'active-view';
    navOrdersBtn.classList.add('active');
    heroBanner.style.display = 'none';
    renderOrdersHistory();
  } else if (viewName === 'admin') {
    if (!isAdmin) {
      showToast('يجب تسجيل الدخول كمدير أولاً!', 'error');
      switchView('menu');
      return;
    }
    adminView.style.display = 'block';
    adminView.className = 'active-view';
    navAdminBtn.classList.add('active');
    heroBanner.style.display = 'none';
    renderAdminProducts();
    renderAdminOrders();
  }
  
  // إغلاق القائمة في الجوال بعد الاختيار
  navMenu.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// 6. التحقق من كود المدير (Admin Authorization)
// ==========================================================================
function checkAdminState() {
  if (isAdmin) {
    navAdminBtn.style.display = 'flex';
    openCodeModalBtn.classList.add('admin-unlocked');
    codeBtnText.innerText = "لوحة المدير مفعلة";
  } else {
    navAdminBtn.style.display = 'none';
    openCodeModalBtn.classList.remove('admin-unlocked');
    codeBtnText.innerText = "إدخال الكود";
    if (adminView.style.display === 'block') {
      switchView('menu');
    }
  }
}

function handleCodeSubmit() {
  const enteredCode = adminCodeInput.value.trim();
  const reversedInput = enteredCode.split('').reverse().join('');
  if (ALLOWED_CODES_REVERSED.includes(reversedInput)) {
    isAdmin = true;
    localStorage.setItem('thes_house_is_admin', 'true');
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
  codeModalOverlay.classList.add('active');
  adminCodeInput.value = '';
  codeStatusMsg.innerText = '';
  adminCodeInput.focus();
}

function closeCodeModal() {
  codeModalOverlay.classList.remove('active');
}

// ==========================================================================
// 7. إدارة السلة وتجهيز الطلبات
// ==========================================================================
function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountBadge.innerText = totalItems;
  
  // حساب المجموع الكلي
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartTotalPrice.innerText = total;

  localStorage.setItem('thes_house_cart', JSON.stringify(cart));
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
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <i data-lucide="shopping-cart" style="width: 48px; height: 48px;"></i>
        <p>سلتك فارغة حالياً.<br>تصفح المنيو وأضف قهوتك المفضلة!</p>
      </div>
    `;
    lucide.createIcons();
    document.getElementById('cart-footer').style.display = 'none';
    return;
  }

  document.getElementById('cart-footer').style.display = 'block';

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
  
  lucide.createIcons();

  // ربط الأزرار
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
// 8. إرسال الطلب وإتمام الشراء عبر الواتساب
// ==========================================================================
function handleCheckout(e) {
  e.preventDefault();
  
  if (cart.length === 0) {
    showToast("السلة فارغة!", "error");
    return;
  }

  const name = document.getElementById('order-name').value.trim();
  const floorVal = document.querySelector('input[name="order-floor"]:checked').value;
  const notes = document.getElementById('order-notes').value.trim();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!name) {
    showToast("يرجى كتابة الاسم قبل إتمام الطلب", "error");
    return;
  }

  // 1. توليد كود تعريف عشوائي للطلب
  const orderId = `TH-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toLocaleString('ar-SA', { hour12: true });

  // 2. تجهيز نص رسالة الواتساب
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

  // 3. حفظ الطلب في سجل العائلة (Orders History)
  const newOrder = {
    id: orderId,
    customerName: name,
    floor: floorVal,
    date: timestamp,
    items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
    total: total,
    notes: notes,
    status: 'pending' // pending | preparing | delivered
  };

  placeNewOrder(newOrder);

  // 4. تفريغ السلة وإغلاقها
  cart = [];
  updateCartCount();
  toggleCartDrawer(false);
  checkoutForm.reset();

  showToast(IS_SERVER_MODE ? "تم إرسال طلبك بنجاح للمطبخ! ☕" : "تم تسجيل طلبك بنجاح! سيتم تحويلك الآن لتأكيده عبر الواتساب...");
  
  // 5. فتح الواتساب في نافذة جديدة (فقط إذا لم نكن في وضع الخادم المحلي)
  setTimeout(() => {
    if (!IS_SERVER_MODE) {
      window.open(whatsappUrl, '_blank');
    }
    switchView('orders'); // الانتقال لصفحة سجل العائلة لمتابعة حالة الطلب
  }, 1500);
}

// ==========================================================================
// 9. عرض قائمة المنتجات وتصفيتها
// ==========================================================================
function renderProducts() {
  productsContainer.innerHTML = '';
  
  // تصفية المنتجات بناءً على الفئة والبحث
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
        <p>لم نجد أي منتجات تطابق بحثك حالياً.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // تصنيف النص
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

  lucide.createIcons();

  // ربط أزرار السلة
  productsContainer.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.id);
    });
  });
}

// ==========================================================================
// 10. عرض سجل طلبات العائلة
// ==========================================================================
function renderOrdersHistory() {
  const container = document.getElementById('family-orders-list');
  container.innerHTML = '';

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="calendar-heart"></i>
        <p>لا توجد طلبات عائلية حتى الآن. بادر بطلب أول فنجان!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    // ترجمة الحالة وتجهيز اللون
    let statusClass = 'status-pending';
    let statusText = 'قيد الانتظار ⏳';
    if (order.status === 'preparing') {
      statusClass = 'status-preparing';
      statusText = 'يتم التحضير حالياً ☕';
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
  
  lucide.createIcons();
}

// ==========================================================================
// 11. إدارة لوحة التحكم (Admin Dashboard Operations)
// ==========================================================================
function loadSampleImages() {
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

  // تعيين عينة البداية الافتراضية
  selectedSampleUrlInput.value = SAMPLE_IMAGES[0].url;
}

function handleImageSourceSwitch(source) {
  selectedImageSource = source;
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

// قراءة الملف وتحويله إلى Base64 للحفظ المحلي
function handleProductImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    uploadedFileBase64 = evt.target.result;
    fileUploadPreview.querySelector('img').src = uploadedFileBase64;
    fileUploadPreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function removeFilePreview() {
  prodImgFileInput.value = '';
  uploadedFileBase64 = '';
  fileUploadPreview.classList.add('hidden');
}

function handleAddProduct(e) {
  e.preventDefault();
  
  const name = document.getElementById('prod-name').value.trim();
  const price = parseFloat(document.getElementById('prod-price').value);
  const category = document.getElementById('prod-category').value;
  const desc = document.getElementById('prod-desc').value.trim();

  let finalImageUrl = "";
  if (selectedImageSource === 'select') {
    finalImageUrl = selectedSampleUrlInput.value;
  } else if (selectedImageSource === 'url') {
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
  
  // تصفير النموذج
  addProductForm.reset();
  removeFilePreview();
  handleImageSourceSwitch('select');
  
  showToast("تمت إضافة المنتج الجديد إلى المنيو بنجاح! 🎉");
  renderProducts();
  renderAdminProducts();
}

function deleteProduct(prodId) {
  const prod = products.find(p => p.id === prodId);
  if (!prod) return;

  if (confirm(`هل أنت متأكد من رغبتك في حذف "${prod.name}" من قائمة الطعام؟`)) {
    deleteProductFromServer(prodId);
    
    // تنظيف السلة من المنتج إذا وُجد
    cart = cart.filter(item => item.id !== prodId);
    updateCartCount();
    
    showToast("تم حذف المنتج من المنيو");
    renderProducts();
    renderAdminProducts();
  }
}

function renderAdminProducts() {
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
  
  lucide.createIcons();

  adminProductsList.querySelectorAll('.delete-prod-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
  });
}

function changeOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  updateOrderStatusOnServer(orderId, newStatus);
  
  showToast(`تم تحديث حالة الطلب ${orderId} بنجاح`);
  renderAdminOrders();
}

function renderAdminOrders() {
  adminOrdersList.innerHTML = '';
  if (orders.length === 0) {
    adminOrdersList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="clipboard" style="width: 32px; height:32px;"></i>
        <p>لا توجد طلبات بالانتظار حالياً.</p>
      </div>
    `;
    lucide.createIcons();
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
  
  lucide.createIcons();

  adminOrdersList.querySelectorAll('.order-status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      changeOrderStatus(select.dataset.id, e.target.value);
    });
  });
}

// ==========================================================================
// 12. ربط الأحداث وتشغيل التطبيق (Event Listeners & Init)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. تشغيل أيقونات Lucide الأساسية
  lucide.createIcons();

  // 2. تهيئة وتشغيل التطبيق والاتصال بالخادم
  initApp();

  // 6. التنقل بين الصفحات
  navHomeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('menu');
  });

  navOrdersBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('orders');
  });

  navAdminBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('admin');
  });

  // شعار الهيدر
  document.getElementById('nav-logo').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('menu');
  });

  // 7. تشغيل سلة المشتريات
  openCartBtn.addEventListener('click', () => toggleCartDrawer(true));
  closeCartBtn.addEventListener('click', () => toggleCartDrawer(false));
  cartOverlay.addEventListener('click', () => toggleCartDrawer(false));

  // 8. إتمام عملية الدفع والطلب
  checkoutForm.addEventListener('submit', handleCheckout);

  // 9. تشغيل قائمة الجوال
  mobileToggleBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // 10. البحث وتصفية المنتجات
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProducts();
  });

  categoryTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      categoryTabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentCategory = button.dataset.category;
      renderProducts();
    });
  });

  // 11. تشغيل نافذة كود المدير السري
  openCodeModalBtn.addEventListener('click', () => {
    if (isAdmin) {
      // إذا كان مفتوحاً بالفعل، الضغط عليه سيقفل الصلاحيات
      if (confirm("هل تريد تسجيل الخروج من لوحة التحكم وإلغاء تفعيل صلاحيات المالك؟")) {
        isAdmin = false;
        localStorage.setItem('thes_house_is_admin', 'false');
        checkAdminState();
        showToast("تم قفل الصلاحيات بنجاح", "warning");
      }
    } else {
      openCodeModal();
    }
  });
  
  closeCodeModalBtn.addEventListener('click', closeCodeModal);
  cancelCodeBtn.addEventListener('click', closeCodeModal);
  codeModalOverlay.addEventListener('click', (e) => {
    if (e.target === codeModalOverlay) closeCodeModal();
  });
  
  submitCodeBtn.addEventListener('click', handleCodeSubmit);
  adminCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleCodeSubmit();
  });

  // 12. تبديل علامات تبويب صور لوحة التحكم للمدير
  imgTabSelect.addEventListener('click', () => handleImageSourceSwitch('select'));
  imgTabUrl.addEventListener('click', () => handleImageSourceSwitch('url'));
  imgTabFile.addEventListener('click', () => handleImageSourceSwitch('file'));
  
  prodImgFileInput.addEventListener('change', handleProductImageUpload);
  removeFilePreviewBtn.addEventListener('click', removeFilePreview);

  // 13. نموذج إضافة المنتجات
  addProductForm.addEventListener('submit', handleAddProduct);

  // 14. التنقل بين تبويبات لوحة المدير
  adminOrdersTabBtn.addEventListener('click', () => {
    adminOrdersTabBtn.classList.add('active');
    adminProductsTabBtn.classList.remove('active');
    document.getElementById('admin-orders-view').classList.remove('hidden');
    document.getElementById('admin-products-view').classList.add('hidden');
  });

  adminProductsTabBtn.addEventListener('click', () => {
    adminProductsTabBtn.classList.add('active');
    adminOrdersTabBtn.classList.remove('active');
    document.getElementById('admin-products-view').classList.remove('hidden');
    document.getElementById('admin-orders-view').classList.add('hidden');
  });

  // 15. أزرار تفريغ السجلات
  clearOrdersBtn.addEventListener('click', () => {
    if (orders.length === 0) return;
    if (confirm("هل أنت متأكد من مسح جميع سجلات طلبات العائلة بالكامل؟")) {
      clearOrdersOnServer();
      showToast("تم تفريغ السجل بالكامل");
      renderAdminOrders();
      renderOrdersHistory();
    }
  });

  resetProductsBtn.addEventListener('click', () => {
    if (confirm("هل تريد استعادة قائمة الطعام الافتراضية الأصلية؟ (سيؤدي ذلك إلى حذف المنتجات المضافة يدوياً)")) {
      resetProductsToServer();
      showToast("تمت استعادة المنيو الافتراضي");
      renderProducts();
      renderAdminProducts();
    }
  });
});
