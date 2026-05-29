<template>
  <div class="mini" @click="$emit('expand')">
    <span class="icon">📋</span>
    <span v-if="count > 0" class="badge">{{ count }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTaskStore } from '../store/tasks.js'

defineEmits(['expand'])

const store = useTaskStore()
const count = computed(() => store.activeTasks.length)
</script>

<style scoped>
.mini {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-base);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: transform 0.15s;
}

.mini:hover {
  transform: scale(1.08);
}

.icon {
  font-size: 24px;
  line-height: 1;
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--priority-urgent);
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>
