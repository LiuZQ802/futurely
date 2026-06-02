<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span>🗑 {{ t('recycleBin') }}</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <div v-if="deleted.length" class="actions-row">
          <button class="clear-all" @click="clearAll">{{ t('clearAll') }}</button>
        </div>

        <div v-if="deleted.length" class="list">
          <div v-for="task in deleted" :key="task.id" class="item">
            <div class="info">
              <span class="title">{{ task.title || t('untitled') }}</span>
              <span class="meta">{{ t('deletedAt') }} {{ fmtDate(task.deletedAt) }}</span>
            </div>
            <div class="btns">
              <button class="btn-restore" @click="restore(task.id)">{{ t('restore') }}</button>
              <button class="btn-delete" @click="permDelete(task.id)">{{ t('permanentDelete') }}</button>
            </div>
          </div>
        </div>

        <div v-else class="empty">
          <span>{{ t('recycleEmpty') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../i18n.js'

const emit = defineEmits(['close', 'restored'])
const { t } = useI18n()
const deleted = ref([])

onMounted(async () => {
  deleted.value = await window.electronAPI?.getDeletedTasks() ?? []
})

async function restore(id) {
  await window.electronAPI?.restoreTask(id)
  deleted.value = deleted.value.filter(t => t.id !== id)
  emit('restored')
}

async function permDelete(id) {
  await window.electronAPI?.permanentDeleteTask(id)
  deleted.value = deleted.value.filter(t => t.id !== id)
}

async function clearAll() {
  if (!window.confirm(t('confirmClearRecycle'))) return
  await window.electronAPI?.clearRecycleBin()
  deleted.value = []
}

function fmtDate(d) {
  if (!d) return ''
  const date = new Date(d)
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const dy = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${mo}/${dy} ${hh}:${mm}`
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: var(--radius);
}

.panel {
  background: var(--layer2);
  border: 1px solid var(--layer2-border);
  border-radius: var(--radius);
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  border-bottom: 1px solid var(--layer2-border);
  background: var(--layer2-header);
  color: var(--t1);
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--t2);
  cursor: pointer;
  font-size: 15px;
  width: 24px; height: 24px;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.close-btn:hover { background: rgba(128,128,128,0.15); color: var(--t1); }

.panel-body {
  padding: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
}

.clear-all {
  background: transparent;
  border: 1px solid var(--p-urgent);
  color: var(--p-urgent);
  font-size: 12px;
  font-family: inherit;
  padding: 4px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s;
}
.clear-all:hover { background: rgba(239,68,68,0.12); }

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--layer1);
  border: 1px solid var(--layer1-border);
  border-radius: var(--radius-sm);
}

.info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.title {
  color: var(--t1);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  color: var(--t3);
  font-size: 11px;
}

.btns {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.btn-restore {
  background: var(--accent-dim);
  border: 1px solid rgba(32,184,166,0.35);
  color: var(--accent-hover);
  font-size: 12px;
  font-family: inherit;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-restore:hover { background: rgba(32,184,166,0.25); }

.btn-delete {
  background: transparent;
  border: 1px solid var(--t3);
  color: var(--t3);
  font-size: 12px;
  font-family: inherit;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.btn-delete:hover { color: var(--p-urgent); border-color: var(--p-urgent); }

.empty {
  text-align: center;
  color: var(--t3);
  font-size: 14px;
  padding: 30px 0;
}
</style>
