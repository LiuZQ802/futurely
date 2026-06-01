<template>
  <div class="task-list-wrap">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <button
        v-for="s in statusFilters"
        :key="s.value"
        class="filter-btn"
        :class="{ active: activeFilter === s.value }"
        @click="activeFilter = s.value"
      >
        {{ s.label }}
      </button>
      <select v-model="tagFilter" class="tag-select">
        <option value="">所有标签</option>
        <option v-for="t in store.tags" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <!-- 列表 -->
    <div class="list">
      <template v-if="filtered.length">
        <TaskCard
          v-for="task in filtered"
          :key="task.id"
          :task="task"
          @edit="$emit('edit-task', task)"
        />
      </template>
      <div v-else class="empty">
        <span>暂无任务 ✨</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TaskCard from './TaskCard.vue'
import { useTaskStore } from '../store/tasks.js'

defineEmits(['edit-task'])

const store = useTaskStore()

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '待办', value: 'todo' },
  { label: '进行中', value: 'inprogress' },
  { label: '已完成', value: 'done' },
]

const activeFilter = ref('all')
const tagFilter = ref('')

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }

const filtered = computed(() => {
  let list = [...store.tasks]

  if (activeFilter.value !== 'all') {
    list = list.filter((t) => t.status === activeFilter.value)
  }

  if (tagFilter.value) {
    list = list.filter((t) => t.tags?.includes(tagFilter.value))
  }

  return list.sort((a, b) => {
    // 未完成在前
    if (a.status === 'done' && b.status !== 'done') return 1
    if (b.status === 'done' && a.status !== 'done') return -1
    // 按优先级
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (pd !== 0) return pd
    // 按截止日期
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return 0
  })
})
</script>

<style scoped>
.task-list-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px 6px;
  flex-shrink: 0;
}

.filter-btn {
  background: #1a2840;
  border: 1.5px solid #3d5878;
  color: #8ab0d0;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  font-weight: 500;
}
.filter-btn:hover {
  color: #ddeeff;
  border-color: #5a80a8;
  background: #1f3050;
}
.filter-btn.active {
  background: #4f46e5;
  color: #ffffff;
  border-color: #6366f1;
  font-weight: 600;
}

.tag-select {
  margin-left: auto;
  background: #1a2840;
  border: 1.5px solid #3d5878;
  color: #8ab0d0;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  font-family: inherit;
}
.tag-select:focus { border-color: #818cf8; }
.tag-select option { background: #1a2840; color: #e8f0fb; }

.list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-muted);
  font-size: 13px;
  padding: 40px 0;
}
</style>
