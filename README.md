# 本地
## 前后端服务启动方式（cd meow-ledger 和 cd meow-ledger/server）
- npm install
- npm run dev

# 部署
配置内容：数据库，大模型api，大模型调用限制

- cd meow-ledger/server
- cp .env.example .env （如果已存在直接配置）
- docker compose up -d
- docker compose logs -f

访问: http://localhost (前端地址，localhost填服务器ip)

