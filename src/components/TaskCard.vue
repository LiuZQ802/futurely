<template>
  <div
    class="card"
    :class="[`priority-${task.priority}`, { done: task.status === 'done' }]"
    @click="$emit('edit')"
  >
    <div class="card-left">
      <button
        class="status-dot"
        :class="`status-${task.status}`"
        :title="statusLabel"
        @click.stop="store.cycleStatus(task.id)"
      />
    </div>

    <div class="card-body">
      <div class="title-row">
        <span class="title">{{ task.title }}</span>
        <span class="priority-tag" :class="`p-${task.priority}`">
          {{ priorityLabel }}
        </span>
      </div>

      <div class="meta">
        <span v-if="task.deadline" class="deadline" :class="deadlineClass">
          📅 {{ formatDeadline(task.deadline) }}
        </span>
        <span v-if="task.assignee && task.assignee !== '自己'" class="assignee">
          → {{ task.assignee }}
        </span>
        <span v-if="task.tags?.length" class="tags">
          <span v-for="tag in task.tags" :key="tag" class="tag">{{ tag }}</span>
        </span>
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
const statusMap = { todo: '待办', inprogress: '进行中', done: '已完成' }

const priorityLabel = computed(() => priorityMap[props.task.priority] ?? '中')
const statusLabel = computed(() => statusMap[props.task.status] ?? '待办')

function formatDeadline(d) {
  if (!d) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const diff = Math.round((date - today) / 86400000)
  if (diff < 0) return `逾期 ${-diff} 天`
  if (diff === 0) return '今天截止'
  if (diff === 1) return '明天截止'
  if (diff <= 7) return `${diff} 天后`
  return d.slice(5).replace('-', '/')
}

const deadlineClass = computed(() => {
  if (!props.task.deadline) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(props.task.deadline)
  date.setHours(0, 0, 0, 0)
  const diff = Math.round((date - today) / 86400000)
  if (diff < 0) return 'overdue'
  if (diff <= 1) return 'urgent'
  return ''
})
</script>

<style scoped>
.card {
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  display: flex;
  gap: 8px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 3px solid transparent;
}

.card:hover {
  background: var(--bg-card-hover);
}

.priority-urgent { border-left-color: var(--priority-urgent); background: var(--priority-urgent-bg); }
.priority-high    { border-left-color: var(--priority-high);   background: var(--priority-high-bg); }
.priority-medium  { border-left-color: var(--priority-medium); background: var(--priority-medium-bg); }
.priority-low     { border-left-color: var(--priority-low);    background: var(--priority-low-bg); }

.card.done {
  opacity: 0.5;
}
.card.done .title {
  text-decoration: line-through;
}

.card-left {
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.status-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid currentColor;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  padding: 0;
}

.status-dot:hover {
  transform: scale(1.2);
}

.status-todo      { color: var(--status-todo); }
.status-inprogress { color: var(--status-inprogress); background: rgba(59,130,246,0.3); }
.status-done      { color: var(--status-done); background: rgba(34,197,94,0.3); }

.card-body {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 3px;
}

.title {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.priority-tag {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
}
.p-urgent { background: rgba(239,68,68,0.3); color: #fca5a5; }
.p-high   { background: rgba(234,179,8,0.25); color: #fde68a; }
.p-medium { background: rgba(59,130,246,0.25); color: #93c5fd; }
.p-low    { background: rgba(100,116,139,0.25); color: #94a3b8; }

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.deadline, .assignee {
  font-size: 10px;
  color: var(--text-muted);
}

.deadline.urgent { color: #fb923c; }
.deadline.overdue { color: var(--priority-urgent); }

.tags {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.tag {
  font-size: 9px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  padding: 1px 5px;
  border-radius: 4px;
}
</style>
