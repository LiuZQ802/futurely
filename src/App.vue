<template>
  <FloatingWidget v-if="loaded" />
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import FloatingWidget from './components/FloatingWidget.vue'
import { useTaskStore } from './store/tasks.js'
import './assets/glass.css'

const store = useTaskStore()
const loaded = ref(false)

// 主题类挂到 <html>，在 store 加载前先用 dark
watchEffect(() => {
  const theme = store.settings.theme ?? 'dark'
  document.documentElement.className = theme === 'dark' ? '' : `theme-${theme}`
})

onMounted(async () => {
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) e.preventDefault()
  }, { passive: false })

  await store.load()
  loaded.value = true
})
</script>
