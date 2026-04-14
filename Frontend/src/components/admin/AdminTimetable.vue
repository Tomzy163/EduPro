<script setup>
import { ref, onMounted } from "vue";
import API from "@/services/api";

// DATA
const timetable = ref([]);
const users = ref([]);
const courses = ref([]);
const classes = ref([]);
const rooms = ref([]);

// FORM STATE
const timetableClass = ref("");
const timetableCourse = ref("");
const timetableTeacher = ref("");
const timetableRoom = ref("");
const timetableDay = ref("");
const timetableTime = ref("");

const timetableDraft = ref([]);

// STATIC
const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const times = [
  "08:00am-09:00am",
  "09:00am-10:00am",
  "10:00am-11:00am",
  "11:00am-12:00pm",
  "12:00pm-01:00pm",
  "01:00pm-02:00pm",
  "02:00pm-03:00pm"
];

// FETCH ALL DATA
const fetchAll = async () => {
  try {
    const [t, u, c, cl, r] = await Promise.all([
      API.get("/timetable"),
      API.get("/users"),
      API.get("/courses"),
      API.get("/classes"),
      API.get("/rooms"),
    ]);

    timetable.value = t.data;
    users.value = u.data;
    courses.value = c.data;
    classes.value = cl.data;
    rooms.value = r.data;
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
};

const fetchTimetable = async () => {
  const res = await API.get("/timetable");
  timetable.value = res.data;
};

const fetchUsers = async () => {
  try {
    const res = await API.get("/users");
    users.value = res.data;
  } catch (err) {
    console.error(err);
  }
};


//Form for adding or editing a slot
const editing = ref(null);
const form = ref({
  day: "",
  time: "",
  course: "",
  teacher: "",
});


// ADD SLOT
const addSlot = () => {
  if (
    !timetableClass.value ||
    !timetableCourse.value ||
    !timetableTeacher.value ||
    !timetableRoom.value ||
    !timetableDay.value ||
    !timetableTime.value
  ) {
    return alert("Fill all fields");
  }

  timetableDraft.value.push({
    class: timetableClass.value,
    course: timetableCourse.value,
    teacher: timetableTeacher.value,
    room: timetableRoom.value,
    day: timetableDay.value,
    time: timetableTime.value,
  });

  // RESET
  timetableClass.value = "";
  timetableCourse.value = "";
  timetableTeacher.value = "";
  timetableRoom.value = "";
  timetableDay.value = "";
  timetableTime.value = "";
};

// SAVE
const saveAllSlots = async () => {
  await API.post("/timetable/bulk", timetableDraft.value);
  timetableDraft.value = [];
  fetchAll();
};

const saveSlot = async () => {
  if (!form.value.day || !form.value.time || !form.value.course || !form.value.teacher) {
    return alert("Fill all fields");
  }

  if (editing.value) {
    // Update existing slot
    await API.put(`/timetable/${editing.value._id}`, { ...form.value });
  } else {
    // Add new slot
    await API.post("/timetable", form.value);
  }

  form.value = { day: "", time: "", course: "", teacher: "" };
  editing.value = null;
  fetchTimetable();
}

const editSlot = (slot) => {
  editing.value = slot;
  form.value = {
  day: slot.day,
  time: slot.time,
  course: slot.course?._id || slot.course,
  teacher: slot.teacher?._id || slot.teacher,
};
};

const deleteSlot = async (id) => {
  if (confirm("Delete this slot?")) {
    await API.delete(`/timetable/${id}`);
    fetchTimetable();
  }
};

// Get course for table cell
const getCourse = (day, time) => {
  const slot = timetable.value.find(s => s.day === day && s.time === time);
  return slot
  ? `${slot.course?.name} (${slot.teacher?.name})`
  : "";
};

// DELETE
const removeSlot = async (id) => {
  await API.delete(`/timetable/${id}`);
  fetchAll();
};

onMounted(fetchAll, fetchUsers, fetchTimetable);
</script>

<template>
  <div class="dashboard">
              <h1>Admin Timetable Manager</h1>

              <!-- FORM -->
              <section class="card">
                <h2>Create Timetable</h2>

                <div class="grid">
                  <select v-model="timetableClass" class="input">
                    <option disabled value="">Class</option>
                    <option v-for="c in classes" :key="c._id" :value="c._id">{{ c.name }}</option>
                  </select>

                  <select v-model="timetableCourse" class="input">
                    <option disabled value="">Course</option>
                    <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.name }}</option>
                  </select>

                  <select v-model="timetableTeacher" class="input">
                    <option disabled value="">Teacher</option>
                    <option v-for="u in users.filter(u=>u.role==='teacher')" :value="u._id">{{ u.name }}</option>
                  </select>

                  <select v-model="timetableRoom" class="input">
                    <option disabled value="">Room</option>
                    <option v-for="r in rooms" :key="r._id" :value="r._id">{{ r.name }}</option>
                  </select>

                  <select v-model="timetableDay" class="input">
                    <option disabled value="">Day</option>
                    <option v-for="d in days" :key="d">{{ d }}</option>
                  </select>

                  <select v-model="timetableTime" class="input">
                    <option disabled value="">Time</option>
                    <option v-for="t in times" :key="t">{{ t }}</option>
                  </select>
                </div>

                <button @click="addSlot" class="btn primary">Add Slot</button>

                <!-- DRAFT -->
                <h3>Draft</h3>
                <div v-for="(slot,i) in timetableDraft" :key="i">
                  {{ slot.day }} | {{ slot.time }}
                </div>

                <button @click="saveAllSlots" class="btn success">Save All</button>
              </section>

              <!-- TABLE -->
              <section class="card">
                <h2>Timetable</h2>

                <table class="table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Class</th>
                      <th>Course</th>
                      <th>Teacher</th>
                      <th>Room</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="slot in timetable" :key="slot._id">
                      <td>{{ slot.day }}</td>
                      <td>{{ slot.time }}</td>
                      <td>{{ slot.class?.name }}</td>
                      <td>{{ slot.course?.name }}</td>
                      <td>{{ slot.teacher?.name }}</td>
                      <td>{{ slot.room?.name }}</td>

                      <td>
                        <button @click="removeSlot(slot._id)" class="btn danger small">Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: #f4f6fb;
}

/* CARD */
.card {
  background: #fff;
  padding: 20px;
  border-radius: 14px;
  box-shadow: 0 6px 14px rgba(0,0,0,0.06);
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
  gap: 10px;
  margin-bottom: 10px;
}

/* INPUT */
.input {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #fafafa;
}

/* BUTTON */
.btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  cursor: pointer;
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
  font-size: 12px;
  padding: 5px 10px;
}

/* TABLE */
.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.table th {
  background: #111827;
  color: white;
  padding: 10px;
}

.table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.table tr:hover {
  background: #f9fafb;
}
</style>