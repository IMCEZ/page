# OpenAI 协议 · 端口与调用参考

本页整理常用 API 路径与调用方式。本应用仅保留 **一个第三方 OpenAI 协议 API 调用端口**，并支持 **主流官方调用端口** 与 **模型列表获取与识别**。

---

## 一、常用 API 路径（Endpoints）

| 功能         | 路径                         | 方法 |
|--------------|------------------------------|------|
| 对话补全     | `/v1/chat/completions`       | POST |
| 获取模型列表 | `/v1/models`                 | GET  |
| 获取单个模型 | `/v1/models/{model_id}`      | GET  |
| 文本补全     | `/v1/completions`            | POST |
| 嵌入向量     | `/v1/embeddings`             | POST |
| 图像生成     | `/v1/images/generations`     | POST |
| 音频转写     | `/v1/audio/transcriptions`   | POST |
| 文本转语音   | `/v1/audio/speech`           | POST |

- **OpenAI 官方 Base URL**：`https://api.openai.com/v1`
- **第三方**：在设置中仅保留一个「第三方 API 地址」输入框，填兼容服务的 Base URL（如 `http://localhost:3000/v1`）。

本应用使用：
- **对话补全**：`POST {BaseURL}/chat/completions`（生成开场白、游戏内对话）
- **模型列表识别**：`GET {BaseURL}/models`（获取模型列表并填充下拉选项）

---

## 二、模型列表获取与识别（GET /v1/models）

本应用在「API 设置」与游戏内「配置」中提供 **获取模型列表** 按钮，请求当前配置的 `{BaseURL}/models`，解析返回的 `data` 数组并填充模型下拉框。

### 请求示例（前端）

```javascript
const baseUrl = 'https://api.openai.com/v1';  // 或第三方 Base URL
const res = await fetch(baseUrl + '/models', {
  method: 'GET',
  headers: { 'Authorization': 'Bearer sk-xxx' }
});
const data = await res.json();
const modelIds = (data.data || []).map(m => m.id);
```

### 返回结构（模型列表）

```json
{
  "object": "list",
  "data": [
    { "id": "gpt-4o", "object": "model", "created": 1715367049, "owned_by": "system" },
    { "id": "gpt-4o-mini", "object": "model", "created": 1721172741, "owned_by": "system" }
  ]
}
```

### 各平台模型列表路径

| 平台/服务       | 模型列表路径示例                          |
|----------------|-------------------------------------------|
| OpenAI 官方    | `https://api.openai.com/v1/models`        |
| 第三方（自填） | `{你填的 Base URL}/models`，如 `http://localhost:3000/v1/models` |

兼容 OpenAI 协议的服务（OneAPI、Ollama、vLLM、LM Studio、LocalAI 等）均支持 `GET /v1/models`。

---

## 三、前端（JavaScript）调用示例

### 非流式

```javascript
const url = 'https://api.openai.com/v1/chat/completions';  // 可改为自建/中转地址
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-xxxxxxxxxxxx'
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: '你是一个有帮助的助手' },
      { role: 'user', content: '你好呀！' }
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: false
  })
});
const data = await res.json();
console.log(data.choices[0].message.content);
```

### 流式（Stream）

```javascript
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-xxx' },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: '写一首小诗' }],
    stream: true
  })
});
const reader = res.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  for (const line of chunk.split('\n')) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
      const json = JSON.parse(line.slice(6));
      const content = json.choices?.[0]?.delta?.content;
      if (content) process.stdout.write(content);
    }
  }
}
```

---

## 四、Python 调用示例

### 使用 openai 官方库（推荐）

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-xxxxxxxxxxxx",
    base_url="https://api.openai.com/v1"  # 可替换为第三方地址，如 http://localhost:3000/v1
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "你是一个有帮助的助手"},
        {"role": "user", "content": "你好呀！"}
    ],
    temperature=0.7,
    max_tokens=1024
)
print(response.choices[0].message.content)
```

### 使用 requests 原始调用

```python
import requests

url = "https://api.openai.com/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-xxxxxxxxxxxx"
}
data = {
    "model": "gpt-4o",
    "messages": [
        {"role": "system", "content": "你是一个有帮助的助手"},
        {"role": "user", "content": "你好呀！"}
    ],
    "temperature": 0.7,
    "max_tokens": 1024,
    "stream": False
}
response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result["choices"][0]["message"]["content"])
```

---

## 五、cURL 调用

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-xxxxxxxxxxxx" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }'
```

---

## 六、第三方兼容服务与默认端口

许多项目兼容 OpenAI 协议，只需将 **Base URL** 改为对应服务地址即可。

| 常见服务           | 默认端口 | 对话补全 URL 示例              |
|--------------------|----------|--------------------------------|
| OneAPI / New API   | 3000     | `http://localhost:3000/v1/chat/completions` |
| Ollama             | 11434    | `http://localhost:11434/v1/chat/completions` |
| vLLM               | 8000     | `http://localhost:8000/v1/chat/completions` |
| LocalAI            | 8080     | `http://localhost:8080/v1/chat/completions` |
| LM Studio          | 1234     | `http://localhost:1234/v1/chat/completions` |

在「API 设置」中可一键填入上述地址（预设按钮）。

---

## 七、返回数据结构示例

```json
{
  "id": "chatcmpl-xxxxx",
  "object": "chat.completion",
  "created": 1709280000,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "你好呀！有什么可以帮你的吗？"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 10,
    "total_tokens": 22
  }
}
```

本应用从 `data.choices[0].message.content` 读取回复内容。
