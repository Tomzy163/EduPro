<script setup>
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { createCourse, getCourses } from "@/services/courseService";
import { apiBaseUrl } from "@/services/runtimeConfig";
import {
  getMySchool,
  updateMySchool,
  uploadSchoolLogo,
} from "@/services/schoolService";

const auth = useAuthStore();
const ui = useUiStore();
const courses = ref([]);
const schoolProfile = ref({
  code: "",
  name: "",
  logo: "",
  portalName: "",
  primaryColor: "#0f766e",
  accentColor: "#1d4ed8",
  bankName: "",
  accountName: "",
  accountNumber: "",
  paymentInstructions: "",
});

const courseName = ref("");
const courseTerm = ref("First Term");
const loading = ref(false);
const profileLoading = ref(false);
const logoLoading = ref(false);
const logoFile = ref(null);
const statusMessage = ref("");
const statusTone = ref("primary");

const logoPreview = computed(() => {
  if (!schoolProfile.value.logo) {
    return "";
  }

  return schoolProfile.value.logo.startsWith("http")
    ? schoolProfile.value.logo
    : `${apiBaseUrl.replace(/\/api$/, "")}/${schoolProfile.value.logo.replace(/^\/+/, "")}`;
});

const fetchData = async () => {
  const [courseData, schoolData] = await Promise.all([
    getCourses(),
    getMySchool(),
  ]);

  courses.value = courseData;
  schoolProfile.value = {
    code: schoolData.school?.code || "",
    name: schoolData.school?.name || "",
    logo: schoolData.school?.logo || "",
    portalName: schoolData.school?.portalName || "",
    primaryColor: schoolData.school?.primaryColor || "#0f766e",
    accentColor: schoolData.school?.accentColor || "#1d4ed8",
    bankName: schoolData.school?.bankName || "",
    accountName: schoolData.school?.accountName || "",
    accountNumber: schoolData.school?.accountNumber || "",
    paymentInstructions: schoolData.school?.paymentInstructions || "",
  };
};

const handleSaveSchoolProfile = async () => {
  if (!schoolProfile.value.name.trim()) {
    ui.pushToast({
      title: "Missing school name",
      message: "Enter a school name before saving.",
      tone: "error",
    });
    return;
  }

  profileLoading.value = true;
  statusMessage.value = "";

  try {
    const response = await updateMySchool({
      name: schoolProfile.value.name,
      portalName: schoolProfile.value.portalName,
      primaryColor: schoolProfile.value.primaryColor,
      accentColor: schoolProfile.value.accentColor,
      bankName: schoolProfile.value.bankName,
      accountName: schoolProfile.value.accountName,
      accountNumber: schoolProfile.value.accountNumber,
      paymentInstructions: schoolProfile.value.paymentInstructions,
    });

    schoolProfile.value = {
      code: response.school?.code || "",
      name: response.school?.name || "",
      logo: response.school?.logo || schoolProfile.value.logo,
      portalName: response.school?.portalName || "",
      primaryColor: response.school?.primaryColor || "#0f766e",
      accentColor: response.school?.accentColor || "#1d4ed8",
      bankName: response.school?.bankName || "",
      accountName: response.school?.accountName || "",
      accountNumber: response.school?.accountNumber || "",
      paymentInstructions: response.school?.paymentInstructions || "",
    };
    auth.updateSchool(response.school);
    statusTone.value = "success";
    statusMessage.value = response.message || "School profile updated successfully.";
  } catch (error) {
    statusTone.value = "danger";
    statusMessage.value =
      error.response?.data?.message || "Failed to update school profile.";
  } finally {
    profileLoading.value = false;
  }
};

const handleLogoChange = (event) => {
  logoFile.value = event.target.files?.[0] || null;
};

const handleUploadLogo = async () => {
  if (!logoFile.value) {
    ui.pushToast({
      title: "Logo required",
      message: "Select a logo image before uploading.",
      tone: "error",
    });
    return;
  }

  logoLoading.value = true;
  statusMessage.value = "";

  try {
    const formData = new FormData();
    formData.append("logo", logoFile.value);
    const response = await uploadSchoolLogo(formData);

    schoolProfile.value.logo = response.school?.logo || "";
    auth.updateSchool(response.school);
    logoFile.value = null;
    statusTone.value = "success";
    statusMessage.value = response.message || "School logo updated successfully.";
  } catch (error) {
    statusTone.value = "danger";
    statusMessage.value =
      error.response?.data?.message || "Failed to upload the school logo.";
  } finally {
    logoLoading.value = false;
  }
};

const handleCreateCourse = async () => {
  if (!courseName.value.trim()) {
    ui.pushToast({
      title: "Course required",
      message: "Enter a course name before creating it.",
      tone: "error",
    });
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    await createCourse({
      name: courseName.value.trim(),
      term: courseTerm.value,
    });

    courseName.value = "";
    courseTerm.value = "First Term";
    statusTone.value = "success";
    statusMessage.value = "Course created successfully.";
    await fetchData();
  } catch (error) {
    statusTone.value = "danger";
    statusMessage.value =
      error.response?.data?.message || "Failed to create course.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <section class="card admin-school-setup">
    <div v-if="statusMessage" class="status-banner" :class="`status-${statusTone}`">
      {{ statusMessage }}
    </div>

    <div class="section-block identity-block">
      <h2 class="section-title">School Identity, Login Code, And Payment Account</h2>
      <p class="section-copy">
        Update the school name, official payment account, and school logo shown across admin, parent, student, and teacher views.
      </p>
      <p v-if="schoolProfile.code" class="identity-note">
        Login code: <strong>{{ schoolProfile.code }}</strong>. Users can sign in with this code even after the school name changes.
      </p>

      <div class="logo-panel">
        <img v-if="logoPreview" :src="logoPreview" alt="School logo" class="logo-preview" />
        <div class="logo-actions">
          <input type="file" accept="image/*" class="input" @change="handleLogoChange" />
          <button @click="handleUploadLogo" class="btn btn-primary" :disabled="logoLoading">
            {{ logoLoading ? "Uploading..." : "Upload School Logo" }}
          </button>
        </div>
      </div>

      <div class="form-grid">
        <input v-model="schoolProfile.name" class="input" placeholder="School name" />
        <input v-model="schoolProfile.portalName" class="input" placeholder="Custom portal name" />
        <input v-model="schoolProfile.primaryColor" class="input" placeholder="Primary color hex" />
        <input v-model="schoolProfile.accentColor" class="input" placeholder="Accent color hex" />
        <input v-model="schoolProfile.bankName" class="input" placeholder="Bank name" />
        <input v-model="schoolProfile.accountName" class="input" placeholder="Account name" />
        <input v-model="schoolProfile.accountNumber" class="input" placeholder="Account number" />
        <textarea
          v-model="schoolProfile.paymentInstructions"
          class="input textarea"
          placeholder="Payment instructions or notes"
        />
        <button @click="handleSaveSchoolProfile" class="btn btn-success" :disabled="profileLoading">
          {{ profileLoading ? "Saving..." : "Save School Details" }}
        </button>
      </div>
    </div>

    <div class="section-block">
      <h2 class="section-title">Course Management</h2>
      <p class="section-copy">
        Create the courses that teachers and students can later be assigned to from the assignment history module.
      </p>

      <div class="form-grid">
        <input
          v-model="courseName"
          class="input"
          placeholder="Course name"
        />

        <select v-model="courseTerm" class="input">
          <option value="First Term">First Term</option>
          <option value="Second Term">Second Term</option>
          <option value="Third Term">Third Term</option>
        </select>

        <button @click="handleCreateCourse" class="btn btn-primary" :disabled="loading">
          {{ loading ? "Saving..." : "Create Course" }}
        </button>
      </div>
    </div>

    <div class="section-block">
      <h3 class="section-title">Available Courses</h3>

      <div v-if="courses.length === 0" class="empty">
        No courses have been created yet.
      </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Term</th>
              <th>Teacher</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in courses" :key="course._id">
              <td>{{ course.name }}</td>
              <td>{{ course.term || "-" }}</td>
              <td>{{ course.teacher?.name || "Unassigned" }}</td>
              <td>
                {{
                  course.students?.length
                    ? course.students.map((student) => student.name).join(", ")
                    : "No students assigned"
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-school-setup {
  padding: 24px;
}

.identity-block {
  padding: 20px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(14, 116, 144, 0.12), transparent 34%),
    linear-gradient(160deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.status-banner {
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 600;
}

.status-success {
  background: rgba(21, 128, 61, 0.1);
  color: #166534;
}

.status-danger {
  background: rgba(220, 38, 38, 0.1);
  color: #991b1b;
}

.status-primary {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.section-block + .section-block {
  margin-top: 24px;
}

.section-copy {
  margin: 6px 0 16px;
  color: var(--text-soft);
}

.identity-note {
  margin: 0 0 16px;
  color: #0f766e;
  font-weight: 600;
}

.logo-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
}

.logo-preview {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #fff;
}

.logo-actions {
  display: grid;
  gap: 10px;
  min-width: min(320px, 100%);
}

.textarea {
  min-height: 110px;
  resize: vertical;
}
</style>
