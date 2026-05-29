<template>
  <div class="mini-wrap">
    <div class="mini" @mousedown="startDrag">
      <span class="icon">📋</span>
      <span v-if="count > 0" class="badge">{{ count }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTaskStore } from '../store/tasks.js'

const emit = defineEmits(['expand'])
const store = useTaskStore()
const count = computed(() => store.activeTasks.length)

function startDrag(e) {
  if (e.button !== 0) return
  let lastX = e.screenX
  let lastY = e.screenY
  let hasMoved = false

  const onMove = async (ev) => {
    const dx = ev.screenX - lastX
    const dy = ev.screenY - lastY
    if (!hasMoved && Math.abs(dx) + Math.abs(dy) > 4) hasMoved = true
    lastX = ev.screenX
    lastY = ev.screenY
    if (hasMoved) await window.electronAPI?.dragWindow({ mouseX: dx, mouseY: dy })
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
.mini-wrap {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.75);
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  position: relative;
  transition: transform 0.15s, background 0.15s;
  /* 不用 box-shadow，避免透明窗口下的黑色残影 */
}

.mini:hover {
  background: rgba(25, 35, 60, 0.85);
  transform: scale(1.06);
}

.mini:active {
  cursor: grabbing;
}

.icon {
  font-size: 22px;
  line-height: 1;
  pointer-events: none;
}

.badge {
  position: absolute;
  top: -3px;
  right: -3px;
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
