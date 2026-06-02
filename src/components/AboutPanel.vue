<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <button class="close-btn" @click="$emit('close')">✕</button>

      <div class="logo-wrap">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <!-- 圆角方块背景 -->
          <rect x="2" y="2" width="44" height="44" rx="11" fill="#0f172a"/>
          <!-- 金色右箭头 -->
          <polygon points="14,10 14,38 36,24" fill="#fbbf24"/>
        </svg>
      </div>

      <h2 class="name">Futurely</h2>
      <p class="version">{{ t('version') }} {{ version }}</p>
      <p class="desc">{{ t('aboutDesc') }}</p>

      <div class="actions">
        <button class="btn-update" :disabled="updateState === 'checking'" @click="checkUpdate">
          {{ updateLabel }}
        </button>
        <button class="btn-github" @click="openUrl('https://github.com/LiuZQ802/futurely')">
          GitHub ↗
        </button>
      </div>

      <div v-if="updateInfo" class="update-banner" :class="updateInfo.hasUpdate ? 'new' : 'ok'">
        <span>{{ updateInfo.hasUpdate ? `🎉 ${t('updateAvailable')} v${updateInfo.latest}` : `✓ ${t('upToDate')}` }}</span>
        <button v-if="updateInfo.hasUpdate" class="btn-dl" @click="openUrl(updateInfo.url)">
          {{ t('downloadUpdate') }} ↗
        </button>
      </div>

      <!-- 新版本 changelog -->
      <div v-if="updateInfo?.hasUpdate && updateInfo.body" class="changelog">
        <div class="changelog-title">{{ t('whatsNew') }}</div>
        <pre class="changelog-body">{{ updateInfo.body }}</pre>
      </div>

      <div v-if="updateState === 'error'" class="update-banner ok">{{ t('updateError') }}</div>

      <p class="credit">MIT © Ziqi Liu</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../i18n.js'

defineEmits(['close'])
const { t } = useI18n()

const version     = ref('')
const updateState = ref('')
const updateInfo  = ref(null)
const updateLabel = computed(() =>
  updateState.value === 'checking' ? t('checking') : t('checkUpdate')
)

onMounted(async () => {
  version.value = await window.electronAPI?.getVersion() ?? ''
})

async function checkUpdate() {
  updateState.value = 'checking'
  updateInfo.value  = null
  const res = await window.electronAPI?.checkUpdate()
  if (!res || res.error) { updateState.value = 'error'; return }
  updateState.value = 'done'
  updateInfo.value  = res
}

function openUrl(url) { window.electronAPI?.openUrl(url) }
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.38);
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
  width: 78%;
  padding: 22px 18px 16px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px; right: 10px;
  background: transparent; border: none;
  color: var(--t3); cursor: pointer; font-size: 14px;
  width: 22px; height: 22px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.15s;
}
.close-btn:hover { color: var(--t1); }

.logo-wrap { margin-bottom: 4px; }

.name {
  color: var(--t1);
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.version {
  color: var(--t3);
  font-size: 12px;
  margin: 0;
}

.desc {
  color: var(--t2);
  font-size: 12px;
  text-align: center;
  margin: 4px 0 8px;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 8px;
  width: 100%;
}

.btn-update, .btn-github {
  flex: 1;
  font-family: inherit;
  font-size: 12px;
  padding: 7px 0;
  border-radius: 7px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.btn-update {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.btn-update:hover:not(:disabled) { background: var(--accent-hover); }
.btn-update:disabled { opacity: 0.5; cursor: default; }

.btn-github {
  background: var(--layer3);
  color: var(--t2);
  border-color: var(--layer3-border);
}
.btn-github:hover { color: var(--t1); border-color: var(--t3); }

.update-banner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 11.5px;
  gap: 8px;
}
.new { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.25); }
.ok  { background: var(--layer3); color: var(--t3); border: 1px solid var(--layer3-border); }

.btn-dl {
  background: #10b981; color: #fff;
  border: none; border-radius: 5px;
  font-size: 11px; padding: 3px 9px;
  cursor: pointer; white-space: nowrap;
  font-family: inherit; font-weight: 600;
  transition: background 0.15s;
}
.btn-dl:hover { background: #059669; }

.changelog {
  width: 100%;
  background: var(--layer3);
  border: 1px solid var(--layer3-border);
  border-radius: 7px;
  overflow: hidden;
}
.changelog-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--t2);
  padding: 6px 10px 4px;
}
.changelog-body {
  font-size: 11px;
  color: var(--t2);
  line-height: 1.6;
  padding: 0 10px 8px;
  margin: 0;
  max-height: 140px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.credit {
  color: var(--t3);
  font-size: 11px;
  margin: 6px 0 0;
}

.theme-light .btn-update { color: #062030; }
</style>
