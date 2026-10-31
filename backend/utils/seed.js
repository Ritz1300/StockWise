require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Store = require("../models/Store");
const User = require("../models/User");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const Batch = require("../models/Batch");
const StockMovement = require("../models/StockMovement");
const Sale = require("../models/Sale");
const PurchaseOrder = require("../models/PurchaseOrder");

const runSeed = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<username>") || uri.includes("<password>")) {
    console.error("❌ MONGODB_URI is not set. Please update backend/.env before running the seeder.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for seeding...");

    // Check if store already exists
    let store = await Store.findOne({ name: "GreenValley Fresh Mart" });
    if (store) {
      console.log("Existing GreenValley Fresh Mart store found. Cleaning previous data for fresh seed...");
      await Promise.all([
        User.deleteMany({ store: store._id }),
        Supplier.deleteMany({ store: store._id }),
        Product.deleteMany({ store: store._id }),
        Batch.deleteMany({ store: store._id }),
        StockMovement.deleteMany({ store: store._id }),
        Sale.deleteMany({ store: store._id }),
        PurchaseOrder.deleteMany({ store: store._id }),
      ]);
    } else {
      store = await Store.create({
        name: "GreenValley Fresh Mart",
        address: "42 Market Street, Bangalore",
        phone: "+91 98765 43210",
        email: "contact@greenvalleyfresh.com",
        currency: "INR",
        timezone: "Asia/Kolkata",
      });
      console.log("Created Store:", store.name);
    }

    // 1. Create Users
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const users = await User.insertMany([
      {
        name: "Aarav Sharma",
        email: "demo@stockwise.com",
        password: hashedPassword,
        role: "owner",
        store: store._id,
      },
      {
        name: "Priya Patel",
        email: "manager@stockwise.com",
        password: hashedPassword,
        role: "manager",
        store: store._id,
      },
      {
        name: "Rahul Verma",
        email: "staff@stockwise.com",
        password: hashedPassword,
        role: "staff",
        store: store._id,
      },
    ]);
    const ownerUser = users[0];
    console.log(`Created ${users.length} users. Demo Login: demo@stockwise.com / password123`);

    // 2. Create Suppliers
    const suppliers = await Supplier.insertMany([
      {
        store: store._id,
        name: "FreshDairy Farms Co.",
        contactPerson: "Vikram Sen",
        phone: "+91 98111 22334",
        email: "orders@freshdairy.com",
        address: "Dairy Valley Industrial Area",
        leadTimeDays: 2,
      },
      {
        store: store._id,
        name: "GreenGroves Organic Produce",
        contactPerson: "Anita Rao",
        phone: "+91 98222 33445",
        email: "supply@greengroves.com",
        address: "Farm Belt Highway 4",
        leadTimeDays: 2,
      },
      {
        store: store._id,
        name: "Sunrise Bakeries Ltd.",
        contactPerson: "Kunal Mehra",
        phone: "+91 98333 44556",
        email: "sales@sunrisebake.com",
        address: "Baker Street Hub",
        leadTimeDays: 1,
      },
      {
        store: store._id,
        name: "PantryMasters FMCG Dist.",
        contactPerson: "Rohan Gupta",
        phone: "+91 98444 55667",
        email: "orders@pantrymasters.com",
        address: "Logistics Park Sector 12",
        leadTimeDays: 3,
      },
    ]);
    console.log(`Created ${suppliers.length} suppliers.`);

    const [supDairy, supProduce, supBakery, supPantry] = suppliers;

    // 3. Create Products
    const productsData = [
      {
        name: "Organic Whole Milk 1L",
        sku: "DAIRY-MLK-01",
        category: "Dairy",
        costPrice: 42,
        sellingPrice: 60,
        reorderLevel: 25,
        safetyStock: 10,
        targetCoverageDays: 7,
        supplier: supDairy._id,
      },
      {
        name: "Fresh Malai Paneer 200g",
        sku: "DAIRY-PNR-02",
        category: "Dairy",
        costPrice: 75,
        sellingPrice: 110,
        reorderLevel: 20,
        safetyStock: 8,
        targetCoverageDays: 10,
        supplier: supDairy._id,
      },
      {
        name: "Probiotic Greek Yogurt 400g",
        sku: "DAIRY-YGT-03",
        category: "Dairy",
        costPrice: 90,
        sellingPrice: 140,
        reorderLevel: 15,
        safetyStock: 5,
        targetCoverageDays: 14,
        supplier: supDairy._id,
      },
      {
        name: "Artisanal Whole Wheat Bread 400g",
        sku: "BAKE-BRD-01",
        category: "Bakery",
        costPrice: 30,
        sellingPrice: 50,
        reorderLevel: 20,
        safetyStock: 10,
        targetCoverageDays: 5,
        supplier: supBakery._id,
      },
      {
        name: "Multi-Grain Toast Rusk 300g",
        sku: "BAKE-RSK-02",
        category: "Bakery",
        costPrice: 45,
        sellingPrice: 75,
        reorderLevel: 15,
        safetyStock: 5,
        targetCoverageDays: 20,
        supplier: supBakery._id,
      },
      {
        name: "Royal Gala Crisp Apples 1kg",
        sku: "PROD-APL-01",
        category: "Produce",
        costPrice: 130,
        sellingPrice: 190,
        reorderLevel: 30,
        safetyStock: 15,
        targetCoverageDays: 7,
        supplier: supProduce._id,
      },
      {
        name: "Fresh Farm Red Tomatoes 1kg",
        sku: "PROD-TOM-02",
        category: "Produce",
        costPrice: 28,
        sellingPrice: 45,
        reorderLevel: 40,
        safetyStock: 20,
        targetCoverageDays: 5,
        supplier: supProduce._id,
      },
      {
        name: "Baby Spinach Hydroponic 250g",
        sku: "PROD-SPN-03",
        category: "Produce",
        costPrice: 35,
        sellingPrice: 60,
        reorderLevel: 15,
        safetyStock: 8,
        targetCoverageDays: 4,
        supplier: supProduce._id,
      },
      {
        name: "Pure Valencia Orange Juice 1L",
        sku: "BEV-OJU-01",
        category: "Beverages",
        costPrice: 85,
        sellingPrice: 135,
        reorderLevel: 15,
        safetyStock: 6,
        targetCoverageDays: 14,
        supplier: supPantry._id,
      },
      {
        name: "Organic Green Tea 25 Bags",
        sku: "BEV-TEA-02",
        category: "Beverages",
        costPrice: 120,
        sellingPrice: 195,
        reorderLevel: 12,
        safetyStock: 5,
        targetCoverageDays: 30,
        supplier: supPantry._id,
      },
      {
        name: "Royal Heritage Basmati Rice 5kg",
        sku: "STPL-RCE-01",
        category: "Staples",
        costPrice: 380,
        sellingPrice: 550,
        reorderLevel: 15,
        safetyStock: 8,
        targetCoverageDays: 30,
        supplier: supPantry._id,
      },
      {
        name: "Cold-Pressed Mustard Oil 1L",
        sku: "STPL-OIL-02",
        category: "Staples",
        costPrice: 145,
        sellingPrice: 215,
        reorderLevel: 20,
        safetyStock: 8,
        targetCoverageDays: 30,
        supplier: supPantry._id,
      },
    ];

    const products = await Product.insertMany(
      productsData.map((p) => ({ ...p, store: store._id, isActive: true }))
    );
    console.log(`Created ${products.length} catalog products across 5 grocery categories.`);

    // 4. Create Inventory Batches with Varied Expiry Profiles
    const now = new Date();
    const batchesData = [];

    products.forEach((prod, idx) => {
      // Healthy long-life batch
      const healthyExpiry = new Date(now);
      healthyExpiry.setDate(healthyExpiry.getDate() + 45 + (idx * 5));
      batchesData.push({
        store: store._id,
        product: prod._id,
        batchNumber: `${prod.sku}-B${101 + idx}`,
        receivedDate: new Date(now.getTime() - 10 * 86400000),
        expiryDate: healthyExpiry,
        initialQuantity: 60,
        remainingQuantity: 45,
        unitCost: prod.costPrice,
        status: "active",
      });

      // Expiring soon batch for perishable goods (milk, bread, yogurt, paneer, spinach)
      if (["Dairy", "Bakery", "Produce"].includes(prod.category)) {
        const soonExpiry = new Date(now);
        // Half of them expire in 4 days (urgent), others in 18 days
        const daysAhead = idx % 2 === 0 ? 4 : 18;
        soonExpiry.setDate(soonExpiry.getDate() + daysAhead);

        batchesData.push({
          store: store._id,
          product: prod._id,
          batchNumber: `${prod.sku}-EXP${201 + idx}`,
          receivedDate: new Date(now.getTime() - 15 * 86400000),
          expiryDate: soonExpiry,
          initialQuantity: 30,
          remainingQuantity: 18,
          unitCost: prod.costPrice,
          status: "active",
        });
      }

      // Add a couple already expired batches to test write-off and alerts
      if (idx === 1 || idx === 3) {
        const pastExpiry = new Date(now);
        pastExpiry.setDate(pastExpiry.getDate() - 3);
        batchesData.push({
          store: store._id,
          product: prod._id,
          batchNumber: `${prod.sku}-PAST${99 + idx}`,
          receivedDate: new Date(now.getTime() - 25 * 86400000),
          expiryDate: pastExpiry,
          initialQuantity: 20,
          remainingQuantity: 6,
          unitCost: prod.costPrice,
          status: "active",
        });
      }
    });

    const batches = await Batch.insertMany(batchesData);
    console.log(`Created ${batches.length} inventory batches (healthy, expiring soon, and past expiry).`);

    // Record stock movements for batch intakes
    const movementsData = batches.map((b) => ({
      store: store._id,
      product: b.product,
      batch: b._id,
      type: "received",
      quantity: b.initialQuantity,
      quantityBefore: 0,
      quantityAfter: b.initialQuantity,
      reference: "opening",
      notes: "Initial inventory batch load",
      createdBy: ownerUser._id,
    }));
    await StockMovement.insertMany(movementsData);

    // 5. Generate 90 Days of Historical Sales for High-Quality Forecasts
    console.log("Generating 90 days of historical sales with realistic weekend seasonality...");
    const salesRecords = [];
    const salesMovements = [];

    // Daily baseline quantity for each product
    const productBaselines = [
      14, // Milk
      8,  // Paneer
      6,  // Yogurt
      12, // Bread
      5,  // Rusk
      10, // Apples
      15, // Tomatoes
      7,  // Spinach
      6,  // Orange Juice
      4,  // Green Tea
      5,  // Rice
      4,  // Mustard Oil
    ];

    for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
      const saleDate = new Date(now);
      saleDate.setDate(saleDate.getDate() - dayOffset);
      const dayOfWeek = saleDate.getDay(); // 0 = Sun, 6 = Sat

      // Weekend surge factor
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.45 : (dayOfWeek === 5 ? 1.2 : 0.95);

      // Random transactions during the day (3 - 6 transactions per day)
      const transactionsCount = Math.floor(Math.random() * 4) + 3;

      for (let t = 0; t < transactionsCount; t++) {
        const items = [];
        let subtotal = 0;

        // Each transaction picks 2 to 5 random products
        const itemsCount = Math.floor(Math.random() * 4) + 2;
        const pickedIndexes = new Set();
        while (pickedIndexes.size < itemsCount) {
          pickedIndexes.add(Math.floor(Math.random() * products.length));
        }

        pickedIndexes.forEach((idx) => {
          const prod = products[idx];
          const baseline = productBaselines[idx] / transactionsCount;
          const noise = 0.8 + Math.random() * 0.4; // 80% to 120%
          const qty = Math.max(1, Math.round(baseline * weekendMultiplier * noise));
          const lineSubtotal = prod.sellingPrice * qty;

          items.push({
            product: prod._id,
            productName: prod.name,
            productSku: prod.sku,
            quantity: qty,
            sellingPrice: prod.sellingPrice,
            costPrice: prod.costPrice,
            subtotal: lineSubtotal,
          });
          subtotal += lineSubtotal;
        });

        const saleNum = `INV-${saleDate.getFullYear()}${String(saleDate.getMonth() + 1).padStart(2, "0")}${String(saleDate.getDate()).padStart(2, "0")}-${String(t + 1).padStart(3, "0")}${Math.floor(Math.random() * 90 + 10)}`;

        salesRecords.push({
          store: store._id,
          saleNumber: saleNum,
          items,
          subtotal,
          discount: 0,
          total: subtotal,
          paymentMethod: ["cash", "upi", "card"][Math.floor(Math.random() * 3)],
          createdBy: ownerUser._id,
          saleDate,
        });
      }
    }

    const insertedSales = await Sale.insertMany(salesRecords);
    console.log(`Created ${insertedSales.length} historical sales transactions across the last 90 days.`);

    // 6. Create sample Purchase Orders
    const samplePO = await PurchaseOrder.create({
      store: store._id,
      poNumber: `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-001`,
      supplier: supDairy._id,
      items: [
        {
          product: products[0]._id,
          productName: products[0].name,
          orderedQty: 50,
          receivedQty: 0,
          unitCost: products[0].costPrice,
          subtotal: 50 * products[0].costPrice,
        },
        {
          product: products[1]._id,
          productName: products[1].name,
          orderedQty: 30,
          receivedQty: 0,
          unitCost: products[1].costPrice,
          subtotal: 30 * products[1].costPrice,
        },
      ],
      totalAmount: (50 * products[0].costPrice) + (30 * products[1].costPrice),
      status: "sent",
      expectedDate: new Date(now.getTime() + 2 * 86400000),
      notes: "Weekly restock of high-turnover dairy products",
      createdBy: ownerUser._id,
    });
    console.log(`Created sample pending purchase order: ${samplePO.poNumber}`);

    console.log("\n========================================================");
    console.log("🎉 Database seeding completed successfully!");
    console.log("Login credentials:");
    console.log("  Owner:   demo@stockwise.com / password123");
    console.log("  Manager: manager@stockwise.com / password123");
    console.log("  Staff:   staff@stockwise.com / password123");
    console.log("========================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

runSeed();