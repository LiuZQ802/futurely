<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')">✕</button>

      <div class="logo-wrap">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <!-- 圆角方块背景 -->
          <rect x="2" y="2" width="44" height="44" rx="11" fill="#0f172a"/>
          <!-- 金色右箭头 -->
          <polygon points="14,10 14,38 36,24" fill="#fbbf24"/>
        </svg>
      </div>

      <h2 class="name">Futurely</h2>
      <p class="version">{{ t('version') }} {{ version }}</p>
      <p class="desc">{{ t('aboutDesc') }}</p>

      <div class="actions">
        <button
          class="btn-update"
          :class="{ spinning: updateState === 'checking' || updateState === 'downloading' }"
          :disabled="updateState === 'checking' || updateState === 'downloading'"
          @click="onUpdateClick"
        >
          <span v-if="updateState === 'checking' || updateState === 'downloading'" class="spin-icon">⟳</span>
          {{ updateBtnLabel }}
        </button>
        <button class="btn-github" @click="openUrl('https://github.com/LiuZQ802/futurely')">
          GitHub ↗
        </button>
      </div>

      <!-- changelog -->
      <div v-if="releaseNotes && (updateState === 'available' || updateState === 'downloading' || updateState === 'downloaded')" class="changelog">
        <div class="changelog-title">{{ t('whatsNew') }} v{{ latestVersion }}</div>
        <pre class="changelog-body">{{ releaseNotes }}</pre>
      </div>

      <!-- 统计 -->
      <div class="stats-wrap">
        <div class="stat-row">
          <div class="stat-box">
            <span class="stat-num">{{ stats.active }}</span>
            <span class="stat-label">{{ t('statActive') }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ stats.doneThisWeek }}</span>
            <span class="stat-label">{{ t('statDoneWeek') }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-num" style="color: var(--p-urgent)">{{ stats.overdue }}</span>
            <span class="stat-label">{{ t('statOverdue') }}</span>
          </div>
        </div>
        <div v-if="stats.total > 0" class="priority-bar">
          <div
            v-for="p in priorityDist"
            :key="p.key"
            class="p-seg"
            :style="{ width: p.pct + '%', background: p.color }"
            :title="p.label + ' ' + p.count + ' (' + Math.round(p.pct) + '%)'"
          />
        </div>
      </div>

      <p class="credit">MIT © Ziqi Liu</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../store/tasks.js'
import { useI18n } from '../i18n.js'

defineEmits(['close'])
const { t } = useI18n()

const version       = ref('')
const updateState   = ref('idle')   // idle | checking | up-to-date | available | downloading | downloaded | error
const latestVersion = ref('')
const releaseNotes  = ref('')

const updateBtnLabel = computed(() => {
  switch (updateState.value) {
    case 'checking':    return t('checking')
    case 'up-to-date':  return `✓ ${t('upToDate')}`
    case 'available':   return `↓ ${t('downloadUpdate')}`
    case 'downloading': return t('downloading')
    case 'downloaded':  return `↻ ${t('restartInstall')}`
    case 'error':       return t('checkUpdate')
    default:            return t('checkUpdate')
  }
})

const store = useTaskStore()

const stats = computed(() => {
  const tasks = store.tasks
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0)
  const active = tasks.filter(t => t.status !== 'done' && !t.archived).length
  const doneThisWeek = tasks.filter(t => {
    if (t.status !== 'done') return false
    const ua = t.updatedAt || t.createdAt
    return ua && new Date(ua) >= weekStart
  }).length
  const overdue = tasks.filter(t => {
    if (t.status === 'done' || !t.deadline) return false
    return new Date(t.deadline) < now
  }).length
  return { active, doneThisWeek, overdue, total: tasks.length }
})

const priorityDist = computed(() => {
  const tasks = store.tasks.filter(t => !t.archived)
  if (!tasks.length) return []
  const map = { urgent: 0, high: 0, medium: 0, low: 0 }
  tasks.forEach(t => { map[t.priority] = (map[t.priority] || 0) + 1 })
  const colors = { urgent: 'var(--p-urgent)', high: 'var(--p-high)', medium: 'var(--p-medium)', low: 'var(--p-low)' }
  const labels = { urgent: t('pUrgent'), high: t('pHigh'), medium: t('pMedium'), low: t('pLow') }
  return Object.entries(map)
    .filter(([, c]) => c > 0)
    .map(([key, count]) => ({ key, count, color: colors[key], label: labels[key], pct: (count / tasks.length) * 100 }))
})

onMounted(async () => {
  version.value = await window.electronAPI?.getVersion() ?? ''

  window.electronAPI?.onUpdateAvailable(info => {
    latestVersion.value = info.version
    releaseNotes.value  = info.releaseNotes ?? ''
    updateState.value   = 'available'
  })
  window.electronAPI?.onUpdateNotAvailable(() => {
    updateState.value = 'up-to-date'
    setTimeout(() => { if (updateState.value === 'up-to-date') updateState.value = 'idle' }, 2000)
  })
  window.electronAPI?.onUpdateDownloaded(() => {
    updateState.value = 'downloaded'
  })
  window.electronAPI?.onUpdateError(() => {
    updateState.value = 'error'
  })
})

function onUpdateClick() {
  switch (updateState.value) {
    case 'idle':
    case 'up-to-date':
    case 'error':
      updateState.value = 'checking'
      window.electronAPI?.checkForUpdates()
      break
    case 'available':
      updateState.value = 'downloading'
      window.electronAPI?.downloadUpdate()
      break
    case 'downloaded':
      window.electronAPI?.installUpdate()
      break
  }
}

function openUrl(url) { window.electronAPI?.openUrl(url) }
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.38);
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
  width: 78%;
  padding: 22px 18px 16px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px; right: 10px;
  background: transparent; border: none;
  color: var(--t3); cursor: pointer; font-size: 14px;
  width: 22px; height: 22px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.15s;
}
.close-btn:hover { color: var(--t1); }

.logo-wrap { margin-bottom: 4px; }

.name {
  color: var(--t1);
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.version {
  color: var(--t3);
  font-size: 12px;
  margin: 0;
}

.desc {
  color: var(--t2);
  font-size: 12px;
  text-align: center;
  margin: 4px 0 8px;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 8px;
  width: 100%;
}

.btn-update, .btn-github {
  flex: 1;
  font-family: inherit;
  font-size: 12px;
  padding: 7px 0;
  border-radius: 7px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.btn-update {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.btn-update:hover:not(:disabled) { background: var(--accent-hover); }
.btn-update:disabled { opacity: 0.6; cursor: default; }

.spin-icon {
  display: inline-block;
  animation: spin 0.8s linear infinite;
  margin-right: 4px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-github {
  background: var(--layer3);
  color: var(--t2);
  border-color: var(--layer3-border);
}
.btn-github:hover { color: var(--t1); border-color: var(--t3); }


.changelog {
  width: 100%;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 7px;
  overflow: hidden;
}
.changelog-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--t2);
  padding: 6px 10px 4px;
}
.changelog-body {
  font-size: 11px;
  color: var(--t2);
  line-height: 1.6;
  padding: 0 10px 8px;
  margin: 0;
  max-height: 140px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.credit {
  color: var(--t3);
  font-size: 11px;
  margin: 6px 0 0;
}

/* ── 统计 ── */
.stats-wrap {
  width: 100%;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 4px;
}
.stat-row {
  display: flex;
  justify-content: space-around;
  gap: 8px;
}
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-hover);
  line-height: 1;
}
.stat-label {
  font-size: 10px;
  color: var(--t3);
}
.priority-bar {
  display: flex;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 10px;
}
.p-seg {
  height: 100%;
  transition: width 0.3s ease;
}

.theme-light .btn-update { color: #062030; }
</style>
