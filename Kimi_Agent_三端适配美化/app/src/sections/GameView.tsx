import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { ChatMessage, Conversation, ApiConfig } from '@/types';

interface GameViewProps {
  onBackToCreation: () => void;
  onOpenSettings: () => void;
  apiConfig: ApiConfig;
}

const STORAGE_KEYS = {
  apiSource: 'astral_api_source',
  apiUrl: 'astral_api_url',
  apiKey: 'astral_api_key',
  model: 'astral_model',
  temperature: 'astral_temperature',
  maxTokens: 'astral_max_tokens',
  outputCharLimit: 'astral_output_char_limit',
  createdCharacter: 'astral_created_character',
  lastCharacter: 'astral_last_character',
};

const WORLD_LORE_SUMMARY = `- 世界名称：源界「艾瑟拉」（Aethera），由本源之力驱动的全沉浸虚拟世界，NPC 视一切为真实。
- 根本规则：玩家进入即归零（财富 / 地位 / 身体 / 知识 / 社会关系全部清空），仅保留性格与意志；复活机制神秘，是世界核心谜团之一。
- 地理与势力：盘根大陆为主舞台（人类、矮人、兽人核心），翡翠洲为精灵领地，灰烬大陆为亡灵与深渊裂隙所在，天穹列岛为浮空群岛；世界脊山脉、永夜森林、深渊裂隙、碎梦海、本源之泉等为关键地点。
- 种族：人类、精灵、矮人、兽人、地精、亡灵、龙族、元素生命、深渊生物与上古遗族，各有政治结构与偏好；龙稀少而强大，深渊生物受蜂巢意志驱动，亡灵情感会随岁月淡化。
- 副本体系：存在「七大本源秘境」与若干「七大迷宫」，其中已知包括赤龙渊·陨刃秘境（土火龙本源、纵向 12 层、亚库瑞忒投影终局）、裂土穹庐·引力秘境（土系引力军团战、一口气 16 波，与征服王·亚历山大决战）、翼王之城（18 层金字塔，通往翼王本体与唯一道具「虚数之钥」）。每个本源秘境首通会产出唯一至宝。
- 野外随机副本：完全随机生成，仅包含战斗与矿石采集，无剧情；一次性挑战，无轮回；结构固定为前置探索区—中层攻坚区—终局 BOSS 区，只有一只最终 BOSS。掉落与矿石品质最高为史诗级，只用于环境抗性与推进道具。
- 野外精英与挑战 BOSS：红名精英为区域霸主，随机生成，进入仇恨范围会强制弹出数值面板；野外挑战 BOSS 固定在高危区域并有全服 / 区域预警，具多阶段机制与大范围 AOE，最高掉落品质为史诗（绝不掉传奇 / 神话），刷新周期极长。
- 死亡与惩罚：在野外副本、本源秘境或精英 / BOSS 战中死亡通常会被移出当前场景并掉落一定比例非绑定资源，下次进入对应领域时会受到数值削弱或环境压力强化。
- 代表性人物：开发者阵营有如「晨艺德」（底层架构师、粒子霜与虫洞能力）与「萨麦尔」（饥饿之蛇，无法战胜带有"英雄 / 勇者"概念的目标）；玩家阵营则有陶雪洪、晏无昧、铁山、苏酒久、漠玉、落幕、大黄蜂等，各自有鲜明的战斗风格与致命弱点，可作为传说级 NPC 或传奇事迹背景，被世界广泛流传而非轻易出场。
- 叙事基调：这是一个规则严谨、数值与生态自洽的世界；请尊重上述设定，用它们驱动场景、任务、冲突与奖励设计，不要随意创造与其相矛盾的超模物品、简单的爽文外挂或无代价的力量。`;

function getGMSystemPrompt(character: any, forOpening = false) {
  if (forOpening) {
    return `你是一位 **JRPG 风格的全知叙事者**，正在为「源界：艾瑟拉」生成一段降临开场白。

请根据下面角色设定，用**第三人称**写 2～4 段「初始场景」开场，富有画面感与沉浸感，符合世界观，自然引出冒险开始。纯叙述，不要列表，不要替玩家做决定；结尾自然停顿，等待玩家输入。

参考《最终幻想》《异度神剑》的叙事语感，文笔细腻。字数约 1000～2000 字；若内容不足，用场景细节、环境描写、角色内心独白补充。

【世界观设定简要】
${WORLD_LORE_SUMMARY}`;
  }
  
  const name = character?.name || '冒险者';
  const race = character?.race || '';
  const cls = character?.class || '';
  const roleDesc = [name, race, cls].filter(Boolean).join('，');
  
  return `你是一个 **JRPG 风格的全知叙事者**，叙事舞台为「源界：艾瑟拉」（Aethera）。

## 定位
- 以**第三人称**描述玩家的行动与周遭发生的一切（场景、环境、NPC 的言行与反应）。
- 你是**旁白**，不是对话者：不替玩家做决定、不代玩家发言或选择，只叙述结果与见闻。
- **等待玩家输入后再推进叙事**：每次回复结尾自然收束，留下可行动空间，不强行推进到下一段剧情。

## 风格
- 文笔细腻，富有画面感与沉浸感。
- 战斗场面紧凑热血，日常场景温润有氛围。
- 参考《最终幻想》《异度神剑》系列的叙事语感；语气神秘而富有冒险感，符合西幻 JRPG。

## 字数与节奏
- 每次回复正文控制在 **1000～2000 字**之间。
- 内容不足时，通过丰富场景细节、环境描写、角色内心独白来补充，避免敷衍收尾。
- 每段结尾自然停顿，等待玩家下一步指令；可含虚拟检定提示（如「侦查检定」「说服检定」）增强沉浸感。

## 当前玩家角色
${roleDesc || '冒险者'}。叙述时始终基于该角色身份与世界观，保持人称与视角统一（第三人称）。

## 输出格式
可使用 Markdown：**粗体** 强调、*斜体* 低语或回忆、\`技能名\` 游戏术语、> 引用 NPC 原话。

## 世界观设定（需严格遵守）
${WORLD_LORE_SUMMARY}`;
}

function formatMessageContent(str: string) {
  if (!str) return '';
  
  let s = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[#d4af37]">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-[rgba(0,0,0,0.4)] px-1.5 py-0.5 rounded text-sm border border-[rgba(212,175,55,0.3)]">$1</code>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-[#d4af37] pl-3 my-2 text-[#a0a0b0] italic">$1</blockquote>')
    .replace(/---+/g, '<hr class="border-[rgba(212,175,55,0.3)] my-3"/>')
    .replace(/\n/g, '<br/>');
    
  return s;
}

export function GameView({ onBackToCreation, onOpenSettings, apiConfig }: GameViewProps) {
  const [character, setCharacter] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'preset' | 'log'>('api');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState({ location: '艾瑟拉·郊野', time: '黄昏', gold: 0 });
  const [isLogMode, setIsLogMode] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Load character
  useEffect(() => {
    const logFlag = sessionStorage.getItem('astral_open_log_on_enter') === '1';

    // 优先使用本次会话中的角色，其次尝试从本地最近角色档案恢复
    const sessionRaw = sessionStorage.getItem(STORAGE_KEYS.createdCharacter);
    const localRaw = sessionRaw ? null : localStorage.getItem(STORAGE_KEYS.lastCharacter);
    const raw = sessionRaw || localRaw;

    if (raw) {
      try {
        const char = JSON.parse(raw);
        setCharacter(char);
        // Initialize chat with system message
        const systemMsg: ChatMessage = {
          role: 'system',
          content: getGMSystemPrompt(char),
          timestamp: Date.now(),
        };
        setMessages([systemMsg]);
        // 日志模式下仅加载会话，由用户从日志中选择具体存档；正常模式才自动生成开场
        if (!logFlag) {
          setTimeout(() => generateOpening(char), 500);
        }
      } catch (e) {
        console.error('Failed to load character', e);
        // 存档损坏时清理坏数据
        sessionStorage.removeItem(STORAGE_KEYS.createdCharacter);
        localStorage.removeItem(STORAGE_KEYS.lastCharacter);
        if (logFlag) {
          toast.error('角色数据损坏，将仅展示历史对话');
        } else {
          toast.error('角色数据损坏，请重新创建角色');
          onBackToCreation();
          return;
        }
      }
      // 不论是否为日志模式，到这里都不再继续后续“无角色”分支
      return;
    }

    // 没有任何角色档案：游戏模式直接回退到创建；日志模式则仅提示，可继续浏览历史会话
    if (logFlag) {
      toast.error('当前无角色，仅可查看历史会话');
    } else {
      toast.error('暂无角色档案，请先创建角色');
      onBackToCreation();
    }
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = () => {
      try {
        const raw = localStorage.getItem('astral_chat_conversations_fallback');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            setConversations(list);
          }
        }
      } catch (e) {
        console.warn('Failed to load conversations', e);
      }
    };
    loadConversations();
  }, []);

  // Check for conversation to load
  useEffect(() => {
    // 根据入口标记，自动打开日志面板，方便选择历史存档
    const shouldOpenLog = sessionStorage.getItem('astral_open_log_on_enter') === '1';
    if (shouldOpenLog) {
      sessionStorage.removeItem('astral_open_log_on_enter');
      setIsLogMode(true);
      setSettingsOpen(true);
      setActiveTab('log');
    }

    const loadId = sessionStorage.getItem('astral_load_conversation');
    if (loadId) {
      sessionStorage.removeItem('astral_load_conversation');
      loadConversation(loadId);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatAreaRef.current?.scrollTo({ top: chatAreaRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const generateOpening = async (char: any) => {
    setIsTyping(true);
    
    const baseUrl = apiConfig.source === 'third_party' 
      ? (apiConfig.url.endsWith('/v1') ? apiConfig.url : apiConfig.url + '/v1')
      : 'https://api.openai.com/v1';
    
    if (!apiConfig.key) {
      setIsTyping(false);
      const msg: ChatMessage = {
        role: 'assistant',
        content: '⚠️ 尚未配置 API，请点击右上角设置配置后，发送任意消息开始冒险。',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
      return;
    }

    try {
      const charSummary = `角色名：${char.name || '未命名'}
种族：${char.race || ''}；职业：${char.class || ''}`;

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.key}`,
        },
        body: JSON.stringify({
          model: apiConfig.model || 'gpt-4o',
          messages: [
            { role: 'system', content: getGMSystemPrompt(null, true) },
            { role: 'user', content: charSummary },
          ],
          temperature: apiConfig.temperature,
          max_tokens: apiConfig.maxTokens,
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '（未生成到内容）';
      
      const msg: ChatMessage = {
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
      updateGameStatus(text);
    } catch (err: any) {
      const msg: ChatMessage = {
        role: 'assistant',
        content: `开场生成失败：${err.message || String(err)}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const baseUrl = apiConfig.source === 'third_party' 
      ? (apiConfig.url.endsWith('/v1') ? apiConfig.url : apiConfig.url + '/v1')
      : 'https://api.openai.com/v1';

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.key}`,
        },
        body: JSON.stringify({
          model: apiConfig.model || 'gpt-4o',
          messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
          temperature: apiConfig.temperature,
          max_tokens: apiConfig.maxTokens,
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '（无回复）';
      
      const msg: ChatMessage = {
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
      updateGameStatus(text);
      saveConversation();
    } catch (err: any) {
      const msg: ChatMessage = {
        role: 'assistant',
        content: `[错误] ${err.message || String(err)}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
    } finally {
      setIsTyping(false);
    }
  };

  const updateGameStatus = (text: string) => {
    // Parse location
    const locMatch = text.match(/(?:当前位置|地点|位置|来到|抵达|处于)[：:\s]*([^\n。<br>]+)/i) 
      || text.match(/(?:位于|在)\s*([^，。\n<br>]{2,24})/);
    if (locMatch?.[1]) {
      setGameStatus(prev => ({ ...prev, location: locMatch[1].trim() }));
    }
    
    // Parse time
    const timeMatch = text.match(/(?:当前)?(?:时间|时刻|时段)[：:\s]*([^\n。<br>]+)/i)
      || text.match(/(?:已是|到了|正值)\s*([^，。\n<br>]{2,12})/);
    if (timeMatch?.[1]) {
      setGameStatus(prev => ({ ...prev, time: timeMatch[1].trim() }));
    }
    
    // Parse gold
    const goldMatch = text.match(/(?:获得|得到|金币|金钱)[^0-9]*(\d+)\s*(?:金|G|金币)?/i);
    if (goldMatch?.[1]) {
      setGameStatus(prev => ({ ...prev, gold: prev.gold + parseInt(goldMatch[1]) }));
    }
  };

  const saveConversation = () => {
    const userMsgs = messages.filter(m => m.role === 'user' || m.role === 'assistant');
    if (userMsgs.length === 0) return;

    const id = currentConversationId || `chat_${Date.now()}`;
    const conv: Conversation = {
      id,
      title: `${character?.name || '冒险者'}的冒险 · ${new Date().toLocaleDateString()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'local',
      messages: userMsgs,
    };

    const updated = conversations.filter(c => c.id !== id).concat(conv);
    setConversations(updated);
    setCurrentConversationId(id);
    localStorage.setItem('astral_chat_conversations_fallback', JSON.stringify(updated));
  };

  const loadConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;

    const systemMsg = messages.find(m => m.role === 'system');
    const newMessages = [systemMsg, ...conv.messages].filter(Boolean) as ChatMessage[];
    setMessages(newMessages);
    setCurrentConversationId(id);
    toast.success(`已加载：${conv.title}`);
  };

  const deleteConversation = (id: string) => {
    if (!confirm('确定要删除该会话吗？')) return;
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem('astral_chat_conversations_fallback', JSON.stringify(updated));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
    toast.success('会话已删除');
  };

  const exportConversation = () => {
    if (!currentConversationId) {
      toast.error('当前没有可导出的会话');
      return;
    }
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv) return;

    const lines = conv.messages.map(m => JSON.stringify({ 
      name: m.role === 'user' ? 'User' : 'Character', 
      mes: m.content 
    }));
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astral_chat_${new Date().toISOString().split('T')[0]}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('已导出');
  };

  const importConversation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const msgs: ChatMessage[] = [];
        
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.mes) {
              msgs.push({
                role: obj.name?.toLowerCase() === 'user' ? 'user' : 'assistant',
                content: obj.mes,
                timestamp: Date.now(),
              });
            }
          } catch {}
        }

        if (msgs.length > 0) {
          const id = `chat_${Date.now()}`;
          const conv: Conversation = {
            id,
            title: `导入会话 · ${new Date().toLocaleString()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: 'local',
            messages: msgs,
          };
          const updated = conversations.concat(conv);
          setConversations(updated);
          localStorage.setItem('astral_chat_conversations_fallback', JSON.stringify(updated));
          toast.success(`已导入 ${msgs.length} 条消息`);
        }
      } catch (err) {
        toast.error('导入失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const createNewConversation = () => {
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg) {
      setMessages([systemMsg]);
      setCurrentConversationId(null);
      toast.success('已创建新会话');
    }
  };

  const regenerateMessage = (index: number) => {
    // Remove messages after index
    setMessages(prev => prev.slice(0, index));
    // Trigger new AI response
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const deleteMessage = (index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  };

  // 统一的设置抽屉渲染（日志 / 配置 / 预设）
  const settingsDrawer = settingsOpen && (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[399]"
        onClick={() => setSettingsOpen(false)}
      />
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-[#151520] border-l border-[#2a2a3e] z-[400] flex flex-col shadow-[-6px_0_24px_rgba(0,0,0,0.5)]">
        {/* Tabs */}
        <div className="flex border-b border-[#2a2a3e]">
          {[
            { id: 'api', label: '⚙ 配置' },
            { id: 'preset', label: '📋 预设' },
            { id: 'log', label: '📜 日志' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'text-[#d4af37] border-[#d4af37]' 
                  : 'text-[#a0a0b0] border-transparent hover:text-[#e8e8e8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* API settings */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <p className="text-sm text-[#a0a0b0]">
                在这里配置你的大模型 API，支持官方 OpenAI 或第三方兼容接口。
              </p>
              {/* 这里保持原有 API 配置表单内容，省略具体字段实现 */}
            </div>
          )}

          {/* Preset settings */}
          {activeTab === 'preset' && (
            <div className="space-y-4">
              <p className="text-sm text-[#a0a0b0]">
                预设将影响守秘人的叙事风格与世界细节展开方式。
              </p>
              {/* 这里保持原有预设配置内容，省略具体字段实现 */}
            </div>
          )}

          {/* Log tab keeps原有实现（会话列表 / 新建 / 导入 / 导出 / 删除） */}
          {activeTab === 'log' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={createNewConversation}
                  className="px-3 py-1.5 text-sm bg-[rgba(212,175,55,0.25)] border border-[#d4af37] text-[#d4af37] rounded-md hover:bg-[rgba(212,175,55,0.4)] transition-colors"
                >
                  🆕 新建会话
                </button>
                <button
                  onClick={exportConversation}
                  className="px-3 py-1.5 text-sm bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-[#e8e8e8] rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  📤 导出
                </button>
                <label className="px-3 py-1.5 text-sm bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-[#e8e8e8] rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer">
                  📥 导入
                  <input
                    type="file"
                    accept=".jsonl"
                    onChange={importConversation}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Conversation list */}
              <div className="border border-[rgba(255,255,255,0.08)] rounded-lg p-2 max-h-[300px] overflow-y-auto">
                {conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between p-2 hover:bg-[rgba(255,255,255,0.05)] rounded cursor-pointer group"
                    >
                      <div
                        onClick={() => loadConversation(conv.id)}
                        className="flex-1 min-w-0"
                      >
                        <div className={`text-sm truncate ${currentConversationId === conv.id ? 'text-[#d4af37]' : 'text-[#e8e8e8]'}`}>
                          {conv.title}
                        </div>
                        <div className="text-xs text-[#a0a0b0]">
                          {new Date(conv.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="ml-2 px-2 py-1 text-xs text-[#e74c3c] border border-[rgba(231,76,60,0.4)] rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[rgba(231,76,60,0.15)]"
                      >
                        🗑
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#a0a0b0]">
                    暂无会话记录。开始一次新冒险或从文件导入一段旅程。
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );

  if (!character) {
    if (!isLogMode) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[#d4af37] text-xl animate-pulse">⚔️ 加载中...</div>
        </div>
      );
    }

    // 日志模式下，无角色也可以进入日志管理界面
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col">
        {/* Background texture */}
        <div 
          className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b-2 border-[#d4af37] bg-gradient-to-r from-[#151520] to-[#16213e] flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#d4af37] rounded-full flex items-center justify-center text-[#d4af37] font-bold">
              ⚔
            </div>
            <span className="text-lg md:text-xl text-[#d4af37] font-semibold">Azure Legend · 聊天记录</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-3 py-1.5 text-sm border border-[#d4af37] text-[#d4af37] rounded-md hover:bg-[rgba(212,175,55,0.1)] transition-colors"
            >
              ⚙ 设置 / 日志
            </button>
            <button
              onClick={onBackToCreation}
              className="px-3 py-1.5 text-sm border border-[#d4af37] text-[#d4af37] rounded-md hover:bg-[rgba(212,175,55,0.1)] transition-colors"
            >
              返回
            </button>
          </div>
        </header>

        {/* Main content - log only */}
        <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[640px] astral-card p-6 space-y-4 text-center">
            <h2 className="text-xl font-semibold text-[#d4af37] mb-2">聊天记录存档中心</h2>
            <p className="text-sm text-[#a0a0b0]">
              当前没有可用的角色信息，你仍然可以在右侧「日志」中查看、导出或删除历史会话记录。
            </p>
            {conversations.length === 0 && (
              <p className="text-sm text-[#a0a0b0]">
                暂无本地会话存档。开始一段新冒险后，这里会出现你的世界线。
              </p>
            )}
          </div>
        </main>

        {/* Settings drawer（包含日志 Tab） */}
        {settingsDrawer}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col">
      {/* Background texture */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b-2 border-[#d4af37] bg-gradient-to-r from-[#151520] to-[#16213e] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4af37] rounded-full flex items-center justify-center text-[#d4af37] font-bold">
            ⚔
          </div>
          <span className="text-lg md:text-xl text-[#d4af37] font-semibold">Azure Legend</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
          <div className="px-2 md:px-3 py-1 rounded-md bg-[rgba(0,0,0,0.35)] border border-[#2a2a3e] text-[#a0a0b0] truncate max-w-[120px] md:max-w-[180px]">
            📍 <span className="text-[#00d4ff]">{gameStatus.location}</span>
          </div>
          <div className="hidden sm:block px-3 py-1 rounded-md bg-[rgba(0,0,0,0.35)] border border-[#2a2a3e] text-[#a0a0b0]">
            🕐 <span className="text-[#00d4ff]">{gameStatus.time}</span>
          </div>
          <div className="hidden sm:block px-3 py-1 rounded-md bg-[rgba(0,0,0,0.35)] border border-[#2a2a3e] text-[#a0a0b0]">
            💰 <span className="text-[#00d4ff]">{gameStatus.gold}</span> G
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 text-sm border border-[#d4af37] text-[#d4af37] rounded-md hover:bg-[rgba(212,175,55,0.1)] transition-colors"
          >
            ⚙ 设置
          </button>
          <span className="hidden md:inline text-xs text-[#a0a0b0]">
            系统: <span className="text-green-400">在线</span>
          </span>
          <button
            onClick={onBackToCreation}
            className="px-3 py-1.5 text-sm border border-[#d4af37] text-[#d4af37] rounded-md hover:bg-[rgba(212,175,55,0.1)] transition-colors"
          >
            返回
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 relative z-10 flex overflow-hidden">
        {/* Character panel - desktop */}
        <aside className="hidden md:block w-[240px] lg:w-[280px] bg-[#151520] border-r border-[#2a2a3e] p-5 overflow-y-auto">
          <div className="flex justify-between items-center text-[#d4af37] text-sm font-semibold pb-3 mb-4 border-b border-[#2a2a3e]">
            <span>英雄档案</span>
            <span>Lv.1</span>
          </div>
          
          <div className="w-full aspect-square max-w-[180px] mx-auto bg-gradient-to-br from-[#2a2a3e] to-[#1a1a2e] border-2 border-[#d4af37] rounded-lg mb-4 flex items-center justify-center text-6xl lg:text-7xl">
            {character.avatar}
          </div>
          
          <div className="text-center text-[#d4af37] text-lg font-semibold mb-4">
            {character.name}
          </div>
          
          {/* HP Bar */}
          <div className="hp-bar h-5 mb-2 relative">
            <div className="hp-fill h-full" style={{ width: '100%' }} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-shadow">
              HP: 100/100
            </span>
          </div>
          
          {/* MP Bar */}
          <div className="mp-bar h-5 mb-4 relative">
            <div className="mp-fill h-full" style={{ width: '100%' }} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-shadow">
              MP: 80/80
            </span>
          </div>
          
          <div className="text-[#d4af37] text-sm font-semibold pb-2 mb-3 border-b border-[#2a2a3e]">
            属性
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-[rgba(0,0,0,0.2)] rounded border-l-2 border-[#00d4ff]">
              <span className="text-[#a0a0b0] text-sm">职业</span>
              <span className="text-[#00d4ff] font-semibold text-sm">{character.class}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[rgba(0,0,0,0.2)] rounded border-l-2 border-[#00d4ff]">
              <span className="text-[#a0a0b0] text-sm">种族</span>
              <span className="text-[#00d4ff] font-semibold text-sm">{character.race}</span>
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0f]">
          {/* Messages */}
          <div 
            ref={chatAreaRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {/* System message */}
            <div className="text-center py-4">
              <span className="text-[#d4af37] italic border-y border-[rgba(212,175,55,0.3)] py-2 px-4 inline-block">
                🎲 灵魂已与艾瑟拉大陆链接。
              </span>
            </div>

            {/* Chat messages */}
            {messages.filter(m => m.role === 'user' || m.role === 'assistant').map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Actions */}
                <div className="flex gap-2 mb-1 opacity-70 hover:opacity-100 transition-opacity">
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => regenerateMessage(index)}
                      className="text-xs px-2 py-1 rounded bg-[rgba(255,255,255,0.08)] text-[#a0a0b0] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.2)] transition-colors"
                    >
                      ↻ 重新生成
                    </button>
                  )}
                  <button 
                    onClick={() => deleteMessage(index)}
                    className="text-xs px-2 py-1 rounded bg-[rgba(255,255,255,0.08)] text-[#a0a0b0] hover:text-[#e74c3c] hover:bg-[rgba(231,76,60,0.15)] transition-colors"
                  >
                    删除
                  </button>
                </div>
                
                {/* Message bubble */}
                <div className={`max-w-[85%] p-4 ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
                  <div className={`text-sm font-semibold mb-2 ${msg.role === 'user' ? 'text-[#00d4ff]' : 'text-[#d4af37]'}`}>
                    {msg.role === 'user' ? `👤 ${character.name}` : '🔮 守秘人 (AI)'}
                  </div>
                  <div 
                    className="text-[15px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
                  />
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start">
                <div className="message-ai p-4">
                  <div className="typing-indicator">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 bg-[#151520] border-t-2 border-[#2a2a3e]">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="输入你的行动..."
                rows={1}
                className="flex-1 astral-input px-4 py-3 resize-none min-h-[44px] max-h-[120px]"
                disabled={isTyping}
              />
              <button
                onClick={sendMessage}
                disabled={isTyping || !inputText.trim()}
                className="btn-primary px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Settings drawer */}
      {settingsOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[399]"
            onClick={() => setSettingsOpen(false)}
          />
          <aside className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-[#151520] border-l border-[#2a2a3e] z-[400] flex flex-col shadow-[-6px_0_24px_rgba(0,0,0,0.5)]">
            {/* Tabs */}
            <div className="flex border-b border-[#2a2a3e]">
              {[
                { id: 'api', label: '⚙ 配置' },
                { id: 'preset', label: '📋 预设' },
                { id: 'log', label: '📜 日志' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'text-[#d4af37] border-[#d4af37]' 
                      : 'text-[#a0a0b0] border-transparent hover:text-[#e8e8e8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'api' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#d4af37] text-sm mb-2">API 来源</label>
                    <select
                      value={apiConfig.source}
                      onChange={() => onOpenSettings()}
                      className="w-full astral-input px-3 py-2"
                    >
                      <option value="openai_official">OpenAI 官方</option>
                      <option value="third_party">第三方（OpenAI 协议）</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[#d4af37] text-sm mb-2">API Key</label>
                    <input
                      type="password"
                      value={apiConfig.key}
                      readOnly
                      placeholder="sk-..."
                      className="w-full astral-input px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#d4af37] text-sm mb-2">模型</label>
                    <input
                      type="text"
                      value={apiConfig.model}
                      readOnly
                      className="w-full astral-input px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#d4af37] text-sm mb-2">温度: {apiConfig.temperature}</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={apiConfig.temperature}
                      readOnly
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#d4af37] text-sm mb-2">最大令牌数</label>
                    <input
                      type="number"
                      value={apiConfig.maxTokens}
                      readOnly
                      className="w-full astral-input px-3 py-2"
                    />
                  </div>

                  <button
                    onClick={onOpenSettings}
                    className="w-full btn-primary py-2 rounded-lg font-semibold"
                  >
                    打开完整设置
                  </button>
                </div>
              )}

              {activeTab === 'preset' && (
                <div className="space-y-4">
                  <p className="text-sm text-[#a0a0b0]">
                    预设系统用于管理 AI 的行为模式和叙事风格。
                  </p>
                  <button
                    onClick={onOpenSettings}
                    className="w-full btn-primary py-2 rounded-lg font-semibold"
                  >
                    管理预设
                  </button>
                </div>
              )}

              {activeTab === 'log' && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={createNewConversation}
                      className="px-3 py-1.5 text-sm bg-[rgba(212,175,55,0.25)] border border-[#d4af37] text-[#d4af37] rounded-md hover:bg-[rgba(212,175,55,0.4)] transition-colors"
                    >
                      🆕 新建会话
                    </button>
                    <button
                      onClick={exportConversation}
                      className="px-3 py-1.5 text-sm bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-[#e8e8e8] rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    >
                      📤 导出
                    </button>
                    <label className="px-3 py-1.5 text-sm bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-[#e8e8e8] rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer">
                      📥 导入
                      <input
                        type="file"
                        accept=".jsonl"
                        onChange={importConversation}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Conversation list */}
                  <div className="border border-[rgba(255,255,255,0.08)] rounded-lg p-2 max-h-[300px] overflow-y-auto">
                    {conversations.length > 0 ? (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className="flex items-center justify-between p-2 hover:bg-[rgba(255,255,255,0.05)] rounded cursor-pointer group"
                        >
                          <div 
                            onClick={() => loadConversation(conv.id)}
                            className="flex-1 min-w-0"
                          >
                            <div className={`text-sm truncate ${currentConversationId === conv.id ? 'text-[#d4af37]' : 'text-[#e8e8e8]'}`}>
                              {conv.title}
                            </div>
                            <div className="text-xs text-[#a0a0b0]">
                              {new Date(conv.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="ml-2 px-2 py-1 text-xs text-[#e74c3c] border border-[rgba(231,76,60,0.4)] rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[rgba(231,76,60,0.15)]"
                          >
                            🗑
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#a0a0b0] p-2">暂无会话记录</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
