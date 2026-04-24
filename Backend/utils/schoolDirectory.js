import fs from "fs/promises";
import path from "path";
import School from "../models/School.js";
import User from "../models/User.js";
import {
  escapeRegex,
  generateSchoolCodeCandidate,
  generateStableSchoolCodeCandidate,
  normalizeSchoolAliases,
  normalizeSchoolCode,
  normalizeSchoolName,
} from "./schoolIdentity.js";

const LATEST_BACKUP_PATH = path.resolve(process.cwd(), "backups", "mongo", "latest.json");

const buildIdentifierQuery = (identifier = "") => {
  const trimmedIdentifier = String(identifier || "").trim().replace(/\s+/g, " ");

  if (!trimmedIdentifier) {
    return null;
  }

  const normalizedName = normalizeSchoolName(trimmedIdentifier);
  const normalizedCode = normalizeSchoolCode(trimmedIdentifier);

  return {
    $or: [
      { schoolCode: normalizedCode },
      { normalizedName },
      { aliasesNormalized: normalizedName },
      {
        name: {
          $regex: `^${escapeRegex(trimmedIdentifier)}$`,
          $options: "i",
        },
      },
    ],
  };
};

export const findSchoolByIdentifier = async (identifier = "") => {
  const query = buildIdentifierQuery(identifier);

  if (!query) {
    return null;
  }

  return School.findOne(query);
};

const findLatestBackupSchoolCode = async ({ schoolId = "", schoolName = "" } = {}) => {
  try {
    const raw = await fs.readFile(LATEST_BACKUP_PATH, "utf8");
    const backup = JSON.parse(raw);
    const schools = Array.isArray(backup?.data?.schools) ? backup.data.schools : [];
    const normalizedName = normalizeSchoolName(schoolName);

    const matchedSchool = schools.find((entry) => {
      const backupSchoolId = String(entry?._id || "").trim();
      const backupNormalizedName = normalizeSchoolName(
        entry?.normalizedName || entry?.name || ""
      );
      const backupAliases = Array.isArray(entry?.aliasesNormalized)
        ? entry.aliasesNormalized.map((alias) => normalizeSchoolName(alias))
        : [];

      return (
        (schoolId && backupSchoolId === String(schoolId)) ||
        backupNormalizedName === normalizedName ||
        backupAliases.includes(normalizedName)
      );
    });

    return normalizeSchoolCode(matchedSchool?.schoolCode || "");
  } catch {
    return "";
  }
};

export const generateUniqueSchoolCode = async (
  schoolName = "",
  { seed = "", preferredCode = "", excludeSchoolId = "" } = {}
) => {
  const normalizedPreferredCode = normalizeSchoolCode(preferredCode);

  if (normalizedPreferredCode) {
    const existingSchool = await School.findOne({
      schoolCode: normalizedPreferredCode,
    }).select("_id");

    if (
      !existingSchool ||
      String(existingSchool._id) === String(excludeSchoolId || "")
    ) {
      return normalizedPreferredCode;
    }
  }

  let attempt = 0;

  while (true) {
    const schoolCode = seed
      ? generateStableSchoolCodeCandidate(schoolName, `${seed}:${attempt}`)
      : generateSchoolCodeCandidate(schoolName);
    const existingSchool = await School.findOne({ schoolCode }).select("_id");

    if (
      !existingSchool ||
      String(existingSchool._id) === String(excludeSchoolId || "")
    ) {
      return schoolCode;
    }

    attempt += 1;
  }
};

export const appendSchoolAlias = (school, alias = "") => {
  const aliases = normalizeSchoolAliases([...(school.aliases || []), alias], school.name);
  school.aliases = aliases;
  school.aliasesNormalized = aliases.map((value) => normalizeSchoolName(value));
};

export const ensureSchoolIdentityBackfill = async () => {
  const schools = await School.find();
  let updatedCount = 0;

  for (const school of schools) {
    let changed = false;

    const normalizedName = normalizeSchoolName(school.name);
    if (school.normalizedName !== normalizedName) {
      school.normalizedName = normalizedName;
      changed = true;
    }

    if (!school.schoolCode) {
      const backupSchoolCode = await findLatestBackupSchoolCode({
        schoolId: school._id,
        schoolName: school.name,
      });

      school.schoolCode = await generateUniqueSchoolCode(school.name, {
        seed: school._id.toString(),
        preferredCode: backupSchoolCode,
        excludeSchoolId: school._id,
      });
      changed = true;
    }

    const aliases = normalizeSchoolAliases(school.aliases || [], school.name);
    const aliasesNormalized = aliases.map((value) => normalizeSchoolName(value));
    const aliasesChanged =
      JSON.stringify(aliases) !== JSON.stringify(school.aliases || []) ||
      JSON.stringify(aliasesNormalized) !==
        JSON.stringify(school.aliasesNormalized || []);

    if (aliasesChanged) {
      school.aliases = aliases;
      school.aliasesNormalized = aliasesNormalized;
      changed = true;
    }

    if (changed) {
      await school.save();
      updatedCount += 1;
    }
  }

  return updatedCount;
};

export const resolveSchoolForLogin = async ({
  schoolIdentifier = "",
  email = "",
} = {}) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const trimmedIdentifier = String(schoolIdentifier || "").trim();

  if (trimmedIdentifier) {
    const school = await findSchoolByIdentifier(trimmedIdentifier);

    if (school) {
      return {
        school,
        resolvedBy: "identifier",
      };
    }

    return {
      school: null,
      resolvedBy: "identifier-not-found",
    };
  }

  if (!normalizedEmail) {
    return {
      school: null,
      resolvedBy: "none",
    };
  }

  const schoolIds = await User.find({ email: normalizedEmail }).distinct("school");

  if (schoolIds.length === 1) {
    const school = await School.findById(schoolIds[0]);

    if (school) {
      return {
        school,
        resolvedBy: "email",
      };
    }
  }

  if (schoolIds.length > 1 && !trimmedIdentifier) {
    return {
      school: null,
      resolvedBy: "ambiguous-email",
      needsSchoolIdentifier: true,
    };
  }

  return {
    school: null,
    resolvedBy: "not-found",
  };
};
