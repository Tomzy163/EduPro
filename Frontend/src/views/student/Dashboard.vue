<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Chart from "chart.js/auto";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "@/components/Navbar.vue";
import Notifications from "@/components/Notifications.vue";
import PerformanceChart from "@/components/PerformanceChart.vue";
import AttendanceChart from "@/components/AttendanceChart.vue";
import UserTimetable from "@/components/UserTimetable.vue";
import { getStudentResults } from "@/services/resultService";
import { getAttendance } from "@/services/attendanceService";
import socket from "@/socket";

const results = ref([]);
const attendance = ref([]);
const search = ref("");
const filterGrade = ref("");
const chartCanvas = ref(null);

let trendChart = null;

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

const filteredResults = computed(() =>
  results.value.filter((result) => {
    const courseName = result.course?.name?.toLowerCase() || "";
    const matchesSearch = courseName.includes(search.value.trim().toLowerCase());
    const matchesGrade = !filterGrade.value || result.grade === filterGrade.value;
    return matchesSearch && matchesGrade;
  })
);

const averageScore = computed(() => {
  if (!results.value.length) return 0;

  const total = results.value.reduce(
    (sum, result) => sum + Number(result.score || 0),
    0
  );

  return Math.round(total / results.value.length);
});

const gpa = computed(() => {
  if (!results.value.length) return "0.00";

  const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  const total = results.value.reduce(
    (sum, result) => sum + (gradePoints[result.grade] ?? 0),
    0
  );

  return (total / results.value.length).toFixed(2);
});

const rankings = computed(() =>
  [...results.value].sort((a, b) => b.score - a.score).slice(0, 5)
);

const attendanceCount = computed(() => attendance.value.length);

const strongestSubject = computed(() => {
  if (!results.value.length) return null;
  return [...results.value].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0];
});

const supportSubject = computed(() => {
  if (!results.value.length) return null;
  return [...results.value].sort((a, b) => Number(a.score || 0) - Number(b.score || 0))[0];
});

const remark = computed(() => {
  if (averageScore.value >= 80) return "Excellent performance";
  if (averageScore.value >= 60) return "Good performance";
  if (averageScore.value >= 50) return "Fair performance";
  return "Needs improvement";
});

const formatDate = (date) => new Date(date).toLocaleDateString();

const getGradeClass = (grade) => {
  if (grade === "A") return "success";
  if (grade === "B") return "primary";
  if (grade === "C") return "warning";
  return "danger";
};

const renderTrendChart = () => {
  if (!chartCanvas.value) return;

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      labels: results.value.map((result) =>
        formatDate(result.createdAt || new Date())
      ),
      datasets: [
        {
          label: "Performance Trend",
          data: results.value.map((result) => Number(result.score || 0)),
          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.15)",
          borderWidth: 3,
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

const fetchData = async () => {
  if (!user?._id) return;

  try {
    results.value = await getStudentResults(user._id);
    attendance.value = await getAttendance(user._id);
  } catch (error) {
    console.error("Failed to load student dashboard data:", error);
  }
};

const downloadReportCard = () => {
  const doc = new jsPDF();
  const schoolName =
    school?.name || user?.school || "EduPro International School";

  doc.setFontSize(20);
  doc.text(schoolName, 14, 18);
  doc.setFontSize(14);
  doc.text("Student Report Card", 14, 28);
  doc.setFontSize(11);
  doc.text(`Student: ${user.name || "Student"}`, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 45);

  autoTable(doc, {
    startY: 52,
    head: [["Course", "Score", "Grade"]],
    body: results.value.map((result) => [
      result.course?.name || "Untitled Course",
      result.score ?? "-",
      result.grade ?? "-",
    ]),
  });

  const finalY = doc.lastAutoTable?.finalY || 70;
  doc.text(`Average Score: ${averageScore.value}`, 14, finalY + 12);
  doc.text(`GPA: ${gpa.value}`, 14, finalY + 20);
  doc.text(`Remark: ${remark.value}`, 14, finalY + 28);
  doc.save("report-card.pdf");
};

const handleIncomingMessage = async () => {
  await fetchData();
};

const handleDataUpdate = async () => {
  await fetchData();
};

watch(results, renderTrendChart, { deep: true });

onMounted(async () => {
  await fetchData();
  renderTrendChart();
  socket.on("newMessage", handleIncomingMessage);
  socket.on("admin:update", handleDataUpdate);
  socket.on("academic:update", handleDataUpdate);
});

onUnmounted(() => {
  socket.off("newMessage", handleIncomingMessage);
  socket.off("admin:update", handleDataUpdate);
  socket.off("academic:update", handleDataUpdate);
  if (trendChart) {
    trendChart.destroy();
    trendChart = null;
  }
});
</script>

<template>
  <Navbar />

  <div class="dashboard student-dashboard">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">Student Dashboard</h1>
        <p class="page-subtitle">
          Track academic progress, attendance, and timetable in a cleaner report view.
        </p>
      </div>
      <button @click="downloadReportCard" class="btn btn-success">
        Download Report Card
      </button>
    </header>

    <Notifications />

    <section class="grid-3">
      <div class="stat-card accent-teal">
        <p>Average Score</p>
        <h3>{{ averageScore }}</h3>
      </div>
      <div class="stat-card accent-gold">
        <p>GPA</p>
        <h3>{{ gpa }}</h3>
      </div>
      <div class="stat-card accent-slate">
        <p>Attendance Records</p>
        <h3>{{ attendanceCount }}</h3>
      </div>
    </section>

    <section class="card panel">
      <div class="section-head">
        <div>
          <h2 class="section-title">Performance Trend</h2>
          <p class="section-copy">A quick look at how your recent scores are moving over time.</p>
        </div>
        <div class="remark-pill">{{ remark }}</div>
      </div>
      <div class="chart-frame">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </section>

    <section class="grid-2">
      <div class="card panel">
        <h2 class="section-title">Academic Standing</h2>
        <div class="insight-grid">
          <article class="insight-card">
            <span>Strongest Subject</span>
            <strong>{{ strongestSubject?.course?.name || "No data yet" }}</strong>
            <p>
              Score:
              {{ strongestSubject?.score ?? "-" }}
            </p>
          </article>
          <article class="insight-card caution">
            <span>Needs Attention</span>
            <strong>{{ supportSubject?.course?.name || "No data yet" }}</strong>
            <p>
              Score:
              {{ supportSubject?.score ?? "-" }}
            </p>
          </article>
        </div>
      </div>

      <div class="card panel">
        <h2 class="section-title">Top Performance</h2>
        <ul class="ranking">
          <li v-for="(result, index) in rankings" :key="result._id">
            <span class="rank-index">#{{ index + 1 }}</span>
            <span class="rank-course">{{ result.course?.name }}</span>
            <strong>{{ result.score }}</strong>
          </li>
        </ul>
      </div>

      <div class="card panel">
        <h2 class="section-title">My Timetable</h2>
        <UserTimetable />
      </div>
    </section>

    <section class="grid-2">
      <div class="card panel">
        <h2 class="section-title">Performance Overview</h2>
        <PerformanceChart :results="results" />
      </div>

      <div class="card panel">
        <h2 class="section-title">Attendance Overview</h2>
        <AttendanceChart :attendance="attendance" />
      </div>
    </section>

    <section class="card panel">
      <div class="section-head">
        <div>
          <h2 class="section-title">My Results</h2>
          <p class="section-copy">Filter by subject name or grade to find a record quickly.</p>
        </div>
      </div>

      <div class="row filters">
        <input v-model="search" placeholder="Search course..." class="input" />
        <select v-model="filterGrade" class="input">
          <option value="">All Grades</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="F">F</option>
        </select>
      </div>

      <div v-if="filteredResults.length === 0" class="empty">
        No results found for the current filter.
      </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Score</th>
              <th>Grade</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in filteredResults" :key="result._id">
              <td>{{ result.course?.name || "Untitled Course" }}</td>
              <td>{{ result.score }}</td>
              <td>
                <span class="badge" :class="getGradeClass(result.grade)">
                  {{ result.grade || "-" }}
                </span>
              </td>
              <td>{{ formatDate(result.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.student-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header,
.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.panel {
  padding: 24px;
}

.section-copy {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.chart-frame {
  position: relative;
  min-height: 320px;
}

.remark-pill {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
  font-weight: 700;
}

.insight-grid {
  display: grid;
  gap: 14px;
}

.insight-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(15, 118, 110, 0.08);
}

.insight-card span {
  display: block;
  color: var(--text-soft);
  margin-bottom: 8px;
}

.insight-card strong {
  display: block;
  font-size: 1.1rem;
}

.insight-card p {
  margin: 8px 0 0;
}

.insight-card.caution {
  background: rgba(245, 158, 11, 0.12);
}

.ranking {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ranking li {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.ranking li:last-child {
  border-bottom: none;
}

.rank-index {
  color: var(--text-soft);
  font-weight: 700;
}

.rank-course {
  font-weight: 600;
}

.filters {
  margin-bottom: 18px;
}

.accent-teal {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), #ffffff 80%);
}

.accent-gold {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), #ffffff 80%);
}

.accent-slate {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.14), #ffffff 80%);
}

@media (max-width: 768px) {
  .dashboard-header,
  .section-head {
    flex-direction: column;
  }
}
</style>
