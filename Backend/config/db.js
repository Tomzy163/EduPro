import mongoose from "mongoose";
import {
  createDatabaseBackup,
  getDatabaseConnectionSummary,
  restoreLatestBackupIfCollectionsMissing,
  startDatabaseBackupInterval,
} from "../utils/databaseBackup.js";
import { ensureSchoolIdentityBackfill } from "../utils/schoolDirectory.js";

let connectionEventsRegistered = false;

const registerConnectionEvents = () => {
  if (connectionEventsRegistered) {
    return;
  }

  connectionEventsRegistered = true;

  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected. Waiting for reconnection.");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully.");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB runtime error:", error.message);
  });
};

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // Exit process if DB fails
  }
};

export default connectDB;
