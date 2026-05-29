<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span>⚙ 设置</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <!-- 提醒设置 -->
        <section>
          <h4>截止日期提醒</h4>
          <div class="field row-inline">
            <label>提前提醒天数</label>
            <input
              type="number"
              v-model.number="notifyDays"
              min="0"
              max="30"
              style="width: 60px"
              @change="store.updateSettings({ notifyDaysBefore: notifyDays })"
            />
            <span class="unit">天</span>
          </div>
        </section>

        <!-- 联系人管理 -->
        <section>
          <h4>预设联系人</h4>
          <div class="chips-wrap">
            <span
              v-for="a in store.assignees"
              :key="a"
              class="chip"
            >
              {{ a }}
              <button
                v-if="a !== '自己'"
                class="remove"
                @click="store.removeAssignee(a)"
              >×</button>
            </span>
          </div>
          <div class="add-row">
            <input
              v-model="newAssignee"
              placeholder="添加联系人"
              maxlength="20"
              @keyup.enter="addAssignee"
            />
            <button class="btn-add" @click="addAssignee">添加</button>
          </div>
        </section>

        <!-- 标签管理 -->
        <section>
          <h4>分类标签</h4>
          <div class="chips-wrap">
            <span v-for="t in store.tags" :key="t" class="chip">
              {{ t }}
              <button class="remove" @click="store.removeTag(t)">×</button>
            </span>
          </div>
          <div class="add-row">
            <input
              v-model="newTag"
              placeholder="添加标签"
              maxlength="20"
              @keyup.enter="addTag"
            />
            <button class="btn-add" @click="addTag">添加</button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTaskStore } from '../store/tasks.js'

defineEmits(['close'])

const store = useTaskStore()
const notifyDays = ref(store.settings.notifyDaysBefore)
const newAssignee = ref('')
const newTag = ref('')

function addAssignee() {
  store.addAssignee(newAssignee.value.trim())
  newAssignee.value = ''
}

function addTag() {
  store.addTag(newTag.value.trim())
  newTag.value = ''
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: var(--radius);
}

.panel {
  background: #1e3456;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius);
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
}

.panel-header {
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
}

.close-btn:hover { color: var(--text-primary); }

.panel-body {
  padding: 12px 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

section h4 {
  color: #c8d8f0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.field.row-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field.row-inline label {
  color: var(--text-secondary);
  font-size: 12px;
}

.unit { color: var(--text-muted); font-size: 12px; }

.chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
}

.remove {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  line-height: 1;
}

.remove:hover { color: var(--priority-urgent); }

.add-row {
  display: flex;
  gap: 6px;
}

.add-row input {
  flex: 1;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  padding: 5px 8px;
  outline: none;
  font-family: inherit;
}

.add-row input:focus { border-color: var(--border-focus); }

.btn-add {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  padding: 5px 12px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.btn-add:hover { background: var(--accent-hover); }
</style>
