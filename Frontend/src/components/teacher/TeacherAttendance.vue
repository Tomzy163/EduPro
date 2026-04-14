<script setup>
import { ref, onMounted } from "vue";
import { markAttendance } from "@/services/attendanceService";
import API from "@/services/api";

const students = ref([]);
const courses = ref([]);
const attendance = ref([]);

const student = ref("");
const course = ref("");
const status = ref("present");

// FETCH DATA
const fetchAll = async () => {
  const users = await API.get("/users?role=student");
  students.value = users.data;

  const c = await API.get("/courses");
  courses.value = c.data;

  const a = await API.get("/attendance");
  attendance.value = a.data;
};

const submit = async () => {
  await markAttendance({
    student: student.value,
    course: course.value,
    status: status.value,
  });

  fetchAll();
};

onMounted(fetchAll);
</script>

<template>
  <section class="card">
    <h2 class="section-title">Attendance</h2>

    <div class="form-grid">
      <select v-model="student" class="input">
        <option disabled value="">Student</option>
        <option v-for="s in students" :key="s._id" :value="s._id">
          {{ s.name }}
        </option>
      </select>

      <select v-model="course" class="input">
        <option disabled value="">Course</option>
        <option v-for="c in courses" :key="c._id" :value="c._id">
          {{ c.name }}
        </option>
      </select>

      <select v-model="status" class="input">
        <option value="present">Present</option>
        <option value="absent">Absent</option>
      </select>
    </div>

    <button @click="submit" class="btn btn-success">Mark Attendance</button>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="a in attendance" :key="a._id">
            <td>{{ a.student?.name }}</td>
            <td>{{ a.course?.name }}</td>
            <td>{{ a.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>