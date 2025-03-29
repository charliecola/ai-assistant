# AI助手 (AI Assistant)

基于Vue3和Element Plus构建的AI助手前端项目，集成RegFlow API实现智能对话功能。

## 功能特点

- 💬 智能对话：基于RegFlow API实现自然语言交互
- 📝 历史会话：支持保存和查看历史对话记录
- 🔄 多会话管理：创建、切换和删除会话
- 📱 响应式设计：适配不同设备屏幕尺寸

## 技术栈

- Vue 3 (Composition API)
- Vite
- Element Plus
- Pinia 状态管理
- Vue Router
- Axios

## 环境设置

### 配置API密钥

在项目根目录创建`.env.local`文件，添加以下内容：

```
# RegFlow API配置
VITE_API_BASE_URL=/api
VITE_REGFLOW_API_KEY=your_regflow_api_key_here

# 应用程序配置
VITE_APP_TITLE=AI助手
```

请将`your_regflow_api_key_here`替换为您的RegFlow API密钥。

## 项目启动

### 安装依赖

```bash
npm install
```

### 开发环境启动

```bash
npm run dev
```

### 生产环境构建

```bash
npm run build
```

## 项目结构

```
ai-assistant/
├── public/             # 静态资源
├── src/
│   ├── api/            # API接口
│   ├── assets/         # 项目资源文件
│   ├── components/     # 组件
│   ├── router/         # 路由
│   ├── stores/         # 状态管理
│   ├── utils/          # 工具函数和封装
│   │   └── request/    # Axios封装
│   ├── views/          # 页面
│   ├── App.vue         # 根组件
│   └── main.js         # 入口文件
├── .env                # 环境变量
├── .env.local          # 本地环境变量（不提交到Git）
└── vite.config.js      # Vite配置
```

## 开发指南

- API接口: 在`src/api`目录中添加新的API接口
- 新增页面: 在`src/views`目录中创建新的页面组件，并在`src/router`中添加路由
- 全局状态: 在`src/stores`目录中创建和管理全局状态
