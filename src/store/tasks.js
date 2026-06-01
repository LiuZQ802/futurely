import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])
  const assignees = ref(['自己'])
  const tags = ref(['工作', '个人'])
  const settings = ref({
    notifyHoursBefore:   1,
    notifyMinutesBefore: 0,
    lang:       'zh',
    theme:      'dark',
    autoLaunch: false,
    workDirs:   [],   // string[]，每项为目录绝对路径
    position:   null,
    collapsed:  false,
    windowSize: { width: 340, height: 520 },
  })

  const activeTasks = computed(() =>
    tasks.value.filter((t) => t.status !== 'done')
  )

  // 每次调用时动态获取，避免初始化时快照为 undefined
  function api() { return window.electronAPI }

  async function load() {
    if (!api()) return
    const data = await api().loadData()
    tasks.value = data.tasks ?? []
    assignees.value = data.assignees ?? ['自己']
    tags.value = data.tags ?? ['工作', '个人']
    settings.value = { ...settings.value, ...data.settings }
  }

  async function persist() {
    if (!api()) return
    // Vue Proxy 对象无法被 IPC Structured Clone 序列化，必须转换为纯对象
    const plain = JSON.parse(JSON.stringify({
      tasks: toRaw(tasks.value),
      assignees: toRaw(assignees.value),
      tags: toRaw(tags.value),
      settings: toRaw(settings.value),
    }))
    await api().saveData(plain)
  }

  function addTask(task) {
    tasks.value.push({
      id: uuidv4(),
      title: '',
      deadline: '',
      priority: 'medium',
      assignee: '自己',
      notes: '',
      status: 'todo',
      tags: [],
      createdAt: new Date().toISOString(),
      ...task,
    })
    persist()
  }

  function updateTask(id, patch) {
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...patch }
      persist()
    }
  }

  function removeTask(id) {
    tasks.value = tasks.value.filter((t) => t.id !== id)
    persist()
  }

  function cycleStatus(id) {
    const cycle = { todo: 'inprogress', inprogress: 'done', done: 'todo' }
    const task = tasks.value.find((t) => t.id === id)
    if (task) updateTask(id, { status: cycle[task.status] })
  }

  function addAssignee(name) {
    if (name && !assignees.value.includes(name)) {
      assignees.value.push(name)
      persist()
    }
  }

  function removeAssignee(name) {
    assignees.value = assignees.value.filter((a) => a !== name)
    persist()
  }

  function addTag(name) {
    if (name && !tags.value.includes(name)) {
      tags.value.push(name)
      persist()
    }
  }

  function removeTag(name) {
    tags.value = tags.value.filter((t) => t !== name)
    persist()
  }

  function updateSettings(patch) {
    settings.value = { ...settings.value, ...patch }
    persist()
  }

  return {
    tasks,
    assignees,
    tags,
    settings,
    activeTasks,
    load,
    persist,
    addTask,
    updateTask,
    removeTask,
    cycleStatus,
    addAssignee,
    removeAssignee,
    addTag,
    removeTag,
    updateSettings,
  }
})
