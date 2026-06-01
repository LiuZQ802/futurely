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
  const today = new Date(); today.setHours(0,0,0,0)
  const date  = new Date(d); date.setHours(0,0,0,0)
  const n = Math.round((date - today) / 86400000)
  if (n < 0)   return `逾期${-n}天`
  if (n === 0) return '今天截止'
  if (n === 1) return '明天'
  if (n <= 7)  return `${n}天后`
  return d.slice(5).replace('-', '/')
}

const dlClass = computed(() => {
  if (!props.task.deadline) return ''
  const today = new Date(); today.setHours(0,0,0,0)
  const date  = new Date(props.task.deadline); date.setHours(0,0,0,0)
  const n = Math.round((date - today) / 86400000)
  return n < 0 ? 'overdue' : n <= 1 ? 'warn' : ''
})
</script>

<style scoped>
.card {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  background: var(--layer1);
  border: 1px solid var(--layer1-border);
  border-left: 3px solid var(--layer1-border);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.card:hover { background: var(--layer1-hover); }

/* 优先级左边框 + 轻微背景色 */
.p-urgent { border-left-color: var(--p-urgent);  background: #1f1828; }
.p-urgent:hover { background: #241c30; }
.p-high   { border-left-color: var(--p-high);   background: #1e1e16; }
.p-high:hover   { background: #23231c; }
.p-medium { border-left-color: var(--p-medium); background: #131f30; }
.p-medium:hover { background: #182538; }
.p-low    { border-left-color: var(--p-low);    background: var(--layer1); }

.card.done { opacity: 0.45; }
.card.done .title { text-decoration: line-through; color: var(--t3); }

/* 状态按钮 */
.status-btn {
  width: 22px; height: 22px; min-width: 22px;
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
  margin-bottom: 5px;
}

.title {
  color: var(--t1);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 优先级标签 */
.ptag {
  font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 10px;
  flex-shrink: 0; letter-spacing: 0.3px;
}
.pt-urgent { background: rgba(255,112,112,0.22); color: var(--p-urgent); border: 1px solid rgba(255,112,112,0.35); }
.pt-high   { background: rgba(255,201, 77,0.18); color: var(--p-high);   border: 1px solid rgba(255,201,77,0.35);  }
.pt-medium { background: rgba( 95,184,255,0.18); color: var(--p-medium); border: 1px solid rgba(95,184,255,0.35);  }
.pt-low    { background: rgba(122,149,176,0.15); color: var(--p-low);    border: 1px solid rgba(122,149,176,0.3);  }

/* meta */
.meta { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }

.dl   { font-size: 10px; color: var(--t2); }
.dl.warn   { color: var(--p-high); font-weight: 600; }
.dl.overdue { color: var(--p-urgent); font-weight: 600; }

.who  { font-size: 10px; color: var(--t2); }

.tag {
  font-size: 10px;
  background: var(--accent-dim);
  color: var(--accent-hover);
  padding: 1px 6px; border-radius: 8px;
  border: 1px solid rgba(124,143,250,0.3);
}
</style>
