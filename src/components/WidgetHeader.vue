<template>
  <div class="header">
    <div class="left">
      <span class="title">📋 桌面清单</span>
      <span v-if="activeCount > 0" class="count">{{ activeCount }}</span>
    </div>
    <div class="actions">
      <button class="btn" title="新建任务" @click="$emit('add-task')">＋</button>
      <button class="btn" title="设置" @click="$emit('open-settings')">⚙</button>
      <button class="btn" title="折叠" @click="$emit('collapse')">—</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTaskStore } from '../store/tasks.js'

defineEmits(['collapse', 'open-settings', 'add-task'])

const store = useTaskStore()
const activeCount = computed(() => store.activeTasks.length)
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px 10px;
  cursor: grab;
  border-bottom: 1px solid var(--layer1-border);
  background: var(--layer2-header);
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  color: var(--t1);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.count {
  background: var(--accent-dim);
  color: var(--accent-hover);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  border: 1px solid var(--accent-dim);
}

.actions {
  display: flex;
  gap: 2px;
  -webkit-app-region: no-drag;
}

.btn {
  background: transparent;
  border: none;
  color: var(--t2);
  cursor: pointer;
  font-size: 15px;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  line-height: 1;
  -webkit-app-region: no-drag;
}

.btn:hover {
  background: var(--layer1-hover);
  color: var(--t1);
}
</style>
