<script setup>
import { ref, onMounted } from "vue";

import { getUsers, createUser, deleteUser } from "../../services/userService";
import { sendMessage } from "../../services/messageService";
import {
  getCourses,
  createCourse,
  assignTeacher,
  assignStudent,
} from "../../services/courseService";
import Notifications from "../../components/Notifications.vue";
import AdminAnalytics from "../../components/AdminAnalytics.vue";
import API from "../../services/api";

const users = ref([]);
const courses = ref([]);
const payments = ref([]);

// USER FORM
const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("teacher");
const schoolName = ref(localStorage.getItem("schoolName") || "");

// COURSE FORM
const courseName = ref("");
const term = ref("First Term");

// ASSIGNMENT
const selectedCourse = ref("");
const selectedTeacher = ref("");
const selectedStudent = ref("");

// ANNOUNCEMENT
const title = ref("");
const content = ref("");
const roleTarget = ref("student");

// Send announcement
const send = async () => {
  if (!title.value || !content.value) return alert("Please fill title & content");
  await sendMessage({ title: title.value, content: content.value, roleTarget: roleTarget.value });
  alert("Message sent!");
  title.value = "";
  content.value = "";
};

// Save school
const saveSchool = () => {
  if (!schoolName.value) return alert("Enter school name");
  localStorage.setItem("schoolName", schoolName.value);
  alert("School name saved!");
};

// Fetch users & courses
const fetchData = async () => {
  users.value = await getUsers();
  courses.value = await getCourses();
};

// Users
const addUser = async () => {
  if (!name.value || !email.value || !password.value || !role.value) {
    return alert("Fill all fields");
  }

  await createUser({
    name: name.value,
    email: email.value,
    password: password.value,
    role: role.value,
  });

  name.value = "";
  email.value = "";
  password.value = "";
  role.value = "teacher";

  fetchData();
};

const removeUser = async (id) => {
  if (confirm("Delete this user?")) {
    await deleteUser(id);
    fetchData();
  }
};

// Courses
const addCourse = async () => {
  if (!courseName.value) return alert("Enter course name");
  await createCourse({ name: courseName.value, term: term.value });
  courseName.value = "";
  fetchData();
};

const assignTeacherToCourse = async () => {
  if (!selectedCourse.value || !selectedTeacher.value) return alert("Select course and teacher");
  await assignTeacher({ courseId: selectedCourse.value, teacherId: selectedTeacher.value });
  selectedCourse.value = selectedTeacher.value = "";
  fetchData();
};

const assignStudentToCourse = async () => {
  if (!selectedCourse.value || !selectedStudent.value) return alert("Select course and student");
  await assignStudent({ courseId: selectedCourse.value, studentId: selectedStudent.value });
  selectedCourse.value = selectedStudent.value = "";
  fetchData();
};

// Payments
const fetchPayments = async () => {
  const res = await API.get("/payments");
  payments.value = res.data;
};

const approvePayment = async (id, status) => {
  await API.put(`/payments/${id}`, { status });
  fetchPayments();
};

onMounted(() => {
  fetchData();
  fetchPayments();
});
</script>

<template>
  <div class="dashboard">
    <h1 class="page-title">Admin Dashboard</h1>

    <!-- Analytics -->
    <AdminAnalytics />

    <!-- SCHOOL -->
    <section class="card">
      <h2 class="section-title">School Setup</h2>
      <div class="flex gap-2 items-center">
        <input v-model="schoolName" placeholder="Enter School Name" class="input" />
        <button @click="saveSchool" class="btn btn-primary">Save</button>
      </div>
    </section>

    <!-- ANNOUNCEMENT -->
    <section class="card">
      <h2 class="section-title">Send Announcement</h2>
      <input v-model="title" placeholder="Title" class="input mb-2"/>
      <textarea v-model="content" placeholder="Content" class="input mb-2"></textarea>
      <select v-model="roleTarget" class="input mb-2">
        <option value="student">Students</option>
        <option value="teacher">Teachers</option>
        <option value="parent">Parents</option>
        <option value="all">All</option>
      </select>
      <button @click="send" class="btn btn-success">Send</button>
    </section>

    <!-- USERS -->
    <section class="card">
      <h2 class="section-title">Create User</h2>
      <div class="form-grid">
        <input v-model="name" placeholder="Full Name" class="input"/>
        <input v-model="email" placeholder="Email" class="input"/>
        <input v-model="password" placeholder="Password" class="input"/>
        <select v-model="role" class="input">
          <option disabled value="">Select Role</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
      </div>
      <button @click="addUser" class="btn btn-primary mb-2">Create User</button>

      <ul class="list">
        <li v-for="u in users" :key="u._id" class="list-item">
          {{ u.name }} - {{ u.role }}
          <button @click="removeUser(u._id)" class="btn btn-danger">Delete</button>
        </li>
      </ul>
    </section>

    <!-- COURSES -->
    <section class="card">
      <h2 class="section-title">Courses</h2>
      <div class="flex gap-2 mb-2">
        <input v-model="courseName" placeholder="Course Name" class="input"/>
        <select v-model="term" class="input">
          <option>First Term</option>
          <option>Second Term</option>
          <option>Third Term</option>
        </select>
        <button @click="addCourse" class="btn btn-primary">Create Course</button>
      </div>

      <ul class="list">
        <li v-for="c in courses" :key="c._id" class="list-item">
          {{ c.name }} ({{ c.term }})
        </li>
      </ul>
    </section>

    <!-- ASSIGN TEACHER -->
    <section class="card">
      <h2 class="section-title">Assign Teacher</h2>
      <select v-model="selectedCourse" class="input mb-2">
        <option disabled value="">Select Course</option>
        <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.name }}</option>
      </select>
      <select v-model="selectedTeacher" class="input mb-2">
        <option disabled value="">Select Teacher</option>
        <option v-for="u in users.filter(u => u.role === 'teacher')" :key="u._id" :value="u._id">{{ u.name }}</option>
      </select>
      <button @click="assignTeacherToCourse" class="btn btn-primary">Assign</button>
    </section>

    <!-- ASSIGN STUDENT -->
    <section class="card">
      <h2 class="section-title">Assign Student</h2>
      <select v-model="selectedStudent" class="input mb-2">
        <option disabled value="">Select Student</option>
        <option v-for="u in users.filter(u => u.role === 'student')" :key="u._id" :value="u._id">{{ u.name }}</option>
      </select>
      <button @click="assignStudentToCourse" class="btn btn-primary">Assign</button>
    </section>

    <!-- PAYMENTS -->
    <section class="card">
      <h2 class="section-title">Payments</h2>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p._id">
              <td>{{ p.user?.name }}</td>
              <td>{{ p.amount }}</td>
              <td>{{ p.status }}</td>
              <td>
                <button @click="approvePayment(p._id, 'approved')" class="btn btn-success btn-sm">Approve</button>
                <button @click="approvePayment(p._id, 'rejected')" class="btn btn-danger btn-sm">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
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
  padding: 2.5rem;
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
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  outline: none;
  transition: 0.2s;
}

.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
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
.btn-primary:hover { background: #1d4ed8; }

.btn-success {
  background: #16a34a;
  color: white;
}
.btn-success:hover { background: #15803d; }

.btn-danger {
  background: #dc2626;
  color: white;
}
.btn-danger:hover { background: #b91c1c; }

.btn-sm {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.list {
  list-style: none;
  padding: 0;
  margin-top: 0.5rem;
}

.list-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>