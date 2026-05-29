<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="form-panel">
      <div class="form-header">
        <span>{{ isEdit ? '编辑任务' : '新建任务' }}</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="form-body">
        <div class="field">
          <label>任务名称 *</label>
          <input v-model="form.title" placeholder="任务名称" maxlength="60" />
        </div>

        <div class="field row">
          <div class="sub-field">
            <label>优先级</label>
            <select v-model="form.priority">
              <option value="urgent">🔴 紧急</option>
              <option value="high">🟡 高</option>
              <option value="medium">🔵 中</option>
              <option value="low">⚫ 低</option>
            </select>
          </div>
          <div class="sub-field">
            <label>状态</label>
            <select v-model="form.status">
              <option value="todo">待办</option>
              <option value="inprogress">进行中</option>
              <option value="done">已完成</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>截止日期</label>
          <input type="date" v-model="form.deadline" />
        </div>

        <div class="field">
          <label>负责人</label>
          <div class="assignee-input">
            <input
              v-model="form.assignee"
              list="assignee-list"
              placeholder="输入或选择负责人"
            />
            <datalist id="assignee-list">
              <option v-for="a in store.assignees" :key="a" :value="a" />
            </datalist>
          </div>
        </div>

        <div class="field">
          <label>分类标签</label>
          <div class="tags-wrap">
            <span
              v-for="tag in store.tags"
              :key="tag"
              class="tag-chip"
              :class="{ active: form.tags.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="field">
          <label>备注</label>
          <textarea v-model="form.notes" placeholder="补充说明..." rows="3" />
        </div>
      </div>

      <div class="form-footer">
        <button v-if="isEdit" class="btn-danger" @click="remove">删除</button>
        <div class="footer-right">
          <button class="btn-cancel" @click="$emit('close')">取消</button>
          <button class="btn-save" :disabled="!form.title.trim()" @click="save">
            {{ isEdit ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTaskStore } from '../store/tasks.js'

const props = defineProps({ task: { type: Object, default: null } })
const emit = defineEmits(['close'])

const store = useTaskStore()
const isEdit = computed(() => !!props.task)

const form = ref({
  title: props.task?.title ?? '',
  priority: props.task?.priority ?? 'medium',
  status: props.task?.status ?? 'todo',
  deadline: props.task?.deadline ?? '',
  assignee: props.task?.assignee ?? '自己',
  tags: [...(props.task?.tags ?? [])],
  notes: props.task?.notes ?? '',
})

function toggleTag(tag) {
  const idx = form.value.tags.indexOf(tag)
  if (idx === -1) form.value.tags.push(tag)
  else form.value.tags.splice(idx, 1)
}

function save() {
  if (!form.value.title.trim()) return
  if (isEdit.value) {
    store.updateTask(props.task.id, { ...form.value })
  } else {
    store.addTask({ ...form.value })
  }
  emit('close')
}

function remove() {
  if (confirm('确定删除这条任务？')) {
    store.removeTask(props.task.id)
    emit('close')
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 20, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: var(--radius);
  backdrop-filter: blur(4px);
}

.form-panel {
  background: rgba(22, 34, 60, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius);
  width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 4px;
}

.close-btn:hover { color: var(--text-primary); }

.form-body {
  padding: 12px 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field.row {
  flex-direction: row;
  gap: 10px;
}

.sub-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
}

input, select, textarea {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  padding: 6px 8px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--border-focus);
}

select option { background: #1e293b; }

textarea { resize: none; }

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.tag-chip:hover { border-color: var(--accent); }
.tag-chip.active {
  background: rgba(99, 102, 241, 0.25);
  border-color: var(--accent);
  color: #a5b4fc;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.footer-right { display: flex; gap: 8px; }

button {
  font-family: inherit;
  cursor: pointer;
  border-radius: 6px;
  font-size: 12px;
  padding: 6px 14px;
  border: none;
  transition: all 0.15s;
}

.btn-save {
  background: var(--accent);
  color: white;
}
.btn-save:hover { background: var(--accent-hover); }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-cancel {
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-cancel:hover { color: var(--text-primary); }

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-danger:hover { background: rgba(239, 68, 68, 0.25); }
</style>
