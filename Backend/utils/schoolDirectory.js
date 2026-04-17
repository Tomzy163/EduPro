import School from "../models/School.js";
import User from "../models/User.js";
import {
  escapeRegex,
  generateSchoolCodeCandidate,
  normalizeSchoolAliases,
  normalizeSchoolCode,
  normalizeSchoolName,
} from "./schoolIdentity.js";

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

export const generateUniqueSchoolCode = async (schoolName = "") => {
  let schoolCode = "";

  do {
    schoolCode = generateSchoolCodeCandidate(schoolName);
  } while (await School.exists({ schoolCode }));

  return schoolCode;
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
      school.schoolCode = await generateUniqueSchoolCode(school.name);
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
