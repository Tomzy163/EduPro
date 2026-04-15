<script setup>
import { computed, onMounted, ref } from "vue";
import { createUser, deleteUser, getUsers } from "@/services/userService";

const users = ref([]);
const search = ref("");
const roleFilter = ref("all");
const currentPage = ref(1);
const pageSize = 8;

const name = ref("");
const email = ref("");
const phoneNumber = ref("");
const password = ref("");
const role = ref("teacher");

const fetchUsers = async () => {
  users.value = await getUsers();
};

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.value.toLowerCase()) ||
      user.email.toLowerCase().includes(search.value.toLowerCase());

    const matchesRole =
      roleFilter.value === "all" || user.role === roleFilter.value;

    return matchesSearch && matchesRole;
  })
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredUsers.value.length / pageSize))
);

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredUsers.value.slice(start, start + pageSize);
});

const addUser = async () => {
  if (!name.value || !email.value || !password.value) {
    alert("Fill all user fields.");
    return;
  }

  await createUser({
    name: name.value,
    email: email.value,
    phoneNumber: phoneNumber.value,
    password: password.value,
    role: role.value,
  });

  name.value = "";
  email.value = "";
  phoneNumber.value = "";
  password.value = "";
  role.value = "teacher";

  await fetchUsers();
};

const removeUser = async (id) => {
  await deleteUser(id);
  await fetchUsers();
};

onMounted(fetchUsers);
</script>

<template>
  <section class="card admin-users">
    <h2 class="section-title">Create And Manage Users</h2>

    <div class="form-grid">
      <input v-model="name" placeholder="Name" class="input" />
      <input v-model="email" placeholder="Email" class="input" />
      <input v-model="phoneNumber" placeholder="Phone number" class="input" />
      <input v-model="password" placeholder="Password" class="input" />

      <select v-model="role" class="input">
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
        <option value="parent">Parent</option>
      </select>

      <button @click="addUser" class="btn btn-primary">Create User</button>
    </div>

    <div class="filter-bar">
      <input v-model="search" placeholder="Search by name or email" class="input" />

      <select v-model="roleFilter" class="input">
        <option value="all">All Roles</option>
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
        <option value="parent">Parent</option>
        <option value="admin">Admin</option>
      </select>
    </div>

    <div v-if="filteredUsers.length === 0" class="empty">
      No users match the current filter.
    </div>

    <div v-else class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="user in paginatedUsers" :key="user._id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.phoneNumber || "-" }}</td>
            <td><span class="badge primary">{{ user.role }}</span></td>
            <td>{{ new Date(user.createdAt).toLocaleDateString() }}</td>
            <td>
              <button @click="removeUser(user._id)" class="btn btn-danger">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button
        class="btn btn-success"
        @click="currentPage--"
        :disabled="currentPage === 1"
      >
        Prev
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="btn btn-primary"
        @click="currentPage++"
        :disabled="currentPage === totalPages"
      >
        Next
      </button>
    </div>
  </section>
</template>

<style scoped>
.admin-users {
  padding: 24px;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
}
</style>
