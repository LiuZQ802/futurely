<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="form-panel">
      <div class="form-header">
        <span>{{ isEdit ? t('editTask') : t('newTask') }}</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="form-body">
        <div class="field">
          <label>{{ t('titleLabel') }}</label>
          <input v-model="form.title" :placeholder="t('titlePlaceholder')" maxlength="60" />
        </div>

        <div class="field row">
          <div class="sub-field">
            <label>{{ t('priorityLabel') }}</label>
            <select v-model="form.priority">
              <option value="urgent">{{ t('optUrgent') }}</option>
              <option value="high">{{ t('optHigh') }}</option>
              <option value="medium">{{ t('optMedium') }}</option>
              <option value="low">{{ t('optLow') }}</option>
            </select>
          </div>
          <div class="sub-field">
            <label>{{ t('statusLabel') }}</label>
            <select v-model="form.status">
              <option value="todo">{{ t('optTodo') }}</option>
              <option value="inprogress">{{ t('optInProgress') }}</option>
              <option value="done">{{ t('optDone') }}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>{{ t('deadlineLabel') }}</label>
          <input type="datetime-local" v-model="form.deadline" />
        </div>

        <div class="field">
          <label>{{ t('assigneeLabel') }}</label>
          <div class="assignee-input">
            <input
              v-model="form.assignee"
              list="assignee-list"
              :placeholder="t('assigneePlaceholder')"
            />
            <datalist id="assignee-list">
              <option v-for="a in store.assignees" :key="a" :value="a" />
            </datalist>
          </div>
        </div>

        <div class="field">
          <label>{{ t('tagsLabel') }}</label>
          <div class="tags-wrap">
            <span
              v-for="tag in store.tags"
              :key="tag"
              class="tag-chip"
              :class="{ active: form.tags.includes(tag) }"
              @click="toggleTag(tag)"
            >{{ tag }}</span>
          </div>
        </div>

        <div class="field">
          <label>{{ t('workDirLabel') }}</label>
          <div class="dir-row">
            <input
              :value="form.workDir ? basename(form.workDir) : ''"
              :placeholder="t('workDirPlaceholder')"
              :title="form.workDir"
              readonly
              class="dir-input"
            />
            <button type="button" class="btn-browse" @click="browseDir">{{ t('browseBtn') }}</button>
            <button v-if="form.workDir" type="button" class="btn-clear-dir" @click="form.workDir = ''">✕</button>
          </div>
        </div>

        <div class="field">
          <label>{{ t('notesLabel') }}</label>
          <textarea v-model="form.notes" :placeholder="t('notesPlaceholder')" rows="3" />
        </div>
      </div>

      <div class="form-footer">
        <button v-if="isEdit" class="btn-danger" @click="remove">{{ t('deleteBtn') }}</button>
        <div class="footer-right">
          <button class="btn-cancel" @click="$emit('close')">{{ t('cancelBtn') }}</button>
          <button class="btn-save" :disabled="!form.title.trim()" @click="save">
            {{ isEdit ? t('saveBtn') : t('createBtn') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTaskStore } from '../store/tasks.js'
import { useI18n } from '../i18n.js'

const props = defineProps({ task: { type: Object, default: null } })
const emit = defineEmits(['close'])

const store = useTaskStore()
const { t } = useI18n()
const isEdit = computed(() => !!props.task)

const form = ref({
  title:    props.task?.title    ?? '',
  priority: props.task?.priority ?? 'medium',
  status:   props.task?.status   ?? 'todo',
  deadline: props.task?.deadline ?? '',
  assignee: props.task?.assignee ?? '自己',
  tags:     [...(props.task?.tags ?? [])],
  notes:    props.task?.notes    ?? '',
  workDir:  props.task?.workDir  ?? '',
})

function basename(p) {
  return p.replace(/\\/g, '/').split('/').filter(Boolean).pop() ?? p
}

async function browseDir() {
  const p = await window.electronAPI?.selectFolder()
  if (p) form.value.workDir = p
}

function toggleTag(tag) {
  const idx = form.value.tags.indexOf(tag)
  if (idx === -1) form.value.tags.push(tag)
  else form.value.tags.splice(idx, 1)
}

function save() {
  if (!form.value.title.trim()) return
  if (isEdit.value) store.updateTask(props.task.id, { ...form.value })
  else              store.addTask({ ...form.value })
  emit('close')
}

function remove() {
  if (confirm(t('confirmDelete'))) {
    store.removeTask(props.task.id)
    emit('close')
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: var(--radius);
}

.form-panel {
  background: var(--layer2);
  border: 1px solid var(--layer2-border);
  border-radius: var(--radius);
  width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  border-bottom: 1px solid var(--layer2-border);
  background: var(--layer2-header);
  color: var(--t1);
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.close-btn {
  background: transparent; border: none;
  color: var(--t2); cursor: pointer;
  font-size: 15px; width: 24px; height: 24px;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.close-btn:hover { background: rgba(128,128,128,0.15); color: var(--t1); }

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
  color: var(--t2);
  font-size: 12px;
  font-weight: 600;
}

input, select, textarea {
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 7px;
  color: var(--t1);
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}
input:focus, select:focus, textarea:focus { border-color: var(--accent); }
input::placeholder, textarea::placeholder { color: var(--t3); }

input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  filter: var(--dt-icon-filter);
  cursor: pointer; opacity: 0.85;
  padding: 2px; border-radius: 3px;
  transition: opacity 0.15s;
}
input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  filter: var(--dt-icon-filter-hover);
}

select option { background: var(--layer3); color: var(--t1); }
textarea { resize: none; }

.dir-row { display: flex; gap: 6px; align-items: center; }
.dir-input {
  flex: 1;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 7px;
  color: var(--t2);
  font-size: 12px;
  padding: 7px 10px;
  cursor: default;
}
.dir-input::placeholder { color: var(--t3); }
.btn-browse {
  font-family: inherit; font-size: 12px;
  padding: 6px 10px; border-radius: 7px; cursor: pointer;
  background: var(--layer3); color: var(--t2);
  border: 1px solid var(--layer3-border); white-space: nowrap;
  transition: all 0.15s;
}
.btn-browse:hover { color: var(--t1); border-color: var(--accent); }
.btn-clear-dir {
  background: transparent; border: none; color: var(--t3);
  cursor: pointer; font-size: 13px; padding: 4px; border-radius: 5px;
  transition: color 0.15s;
}
.btn-clear-dir:hover { color: #f87171; }

.tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-chip {
  font-size: 12px; padding: 4px 10px;
  border-radius: 8px;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  color: var(--t2); cursor: pointer;
  transition: all 0.15s;
}
.tag-chip:hover { border-color: var(--accent); color: var(--accent-hover); }
.tag-chip.active {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent-hover);
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-top: 1px solid var(--layer2-border);
  background: var(--layer2-header);
  flex-shrink: 0;
}
.footer-right { display: flex; gap: 8px; }

button {
  font-family: inherit; cursor: pointer;
  border-radius: 7px; font-size: 13px;
  padding: 7px 14px; border: none;
  transition: all 0.15s;
}

.btn-save { background: var(--accent); color: #fff; font-weight: 700; }
.btn-save:hover { background: var(--accent-hover); }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
.theme-light .btn-save { color: #062030; }

.btn-cancel {
  background: var(--layer3);
  color: var(--t2);
  border: 1px solid var(--layer3-border);
}
.btn-cancel:hover { color: var(--t1); }

.btn-danger {
  background: rgba(248,113,113,0.15);
  color: #fca5a5;
  border: 1.5px solid rgba(248,113,113,0.35);
}
.btn-danger:hover { background: rgba(248,113,113,0.28); }
</style>
