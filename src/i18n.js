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
    filterArchived:  '已归档',
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
    reminderNone:           '已关闭，不会推送截止日期提醒',
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
    aboutDesc:              '把计划变成行动，一件一件走向未来。',
    checkUpdate:            '检查更新',
    checking:               '检查中...',
    upToDate:               '已是最新版本',
    updateAvailable:        '发现新版本',
    updateError:            '检查失败，请稍后重试',
    downloadUpdate:         '下载更新',
    downloading:            '正在下载...',
    restartInstall:         '重启安装',
    whatsNew:               '更新内容',
    version:                '版本',

    // 重复任务
    recurringLabel:  '重复任务',
    recurDaily:      '每天',
    recurWeekdays:   '工作日',
    recurWeekly:     '每周',
    recurBiweekly:   '每两周',
    recurMonthly:    '每月',

    // 右键菜单
    ctxMarkDone: '标记完成',
    ctxMarkTodo: '重置待办',
    ctxDelete:   '删除任务',

    // 归档
    archiveDone: '归档已完成',
    archiveTask: '归档此任务',
    unarchiveTask: '取消归档',

    // 设置 — 全局热键
    globalHotkeySection: '全局热键',
    hotkeyHint:          '召唤 / 隐藏窗口',

    // 设置 — 每日摘要
    dailySummarySection: '每日摘要通知',
    dailySummaryHint:    '每天早上 9 点推送今日任务摘要',

    // 统计
    statActive:    '待处理',
    statDoneWeek:  '本周完成',
    statOverdue:   '逾期',

    // 回收站
    recycleBin:         '回收站',
    recycleEmpty:       '回收站为空',
    deletedAt:          '删除于',
    restore:            '恢复',
    permanentDelete:    '彻底删除',
    clearAll:           '清空回收站',
    confirmClearRecycle:'确定清空回收站？此操作不可撤销。',
    untitled:           '无标题',
  },

  en: {
    noTasks:         'No tasks ✨',
    filterAll:       'All',
    filterTodo:      'Todo',
    filterInProgress:'In Progress',
    filterDone:      'Done',
    filterArchived:  'Archived',
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
    reminderNone:           'Reminders off — no notifications will be sent',
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
    aboutDesc:              'Turn plans into action — one task at a time.',
    checkUpdate:            'Check for Updates',
    checking:               'Checking...',
    upToDate:               'Already up to date',
    updateAvailable:        'New version available',
    updateError:            'Check failed, try again later',
    downloadUpdate:         'Download Update',
    downloading:            'Downloading...',
    restartInstall:         'Restart & Install',
    whatsNew:               "What's New",
    version:                'Version',

    recurringLabel:  'Recurring',
    recurDaily:      'Daily',
    recurWeekdays:   'Weekdays',
    recurWeekly:     'Weekly',
    recurBiweekly:   'Biweekly',
    recurMonthly:    'Monthly',

    ctxMarkDone: 'Mark Done',
    ctxMarkTodo: 'Reset to Todo',
    ctxDelete:   'Delete Task',

    archiveDone: 'Archive Done',
    archiveTask: 'Archive Task',
    unarchiveTask: 'Unarchive',

    globalHotkeySection: 'Global Hotkey',
    hotkeyHint:          'Show / Hide window',

    dailySummarySection: 'Daily Summary',
    dailySummaryHint:    'Push a morning summary at 9 AM',

    statActive:    'Active',
    statDoneWeek:  'Done This Week',
    statOverdue:   'Overdue',

    recycleBin:         'Recycle Bin',
    recycleEmpty:       'Recycle bin is empty',
    deletedAt:          'Deleted',
    restore:            'Restore',
    permanentDelete:    'Delete Permanently',
    clearAll:           'Clear All',
    confirmClearRecycle:'Clear the recycle bin? This cannot be undone.',
    untitled:           'Untitled',
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
