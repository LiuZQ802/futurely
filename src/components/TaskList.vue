<template>
  <div class="task-list-wrap">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <template v-if="!searching">
        <button
          v-for="s in statusFilters"
          :key="s.value"
          class="filter-btn"
          :class="{ active: activeFilter === s.value }"
          @click="activeFilter = s.value"
        >{{ s.label }}</button>
        <select v-model="tagFilter" class="tag-select">
          <option value="">{{ t('allTags') }}</option>
          <option v-for="tag in store.tags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </template>
      <input
        v-else
        ref="searchInput"
        v-model="searchQuery"
        class="search-input"
        :placeholder="t('searchPlaceholder')"
      />
      <button class="search-btn" :class="{ active: searching }" @click="toggleSearch">
        {{ searching ? '✕' : '🔍' }}
      </button>
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
        <span>{{ t('noTasks') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import TaskCard from './TaskCard.vue'
import { useTaskStore } from '../store/tasks.js'
import { useI18n } from '../i18n.js'

defineEmits(['edit-task'])

const store = useTaskStore()
const { t } = useI18n()

const statusFilters = computed(() => [
  { label: t('filterAll'),        value: 'all' },
  { label: t('filterTodo'),       value: 'todo' },
  { label: t('filterInProgress'), value: 'inprogress' },
  { label: t('filterDone'),       value: 'done' },
])

const activeFilter = ref('all')
const tagFilter    = ref('')
const searching    = ref(false)
const searchQuery  = ref('')
const searchInput  = ref(null)

function toggleSearch() {
  searching.value = !searching.value
  searchQuery.value = ''
  if (searching.value) nextTick(() => searchInput.value?.focus())
}

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }

const filtered = computed(() => {
  let list = [...store.tasks]

  if (searching.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q)
    )
  } else {
    if (activeFilter.value !== 'all') {
      list = list.filter((t) => t.status === activeFilter.value)
    }
    if (tagFilter.value) {
      list = list.filter((t) => t.tags?.includes(tagFilter.value))
    }
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
  gap: 6px;
  padding: 9px 12px 8px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--layer1-border);
  background: var(--filter-bar-bg);
}

.filter-btn {
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  color: var(--t2);
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  font-weight: 500;
}
.filter-btn:hover {
  color: var(--t1);
  border-color: var(--accent);
}
.filter-btn.active {
  background: var(--accent);
  color: #061513;
  border-color: var(--accent);
  font-weight: 600;
}

.search-input {
  flex: 1;
  background: var(--layer3);
  border: 1px solid var(--accent);
  border-radius: 8px;
  color: var(--t1);
  font-size: 12px;
  padding: 5px 8px;
  outline: none;
  font-family: inherit;
}
.search-input::placeholder { color: var(--t3); }

.search-btn {
  background: transparent;
  border: none;
  color: var(--t2);
  cursor: pointer;
  font-size: 13px;
  padding: 4px 5px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.search-btn:hover, .search-btn.active { color: var(--t1); background: var(--layer1-hover); }

.tag-select {
  margin-left: auto;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  color: var(--t2);
  font-size: 12px;
  padding: 5px 8px;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  font-family: inherit;
}
.tag-select:focus { border-color: var(--accent); }
.tag-select option { background: var(--layer3); color: var(--t1); }

.list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--t2);
  font-size: 14px;
  padding: 40px 0;
}
</style>
