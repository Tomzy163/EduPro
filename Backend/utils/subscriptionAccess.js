import { env } from "../config/env.js";
import School from "../models/School.js";
import User from "../models/User.js";
import {
  normalizeDisplayName,
  normalizeEmail,
  normalizePhoneNumber,
} from "./validation.js";

const COMPLIMENTARY_PLAN = "platinum";
const COMPLIMENTARY_DURATION_YEARS = 10;

const buildComplimentaryExpiry = (from = new Date()) =>
  new Date(
    new Date(from).setUTCFullYear(
      new Date(from).getUTCFullYear() + COMPLIMENTARY_DURATION_YEARS
    )
  );

export const isPlatinumOverrideUser = (user = {}) => {
  const normalizedName = normalizeDisplayName(user?.name).toLowerCase();
  const normalizedEmail = normalizeEmail(user?.email);
  const normalizedPhone = normalizePhoneNumber(user?.phoneNumber);

  return (
    normalizedName === env.platinumOverrideName.toLowerCase() &&
    normalizedEmail === env.platinumOverrideEmail &&
    normalizedPhone === env.platinumOverridePhone
  );
};

export const applyPrivilegedPlatinumAccess = async ({ school, user }) => {
  if (!school || !user || !isPlatinumOverrideUser(user)) {
    return false;
  }

  const now = new Date();
  const nextExpiry = buildComplimentaryExpiry(now);
  const currentExpiry = school.subscriptionEndsAt
    ? new Date(school.subscriptionEndsAt)
    : null;
  const needsUpgrade =
    school.currentPlan !== COMPLIMENTARY_PLAN ||
    school.subscriptionStatus !== "active" ||
    !currentExpiry ||
    currentExpiry < nextExpiry;

  if (!needsUpgrade) {
    return false;
  }

  school.currentPlan = COMPLIMENTARY_PLAN;
  school.subscriptionStatus = "active";
  school.subscriptionStartedAt = now;
  school.subscriptionEndsAt = nextExpiry;
  school.subscribedAt = now;
  school.trialStartedAt = now;
  school.trialEndsAt = now;
  await school.save();

  return true;
};

export const initializeSchoolSubscriptionState = async ({ school, admin }) => {
  if (!school) {
    return false;
  }

  if (isPlatinumOverrideUser(admin)) {
    await applyPrivilegedPlatinumAccess({ school, user: admin });
    return true;
  }

  const now = new Date();

  school.currentPlan = "trial";
  school.subscriptionStatus = "expired";
  school.trialStartedAt = now;
  school.trialEndsAt = now;
  school.subscriptionStartedAt = null;
  school.subscriptionEndsAt = null;
  school.subscribedAt = null;
  await school.save();

  return false;
};

export const syncComplimentarySubscriptionOverrides = async () => {
  const admins = await User.find({ role: "admin" }).select(
    "_id name email phoneNumber school"
  );
  let updatedSchools = 0;

  for (const admin of admins) {
    if (!isPlatinumOverrideUser(admin)) {
      continue;
    }

    const school = await School.findById(admin.school);
    const upgraded = await applyPrivilegedPlatinumAccess({
      school,
      user: admin,
    });

    if (upgraded) {
      updatedSchools += 1;
    }
  }

  return updatedSchools;
};
