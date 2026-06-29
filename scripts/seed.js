require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const StudentListing = require('../models/StudentListing');
const Review = require('../models/Review');
const Order = require('../models/Order');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campuskart');
    console.log('MongoDB Connected for Seeding...');
  } catch (error) {
    console.error('Database connection error in seed:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // 1. Clean Database
    console.log('Clearing old collections...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await Coupon.deleteMany({});
    await StudentListing.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    console.log('Collections cleared.');

    // 2. Create Users
    console.log('Seeding Users...');
    const adminUser = await User.create({
      name: 'Aditya Raj (Admin)',
      email: 'admin@campuskart.com',
      password: 'admin123',
      role: 'admin',
      addresses: [
        {
          name: 'Aditya Raj',
          phone: '9876543210',
          address: 'Room 304, Hostel A, IIT Bombay',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400076',
          isDefault: true
        }
      ]
    });

    const studentUser = await User.create({
      name: 'Rahul Sharma',
      email: 'student@campuskart.com',
      password: 'student123',
      role: 'user',
      addresses: [
        {
          name: 'Rahul Sharma',
          phone: '9988776655',
          address: 'Room 102, Hostel C, IIT Delhi',
          city: 'New Delhi',
          state: 'Delhi',
          pinCode: '110016',
          isDefault: true
        }
      ]
    });

    const studentUser2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@campuskart.com',
      password: 'student123',
      role: 'user',
      addresses: [
        {
          name: 'Priya Patel',
          phone: '9123456789',
          address: 'Block 2, girls hostel, BITS Pilani',
          city: 'Pilani',
          state: 'Rajasthan',
          pinCode: '333031',
          isDefault: true
        }
      ]
    });

    console.log('Users seeded.');

    // 3. Create Categories
    console.log('Seeding Categories...');
    const categoriesData = [
      { name: 'Books', description: 'Academic textbooks, reference guides, and literature', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop' },
      { name: 'Stationery', description: 'Notebooks, pens, registers, and office items', image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop' },
      { name: 'Hostel Essentials', description: 'Bedsheets, laundry bags, locks, and setups', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&auto=format&fit=crop' },
      { name: 'Engineering Kits', description: 'Drafting tools, lab kits, breadboards, and elements', image: '/assets/images/drawing_kit.png' },
      { name: 'Calculators', description: 'Scientific and financial calculators', image: '/assets/images/scientific_calculator.png' },
      { name: 'Tech Accessories', description: 'Laptop stands, sleeves, USB hubs, and charges', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop' },
      { name: 'College Merchandise', description: 'T-shirts, hoodies, mugs, and caps', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&auto=format&fit=crop' },
      { name: 'Study Setup', description: 'Study lamps, organizers, and seat cushions', image: '/assets/images/study_lamp.png' },
      { name: 'Backpacks', description: 'Ergonomic college bags and laptop backpacks', image: '/assets/images/college_backpack.png' },
      { name: 'Water Bottles', description: 'Insulated stainless steel flasks and shaker bottles', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop' }
    ];

    const categories = await Category.create(categoriesData);
    const catMap = {};
    categories.forEach(c => {
      catMap[c.name] = c._id;
    });
    console.log('Categories seeded.');

    // 4. Create Products
    console.log('Seeding Products...');
    const productsData = [
      // Calculators
      {
        name: 'Casio FX-991EX ClassWiz Scientific Calculator',
        brand: 'Casio',
        category: catMap['Calculators'],
        price: 1595,
        discountPrice: 1399,
        description: 'The Casio FX-991EX ClassWiz is the most advanced scientific calculator allowed on college campuses. Features a high-resolution LCD display and 552 functions including spreadsheet operations, matrix calculations, and integration.',
        specifications: [
          { name: 'Functions', value: '552 Functions' },
          { name: 'Display', value: 'Natural Textbook Display' },
          { name: 'Power Source', value: 'Solar & Battery' },
          { name: 'Warranty', value: '3 Years Manufacturer Warranty' }
        ],
        images: [
          '/assets/images/scientific_calculator.png'
        ],
        stock: 50,
        rating: 4.8,
        reviewsCount: 15
      },
      // Engineering Kits
      {
        name: 'Premium Engineering Drawing Kit',
        brand: 'DrafterPro',
        category: catMap['Engineering Kits'],
        price: 999,
        discountPrice: 849,
        description: 'Complete drawing kit for first-year engineering students. Includes a premium mini-drafter, drawing board clips, set squares, a protractor, pro-circle, mechanical pencil with lead, and a heavy-duty storage bag.',
        specifications: [
          { name: 'Mini Drafter', value: 'Stainless Steel Rods, Clear Scales' },
          { name: 'Board Size Compatibility', value: 'Imperial Size (A2 / A3)' },
          { name: 'Included items', value: '11 Drafting items' },
          { name: 'Storage', value: 'Waterproof Nylon Bag' }
        ],
        images: [
          '/assets/images/drawing_kit.png'
        ],
        stock: 25,
        rating: 4.5,
        reviewsCount: 8
      },
      // Books
      {
        name: 'Higher Engineering Mathematics by B.S. Grewal (44th Ed)',
        brand: 'Khanna Publishers',
        category: catMap['Books'],
        price: 899,
        discountPrice: 720,
        description: 'The standard textbook for all engineering students in India. Covers topics in Linear Algebra, Calculus, Vector Analysis, Complex Variables, Differential Equations, and Numerical Methods.',
        specifications: [
          { name: 'Edition', value: '44th Edition (Latest)' },
          { name: 'Pages', value: '1350 Pages' },
          { name: 'Language', value: 'English' },
          { name: 'Binding', value: 'Paperback' }
        ],
        images: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop'
        ],
        stock: 40,
        rating: 4.7,
        reviewsCount: 22
      },
      // Study Setup
      {
        name: 'Smart Rechargeable LED Study Lamp',
        brand: 'Philips',
        category: catMap['Study Setup'],
        price: 1499,
        discountPrice: 1199,
        description: 'Eye-care LED study lamp with 3 brightness modes, touch-sensitive switch, and a flexible gooseneck. Includes a built-in phone stand and a rechargeable battery that lasts up to 8 hours on low brightness.',
        specifications: [
          { name: 'LED Lifespan', value: '25,000 Hours' },
          { name: 'Battery Capacity', value: '2000 mAh' },
          { name: 'Modes', value: 'Warm White, Natural White, Cool White' },
          { name: 'Charging Port', value: 'USB Type-C' }
        ],
        images: [
          '/assets/images/study_lamp.png'
        ],
        stock: 15,
        rating: 4.6,
        reviewsCount: 12
      },
      // Hostel Essentials
      {
        name: 'Heavy Duty Hostel Bundle (Bed Sheet + Pillow + Pillow Cover)',
        brand: 'HostelDecor',
        category: catMap['Hostel Essentials'],
        price: 799,
        discountPrice: 599,
        description: 'Perfect for standard hostel single beds. Contains one breathable 100% cotton single bedsheet, one soft microfiber pillow, and one matching pillow cover. Fade-resistant and machine washable.',
        specifications: [
          { name: 'Material', value: '100% Pure Cotton' },
          { name: 'Bedsheet Size', value: '60 x 90 inches' },
          { name: 'Thread Count', value: '180 TC' },
          { name: 'Pillow Material', value: 'Microfiber Fill' }
        ],
        images: [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop'
        ],
        stock: 30,
        rating: 4.3,
        reviewsCount: 5
      },
      // Tech Accessories
      {
        name: 'Ergonomic Aluminum Laptop Stand',
        brand: 'Portronics',
        category: catMap['Tech Accessories'],
        price: 1299,
        discountPrice: 949,
        description: 'Portable, foldable aluminum laptop stand supporting up to 17-inch laptops. Features 7 adjustable height levels and non-slip silicone pads to prevent scratches and heat vents for cooling.',
        specifications: [
          { name: 'Material', value: 'Premium Aluminum Alloy' },
          { name: 'Adjustment Levels', value: '7 Levels (Height: 5.5cm to 15.5cm)' },
          { name: 'Weight Capacity', value: 'Up to 15 Kg' },
          { name: 'Folded Dimensions', value: '25 x 4.5 x 1.5 cm' }
        ],
        images: [
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop'
        ],
        stock: 5, // Low stock product
        rating: 4.6,
        reviewsCount: 14
      },
      // Backpacks
      {
        name: 'Waterproof College Laptop Backpack 30L',
        brand: 'F Gear',
        category: catMap['Backpacks'],
        price: 1999,
        discountPrice: 1499,
        description: 'Spacious 30-litre backpack with a padded compartment for up to 15.6-inch laptops. Features water-resistant fabrics, 3 large compartments, an organizer pocket, and an external USB port for on-the-go charging.',
        specifications: [
          { name: 'Capacity', value: '30 Litres' },
          { name: 'Laptop Slot', value: 'Up to 15.6 inch' },
          { name: 'Water Resistant', value: 'Yes, IPX4' },
          { name: 'Material', value: 'Polyester' }
        ],
        images: [
          '/assets/images/college_backpack.png'
        ],
        stock: 20,
        rating: 4.4,
        reviewsCount: 9
      },
      // Water Bottles
      {
        name: 'Double-Walled Stainless Steel Flask 1L',
        brand: 'Milton',
        category: catMap['Water Bottles'],
        price: 999,
        discountPrice: 799,
        description: 'Vacuum-insulated stainless steel water bottle. Keeps beverages hot for 18 hours or ice-cold for 24 hours. Leakproof, sweat-proof exterior, and fits standard backpack side pockets.',
        specifications: [
          { name: 'Capacity', value: '1000 ml' },
          { name: 'Material', value: '304 Grade Stainless Steel' },
          { name: 'Insulation', value: 'Double-walled vacuum' },
          { name: 'BPA Free', value: 'Yes' }
        ],
        images: [
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop'
        ],
        stock: 35,
        rating: 4.7,
        reviewsCount: 18
      },
      // College Merchandise
      {
        name: 'NIT Raipur Official Logo Hoodie',
        brand: 'CampusMerch',
        category: catMap['College Merchandise'],
        price: 999,
        discountPrice: 799,
        description: 'Official premium navy blue hoodie featuring the embroidered emblem of National Institute of Technology, Raipur. Made from heavy-blend cotton fleece, comfortable unisex fit, double-lined hood.',
        specifications: [
          { name: 'Fabric', value: '80% Cotton, 20% Polyester fleece' },
          { name: 'Fit', value: 'Regular Unisex' },
          { name: 'Color', value: 'Navy Blue' },
          { name: 'Care', value: 'Machine wash warm' }
        ],
        images: [
          '/assets/images/nit_raipur_hoodie.png'
        ],
        stock: 30,
        rating: 4.8,
        reviewsCount: 11
      },
      {
        name: 'IIT Delhi Heritage Cotton Tee',
        brand: 'CampusMerch',
        category: catMap['College Merchandise'],
        price: 499,
        discountPrice: 399,
        description: 'Celebrate the legacy of IIT Delhi with this soft, pre-shrunk cotton t-shirt. Features a screen-printed emblem and clean typography on a comfortable grey backdrop.',
        specifications: [
          { name: 'Material', value: '100% Ring-spun cotton' },
          { name: 'Style', value: 'Round neck, short sleeves' },
          { name: 'Color', value: 'Dark Heather Grey' },
          { name: 'Weight', value: '180 GSM' }
        ],
        images: [
          '/assets/images/iit_delhi_tee.png'
        ],
        stock: 50,
        rating: 4.6,
        reviewsCount: 7
      },
      {
        name: 'BITS Pilani Classic Crest Coffee Mug',
        brand: 'CampusMerch',
        category: catMap['College Merchandise'],
        price: 299,
        discountPrice: 249,
        description: 'Premium black ceramic coffee mug decorated with the BITS Pilani crest print. Perfect accessory for your hostel study desk or morning coffee routine.',
        specifications: [
          { name: 'Volume', value: '330 ml' },
          { name: 'Material', value: 'Glazed Ceramic' },
          { name: 'Finish', value: 'Matte Black' },
          { name: 'Dishwasher Safe', value: 'Yes' }
        ],
        images: [
          '/assets/images/bits_pilani_mug.png'
        ],
        stock: 45,
        rating: 4.7,
        reviewsCount: 4
      },
      // Stationery
      {
        name: 'Pilot V7 Liquid Ink Rollerball Pens (Pack of 3)',
        brand: 'Pilot',
        category: catMap['Stationery'],
        price: 240,
        discountPrice: 0,
        description: 'Standard blue liquid ink rollerball pens featuring a 0.7mm fine point stainless steel tip. Advanced ink controller ensures smooth, skip-free writing, perfect for taking class notes and writing exams.',
        specifications: [
          { name: 'Tip Size', value: '0.7 mm Fine Point' },
          { name: 'Ink Color', value: 'Blue' },
          { name: 'Type', value: 'Liquid Ink Rollerball' },
          { name: 'Quantity', value: 'Pack of 3' }
        ],
        images: [
          '/assets/images/pilot_pens.png'
        ],
        stock: 100,
        rating: 4.8,
        reviewsCount: 15
      },
      {
        name: 'Classmate Premium Spiral A4 Notebooks (Pack of 6)',
        brand: 'Classmate',
        category: catMap['Stationery'],
        price: 420,
        discountPrice: 380,
        description: 'A pack of 6 premium softcover spiral-bound A4 notebooks. Each notebook contains 200 single-line pages of high-quality, eco-friendly paper to prevent ink bleed-through.',
        specifications: [
          { name: 'Size', value: 'A4 (29.7 x 21 cm)' },
          { name: 'Pages', value: '200 Pages per book' },
          { name: 'Binding', value: 'Spiral bound' },
          { name: 'Quantity', value: 'Pack of 6' }
        ],
        images: [
          '/assets/images/classmate_notebooks.png'
        ],
        stock: 40,
        rating: 4.7,
        reviewsCount: 9
      },
      {
        name: 'Apsara Platinum Extra Dark Pencils (Pack of 10)',
        brand: 'Apsara',
        category: catMap['Stationery'],
        price: 80,
        discountPrice: 0,
        description: 'Premium graphite pencils with extra dark lead for crisp lines. Striped silver-and-black design. Package includes one high-quality sharpener and one dust-free eraser. Perfect for sketching, drawing, and general study.',
        specifications: [
          { name: 'Lead Grade', value: 'Extra Dark HB' },
          { name: 'Pencils Included', value: '10 Pencils' },
          { name: 'Accessories', value: '1 Sharpener, 1 Eraser' }
        ],
        images: [
          '/assets/images/apsara_pencils.png'
        ],
        stock: 80,
        rating: 4.6,
        reviewsCount: 5
      }
    ];

    const products = await Product.create(productsData);
    console.log('Products seeded.');

    // 5. Create Coupons
    console.log('Seeding Coupons...');
    const couponsData = [
      {
        code: 'CAMPUS20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 800,
        expiryDate: new Date('2027-12-31'),
        active: true
      },
      {
        code: 'FLAT150',
        discountType: 'flat',
        discountValue: 150,
        minOrderValue: 1000,
        expiryDate: new Date('2027-12-31'),
        active: true
      },
      {
        code: 'WELCOME50',
        discountType: 'flat',
        discountValue: 50,
        minOrderValue: 299,
        expiryDate: new Date('2027-12-31'),
        active: true
      }
    ];

    await Coupon.create(couponsData);
    console.log('Coupons seeded.');

    // 6. Create Student Listings (Buy & Sell)
    console.log('Seeding Student Listings...');
    const listingsData = [
      {
        seller: studentUser._id,
        title: 'Lightly Used College Study Chair',
        description: 'Adjustable study chair with good back support. Swivels smoothly. Only 1 year old, selling because I am moving out of hostel. Mild scratches on armrests, otherwise perfect condition.',
        expectedPrice: 1200,
        category: 'Hostel Furniture',
        condition: 'Good',
        college: 'IIT Delhi',
        contactEmail: 'rahul.sharma@iitd.ac.in',
        images: [
          'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop'
        ],
        status: 'Available'
      },
      {
        seller: studentUser._id,
        title: 'Used 2nd Year Computer Science Textbooks',
        description: 'Set of 4 books covering Operating Systems (Galvin), Database Systems (Korth), Computer Networks (Tanenbaum), and Algorithms (CLRS). No missing pages. Highlighted text in some sections.',
        expectedPrice: 800,
        category: 'Used Books',
        condition: 'Good',
        college: 'IIT Delhi',
        contactEmail: 'rahul.sharma@iitd.ac.in',
        images: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop'
        ],
        status: 'Available'
      },
      {
        seller: studentUser2._id,
        title: 'Casio Scientific Calculator FX-82MS',
        description: 'Original Casio scientific calculator. Good condition, fully working. 240 functions. Essential for 1st-year labs.',
        expectedPrice: 350,
        category: 'Calculators',
        condition: 'Like New',
        college: 'BITS Pilani',
        contactEmail: 'priya.patel@pilani.bits-pilani.ac.in',
        images: [
          '/assets/images/scientific_calculator.png'
        ],
        status: 'Available'
      },
      {
        seller: studentUser2._id,
        title: 'Zebronics USB Keyboard',
        description: 'Compact USB wired keyboard. Membrane keys, comfortable typing. Used for 6 months. Selling because I upgraded to mechanical keyboard.',
        expectedPrice: 150,
        category: 'Laptop Accessories',
        condition: 'Good',
        college: 'BITS Pilani',
        contactEmail: 'priya.patel@pilani.bits-pilani.ac.in',
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop'
        ],
        status: 'Sold' // A pre-sold item to test Sold status workflows
      }
    ];

    await StudentListing.create(listingsData);
    console.log('Student Listings seeded.');

    // 7. Create pre-delivered orders for Rahul to allow him to review
    console.log('Seeding reviews and mock orders...');
    const rahulOrder = await Order.create({
      user: studentUser._id,
      items: [
        {
          product: products[0]._id, // Casio Calculator
          name: products[0].name,
          price: products[0].discountPrice,
          quantity: 1,
          image: products[0].images[0]
        }
      ],
      shippingAddress: studentUser.addresses[0],
      paymentMethod: 'COD',
      paymentStatus: 'Paid',
      subtotal: products[0].discountPrice,
      discount: 0,
      shippingCharges: 0,
      grandTotal: products[0].discountPrice,
      orderStatus: 'Delivered' // Delivered order so Rahul can leave verified review
    });

    // Seed pre-existing review
    await Review.create({
      user: studentUser._id,
      product: products[0]._id,
      rating: 5,
      comment: 'Excellent calculator. Mandatory for electrical engineering courses. The ClassWiz screen is extremely sharp compared to old calculators.',
      verifiedPurchase: true
    });

    // Re-trigger rating calculation
    await Review.calculateAverageRating(products[0]._id);

    console.log('Database Seeding Successful! All collections initialized.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
