const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Store = require('../models/Store.model');
const Product = require('../models/Product.model');

const MANIFEST_PATH = path.join(__dirname, '../seeds/product-seed-manifest.json');

// 25 Realistic Development Products Data
const SAMPLE_PRODUCTS = [
  // Electronics
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and high-fidelity sound driver.',
    category: 'Electronics',
    brand: 'Sony',
    price: 199.99,
    discountPrice: 169.99,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Mechanical RGB Gaming Keyboard',
    description: 'Tactile mechanical switches with customizable RGB backlighting, durable aluminum frame, and detachable wrist rest.',
    category: 'Electronics',
    brand: 'Corsair',
    price: 129.99,
    discountPrice: 99.99,
    stock: 15,
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Ultra HD 4K Webcam with Microphone',
    description: 'Crystal clear 4K video recording with dual noise-cancelling microphones and auto low-light correction.',
    category: 'Electronics',
    brand: 'Logitech',
    price: 89.99,
    discountPrice: 74.99,
    stock: 30,
    images: ['https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Portable Waterproof Bluetooth Speaker',
    description: 'Compact IPX7 waterproof Bluetooth speaker delivering deep bass and 12 hours of continuous playtime.',
    category: 'Electronics',
    brand: 'JBL',
    price: 59.99,
    discountPrice: 49.99,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Ergonomic Wireless Vertical Mouse',
    description: 'Designed to reduce wrist strain with adjustable DPI settings and dual Bluetooth / 2.4GHz wireless connectivity.',
    category: 'Electronics',
    brand: 'Anker',
    price: 34.99,
    discountPrice: 29.99,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop'],
  },
  {
    name: '10-in-1 USB-C Docking Hub',
    description: 'Multi-port USB-C adapter featuring 4K HDMI, Gigabit Ethernet, 100W Power Delivery, and SD card reader.',
    category: 'Electronics',
    brand: 'Belkin',
    price: 79.99,
    discountPrice: 0,
    stock: 20,
    images: ['https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=800&auto=format&fit=crop'],
  },

  // Fashion
  {
    name: 'Classic Heavyweight Cotton Hoodie',
    description: 'Ultra-soft 100% organic cotton pullover hoodie with fleece lining, kangaroo pocket, and ribbed cuffs.',
    category: 'Fashion',
    brand: 'UrbanStyle',
    price: 49.99,
    discountPrice: 39.99,
    stock: 35,
    images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Breathable Lightweight Running Shoes',
    description: 'Engineered mesh upper for maximum ventilation with responsive cushioning midsole for distance running.',
    category: 'Fashion',
    brand: 'ApexFit',
    price: 89.99,
    discountPrice: 69.99,
    stock: 22,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Slim-Fit Stretch Denim Jeans',
    description: 'Modern slim fit crafted from premium stretch cotton denim for all-day comfort and mobility.',
    category: 'Fashion',
    brand: 'DenimCraft',
    price: 59.99,
    discountPrice: 44.99,
    stock: 30,
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Minimalist Genuine Leather Wallet',
    description: 'Slim RFID-blocking bifold wallet handmade from full-grain leather with quick access card slots.',
    category: 'Fashion',
    brand: 'Heritage',
    price: 39.99,
    discountPrice: 29.99,
    stock: 45,
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Polarized UV-Protection Sunglasses',
    description: 'Classic unisex sunglasses featuring polarized anti-glare lenses and lightweight durable frame.',
    category: 'Fashion',
    brand: 'RayShade',
    price: 29.99,
    discountPrice: 19.99,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop'],
  },

  // Home & Living
  {
    name: 'Ergonomic Breathable Mesh Office Chair',
    description: 'Fully adjustable lumbar support, 3D armrests, and high-density memory foam seat cushion for desk productivity.',
    category: 'Home & Living',
    brand: 'ErgoComfort',
    price: 249.99,
    discountPrice: 199.99,
    stock: 12,
    images: ['https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Smart LED Desk Lamp with Wireless Charger',
    description: 'Touch control desk lamp with 5 color temperatures, step-less dimming, and built-in 10W wireless charging pad.',
    category: 'Home & Living',
    brand: 'Lumina',
    price: 45.99,
    discountPrice: 35.99,
    stock: 28,
    images: ['https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Aromatherapy Essential Oil Diffuser',
    description: 'Ultrasonic cool mist humidifier with 7 color ambient LED lights and automatic safety shut-off.',
    category: 'Home & Living',
    brand: 'ZenHome',
    price: 27.99,
    discountPrice: 21.99,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Stainless Steel Insulated Water Bottle (32oz)',
    description: 'Double-wall vacuum insulated flask keeping drinks cold for 24 hours or hot for 12 hours.',
    category: 'Home & Living',
    brand: 'HydroPro',
    price: 24.99,
    discountPrice: 19.99,
    stock: 60,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop'],
  },

  // Sports
  {
    name: 'High-Density Anti-Slip Yoga Mat',
    description: 'Extra thick 6mm eco-friendly TPE yoga mat with alignment lines and shoulder carrying strap included.',
    category: 'Sports',
    brand: 'BalanceFlex',
    price: 29.99,
    discountPrice: 22.99,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Adjustable Dumbbell Set (5-25 lbs)',
    description: 'Compact space-saving adjustable dumbbell with rapid dial system for home strength training.',
    category: 'Sports',
    brand: 'IronGrip',
    price: 149.99,
    discountPrice: 129.99,
    stock: 10,
    images: ['https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Smart Activity & Heart Rate Fitness Tracker',
    description: 'Waterproof fitness watch with SpO2 monitoring, sleep tracking, and 14 sport mode activity metrics.',
    category: 'Sports',
    brand: 'FitTech',
    price: 69.99,
    discountPrice: 54.99,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Waterproof Trail Running Backpack (15L)',
    description: 'Ultralight hydration pack with 2L water reservoir, breathable harness straps, and reflective strips.',
    category: 'Sports',
    brand: 'OutdoorGear',
    price: 49.99,
    discountPrice: 39.99,
    stock: 18,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop'],
  },

  // Books
  {
    name: 'Mastering Modern Web Architecture & Microservices',
    description: 'Comprehensive guide to building scalable full-stack applications with Node.js, React, and MongoDB.',
    category: 'Books',
    brand: 'TechPress',
    price: 39.99,
    discountPrice: 29.99,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop'],
  },
  {
    name: 'The Mindful Developer: Habits of High Performers',
    description: 'Actionable strategies for focus, code quality, preventing burnout, and engineering leadership.',
    category: 'Books',
    brand: 'MindfulPublishing',
    price: 24.99,
    discountPrice: 18.99,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Designing User Interfaces with Modern CSS & Tailwind',
    description: 'Learn modern UI design principles, accessibility guidelines, responsive layout grid systems, and micro-interactions.',
    category: 'Books',
    brand: 'DesignPress',
    price: 34.99,
    discountPrice: 27.99,
    stock: 35,
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop'],
  },

  // Accessories
  {
    name: 'Water-Resistant Laptop Sleeve (15.6 Inch)',
    description: 'Shockproof padded laptop case with soft velvet lining and accessory front pocket for charger and cables.',
    category: 'Accessories',
    brand: 'ShieldTech',
    price: 22.99,
    discountPrice: 17.99,
    stock: 45,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Multi-Angle Aluminum Tablet & Phone Stand',
    description: 'Sturdy foldaway desktop stand crafted from aerospace aluminum with anti-scratch silicone pads.',
    category: 'Accessories',
    brand: 'FlexiMount',
    price: 18.99,
    discountPrice: 14.99,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop'],
  },
  {
    name: 'Braided Fast Charging Cable 3-Pack',
    description: 'Heavy duty nylon-braided USB cables supporting 60W fast charging and high-speed data transmission.',
    category: 'Accessories',
    brand: 'PowerLine',
    price: 14.99,
    discountPrice: 11.99,
    stock: 100,
    images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop'],
  },
];

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

// Parse CLI Arguments: --store=slug/id OR --email=seller@email OR --all
const parseArgs = () => {
  const args = process.argv.slice(2);
  let storeArg = null;
  let emailArg = null;
  let allFlag  = false;

  args.forEach((arg) => {
    if (arg.startsWith('--store=')) storeArg = arg.split('=')[1];
    if (arg.startsWith('--email=')) emailArg = arg.split('=')[1];
    if (arg === '--all') allFlag = true;
  });

  return { storeArg, emailArg, allFlag };
};

const seedProducts = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is missing in server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');

    const { storeArg, emailArg, allFlag } = parseArgs();
    let targetStores = [];

    if (storeArg) {
      const query = storeArg.match(/^[0-9a-fA-F]{24}$/) ? { _id: storeArg } : { slug: storeArg };
      const store = await Store.findOne({ ...query, status: 'approved', isActive: true });
      if (!store) {
        console.error(`❌ Specified store "${storeArg}" not found or is not an approved active store.`);
        process.exit(1);
      }
      targetStores.push(store);
    } else if (emailArg) {
      const seller = await User.findOne({ email: emailArg.toLowerCase(), role: 'seller' });
      if (!seller) {
        console.error(`❌ Seller with email "${emailArg}" not found.`);
        process.exit(1);
      }
      const store = await Store.findOne({ seller: seller._id, status: 'approved', isActive: true });
      if (!store) {
        console.error(`❌ Approved active store for seller "${emailArg}" not found.`);
        process.exit(1);
      }
      targetStores.push(store);
    } else {
      // Find all approved active stores
      targetStores = await Store.find({ status: 'approved', isActive: true });
      if (targetStores.length === 0) {
        console.error('❌ No approved active stores found in database to attach products.');
        process.exit(1);
      }
    }

    console.log(`ℹ️ Target store(s) identified: ${targetStores.map((s) => s.name).join(', ')}`);

    // Ensure seeds directory exists
    const seedsDir = path.dirname(MANIFEST_PATH);
    if (!fs.existsSync(seedsDir)) {
      fs.mkdirSync(seedsDir, { recursive: true });
    }

    // Read existing seed manifest for idempotency
    let manifest = { createdProductIds: [], createdSlugs: [] };
    if (fs.existsSync(MANIFEST_PATH)) {
      try {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      } catch {
        manifest = { createdProductIds: [], createdSlugs: [] };
      }
    }

    const insertedIds = [...(manifest.createdProductIds || [])];
    const insertedSlugs = [...(manifest.createdSlugs || [])];
    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
      const sample = SAMPLE_PRODUCTS[i];
      // Assign store (round-robin if multi-store)
      const selectedStore = targetStores[i % targetStores.length];
      const baseSlug = slugify(sample.name);
      const uniqueSlug = `${baseSlug}-${selectedStore.slug}`;

      // Check if product already exists by unique slug
      const existingInDb = await Product.findOne({ slug: uniqueSlug });
      if (existingInDb || insertedSlugs.includes(uniqueSlug)) {
        skippedCount++;
        continue;
      }

      const product = await Product.create({
        name: sample.name,
        slug: uniqueSlug,
        description: sample.description,
        category: sample.category,
        brand: sample.brand,
        price: sample.price,
        discountPrice: sample.discountPrice,
        stock: sample.stock,
        images: sample.images,
        seller: selectedStore.seller,
        store: selectedStore._id,
        isActive: true,
      });

      insertedIds.push(product._id.toString());
      insertedSlugs.push(uniqueSlug);
      createdCount++;
    }

    // Save manifest file
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify({
      lastSeededAt: new Date().toISOString(),
      count: insertedIds.length,
      createdProductIds: insertedIds,
      createdSlugs: insertedSlugs,
    }, null, 2));

    console.log(`\n🎉 SEEDING COMPLETE:`);
    console.log(`   - Target Stores: ${targetStores.length}`);
    console.log(`   - Created Products: ${createdCount}`);
    console.log(`   - Skipped Existing: ${skippedCount}`);
    console.log(`   - Total Manifest Products: ${insertedIds.length}`);
    console.log(`   - Manifest File: ${MANIFEST_PATH}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

seedProducts();
