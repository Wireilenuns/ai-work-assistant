# AI 个人工作助手

一个面向个人知识工作者和内容创作者的 AI 工作台。帮助用户完成**内容创作**和**日常工作管理**两件事。

## 核心理念

**一个入口 + 两个助手 + 一套共享工作数据。**

- **内容创作助手**：灵感 → 选题 → 标题 → 大纲 → 初稿 → 内容检查 → 定稿
- **工作管理助手**：任务收集 → AI任务整理 → 优先级判断 → 今日计划 → 执行 → 每日复盘
- **共享数据**：内容可一键转为任务，任务可关联内容

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **样式**: Tailwind CSS 3
- **状态管理**: Zustand 4
- **数据持久化**: Dexie.js (IndexedDB)
- **路由**: React Router 6 (Hash Router)
- **日期处理**: date-fns 3
- **图标**: lucide-react

## 目录结构

```
ai-work-assistant/
├── src/
│   ├── components/          # 通用 UI 组件
│   │   ├── ui.tsx           # Button, Card, Modal, Input, Select, ConfirmDialog 等
│   │   └── Layout.tsx       # 侧边导航栏 + 主布局
│   ├── pages/               # 页面组件
│   │   ├── Today.tsx        # 今日工作台
│   │   ├── ContentAssistant.tsx  # 内容助手入口
│   │   ├── WeChatCreation.tsx    # 公众号创作工作流（7步）
│   │   ├── VideoCreation.tsx     # 视频创作工作流（7步）
│   │   ├── Inspiration.tsx       # 灵感库
│   │   ├── Tasks.tsx             # 工作任务管理
│   │   ├── DailyReview.tsx       # 每日复盘
│   │   └── Settings.tsx          # 用户设置
│   ├── services/
│   │   └── aiService.ts     # AI Service 层（Provider 接口 + Mock 实现）
│   ├── store/
│   │   └── index.ts         # Zustand Store（Task, Inspiration, Content, Review, Settings）
│   ├── models/
│   │   └── types.ts         # 所有 TypeScript 类型定义
│   ├── data/
│   │   ├── db.ts            # Dexie 数据库定义
│   │   └── seedData.ts      # Demo 数据 + 导入导出
│   ├── utils/
│   │   └── date.ts          # 日期处理 + 格式化工具
│   ├── App.tsx              # 路由配置
│   ├── main.tsx             # 入口
│   └── index.css            # 全局样式 + Tailwind
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 本地启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

启动后访问 `http://localhost:5180`（如端口被占用会自动切换）。

首次运行会自动加载 Demo 数据。

## 已完成功能

### 1. 今日工作台
- 顶部日期 + 智能问候
- 今日 Top 3 重要任务（可点击完成）
- 快速记录（自然语言输入，AI 自动解析为结构化任务）
- 四个快捷入口（写公众号、做视频、添加任务、开始复盘）
- "帮我安排今天" AI 计划功能（Top3 / 深度工作 / 快速任务 / 可延后 + 超时预警）
- 今日任务列表（完成、删除）

### 2. 灵感库
- 快速记录一句话灵感
- 标签管理
- 状态流转（待整理 → 可创作 → 创作中 → 已使用）
- 搜索和筛选
- 一键转为公众号选题或视频选题

### 3. 公众号创作工作流（7步）
1. 输入主题
2. AI 提炼核心观点（目标读者、核心问题、核心观点、内容价值）
3. 生成 5 个不同类型标题（观点型/反常识型/结果型/故事型/问题型）
4. 生成文章大纲（可编辑）
5. 生成公众号正文初稿
6. AI 内容检查（8维度评分 + 问题分析 + 优化建议）
7. 定稿（支持复制全文、保存、加入工作计划）

### 4. 视频创作工作流（7步）
1. 输入主题
2. 生成一句话核心观点
3. 生成 3 个 3 秒开头方案
4. 生成视频结构（开头/问题/观点/案例/结论）
5. 生成完整口播稿
6. 生成 5 个视频标题
7. 生成封面文案 + 定稿

### 5. AI 内容检查
- 8 维度检查：开头吸引力、核心观点、内容逻辑、信息密度、重复内容、AI套话、案例细节、结尾力度
- 总评分 0-100
- 最大的三个问题 + 原因 + 修改建议
- 推荐新开头和新结尾
- "帮我优化全文"按钮（保留原始版本和优化版本）
- 不默认覆盖原文

### 6. 工作任务管理
- 五个视图：收件箱、今天、即将到期、所有任务、已完成
- 任务 CRUD（创建、编辑、删除）
- 优先级调整（P1-P4）
- 状态管理（Inbox/待办/进行中/已完成）
- AI 自然语言添加任务（自动解析标题、截止日期、预计时间、优先级、项目）
- "帮我安排今天" AI 计划
- 搜索

### 7. 每日复盘
- 读取当天任务完成情况
- 三个问题引导（完成了什么/没完成什么/最大阻碍）
- AI 自动生成复盘报告
- 今日数据（计划/完成/完成率）
- 关键成果、未完成事项、今日问题
- 明日 Top 3 建议
- 未完成任务一键安排到明天
- 复盘历史记录

### 8. 内容和任务联动
- 内容定稿后可"加入工作计划"
- 自动创建关联任务（确定结构、完成初稿、修改、配图、发布）
- 任务详情显示关联内容
- 内容详情显示关联任务及完成状态

### 9. 用户设置
- 工作信息（工作类型、主要项目、每日工作时间、深度工作时间）
- 内容档案（平台、领域、目标读者、风格、不喜欢的表达、文章/视频长度）
- AI 生成内容时优先读取个人设置
- AI 模式切换（Mock / API）
- 数据导出（JSON）
- 数据导入（JSON）
- 清除 Demo 数据
- 重新加载 Demo 数据

### 10. 数据持久化
- 所有数据存储于 IndexedDB（通过 Dexie.js）
- 刷新后数据不丢失
- 支持 JSON 格式导入导出

## AI 能力架构

所有 AI 功能统一封装在 `src/services/aiService.ts` 中：

- **AIProvider 接口**: 定义所有 AI 方法签名
- **MockAIProvider**: 内置 Mock 实现，模拟真实 AI 行为
- **AIService**: 统一入口，代理到当前 Provider

包含方法：
- `parseTask()` - 自然语言解析任务
- `generateWeChatInsight()` - 公众号观点提炼
- `generateTitles()` - 标题生成
- `generateArticleOutline()` - 大纲生成
- `generateArticle()` - 文章生成
- `generateVideoOpinion()` - 视频观点
- `generateVideoHooks()` - 视频开头
- `generateVideoStructure()` - 视频结构
- `generateVideoScript()` - 口播稿
- `generateVideoTitles()` - 视频标题
- `generateVideoCover()` - 封面文案
- `reviewContent()` - 内容检查
- `optimizeContent()` - 内容优化
- `planToday()` - 今日计划
- `generateDailyReview()` - 每日复盘

### 接入真实 AI

实现 `AIProvider` 接口，然后调用 `setAIProvider()` 替换即可：

```typescript
import { AIProvider, setAIProvider } from './services/aiService'

class MyAIProvider implements AIProvider {
  // 实现所有方法...
}

setAIProvider(new MyAIProvider())
```

API Key 不应硬编码在前端代码中。建议通过后端代理或环境变量管理。

## 暂未完成的功能

- 真实 AI 模型接入（当前为 Mock 模式）
- API Key 安全管理
- 内容版本对比视图
- 任务时间追踪（实际时间记录）
- 数据统计分析仪表盘
- 多设备同步
- PWA 离线支持
- 快捷键支持

## 后续最值得增加的 5 个功能

1. **接入真实大模型 API** - 实现 AIProvider 接口，接入 GPT/Claude/通义千问等模型，让内容生成和任务解析真正智能化
2. **内容版本管理与对比** - 保存每个创作阶段的版本快照，支持版本间 diff 对比和回退
3. **任务时间追踪** - 番茄钟功能，记录每个任务的实际投入时间，与预估时间对比分析
4. **数据统计分析** - 周/月维度的任务完成率趋势图、内容产出统计、时间分配分析
5. **日历视图与提醒** - 可视化日历展示任务安排，支持浏览器通知提醒重要任务截止
