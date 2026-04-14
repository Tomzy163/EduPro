<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import {
  getAttendanceList,
  markAttendance,
} from "@/services/attendanceService";
import { getCourses } from "@/services/courseService";
import socket from "@/socket";

const students = ref([]);
const courses = ref([]);
const attendance = ref([]);

const student = ref("");
const course = ref("");
const status = ref("present");

const getCurrentUserId = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user?._id || user?.id || "";
  } catch {
    return "";
  }
};

const fetchAll = async () => {
  try {
    const currentUserId = getCurrentUserId();
    const allCourses = await getCourses();

    courses.value = allCourses.filter(
      (item) => (item.teacher?._id || item.teacher?.id || item.teacher) === currentUserId
    );

    const uniqueStudents = new Map();
    courses.value.forEach((courseItem) => {
      (courseItem.students || []).forEach((studentItem) => {
        uniqueStudents.set(studentItem._id, studentItem);
      });
    });

    students.value = Array.from(uniqueStudents.values());
    attendance.value = await getAttendanceList();
  } catch (error) {
    console.error("Failed to load teacher attendance data:", error);
  }
};

const submit = async () => {
  if (courses.value.length === 0) {
    alert("No course has been assigned to this teacher yet. Ask the admin to assign your courses.");
    return;
  }

  try {
    await markAttendance({
      student: student.value,
      course: course.value,
      status: status.value,
    });

    await fetchAll();
  } catch (error) {
    alert(error.response?.data?.message || "Failed to mark attendance.");
  }
};

onMounted(() => {
  fetchAll();
  socket.on("admin:update", fetchAll);
});

onUnmounted(() => {
  socket.off("admin:update", fetchAll);
});
</script>

<template>
  <section class="card">
    <h2 class="section-title">Attendance</h2>

    <p v-if="courses.length === 0" class="empty">
      No course has been assigned to this teacher yet.
    </p>

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
