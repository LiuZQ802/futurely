<template>
  <div
    class="card"
    :class="[`p-${task.priority}`, { done: task.status === 'done' }]"
    @click="$emit('edit')"
  >
    <button
      class="status-btn"
      :class="`s-${task.status}`"
      :title="`${statusLabel} · 点击切换`"
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
        <span v-for="t in task.tags" :key="t" class="tag">{{ t }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTaskStore } from '../store/tasks.js'

const props = defineProps({ task: Object })
defineEmits(['edit'])
const store = useTaskStore()

const PLABEL = { urgent:'紧急', high:'高', medium:'中', low:'低' }
const SLABEL = { todo:'待办', inprogress:'进行中', done:'已完成' }
const SICON  = { todo:'○', inprogress:'◑', done:'●' }

const priorityLabel = computed(() => PLABEL[props.task.priority] ?? '中')
const statusLabel   = computed(() => SLABEL[props.task.status] ?? '待办')
const statusIcon    = computed(() => SICON[props.task.status]  ?? '○')

function fmtDeadline(d) {
  const now   = new Date()
  const date  = new Date(d)
  const hasTime = d.includes('T')

  // 日期差（按天）
  const today = new Date(); today.setHours(0,0,0,0)
  const dayD  = new Date(d);  dayD.setHours(0,0,0,0)
  const n = Math.round((dayD - today) / 86400000)

  const timePart = hasTime
    ? ` ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
    : ''

  if (n < 0)   return `逾期${-n}天${timePart}`
  if (n === 0) return `今天${timePart || '截止'}`
  if (n === 1) return `明天${timePart}`
  if (n <= 7)  return `${n}天后${timePart}`
  const mo = String(date.getMonth()+1).padStart(2,'0')
  const dy = String(date.getDate()).padStart(2,'0')
  return `${mo}/${dy}${timePart}`
}

const dlClass = computed(() => {
  if (!props.task.deadline) return ''
  const now  = new Date()
  const date = new Date(props.task.deadline)
  const today = new Date(); today.setHours(0,0,0,0)
  const dayD  = new Date(props.task.deadline); dayD.setHours(0,0,0,0)
  const n = Math.round((dayD - today) / 86400000)
  // 逾期（含今天已过时刻）
  if (date < now) return 'overdue'
  if (n <= 1) return 'warn'
  return ''
})
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
  border-color: #738092;
  box-shadow: 0 4px 14px rgba(0,0,0,0.14);
}

/* 优先级左边框 + 轻微背景色 */
.p-urgent { border-left-color: var(--p-urgent); }
.p-high   { border-left-color: var(--p-high); }
.p-medium { border-left-color: var(--p-medium); }
.p-low    { border-left-color: var(--p-low);    background: var(--layer1); }

.card.done { background: #2a323c; border-color: #505c6b; }
.card.done .title { text-decoration: line-through; color: var(--t3); }
.card.done .meta { opacity: 0.72; }

/* 状态按钮 */
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
.s-inprogress { color: var(--s-doing); background: rgba(95,184,255,0.15); }
.s-done       { color: var(--s-done);  background: rgba(80,216,144,0.15); }

/* 卡片内容 */
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

/* 优先级标签 */
.ptag {
  font-size: 11px; font-weight: 700;
  padding: 2px 7px; border-radius: 8px;
  flex-shrink: 0; letter-spacing: 0;
}
.pt-urgent { background: var(--p-urgent-bg); color: #fca5a5; border: 1px solid rgba(239,68,68,0.42); }
.pt-high   { background: var(--p-high-bg);   color: #fbbf24; border: 1px solid rgba(245,158,11,0.42); }
.pt-medium { background: var(--p-medium-bg); color: #93c5fd; border: 1px solid rgba(59,130,246,0.42); }
.pt-low    { background: var(--p-low-bg);    color: #cbd5e1; border: 1px solid rgba(148,163,184,0.35); }

/* meta */
.meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.dl   { font-size: 11px; color: var(--t2); }
.dl.warn   { color: var(--p-high); font-weight: 600; }
.dl.overdue { color: var(--p-urgent); font-weight: 600; }

.who  { font-size: 11px; color: var(--t2); }

.tag {
  font-size: 11px;
  background: var(--accent-dim);
  color: var(--accent-hover);
  padding: 1px 7px; border-radius: 7px;
  border: 1px solid rgba(32,184,166,0.32);
}
</style>
