<script setup>
import { onMounted, ref } from "vue";
import { getAdminInsights, getAiUsageSummary } from "@/services/aiService";
import UsageCounter from "@/components/ai/UsageCounter.vue";
import { useAuthStore } from "@/store/authStore";

const auth = useAuthStore();

const months = ref(6);
const metrics = ref(null);
const insights = ref(null);
const usage = ref(null);
const configured = ref(true);
const loading = ref(false);
const statusMessage = ref("");

const loadUsage = async () => {
  const summary = await getAiUsageSummary();
  usage.value = summary.usage;
  configured.value = summary.configured;
};

const loadInsights = async () => {
  loading.value = true;
  statusMessage.value = "";

  try {
    const response = await getAdminInsights({
      schoolId: auth.school?._id || auth.user?.schoolId,
      months: months.value,
    });

    metrics.value = response.metrics;
    insights.value = response.insights;
    usage.value = response.usage;
    configured.value = response.configured;
  } catch (error) {
    statusMessage.value =
      error.response?.data?.message || "Unable to load AI insights right now.";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await loadUsage();
    await loadInsights();
  } catch (error) {
    statusMessage.value = error.response?.data?.message || "Unable to load AI insights.";
  }
});
</script>

<template>
  <div class="dashboard ai-page">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">AI Admin Analytics</h1>
        <p class="page-subtitle">
          Turn attendance, performance, revenue, and teacher activity into executive-ready school insights.
        </p>
      </div>
      <div class="filters">
        <select v-model="months" class="input">
          <option :value="3">Last 3 months</option>
          <option :value="6">Last 6 months</option>
          <option :value="12">Last 12 months</option>
        </select>
        <button type="button" class="btn btn-primary" :disabled="loading" @click="loadInsights">
          {{ loading ? "Refreshing..." : "Refresh Insights" }}
        </button>
      </div>
    </header>

    <UsageCounter :usage="usage" feature="ai_admin_analytics" />

    <section v-if="!configured" class="card panel info-banner">
      OpenAI is not configured yet. The dashboard will still show the live data metrics once generated.
    </section>

    <section v-if="statusMessage" class="card panel error-banner">
      {{ statusMessage }}
    </section>

    <section v-if="insights" class="grid-3">
      <article class="stat-card">
        <p>Headline</p>
        <h3>{{ insights.headline }}</h3>
      </article>
      <article class="stat-card">
        <p>Weak subjects</p>
        <h3>{{ metrics?.weakSubjects?.length ?? 0 }}</h3>
      </article>
      <article class="stat-card">
        <p>Top students</p>
        <h3>{{ metrics?.topPerformingStudents?.length ?? 0 }}</h3>
      </article>
    </section>

    <section class="insights-grid">
      <article class="card panel insight-panel">
        <h2 class="section-title">AI Summary</h2>
        <p class="summary-copy">{{ insights?.summary || "Executive summary will appear here." }}</p>
        <div class="insight-columns">
          <div>
            <h3>Wins</h3>
            <ul class="insight-list">
              <li v-for="item in insights?.wins || []" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div>
            <h3>Risks</h3>
            <ul class="insight-list">
              <li v-for="item in insights?.risks || []" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div>
            <h3>Recommendations</h3>
            <ul class="insight-list">
              <li v-for="item in insights?.recommendations || []" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </article>

      <article class="card panel">
        <h2 class="section-title">Attendance Trends</h2>
        <div v-if="metrics?.attendanceTrends?.length" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Present</th>
                <th>Absent</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in metrics.attendanceTrends" :key="item.month">
                <td>{{ item.month }}</td>
                <td>{{ item.present }}</td>
                <td>{{ item.absent }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">Attendance trend data will appear here.</div>
      </article>

      <article class="card panel">
        <h2 class="section-title">Weak Subjects</h2>
        <div v-if="metrics?.weakSubjects?.length" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Average Score</th>
                <th>Entries</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in metrics.weakSubjects" :key="item.courseName">
                <td>{{ item.courseName }}</td>
                <td>{{ item.averageScore }}</td>
                <td>{{ item.entries }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">Weak subject analytics will appear here.</div>
      </article>

      <article class="card panel">
        <h2 class="section-title">Top Performing Students</h2>
        <div v-if="metrics?.topPerformingStudents?.length" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Average Score</th>
                <th>Results Count</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in metrics.topPerformingStudents" :key="item.name">
                <td>{{ item.name }}</td>
                <td>{{ item.averageScore }}</td>
                <td>{{ item.resultsCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">Top student analytics will appear here.</div>
      </article>

      <article class="card panel">
        <h2 class="section-title">Fee Payment Trends</h2>
        <div v-if="metrics?.feePaymentTrends?.length" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Approved</th>
                <th>Pending</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in metrics.feePaymentTrends" :key="item.month">
                <td>{{ item.month }}</td>
                <td>{{ item.approvedAmount }}</td>
                <td>{{ item.pendingAmount }}</td>
                <td>{{ item.totalTransactions }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">Fee payment trends will appear here.</div>
      </article>

      <article class="card panel">
        <h2 class="section-title">Teacher Activity</h2>
        <div v-if="metrics?.teacherActivity?.length" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Courses</th>
                <th>Results Uploaded</th>
                <th>Messages</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in metrics.teacherActivity" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.totalCourses }}</td>
                <td>{{ item.totalResultsUploaded }}</td>
                <td>{{ item.totalMessagesSent }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty">Teacher activity will appear here.</div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel {
  padding: 22px;
}

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.insight-panel {
  grid-column: 1 / -1;
}

.summary-copy {
  color: var(--text-soft);
  line-height: 1.65;
}

.insight-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.insight-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--text-soft);
}

.info-banner {
  background: rgba(37, 99, 235, 0.08);
}

.error-banner {
  background: rgba(220, 38, 38, 0.08);
  color: #991b1b;
}

@media (max-width: 960px) {
  .insights-grid,
  .insight-columns {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
