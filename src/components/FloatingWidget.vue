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
          @open-about="showAbout = true"
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

    <!-- 关于面板 -->
    <AboutPanel v-if="showAbout" @close="showAbout = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MiniButton from './MiniButton.vue'
import WidgetHeader from './WidgetHeader.vue'
import TaskList from './TaskList.vue'
import TaskForm from './TaskForm.vue'
import SettingsPanel from './SettingsPanel.vue'
import AboutPanel from './AboutPanel.vue'

const collapsed = ref(false)
const showForm = ref(false)
const showSettings = ref(false)
const showAbout = ref(false)
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

// 失焦自动折叠（弹窗打开时不折叠）
onMounted(() => {
  window.electronAPI?.onWindowBlur(() => {
    if (!collapsed.value && !showForm.value && !showSettings.value && !showAbout.value) {
      collapse()
    }
  })
})

// ── 四周拖拽调整大小（使用 movementX/Y，无坐标系差异）─────────────
async function startResize(dir, e) {
  if (e.button !== 0) return
  e.preventDefault()

  const api = window.electronAPI
  if (!api) return

  // 在主进程处理 resize，避免渲染进程 DPI 转换问题
  await api.startResize(dir)

  const onUp = async () => {
    window.removeEventListener('mouseup', onUp)
    await api.stopResize()
  }
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
  background: var(--layer0);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--layer1-border);
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
