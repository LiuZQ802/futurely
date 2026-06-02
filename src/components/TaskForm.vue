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

        <!-- 重复任务 -->
        <div class="field">
          <div class="recur-row">
            <label>{{ t('recurringLabel') }}</label>
            <button
              type="button"
              class="toggle-btn"
              :class="{ on: form.recurring }"
              @click="form.recurring = !form.recurring"
            ><span class="thumb" /></button>
          </div>
          <div v-if="form.recurring" class="recur-types">
            <button
              v-for="r in recurTypes"
              :key="r.value"
              type="button"
              class="recur-chip"
              :class="{ active: form.recurrence.type === r.value }"
              @click="selectRecurType(r.value)"
            >{{ t(r.key) }}</button>
          </div>
          <!-- 周几选择（每周 / 每两周） -->
          <div v-if="form.recurring && (form.recurrence.type === 'weekly' || form.recurrence.type === 'biweekly')" class="recur-sub">
            <span class="sub-label">{{ currentLang === 'zh' ? '每' : 'Every' }}</span>
            <button
              v-for="wd in weekdays"
              :key="wd.val"
              type="button"
              class="recur-chip sm"
              :class="{ active: form.recurrence.weekday === wd.val }"
              @click="form.recurrence = { ...form.recurrence, weekday: wd.val }"
            >{{ currentLang === 'zh' ? wd.zh : wd.en }}</button>
          </div>
          <!-- 每月第几天 -->
          <div v-if="form.recurring && form.recurrence.type === 'monthly'" class="recur-sub">
            <span class="sub-label">{{ currentLang === 'zh' ? '每月第' : 'On day' }}</span>
            <input
              type="number"
              v-model.number="form.recurrence.dayOfMonth"
              min="1" max="31"
              class="day-inp"
            />
            <span class="sub-label">{{ currentLang === 'zh' ? '天' : '' }}</span>
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
const { t, locale } = useI18n()
const isEdit = computed(() => !!props.task)
const currentLang = computed(() => store.settings.lang ?? 'zh')

const recurTypes = [
  { value: 'daily',    key: 'recurDaily'    },
  { value: 'weekdays', key: 'recurWeekdays' },
  { value: 'weekly',   key: 'recurWeekly'   },
  { value: 'biweekly', key: 'recurBiweekly' },
  { value: 'monthly',  key: 'recurMonthly'  },
]

const weekdays = [
  { val: 1, zh: '一', en: 'Mon' },
  { val: 2, zh: '二', en: 'Tue' },
  { val: 3, zh: '三', en: 'Wed' },
  { val: 4, zh: '四', en: 'Thu' },
  { val: 5, zh: '五', en: 'Fri' },
  { val: 6, zh: '六', en: 'Sat' },
  { val: 0, zh: '日', en: 'Sun' },
]

function deadlineDate() {
  const dl = form.value?.deadline
  if (!dl) return null
  return dl.includes('T') ? new Date(dl) : (() => { const [y,m,d] = dl.split('-').map(Number); return new Date(y, m-1, d) })()
}

function selectRecurType(type) {
  const r = { ...form.value.recurrence, type }
  if ((type === 'weekly' || type === 'biweekly') && r.weekday == null) {
    r.weekday = deadlineDate()?.getDay() ?? 1
  }
  if (type === 'monthly' && r.dayOfMonth == null) {
    r.dayOfMonth = deadlineDate()?.getDate() ?? 1
  }
  form.value.recurrence = r
}

const form = ref({
  title:      props.task?.title      ?? '',
  priority:   props.task?.priority   ?? 'medium',
  status:     props.task?.status     ?? 'todo',
  deadline:   props.task?.deadline   ?? '',
  assignee:   props.task?.assignee   ?? '自己',
  tags:       [...(props.task?.tags  ?? [])],
  notes:      props.task?.notes      ?? '',
  workDir:    props.task?.workDir    ?? '',
  recurring:  props.task?.recurring  ?? false,
  recurrence: props.task?.recurrence
    ? { weekday: 1, dayOfMonth: 1, ...props.task.recurrence }
    : { type: 'weekly', weekday: 1, dayOfMonth: 1 },
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

/* 重复任务 */
.recur-row {
  display: flex; align-items: center; justify-content: space-between;
}
.toggle-btn {
  width: 36px; height: 20px; border-radius: 10px;
  background: var(--layer3); border: 1px solid var(--layer3-border);
  cursor: pointer; position: relative; transition: background 0.2s;
  flex-shrink: 0; padding: 0;
}
.toggle-btn.on { background: var(--accent); border-color: var(--accent); }
.thumb {
  position: absolute; top: 2px; left: 2px;
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--t3); transition: transform 0.2s, background 0.2s;
  display: block;
}
.toggle-btn.on .thumb { transform: translateX(16px); background: #fff; }
.recur-types {
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
}
.recur-chip {
  background: var(--layer3); border: 1px solid var(--layer3-border);
  color: var(--t2); font-size: 12px; font-family: inherit;
  font-weight: 500; padding: 4px 11px; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
}
.recur-chip:hover { color: var(--t1); border-color: var(--accent); }
.recur-chip.active {
  background: var(--accent); color: #061513;
  border-color: var(--accent); font-weight: 600;
}
.theme-light .recur-chip.active { color: #fff; }
.recur-chip.sm { padding: 4px 9px; }

.recur-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 7px;
}
.sub-label { font-size: 12px; color: var(--t3); flex-shrink: 0; }
.day-inp {
  width: 52px; flex-shrink: 0;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 7px; color: var(--t1);
  font-size: 13px; padding: 4px 8px;
  outline: none; font-family: inherit; text-align: center;
  -moz-appearance: textfield;
}
.day-inp::-webkit-outer-spin-button,
.day-inp::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.day-inp:focus { border-color: var(--accent); }

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
