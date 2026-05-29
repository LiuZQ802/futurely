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
  let totalMoved = 0
  let hasMoved = false

  const scale = window.screenScale || 1
  const onMove = async (ev) => {
    totalMoved += Math.abs(ev.movementX) + Math.abs(ev.movementY)
    if (!hasMoved && totalMoved > 6) hasMoved = true
    if (hasMoved) {
      await window.electronAPI?.dragWindow({
        mouseX: Math.round(ev.movementX / scale),
        mouseY: Math.round(ev.movementY / scale),
      })
    }
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    if (!hasMoved) emit('expand')
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
/* 填满整个折叠窗口区域，消除透明间隙 */
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
}
</style>
