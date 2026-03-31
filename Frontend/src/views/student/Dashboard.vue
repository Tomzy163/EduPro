<script setup>
import { ref, onMounted } from "vue";
import { getStudentResults } from "../../services/resultService";
import { getAttendance } from "../../services/attendanceService";
import PerformanceChart from "../../components/PerformanceChart.vue";
import AttendanceChart from "../../components/AttendanceChart.vue";
import Notifications from "../../components/Notifications.vue";

const results = ref([]);
const attendance = ref([]);

const user = JSON.parse(localStorage.getItem("user"));

// Fetch data
const fetchData = async () => {
  results.value = await getStudentResults(user._id);
  attendance.value = await getAttendance(user._id);
};

onMounted(fetchData);
</script>

<template>
  <div>
    <h1>Student Dashboard</h1>

    <Notifications />

        <h2 class="text-xl font-bold mt-6">Performance Chart</h2>

    <PerformanceChart :results="results" />
          <h2 class="text-xl font-bold mt-6">Attendance Chart</h2>

    <AttendanceChart :attendance="attendance" />

    <!-- RESULTS -->
    <h2>My Results</h2>
    <table border="1">
  <thead>
    <tr>
      <th>Course</th>
      <th>Status</th>
      <th>Date</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="r in results" :key="r.id">
      <td>{{r.course }}</td>
      <td>{{ r.status }}</td>
      <td>{{ r.date }}</td>
    </tr>
  </tbody>
</table>
    <hr />

    <!-- ATTENDANCE -->
    <h2>Attendance</h2>
    <table border="1">
      <thead>
        <tr>
          <th>Course</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
      <tr v-for="a in attendance" :key="a._id">
        <td>{{ a.course?.name }}</td>
        <td>{{ a.status }}</td>
        <td>{{ new Date(a.date).toLocaleDateString() }}</td>
      </tr>
    </tbody>
    </table>
  </div>
</template>