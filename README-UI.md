# 私域管理系统 - 现代毛玻璃UI效果

一个基于Next.js和React开发的现代化SaaS管理平台，使用最新的毛玻璃UI设计风格，提供明亮通透的用户界面体验。

## 项目特点

- **现代毛玻璃UI效果**：采用最新流行的毛玻璃（Glassmorphism）设计风格，提供通透、现代的用户界面
- **主题切换功能**：支持明亮/深色两种主题模式，满足不同用户偏好和使用场景
- **主题持久化存储**：使用 zustand 管理状态，localStorage 保存主题偏好，刷新页面后仍保持设置
- **响应式设计**：完全适配移动端和桌面端的各种屏幕尺寸
- **动态视觉元素**：使用多种动画效果增强用户体验，包括背景气泡、渐变动画等
- **模块化组件**：基于组件化思想构建，便于维护和扩展

## 技术栈

- **前端框架**：Next.js 15.x + React 19
- **状态管理**：Zustand
- **样式解决方案**：Tailwind CSS 4.x
- **字体**：Geist字体家族（提供现代简约风格）
- **动画**：CSS原生动画
- **开发语言**：TypeScript

## 界面预览

项目提供了多种精美的UI组件和效果：

- **毛玻璃导航栏**：半透明模糊效果，随着主题变化而调整
- **功能展示卡片**：带有微妙悬浮效果的信息卡片
- **数据统计面板**：展示关键数据指标的可视化组件
- **主题切换开关**：允许用户在明亮/深色主题间切换，并记住用户选择

## 目录结构

```
src/
├── app/
│   ├── globals.css      # 全局样式定义，包含毛玻璃效果
│   ├── page.tsx         # 主页面组件
│   └── layout.tsx       # 应用布局和元数据
├── components/
│   └── ThemeProvider.tsx # 主题初始化组件
├── store/
│   └── settingStore.ts   # 设置状态管理，包括主题存储
├── types/
│   └── enum.ts           # 类型和枚举定义
├── lib/                  # 工具函数和库
└── models/               # 数据模型定义
```

## 状态管理

系统使用 Zustand 进行状态管理，具有以下特点：

- **轻量级**：相比 Redux，Zustand 更加简洁易用
- **持久化存储**：通过 localStorage 保存用户设置
- **类型安全**：完全支持 TypeScript 类型
- **主题切换**：提供主题切换功能，并支持刷新后保持用户偏好

### 设置存储示例

```typescript
// 获取设置
const themeMode = useThemeMode();
const { toggleThemeMode } = useSettingActions();

// 切换主题
toggleThemeMode();
```

## 快速开始

1. 克隆项目
```bash
git clone https://github.com/yourusername/saas-platform.git
cd saas-platform
```

2. 安装依赖
```bash
pnpm install
```

3. 启动开发服务器
```bash
pnpm dev
```

4. 访问 http://localhost:3000 查看效果

## 构建生产版本

```bash
pnpm build
pnpm start
```

## 设计说明

### 色彩系统

项目使用了一套鲜明而和谐的色彩系统：

- **主色调**：
  - 蓝色 (#2d7ff9)
  - 紫色 (#8e6bff)
  - 青色 (#06d7b2)
  - 粉色 (#ff66c2)
  - 橙色 (#ff9640)

- **明亮主题背景**：明亮的淡蓝色，配合多彩渐变气泡
- **暗色主题背景**：深蓝色调，带有鲜艳的强调色点缀

### 毛玻璃效果参数

精心调整的毛玻璃效果参数，确保最佳视觉体验：

- **背景模糊**：`backdrop-blur-xl`确保适当的模糊程度
- **透明度**：卡片背景透明度在0.25-0.6之间
- **边框**：微妙的半透明边框提升层次感

## 贡献指南

欢迎贡献代码改进这个项目：

1. Fork该仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

## 开发规范

- 单文件代码严格限制在700行以内（含注释）
- 修改超过700行的文件时，确保每次修改代码行数≤300行，分多次修改
- 使用三级注释体系：
  - 文件头注释（作者/功能/版本）
  - 模块级注释（逻辑分段说明）
  - 关键代码行注释（复杂逻辑解释）
- 创建新组件时，遵循项目的目录组织结构和命名规范

## 许可证

MIT