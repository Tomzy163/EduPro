<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from "vue";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";
import { getStudentResults } from "../../services/resultService";
import { getAttendance } from "../../services/attendanceService";
import PerformanceChart from "../../components/PerformanceChart.vue";
import Navbar from "@/components/Navbar.vue";
import AttendanceChart from "../../components/AttendanceChart.vue";
import Notifications from "../../components/Notifications.vue";
import UserTimetable from "../../components/UserTimetable.vue";
import socket from "@/socket";



const results = ref([]);
const attendance = ref([]);
const user = JSON.parse(sessionStorage.getItem("user"));
let trendChart = null;
const search = ref("");
const filterGrade = ref("");



const filteredResults = computed(() => {
  return results.value.filter(r => {
    const matchesSearch = r.course?.name
      ?.toLowerCase()
      .includes(search.value.toLowerCase());

    const matchesGrade =
      !filterGrade.value || r.grade === filterGrade.value;

    return matchesSearch && matchesGrade;
  });
});

// Fetch results & attendance

const fetchCourses = async () => {
  const allCourses = await getCourses();
  const user = JSON.parse(sessionStorage.getItem("user"));
  courses.value = allCourses.filter(c => c.teacher?._id === user._id);
};
const fetchData = async () => {
  results.value = await getStudentResults(user._id);
  attendance.value = await getAttendance(user._id);
};
const averageScore = computed(() => {
  if (!results.value.length) return 0;

  const total = results.value.reduce((sum, r) => sum + Number(r.score || 0), 0);
  return Math.round(total / results.value.length);
});


const renderTrendChart = () => {
  const ctx = document.getElementById("trendChart");

  const labels = results.value.map(r =>
    new Date(r.createdAt).toLocaleDateString()
  );

  const scores = results.value.map(r => r.score);

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Performance Trend",
          data: scores,
          fill: false,
        },
      ],
    },
  });
};

watch(results, renderTrendChart);

const rankings = computed(() => {
  return [...results.value]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
});

// Simple GPA logic
const gpa = computed(() => {
  if (!results.value.length) return 0;

  const total = results.value.reduce((sum, r) => {
    if (r.grade === "A") return sum + 4;
    if (r.grade === "B") return sum + 3;
    if (r.grade === "C") return sum + 2;
    if (r.grade === "D") return sum + 1;
    return sum;
  }, 0);

  return (total / results.value.length).toFixed(2);
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const getGradeClass = (grade) => {
  if (!grade) return "";

  if (grade === "A") return "success";
  if (grade === "B") return "primary";
  if (grade === "C") return "warning";
  return "danger";
};

const getRemark = () => {
  if (averageScore.value >= 80) return "Excellent performance";
  if (averageScore.value >= 60) return "Good performance";
  if (averageScore.value >= 50) return "Fair performance";
  return "Needs improvement";
};

const downloadReportCard = () => {
  const doc = new jsPDF();

  const user = JSON.parse(sessionStorage.getItem("user"));

  // HEADER
  doc.setFontSize(20);
doc.text("🏫 Your School Name", 14, 15);

doc.setFontSize(14);
doc.text("Student Report Card", 14, 25);

doc.setFontSize(11);
doc.text(`Student: ${user.name}`, 14, 35);
doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42);

  // TABLE DATA
  const tableData = results.value.map(r => [
    r.course?.name,
    r.score,
    r.grade,
  ]);

  const averageScore = computed(() => {
  if (!results.value.length) return 0;

  return Math.round(
    results.value.reduce((a, b) => a + (b.score || 0), 0) /
    results.value.length
  );
});

  autoTable(doc, {
    startY: 40,
    head: [["Course", "Score", "Grade"]],
    body: tableData,
  });

  // SUMMARY
  doc.text(`Average Score: ${averageScore.value}`, 14, doc.lastAutoTable.finalY + 10);
  doc.text(`GPA: ${gpa.value}`, 14, doc.lastAutoTable.finalY + 18);
  doc.text(`Remark: ${getRemark()}`, 14, doc.lastAutoTable.finalY + 26);

  // SAVE
  doc.save("report-card.pdf");
};

onMounted(() => {
  renderTrendChart();
  socket.on("message", (msg) => {
    console.log(msg);
    alert(msg.title);
  });
});

onMounted(fetchCourses);
onMounted(fetchData);
</script>

<template>
  
    <Navbar/>

  <div class="dashboard">
    <h1 class="page-title">Student Dashboard</h1>

    <Notifications />

    <section class="grid-3">
  <div class="stat-card">
    <h3>Average Score</h3>
    <p>{{ averageScore }}</p>
  </div>

  <div class="stat-card">
    <h3>GPA</h3>
    <p>{{ gpa }}</p>
  </div>

  <div class="stat-card">
    <h3>Total Subjects</h3>
    <p>{{ results.length }}</p>
  </div>
</section>

    <section class="card">
      <h2 class="section-title">Performance Trend</h2>
      <canvas id="trendChart"></canvas>
    </section>

    <section class="card">
  <h2 class="section-title">Top Performance</h2>

  <ul class="ranking">
    <li v-for="(r, index) in rankings" :key="r._id">
      <span>#{{ index + 1 }}</span>
      <span>{{ r.course?.name }}</span>
      <strong>{{ r.score }}</strong>
    </li>
  </ul>
</section>

    <!-- TIMETABLE -->
    <section class="card">
      <h2 class="section-title">My Timetable</h2>
      <UserTimetable />
    </section>

    <div class="stats-grid">
          <div class="stat-card">
            <p>Total Courses</p>
            <h3>{{ results.length }}</h3>
          </div>

          <div class="stat-card">
            <p>Average Score</p>
            <h3>
              {{
                Math.round(
                  results.reduce((a, b) => a + (b.score || 0), 0) /
                  (results.length || 1)
                )
              }}
            </h3>
          </div>

          <div class="stat-card">
            <p>Attendance</p>
            <h3>{{ attendance.length }}</h3>
          </div>
        </div>

    <!-- CHARTS -->
    <section class="grid-2">
      <div class="card">
        <h2 class="section-title">Performance</h2>
        <PerformanceChart :results="results" />
      </div>

      <div class="card">
        <h2 class="section-title">Attendance</h2>
        <AttendanceChart :attendance="attendance" />
      </div>
    </section>

    <!-- RESULTS TABLE -->
    <section class="card">
      <h2 class="section-title">My Results</h2>

      <div class="row mb-2">
          <input
            v-model="search"
            placeholder="Search course..."
            class="input"
          />

          <select v-model="filterGrade" class="input">
            <option value="">All Grades</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

      <div v-if="filteredResults.length === 0" class="empty">
          No results found
        </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr v-for="r in filteredResults" :key="r._id">
              <th>Course</th>
              <th>Score</th>
              <th>Grade</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="r in results" :key="r._id">
              <td>{{ r.course?.name }}</td>
              <td>{{ r.score }}</td>
              <td>
                <span class="badge" :class="getGradeClass(r.grade)">
                  {{ r.grade }}
                </span>
              </td>
              <td>{{ formatDate(r.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <button @click="downloadReportCard" class="btn success">
      Download Report Card
    </button>
  </div>
</template>

<style scoped>
.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px,1fr));
  gap: 15px;
}

.stat-card {
  background: white;
  padding: 15px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px,1fr));
  gap: 10px;
}

.stat-card {
  background: white;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.stat-card h3 {
  font-size: 20px;
  margin-top: 5px;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}

.badge {
  background: #2563eb;
  color: white;
  padding: 4px 8px;
  border-radius: 999px;
}

.stat-card h3 {
  font-size: 14px;
  color: #6b7280;
}

.stat-card p {
  font-size: 22px;
  font-weight: bold;
}

.ranking {
  list-style: none;
  padding: 0;
}

.ranking li {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.empty {
  padding: 20px;
  text-align: center;
  color: #6b7280;
}

/* Badge colors */
.badge.success { background: #16a34a; }
.badge.primary { background: #2563eb; }
.badge.warning { background: #f59e0b; }
.badge.danger  { background: #dc2626; }

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
.dashboard { 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  padding: 1rem; 
  background: #f3f4f6; 
  min-height: 100vh; 
}
.page-title { 
  font-size: 2rem; 
  font-weight: 700; 
  color: #1f2937; 
}
.card { 
  background: white; 
  padding: 2rem; 
  border-radius: 12px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
}
.section-title { 
  font-weight: 600; 
  margin-bottom: 1rem; 
  color: #111827; 
}
.table-wrapper { 
  overflow-x: auto; 
}
.table { 
  width: 100%; 
  border-collapse: collapse; 
}
.table th, .table td { 
  padding: 0.75rem 1rem; 
  border-bottom: 1px solid #e5e7eb; 
}
.table th { 
  background: #f9fafb; 
  font-weight: 600; 
  text-align: left; 
  }
</style>