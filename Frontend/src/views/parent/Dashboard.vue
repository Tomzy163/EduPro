<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from "../../services/api";
import { createPayment, getMyPayments } from "../../services/paymentService";
import { getAttendance } from "../../services/attendanceService";
import Navbar from "@/components/Navbar.vue";
import Notifications from "@/components/Notifications.vue";
import ProfileManager from "@/components/ProfileManager.vue";
import SchoolAccountCard from "@/components/SchoolAccountCard.vue";
import socket from "@/socket";
import {
  exportTimetablePdf,
  sortTimetableSlots,
} from "@/utils/timetableExport";

const children = ref([]);
const selectedChild = ref("");
const results = ref([]);
const attendance = ref([]);
const payments = ref([]);
const timetable = ref([]);
const amount = ref("");
const receipt = ref(null);
const fileInputKey = ref(0);
const loading = ref(false);
const statusMessage = ref("");
const statusTone = ref("primary");

const user = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("user")) || {};
  } catch {
    return {};
  }
})();

const school = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("school"));
  } catch {
    return null;
  }
})();

const selectedChildName = computed(() => {
  return children.value.find((child) => child._id === selectedChild.value)?.name || "Selected child";
});

const selectedChildTimetable = computed(() =>
  sortTimetableSlots(
    timetable.value.filter((slot) => slot.student?._id === selectedChild.value)
  )
);

const averageScore = computed(() => {
  if (!results.value.length) {
    return 0;
  }

  const total = results.value.reduce(
    (sum, result) => sum + Number(result.score || 0),
    0
  );

  return Math.round(total / results.value.length);
});

const resultRemark = computed(() => {
  if (averageScore.value >= 80) return "Excellent performance";
  if (averageScore.value >= 60) return "Good performance";
  if (averageScore.value >= 50) return "Fair performance";
  return "Needs improvement";
});

const approvedPayments = computed(() =>
  payments.value.filter((payment) => payment.status === "approved").length
);

const presentAttendanceCount = computed(
  () => attendance.value.filter((record) => record.status === "present").length
);

const showStatus = (message, tone = "primary") => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const fetchChildren = async () => {
  if (!user._id) {
    return;
  }

  const res = await API.get(`/relationships/parent/${user._id}`);
  children.value = res.data?.children || [];

  const stillExists = children.value.some((child) => child._id === selectedChild.value);

  if (!stillExists) {
    selectedChild.value = children.value[0]?._id || "";
  }
};

const fetchPayments = async () => {
  payments.value = await getMyPayments();
};

const fetchTimetable = async () => {
  const res = await API.get("/timetable");
  timetable.value = res.data || [];
};

const getResults = async () => {
  if (!selectedChild.value) {
    results.value = [];
    attendance.value = [];
    return;
  }

  const res = await API.get(`/results/student/${selectedChild.value}`);
  results.value = res.data;
  attendance.value = await getAttendance(selectedChild.value);
};

const refreshDashboard = async () => {
  await fetchChildren();
  await fetchPayments();
  await fetchTimetable();

  if (selectedChild.value) {
    await getResults();
  }
};

const handleFile = (event) => {
  receipt.value = event.target.files[0] || null;
};

const submitPayment = async () => {
  if (!amount.value || !receipt.value) {
    showStatus("Enter an amount and upload a receipt.", "danger");
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    const formData = new FormData();
    formData.append("amount", amount.value);
    formData.append("receipt", receipt.value);

    await createPayment(formData);
    amount.value = "";
    receipt.value = null;
    fileInputKey.value += 1;
    await fetchPayments();
    showStatus("Payment uploaded successfully.", "success");
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to submit payment right now.",
      "danger"
    );
  } finally {
    loading.value = false;
  }
};

const handleMessage = (message) => {
  if (message?.title) {
    alert(message.title);
  }
};

const handleAdminUpdate = async () => {
  await refreshDashboard();
};

const handleAcademicUpdate = async () => {
  if (selectedChild.value) {
    await getResults();
  }
};

const downloadChildResult = () => {
  if (!selectedChild.value || results.value.length === 0) {
    showStatus("Select a child with available results before downloading.", "danger");
    return;
  }

  const doc = new jsPDF();
  const schoolName =
    school?.name || user?.school?.name || user?.school || "EduPro International School";

  doc.setFontSize(20);
  doc.text(schoolName, 14, 18);
  doc.setFontSize(14);
  doc.text("Parent Result Copy", 14, 28);
  doc.setFontSize(11);
  doc.text(`Parent: ${user.name || "Parent"}`, 14, 38);
  doc.text(`Student: ${selectedChildName.value}`, 14, 45);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 52);

  autoTable(doc, {
    startY: 60,
    head: [["Course", "Score", "Grade", "Teacher", "Date"]],
    body: results.value.map((result) => [
      result.course?.name || "Untitled Course",
      result.score ?? "-",
      result.grade ?? "-",
      result.uploadedBy?.name || "Teacher",
      new Date(result.createdAt).toLocaleDateString(),
    ]),
  });

  const finalY = doc.lastAutoTable?.finalY || 80;
  doc.text(`Average Score: ${averageScore.value}`, 14, finalY + 12);
  doc.text(`Remark: ${resultRemark.value}`, 14, finalY + 20);
  doc.save(`${selectedChildName.value.replace(/\s+/g, "-").toLowerCase()}-result.pdf`);
};

const downloadSelectedTimetablePdf = () => {
  if (!selectedChild.value || selectedChildTimetable.value.length === 0) {
    showStatus("Select a child with timetable records before downloading.", "danger");
    return;
  }

  exportTimetablePdf({
    slots: selectedChildTimetable.value,
    schoolName: school?.name || user?.school || "EduPro School",
    title: `${selectedChildName.value} Timetable`,
    subtitle: `Parent copy generated for ${user.name || "Parent"}`,
    fileName: `${selectedChildName.value.replace(/\s+/g, "-").toLowerCase()}-timetable.pdf`,
  });
};

const downloadAllTimetables = () => {
  if (!timetable.value.length) {
    showStatus("No linked student timetable is available yet.", "danger");
    return;
  }

  exportTimetablePdf({
    slots: timetable.value,
    schoolName: school?.name || user?.school || "EduPro School",
    title: "All Linked Children Timetables",
    subtitle: `Parent copy generated for ${user.name || "Parent"}`,
    fileName: `${(user.name || "parent").replace(/\s+/g, "-").toLowerCase()}-children-timetables.pdf`,
  });
};

onMounted(async () => {
  try {
    await refreshDashboard();
  } catch (error) {
    console.error("Failed to load parent dashboard:", error);
    showStatus("Unable to load parent dashboard data.", "danger");
  }

  socket.on("newMessage", handleMessage);
  socket.on("admin:update", handleAdminUpdate);
  socket.on("academic:update", handleAcademicUpdate);
});

onUnmounted(() => {
  socket.off("newMessage", handleMessage);
  socket.off("admin:update", handleAdminUpdate);
  socket.off("academic:update", handleAcademicUpdate);
});
</script>

<template>
  <Navbar />

  <div class="dashboard parent-dashboard">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">Parent Dashboard</h1>
        <p class="page-subtitle">
          Review your children, track result history, and monitor every payment submitted.
        </p>
      </div>
    </header>

    <Notifications />
    <ProfileManager />

    <div v-if="statusMessage" class="status-banner" :class="`status-${statusTone}`">
      {{ statusMessage }}
    </div>

    <section class="grid-3 parent-summary">
      <article class="stat-card accent-slate">
        <p>Linked Children</p>
        <h3>{{ children.length }}</h3>
      </article>
      <article class="stat-card accent-teal">
        <p>Result Records</p>
        <h3>{{ results.length }}</h3>
      </article>
      <article class="stat-card accent-gold">
        <p>Approved Payments</p>
        <h3>{{ approvedPayments }}</h3>
      </article>
      <article class="stat-card accent-teal">
        <p>Attendance Records</p>
        <h3>{{ attendance.length }}</h3>
      </article>
      <article class="stat-card accent-slate">
        <p>Present Days</p>
        <h3>{{ presentAttendanceCount }}</h3>
      </article>
    </section>

    <SchoolAccountCard
      :school="school"
      title="School Fee Account"
      subtitle="Use these admin-approved account details when making school-fee payments."
    />

    <section class="card panel">
      <div class="section-head">
        <div>
          <h2 class="section-title">Child Result History</h2>
          <p class="section-copy">
            Switch between linked children and view the full academic record uploaded so far.
          </p>
        </div>
        <div class="result-toolbar">
          <select v-model="selectedChild" @change="getResults" class="input child-select">
            <option disabled value="">Select Child</option>
            <option v-for="child in children" :key="child._id" :value="child._id">
              {{ child.name }}
            </option>
          </select>
          <button
            @click="downloadChildResult"
            class="btn btn-success"
            :disabled="!selectedChild || results.length === 0"
          >
            Download Result
          </button>
        </div>
      </div>

      <div v-if="!selectedChild" class="empty">
        No child is selected yet. Link a child from the admin dashboard to start viewing records.
      </div>

      <div v-else-if="results.length === 0" class="empty">
        No results have been uploaded yet for {{ selectedChildName }}.
      </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Score</th>
              <th>Grade</th>
              <th>Teacher</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in results" :key="result._id">
              <td>{{ result.course?.name || "Course" }}</td>
              <td>{{ result.score }}</td>
              <td>{{ result.grade }}</td>
              <td>{{ result.uploadedBy?.name || "Teacher" }}</td>
              <td>{{ new Date(result.createdAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card panel">
      <div class="section-head">
        <div>
          <h2 class="section-title">Child Timetable</h2>
          <p class="section-copy">
            Review the timetable assigned to the child selected above and export one timetable or every linked child timetable.
          </p>
        </div>

        <div class="result-toolbar timetable-toolbar">
          <button
            @click="downloadSelectedTimetablePdf"
            class="btn btn-primary"
            :disabled="!selectedChild || selectedChildTimetable.length === 0"
          >
            Download Selected Timetable
          </button>
          <button
            @click="downloadAllTimetables"
            class="btn btn-success"
            :disabled="timetable.length === 0"
          >
            Download All Timetables
          </button>
        </div>
      </div>

      <div v-if="!selectedChild" class="empty">
        Select a child above to view the assigned timetable.
      </div>

      <div v-else-if="selectedChildTimetable.length === 0" class="empty">
        No timetable has been assigned yet for {{ selectedChildName }}.
      </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Timetable</th>
              <th>Course</th>
              <th>Day</th>
              <th>Time</th>
              <th>Location</th>
              <th>Teacher</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in selectedChildTimetable" :key="slot._id">
              <td>{{ slot.name || "Timetable" }}</td>
              <td>{{ slot.course?.name || "Course" }}</td>
              <td>{{ slot.day }}</td>
              <td>{{ slot.time }}</td>
              <td>{{ slot.location || "-" }}</td>
              <td>{{ slot.teacher?.name || "Teacher" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid-2 parent-grid">
      <section class="card panel">
        <div class="section-head compact">
          <div>
            <h2 class="section-title">Attendance History</h2>
            <p class="section-copy">
              Review the selected child&apos;s daily attendance records and class presence.
            </p>
          </div>
        </div>

        <div v-if="!selectedChild" class="empty">
          Select a child to review attendance.
        </div>

        <div v-else-if="attendance.length === 0" class="empty">
          No attendance records have been added yet for {{ selectedChildName }}.
        </div>

        <div v-else class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in attendance" :key="record._id">
                <td>{{ record.course?.name || "Course" }}</td>
                <td>
                  <span class="badge" :class="record.status || 'pending'">
                    {{ record.status || "-" }}
                  </span>
                </td>
                <td>{{ new Date(record.date || record.createdAt).toLocaleDateString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card panel">
        <div class="section-head compact">
          <div>
            <h2 class="section-title">Make Payment</h2>
            <p class="section-copy">
              Upload a new payment receipt for review by the school admin.
            </p>
          </div>
        </div>

        <div class="form-grid">
          <input v-model="amount" placeholder="Amount" type="number" class="input" />
          <input :key="fileInputKey" type="file" @change="handleFile" class="input" />
        </div>

        <button @click="submitPayment" class="btn btn-primary" :disabled="loading">
          {{ loading ? "Uploading..." : "Upload Receipt" }}
        </button>
      </section>

      <section class="card panel">
        <div class="section-head compact">
          <div>
            <h2 class="section-title">Payment History</h2>
            <p class="section-copy">
              Track pending, approved, and rejected payment submissions in one place.
            </p>
          </div>
        </div>

        <div v-if="payments.length === 0" class="empty">
          No payment history yet.
        </div>

        <div v-else class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in payments" :key="payment._id">
                <td>{{ Number(payment.amount || 0).toLocaleString() }}</td>
                <td>
                  <span class="badge" :class="payment.status || 'pending'">
                    {{ payment.status || "pending" }}
                  </span>
                </td>
                <td>{{ payment.receipt ? "Uploaded" : "No file" }}</td>
                <td>{{ new Date(payment.createdAt).toLocaleDateString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </div>
</template>

<style scoped>
.parent-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.parent-summary {
  gap: 16px;
}

.parent-grid {
  gap: 20px;
}

.panel {
  padding: 24px;
}

.child-select {
  min-width: 220px;
}

.result-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.timetable-toolbar {
  justify-content: flex-end;
}

.status-banner {
  padding: 12px 16px;
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

.compact {
  margin-bottom: 18px;
}

.badge.pending {
  background: rgba(217, 119, 6, 0.14);
  color: #92400e;
}

.badge.approved {
  background: rgba(21, 128, 61, 0.14);
  color: #166534;
}

.badge.rejected {
  background: rgba(220, 38, 38, 0.14);
  color: #991b1b;
}

@media (max-width: 768px) {
  .dashboard-header,
  .section-head,
  .result-toolbar {
    flex-direction: column;
  }

  .child-select {
    width: 100%;
    min-width: 0;
  }
}
</style>
