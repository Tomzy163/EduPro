<script setup>
import { computed } from "vue";
import { useTypewriter } from "@/composables/useTypewriter";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  animate: {
    type: Boolean,
    default: true,
  },
});

const source = computed(() => props.text);
const { output } = useTypewriter(source, { speed: 10 });
</script>

<template>
  <span>{{ animate ? output : text }}</span>
</template>
