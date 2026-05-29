<template>
  <div class="root">
    <!-- 折叠态：小圆钮 -->
    <MiniButton v-if="collapsed" @expand="expand" />

    <!-- 展开态：主面板 -->
    <div v-else class="widget">
      <WidgetHeader
        @collapse="collapse"
        @open-settings="showSettings = true"
        @add-task="showForm = true"
      />

      <div class="body">
        <TaskList @edit-task="openEdit" />
      </div>
    </div>

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

async function collapse() {
  collapsed.value = true
  await window.electronAPI.collapseWindow()
}

async function expand() {
  collapsed.value = false
  await window.electronAPI.expandWindow()
}

function openEdit(task) {
  editingTask.value = task
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingTask.value = null
}
</script>

<style scoped>
.root {
  width: 100vw;
  height: 100vh;
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
</style>
