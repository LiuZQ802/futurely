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
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: var(--radius);
}

.panel {
  background: var(--layer2);
  border: 1px solid var(--layer2-border);
  border-radius: var(--radius);
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 48px rgba(0,0,0,0.6);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  border-bottom: 1px solid var(--layer2-border);
  background: var(--layer2-header);
  color: var(--t1);
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

.panel-body {
  padding: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

section h4 {
  color: var(--t2);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #3a5070;
}

.field.row-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field.row-inline label {
  color: #a8c4e0;
  font-size: 12px;
}

.unit { color: #7a9ab8; font-size: 12px; }

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
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  color: var(--t1);
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
}

.remove {
  background: transparent;
  border: none;
  color: #5a7a98;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  line-height: 1;
}
.remove:hover { color: #f87171; }

.add-row { display: flex; gap: 6px; }

.add-row input {
  flex: 1;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 6px;
  color: var(--t1);
  font-size: 12px;
  padding: 6px 9px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}
.add-row input::placeholder { color: var(--t3); }
.add-row input:focus { border-color: var(--accent); }

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
