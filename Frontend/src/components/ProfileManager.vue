<script setup>
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "@/store/authStore";
import { getMyProfile, updateMyProfile } from "@/services/userService";

const auth = useAuthStore();

const profile = ref({
  name: "",
  email: "",
  phoneNumber: "",
});
const loading = ref(false);
const message = ref("");
const tone = ref("primary");
const loginCode = computed(
  () => auth.school?.code || auth.user?.schoolCode || ""
);

const loadProfile = async () => {
  const data = await getMyProfile();
  profile.value = {
    name: data.name || "",
    email: data.email || "",
    phoneNumber: data.phoneNumber || "",
  };
};

const saveProfile = async () => {
  loading.value = true;
  message.value = "";

  try {
    const updated = await updateMyProfile(profile.value);
    auth.updateUserProfile(updated);
    profile.value = {
      name: updated.name || "",
      email: updated.email || "",
      phoneNumber: updated.phoneNumber || "",
    };
    tone.value = "success";
    message.value = "Profile updated successfully.";
  } catch (error) {
    tone.value = "danger";
    message.value = error.response?.data?.message || "Unable to update profile.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadProfile);
</script>

<template>
  <section class="card profile-card">
    <div class="section-head">
      <div>
        <p class="eyebrow">Profile Management</p>
        <h2 class="section-title">My Contact Details</h2>
        <p class="section-copy">
          Keep your name, email address, and phone number up to date for resets and notifications.
        </p>
        <p v-if="auth.user?.role === 'admin' && loginCode" class="login-code-note">
          School login code: <strong>{{ loginCode }}</strong>
        </p>
      </div>
    </div>

    <p v-if="message" class="status-banner" :class="`status-${tone}`">
      {{ message }}
    </p>

    <div class="form-grid">
      <input v-model="profile.name" class="input" placeholder="Full name" />
      <input v-model="profile.email" class="input" type="email" placeholder="Email address" />
      <input v-model="profile.phoneNumber" class="input" placeholder="Phone number" />
      <button @click="saveProfile" class="btn btn-primary" :disabled="loading">
        {{ loading ? "Saving..." : "Save Profile" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.profile-card {
  padding: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-copy {
  margin: 8px 0 0;
  color: var(--text-soft);
}

.login-code-note {
  margin: 12px 0 0;
  color: #0f766e;
  font-weight: 700;
}

.status-banner {
  margin: 16px 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 600;
}

.status-success {
  background: rgba(21, 128, 61, 0.12);
  color: #166534;
}

.status-danger {
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
}

.status-primary {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}
</style>
