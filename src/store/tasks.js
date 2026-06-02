import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])
  const assignees = ref(['自己'])
  const tags = ref(['工作', '个人'])
  const settings = ref({
    reminderOffsets: [60],
    lang:       'zh',
    theme:      'dark',
    autoLaunch: false,
    dailySummary: true,
    workDirs:   [],
    position:   null,
    collapsed:  false,
    windowSize: { width: 520, height: 600 },
  })

  const activeTasks = computed(() =>
    tasks.value.filter((t) => t.status !== 'done' && !t.archived)
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

  function calcNextDeadline(deadline, recurrence) {
    const { type, weekday, dayOfMonth } = recurrence ?? {}
    const hasTime = deadline?.includes('T')
    let base
    if (!deadline) {
      base = new Date(); base.setHours(9, 0, 0, 0)
    } else if (hasTime) {
      base = new Date(deadline)
    } else {
      const [y, m, d] = deadline.split('-').map(Number)
      base = new Date(y, m - 1, d)
    }

    if (type === 'daily') {
      base.setDate(base.getDate() + 1)
    } else if (type === 'weekdays') {
      do { base.setDate(base.getDate() + 1) } while ([0, 6].includes(base.getDay()))
    } else if (type === 'weekly' || type === 'biweekly') {
      // 找下一个目标周几（weekly: 至少 +1 天；biweekly: 至少 +8 天跳过本周）
      const target = weekday ?? base.getDay()
      const minDays = type === 'biweekly' ? 8 : 1
      base.setDate(base.getDate() + minDays)
      while (base.getDay() !== target) base.setDate(base.getDate() + 1)
    } else if (type === 'monthly') {
      const target = dayOfMonth ?? base.getDate()
      base.setDate(1)
      base.setMonth(base.getMonth() + 1)
      const maxDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
      base.setDate(Math.min(target, maxDay))
    }

    const pad = n => String(n).padStart(2, '0')
    if (hasTime) return `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}`
    return `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`
  }

  function advanceRecurring(id) {
    const task = tasks.value.find(t => t.id === id)
    if (!task || !task.recurring || !task.recurrence?.type) return false
    updateTask(id, { status: 'todo', deadline: calcNextDeadline(task.deadline, task.recurrence) })
    return true
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
      recurring: false,
      recurrence: {},
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
    if (!task) return
    const next = cycle[task.status]
    if (next === 'done' && advanceRecurring(id)) return
    updateTask(id, { status: next })
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

  function archiveTask(id) {
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) { tasks.value[idx] = { ...tasks.value[idx], archived: true }; persist() }
  }

  function unarchiveTask(id) {
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) { tasks.value[idx] = { ...tasks.value[idx], archived: false }; persist() }
  }

  function archiveDone() {
    tasks.value = tasks.value.map((t) =>
      t.status === 'done' ? { ...t, archived: true } : t
    )
    persist()
  }

  function reorderTasks(orderedIds) {
    orderedIds.forEach((id, i) => {
      const t = tasks.value.find(t => t.id === id)
      if (t) t.sortOrder = i
    })
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
    archiveTask,
    unarchiveTask,
    archiveDone,
    reorderTasks,
    advanceRecurring,
  }
})
