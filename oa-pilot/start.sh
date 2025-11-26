#!/bin/bash


# 切换目录
cd /home/oa-pilot

# 导入 .env 文件
export PORT=3000

# 用 sudo 启动 npm（80 端口需要管理员权限）
nohup sudo npm start > npm.log 2>&1 &

# 保存进程 ID
echo $! > npm.pid

echo "npm 已在后台启动"
echo "进程 ID: $(cat npm.pid)"
echo "日志文件: npm.log"
echo "停止服务请运行: kill \$(cat npm.pid)"
