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
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: var(--radius);
}

/* 表单面板：中亮蓝灰，明显区别于主窗口深色 */
.form-panel {
  background: #243147;
  border: 1px solid #4a6080;
  border-radius: var(--radius);
  width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0,0,0,0.6);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  border-bottom: 1px solid #3a5070;
  background: #1c2a3e;
  color: #e2eaf6;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #7a9ab8;
  cursor: pointer;
  font-size: 15px;
  width: 24px; height: 24px;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.close-btn:hover { background: rgba(255,255,255,0.1); color: #e2eaf6; }

.form-body {
  padding: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field { display: flex; flex-direction: column; gap: 5px; }
.field.row { flex-direction: row; gap: 10px; }
.sub-field { flex: 1; display: flex; flex-direction: column; gap: 5px; }

label {
  color: #a8c4e0;     /* 亮蓝灰 — 清晰可见 */
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

input, select, textarea {
  background: #1a2840;   /* 比面板深一级 */
  border: 1.5px solid #3d5878;
  border-radius: 6px;
  color: #e8f0fb;         /* 亮白蓝 */
  font-size: 12px;
  padding: 7px 10px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
}
input:focus, select:focus, textarea:focus {
  border-color: #818cf8;
  background: #1f3050;
}
input::placeholder, textarea::placeholder { color: #4a6480; }

select option { background: #1a2840; color: #e8f0fb; }
textarea { resize: none; }

.tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; }

.tag-chip {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #1a2840;
  border: 1.5px solid #3d5878;
  color: #8ab0d0;
  cursor: pointer;
  transition: all 0.15s;
}
.tag-chip:hover { border-color: #818cf8; color: #c4b5fd; }
.tag-chip.active {
  background: rgba(129,140,248,0.2);
  border-color: #818cf8;
  color: #c4b5fd;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-top: 1px solid #3a5070;
  background: #1c2a3e;
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

.btn-save { background: #6366f1; color: #fff; font-weight: 600; }
.btn-save:hover { background: #818cf8; }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-cancel {
  background: #1a2840;
  color: #8ab0d0;
  border: 1.5px solid #3d5878;
}
.btn-cancel:hover { color: #e2eaf6; border-color: #6080a0; }

.btn-danger {
  background: rgba(248,113,113,0.15);
  color: #fca5a5;
  border: 1.5px solid rgba(248,113,113,0.35);
}
.btn-danger:hover { background: rgba(248,113,113,0.28); }
</style>
