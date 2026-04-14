<script setup>
import { computed, onMounted, ref } from "vue";
import API from "@/services/api";
import { getUsers } from "@/services/userService";

const users = ref([]);
const history = ref([]);

const parentId = ref("");
const selectedStudentIds = ref([]);

const editId = ref(null);
const editParent = ref("");
const editStudent = ref("");

const loading = ref(false);
const deletingAll = ref(false);
const statusMessage = ref("");
const statusTone = ref("primary");

const parents = computed(() =>
  users.value.filter((user) => user.role === "parent")
);

const students = computed(() =>
  users.value.filter((user) => user.role === "student")
);

const linkedCounts = computed(() => {
  return history.value.reduce((acc, item) => {
    const parentKey = item.parent?._id;

    if (!parentKey) {
      return acc;
    }

    acc[parentKey] = (acc[parentKey] || 0) + 1;
    return acc;
  }, {});
});

const showStatus = (message, tone = "primary") => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const fetchUsers = async () => {
  users.value = await getUsers();
};

const fetchHistory = async () => {
  const res = await API.get("/relationships/history");
  history.value = res.data;
};

const refreshAll = async () => {
  await Promise.all([fetchUsers(), fetchHistory()]);
};

const linkParent = async () => {
  if (!parentId.value || selectedStudentIds.value.length === 0) {
    showStatus("Select one parent and at least one child.", "danger");
    return;
  }

  loading.value = true;
  statusMessage.value = "";

  try {
    const res = await API.post("/relationships/link", {
      parentId: parentId.value,
      studentIds: selectedStudentIds.value,
    });

    parentId.value = "";
    selectedStudentIds.value = [];
    await refreshAll();
    showStatus(res.data?.message || "Parent linked successfully.", "success");
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to link parent and children.",
      "danger"
    );
  } finally {
    loading.value = false;
  }
};

const removeLink = async (id) => {
  if (!confirm("Delete this parent-child link?")) {
    return;
  }

  try {
    await API.delete(`/relationships/${id}`);
    await fetchHistory();
    showStatus("Link removed successfully.", "success");
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to delete this link.",
      "danger"
    );
  }
};

const startEdit = (item) => {
  editId.value = item._id;
  editParent.value = item.parent?._id || "";
  editStudent.value = item.student?._id || "";
};

const cancelEdit = () => {
  editId.value = null;
  editParent.value = "";
  editStudent.value = "";
};

const updateLink = async () => {
  if (!editParent.value || !editStudent.value) {
    showStatus("Select both a parent and a child to update.", "danger");
    return;
  }

  try {
    await API.put(`/relationships/${editId.value}`, {
      parentId: editParent.value,
      studentId: editStudent.value,
    });

    cancelEdit();
    await refreshAll();
    showStatus("Link updated successfully.", "success");
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to update this link.",
      "danger"
    );
  }
};

const handleDeleteAllLinks = async () => {
  if (!confirm("Delete all parent-child links for this school?")) {
    return;
  }

  deletingAll.value = true;

  try {
    await API.delete("/relationships");
    await refreshAll();
    showStatus("All links deleted successfully.", "success");
  } catch (error) {
    showStatus(
      error.response?.data?.message || "Unable to clear all links.",
      "danger"
    );
  } finally {
    deletingAll.value = false;
  }
};

onMounted(refreshAll);
</script>

<template>
  <section class="card relationships-card">
    <div class="section-head">
      <div>
        <h2 class="section-title">Parent And Child Linking</h2>
        <p class="section-copy">
          Link one parent to one or many children, then review every saved relationship below.
        </p>
      </div>
      <div class="quick-stat">
        <strong>{{ history.length }}</strong>
        <span>saved links</span>
      </div>
    </div>

    <div v-if="statusMessage" class="status-banner" :class="`status-${statusTone}`">
      {{ statusMessage }}
    </div>

    <div class="form-shell">
      <div class="field">
        <label class="field-label">Parent</label>
        <select v-model="parentId" class="input">
          <option disabled value="">Select Parent</option>
          <option v-for="parent in parents" :key="parent._id" :value="parent._id">
            {{ parent.name }} · {{ linkedCounts[parent._id] || 0 }} linked
          </option>
        </select>
      </div>

      <div class="field">
        <label class="field-label">Children</label>
        <div class="selection-grid">
          <label
            v-for="student in students"
            :key="student._id"
            class="selection-card"
          >
            <input v-model="selectedStudentIds" type="checkbox" :value="student._id" />
            <span>{{ student.name }}</span>
          </label>
        </div>
      </div>

      <div class="toolbar">
        <button
          @click="linkParent"
          class="btn btn-primary"
          :disabled="loading"
        >
          {{ loading ? "Linking..." : "Link Parent To Children" }}
        </button>
        <button @click="fetchHistory" class="btn btn-secondary">
          Refresh History
        </button>
        <button
          @click="handleDeleteAllLinks"
          class="btn btn-danger"
          :disabled="deletingAll"
        >
          {{ deletingAll ? "Deleting..." : "Delete All Links" }}
        </button>
      </div>
    </div>

    <div class="history-shell">
      <div v-if="history.length === 0" class="empty">
        No parent-child links have been created yet.
      </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Parent</th>
              <th>Child</th>
              <th>Linked By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in history" :key="item._id">
              <template v-if="editId === item._id">
                <td>
                  <select v-model="editParent" class="input">
                    <option v-for="parent in parents" :key="parent._id" :value="parent._id">
                      {{ parent.name }}
                    </option>
                  </select>
                </td>
                <td>
                  <select v-model="editStudent" class="input">
                    <option v-for="student in students" :key="student._id" :value="student._id">
                      {{ student.name }}
                    </option>
                  </select>
                </td>
                <td>{{ item.linkedBy?.name || "Admin" }}</td>
                <td>{{ new Date(item.createdAt).toLocaleDateString() }}</td>
                <td class="actions">
                  <button @click="updateLink" class="btn btn-success btn-small">Save</button>
                  <button @click="cancelEdit" class="btn btn-secondary btn-small">Cancel</button>
                </td>
              </template>

              <template v-else>
                <td>{{ item.parent?.name }}</td>
                <td>{{ item.student?.name }}</td>
                <td>{{ item.linkedBy?.name || "Admin" }}</td>
                <td>{{ new Date(item.createdAt).toLocaleDateString() }}</td>
                <td class="actions">
                  <button @click="startEdit(item)" class="btn btn-primary btn-small">
                    Edit
                  </button>
                  <button @click="removeLink(item._id)" class="btn btn-danger btn-small">
                    Delete
                  </button>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.relationships-card {
  padding: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.quick-stat {
  min-width: 110px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 64, 175, 0.92));
  color: #fff;
  text-align: center;
}

.quick-stat strong {
  display: block;
  font-size: 1.35rem;
}

.quick-stat span {
  font-size: 0.82rem;
  opacity: 0.8;
}

.status-banner {
  margin-bottom: 18px;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 600;
}

.status-success {
  background: rgba(21, 128, 61, 0.12);
  color: #166534;
}

.status-danger {
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
}

.status-primary {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.form-shell {
  display: grid;
  gap: 18px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 1));
}

.field {
  display: grid;
  gap: 10px;
}

.field-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.selection-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 16px;
  background: #fff;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-shell {
  margin-top: 22px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-small {
  padding: 8px 12px;
  font-size: 0.82rem;
}

@media (max-width: 768px) {
  .section-head {
    flex-direction: column;
  }

  .quick-stat {
    width: 100%;
  }
}
</style>
