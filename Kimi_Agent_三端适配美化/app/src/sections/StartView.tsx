import { useState, useEffect } from 'react';
import type { UserInfo, Conversation } from '@/types';

interface StartViewProps {
  onNewAdventure: () => void;
  onContinueAdventure: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  user: UserInfo | null;
}

export function StartView({ onNewAdventure, onContinueAdventure, onOpenSettings, onOpenAuth, user }: StartViewProps) {
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Load recent conversations from localStorage
    const loadConversations = () => {
      try {
        const raw = localStorage.getItem('astral_chat_conversations_fallback');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            setRecentConversations(list.slice(0, 3));
          }
        }
      } catch (e) {
        console.warn('Failed to load conversations', e);
      }
    };
    loadConversations();
  }, []);

  const handleLoadConversation = (id: string) => {
    sessionStorage.setItem('astral_load_conversation', id);
    onContinueAdventure();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background texture */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[rgba(212,175,55,0.2)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4af37] rounded-full flex items-center justify-center text-[#d4af37] font-bold">
            ⚔
          </div>
          <span className="text-xl text-[#d4af37] font-semibold">Azure Legend</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 text-sm border border-[#d4af37] text-[#d4af37] rounded-md hover:bg-[rgba(212,175,55,0.1)] transition-colors"
          >
            ⚙ 配置
          </button>
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 text-sm border border-[#d4af37] text-[#d4af37] rounded-md hover:bg-[rgba(212,175,55,0.1)] transition-colors"
          >
            {user ? user.nickname || '账号' : '登录 / 账号'}
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[960px] space-y-4">
          {/* Hero card */}
          <div className="astral-card p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 border-2 border-[#d4af37] rounded-full flex items-center justify-center text-[#d4af37] text-lg">
                ✨
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">开始你的艾瑟拉冒险</h2>
                <p className="text-[#a0a0b0] text-sm">
                  先配置 API，再创建角色，最后与守秘人一起踏入源界。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onNewAdventure}
                className="btn-primary px-6 py-3 rounded-lg font-semibold flex items-center gap-2 min-w-[160px] justify-center"
              >
                🎮 开始新冒险
              </button>
              <button
                onClick={onContinueAdventure}
                className="btn-secondary px-6 py-3 rounded-lg font-semibold flex items-center gap-2 min-w-[160px] justify-center"
              >
                ▶ 继续冒险
              </button>
            </div>
          </div>
          
          {/* Grid cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick access */}
            <div className="astral-card p-4">
              <h3 className="text-[#d4af37] font-semibold mb-3 text-sm">快捷入口</h3>
              <div className="space-y-2">
                <button
                  onClick={onOpenSettings}
                  className="w-full btn-secondary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
                >
                  ⚙ 配置 API 与模型
                </button>
                <button
                  onClick={onOpenAuth}
                  className="w-full btn-secondary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
                >
                  👤 登录 / 管理账号
                </button>
                <button
                  onClick={onContinueAdventure}
                  className="w-full btn-secondary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
                >
                  📜 打开聊天记录
                </button>
              </div>
            </div>
            
            {/* Recent adventures */}
            <div className="astral-card p-4">
              <h3 className="text-[#d4af37] font-semibold mb-3 text-sm">最近冒险（预览）</h3>
              <div className="max-h-[180px] overflow-y-auto space-y-2">
                {recentConversations.length > 0 ? (
                  recentConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleLoadConversation(conv.id)}
                      className="p-2 rounded-lg bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(212,175,55,0.1)] cursor-pointer transition-colors"
                    >
                      <div className="text-sm text-[#e8e8e8] truncate">
                        {conv.title}（{conv.source === 'cloud' ? '云端' : '本地'}）
                      </div>
                      <div className="text-xs text-[#a0a0b0]">
                        {new Date(conv.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#a0a0b0]">
                    暂无历史记录。开始一段新冒险后，这里会显示最近的世界线。
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center text-xs text-[#a0a0b0] pt-4">
            <span>ASTRAL CHRONICLES · Azure Legend</span>
            <span className="mx-2">·</span>
            <a 
              href="https://github.com/IMCEZ/page" 
              target="_blank" 
              rel="noopener"
              className="text-[#d4af37] hover:underline"
            >
              GitHub / IMCEZ/page
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
