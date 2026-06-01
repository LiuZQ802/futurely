<template>
  <div
    class="card"
    :class="[`priority-${task.priority}`, { done: task.status === 'done' }]"
    @click="$emit('edit')"
  >
    <!-- 状态切换按钮 -->
    <button
      class="status-btn"
      :class="`s-${task.status}`"
      :title="`${statusLabel} · 点击切换`"
      @click.stop="store.cycleStatus(task.id)"
    >{{ statusIcon }}</button>

    <div class="card-body">
      <div class="title-row">
        <span class="title">{{ task.title }}</span>
        <span class="priority-tag" :class="`p-${task.priority}`">{{ priorityLabel }}</span>
      </div>
      <div class="meta">
        <span v-if="task.deadline" class="deadline" :class="deadlineClass">
          📅 {{ formatDeadline(task.deadline) }}
        </span>
        <span v-if="task.assignee && task.assignee !== '自己'" class="assignee">
          👤 {{ task.assignee }}
        </span>
        <span v-for="tag in task.tags" :key="tag" class="tag">{{ tag }}</span>
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

const priorityMap = { urgent: '紧急', high: '高', medium: '中', low: '低' }
const statusMap   = { todo: '待办', inprogress: '进行中', done: '已完成' }
const statusIcons = { todo: '○', inprogress: '◑', done: '●' }

const priorityLabel = computed(() => priorityMap[props.task.priority] ?? '中')
const statusLabel   = computed(() => statusMap[props.task.status] ?? '待办')
const statusIcon    = computed(() => statusIcons[props.task.status] ?? '○')

function formatDeadline(d) {
  const today = new Date(); today.setHours(0,0,0,0)
  const date  = new Date(d); date.setHours(0,0,0,0)
  const diff  = Math.round((date - today) / 86400000)
  if (diff < 0)   return `逾期${-diff}天`
  if (diff === 0) return '今天截止'
  if (diff === 1) return '明天'
  if (diff <= 7)  return `${diff}天后`
  return d.slice(5).replace('-', '/')
}

const deadlineClass = computed(() => {
  if (!props.task.deadline) return ''
  const today = new Date(); today.setHours(0,0,0,0)
  const date  = new Date(props.task.deadline); date.setHours(0,0,0,0)
  const diff  = Math.round((date - today) / 86400000)
  if (diff < 0)  return 'overdue'
  if (diff <= 1) return 'warn'
  return ''
})
</script>

<style scoped>
/* ── 卡片基础 ── */
.card {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 11px;
  border-radius: 8px;
  border-left: 3px solid transparent;
  background: #1e2d45;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.card:hover {
  background: #253550;
  transform: translateX(1px);
}

/* 优先级左边框 + 背景着色 */
.priority-urgent { border-left-color: #f87171; background: #28202a; }
.priority-urgent:hover { background: #30263200; }
.priority-urgent { background: #261e2e; }
.priority-urgent:hover { background: #2e2436; }

.priority-high   { border-left-color: #fbbf24; background: #26241a; }
.priority-high:hover { background: #2e2c20; }

.priority-medium { border-left-color: #60a5fa; background: #1a2538; }
.priority-medium:hover { background: #1f2d44; }

.priority-low    { border-left-color: #64748b; background: #1a2230; }
.priority-low:hover { background: #1f2938; }

.card.done { opacity: 0.5; }
.card.done .title { text-decoration: line-through; color: #7a9ab8; }

/* ── 状态按钮 ── */
.status-btn {
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 50%;
  border: 2px solid currentColor;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  padding: 0;
  margin-top: 1px;
  transition: transform 0.15s, opacity 0.15s;
  font-family: inherit;
}
.status-btn:hover { transform: scale(1.25); opacity: 0.85; }

.s-todo       { color: #64748b; }
.s-inprogress { color: #60a5fa; background: rgba(96,165,250,0.18); }
.s-done       { color: #4ade80; background: rgba(74,222,128,0.18); }

/* ── 卡片内容 ── */
.card-body { flex: 1; min-width: 0; }

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 5px;
}

.title {
  color: #ddeeff;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 优先级标签 */
.priority-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}
.p-urgent { background: rgba(248,113,113,0.25); color: #fca5a5; border: 1px solid rgba(248,113,113,0.4); }
.p-high   { background: rgba(251,191, 36,0.20); color: #fde68a; border: 1px solid rgba(251,191,36,0.4);  }
.p-medium { background: rgba( 96,165,250,0.20); color: #93c5fd; border: 1px solid rgba(96,165,250,0.4);  }
.p-low    { background: rgba(100,116,139,0.20); color: #94a3b8; border: 1px solid rgba(100,116,139,0.3); }

/* ── meta 信息 ── */
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.deadline { font-size: 10px; color: #7a9ab8; }
.deadline.warn   { color: #fb923c; font-weight: 600; }
.deadline.overdue { color: #f87171; font-weight: 600; }

.assignee { font-size: 10px; color: #7a9ab8; }

.tag {
  font-size: 10px;
  background: rgba(129,140,248,0.2);
  color: #c4b5fd;
  padding: 1px 6px;
  border-radius: 8px;
  border: 1px solid rgba(129,140,248,0.3);
}
</style>
