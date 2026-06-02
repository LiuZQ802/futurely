import { computed } from 'vue'
import { useTaskStore } from './store/tasks.js'

export const messages = {
  zh: {
    // 列表
    noTasks:         '暂无任务 ✨',
    filterAll:       '全部',
    filterTodo:      '待办',
    filterInProgress:'进行中',
    filterDone:      '已完成',
    allTags:         '所有标签',

    // 优先级
    pUrgent: '紧急', pHigh: '高', pMedium: '中', pLow: '低',

    // 状态
    sTodo: '待办', sInProgress: '进行中', sDone: '已完成',
    clickToSwitch: '点击切换',

    // 截止日期格式（函数）
    fmtDaysDiff(n, timePart) {
      if (n < 0)   return `逾期${-n}天${timePart ? ' ' + timePart : ''}`
      if (n === 0) return timePart ? `今天 ${timePart}` : '今天截止'
      if (n === 1) return `明天${timePart ? ' ' + timePart : ''}`
      if (n <= 7)  return `${n}天后${timePart ? ' ' + timePart : ''}`
      return null
    },

    // 表单
    editTask:            '编辑任务',
    newTask:             '新建任务',
    titleLabel:          '任务名称 *',
    titlePlaceholder:    '任务名称',
    priorityLabel:       '优先级',
    statusLabel:         '状态',
    deadlineLabel:       '截止时间',
    assigneeLabel:       '负责人',
    assigneePlaceholder: '输入或选择负责人',
    tagsLabel:           '分类标签',
    notesLabel:          '备注',
    notesPlaceholder:    '补充说明...',
    deleteBtn:           '删除',
    cancelBtn:           '取消',
    saveBtn:             '保存',
    createBtn:           '创建',
    confirmDelete:       '确定删除这条任务？',

    // 优先级选项
    optUrgent: '🔴 紧急', optHigh: '🟡 高', optMedium: '🔵 中', optLow: '⚫ 低',

    // 状态选项
    optTodo: '待办', optInProgress: '进行中', optDone: '已完成',

    // Header
    snapBadge:    '贴边',
    edgeName:     { left: '左', right: '右', top: '顶', bottom: '底' },
    snapTooltip:  (edge) => `已贴${edge}边缩入 · 拖动可取消`,
    btnNewTask:   '新建任务',
    btnSettings:  '设置',
    btnCollapse:  '折叠',

    // 设置面板
    settingsTitle:          '设置',
    reminderSection:        '截止日期提醒',
    remindBefore:           '提前提醒',
    hoursUnit:              '小时',
    minutesUnit:            '分钟',
    assigneesSection:       '预设联系人',
    addAssigneePlaceholder: '添加联系人',
    addBtn:                 '添加',
    tagsSection:            '分类标签',
    addTagPlaceholder:      '添加标签',
    autoLaunch:             '开机自启动',
    workDirLabel:           '工作目录',
    workDirPlaceholder:     '未设置',
    browseBtn:              '浏览',
    searchPlaceholder:      '搜索任务...',
    langSection:            '语言',
    themeSection:           '主题',
    themeDark:              '深色',
    themeLight:             '浅色',
    themeMidnight:          '午夜',
    aboutSection:           '关于',
    aboutDesc:              '随时置顶、贴边收纳，让任务规划始终触手可及。',
    checkUpdate:            '检查更新',
    checking:               '检查中...',
    upToDate:               '已是最新版本',
    updateAvailable:        '发现新版本',
    updateError:            '检查失败，请稍后重试',
    downloadUpdate:         '前往下载',
    whatsNew:               '更新内容',
    version:                '版本',
  },

  en: {
    noTasks:         'No tasks ✨',
    filterAll:       'All',
    filterTodo:      'Todo',
    filterInProgress:'In Progress',
    filterDone:      'Done',
    allTags:         'All Tags',

    pUrgent: 'Urgent', pHigh: 'High', pMedium: 'Med', pLow: 'Low',

    sTodo: 'Todo', sInProgress: 'In Progress', sDone: 'Done',
    clickToSwitch: 'Click to switch',

    fmtDaysDiff(n, timePart) {
      const tp = timePart ? ` ${timePart}` : ''
      if (n < 0)   return `${-n}d overdue${tp}`
      if (n === 0) return `Today${tp}`
      if (n === 1) return `Tomorrow${tp}`
      if (n <= 7)  return `in ${n}d${tp}`
      return null
    },

    editTask:            'Edit Task',
    newTask:             'New Task',
    titleLabel:          'Title *',
    titlePlaceholder:    'Task title',
    priorityLabel:       'Priority',
    statusLabel:         'Status',
    deadlineLabel:       'Due Date',
    assigneeLabel:       'Assignee',
    assigneePlaceholder: 'Enter or select assignee',
    tagsLabel:           'Tags',
    notesLabel:          'Notes',
    notesPlaceholder:    'Additional notes...',
    deleteBtn:           'Delete',
    cancelBtn:           'Cancel',
    saveBtn:             'Save',
    createBtn:           'Create',
    confirmDelete:       'Delete this task?',

    optUrgent: '🔴 Urgent', optHigh: '🟡 High', optMedium: '🔵 Medium', optLow: '⚫ Low',
    optTodo: 'Todo', optInProgress: 'In Progress', optDone: 'Done',

    snapBadge:   'Snapped',
    edgeName:    { left: 'Left', right: 'Right', top: 'Top', bottom: 'Bottom' },
    snapTooltip: (edge) => `Snapped to ${edge} · Drag to unsnap`,
    btnNewTask:  'New Task',
    btnSettings: 'Settings',
    btnCollapse: 'Collapse',

    settingsTitle:          'Settings',
    reminderSection:        'Deadline Reminder',
    remindBefore:           'Remind Before',
    hoursUnit:              'hr',
    minutesUnit:            'min',
    assigneesSection:       'Preset Assignees',
    addAssigneePlaceholder: 'Add assignee',
    addBtn:                 'Add',
    tagsSection:            'Tags',
    addTagPlaceholder:      'Add tag',
    autoLaunch:             'Launch at Startup',
    workDirLabel:           'Work Directory',
    workDirPlaceholder:     'Not set',
    browseBtn:              'Browse',
    searchPlaceholder:      'Search tasks...',
    langSection:            'Language',
    themeSection:           'Theme',
    themeDark:              'Dark',
    themeLight:             'Light',
    themeMidnight:          'Midnight',
    aboutSection:           'About',
    aboutDesc:              'Always on top, edge-snap away — your task planner, always within reach.',
    checkUpdate:            'Check for Updates',
    checking:               'Checking...',
    upToDate:               'Already up to date',
    updateAvailable:        'New version available',
    updateError:            'Check failed, try again later',
    downloadUpdate:         'Download',
    whatsNew:               "What's New",
    version:                'Version',
  },
}

export function useI18n() {
  const store = useTaskStore()
  const locale = computed(() => messages[store.settings.lang ?? 'zh'] ?? messages.zh)
  function t(key) {
    return locale.value[key] ?? messages.zh[key] ?? key
  }
  return { t, locale }
}
