# 使用官方Node.js作为基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 将package.json和package-lock.json（如果有）复制到容器内
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 如果需要安装全局ts-node
RUN npm install -g ts-node

# 复制项目源代码到容器内
COPY . .

# 暴露容器内的端口号
EXPOSE 4373

# 运行应用
CMD ["ts-node", "./index.ts"]