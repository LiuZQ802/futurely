<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <div class="panel-header">
        <span>⚙ {{ t('settingsTitle') }}</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <!-- 开机自启 -->
        <section>
          <div class="toggle-row">
            <span class="toggle-label">{{ t('autoLaunch') }}</span>
            <button
              class="toggle-btn"
              :class="{ on: autoLaunch }"
              @click="toggleAutoLaunch"
            >
              <span class="thumb" />
            </button>
          </div>
        </section>

        <!-- 每日摘要 -->
        <section>
          <div class="toggle-row">
            <div>
              <span class="toggle-label">{{ t('dailySummarySection') }}</span>
              <span class="hint">{{ t('dailySummaryHint') }}</span>
            </div>
            <button
              class="toggle-btn"
              :class="{ on: dailySummary }"
              @click="toggleDailySummary"
            >
              <span class="thumb" />
            </button>
          </div>
        </section>

        <!-- 全局热键 -->
        <section>
          <h4>{{ t('globalHotkeySection') }}</h4>
          <div class="hotkey-row">
            <kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>F</kbd>
            <span class="hotkey-desc">{{ t('hotkeyHint') }}</span>
          </div>
        </section>

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
          <!-- 预设快捷 -->
          <div class="reminder-chips">
            <button
              v-for="p in reminderPresets"
              :key="p.offset"
              class="reminder-chip"
              :class="{ active: reminderOffsets.includes(p.offset) }"
              @click="toggleOffset(p.offset)"
            >{{ currentLang === 'zh' ? p.zh : p.en }}</button>
          </div>
          <!-- 自定义时间点（已添加） -->
          <div v-if="customOffsets.length" class="reminder-chips" style="margin-top: 7px">
            <span v-for="off in customOffsets" :key="off" class="reminder-chip active custom-chip">
              {{ fmtOffset(off) }}
              <button class="chip-rm" @click="removeOffset(off)">×</button>
            </span>
          </div>
          <!-- 自定义输入行 -->
          <div class="custom-row">
            <span class="custom-label">{{ currentLang === 'zh' ? '自定义' : 'Custom' }}</span>
            <input type="number" v-model.number="customH" min="0" max="999" class="time-inp" @keyup.enter="addCustom" />
            <span class="unit">{{ t('hoursUnit') }}</span>
            <input type="number" v-model.number="customM" min="0" max="59" class="time-inp" @keyup.enter="addCustom" />
            <span class="unit">{{ t('minutesUnit') }}</span>
            <button class="add-custom-btn" @click="addCustom">+</button>
          </div>
          <p v-if="reminderOffsets.length === 0" class="reminder-none">{{ t('reminderNone') }}</p>
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

        <!-- 回收站 -->
        <section>
          <div class="toggle-row" @click="$emit('open-recycle')" style="cursor: pointer">
            <span class="toggle-label">🗑 {{ t('recycleBin') }}</span>
            <span style="color: var(--t3); font-size: 13px">›</span>
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

defineEmits(['close', 'open-recycle'])

const store = useTaskStore()
const { t } = useI18n()


const newAssignee = ref('')
const newTag      = ref('')

const PRESET_OFFSETS = [1440, 180, 60, 30, 0]

const reminderPresets = [
  { offset: 1440, zh: '1 天前',   en: '1 day before'   },
  { offset: 180,  zh: '3 小时前', en: '3 hours before' },
  { offset: 60,   zh: '1 小时前', en: '1 hour before'  },
  { offset: 30,   zh: '30 分钟前',en: '30 min before'  },
  { offset: 0,    zh: '到期时',   en: 'At due time'    },
]

const reminderOffsets = computed(() => store.settings.reminderOffsets ?? [60])
const customOffsets   = computed(() => reminderOffsets.value.filter(o => !PRESET_OFFSETS.includes(o)))

const customH = ref(1)
const customM = ref(0)

function toggleOffset(offset) {
  const current = [...reminderOffsets.value]
  const idx = current.indexOf(offset)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(offset)
  store.updateSettings({ reminderOffsets: current })
}

function addCustom() {
  const total = (customH.value ?? 0) * 60 + (customM.value ?? 0)
  if (total <= 0 || reminderOffsets.value.includes(total)) return
  store.updateSettings({ reminderOffsets: [...reminderOffsets.value, total] })
}

function removeOffset(offset) {
  store.updateSettings({ reminderOffsets: reminderOffsets.value.filter(o => o !== offset) })
}

function fmtOffset(totalMin) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const lang = currentLang.value
  if (lang === 'zh') {
    if (h > 0 && m > 0) return `${h} 小时 ${m} 分钟前`
    if (h > 0) return `${h} 小时前`
    return `${m} 分钟前`
  } else {
    if (h > 0 && m > 0) return `${h}h ${m}m before`
    if (h > 0) return `${h}h before`
    return `${m}m before`
  }
}

// 开机自启
const autoLaunch = computed(() => !!store.settings.autoLaunch)
function toggleAutoLaunch() {
  const next = !autoLaunch.value
  store.updateSettings({ autoLaunch: next })
  window.electronAPI?.setAutoLaunch(next)
}

// 每日摘要
const dailySummary = computed(() => store.settings.dailySummary !== false)
function toggleDailySummary() {
  store.updateSettings({ dailySummary: !dailySummary.value })
}

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

/* 开关行 */
.toggle-row {
  display: flex; align-items: center; justify-content: space-between;
}
.toggle-label { color: var(--t2); font-size: 13px; }
.toggle-btn {
  width: 38px; height: 22px; border-radius: 11px;
  background: var(--layer3); border: 1px solid var(--layer3-border);
  cursor: pointer; position: relative; transition: background 0.2s;
  flex-shrink: 0;
}
.toggle-btn.on { background: var(--accent); border-color: var(--accent); }
.thumb {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--t3); transition: transform 0.2s, background 0.2s;
}
.toggle-btn.on .thumb { transform: translateX(16px); background: #fff; }

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

/* 提醒时间点 chips */
.reminder-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.reminder-chip {
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  color: var(--t2);
  font-size: 12px;
  font-family: inherit;
  font-weight: 500;
  padding: 5px 11px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.reminder-chip:hover { color: var(--t1); border-color: var(--accent); }
.reminder-chip.active {
  background: var(--accent);
  color: #061513;
  border-color: var(--accent);
  font-weight: 600;
}
.theme-light .reminder-chip.active { color: #fff; }

.reminder-none {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--t3);
}

.custom-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: default;
}
.chip-rm {
  background: transparent;
  border: none;
  color: rgba(6, 21, 19, 0.6);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  line-height: 1;
  margin-left: 1px;
}
.chip-rm:hover { color: #f87171; }

/* 自定义提醒输入行 */
.custom-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: nowrap;
}
.custom-label {
  font-size: 12px;
  color: var(--t3);
  flex-shrink: 0;
  margin-right: 2px;
}
.time-inp {
  width: 46px;
  flex-shrink: 0;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 7px;
  color: var(--t1);
  font-size: 13px;
  padding: 5px 7px;
  outline: none;
  font-family: inherit;
  text-align: center;
  -moz-appearance: textfield;
}
.time-inp::-webkit-outer-spin-button,
.time-inp::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.time-inp:focus { border-color: var(--accent); }
.add-custom-btn {
  flex-shrink: 0;
  background: var(--accent);
  color: #061513;
  border: none;
  border-radius: 7px;
  font-size: 16px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  line-height: 1;
  margin-left: auto;
}
.add-custom-btn:hover { background: var(--accent-hover); }

/* 每日摘要 toggle 行里的子提示 */
.hint {
  display: block;
  font-size: 11px;
  color: var(--t3);
  margin-top: 2px;
}

/* 热键展示行 */
.hotkey-row {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--t3);
  font-size: 12px;
}
kbd {
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 5px;
  padding: 2px 7px;
  font-size: 12px;
  font-family: inherit;
  color: var(--t1);
}
.hotkey-desc {
  margin-left: 6px;
  color: var(--t2);
}
</style>
