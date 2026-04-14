<script setup>
import { ref, onMounted } from "vue";
import { getUsers } from "@/services/userService";
import { getCourses, assignTeacher, assignStudent } from "@/services/courseService";

const users = ref([]);
const courses = ref([]);

const teacherId = ref("");
const studentId = ref("");
const teacherCourses = ref([]);
const studentCourses = ref([]);

onMounted(async () => {
  users.value = await getUsers();
  courses.value = await getCourses();
});

const assignTeacherMulti = async () => {
  for (let c of teacherCourses.value) {
    await assignTeacher({ courseId: c, teacherId: teacherId.value });
  }
};

const assignStudentMulti = async () => {
  for (let c of studentCourses.value) {
    await assignStudent({ courseId: c, studentId: studentId.value });
  }
};
</script>

<template>
   <!-- ASSIGN TEACHER -->
    <section class="card">
      <h2>Assign Teacher Courses</h2>

      <select v-model="assignTeacherId" class="input">
        <option disabled value="">Select Teacher</option>
        <option v-for="u in users.filter(u=>u.role==='teacher')" :value="u._id">
          {{ u.name }}
        </option>
      </select>

      <div class="course-grid">
        <label v-for="c in courses" :key="c._id" class="course-item">
          <input type="checkbox" :value="c._id" v-model="assignTeacherCourses" />
          {{ c.name }}
        </label>
      </div>

      <button @click="assignTeacherMulti" class="btn primary">
        Assign
      </button>
    </section>
</template>