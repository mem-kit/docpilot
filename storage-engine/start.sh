#!/bin/bash

# 激活虚拟环境
source myenv/bin/activate

# 后台运行 uvicorn，并将输出重定向到日志文件
nohup python -m uvicorn main:app --host 0.0.0.0 --port 80 --reload > uvicorn.log 2>&1 &

# 保存进程 ID
echo $! > uvicorn.pid

echo "Storage Engine 已在后台启动"
echo "进程 ID: $(cat uvicorn.pid)"
echo "日志文件: uvicorn.log"
echo "停止服务请运行: kill \$(cat uvicorn.pid)"
