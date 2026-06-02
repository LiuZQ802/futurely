<template>
  <div
    class="card"
    :class="[`p-${task.priority}`, { done: task.status === 'done', 'today-due': isTodayDue }]"
    @click="$emit('edit')"
    @contextmenu.prevent="openMenu"
  >
    <button
      class="status-btn"
      :class="`s-${task.status}`"
      :title="`${statusLabel} · ${t('clickToSwitch')}`"
      @click.stop="store.cycleStatus(task.id)"
    >{{ statusIcon }}</button>

    <div class="body">
      <div class="top">
        <span class="title">{{ task.title }}</span>
        <span class="ptag" :class="`pt-${task.priority}`">{{ priorityLabel }}</span>
      </div>
      <div class="meta">
        <span v-if="task.deadline" class="dl" :class="dlClass">📅 {{ fmtDeadline(task.deadline) }}</span>
        <span v-if="task.assignee && task.assignee !== '自己'" class="who">👤 {{ task.assignee }}</span>
        <span v-for="tag in task.tags" :key="tag" class="tag">{{ tag }}</span>
        <button
          v-if="task.workDir"
          class="dir-btn"
          :title="task.workDir"
          @click.stop="openWorkDir"
        >📁</button>
      </div>
      <div v-if="task.notes" class="notes-preview">{{ task.notes }}</div>
    </div>
  </div>

  <!-- 右键快捷菜单 -->
  <Teleport to="body">
    <template v-if="menu.visible">
      <!-- 全屏透明遮罩：覆盖整个视口（包括 -webkit-app-region:drag 区域），点击即关 -->
      <div class="menu-overlay" @mousedown="closeMenu" />
      <!-- 菜单本体：z-index 在遮罩之上，点击不会穿透到遮罩 -->
      <div
        ref="menuEl"
        class="ctx-menu"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
      >
        <button class="ctx-item" @click="ctxToggleDone">
          {{ task.status === 'done' ? t('ctxMarkTodo') : t('ctxMarkDone') }}
        </button>
        <button v-if="task.status === 'done'" class="ctx-item" @click="ctxArchive">
          {{ task.archived ? t('unarchiveTask') : t('archiveTask') }}
        </button>
        <div class="ctx-divider" />
        <button class="ctx-item danger" @click="ctxDelete">{{ t('ctxDelete') }}</button>
      </div>
    </template>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTaskStore } from '../store/tasks.js'
import { useI18n } from '../i18n.js'

const props = defineProps({ task: Object })
defineEmits(['edit'])
const store = useTaskStore()
const { t, locale } = useI18n()

const PLABEL = { urgent: 'pUrgent', high: 'pHigh', medium: 'pMedium', low: 'pLow' }
const SLABEL = { todo: 'sTodo', inprogress: 'sInProgress', done: 'sDone' }
const SICON  = { todo: '○', inprogress: '◑', done: '●' }

const priorityLabel = computed(() => t(PLABEL[props.task.priority] ?? 'pMedium'))

function openWorkDir() {
  window.electronAPI?.openPath(props.task.workDir)
}
const statusLabel = computed(() => t(SLABEL[props.task.status] ?? 'sTodo'))
const statusIcon  = computed(() => SICON[props.task.status] ?? '○')

function fmtDeadline(d) {
  const date    = new Date(d)
  const hasTime = d.includes('T')
  const today   = new Date(); today.setHours(0, 0, 0, 0)
  const dayD    = new Date(d);  dayD.setHours(0, 0, 0, 0)
  const n       = Math.round((dayD - today) / 86400000)
  const timePart = hasTime
    ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : ''

  const result = locale.value.fmtDaysDiff(n, timePart)
  if (result !== null) return result

  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const dy = String(date.getDate()).padStart(2, '0')
  return timePart ? `${mo}/${dy} ${timePart}` : `${mo}/${dy}`
}

const dlClass = computed(() => {
  if (!props.task.deadline) return ''
  const now   = new Date()
  const date  = new Date(props.task.deadline)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dayD  = new Date(props.task.deadline); dayD.setHours(0, 0, 0, 0)
  const n = Math.round((dayD - today) / 86400000)
  if (date < now) return 'overdue'
  if (n === 0)    return 'today'
  if (n === 1)    return 'warn'
  return ''
})

const isTodayDue = computed(() => {
  if (!props.task.deadline || props.task.status === 'done') return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dayD  = new Date(props.task.deadline); dayD.setHours(0, 0, 0, 0)
  return dayD.getTime() === today.getTime()
})

// ── 右键菜单 ─────────────────────────────────────────
const MENU_W = 152
const MENU_H = 96

const menu   = ref({ visible: false, x: 0, y: 0 })
const menuEl = ref(null)

function openMenu(e) {
  const x = Math.min(e.clientX + 2, window.innerWidth  - MENU_W - 8)
  const y = Math.min(e.clientY + 2, window.innerHeight - MENU_H - 8)
  menu.value = { visible: true, x, y }
}

function closeMenu() {
  menu.value.visible = false
}

function ctxToggleDone() {
  store.updateTask(props.task.id, {
    status: props.task.status === 'done' ? 'todo' : 'done',
  })
  closeMenu()
}

function ctxArchive() {
  if (props.task.archived) {
    store.unarchiveTask(props.task.id)
  } else {
    store.archiveTask(props.task.id)
  }
  closeMenu()
}

function ctxDelete() {
  store.removeTask(props.task.id)
  closeMenu()
}
</script>

<style scoped>
.card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  border-radius: var(--radius-sm);
  background: var(--layer1);
  border: 1px solid var(--layer1-border);
  border-left: 4px solid var(--layer1-border);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.card:hover {
  background: var(--layer1-hover);
  border-color: var(--t3);
  box-shadow: 0 4px 14px rgba(0,0,0,0.10);
}

.p-urgent { border-left-color: var(--p-urgent); }
.p-high   { border-left-color: var(--p-high); }
.p-medium { border-left-color: var(--p-medium); }
.p-low    { border-left-color: var(--p-low); }

.card.done { background: var(--card-done-bg); border-color: var(--card-done-border); }
.card.done .title { text-decoration: line-through; color: var(--t3); }
.card.done .meta  { opacity: 0.72; }

/* 今日到期高亮 */
.card.today-due {
  background: rgba(32, 184, 166, 0.07);
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(32,184,166,0.25);
}
.card.today-due:hover {
  background: rgba(32, 184, 166, 0.12);
}

.status-btn {
  width: 24px; height: 24px; min-width: 24px;
  border-radius: 50%;
  border: 2px solid currentColor;
  background: transparent;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; line-height: 1;
  padding: 0; margin-top: 1px;
  font-family: inherit;
  transition: transform 0.15s;
}
.status-btn:hover { transform: scale(1.25); }

.s-todo       { color: var(--s-todo); }
.s-inprogress { color: var(--s-doing); background: rgba(95,184,255,0.12); }
.s-done       { color: var(--s-done);  background: rgba(80,216,144,0.12); }

.body { flex: 1; min-width: 0; }

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 7px;
}

.title {
  color: var(--t1);
  font-size: 13.5px;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ptag {
  font-size: 11px; font-weight: 700;
  padding: 2px 7px; border-radius: 8px;
  flex-shrink: 0;
}
.pt-urgent { background: var(--p-urgent-bg); color: var(--p-urgent);  border: 1px solid rgba(239,68,68,0.38); }
.pt-high   { background: var(--p-high-bg);   color: var(--p-high);    border: 1px solid rgba(245,158,11,0.38); }
.pt-medium { background: var(--p-medium-bg); color: var(--p-medium);  border: 1px solid rgba(59,130,246,0.38); }
.pt-low    { background: var(--p-low-bg);    color: var(--p-low);     border: 1px solid rgba(148,163,184,0.30); }

.meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.dl         { font-size: 11px; color: var(--t2); }
.dl.today   { color: var(--accent-hover); font-weight: 700; }
.dl.warn    { color: var(--p-high);   font-weight: 600; }
.dl.overdue { color: var(--p-urgent); font-weight: 600; }
.who        { font-size: 11px; color: var(--t2); }
.dir-btn {
  background: transparent; border: none;
  font-size: 12px; padding: 0 2px; cursor: pointer;
  border-radius: 4px; line-height: 1;
  transition: transform 0.15s;
}
.dir-btn:hover { transform: scale(1.2); }

.notes-preview {
  display: none;
  margin-top: 7px;
  padding-top: 6px;
  border-top: 1px solid var(--layer1-border);
  font-size: 11.5px;
  color: var(--t2);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.card:hover .notes-preview { display: block; }

.tag {
  font-size: 11px;
  background: var(--accent-dim);
  color: var(--accent-hover);
  padding: 1px 7px; border-radius: 7px;
  border: 1px solid rgba(128,128,255,0.22);
}

/* ── 右键菜单 ── */
.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: transparent;
}

.ctx-menu {
  position: fixed;
  z-index: 9999;
  min-width: 152px;
  background: var(--layer2);
  border: 1px solid var(--layer2-border);
  border-radius: 9px;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.30);
}

.ctx-item {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--t1);
  font-size: 13px;
  font-family: inherit;
  padding: 7px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
}
.ctx-item:hover  { background: var(--layer1-hover); }
.ctx-item.danger { color: var(--p-urgent); }
.ctx-item.danger:hover { background: rgba(239,68,68,0.12); }

.ctx-divider {
  height: 1px;
  background: var(--layer2-border);
  margin: 3px 8px;
}
</style>
