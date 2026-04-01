<script setup>
import { ref, onMounted } from "vue";
import { getStudentResults } from "../../services/resultService";
import { getAttendance } from "../../services/attendanceService";
import PerformanceChart from "../../components/PerformanceChart.vue";
import AttendanceChart from "../../components/AttendanceChart.vue";
import Notifications from "../../components/Notifications.vue";
import UserTimetable from "../../components/UserTimetable.vue";

const results = ref([]);
const attendance = ref([]);
const user = JSON.parse(sessionStorage.getItem("user"));

// Fetch results & attendance
const fetchData = async () => {
  results.value = await getStudentResults(user._id);
  attendance.value = await getAttendance(user._id);
};

onMounted(fetchData);
</script>

<template>
  <div class="dashboard">
    <h1 class="page-title">Student Dashboard</h1>
    <Notifications />

    <!-- TIMETABLE -->
    <UserTimetable />

    <!-- PERFORMANCE & ATTENDANCE CHARTS -->
    <section class="card">
      <h2 class="section-title">Performance</h2>
      <PerformanceChart :results="results"/>
    </section>

    <section class="card">
      <h2 class="section-title">Attendance</h2>
      <AttendanceChart :attendance="attendance"/>
    </section>

    <!-- RESULTS TABLE -->
    <section class="card">
      <h2 class="section-title">My Results</h2>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in results" :key="r._id">
              <td>{{ r.course?.name }}</td>
              <td>{{ r.status }}</td>
              <td>{{ new Date(r.date).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; padding: 1rem; background: #f3f4f6; min-height: 100vh; }
.page-title { font-size: 2rem; font-weight: 700; color: #1f2937; }
.card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.section-title { font-weight: 600; margin-bottom: 1rem; color: #111827; }
.table-wrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; }
.table th { background: #f9fafb; font-weight: 600; text-align: left; }
</style>