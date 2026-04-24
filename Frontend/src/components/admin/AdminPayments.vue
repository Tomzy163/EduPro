<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import API from "@/services/api";
import { apiBaseUrl } from "@/services/runtimeConfig";
import { clearPayments, deletePayment } from "@/services/paymentService";
import socket from "@/socket";

const payments = ref([]);
const statusMessage = ref("");
const statusTone = ref("primary");
const uploadBaseUrl = `${apiBaseUrl.replace(/\/api$/, "")}/`;

const showStatus = (message, tone = "primary") => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const fetchPayments = async () => {
  const res = await API.get("/payments");
  payments.value = res.data;
};

const approvePayment = async (id, status) => {
  await API.put(`/payments/${id}`, { status });
  await fetchPayments();
};

const removePayment = async (id) => {
  if (!confirm("Delete this payment record?")) {
    return;
  }

  try {
    await deletePayment(id);
    showStatus("Payment deleted successfully.", "success");
    await fetchPayments();
  } catch (error) {
    showStatus(error.response?.data?.message || "Unable to delete this payment.", "danger");
  }
};

const clearAllPayments = async () => {
  if (!confirm("Clear all payment history for this school?")) {
    return;
  }

  try {
    await clearPayments();
    showStatus("Payment history cleared successfully.", "success");
    await fetchPayments();
  } catch (error) {
    showStatus(error.response?.data?.message || "Unable to clear payment history.", "danger");
  }
};

onMounted(async () => {
  await fetchPayments();
  socket.on("paymentUpdated", fetchPayments);
});

onUnmounted(() => {
  socket.off("paymentUpdated", fetchPayments);
});
</script>

<template>
  <section class="card">
    <div class="section-head">
      <div>
        <h2 class="section-title">Payments</h2>
        <p class="section-copy">
          Review uploaded payment receipts, approve or reject them, and clear or delete history records when needed.
        </p>
      </div>
      <button @click="clearAllPayments" class="btn danger small">Clear All</button>
    </div>

    <div v-if="statusMessage" class="status-banner" :class="`status-${statusTone}`">
      {{ statusMessage }}
    </div>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Child</th>
            <th>Receipt No</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Proof</th>
            <th>Review</th>
            <th>History</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p._id">
            <td>{{ p.user?.name || "School" }}</td>
            <td>{{ p.student?.name || p.studentNameSnapshot || "-" }}</td>
            <td>{{ p.receiptNumber || "-" }}</td>
            <td>{{ Number(p.amount || 0).toLocaleString() }}</td>
            <td>{{ p.status }}</td>
            <td>
              <a v-if="p.receipt" :href="`${uploadBaseUrl}${p.receipt}`" target="_blank" rel="noreferrer">
                View proof
              </a>
              <span v-else>-</span>
            </td>
            <td class="action-group">
              <button @click="approvePayment(p._id, 'approved')" class="btn success small">Approve</button>
              <button @click="approvePayment(p._id, 'rejected')" class="btn danger small">Reject</button>
            </td>
            <td>
              <button @click="removePayment(p._id)" class="btn danger small">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.section-copy {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.status-banner {
  margin-bottom: 16px;
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

.action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .section-head {
    flex-direction: column;
  }
}
</style>
