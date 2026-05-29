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
  await store.load()
  loaded.value = true
})
</script>
