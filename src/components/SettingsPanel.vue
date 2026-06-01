<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span>⚙ {{ t('settingsTitle') }}</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <!-- 语言 -->
        <section>
          <h4>{{ t('langSection') }}</h4>
          <div class="seg-group">
            <button
              v-for="l in langs"
              :key="l.value"
              class="seg-btn"
              :class="{ active: currentLang === l.value }"
              @click="setLang(l.value)"
            >{{ l.label }}</button>
          </div>
        </section>

        <!-- 主题 -->
        <section>
          <h4>{{ t('themeSection') }}</h4>
          <div class="seg-group">
            <button
              v-for="th in themes"
              :key="th.value"
              class="seg-btn"
              :class="{ active: currentTheme === th.value }"
              @click="setTheme(th.value)"
            >{{ t(th.labelKey) }}</button>
          </div>
        </section>

        <!-- 提醒设置 -->
        <section>
          <h4>{{ t('reminderSection') }}</h4>
          <div class="field row-inline">
            <label>{{ t('remindBefore') }}</label>
            <input
              type="number"
              v-model.number="notifyHours"
              min="0"
              max="999"
              style="width: 58px"
              @change="saveNotify"
            />
            <span class="unit">{{ t('hoursUnit') }}</span>
            <input
              type="number"
              v-model.number="notifyMinutes"
              min="0"
              max="59"
              style="width: 58px"
              @change="saveNotify"
            />
            <span class="unit">{{ t('minutesUnit') }}</span>
          </div>
        </section>

        <!-- 联系人管理 -->
        <section>
          <h4>{{ t('assigneesSection') }}</h4>
          <div class="chips-wrap">
            <span v-for="a in store.assignees" :key="a" class="chip">
              {{ a }}
              <button v-if="a !== '自己'" class="remove" @click="store.removeAssignee(a)">×</button>
            </span>
          </div>
          <div class="add-row">
            <input
              v-model="newAssignee"
              :placeholder="t('addAssigneePlaceholder')"
              maxlength="20"
              @keyup.enter="addAssignee"
            />
            <button class="btn-add" @click="addAssignee">{{ t('addBtn') }}</button>
          </div>
        </section>

        <!-- 标签管理 -->
        <section>
          <h4>{{ t('tagsSection') }}</h4>
          <div class="chips-wrap">
            <span v-for="tag in store.tags" :key="tag" class="chip">
              {{ tag }}
              <button class="remove" @click="store.removeTag(tag)">×</button>
            </span>
          </div>
          <div class="add-row">
            <input
              v-model="newTag"
              :placeholder="t('addTagPlaceholder')"
              maxlength="20"
              @keyup.enter="addTag"
            />
            <button class="btn-add" @click="addTag">{{ t('addBtn') }}</button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTaskStore } from '../store/tasks.js'
import { useI18n } from '../i18n.js'

defineEmits(['close'])

const store = useTaskStore()
const { t } = useI18n()


const notifyHours   = ref(store.settings.notifyHoursBefore   ?? 1)
const notifyMinutes = ref(store.settings.notifyMinutesBefore ?? 0)
const newAssignee   = ref('')
const newTag        = ref('')

const currentLang  = computed(() => store.settings.lang  ?? 'zh')
const currentTheme = computed(() => store.settings.theme ?? 'dark')

const langs  = [{ value: 'zh', label: '中文' }, { value: 'en', label: 'English' }]
const themes = [
  { value: 'dark',     labelKey: 'themeDark'     },
  { value: 'light',    labelKey: 'themeLight'    },
  { value: 'midnight', labelKey: 'themeMidnight' },
]

function setLang(lang)   { store.updateSettings({ lang }) }
function setTheme(theme) { store.updateSettings({ theme }) }

function saveNotify() {
  store.updateSettings({
    notifyHoursBefore:   notifyHours.value,
    notifyMinutesBefore: notifyMinutes.value,
  })
}

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
  background: rgba(0,0,0,0.34);
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
  box-shadow: var(--shadow);
}

.panel-header {
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
  background: transparent;
  border: none;
  color: var(--t2);
  cursor: pointer;
  font-size: 15px;
  width: 24px; height: 24px;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.close-btn:hover { background: rgba(128,128,128,0.15); color: var(--t1); }

.panel-body {
  padding: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

section h4 {
  color: var(--t2);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--layer2-border);
}

/* 分段按钮组 */
.seg-group {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--layer3-border);
  width: fit-content;
}
.seg-btn {
  background: var(--layer3);
  border: none;
  color: var(--t2);
  font-size: 12px;
  padding: 6px 14px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  border-right: 1px solid var(--layer3-border);
}
.seg-btn:last-child { border-right: none; }
.seg-btn:hover { color: var(--t1); background: var(--layer1-hover); }
.seg-btn.active { background: var(--accent); color: #fff; font-weight: 600; }

.theme-light .seg-btn.active { color: #062030; }

/* 行内字段 */
.field.row-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.field.row-inline label { color: var(--t2); font-size: 13px; }
.field.row-inline input {
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 7px;
  color: var(--t1);
  font-size: 13px;
  padding: 6px 8px;
  outline: none;
  font-family: inherit;
}
.field.row-inline input:focus { border-color: var(--accent); }
.unit { color: var(--t2); font-size: 13px; }

/* chips */
.chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  color: var(--t1);
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 8px;
}
.remove {
  background: transparent; border: none;
  color: var(--t3); cursor: pointer; font-size: 13px; padding: 0; line-height: 1;
}
.remove:hover { color: #f87171; }

.add-row { display: flex; gap: 6px; }
.add-row input {
  flex: 1;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 7px;
  color: var(--t1);
  font-size: 13px;
  padding: 7px 9px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}
.add-row input::placeholder { color: var(--t3); }
.add-row input:focus { border-color: var(--accent); }

.btn-add {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  padding: 6px 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.btn-add:hover { background: var(--accent-hover); }
.theme-light .btn-add { color: #062030; }

</style>
