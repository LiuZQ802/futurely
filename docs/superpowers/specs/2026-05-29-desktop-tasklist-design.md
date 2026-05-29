# 桌面任务清单 · 设计规格

**日期：** 2026-05-29  
**项目：** DesktopList  
**技术栈：** Electron + Vue 3 + Vite

---

## 一、产品定位

一个运行在 Windows 桌面上的悬浮任务清单小组件，供个人记录待办事项、截止日期、优先级及负责人信息，支持折叠至角落图标，随时可用。

---

## 二、整体架构

```
主进程 (main.js)
├── 创建无边框透明悬浮窗口（始终置顶）
├── 系统托盘图标（右键菜单：显示/退出）
├── IPC 处理器：读写 tasks.json
└── 定时任务：每次启动时检查截止日提醒

渲染进程 (renderer/)
└── Vue 3 + Vite 应用
    ├── 主界面：任务列表
    ├── 新建/编辑弹窗
    └── 设置面板

数据层
└── tasks.json（存于 Electron AppData 目录）
```

**IPC 通道：**
- `tasks:load` — 读取所有数据
- `tasks:save` — 保存所有数据
- `window:drag` — 传递窗口拖拽位置
- `window:toggle-collapse` — 折叠/展开窗口

---

## 三、数据模型

```json
{
  "tasks": [
    {
      "id": "uuid-v4",
      "title": "完成季度报告",
      "deadline": "2026-05-30",
      "priority": "urgent",
      "assignee": "自己",
      "notes": "需要包含Q2数据",
      "status": "todo",
      "tags": ["工作"],
      "createdAt": "2026-05-29T10:00:00Z"
    }
  ],
  "assignees": ["自己", "张三", "李四"],
  "tags": ["工作", "个人", "项目A"],
  "settings": {
    "notifyDaysBefore": 1,
    "position": { "x": 1400, "y": 800 },
    "collapsed": false,
    "windowSize": { "width": 320, "height": 500 }
  }
}
```

**字段说明：**
- `priority`：`urgent`（紧急）| `high`（高）| `medium`（中）| `low`（低）
- `status`：`todo`（待办）| `inprogress`（进行中）| `done`（已完成）

---

## 四、Vue 组件结构

```
src/
├── main.js                 # Vue 入口
├── App.vue                 # 根组件，管理全局状态
├── store/
│   └── tasks.js            # Pinia store（任务、联系人、标签、设置）
├── components/
│   ├── FloatingWidget.vue  # 主容器：展开态
│   ├── WidgetHeader.vue    # 标题栏（拖拽区 + 折叠/设置按钮）
│   ├── TaskList.vue        # 任务列表 + 筛选栏
│   ├── TaskCard.vue        # 单条任务卡片
│   ├── TaskForm.vue        # 新建/编辑任务弹窗
│   ├── SettingsPanel.vue   # 设置：联系人、标签、提醒天数
│   └── MiniButton.vue      # 折叠态小圆钮
└── assets/
    └── styles/
        └── glass.css       # 毛玻璃通用样式变量
```

---

## 五、功能清单

### 5.1 任务管理
| 功能 | 描述 |
|------|------|
| 新建任务 | 填写名称（必填）、截止日期、优先级、负责人、分类标签、备注 |
| 编辑任务 | 点击任务卡片打开编辑弹窗 |
| 删除任务 | 编辑弹窗内删除，带二次确认 |
| 状态切换 | 点击状态圆点循环切换：待办→进行中→已完成 |
| 完成样式 | 已完成任务文字划线，降低透明度 |

### 5.2 列表视图
| 功能 | 描述 |
|------|------|
| 排序 | 默认按截止日期升序，可按优先级排序 |
| 筛选 | 按状态筛选（显示/隐藏已完成）、按标签筛选 |
| 截止提示 | 今天截止显示橙色，已逾期显示红色闪烁 |

### 5.3 窗口行为
| 功能 | 描述 |
|------|------|
| 拖拽移动 | 拖动 WidgetHeader 移动窗口，松开后保存位置 |
| 折叠/展开 | 点击折叠按钮缩小为 56×56px 圆钮，显示未完成数量角标 |
| 始终置顶 | 窗口始终显示在其他窗口之上 |
| 位置记忆 | 关闭/重启后恢复上次窗口位置 |

### 5.4 通知提醒
- 应用启动时扫描所有任务
- 截止日期在 N 天内（默认 1 天）的未完成任务触发系统通知
- N 可在设置面板调整

### 5.5 打包发布
- 使用 `electron-builder` 打包为 Windows `Setup.exe` 安装程序
- 支持桌面快捷方式、开机自启选项

---

## 六、视觉风格

- **背景**：深色半透明（`rgba(15, 23, 42, 0.85)`）+ CSS `backdrop-filter: blur(12px)`
- **边框**：`1px solid rgba(255,255,255,0.10)`
- **阴影**：`0 8px 32px rgba(0,0,0,0.5)`
- **圆角**：主窗口 `14px`，卡片 `8px`
- **优先级色彩**：
  - 紧急：`#ef4444`（红）
  - 高：`#eab308`（黄）
  - 中：`#3b82f6`（蓝）
  - 低：`#64748b`（灰）
- **状态色彩**：待办（灰）、进行中（蓝）、已完成（绿）

---

## 七、项目目录结构

```
DesktopList/
├── package.json
├── vite.config.js
├── electron/
│   ├── main.js          # Electron 主进程
│   └── preload.js       # 预加载脚本（IPC 桥接）
├── src/                 # Vue 3 渲染进程
│   ├── main.js
│   ├── App.vue
│   ├── store/
│   └── components/
└── dist/                # Vite 构建输出
```

---

## 八、开发里程碑

1. 项目脚手架（Electron + Vite + Vue 3）
2. 主进程：无边框透明窗口 + 始终置顶
3. 数据层：IPC + JSON 读写
4. Vue 组件：任务列表 + 新建/编辑表单
5. 窗口拖拽 + 折叠/展开 + 位置记忆
6. 优先级筛选 + 截止日期高亮
7. 系统通知提醒
8. 设置面板（联系人、标签管理）
9. electron-builder 打包配置
