import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import Message from "../models/Message.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import Payment from "../models/Payment.js";
import Result from "../models/Result.js";
import School from "../models/School.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";

const BACKUP_DIRECTORY = path.resolve(process.cwd(), "backups", "mongo");
const LATEST_BACKUP_PATH = path.join(BACKUP_DIRECTORY, "latest.json");
const DEFAULT_BACKUP_INTERVAL_MINUTES = 15;

const BACKUP_MODELS = [
  { key: "schools", model: School },
  { key: "users", model: User },
  { key: "courses", model: Course },
  { key: "timetables", model: Timetable },
  { key: "attendances", model: Attendance },
  { key: "results", model: Result },
  { key: "payments", model: Payment },
  { key: "messages", model: Message },
  { key: "parentStudentLinks", model: ParentStudentLink },
];

let backupIntervalHandle = null;
let activeBackupPromise = null;

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const backupsEnabled = () => parseBoolean(process.env.DB_BACKUP_ENABLED, true);

const autoRestoreEnabled = () =>
  parseBoolean(
    process.env.DB_AUTO_RESTORE_ON_EMPTY,
    process.env.NODE_ENV !== "production"
  );

const getBackupIntervalMs = () => {
  const minutes = Number(process.env.DB_BACKUP_INTERVAL_MINUTES);

  if (Number.isFinite(minutes) && minutes > 0) {
    return minutes * 60 * 1000;
  }

  return DEFAULT_BACKUP_INTERVAL_MINUTES * 60 * 1000;
};

const ensureBackupDirectory = async () => {
  await fs.mkdir(BACKUP_DIRECTORY, { recursive: true });
};

const getCollectionCounts = async () => {
  const counts = await Promise.all(
    BACKUP_MODELS.map(async ({ key, model }) => [key, await model.countDocuments()])
  );

  return Object.fromEntries(counts);
};

const buildSnapshot = async (reason = "manual") => {
  const counts = await getCollectionCounts();
  const data = {};

  for (const { key, model } of BACKUP_MODELS) {
    data[key] = await model.find().lean();
  }

  return {
    meta: {
      reason,
      timestamp: new Date().toISOString(),
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    },
    counts,
    data,
  };
};

const readLatestBackup = async () => {
  try {
    const raw = await fs.readFile(LATEST_BACKUP_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const insertBackupDocuments = async ({ key, model, documents = [] }) => {
  if (!Array.isArray(documents) || documents.length === 0) {
    return 0;
  }

  await model.insertMany(documents, { ordered: false });
  return documents.length;
};

export const getDatabaseConnectionSummary = async () => ({
  host: mongoose.connection.host,
  name: mongoose.connection.name,
  readyState: mongoose.connection.readyState,
  counts: await getCollectionCounts(),
});

export const restoreLatestBackupIfCollectionsMissing = async () => {
  if (!backupsEnabled() || !autoRestoreEnabled()) {
    return {
      restoredCollections: [],
      reason: "disabled",
    };
  }

  const [backup, currentCounts] = await Promise.all([
    readLatestBackup(),
    getCollectionCounts(),
  ]);

  if (!backup?.data) {
    return {
      restoredCollections: [],
      reason: "no-backup",
    };
  }

  const restoredCollections = [];

  for (const entry of BACKUP_MODELS) {
    const currentCount = currentCounts[entry.key] || 0;
    const backupCount = Array.isArray(backup.data[entry.key])
      ? backup.data[entry.key].length
      : 0;

    if (currentCount === 0 && backupCount > 0) {
      await insertBackupDocuments({
        key: entry.key,
        model: entry.model,
        documents: backup.data[entry.key],
      });
      restoredCollections.push(entry.key);
    }
  }

  return {
    restoredCollections,
    reason: restoredCollections.length ? "restored" : "no-missing-collections",
  };
};

export const createDatabaseBackup = async ({ reason = "manual" } = {}) => {
  if (!backupsEnabled()) {
    return null;
  }

  if (activeBackupPromise) {
    return activeBackupPromise;
  }

  activeBackupPromise = (async () => {
    const snapshot = await buildSnapshot(reason);

    if (!Object.values(snapshot.counts).some((count) => count > 0)) {
      return null;
    }

    await ensureBackupDirectory();

    const sanitizedTimestamp = snapshot.meta.timestamp.replace(/[:.]/g, "-");
    const backupFilePath = path.join(
      BACKUP_DIRECTORY,
      `${sanitizedTimestamp}-${reason}.json`
    );
    const backupContent = JSON.stringify(snapshot, null, 2);

    await Promise.all([
      fs.writeFile(backupFilePath, backupContent, "utf8"),
      fs.writeFile(LATEST_BACKUP_PATH, backupContent, "utf8"),
    ]);

    return {
      path: backupFilePath,
      counts: snapshot.counts,
    };
  })().finally(() => {
    activeBackupPromise = null;
  });

  return activeBackupPromise;
};

export const syncLatestDatabaseBackup = async ({ reason = "sync" } = {}) => {
  try {
    return await createDatabaseBackup({ reason });
  } catch (error) {
    console.error(`Failed to sync the latest backup after ${reason}:`, error.message);
    return null;
  }
};

export const startDatabaseBackupInterval = () => {
  if (!backupsEnabled()) {
    return;
  }

  if (backupIntervalHandle) {
    clearInterval(backupIntervalHandle);
  }

  backupIntervalHandle = setInterval(() => {
    createDatabaseBackup({ reason: "interval" }).catch((error) => {
      console.error("MongoDB backup failed:", error.message);
    });
  }, getBackupIntervalMs());

  if (typeof backupIntervalHandle.unref === "function") {
    backupIntervalHandle.unref();
  }
};

export const stopDatabaseBackupInterval = () => {
  if (!backupIntervalHandle) {
    return;
  }

  clearInterval(backupIntervalHandle);
  backupIntervalHandle = null;
};
