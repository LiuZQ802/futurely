<template>
  <div class="header">
    <div class="left">
      <span class="title">📋 桌面清单</span>
      <span v-if="activeCount > 0" class="count">{{ activeCount }}</span>
      <!-- 吸附状态标签 -->
      <span v-if="snapEdge" class="snap-badge" :title="snapBadgeTitle">
        {{ snapEdgeIcon }}
        <span v-if="autoHide" class="autohide-dot" title="贴边自动隐藏已开启" />
      </span>
    </div>
    <div class="actions">
      <button class="btn" title="新建任务" @click="$emit('add-task')">＋</button>
      <!-- 吸附按钮：未吸附时可手动吸附；吸附后切换自动隐藏 -->
      <button
        v-if="!snapEdge"
        class="btn"
        title="吸附到最近边缘"
        @click="doSnap"
      >◧</button>
      <button
        v-else
        class="btn"
        :class="{ 'btn-active': autoHide }"
        :title="autoHide ? '关闭自动隐藏（点击）' : '开启贴边自动隐藏'"
        @click="toggleAutoHide"
      >{{ autoHide ? '📍' : '📌' }}</button>
      <button
        v-if="snapEdge"
        class="btn"
        title="取消吸附"
        @click="doUnsnap"
      >✕</button>
      <button class="btn" title="设置" @click="$emit('open-settings')">⚙</button>
      <button class="btn" title="折叠" @click="$emit('collapse')">—</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../store/tasks.js'

defineEmits(['collapse', 'open-settings', 'add-task'])

const store = useTaskStore()
const activeCount = computed(() => store.activeTasks.length)

const snapEdge = ref(null)
const autoHide = ref(false)

const EDGE_ICONS = { left: '◁', right: '▷', top: '△', bottom: '▽' }
const EDGE_NAMES = { left: '左侧', right: '右侧', top: '顶部', bottom: '底部' }
const snapEdgeIcon = computed(() => EDGE_ICONS[snapEdge.value] ?? '')
const snapBadgeTitle = computed(() => `已吸附${EDGE_NAMES[snapEdge.value] ?? ''}`)

onMounted(async () => {
  const state = await window.electronAPI?.getSnapState()
  if (state) { snapEdge.value = state.edge; autoHide.value = state.autoHide }

  window.electronAPI?.onSnapChanged(({ edge, autoHide: ah }) => {
    snapEdge.value = edge
    autoHide.value = ah
  })
})

async function doSnap() {
  await window.electronAPI?.snapToNearest()
}

async function doUnsnap() {
  await window.electronAPI?.unsnap()
}

async function toggleAutoHide() {
  await window.electronAPI?.toggleAutoHide()
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 12px 10px;
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
  -webkit-app-region: no-drag;
}

.title {
  color: var(--t1);
  font-size: 13px;
  font-weight: 700;
}

.count {
  background: var(--accent-dim);
  color: var(--accent-hover);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
}

.snap-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--accent-hover);
  background: var(--accent-dim);
  padding: 2px 6px;
  border-radius: 8px;
  cursor: default;
}

.autohide-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--s-done);
  display: inline-block;
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
  font-size: 14px;
  width: 26px; height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  line-height: 1;
  -webkit-app-region: no-drag;
}

.btn:hover { background: var(--layer1-hover); color: var(--t1); }

.btn-active {
  color: var(--s-done);
  background: rgba(52, 211, 153, 0.12);
}
.btn-active:hover { background: rgba(52, 211, 153, 0.22); }
</style>
