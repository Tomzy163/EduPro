<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from "vue";
import * as XLSX from "xlsx";
import { Chart } from "chart.js/auto";
import { getCourses } from "../../services/courseService";
import Navbar from "@/components/Navbar.vue";
import { uploadResult } from "../../services/resultService";
import { markAttendance } from "../../services/attendanceService";
import Notifications from "../../components/Notifications.vue";
import UserTimetable from "../../components/UserTimetable.vue";
import socket from "@/socket";
// import { f } from "vue-router/dist/router-CWoNjPRp.mjs";



const courses = ref([]);
const selectedCourse = ref("");
const selectedStudent = ref("");
const studentSearch = ref("");
const loading = ref(false);


let barChart = null;
let pieChart = null;

const results = ref([]);
const editingResultId = ref(null);

const editScore = ref("");
const editGrade = ref("");

const attendanceList = ref([]);

// Result form
const score = ref("");
const grade = ref("");

// Attendance
const status = ref("present");

const selectedFilterCourse = ref("");

// FILTERED RESULTS
const filteredResults = computed(() => {
  if (!selectedFilterCourse.value) return results.value;

  return results.value.filter(
    r => r.course?._id === selectedFilterCourse.value
  );
});

const renderCharts = () => {
  const labels = filteredResults.value.map(r => r.student?.name);
  const scores = filteredResults.value.map(r => Number(r.score));

  // DESTROY OLD CHARTS
  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  // BAR CHART
  const ctx1 = document.getElementById("barChart");

  barChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Scores",
          data: scores,
        },
      ],
    },
  });

  // PIE CHART
  const pass = filteredResults.value.filter(r => r.score >= 50).length;
  const fail = filteredResults.value.length - pass;

  const ctx2 = document.getElementById("pieChart");

  pieChart = new Chart(ctx2, {
    type: "pie",
    data: {
      labels: ["Pass", "Fail"],
      datasets: [
        {
          data: [pass, fail],
        },
      ],
    },
  });
};

watch(filteredResults, () => {
  renderCharts();
});

const exportToExcel = () => {
  const data = filteredResults.value.map(r => ({
    Student: r.student?.name,
    Course: r.course?.name,
    Score: r.score,
    Grade: r.grade,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

  XLSX.writeFile(workbook, "results.xlsx");
};

// ANALYTICS
const totalStudents = computed(() => {
  return new Set(filteredResults.value.map(r => r.student?._id)).size;
});

const averageScore = computed(() => {
  if (!filteredResults.value.length) return 0;

  const total = filteredResults.value.reduce((sum, r) => sum + Number(r.score || 0), 0);
  return Math.round(total / filteredResults.value.length);
});

const passRate = computed(() => {
  if (!filteredResults.value.length) return 0;

  const passed = filteredResults.value.filter(r => Number(r.score) >= 50).length;
  return Math.round((passed / filteredResults.value.length) * 100);
});

// ✅ FETCH COURSES
const fetchCourses = async () => {
  const allCourses = await getCourses();
  const user = JSON.parse(sessionStorage.getItem("user"));

  courses.value = allCourses.filter(
    (c) => c.teacher?._id === user._id
  );
};

// ✅ COMPUTED
const selectedCourseData = computed(() =>
  courses.value.find((c) => c._id === selectedCourse.value)
);

const students = computed(() => selectedCourseData.value?.students || []);

const filteredStudents = computed(() =>
  students.value.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.value.toLowerCase())
  )
);

const fetchResults = async () => {
  const res = await API.get("/results");
  results.value = res.data;
};

const fetchAttendance = async () => {
  const res = await API.get("/attendance");
  attendanceList.value = res.data;
};

const startEditResult = (r) => {
  editingResultId.value = r._id;
  editScore.value = r.score;
  editGrade.value = r.grade;
};

const updateResult = async (id) => {
  await API.put(`/results/${id}`, {
    score: editScore.value,
    grade: editGrade.value,
  });

  editingResultId.value = null;
  fetchResults();
};

const deleteResult = async (id) => {
  if (!confirm("Delete this result?")) return;

  await API.delete(`/results/${id}`);
  fetchResults();
};

// ✅ SOCKET
const handleMessage = (msg) => {
  alert(msg.title);
};

// ✅ RESET STUDENT WHEN COURSE CHANGES
watch(selectedCourse, () => {
  selectedStudent.value = "";
  studentSearch.value = "";
});

// ✅ UPLOAD RESULT
const submitResult = async () => {
  if (!selectedStudent.value || !selectedCourse.value || !score.value) {
    return alert("Fill all fields");
  }

  loading.value = true;

  await uploadResult({
    student: selectedStudent.value,
    course: selectedCourse.value,
    score: score.value,
    grade: grade.value,
  });

  loading.value = false;
  score.value = "";
  grade.value = "";

  alert("Result uploaded");
};

// ✅ ATTENDANCE
const submitAttendance = async () => {
  if (!selectedStudent.value || !selectedCourse.value) {
    return alert("Select student and course");
  }

  await markAttendance({
    student: selectedStudent.value,
    course: selectedCourse.value,
    status: status.value,
  });

  alert("Attendance marked");
};

// ✅ LIFECYCLE

onMounted(() => {
  fetchCourses();
  fetchResults();
  fetchAttendance();
  renderCharts();
  socket.on("message", handleMessage);
});
</script>
<template>
  <Navbar/>
  <div class="dashboard">
    <h1 class="page-title">Teacher Dashboard</h1>
    <Notifications />


    <section class="grid-3">
      <div class="stat-card">
        <h3>Total Students</h3>
        <p>{{ totalStudents }}</p>
      </div>

      <div class="stat-card">
        <h3>Average Score</h3>
        <p>{{ averageScore }}</p>
      </div>

      <div class="stat-card">
        <h3>Pass Rate</h3>
        <p>{{ passRate }}%</p>
      </div>
    </section>

    <section class="grid-2">
      <div class="card">
        <h3>Student Scores</h3>
        <canvas id="barChart"></canvas>
      </div>

      <div class="card">
        <h3>Pass vs Fail</h3>
        <canvas id="pieChart"></canvas>
      </div>
    </section>

    <!-- TIMETABLE -->
    <UserTimetable />

    <!-- SELECT COURSE & STUDENT -->
    <section class="card">
      <h2 class="section-title">Upload Results & Attendance</h2>

      <div class="form-grid mb-4">
            <!-- COURSE -->
            <select v-model="selectedCourse" class="input">
              <option disabled value="">Select Course</option>
              <option v-for="c in courses" :key="c._id" :value="c._id">
                {{ c.name }}
              </option>
            </select>

            <!-- SEARCH -->
            <input
              v-model="studentSearch"
              placeholder="Search student..."
              class="input"
            />

            <!-- STUDENTS -->
            <select v-model="selectedStudent" class="input">
              <option disabled value="">Select Student</option>
              <option v-for="s in filteredStudents" :key="s._id" :value="s._id">
                {{ s.name }}
              </option>
            </select>
          </div>

          <div v-if="selectedCourseData" class="card">
            <p><strong>Course:</strong> {{ selectedCourseData.name }}</p>
            <p><strong>Total Students:</strong> {{ students.length }}</p>
          </div>
      <!-- Result -->
      <div class="flex gap-2 mb-2">
        <input v-model="score" placeholder="Score" class="input"/>
        <input v-model="grade" placeholder="Grade" class="input"/>
        <button :disabled="loading" class="btn btn-primary">
        {{ loading ? "Uploading..." : "Upload Result" }}
      </button>
      </div>

      <section class="card">
            <h2 class="section-title">Results</h2>

                      <div class="row">
            <select v-model="selectedFilterCourse" class="input">
              <option value="">All Courses</option>
              <option v-for="c in courses" :key="c._id" :value="c._id">
                {{ c.name }}
              </option>
            </select>
          </div>

            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="r in results" :key="r._id">
                    <td>{{ r.student?.name }}</td>
                    <td>{{ r.course?.name }}</td>

                    <!-- EDIT MODE -->
                    <td v-if="editingResultId === r._id">
                      <input v-model="editScore" class="input small" />
                    </td>
                    <td v-else>{{ r.score }}</td>

                    <td v-if="editingResultId === r._id">
                      <input v-model="editGrade" class="input small" />
                    </td>
                    <td v-else>{{ r.grade }}</td>

                    <td>
                      <div v-if="editingResultId === r._id">
                        <button @click="updateResult(r._id)" class="btn success small">Save</button>
                      </div>

                      <div v-else>
                        <button @click="startEditResult(r)" class="btn primary small">Edit</button>
                        <button @click="deleteResult(r._id)" class="btn danger small">Delete</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button @click="exportToExcel" class="btn success">
                  Export to Excel
                </button>
            </div>
          </section>

      <!-- Attendance -->
      <div class="flex gap-2">
        <select v-model="status" class="input">
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
        <button @click="submitAttendance" class="btn btn-success">Mark Attendance</button>
      </div>
    </section>

    <section class="card">
          <h2 class="section-title">Attendance History</h2>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="a in attendanceList" :key="a._id">
                  <td>{{ a.student?.name }}</td>
                  <td>{{ a.course?.name }}</td>
                  <td>{{ a.status }}</td>
                  <td>{{ new Date(a.createdAt).toLocaleDateString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
          </div>
</template>

<style scoped>

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

canvas {
  max-height: 300px;
}

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

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

.stat-card h3 {
  font-size: 14px;
  color: #6b7280;
}

.stat-card p {
  font-size: 22px;
  font-weight: bold;
  color: #111827;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 1rem;
  background: #f3f4f6;
  min-height: 100vh;
}

.input.small {
  padding: 5px;
  font-size: 12px;
}

.table-wrapper {
  overflow-x: auto;
}

.table tr:hover {
  background: #f9fafb;
}

.flex {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
.input { 
  width: 100%; 
  padding: 0.5rem 1rem; 
  border-radius: 8px; 
  border: 1px solid #d1d5db; 
}
.btn { 
  padding: 0.6rem 1.2rem; 
  border-radius: 8px; 
  font-weight: 600; 
  cursor: pointer; 
  border: none; 
  transition: 0.2s; 
}

.btn-primary { 
  background: #2563eb; 
  color: white; 
} 
.btn-primary:hover { 
  background: #1d4ed8; 
}

.btn-success { 
  background: #16a34a; 
  color: white; 
} 
.btn-success:hover { 
  background: #15803d; 
}

.form-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); 
  gap: 0.8rem; 
  margin-bottom: 1rem; 
}
</style>