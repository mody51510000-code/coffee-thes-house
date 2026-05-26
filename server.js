const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const PRODUCTS_FILE = path.join(__dirname, 'database_products.json');
const ORDERS_FILE = path.join(__dirname, 'database_orders.json');

// التأكد من تهيئة ملفات قواعد البيانات المبدئية
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
}

// دالة لمساعدتنا في قراءة بيانات الـ POST
function getRequestData(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// إنشاء الخادم
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // ==========================================================================
  // 1. روابط الـ API الخاصة بالمنتجات والطلبات
  // ==========================================================================

  // جلب المنتجات المعروضة بالمنيو
  if (pathname === '/api/products' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      res.end(data);
    } else {
      // في حال عدم وجود المنتجات، سيقوم الـ Client بتحميل الافتراضية
      res.end(JSON.stringify([]));
    }
    return;
  }

  // إضافة منتج جديد للمنيو
  if (pathname === '/api/products' && method === 'POST') {
    try {
      const newProduct = await getRequestData(req);
      let productsList = [];
      if (fs.existsSync(PRODUCTS_FILE)) {
        productsList = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
      }
      productsList.push(newProduct);
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(productsList, null, 2), 'utf-8');
      
      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, product: newProduct }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON request' }));
    }
    return;
  }

  // حذف منتج من المنيو
  if (pathname === '/api/products' && method === 'DELETE') {
    const prodId = parsedUrl.searchParams.get('id');
    if (!prodId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing product id' }));
      return;
    }

    if (fs.existsSync(PRODUCTS_FILE)) {
      let productsList = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
      productsList = productsList.filter(p => p.id !== prodId);
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(productsList, null, 2), 'utf-8');
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // استعادة قائمة المنتجات الافتراضية
  if (pathname === '/api/products/reset' && method === 'POST') {
    if (fs.existsSync(PRODUCTS_FILE)) {
      fs.unlinkSync(PRODUCTS_FILE);
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Products database reset' }));
    return;
  }

  // جلب سجل طلبات العائلة بالكامل
  if (pathname === '/api/orders' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
    res.end(data);
    return;
  }

  // تسجيل طلب جديد من أفراد العائلة
  if (pathname === '/api/orders' && method === 'POST') {
    try {
      const newOrder = await getRequestData(req);
      const ordersList = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
      ordersList.unshift(newOrder); // إضافة الطلب الجديد في البداية
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersList, null, 2), 'utf-8');

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, order: newOrder }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON request' }));
    }
    return;
  }

  // تحديث حالة طلب معين (قيد الانتظار -> جاري التجهيز -> تم التوصيل)
  if (pathname === '/api/orders/status' && method === 'PUT') {
    const orderId = parsedUrl.searchParams.get('id');
    const status = parsedUrl.searchParams.get('status');

    if (!orderId || !status) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing orderId or status' }));
      return;
    }

    const ordersList = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    const order = ordersList.find(o => o.id === orderId);
    
    if (order) {
      order.status = status;
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersList, null, 2), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, order }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Order not found' }));
    }
    return;
  }

  // مسح سجل طلبات العائلة بالكامل
  if (pathname === '/api/orders' && method === 'DELETE') {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'All orders cleared' }));
    return;
  }


  // ==========================================================================
  // 2. معالجة وتوفير الملفات الثابتة (Static Files Handler)
  // ==========================================================================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // لمنع قراءة ملفات النظام الخارجية خارج مجلد العمل
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('غير مسموح بالوصول لهذا المجلد.');
    return;
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html; charset=utf-8';

  switch (extname) {
    case '.js':
      contentType = 'application/javascript; charset=utf-8';
      break;
    case '.css':
      contentType = 'text/css; charset=utf-8';
      break;
    case '.json':
      contentType = 'application/json; charset=utf-8';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 - الصفحة غير موجودة</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`خطأ داخلي في الخادم: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// تشغيل الخادم
server.listen(PORT, () => {
  // معرفة عنوان الآي بي للجهاز على شبكة الواي فاي المنزلية
  const interfaces = os.networkInterfaces();
  let localIp = 'localhost';
  
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        localIp = alias.address;
        break;
      }
    }
  }

  console.log('\n==================================================');
  console.log('  🏠 كوفي Thes House جاهز للعمل على الشبكة المحلية 🏠');
  console.log('==================================================');
  console.log(`🔑 رابط المالك (الكمبيوتر):  http://localhost:${PORT}`);
  console.log(`📱 رابط العائلة (الجوالات):  http://${localIp}:${PORT}`);
  console.log('==================================================\n');
  console.log('اضغط (Ctrl + C) لإيقاف تشغيل الخادم في أي وقت.\n');
});
