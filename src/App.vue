<template>
  <FloatingWidget v-if="loaded" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import FloatingWidget from './components/FloatingWidget.vue'
import { useTaskStore } from './store/tasks.js'
import './assets/glass.css'

const store = useTaskStore()
const loaded = ref(false)

onMounted(async () => {
  // 禁止 Ctrl+滚轮 / 触控板捏合缩放
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) e.preventDefault()
  }, { passive: false })

  await store.load()
  loaded.value = true
})
</script>
