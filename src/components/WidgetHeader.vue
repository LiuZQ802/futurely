<template>
  <div class="header">
    <div class="left">
      <span class="title">Futurely</span>
      <span v-if="activeCount > 0" class="count">{{ activeCount }}</span>
      <span
        v-if="snapEdge"
        class="snap-badge"
        :title="locale.snapTooltip(locale.edgeName[snapEdge])"
      >{{ EDGE_ICONS[snapEdge] }} {{ t('snapBadge') }}</span>
    </div>
    <div class="actions">
      <button class="btn" :title="t('btnNewTask')"   @click="$emit('add-task')">＋</button>
      <button class="btn" :title="t('btnSettings')"  @click="$emit('open-settings')">⚙</button>
      <button class="btn" :title="t('aboutSection')" @click="$emit('open-about')">ℹ</button>
      <button class="btn" :title="t('btnCollapse')"  @click="$emit('collapse')">—</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../store/tasks.js'
import { useI18n } from '../i18n.js'

defineEmits(['collapse', 'open-settings', 'open-about', 'add-task'])

const store = useTaskStore()
const { t, locale } = useI18n()
const activeCount = computed(() => store.activeTasks.length)
const snapEdge = ref(null)

const EDGE_ICONS = { left: '◁', right: '▷', top: '△', bottom: '▽' }

onMounted(async () => {
  const state = await window.electronAPI?.getSnapState()
  if (state) snapEdge.value = state.edge
  window.electronAPI?.onSnapChanged(({ edge }) => { snapEdge.value = edge })
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
