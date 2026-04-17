<script setup>
import { ref, onMounted } from "vue";
import API from "@/services/api";
import { apiBaseUrl } from "@/services/runtimeConfig";

const payments = ref([]);
const uploadBaseUrl = `${apiBaseUrl.replace(/\/api$/, "")}/`;

const fetchPayments = async () => {
  const res = await API.get("/payments");
  payments.value = res.data;
};

const approvePayment = async (id, status) => {
  await API.put(`/payments/${id}`, { status });
  fetchPayments();
};

onMounted(fetchPayments);
</script>

<template>
  <section class="card">
    <h2 class="section-title">Payments</h2>
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Proof</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p._id">
            <td>{{ p.user?.name || "School" }}</td>
            <td>{{ p.type || "school_fee" }}</td>
            <td>{{ p.plan || "-" }}</td>
            <td>{{ Number(p.amount || 0).toLocaleString() }}</td>
            <td>{{ p.status }}</td>
            <td>
              <a v-if="p.receipt" :href="`${uploadBaseUrl}${p.receipt}`" target="_blank" rel="noreferrer">
                View proof
              </a>
              <span v-else>-</span>
            </td>
            <td>
              <button @click="approvePayment(p._id, 'approved')" class="btn success small">Approve</button>
              <button @click="approvePayment(p._id, 'rejected')" class="btn danger small">Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
