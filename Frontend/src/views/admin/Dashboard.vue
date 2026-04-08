<script setup>
import { ref, onMounted, watch, computed } from "vue";

import { getUsers, createUser, deleteUser } from "../../services/userService";
import { useAuthStore } from "../../store/authStore";
import { sendMessage, getMessages } from "@/services/messageService";
import socket from "@/socket";
// import { onMessage } from "../services/socket";
import Navbar from "@/components/Navbar.vue";
import {
  getCourses,
  createCourse,
  assignTeacher,
  assignStudent,
} from "../../services/courseService";
import Notifications from "../../components/Notifications.vue";
import AdminAnalytics from "../../components/AdminAnalytics.vue";
import API from "../../services/api";
// import { deleteAllLinks } from "@/services/relationshipService";

const users = ref([]);
const courses = ref([]);
const payments = ref([]);
const notifications = ref([]);
const search = ref("");
const roleFilter = ref("all");
const currentPage = ref(1);
const perPage = 5;
// const auth = useAuthStore();

const timetable = ref([]); // existing timetable
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const times = ["08:00am-09:00am", "09:00am-10:00am", "10:00am-11:00am", "11:00am-12:00pm", "12:00pm-01:00pm", "1:00pm-2:00pm", "2:00pm-3:00pm"];

// ======================
// TIMETABLE STATE
// ======================
const timetableCourse = ref("");
const timetableTeacher = ref("");
const timetableStudent = ref("");
const timetableDay = ref("");
const timetableTime = ref("");

// Fetch timetable
const fetchTimetable = async () => {
  const res = await API.get("/timetable");
  timetable.value = res.data;
};

// Add timetable slot
const addSlot = async () => {
  if (
    !timetableCourse.value ||
    !timetableTeacher.value ||
    !timetableDay.value ||
    !timetableTime.value
  ) {
    return alert("Please fill all fields");
  }

  await API.post("/timetable", {
    course: timetableCourse.value,
    teacher: timetableTeacher.value,
    student: timetableStudent.value || null,
    day: timetableDay.value,
    time: timetableTime.value,
  });

  // Reset form
  timetableCourse.value = "";
  timetableTeacher.value = "";
  timetableStudent.value = "";
  timetableDay.value = "";
  timetableTime.value = "";

  fetchTimetable();
};

// Delete timetable slot
const removeSlot = async (id) => {
  if (confirm("Delete this timetable slot?")) {
    await API.delete(`/timetable/${id}`);
    fetchTimetable();
  }
};

// USER FORM
const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("teacher");
// const schoolName = ref(localStorage.getItem("schoolName") || "");
const auth = useAuthStore();
const schoolName = ref(auth.user?.school || "");

// COURSE FORM
const courseName = ref("");
const term = ref("First Term");

// ======================
// ASSIGNMENT STATE
// ======================
const assignCourses = ref([]);
const assignTeacherId = ref("");
const assignStudentId = ref("");

// ANNOUNCEMENT
const title = ref("");
const content = ref("");
const roleTarget = ref("student");
const sentMessages = ref([]);
const editingMessageId = ref(null);
const editTitle = ref("");
const editContent = ref("");
const loading = ref(false);
const messages = ref([]);
// const schoolName = computed(() => auth.user?.school || " ")


const parentId = ref("");
const studentId = ref("");
const history = ref([]);
const selectedParentData = ref(null);
const editId = ref(null);
const editParent = ref("");
const editStudent = ref("");

const linkParent = async () => {
  try {
    await API.post("/relationships/link", {
      parentId: parentId.value,
      studentId: studentId.value,
    });

    alert("Linked successfully");
    fetchHistory();
  } catch (err) {
    console.error("FULL ERROR:", err.response?.data);
    alert(err.response?.data?.message || "Link failed");
  }
};

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.value.toLowerCase()) ||
      u.email.toLowerCase().includes(search.value.toLowerCase());

    const matchesRole =
      roleFilter.value === "all" || u.role === roleFilter.value;

    return matchesSearch && matchesRole;
  });
});

watch(search, () => {
  currentPage.value = 1;
});

watch(roleFilter, () => {
  currentPage.value = 1;
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredUsers.value.slice(start, start + perPage);
});

const totalPages = computed(() =>
  Math.ceil(filteredUsers.value.length / perPage)
);

const handleDeleteAllLinks = async () => {
  if (!confirm("Delete ALL links?")) return;

  await API.delete("/relationships/"); // ✅ FIXED
  fetchHistory();
};

const fetchParentChildren = async () => {
  const res = await API.get(`/relationships/parent/${parentId.value}`);
  selectedParentData.value = res.data;
};

const fetchHistory = async () => {
  const res = await API.get("/relationships/history");
  console.log("HISTORY:", res.data); // 👈 VERY IMPORTANT
  history.value = res.data;
};

const removeLink = async (id) => {
  if (!confirm("Delete this link?")) return;

  try {
    await API.delete(`/relationships/${id}`);
    fetchHistory();
  } catch (err) {
    console.error("DELETE ERROR:", err.response?.data || err);
  }
};

const startEdit = (link) => {
  editId.value = link._id;
  editParent.value = link.parent._id;
  editStudent.value = link.student._id;
};

const updateLink = async () => {
  try {
    await API.put(`/relationships/${editId.value}`, {
      parentId: editParent.value,
      studentId: editStudent.value,
    });

    editId.value = null;
    fetchHistory();
  } catch (err) {
    console.error("UPDATE ERROR:", err.response?.data || err);
  }
};

// ======================
// MESSAGES
// ======================

// Fetch messages
const fetchMessages = async () => {
  try {
    messages.value = await getMessages(); 
    console.log("MESSAGES:", messages.value); // debug
  } catch (err) {
    console.error(err);
  }
};

// Send message
const send = async () => {
  if (!title.value || !content.value) {
    return alert("Please fill title & content");
  }

  try {
    await sendMessage({
      title: title.value,
      content: content.value,
      roleTarget: roleTarget.value,
    });

    alert("Message sent!");

    title.value = "";
    content.value = "";

    fetchMessages(); // refresh
  } catch (err) {
    console.error(err);
  }
};

// Delete one
const deleteMsg = async (id) => {
  try {
    await API.delete(`/messages/${id}`);
    fetchMessages();
  } catch (err) {
    console.error(err);
  }
};

// Delete all
const clearAllMessages = async () => {
  try {
    await API.delete("/messages");
    fetchMessages();
  } catch (err) {
    console.error(err);
  }
};

// Save school
const saveSchool = async () => {
  try {
    await API.post("/schools", {
      name: schoolName.value,
    });

    alert("School saved!");
  } catch (err) {
    console.error(err);
  }
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

// const assignTeacherMulti = async () => {
//   if (!assignTeacherId.value || assignCourses.value.length === 0) {
//     return alert("Select teacher and courses");
//   }

//   for (let courseId of assignCourses.value) {
//     await assignTeacher({
//       courseId,
//       teacherId: assignTeacherId.value,
//     });
//   }

//   assignCourses.value = [];
//   assignTeacherId.value = "";
//   fetchData();
// };

const assignStudentMulti = async () => {
  if (!assignStudentId.value || assignStudentCourses.value.length === 0) {
    return alert("Select student and courses");
  }

  for (let courseId of assignStudentCourses.value) {
    await assignStudent({
      courseId,
      studentId: assignStudentId.value,
    });
  }

  assignStudentCourses.value = [];
  assignStudentId.value = "";
  fetchData();
};

const assignTeacherMulti = async () => {
  if (!assignTeacherId.value || assignTeacherCourses.value.length === 0) {
    return alert("Select teacher and courses");
  }

  for (let courseId of assignTeacherCourses.value) {
    await assignTeacher({
      courseId,
      teacherId: assignTeacherId.value,
    });
  }

  assignTeacherCourses.value = [];
  assignTeacherId.value = "";
  fetchData();
};

// const assignStudentMulti = async () => {
//   if (!assignStudentId.value || assignCourses.value.length === 0) {
//     return alert("Select student and courses");
//   }

//   for (let courseId of assignCourses.value) {
//     await assignStudent({
//       courseId,
//       studentId: assignStudentId.value,
//     });
//   }

//   assignCourses.value = [];
//   assignStudentId.value = "";
//   fetchData();
// };

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
  fetchMessages();
  fetchPayments();
  fetchTimetable();
  fetchHistory();

  socket.on("newMessage", (msg) => {
  console.log("New message:", msg);
  alert(msg.title);
});
});
</script>

<template>
  <Navbar />

  <div class="dashboard">
    <h1 class="page-title">Admin Dashboard</h1>

    <AdminAnalytics />

    <!-- SCHOOL -->
    <section class="card">
      <h2>School Setup</h2>
      <div class="row">
        <input v-model="schoolName" placeholder="School Name" class="input" />
        <button @click="saveSchool" class="btn primary">Save</button>
      </div>
    </section>

    <!-- ANNOUNCEMENT -->
    <section class="card">
      <h2>Announcements</h2>

      <input v-model="title" placeholder="Title" class="input" />
      <textarea v-model="content" placeholder="Message" class="input"></textarea>

      <div class="row">
        <select v-model="roleTarget" class="input">
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="parent">Parents</option>
          <option value="all">All</option>
        </select>

        <button @click="send" class="btn success">Send</button>
      </div>

      <div class="divider"></div>

      <h3>Message History</h3>

      <div v-if="messages.length === 0">No messages</div>

      <div v-for="msg in messages" :key="msg._id" class="message">
        <h4>{{ msg.title }}</h4>
        <p>{{ msg.content }}</p>
        <small>{{ msg.sender?.name }}</small>
      </div>

      <button @click="clearAllMessages" class="btn danger small">
        Clear All
      </button>
    </section>

    <!-- USERS -->
    <section class="card">
      <h2>Create User</h2>

      <div class="grid">
        <input v-model="name" placeholder="Name" class="input" />
        <input v-model="email" placeholder="Email" class="input" />
        <input v-model="password" placeholder="Password" class="input" />

        <select v-model="role" class="input">
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      <button @click="addUser" class="btn primary">Create</button>

      <div class="divider"></div>

      <h3>Users</h3>

      <div class="row">
        <input v-model="search" placeholder="Search..." class="input" />

        <select v-model="roleFilter" class="input">
          <option value="all">All</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="u in paginatedUsers" :key="u._id">
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td><span class="badge">{{ u.role }}</span></td>
            <td>
              <button @click="removeUser(u._id)" class="btn danger small">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button class="btn success small" @click="currentPage--" :disabled="currentPage===1">Prev</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button class="btn primary small" @click="currentPage++" :disabled="currentPage===totalPages">Next</button>
      </div>
    </section>

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

    <!-- ASSIGN STUDENT -->
    <section class="card">
      <h2>Assign Student Courses</h2>

      <select v-model="assignStudentId" class="input">
        <option disabled value="">Select Student</option>
        <option v-for="u in users.filter(u=>u.role==='student')" :value="u._id">
          {{ u.name }}
        </option>
      </select>

      <div class="course-grid">
        <label v-for="c in courses" :key="c._id" class="course-item">
          <input type="checkbox" :value="c._id" v-model="assignstudentCourses" />
          {{ c.name }}
        </label>
      </div>

      <button @click="assignStudentMulti" class="btn primary">
        Assign
      </button>
    </section>

  

          <section class="card">
                <h2 class="section-title">Assignment Overview</h2>

                <div class="grid-2">

                  <!-- TEACHERS -->
                  <div>
                    <h3>Teachers</h3>
                    <table class="table modern-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Courses</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="teacher in users.filter(u => u.role==='teacher')" :key="teacher._id">
                          <td>{{ teacher.name }}</td>
                          <td>
                            <span
                              v-for="c in courses.filter(c => c.teacher === teacher._id)"
                              :key="c._id"
                              class="tag blue"
                            >
                              {{ c.name }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- STUDENTS -->
                  <div>
                    <h3>Students</h3>
                    <table class="table modern-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Courses</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="student in users.filter(u => u.role==='student')" :key="student._id">
                          <td>{{ student.name }}</td>
                          <td>
                            <span
                              v-for="c in courses.filter(c => c.students.includes(student._id))"
                              :key="c._id"
                              class="tag green"
                            >
                              {{ c.name }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>
              </section>

              <!-- link parent to students -->

    <section class="card">
              <h2>Link Parent to Student</h2>

        <select v-model="parentId" class="input">
          <option disabled value="">Select Parent</option>
          <option v-for="u in users.filter(u => u.role === 'parent')" :key="u._id" :value="u._id">
            {{ u.name }}
          </option>
        </select>

        <select v-model="studentId" class="input">
          <option disabled value="">Select Student</option>
          <option v-for="u in users.filter(u => u.role === 'student')" :key="u._id" :value="u._id">
            {{ u.name }}
          </option>
        </select>

        <button @click="linkParent" class="btn primary">
          Link Parent
        </button>

        <h2>Link History</h2>

          <button @click="fetchHistory" class="btn primary small">Refresh</button>
          <button @click="handleDeleteAllLinks" class="btn danger small">
            Delete All
          </button>

          <div v-for="h in history" :key="h._id">

            <div v-if="editId === h._id">
              <select v-model="editParent" class="input">
                <option v-for="u in users.filter(u => u.role ==='parent')" :value="u._id">
                  {{ u.name }}
                </option>
              </select>

              <select v-model="editStudent" class="input">
                <option v-for="u in users.filter(u => u.role==='student')" :value="u._id">
                  {{ u.name }}
                </option>
              </select>

              <button @click="updateLink" class="btn success small">Save</button>
              <button @click="removeLink" class="btn danger small">Delete</button>
            </div>

            <div v-else>
                  <p>
                    👨‍👩‍👧 Parent: {{ h.parent?.name }} →
                    🎓 Student: {{ h.student?.name }}
                    (by {{ h.linkedBy?.name }})
                  </p>

              <button @click="startEdit(h)" class="btn primary small">Edit</button>
              <button @click="removeLink(h._id)" class="btn danger small">Delete</button>
            </div>

          </div>
        </section>


    <section class="card">
  <h2 class="section-title">Manage Timetable</h2>

  <div class="form-grid mb-4">
    <select v-model="timetableCourse" class="input">
      <option disabled value="">Select Course</option>
      <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.name }}</option>
    </select>

    <select v-model="timetableTeacher" class="input">
      <option disabled value="">Select Teacher</option>
      <option v-for="u in users.filter(u => u.role==='teacher')" :key="u._id" :value="u._id">{{ u.name }}</option>
    </select>

    <select v-model="timetableStudent" class="input">
      <option value="">All Students</option>
      <option v-for="u in users.filter(u => u.role==='student')" :key="u._id" :value="u._id">{{ u.name }}</option>
    </select>

    <select v-model="timetableDay" class="input">
      <option disabled value="">Select Day</option>
      <option v-for="d in days" :key="d">{{ d }}</option>
    </select>

    <select v-model="timetableTime" class="input">
      <option disabled value="">Select Time</option>
      <option v-for="t in times" :key="t">{{ t }}</option>
    </select>
  </div>

  <button @click="addSlot" class="btn primary mb-4">Add Slot</button>

  <!-- Timetable Table -->
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>Day</th>
          <th>Time</th>
          <th>Course</th>
          <th>Teacher</th>
          <th>Student</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="slot in timetable" :key="slot._id">
          <td>{{ slot.day }}</td>
          <td>{{ slot.time }}</td>
          <td>{{ slot.course?.name }}</td>
          <td>{{ slot.teacher?.name }}</td>
          <td>{{ slot.student?.name || "All" }}</td>
          <td>
            <button @click="removeSlot(slot._id)" class="btn danger small">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
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
                <button @click="approvePayment(p._id, 'approved')" class="btn success small">Approve</button>
                <button @click="approvePayment(p._id, 'rejected')" class="btn danger small">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

select.input {
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table td {
  vertical-align: middle;
}

.course-item span {
  font-size: 0.85rem;
}

/* ======================
   LAYOUT
====================== */
.dashboard {
  padding: 20px;
  background: #f5f7fb;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100vh;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
}

/* ======================
   CARD
====================== */
.card {
  background: #ffffff;
  padding: 20px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 14px rgba(0,0,0,0.05);
}

/* ======================
   GRID & ROW
====================== */
.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
  gap: 10px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* ======================
   INPUT
====================== */
.input {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #fafafa;
  transition: 0.2s;
}

.input:focus {
  background: #fff;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
  outline: none;
}

/* ======================
   BUTTONS
====================== */
.btn {
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn.primary {
  background: #2563eb;
  color: white;
}

.btn.success {
  background: #16a34a;
  color: white;
}

.btn.danger {
  background: #dc2626;
  color: white;
}

.btn.small {
  padding: 5px 10px;
  font-size: 12px;
}

/* ======================
   TABLE
====================== */
.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.table th {
  background: #111827;
  color: white;
  font-size: 0.85rem;
  text-align: left;
}

.table th,
.table td {
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.table tr:hover {
  background: #f9fafb;
}

/* ======================
   BADGES
====================== */
.badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: white;
  font-weight: 600;
}

.badge.teacher { background: #3b82f6; }
.badge.student { background: #10b981; }
.badge.parent  { background: #f59e0b; }

/* ======================
   COURSE GRID
====================== */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px,1fr));
  gap: 10px;
  margin: 10px 0;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: 0.2s;
}

.course-item:hover {
  background: #eef2ff;
  border-color: #6366f1;
}

.course-item input {
  accent-color: #4f46e5;
}

/* ======================
   TAGS
====================== */
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #e5e7eb;
}

.tag.blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.tag.green {
  background: #dcfce7;
  color: #15803d;
}

/* ======================
   MESSAGES
====================== */
.message {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

/* ======================
   PAGINATION
====================== */
.pagination {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

/* ======================
   DIVIDER
====================== */
.divider {
  height: 1px;
  background: #eee;
  margin: 15px 0;
}

/* ======================
   RESPONSIVE
====================== */
@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

</style>