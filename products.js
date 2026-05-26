// عينات قائمة الطعام الافتراضية لكوفي Thes House
// تستخدم كعينات جاهزة للمدير عند الرغبة في ملء القائمة تلقائياً للتجربة
const defaultProducts = [
  {
    id: "sample-1",
    name: "سبانيش لاتيه بارد",
    description: "مزيج متناغم من الحليب المكثف المحلى، الحليب الطازج، وجرعتين من إسبريسو حبوب أرابيكا الفاخرة مع الثلج.",
    price: 18,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "sample-2",
    name: "كورتادو دافئ",
    description: "كميات متساوية من الإسبريسو الغني والحليب المبخر بقوام كريمي ناعم، الخيار الأمثل لعشاق القهوة المركزة.",
    price: 14,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1510707577719-ee7c14b5740a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "sample-3",
    name: "قهوة V60 كولومبية مقطرة",
    description: "قهوة مقطرة بعناية من حبوب البن الكولومبية الفاخرة، تتميز بإيحاءات الفاكهة والحمضية المتوازنة وقوام خفيف.",
    price: 16,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "sample-4",
    name: "كابوتشينو كلاسيكي دافئ",
    description: "جرعة إسبريسو تعلوها رغوة حليب غنية وسميكة ومرشوشة ببودرة الكاكاو الفاخرة.",
    price: 15,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "sample-5",
    name: "كوكيز كلاسيك بالشوكولاتة",
    description: "كوكيز مخبوز منزلياً بحشوة غنية بقطع الشوكولاتة البلجيكية الداكنة والحليبية، يقدم دافئاً ومقرمش الأطراف.",
    price: 10,
    category: "food",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "sample-6",
    name: "كرواسون بالجبنة والزعتر",
    description: "كرواسون فرنسي هش ومورق، محشو بجبنة الفيتا الكريمية ومزين بالزعتر البري وزيت الزيتون.",
    price: 12,
    category: "food",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "sample-7",
    name: "كيكة الزعفران",
    description: "كيكة إسفنجية خفيفة غارقة في حليب الزعفران الفاخر، مزينة بالكريمة المخفوقة وخيوط الزعفران الأصلي.",
    price: 22,
    category: "food",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "sample-8",
    name: "أكواب ورقية بشعار Thes House",
    description: "طقم مكون من 5 أكواب ورقية مميزة لحفظ الحرارة، مطبوعة بشعار كوفي Thes House الأنيق باللون الذهبي المطفي.",
    price: 25,
    category: "other",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80"
  }
];

// تصديرها كمتغير عام متوافق مع كافة أنماط التشغيل المحلية والشبكية
window.defaultProducts = defaultProducts;
