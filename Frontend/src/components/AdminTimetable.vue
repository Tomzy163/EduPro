<script setup>
import { ref, onMounted } from "vue";
import API from "../services/api"; // Adjust API for timetable backend

// Days and time slots
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "1:00-2:00"];

const timetable = ref([]);

// Form for adding/editing
const editing = ref(null);
const form = ref({
  day: "",
  time: "",
  course: "",
  teacher: "",
});

// Fetch timetable from API
const fetchTimetable = async () => {
  const res = await API.get("/timetable");
  timetable.value = res.data;
};

// Add or update slot
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
};

// Edit a slot
const editSlot = (slot) => {
  editing.value = slot;
  form.value = { ...slot };
};

// Delete a slot
const deleteSlot = async (id) => {
  if (confirm("Delete this slot?")) {
    await API.delete(`/timetable/${id}`);
    fetchTimetable();
  }
};

onMounted(fetchTimetable);

// Get course for table cell
const getCourse = (day, time) => {
  const slot = timetable.value.find(s => s.day === day && s.time === time);
  return slot ? `${slot.course} (${slot.teacher})` : "";
};
</script>

<template>
  <section class="card">
    <h2 class="section-title">Timetable</h2>

    <!-- ADD/EDIT FORM -->
    <div class="grid grid-cols-4 gap-3 mb-4">
      <select v-model="form.day" class="input">
        <option disabled value="">Select Day</option>
        <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
      </select>

      <select v-model="form.time" class="input">
        <option disabled value="">Select Time</option>
        <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>
      </select>

      <input v-model="form.course" placeholder="Course Name" class="input" />
      <input v-model="form.teacher" placeholder="Teacher Name" class="input" />

      <button @click="saveSlot" class="btn btn-primary col-span-4">
        {{ editing ? "Update Slot" : "Add Slot" }}
      </button>
    </div>

    <!-- TIMETABLE TABLE -->
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Time</th>
            <th v-for="day in days" :key="day">{{ day }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in timeSlots" :key="slot">
            <td>{{ slot }}</td>
            <td v-for="day in days" :key="day">
              <div class="timetable-cell flex justify-between items-center">
                <span>{{ getCourse(day, slot) || "-" }}</span>
                <div class="space-x-1">
                  <button v-if="getCourse(day, slot)" @click="editSlot(timetable.value.find(s => s.day === day && s.time === slot))"
                    class="btn btn-sm btn-primary">Edit</button>
                  <button v-if="getCourse(day, slot)" @click="deleteSlot(timetable.value.find(s => s.day === day && s.time === slot)._id)"
                    class="btn btn-sm btn-danger">Delete</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.timetable-cell {
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}
.timetable-cell:hover {
  background: #e0e7ff;
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

.input {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  outline: none;
}
.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
}
</style>