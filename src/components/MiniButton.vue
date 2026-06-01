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
  // 记录 mousedown 时的窗口位置
  window.electronAPI?.recordPos()

  const onUp = async () => {
    window.removeEventListener('mouseup', onUp)
    // 如果窗口没移动 → 是点击 → 展开
    const moved = await window.electronAPI?.didMove()
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
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  position: relative;
  transition: background 0.15s;
  -webkit-app-region: drag;  /* OS 原生拖拽，零延迟零漂移 */
}

.mini:hover {
  background: rgba(25, 38, 65, 0.90);
}

.mini:active {
  cursor: grabbing;
}

.icon {
  font-size: 24px;
  line-height: 1;
  pointer-events: none;
  -webkit-app-region: no-drag;
}

.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #ef4444;
  color: white;
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
  -webkit-app-region: no-drag;
}
</style>
