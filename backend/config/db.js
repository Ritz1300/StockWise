const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes("<username>") || uri.includes("<password>")) {
    console.warn("\n============================================================");
    console.warn("⚠️  MONGODB_URI is not configured in backend/.env!");
    console.warn("Please open backend/.env and replace MONGODB_URI with your");
    console.warn("actual MongoDB Atlas connection string or local MongoDB URI.");
    console.warn("Example: mongodb+srv://myuser:mypassword@cluster0.mongodb.net/stockwise");
    console.warn("============================================================\n");
    return null;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.warn("Backend is running, but database operations will fail until MongoDB is connected.");
    return null;
  }
};

module.exports = connectDB;