import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthOverlay } from './sections/AuthOverlay';
import { StartView } from './sections/StartView';
import { CreationView } from './sections/CreationView';
import { GameView } from './sections/GameView';
import { ApiSettingsModal } from './sections/ApiSettingsModal';
import { PresetManagerModal } from './sections/PresetManagerModal';
import { ParticlesBackground } from './sections/ParticlesBackground';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { UserInfo, CharacterData, ApiConfig } from './types';

// Storage keys
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

function App() {
  // View state
  const [currentView, setCurrentView] = useState<'auth' | 'start' | 'creation' | 'game'>('start');
  const [showApiModal, setShowApiModal] = useState(false);
  const [, setApiModalTarget] = useState<'creation' | 'game'>('creation');
  const [showPresetModal, setShowPresetModal] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Character data
  const [characterData, setCharacterData] = useState<Partial<CharacterData>>({});
  
  // API config
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    source: 'openai_official',
    url: '',
    key: '',
    model: 'gpt-4o',
    temperature: 0.8,
    maxTokens: 2000,
    outputCharLimit: 500,
  });

  // Load API config from localStorage
  useEffect(() => {
    const loadConfig = () => {
      const config: ApiConfig = {
        source: (localStorage.getItem(STORAGE_KEYS.apiSource) as any) || 'openai_official',
        url: localStorage.getItem(STORAGE_KEYS.apiUrl) || '',
        key: localStorage.getItem(STORAGE_KEYS.apiKey) || '',
        model: localStorage.getItem(STORAGE_KEYS.model) || 'gpt-4o',
        temperature: parseFloat(localStorage.getItem(STORAGE_KEYS.temperature) || '0.8'),
        maxTokens: parseInt(localStorage.getItem(STORAGE_KEYS.maxTokens) || '2000'),
        outputCharLimit: parseInt(localStorage.getItem(STORAGE_KEYS.outputCharLimit) || '500'),
      };
      setApiConfig(config);
    };
    loadConfig();
  }, []);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Event:', event, session ? '✅ Session' : '❌ No session');
      
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const userInfo: UserInfo = {
          id: session.user.id,
          email: session.user.email || '',
          nickname: meta.full_name || meta.name || meta.preferred_username || '',
          username: meta.preferred_username || meta.name || '',
          discord_avatar: meta.avatar_url || '',
          auth_provider: (session.user.app_metadata?.provider) || 'unknown',
        };
        setUser(userInfo);
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        if (currentView === 'auth') {
          setCurrentView('start');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 默认回到开始界面，保持本地冒险可用
        setCurrentView('start');
      }
      setIsAuthReady(true);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const userInfo: UserInfo = {
          id: session.user.id,
          email: session.user.email || '',
          nickname: meta.full_name || meta.name || meta.preferred_username || '',
          username: meta.preferred_username || meta.name || '',
          discord_avatar: meta.avatar_url || '',
          auth_provider: (session.user.app_metadata?.provider) || 'unknown',
        };
        setUser(userInfo);
        setCurrentView('start');
      }
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save API config
  const saveApiConfig = (config: ApiConfig) => {
    localStorage.setItem(STORAGE_KEYS.apiSource, config.source);
    localStorage.setItem(STORAGE_KEYS.apiUrl, config.url);
    localStorage.setItem(STORAGE_KEYS.apiKey, config.key);
    localStorage.setItem(STORAGE_KEYS.model, config.model);
    localStorage.setItem(STORAGE_KEYS.temperature, config.temperature.toString());
    localStorage.setItem(STORAGE_KEYS.maxTokens, config.maxTokens.toString());
    localStorage.setItem(STORAGE_KEYS.outputCharLimit, config.outputCharLimit.toString());
    setApiConfig(config);
    toast.success('API 配置已保存');
  };

  // Open API settings
  const openApiSettings = (target: 'creation' | 'game' = 'creation') => {
    setApiModalTarget(target);
    setShowApiModal(true);
  };

  // Open preset manager
  const openPresetManager = () => {
    setShowPresetModal(true);
  };

  // Navigation handlers
  const goToStart = () => setCurrentView('start');
  const goToCreation = () => setCurrentView('creation');
  const goToGame = () => setCurrentView('game');

  // Handle character creation complete
  const handleCharacterComplete = (data: CharacterData) => {
    setCharacterData(data);
    const character = {
      name: data.charName,
      race: data.race,
      class: data.classSelect,
      element: data.element,
      avatar: getRaceAvatar(data.race),
    };
    sessionStorage.setItem(STORAGE_KEYS.createdCharacter, JSON.stringify(character));
     // 同步一份长期角色档案到 localStorage，便于“继续冒险”恢复
    localStorage.setItem(STORAGE_KEYS.lastCharacter, JSON.stringify(character));
    setCurrentView('game');
  };

  const getRaceAvatar = (race: string) => {
    const avatarMap: Record<string, string> = {
      '人类': '🧑', '精灵': '🧝', '矮人': '🧔',
      '兽人': '🐺', '亡灵': '💀', '龙裔': '🐉'
    };
    return avatarMap[race] || '🧑';
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#d4af37] text-xl animate-pulse">⚔️ 正在初始化...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8e8] overflow-x-hidden">
      {/* Background particles */}
      <ParticlesBackground />
      
      {/* Decorative ornaments */}
      <div className="fixed w-[150px] h-[150px] border-2 border-[rgba(212,175,55,0.1)] rounded-full pointer-events-none z-[-1] top-[10%] left-[-50px] animate-float hidden md:block" />
      <div className="fixed w-[150px] h-[150px] border-2 border-[rgba(212,175,55,0.1)] rounded-full pointer-events-none z-[-1] bottom-[20%] right-[-50px] animate-float hidden md:block" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
      
      {/* Main content */}
      {currentView === 'auth' && (
        <AuthOverlay 
          onLogin={() => setCurrentView('start')} 
        />
      )}
      
      {currentView === 'start' && (
        <StartView 
          onNewAdventure={goToCreation}
          onContinueAdventure={goToGame}
          onOpenSettings={() => openApiSettings('creation')}
          onOpenAuth={() => setCurrentView('auth')}
          user={user}
        />
      )}
      
      {currentView === 'creation' && (
        <CreationView
          onComplete={handleCharacterComplete}
          onOpenSettings={() => openApiSettings('creation')}
          onBack={goToStart}
          initialData={characterData}
        />
      )}
      
      {currentView === 'game' && (
        <GameView
          onBackToCreation={() => setCurrentView('creation')}
          onOpenSettings={() => openApiSettings('game')}
          onOpenPresetManager={openPresetManager}
          apiConfig={apiConfig}
        />
      )}
      
      {/* API Settings Modal */}
      {showApiModal && (
        <ApiSettingsModal
          config={apiConfig}
          onSave={saveApiConfig}
          onClose={() => setShowApiModal(false)}
        />
      )}

      {/* Preset Manager Modal */}
      {showPresetModal && (
        <PresetManagerModal
          onClose={() => setShowPresetModal(false)}
        />
      )}
      
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 35, 0.95)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#e8e8e8',
          },
        }}
      />
    </div>
  );
}

export default App;
