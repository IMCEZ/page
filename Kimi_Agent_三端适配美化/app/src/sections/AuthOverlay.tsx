import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthOverlayProps {
  onLogin: () => void;
}

export function AuthOverlay({ onLogin }: AuthOverlayProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('邮箱和密码不能为空');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) {
        setError(`登录失败：${authError.message}`);
        return;
      }
      
      if (data.session) {
        toast.success('登录成功');
        onLogin();
      } else {
        setError('登录失败：未获取到会话，请稍后重试');
      }
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : '未知错误';
      setError(`登录异常：${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setError('邮箱和密码不能为空');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nickname,
          },
        },
      });
      
      if (authError) {
        setError(`注册失败：${authError.message}`);
        return;
      }
      
      setError('注册成功：请查收验证邮件或直接尝试登录');
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : '未知错误';
      setError(`注册异常：${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setIsDiscordLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        setError('Discord 登录失败: ' + error.message);
        setIsDiscordLoading(false);
      }
    } catch (e) {
      setError('Discord 登录失败');
      setIsDiscordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(10,10,15,0.95),rgba(0,0,0,0.9))] flex items-center justify-center z-[999] p-4">
      <div className="w-full max-w-[420px] bg-[rgba(15,15,25,0.96)] rounded-[18px] border border-[rgba(212,175,55,0.35)] shadow-[0_24px_60px_rgba(0,0,0,0.8)] p-6 relative overflow-hidden">
        {/* Gradient border effect */}
        <div className="absolute inset-[-1px] rounded-[18px] p-[1px] bg-gradient-to-br from-[rgba(212,175,55,0.3)] via-transparent to-[rgba(74,144,226,0.4)] opacity-80 pointer-events-none" 
             style={{ 
               mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
               WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
               WebkitMaskComposite: 'xor',
               maskComposite: 'exclude'
             }} />
        
        <h2 className="text-[1.3rem] font-bold text-center tracking-wider mb-1">灵魂链接 · 登录中心</h2>
        <p className="text-sm text-[#a0a0b0] text-center mb-6">
          先完成注册 / 登录，再踏入 ASTRAL CHRONICLES 的世界
        </p>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#a0a0b0] mb-1 block">昵称（用于游戏内显示，可选）</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="给自己取一个传奇名号"
              className="w-full rounded-[10px] border border-[rgba(255,255,255,0.15)] px-3 py-2 text-sm bg-[rgba(0,0,0,0.3)] text-[#e8e8e8] focus:border-[#4a90e2] focus:shadow-[0_0_0_1px_rgba(74,144,226,0.6)] focus:bg-[rgba(0,0,0,0.6)] focus:-translate-y-px transition-all outline-none"
            />
          </div>
          
          <div>
            <label className="text-xs text-[#a0a0b0] mb-1 block">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-[10px] border border-[rgba(255,255,255,0.15)] px-3 py-2 text-sm bg-[rgba(0,0,0,0.3)] text-[#e8e8e8] focus:border-[#4a90e2] focus:shadow-[0_0_0_1px_rgba(74,144,226,0.6)] focus:bg-[rgba(0,0,0,0.6)] focus:-translate-y-px transition-all outline-none"
            />
          </div>
          
          <div>
            <label className="text-xs text-[#a0a0b0] mb-1 block">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full rounded-[10px] border border-[rgba(255,255,255,0.15)] px-3 py-2 text-sm bg-[rgba(0,0,0,0.3)] text-[#e8e8e8] focus:border-[#4a90e2] focus:shadow-[0_0_0_1px_rgba(74,144,226,0.6)] focus:bg-[rgba(0,0,0,0.6)] focus:-translate-y-px transition-all outline-none"
            />
          </div>
        </div>
        
        {error && (
          <div className="min-h-[18px] mt-3 text-sm text-[#e74c3c]">{error}</div>
        )}
        
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="flex-1 rounded-full py-2.5 px-4 text-sm font-semibold bg-gradient-to-r from-[#4a90e2] to-[#9b59b6] text-white shadow-[0_10px_24px_rgba(74,144,226,0.6)] hover:-translate-y-px hover:shadow-[0_16px_32px_rgba(74,144,226,0.7)] transition-all disabled:opacity-60"
          >
            {isLoading ? '登录中...' : '登录并继续冒险'}
          </button>
          <button
            onClick={handleRegister}
            disabled={isLoading}
            className="flex-1 rounded-full py-2.5 px-4 text-sm font-semibold bg-[rgba(255,255,255,0.06)] text-[#a0a0b0] border border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.15)] hover:text-[#d4af37] transition-all disabled:opacity-60"
          >
            注册新灵魂
          </button>
        </div>
        
        {/* Divider */}
        <div className="flex items-center my-4 gap-3">
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.15)]" />
          <span className="text-xs text-[#a0a0b0]">或</span>
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.15)]" />
        </div>
        
        {/* Discord button */}
        <button
          onClick={handleDiscordLogin}
          disabled={isDiscordLoading}
          className="w-full rounded-full py-2.5 px-4 text-sm font-semibold bg-[#5865F2] text-white shadow-[0_4px_14px_rgba(88,101,242,0.4)] hover:bg-[#4752C4] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(88,101,242,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          {isDiscordLoading ? '正在跳转...' : '使用 Discord 登录'}
        </button>
        
        <p className="mt-4 text-xs text-[#a0a0b0] text-center">
          你的账号信息将保存在云端，<span className="text-[#d4af37]">下次再来可以继续当前灵魂旅程</span>。
        </p>
      </div>
    </div>
  );
}
