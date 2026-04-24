import { onBeforeUnmount, ref, watch } from "vue";

export const useTypewriter = (source, { speed = 12 } = {}) => {
  const output = ref("");
  let timerId = null;

  const stop = () => {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  watch(
    source,
    (nextValue = "") => {
      stop();
      output.value = "";

      if (!nextValue) {
        return;
      }

      let index = 0;
      timerId = window.setInterval(() => {
        output.value = nextValue.slice(0, index + 1);
        index += 1;

        if (index >= nextValue.length) {
          stop();
        }
      }, speed);
    },
    { immediate: true }
  );

  onBeforeUnmount(stop);

  return {
    output,
  };
};
