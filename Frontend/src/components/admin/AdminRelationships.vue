<script setup>
import { ref, onMounted } from "vue";
import API from "@/services/api";
import { getUsers } from "@/services/userService";

const users = ref([]);
const parentId = ref("");
const studentId = ref("");
const history = ref([]);

const editId = ref(null);
const editParent = ref("");
const editStudent = ref("");

// ✅ FETCH USERS
const fetchUsers = async () => {
  users.value = await getUsers();
};

// ✅ FETCH HISTORY
const fetchHistory = async () => {
  const res = await API.get("/relationships/history");
  history.value = res.data;
};

// ✅ LINK
const linkParent = async () => {
  if (!parentId.value || !studentId.value) {
    return alert("Select parent & student");
  }

  await API.post("/relationships/link", {
    parentId: parentId.value,
    studentId: studentId.value,
  });

  parentId.value = "";
  studentId.value = "";

  fetchHistory();
};

// ✅ DELETE
const removeLink = async (id) => {
  if (!confirm("Delete this link?")) return;

  await API.delete(`/relationships/${id}`);
  fetchHistory();
};

// ✅ EDIT START
const startEdit = (h) => {
  editId.value = h._id;
  editParent.value = h.parent._id;
  editStudent.value = h.student._id;
};

// ✅ UPDATE
const updateLink = async () => {
  await API.put(`/relationships/${editId.value}`, {
    parentId: editParent.value,
    studentId: editStudent.value,
  });

  editId.value = null;
  fetchHistory();
};

// ✅ DELETE ALL
const handleDeleteAllLinks = async () => {
  if (!confirm("Delete ALL links?")) return;

  await API.delete("/relationships");
  fetchHistory();
};

onMounted(() => {
  fetchUsers();
  fetchHistory();
});
</script>

<template>
  <section class="card">
    <h2 class="section-title">👨‍👩‍👧 Parent - Student Linking</h2>

    <!-- SELECT -->
    <div class="grid">
      <select v-model="parentId" class="input">
        <option disabled value="">Select Parent</option>
        <option
          v-for="u in users.filter(u => u.role === 'parent')"
          :key="u._id"
          :value="u._id"
        >
          {{ u.name }}
        </option>
      </select>

      <select v-model="studentId" class="input">
        <option disabled value="">Select Student</option>
        <option
          v-for="u in users.filter(u => u.role === 'student')"
          :key="u._id"
          :value="u._id"
        >
          {{ u.name }}
        </option>
      </select>

      <button @click="linkParent" class="btn primary">
        Link Parent
      </button>
    </div>

    <!-- ACTIONS -->
    <div class="row mt">
      <button @click="fetchHistory" class="btn small primary">
        Refresh
      </button>

      <button @click="handleDeleteAllLinks" class="btn small danger">
        Delete All
      </button>
    </div>

    <!-- HISTORY -->
    <div class="list">
      <div v-for="h in history" :key="h._id" class="list-item">

        <!-- EDIT MODE -->
        <div v-if="editId === h._id" class="edit-box">
          <select v-model="editParent" class="input">
            <option
              v-for="u in users.filter(u => u.role === 'parent')"
              :value="u._id"
            >
              {{ u.name }}
            </option>
          </select>

          <select v-model="editStudent" class="input">
            <option
              v-for="u in users.filter(u => u.role === 'student')"
              :value="u._id"
            >
              {{ u.name }}
            </option>
          </select>

          <button @click="updateLink" class="btn success small">Save</button>
        </div>

        <!-- NORMAL -->
        <div v-else class="info">
          <p>
            👨‍👩‍👧 <strong>{{ h.parent?.name }}</strong>
            →
            🎓 <strong>{{ h.student?.name }}</strong>
          </p>

          <div class="actions">
            <button @click="startEdit(h)" class="btn primary small">
              Edit
            </button>

            <button @click="removeLink(h._id)" class="btn danger small">
              Delete
            </button>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
  gap: 10px;
}

/* ROW */
.row {
  display: flex;
  gap: 10px;
}
.mt {
  margin-top: 10px;
}

/* LIST */
.list {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-item {
  background: #f9fafb;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-box {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* INPUT */
.input {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

/* BUTTONS */
.btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
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
}
</style>