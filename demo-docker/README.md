# 部署
配置内容：数据库，大模型api，大模型调用限制

如果是要配置多个前端项目共用一个后端和mysql一起跑的话，可以参考这个目录 ，修改 front-web-xxx 即可

- docker compose up -d  (docker compose up -d --build 重新构建)
- docker ps -a
- docker compose logs -f
