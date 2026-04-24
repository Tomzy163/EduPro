<script setup>
import { computed, onMounted, ref } from "vue";
import Notifications from "@/components/Notifications.vue";
import ProfileManager from "@/components/ProfileManager.vue";
import PlanFeatureGate from "@/components/PlanFeatureGate.vue";
import SchoolAccountCard from "@/components/SchoolAccountCard.vue";
import TeacherAnalytics from "@/components/teacher/TeacherAnalytics.vue";
import TeacherResults from "@/components/teacher/TeacherResults.vue";
import TeacherAttendance from "@/components/teacher/TeacherAttendance.vue";
import TeacherCourseSelector from "@/components/teacher/TeacherCourseSelector.vue";
import UserTimetable from "@/components/UserTimetable.vue";
import { useAuthStore } from "@/store/authStore";
import { getMySchool } from "@/services/schoolService";

const auth = useAuthStore();
const schoolData = ref(auth.school || null);
const school = computed(() => schoolData.value || auth.school);

onMounted(async () => {
  try {
    const response = await getMySchool();
    schoolData.value = response.school;
    auth.updateSchool(response.school);
  } catch (error) {
    console.error("Failed to load teacher school profile:", error);
  }
});
</script>

<template>
  <div class="dashboard teacher-dashboard">
    <header class="dashboard-header">
      <div>
        <h1 class="page-title">Teacher Dashboard</h1>
        <p class="page-subtitle">
          Manage classes, attendance, results, and daily teaching flow from one workspace.
        </p>
      </div>
    </header>

    <Notifications />
    <TeacherAnalytics />
    <ProfileManager />

    <section class="teacher-ai-grid">
      <PlanFeatureGate
        feature="ai_exam_generator"
        title="Teacher Exam Generator"
        copy="Generate multiple-choice and theory tests with marking guides on the Premium plan."
      >
        <article class="card panel ai-card">
          <h2 class="section-title">AI Exam Generator</h2>
          <p class="section-copy">
            Build exams faster with structured questions, correct answers, and marking schemes.
          </p>
          <router-link to="/dashboard/teacher/exam-generator" class="btn btn-primary">
            Open Generator
          </router-link>
        </article>
      </PlanFeatureGate>

      <PlanFeatureGate
        feature="ai_report_comments"
        title="AI Report Comments"
        copy="Generate polished report comments on the Premium plan."
      >
        <article class="card panel ai-card">
          <h2 class="section-title">AI Report Comments</h2>
          <p class="section-copy">
            Turn live result and attendance data into personalized, polished student feedback.
          </p>
          <router-link to="/dashboard/teacher/report-comments" class="btn btn-primary">
            Open Comment Tool
          </router-link>
        </article>
      </PlanFeatureGate>
    </section>

    <SchoolAccountCard
      :school="school"
      title="School Account Number"
      subtitle="Teachers can quickly confirm the official account details configured by the admin."
    />

    <section class="card panel">
      <h2 class="section-title">Class Timetable</h2>
      <UserTimetable />
    </section>

    <section class="grid-2">
      <TeacherCourseSelector />
      <TeacherAttendance />
    </section>

    <TeacherResults />
  </div>
</template>

<style scoped>
.teacher-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel {
  padding: 24px;
}

.teacher-ai-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.ai-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-copy {
  margin: 0;
  color: var(--text-soft);
}

@media (max-width: 900px) {
  .teacher-ai-grid {
    grid-template-columns: 1fr;
  }
}
</style>
