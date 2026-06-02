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
    <draggable
      v-model="draggableList"
      item-key="id"
      handle=".drag-handle"
      tag="div"
      class="list"
      :animation="200"
      :disabled="!isDragMode"
      ghost-class="drag-ghost"
    >
      <template #item="{ element }">
        <TaskCard
          :task="element"
          :show-handle="isDragMode"
          @edit="$emit('edit-task', element)"
        />
      </template>
      <template #footer>
        <div v-if="!filtered.length" class="empty">
          <span>{{ t('noTasks') }}</span>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import draggable from 'vuedraggable'
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
  { label: t('filterArchived'),   value: 'archived' },
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

// 是否处于手动排序模式（全部视图 + 无搜索）
const isDragMode = computed(() =>
  activeFilter.value === 'all' && !(searching.value && searchQuery.value.trim())
)

const filtered = computed(() => {
  let list = [...store.tasks]

  if (searching.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q)
    )
  } else if (activeFilter.value === 'archived') {
    list = list.filter(t => t.archived)
  } else {
    list = list.filter(t => !t.archived)
    if (activeFilter.value !== 'all') {
      list = list.filter(t => t.status === activeFilter.value)
    }
    if (tagFilter.value) {
      list = list.filter(t => t.tags?.includes(tagFilter.value))
    }
  }

  if (isDragMode.value) {
    // 手动排序模式：按 sortOrder
    return list.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }

  // 自动排序：优先级 → 截止日期
  return list.sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (b.status === 'done' && a.status !== 'done') return -1
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (pd !== 0) return pd
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return 0
  })
})

// vuedraggable 的双向绑定：拖拽结束时更新 sortOrder
const draggableList = computed({
  get: () => filtered.value,
  set: (newList) => store.reorderTasks(newList.map(t => t.id)),
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
  padding: 8px 10px 72px;
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

/* ── 拖拽占位 ── */
.drag-ghost {
  opacity: 0.35;
  background: var(--accent-dim) !important;
  border-color: var(--accent) !important;
}

/* ── 任务卡片进入/离开动画 ── */
.task-move,
.task-enter-active,
.task-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.task-enter-from {
  opacity: 0;
  transform: translateY(18px) scale(0.97);
}
.task-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
.task-leave-active {
  position: absolute;
  width: calc(100% - 20px);
}
</style>
