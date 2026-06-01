<template>
  <div class="header">
    <div class="left">
      <span class="title">📋 桌面清单</span>
      <span v-if="activeCount > 0" class="count">{{ activeCount }}</span>
      <!-- 贴边状态指示（拖离可取消） -->
      <span
        v-if="snapEdge"
        class="snap-badge"
        :title="`已贴${EDGE_NAMES[snapEdge]}边缩入 · 拖动可取消`"
      >{{ EDGE_ICONS[snapEdge] }} 贴边</span>
    </div>
    <div class="actions">
      <button class="btn" title="新建任务" @click="$emit('add-task')">＋</button>
      <button class="btn" title="设置" @click="$emit('open-settings')">⚙</button>
      <button class="btn" title="折叠" @click="$emit('collapse')">—</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTaskStore } from '../store/tasks.js'
import { computed } from 'vue'

defineEmits(['collapse', 'open-settings', 'add-task'])

const store = useTaskStore()
const activeCount = computed(() => store.activeTasks.length)
const snapEdge = ref(null)

const EDGE_ICONS = { left: '◁', right: '▷', top: '△', bottom: '▽' }
const EDGE_NAMES = { left: '左', right: '右', top: '顶', bottom: '底' }

onMounted(async () => {
  const state = await window.electronAPI?.getSnapState()
  if (state) snapEdge.value = state.edge

  window.electronAPI?.onSnapChanged(({ edge }) => {
    snapEdge.value = edge
  })
})
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
  font-size: 10px;
  color: var(--s-done);
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.25);
  padding: 1px 6px;
  border-radius: 8px;
  cursor: default;
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
</style>
