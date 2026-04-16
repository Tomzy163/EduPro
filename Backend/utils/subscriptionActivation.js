import Payment from "../models/Payment.js";
import School from "../models/School.js";
import User from "../models/User.js";
import { sendEmail } from "./mailer.js";
import { sendSms } from "./sms.js";
import {
  SUBSCRIPTION_PLANS,
  getSubscriptionDurationDays,
  getSubscriptionSnapshot,
} from "./subscription.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const validPlans = new Set(["normal", "supreme", "gold", "platinum"]);

export const isValidSubscriptionPlan = (plan) => validPlans.has(plan);

export const activateSubscriptionFromPayment = async ({
  schoolId,
  userId,
  plan,
  amount,
  reference,
  currency = "NGN",
  gateway = "paystack",
  gatewayStatus = "success",
  status = "success",
  metadata = null,
  customerEmail = "",
  paidAt = new Date(),
  channel = "",
  webhookEvent = "charge.success",
}) => {
  if (!schoolId) {
    throw new Error("School is required for subscription activation.");
  }

  if (!isValidSubscriptionPlan(plan)) {
    throw new Error("A valid subscription plan is required.");
  }

  const school = await School.findById(schoolId);

  if (!school) {
    throw new Error("School not found for this subscription payment.");
  }

  let payment = reference
    ? await Payment.findOne({ reference, school: school._id })
    : null;

  const contactUser =
    (userId &&
      (await User.findOne({
        _id: userId,
        school: school._id,
      }).select("name email phoneNumber role"))) ||
    (await User.findOne({
      school: school._id,
      role: "admin",
    }).select("name email phoneNumber role"));

  const now = new Date();
  const activeUntil = school.subscriptionEndsAt
    ? new Date(school.subscriptionEndsAt)
    : null;
  const alreadyActiveOnPlan =
    school.subscriptionStatus === "active" &&
    school.currentPlan === plan &&
    activeUntil &&
    activeUntil > now;
  const alreadyProcessed =
    payment?.status === "success" && payment?.activatedSubscription;
  const shouldActivate = !alreadyProcessed && !alreadyActiveOnPlan;
  const normalizedAmount =
    Number(amount) || Number(SUBSCRIPTION_PLANS[plan]?.price) || 0;

  if (!payment) {
    payment = new Payment({
      school: school._id,
      user: contactUser?._id || userId || null,
      amount: normalizedAmount,
      currency,
      reference: reference || null,
      gateway,
      type: "subscription",
      plan,
      description: `${SUBSCRIPTION_PLANS[plan]?.name || plan} subscription`,
    });
  }

  payment.user = payment.user || contactUser?._id || userId || null;
  payment.amount = normalizedAmount;
  payment.currency = currency;
  payment.gateway = gateway;
  payment.gatewayStatus = gatewayStatus;
  payment.status = status;
  payment.plan = plan;
  payment.customerEmail = customerEmail || payment.customerEmail || "";
  payment.channel = channel || payment.channel || "";
  payment.metadata = metadata;
  payment.webhookEvent = webhookEvent;
  payment.confirmedAt = status === "success" ? now : payment.confirmedAt;
  payment.paidAt = paidAt || payment.paidAt || now;
  payment.activatedSubscription = shouldActivate && status === "success";
  payment.activationSkipped = !shouldActivate;
  payment.failureReason = shouldActivate
    ? ""
    : alreadyProcessed
      ? "Payment was already processed earlier."
      : "Subscription is already active on this plan.";

  if (shouldActivate && status === "success") {
    const durationMs = getSubscriptionDurationDays() * DAY_IN_MS;
    const nextExpiry = new Date(now.getTime() + durationMs);

    school.currentPlan = plan;
    school.subscriptionStatus = "active";
    school.subscriptionStartedAt = now;
    school.subscriptionEndsAt = nextExpiry;
    school.subscribedAt = now;

    await school.save();
  }

  await payment.save();

  const subscription = getSubscriptionSnapshot(school);

  if (shouldActivate && contactUser?.email) {
    try {
      await sendEmail({
        to: contactUser.email,
        subject: "EduPro subscription activated",
        text: `Hello ${contactUser.name}, your ${SUBSCRIPTION_PLANS[plan]?.name || plan} plan is active until ${new Date(subscription.subscriptionEndsAt).toLocaleDateString()}.`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
            <h2>Subscription Activated</h2>
            <p>Hello ${contactUser.name},</p>
            <p>Your <strong>${SUBSCRIPTION_PLANS[plan]?.name || plan}</strong> subscription for <strong>${school.name}</strong> is now active.</p>
            <p>Expiry date: <strong>${new Date(subscription.subscriptionEndsAt).toLocaleDateString()}</strong></p>
            <p>Reference: <strong>${reference || "N/A"}</strong></p>
          </div>
        `,
      });
    } catch (error) {
      console.error("SUBSCRIPTION ACTIVATION EMAIL ERROR:", error);
    }
  }

  if (shouldActivate && contactUser?.phoneNumber) {
    try {
      await sendSms({
        to: contactUser.phoneNumber,
        body: `EduPro: ${SUBSCRIPTION_PLANS[plan]?.name || plan} is active for ${school.name} until ${new Date(subscription.subscriptionEndsAt).toLocaleDateString()}.`,
      });
    } catch (error) {
      console.error("SUBSCRIPTION ACTIVATION SMS ERROR:", error);
    }
  }

  return {
    payment,
    school,
    subscription,
    activated: shouldActivate,
    skippedReason: shouldActivate ? "" : payment.failureReason,
  };
};
