from deepseek import DeepSeekAPI
from dotenv import load_dotenv
import os, httpx
load_dotenv()

deepseek_key = os.getenv("llm_api_key")

client = DeepSeekAPI(api_key=deepseek_key)
response = client.get_models()
print(response)


def test_deepseek_embedding():
    url = "https://api.deepseek.com/embeddings"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {deepseek_key}"
    }
    data = {
        "model": "deepseek-embedding",  # 尝试这个模型名称
        "input": "测试文本"
    }
    
    try:
        response = httpx.post(url, headers=headers, json=data)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text}")
        if response.status_code == 200:
            result = response.json()
            print("Embedding维度:", len(result["data"][0]["embedding"]))
            return True
    except Exception as e:
        print(f"错误: {e}")
    
    return False

# 测试
if test_deepseek_embedding():
    print("DeepSeek Embedding 可用！")
else:
    print("DeepSeek Embedding 不可用，使用备选方案")