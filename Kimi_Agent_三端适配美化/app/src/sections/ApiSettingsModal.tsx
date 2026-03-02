import { useState } from 'react';
import { toast } from 'sonner';
import type { ApiConfig } from '@/types';

interface ApiSettingsModalProps {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
  onClose: () => void;
}

export function ApiSettingsModal({ config, onSave, onClose }: ApiSettingsModalProps) {
  const [localConfig, setLocalConfig] = useState<ApiConfig>({ ...config });
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [models, setModels] = useState<string[]>([]);

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const normalizeBaseUrl = (url: string) => {
    if (!url) return '';
    const s = url.trim().replace(/\/+$/, '');
    if (s.endsWith('/v1')) return s;
    if (s.endsWith('/chat/completions')) return s.replace(/\/chat\/completions\/?$/, '');
    return s + '/v1';
  };

  const fetchModels = async () => {
    const baseUrl = localConfig.source === 'third_party'
      ? normalizeBaseUrl(localConfig.url)
      : 'https://api.openai.com/v1';
    
    if (!baseUrl) {
      toast.error('请先输入 API 地址');
      return;
    }

    setIsFetchingModels(true);
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${localConfig.key}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const modelList = (data.data || []).map((m: any) => m.id).filter(Boolean);
      setModels(modelList);
      toast.success(`获取到 ${modelList.length} 个模型`);
    } catch (err: any) {
      toast.error(`获取失败: ${err.message}`);
    } finally {
      setIsFetchingModels(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto bg-[rgba(20,20,35,0.95)] border border-[rgba(212,175,55,0.4)] rounded-2xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
        <h3 className="text-[#d4af37] text-xl font-semibold mb-6 flex items-center gap-2">
          ⚙ API 设置（OpenAI 协议）
        </h3>

        <div className="space-y-4">
          {/* API Source */}
          <div>
            <label className="block text-[#a0a0b0] text-sm mb-2">API 来源</label>
            <select
              value={localConfig.source}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, source: e.target.value as any }))}
              className="w-full astral-input px-3 py-2.5"
            >
              <option value="openai_official">OpenAI 官方（api.openai.com）</option>
              <option value="third_party">第三方（OpenAI 协议兼容）</option>
            </select>
          </div>

          {/* Third party URL */}
          {localConfig.source === 'third_party' && (
            <div>
              <label className="block text-[#a0a0b0] text-sm mb-2">第三方 API 地址（Base URL）</label>
              <input
                type="text"
                value={localConfig.url}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="http://localhost:3000/v1"
                className="w-full astral-input px-3 py-2.5"
              />
              <p className="text-xs text-[#a0a0b0] mt-1">
                兼容 OpenAI 协议的服务，如 OneAPI、Ollama、vLLM、LM Studio 等
              </p>
            </div>
          )}

          {/* API Key */}
          <div>
            <label className="block text-[#a0a0b0] text-sm mb-2">API Key</label>
            <input
              type="password"
              value={localConfig.key}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, key: e.target.value }))}
              placeholder="sk-...（部分本地服务可留空）"
              className="w-full astral-input px-3 py-2.5"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-[#a0a0b0] text-sm mb-2">模型</label>
            <div className="flex gap-2">
              <select
                value={localConfig.model}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, model: e.target.value }))}
                className="flex-1 astral-input px-3 py-2.5"
              >
                <option value="">请选择或获取列表</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4">gpt-4</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                <option value="claude-opus-4-6">claude-opus-4-6</option>
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button
                onClick={fetchModels}
                disabled={isFetchingModels}
                className="px-3 py-2 bg-[rgba(39,174,96,0.2)] border border-[#27ae60] text-[#7fd686] rounded-lg text-sm hover:bg-[rgba(39,174,96,0.35)] transition-colors disabled:opacity-50"
              >
                {isFetchingModels ? '...' : '📋 获取'}
              </button>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-[#a0a0b0] text-sm mb-2">温度 (0–2): {localConfig.temperature}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localConfig.temperature}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-[#a0a0b0] text-sm mb-2">最大令牌数</label>
            <input
              type="number"
              value={localConfig.maxTokens}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 2000 }))}
              min="500"
              max="8000"
              className="w-full astral-input px-3 py-2.5"
            />
          </div>

          {/* Output Char Limit */}
          <div>
            <label className="block text-[#a0a0b0] text-sm mb-2">输出字数上限</label>
            <input
              type="number"
              value={localConfig.outputCharLimit}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, outputCharLimit: parseInt(e.target.value) || 500 }))}
              min="100"
              max="5000"
              step="50"
              className="w-full astral-input px-3 py-2.5"
            />
            <p className="text-xs text-[#a0a0b0] mt-1">
              控制 AI 每次回复的正文长度（约多少字），默认 500
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 btn-primary py-3 rounded-lg font-semibold"
          >
            保存并关闭
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-[#e8e8e8] rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            取消
          </button>
        </div>

        {/* Hint */}
        <p className="mt-4 text-xs text-[#a0a0b0] bg-[rgba(0,0,0,0.3)] p-3 rounded-lg">
          本页使用 <strong>对话补全</strong> 接口。配置将用于「生成开场白」与游戏内 AI 对话。
          支持 OpenAI、Claude 及兼容 OpenAI 协议的中转/自建服务，配置保存在本地。
        </p>

        {/* Endpoint reference */}
        <details className="mt-4 bg-[rgba(0,0,0,0.35)] rounded-lg border border-[rgba(255,255,255,0.08)] text-xs">
          <summary className="cursor-pointer text-[#d4af37] p-3">📌 OpenAI 协议常用路径参考</summary>
          <div className="p-3 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-1 px-2 text-[#d4af37]">功能</th>
                  <th className="text-left py-1 px-2 text-[#d4af37]">路径</th>
                  <th className="text-left py-1 px-2 text-[#d4af37]">方法</th>
                </tr>
              </thead>
              <tbody className="text-[#a0a0b0]">
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <td className="py-1 px-2">对话补全</td>
                  <td className="py-1 px-2">/v1/chat/completions</td>
                  <td className="py-1 px-2">POST</td>
                </tr>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <td className="py-1 px-2">模型列表</td>
                  <td className="py-1 px-2">/v1/models</td>
                  <td className="py-1 px-2">GET</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
