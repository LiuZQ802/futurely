<template>
  <div class="mini" @mousedown="onMouseDown">
    <span class="icon">📋</span>
    <span v-if="count > 0" class="badge">{{ count }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTaskStore } from '../store/tasks.js'

const emit = defineEmits(['expand'])
const store = useTaskStore()
const count = computed(() => store.activeTasks.length)

function onMouseDown(e) {
  if (e.button !== 0) return
  // 立即启动主进程轮询拖拽（不等移动阈值，消除初始偏移）
  window.electronAPI?.startDrag()

  const onUp = async () => {
    window.removeEventListener('mouseup', onUp)
    const moved = await window.electronAPI?.stopDrag()
    if (!moved) emit('expand')
  }
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.mini {
  width: 100vw;
  height: 100vh;
  border-radius: 14px;
  background: var(--layer0);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  position: relative;
  transition: background 0.15s;
}

.mini:hover {
  background: var(--layer1-hover);
}
.mini:active { cursor: grabbing; }

.icon {
  font-size: 24px;
  line-height: 1;
  pointer-events: none;
}

.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 17px;
  height: 17px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  pointer-events: none;
}
</style>
