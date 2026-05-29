<template>
  <div class="root">
    <!-- 折叠态：小方块按钮 -->
    <MiniButton v-if="collapsed" @expand="expand" />

    <!-- 展开态：主面板 + 四周调整大小手柄 -->
    <template v-else>
      <!-- 调整大小手柄（四边 + 四角） -->
      <div
        v-for="dir in resizeDirs"
        :key="dir"
        :class="['resize-handle', `resize-${dir}`]"
        @mousedown.stop="startResize(dir, $event)"
      />

      <div class="widget">
        <WidgetHeader
          @collapse="collapse"
          @open-settings="showSettings = true"
          @add-task="showForm = true"
        />
        <div class="body">
          <TaskList @edit-task="openEdit" />
        </div>
      </div>
    </template>

    <!-- 新建/编辑弹窗 -->
    <TaskForm
      v-if="showForm"
      :task="editingTask"
      @close="closeForm"
    />

    <!-- 设置面板 -->
    <SettingsPanel v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MiniButton from './MiniButton.vue'
import WidgetHeader from './WidgetHeader.vue'
import TaskList from './TaskList.vue'
import TaskForm from './TaskForm.vue'
import SettingsPanel from './SettingsPanel.vue'

const collapsed = ref(false)
const showForm = ref(false)
const showSettings = ref(false)
const editingTask = ref(null)

const resizeDirs = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']

async function collapse() {
  collapsed.value = true
  await window.electronAPI?.collapseWindow()
}

async function expand() {
  collapsed.value = false
  await window.electronAPI?.expandWindow()
}

function openEdit(task) {
  editingTask.value = task
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingTask.value = null
}

// ── 四周拖拽调整大小 ──────────────────────────────────
async function startResize(dir, e) {
  if (e.button !== 0) return
  e.preventDefault()

  const api = window.electronAPI
  if (!api) return

  const initBounds = await api.getBounds()
  const initMouseX  = e.screenX
  const initMouseY  = e.screenY
  const MIN_W = 280
  const MIN_H = 360

  const onMove = async (ev) => {
    const dx = ev.screenX - initMouseX
    const dy = ev.screenY - initMouseY

    let { x, y, width, height } = initBounds

    if (dir.includes('e')) width  = Math.max(MIN_W, width  + dx)
    if (dir.includes('s')) height = Math.max(MIN_H, height + dy)
    if (dir.includes('w')) {
      const newW = Math.max(MIN_W, width - dx)
      x = x + (width - newW)
      width = newW
    }
    if (dir.includes('n')) {
      const newH = Math.max(MIN_H, height - dy)
      y = y + (height - newH)
      height = newH
    }

    await api.resizeWindow({ x, y, width, height })
  }

  const onUp = async () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    // 保存新尺寸
    const b = await api.getBounds()
    await api.saveWindowSize({ width: b.width, height: b.height })
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.root {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.widget {
  width: 100%;
  height: 100%;
  background: var(--bg-base);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── 四周拖拽手柄 ── */
.resize-handle {
  position: absolute;
  z-index: 200;
}

/* 四边 */
.resize-n  { top: 0;    left: 8px;  right: 8px;  height: 6px; cursor: n-resize; }
.resize-s  { bottom: 0; left: 8px;  right: 8px;  height: 6px; cursor: s-resize; }
.resize-e  { right: 0;  top: 8px;   bottom: 8px; width:  6px; cursor: e-resize; }
.resize-w  { left: 0;   top: 8px;   bottom: 8px; width:  6px; cursor: w-resize; }

/* 四角 */
.resize-nw { top: 0;    left: 0;    width: 12px; height: 12px; cursor: nw-resize; }
.resize-ne { top: 0;    right: 0;   width: 12px; height: 12px; cursor: ne-resize; }
.resize-sw { bottom: 0; left: 0;    width: 12px; height: 12px; cursor: sw-resize; }
.resize-se { bottom: 0; right: 0;   width: 12px; height: 12px; cursor: se-resize; }
</style>
