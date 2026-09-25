export const INITIAL_TABLES = [
  { id: 'tbl-1', number: 'M-01', token: 'QR-CAFFE-M01', status: 'available', capacity: 2 },
  { id: 'tbl-2', number: 'M-02', token: 'QR-CAFFE-M02', status: 'occupied', capacity: 4 },
  { id: 'tbl-3', number: 'M-03', token: 'QR-CAFFE-M03', status: 'available', capacity: 4 },
  { id: 'tbl-4', number: 'M-04', token: 'QR-CAFFE-M04', status: 'available', capacity: 6 },
  { id: 'tbl-5', number: 'M-05', token: 'QR-CAFFE-M05', status: 'available', capacity: 2 },
  { id: 'tbl-6', number: 'M-06', token: 'QR-CAFFE-M06', status: 'occupied', capacity: 4 },
];

export const CATEGORIES = [
  { id: 'all', name: 'Semua Menu', icon: 'Coffee' },
  { id: 'coffee', name: 'Espresso & Coffee', icon: 'CupSoda' },
  { id: 'non-coffee', name: 'Non-Coffee', icon: 'Milk' },
  { id: 'food', name: 'Makanan Berat', icon: 'Utensils' },
  { id: 'snack', name: 'Snack & Pastry', icon: 'Cookie' },
];

export const PRODUCTS = [
  {
    id: 'prod-1',
    categoryId: 'coffee',
    name: 'Kopi Kenangan Aren (Iced)',
    description: 'Espresso ganda dengan susu segar organik dan gula aren asli Tuban.',
    price: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    variants: [
      {
        group: 'Temperature',
        name: 'Suhu',
        options: [
          { label: 'Es (Iced)', extraPrice: 0 },
          { label: 'Panas (Hot)', extraPrice: 0 },
        ]
      },
      {
        group: 'SugarLevel',
        name: 'Tingkat Manis',
        options: [
          { label: 'Normal Sugar (100%)', extraPrice: 0 },
          { label: 'Less Sugar (50%)', extraPrice: 0 },
          { label: 'No Sugar (0%)', extraPrice: 0 },
        ]
      },
      {
        group: 'Topping',
        name: 'Extra Topping',
        options: [
          { label: 'Extra Espresso Shot', extraPrice: 6000 },
          { label: 'Grass Jelly', extraPrice: 5000 },
          { label: 'Salted Caramel Syrup', extraPrice: 5000 },
        ]
      }
    ]
  },
  {
    id: 'prod-2',
    categoryId: 'coffee',
    name: 'Caramel Macchiato',
    description: 'Espresso rich disiram syrup vanilla, steamed milk, dan drizzle caramel pekat.',
    price: 36000,
    imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    variants: [
      {
        group: 'Temperature',
        name: 'Suhu',
        options: [
          { label: 'Panas (Hot)', extraPrice: 0 },
          { label: 'Es (Iced)', extraPrice: 2000 },
        ]
      },
      {
        group: 'Milk',
        name: 'Jenis Susu',
        options: [
          { label: 'Fresh Milk', extraPrice: 0 },
          { label: 'Oat Milk', extraPrice: 8000 },
        ]
      }
    ]
  },
  {
    id: 'prod-3',
    categoryId: 'coffee',
    name: 'Manual Brew Single Origin',
    description: 'Biji kopi Pilihan (Gayo / Toraja / Kintamani) metode V60 pour over.',
    price: 32000,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    variants: [
      {
        group: 'Beans',
        name: 'Pilihan Biji Kopi',
        options: [
          { label: 'Aceh Gayo Wine (Fruity)', extraPrice: 0 },
          { label: 'Toraja Sapan (Chocolatey)', extraPrice: 0 },
          { label: 'Bali Kintamani (Citrus)', extraPrice: 3000 },
        ]
      }
    ]
  },
  {
    id: 'prod-4',
    categoryId: 'non-coffee',
    name: 'Matcha Latte Japan',
    description: 'Pure Uji Matcha kelas seremonial dipadu susu segar lembut.',
    price: 34000,
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    variants: [
      {
        group: 'Temperature',
        name: 'Suhu',
        options: [
          { label: 'Es (Iced)', extraPrice: 0 },
          { label: 'Panas (Hot)', extraPrice: 0 },
        ]
      }
    ]
  },
  {
    id: 'prod-5',
    categoryId: 'non-coffee',
    name: 'Artisan Chocolate Signature',
    description: 'Cokelat Belgia 70% dark disajikan hangat atau dingin dengan foam lembut.',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    variants: []
  },
  {
    id: 'prod-6',
    categoryId: 'food',
    name: 'Nasi Goreng Special Caffe',
    description: 'Nasi goreng rempah nusantara dengan ayam suwir, telur mata sapi, kerupuk, dan acai.',
    price: 42000,
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    variants: [
      {
        group: 'Spicy',
        name: 'Tingkat Pedas',
        options: [
          { label: 'Tidak Pedas', extraPrice: 0 },
          { label: 'Sedang (Level 1)', extraPrice: 0 },
          { label: 'Pedas (Level 3)', extraPrice: 0 },
        ]
      }
    ]
  },
  {
    id: 'prod-7',
    categoryId: 'food',
    name: 'Beef Truffle Burger',
    description: '100% Australian Beef Patty dengan saus truffle aioli, keju melt, dan french fries.',
    price: 58000,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    variants: []
  },
  {
    id: 'prod-8',
    categoryId: 'snack',
    name: 'Croissant Butter Original',
    description: 'Flaky pastry Prancis panggang segar tiap pagi dengan aroma mentega kaya.',
    price: 24000,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    variants: []
  },
  {
    id: 'prod-9',
    categoryId: 'snack',
    name: 'Truffle French Fries',
    description: 'Kentang goreng renyah ditaburi minyak truffle murni dan keju Parmesan parut.',
    price: 29000,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    variants: []
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-20260925-001',
    tableNumber: 'M-02',
    tableToken: 'QR-CAFFE-M02',
    customerName: 'Budi Santoso',
    orderType: 'dine_in',
    status: 'preparing', // pending_payment, confirmed, preparing, ready, completed, cancelled
    paymentStatus: 'paid', // unpaid, paid
    paymentMethod: 'qris', // cash, qris, debit
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    subtotal: 70000,
    tax: 7000,
    total: 77000,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Kopi Kenangan Aren (Iced)',
        quantity: 2,
        unitPrice: 28000,
        subtotal: 56000,
        selectedVariants: ['Es (Iced)', 'Less Sugar (50%)'],
        notes: 'Sedikit es ya kak'
      },
      {
        id: 'item-2',
        productId: 'prod-8',
        productName: 'Croissant Butter Original',
        quantity: 1,
        unitPrice: 24000,
        subtotal: 24000,
        selectedVariants: [],
        notes: 'Dihangatkan'
      }
    ]
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-20260925-002',
    tableNumber: 'M-06',
    tableToken: 'QR-CAFFE-M06',
    customerName: 'Siti Rahma',
    orderType: 'dine_in',
    status: 'pending_payment',
    paymentStatus: 'unpaid',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    subtotal: 42000,
    tax: 4200,
    total: 46200,
    items: [
      {
        id: 'item-3',
        productId: 'prod-6',
        productName: 'Nasi Goreng Special Caffe',
        quantity: 1,
        unitPrice: 42000,
        subtotal: 42000,
        selectedVariants: ['Pedas (Level 3)'],
        notes: 'Tanpa mentimun'
      }
    ]
  }
];
