# 网页转PDF工具

一个简洁优雅的网页转PDF工具，完全在浏览器中运行，无需后端服务器。

## 功能特点

- 一键转换：输入网址即可转换为 PDF
- 纯前端实现：无需服务器，完全在浏览器中生成 PDF
- 中国大陆可用：不依赖 Vercel API，国内网络直接访问
- 高质量输出：保留原始网页的样式和布局
- 自动下载：转换完成后自动下载 PDF 文件
- 响应式设计：支持桌面端和移动端访问

## 技术栈

- **前端**：React + TypeScript + Tailwind CSS
- **PDF 生成**：html2canvas + jsPDF（纯前端实现）
- **部署**：任何静态托管（Vercel/GitHub Pages/Netlify 等）

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
```

## 部署

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel
```

### 部署到 GitHub Pages

```bash
# 构建项目
npm run build

# 将 dist 目录内容推送到 gh-pages 分支
# 或使用 GitHub Actions 自动部署
```

### 部署到任意静态托管

```bash
npm run build
# 然后将 dist/ 目录上传到任意静态托管服务
```

## 项目结构

```
├── src/
│   ├── App.tsx             # 主应用组件
│   ├── App.css             # 应用样式
│   └── pdf-generator.ts    # PDF 生成核心逻辑
├── index.html              # 入口HTML
├── package.json            # 项目依赖
├── tailwind.config.js      # Tailwind CSS 配置
└── tsconfig.json           # TypeScript 配置
```

## 注意事项

1. **跨域限制**：某些网站设置了 CORS 限制，无法通过 iframe 加载，这种情况下会提示错误
2. **动态内容**：需要 JavaScript 渲染的动态内容可能无法完全捕获
3. **登录保护**：需要登录才能查看的页面无法转换
4. **大页面**：超长的网页可能需要较长时间转换

## License

MIT
