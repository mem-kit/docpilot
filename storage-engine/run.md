## Setup

python3 -m venv myenv

source myenv/bin/activate

source myenv/bin/activate


pip install -r requirements.txt

http://localhost:8000/docs

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload


## Docker Image

# 构建镜像
docker build -t storage-engine:latest .

# 运行容器（映射端口和挂载 docs 目录）
docker run -d -p 80:8000 -v $(pwd)/docs:/app/docs --name storage-engine storage-engine:latest

# 查看日志
docker logs -f storage-engine

python3 -m venv myenv
# 复制修改后的文件到容器
docker cp /home/storage-engine/storage-engine/main.py storage-engine:/app/main.py

docker cp /home/storage-engine/storage-engine/requirements.txt storage-engine:/app/requirements.txt


# 重启容器或重启应用进程
docker restart <container_id>