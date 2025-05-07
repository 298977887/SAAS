## 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制所有文件
COPY . .

# 构建应用
RUN pnpm build

## 生产阶段
FROM node:20-alpine AS runner

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 安装pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./

# 设置数据库连接环境变量
ENV DB_HOST=mysql-container
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASSWORD=aiwoQwo520..
ENV DB_DATABASE=saas_master
ENV DB_ADMIN_USER=root
ENV DB_ADMIN_PASSWORD=aiwoQwo520..

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "start"] 