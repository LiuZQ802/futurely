<template>
  <div
    class="header"
    @mousedown="startDrag"
  >
    <div class="left">
      <span class="title">📋 桌面清单</span>
      <span v-if="activeCount > 0" class="count">{{ activeCount }}</span>
    </div>
    <div class="actions" @mousedown.stop>
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

function startDrag(e) {
  if (e.button !== 0) return

  const onMove = async (ev) => {
    await window.electronAPI?.dragWindow({ mouseX: ev.movementX, mouseY: ev.movementY })
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  cursor: grab;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header:active {
  cursor: grabbing;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.count {
  background: var(--accent);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
}

.actions {
  display: flex;
  gap: 4px;
}

.btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  line-height: 1;
}

.btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}
</style>
