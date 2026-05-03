import mongoose from "mongoose";
import { env } from "./env.js";
import {
  createDatabaseBackup,
  getDatabaseConnectionSummary,
  restoreLatestBackupIfCollectionsMissing,
  startDatabaseBackupInterval,
} from "../utils/databaseBackup.js";
import { ensureSchoolIdentityBackfill } from "../utils/schoolDirectory.js";
import { syncComplimentarySubscriptionOverrides } from "../utils/subscriptionAccess.js";

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

const connectDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not defined in .env");
  }

  registerConnectionEvents();

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  const restoreResult = await restoreLatestBackupIfCollectionsMissing();
  if (restoreResult.restoredCollections.length > 0) {
    console.warn(
      `Recovered missing MongoDB collections from the latest backup: ${restoreResult.restoredCollections.join(", ")}`
    );
  }

  const backfilledSchools = await ensureSchoolIdentityBackfill();
  if (backfilledSchools > 0) {
    console.log(`Backfilled identity data for ${backfilledSchools} school record(s).`);
  }

  const complimentaryOverrides = await syncComplimentarySubscriptionOverrides();
  if (complimentaryOverrides > 0) {
    console.log(
      `Applied complimentary Platinum access to ${complimentaryOverrides} qualifying school account(s).`
    );
  }

  const connectionSummary = await getDatabaseConnectionSummary();
  console.log(
    `MongoDB connected to ${connectionSummary.host}/${connectionSummary.name} with collections: ${JSON.stringify(
      connectionSummary.counts
    )}`
  );

  await createDatabaseBackup({ reason: "startup" });
  startDatabaseBackupInterval();
};

export default connectDatabase;
