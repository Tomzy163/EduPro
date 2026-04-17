import mongoose from "mongoose";
import {
  normalizeSchoolAliases,
  normalizeSchoolCode,
  normalizeSchoolName,
} from "../utils/schoolIdentity.js";

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      trim: true,
      default: "",
    },
    schoolCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    aliases: {
      type: [String],
      default: [],
    },
    aliasesNormalized: {
      type: [String],
      default: [],
    },
    currentPlan: {
      type: String,
      enum: ["trial", "normal", "supreme", "gold", "platinum"],
      default: "trial",
    },
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "expired"],
      default: "trial",
    },
    trialStartedAt: {
      type: Date,
      default: Date.now,
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    subscriptionStartedAt: {
      type: Date,
      default: null,
    },
    subscriptionEndsAt: {
      type: Date,
      default: null,
    },
    subscribedAt: {
      type: Date,
      default: null,
    },
    bankName: {
      type: String,
      default: "",
      trim: true,
    },
    accountName: {
      type: String,
      default: "",
      trim: true,
    },
    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },
    paymentInstructions: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

schoolSchema.pre("validate", function syncSchoolIdentity() {
  this.name = String(this.name || "").trim().replace(/\s+/g, " ");
  this.normalizedName = normalizeSchoolName(this.name);
  this.schoolCode = normalizeSchoolCode(this.schoolCode);
  this.aliases = normalizeSchoolAliases(this.aliases || [], this.name);
  this.aliasesNormalized = this.aliases.map((alias) => normalizeSchoolName(alias));
});

schoolSchema.index({ currentPlan: 1, subscriptionStatus: 1 });
schoolSchema.index({ normalizedName: 1 }, { unique: true, sparse: true });
schoolSchema.index({ schoolCode: 1 }, { unique: true, sparse: true });
schoolSchema.index({ aliasesNormalized: 1 });

const School = mongoose.model("School", schoolSchema);

export default School;
