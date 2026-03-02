import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { CharacterData } from '@/types';

interface CreationViewProps {
  onComplete: (data: CharacterData) => void;
  onOpenSettings: () => void;
  onBack: () => void;
  initialData: Partial<CharacterData>;
}

const totalSteps = 8;

const raceOptions = [
  { value: '人类', icon: '🧑', label: '人类', desc: '盘根大陆·五大政体' },
  { value: '精灵', icon: '🧝', label: '精灵', desc: '翡翠洲·翠叶/星辉/暮影' },
  { value: '矮人', icon: '🧔', label: '矮人', desc: '世界脊·铁砧城/晶脉堡/烟岚关' },
  { value: '兽人', icon: '🐺', label: '兽人', desc: '部落联盟·萨满传统' },
  { value: '亡灵', icon: '💀', label: '亡灵', desc: '灰烬大陆·暮光议政' },
  { value: '龙裔', icon: '🐉', label: '龙裔', desc: '稀薄龙血·本源敏感' },
];

const fearOptions = [
  { value: '孤独', icon: '👤', label: '被世界遗忘' },
  { value: '失控', icon: '🌪️', label: '失去控制' },
  { value: '无意义', icon: '⚫', label: '存在虚无' },
  { value: '背叛', icon: '🗡️', label: '信任崩塌' },
  { value: '平庸', icon: '📉', label: '沦为平庸' },
];

const goalOptions = [
  { value: '探索', icon: '🗺️', label: '探索未知' },
  { value: '变强', icon: '⚔️', label: '追求力量' },
  { value: '剧情', icon: '📖', label: '体验剧情' },
  { value: '社交', icon: '👥', label: '建立羁绊' },
  { value: '创造', icon: '🏰', label: '建造经营' },
  { value: '破坏', icon: '💀', label: '混乱征服' },
];

const elementOptions = [
  { value: '火', icon: '🔥', label: '烈焰' },
  { value: '水', icon: '💧', label: '流水' },
  { value: '风', icon: '💨', label: '疾风' },
  { value: '土', icon: '🪨', label: '大地' },
  { value: '光', icon: '✨', label: '圣光' },
  { value: '暗', icon: '🌑', label: '暗影' },
];

const talentOptions = [
  { value: '剑术天才', icon: '⚔️', label: '剑术天才' },
  { value: '魔法直觉', icon: '🔮', label: '魔法直觉' },
  { value: '鹰眼视觉', icon: '👁️', label: '鹰眼视觉' },
  { value: '钢铁意志', icon: '🧠', label: '钢铁意志' },
  { value: '魅力非凡', icon: '💫', label: '魅力非凡' },
  { value: '幸运儿', icon: '🍀', label: '幸运儿' },
];

export function CreationView({ onComplete, onOpenSettings, onBack: _onBack, initialData }: CreationViewProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<CharacterData>>(initialData);
  const [showResult, setShowResult] = useState(false);
  const [resultText, setResultText] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jrpg_character_creator_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn('Failed to load saved data', e);
      }
    }
  }, []);

  // Auto save
  useEffect(() => {
    localStorage.setItem('jrpg_character_creator_v2', JSON.stringify(data));
  }, [data]);

  // Handle swipe
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentStep <= totalSteps) {
        handleNext();
      } else if (diff < 0 && currentStep > 1) {
        handlePrev();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentStep <= totalSteps) handleNext();
      if (e.key === 'ArrowLeft' && currentStep > 1) handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, data]);

  const updateData = (key: keyof CharacterData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!data.realName || !data.ageGroup) {
          toast.error('请填写必填项（带*号）');
          return false;
        }
        return true;
      case 5:
        if (!data.race || !data.classSelect || !data.charName) {
          toast.error('请选择种族、职业并填写角色名');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep === totalSteps) {
      generateResult();
    } else {
      setCurrentStep(prev => prev + 1);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep + 1) {
      setCurrentStep(step);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const generateResult = () => {
    const fullData = data as CharacterData;
    const story = `【Astral Chronicles 角色设定书】
═══════════════════════════════════
■ 基础档案
角色名：${fullData.charName || '未命名'}
玩家名：${fullData.realName || '匿名'}
种族：${fullData.race || '未知'}
职业：${fullData.classSelect || '未选择'}
元素亲和：${fullData.element || '无'}

■ 外貌特征
发色：${fullData.colorTheme || '未设定'}
瞳色：${fullData.eyeColor || '未设定'}
体型：${fullData.bodyType || '标准'}
武器：${fullData.weapon || '未选择'}
护甲：${fullData.armor || '布衣'}

■ 背景设定
出身：${fullData.region || '未知'} · ${fullData.socialClass || '平民'}
阵营值：${fullData.alignment || '50'}/100

■ 背景故事
${fullData.backstory || '暂无背景设定'}

■ 隐藏秘密
${fullData.secret || '暂无'}            
生成时间：${new Date().toLocaleString()}
系统ID：AC-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

    setResultText(story);
    setShowResult(true);
  };

  const handleEnterGame = () => {
    onComplete(data as CharacterData);
  };

  const handleReset = () => {
    setData({});
    setCurrentStep(1);
    setShowResult(false);
    localStorage.removeItem('jrpg_character_creator_v2');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultText).then(() => {
      toast.success('已复制到剪贴板');
    }).catch(() => {
      toast.error('复制失败');
    });
  };

  const progress = Math.min((currentStep / totalSteps) * 100, 100);

  // Step navigation items
  const stepGroups = [
    {
      title: '接入前·归零保留',
      color: '#4a90e2',
      steps: [
        { num: 1, label: '归零保留·人格档案' },
        { num: 2, label: '心理锚定测定' },
        { num: 3, label: '现实羁绊·锚点稳定性' },
        { num: 4, label: '降临目的·初始倾向' },
      ]
    },
    {
      title: '源界具现·艾瑟拉之身',
      color: '#9b59b6',
      steps: [
        { num: 5, label: '种族与职业' },
        { num: 6, label: '投影形象与装备' },
        { num: 7, label: '本源亲和与天赋' },
        { num: 8, label: '艾瑟拉出身与背景' },
      ]
    },
  ];

  if (showResult) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <header className="text-center py-6 md:py-10 relative">
            <h1 className="game-title text-3xl md:text-4xl mb-2">ASTRAL CHRONICLES</h1>
            <p className="text-[#a0a0b0] text-sm tracking-widest uppercase">灵魂链接 · 角色创建协议</p>
            <button
              onClick={onOpenSettings}
              className="absolute top-4 right-4 px-4 py-2 btn-secondary rounded-lg text-sm"
            >
              ⚙ API 设置
            </button>
          </header>

          {/* Result content */}
          <div className="astral-card p-6 md:p-10 max-w-4xl mx-auto">
            <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#27ae60] text-[#0a0a0f] font-bold mr-3">✓</span>
              <h2 className="text-2xl font-bold inline">角色创建完成</h2>
              <p className="text-[#a0a0b0] mt-2">您的灵魂已与艾瑟拉完成链接，即将以归零之身降临源界。</p>
            </div>

            {/* Preview card */}
            <div className="bg-gradient-to-br from-[rgba(212,175,55,0.1)] to-[rgba(155,89,182,0.1)] border border-[rgba(212,175,55,0.3)] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center gap-5">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[rgba(0,0,0,0.4)] border-2 border-[#d4af37] flex items-center justify-center text-4xl md:text-5xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                {data.race ? raceOptions.find(r => r.value === data.race)?.icon : '👤'}
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl text-[#d4af37] font-bold mb-1">{data.charName || '未命名角色'}</h3>
                <div className="text-[#a0a0b0] mb-2">{data.race} · {data.classSelect}</div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {data.ageGroup && (
                    <span className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.1)] text-xs text-[#a0a0b0]">
                      {data.ageGroup.split('(')[0]}
                    </span>
                  )}
                  {data.element && (
                    <span className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.1)] text-xs text-[#a0a0b0]">
                      {data.element}属性
                    </span>
                  )}
                  {data.socialClass && (
                    <span className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.1)] text-xs text-[#a0a0b0]">
                      {data.socialClass}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Result text */}
            <div className="bg-[rgba(0,0,0,0.3)] border border-[#d4af37] rounded-xl p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[#d4af37]">
                  <span>📜</span>
                  <span>角色设定书（艾瑟拉用）</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-[rgba(212,175,55,0.2)] border border-[#d4af37] text-[#d4af37] rounded-lg text-sm hover:bg-[#d4af37] hover:text-[#0a0a0f] transition-colors flex items-center gap-2"
                >
                  📋 复制设定
                </button>
              </div>
              <pre className="bg-[rgba(0,0,0,0.5)] p-4 rounded-lg font-mono text-sm text-[#d4d4d4] whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto border-l-4 border-[#d4af37]">
                {resultText}
              </pre>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
              <button
                onClick={handleReset}
                className="btn-secondary px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                ↺ 重新创建
              </button>
              <button
                onClick={handleEnterGame}
                className="btn-primary px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                🎮 进入游戏
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Mobile progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-[rgba(255,255,255,0.1)] z-50 md:hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#d4af37] to-[#9b59b6] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="text-center py-6 md:py-10 relative">
          <h1 className="game-title text-3xl md:text-4xl mb-2">ASTRAL CHRONICLES</h1>
          <p className="text-[#a0a0b0] text-sm tracking-widest uppercase">灵魂链接 · 角色创建协议</p>
          <button
            onClick={onOpenSettings}
            className="absolute top-4 right-4 px-4 py-2 btn-secondary rounded-lg text-sm"
          >
            ⚙ API 设置
          </button>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar navigation - desktop */}
          <nav className="hidden lg:block astral-card p-6 h-fit sticky top-5">
            <div className="flex items-center gap-2 text-[#d4af37] font-semibold mb-4 pb-3 border-b-2 border-[rgba(212,175,55,0.3)]">
              <span>📋</span>
              <span>创建进度</span>
            </div>

            {stepGroups.map((group, gi) => (
              <div key={gi} className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: group.color }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: `${group.color}30` }}>
                    ◈
                  </div>
                  <span>{group.title}</span>
                </div>
                {group.steps.map((step) => (
                  <div
                    key={step.num}
                    onClick={() => goToStep(step.num)}
                    className={`step-item mb-2 text-sm ${
                      currentStep === step.num ? 'active' : ''
                    } ${currentStep > step.num ? 'completed' : ''}`}
                  >
                    {step.label}
                    {currentStep > step.num && <span className="float-right">✓</span>}
                  </div>
                ))}
              </div>
            ))}

            {/* Progress bar */}
            <div className="progress-bar mt-4">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-center mt-2 text-sm text-[#a0a0b0]">
              完成度: {progress.toFixed(1)}%
            </div>
          </nav>

          {/* Content area */}
          <main 
            ref={contentRef}
            className="astral-card p-5 md:p-8 min-h-[600px]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Step 1: 归零保留·人格档案 */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d4af37] text-[#0a0a0f] font-bold mr-3">01</span>
                  <h2 className="text-xl md:text-2xl font-bold inline">归零保留·人格档案</h2>
                  <p className="text-[#a0a0b0] mt-2 text-sm md:text-base">
                    艾瑟拉法则：接入即归零，财富、地位、身体、知识、社会关系皆不保留。唯一能带入源界的，是您的性格、意志与判断力。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">
                      现实姓名 <span className="text-[#e74c3c]">*</span>
                    </label>
                    <input
                      type="text"
                      value={data.realName || ''}
                      onChange={(e) => updateData('realName', e.target.value)}
                      placeholder="接入前身份标识（真实姓名或常用网名）"
                      className="w-full astral-input px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">
                      年龄层 <span className="text-[#e74c3c]">*</span>
                    </label>
                    <select
                      value={data.ageGroup || ''}
                      onChange={(e) => updateData('ageGroup', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="">请选择...</option>
                      <option value="少年(16-18)">少年 (16-18)</option>
                      <option value="青年(19-25)">青年 (19-25)</option>
                      <option value="成年(26-35)">成年 (26-35)</option>
                      <option value="成熟(36-45)">成熟 (36-45)</option>
                      <option value="中年(46+)">中年 (46+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">
                      现实职业
                      <span className="inline-flex items-center justify-center w-4 h-4 bg-[rgba(255,255,255,0.1)] rounded-full text-xs ml-2 cursor-help" title="归零后不保留技能，但可能影响觉醒倾向">ℹ</span>
                    </label>
                    <input
                      type="text"
                      value={data.realJob || ''}
                      onChange={(e) => updateData('realJob', e.target.value)}
                      placeholder="例如：架构师、学者、工匠"
                      className="w-full astral-input px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">对源界的熟悉度</label>
                    <select
                      value={data.gameExp || '老手'}
                      onChange={(e) => updateData('gameExp', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="新手">初临 - 首次接入艾瑟拉</option>
                      <option value="普通">旅人 - 偶有涉足</option>
                      <option value="老手">老手 - 熟知规则与地标</option>
                      <option value="硬核">硬核 - 副本与红名规则精通</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[#d4af37] font-medium mb-2">人格关键词（逗号分隔）</label>
                    <input
                      type="text"
                      value={data.keywords || ''}
                      onChange={(e) => updateData('keywords', e.target.value)}
                      placeholder="例如：理性,孤独,完美主义,好奇"
                      className="w-full astral-input px-4 py-3"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: 心理锚定测定 */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d4af37] text-[#0a0a0f] font-bold mr-3">02</span>
                  <h2 className="text-xl md:text-2xl font-bold inline">心理锚定测定</h2>
                  <p className="text-[#a0a0b0] mt-2 text-sm md:text-base">
                    归零后，性格与意志是您唯一的「锚点」。此处测定将影响 GM 叙事中的行为模式、对话风格，以及在副本/野外遭遇中的抉择倾向。
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Slider 1 */}
                  <div>
                    <label className="block text-[#d4af37] font-medium mb-3">倾向：独行 ←→ 协作</label>
                    <div className="flex justify-between text-xs text-[#a0a0b0] mb-2">
                      <span>独行者</span>
                      <span>平衡</span>
                      <span>领袖型</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={data.personalityExtro || 50}
                      onChange={(e) => updateData('personalityExtro', parseInt(e.target.value))}
                    />
                  </div>

                  {/* Slider 2 */}
                  <div>
                    <label className="block text-[#d4af37] font-medium mb-3">决策风格：直觉 ←→ 逻辑</label>
                    <div className="flex justify-between text-xs text-[#a0a0b0] mb-2">
                      <span>直觉优先</span>
                      <span>平衡</span>
                      <span>逻辑至上</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={data.personalityLogic || 50}
                      onChange={(e) => updateData('personalityLogic', parseInt(e.target.value))}
                    />
                  </div>

                  {/* Slider 3 */}
                  <div>
                    <label className="block text-[#d4af37] font-medium mb-3">风险偏好：保守 ←→ 激进</label>
                    <div className="flex justify-between text-xs text-[#a0a0b0] mb-2">
                      <span>谨慎求生</span>
                      <span>随机应变</span>
                      <span>冒险赌徒</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={data.personalityRisk || 50}
                      onChange={(e) => updateData('personalityRisk', parseInt(e.target.value))}
                    />
                  </div>

                  {/* Fear selection */}
                  <div>
                    <label className="block text-[#d4af37] font-medium mb-3">
                      深层恐惧
                      <span className="inline-flex items-center justify-center w-4 h-4 bg-[rgba(255,255,255,0.1)] rounded-full text-xs ml-2 cursor-help" title="影响在危险场景、副本死亡惩罚、深渊侵蚀等情境下的反应">ℹ</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {fearOptions.map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() => updateData('fear', opt.value)}
                          className={`option-card p-4 flex flex-col items-center justify-center text-center min-h-[90px] ${
                            data.fear === opt.value ? 'selected' : ''
                          }`}
                        >
                          <span className="text-2xl mb-1">{opt.icon}</span>
                          <span className={`text-sm ${data.fear === opt.value ? 'text-[#d4af37] font-semibold' : 'text-[#a0a0b0]'}`}>
                            {opt.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 现实羁绊·锚点稳定性 */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
                <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d4af37] text-[#0a0a0f] font-bold mr-3">03</span>
                  <h2 className="text-xl md:text-2xl font-bold inline">现实羁绊·锚点稳定性</h2>
                  <p className="text-[#a0a0b0] mt-2 text-sm md:text-base">
                    您与现实的联系强度，在源界中体现为「锚点稳定性」——影响复活后的记忆残留、情感波动与部分隐藏剧情触发。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">家庭状况</label>
                    <select
                      value={data.familyStatus || '核心家庭'}
                      onChange={(e) => updateData('familyStatus', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="独居">独居 - 无牵无挂</option>
                      <option value="核心家庭">核心家庭 - 父母健在</option>
                      <option value="重组家庭">重组家庭 - 复杂关系</option>
                      <option value="独立生活">独立生活 - 已组建家庭</option>
                      <option value="孤儿">孤儿 - 独自成长</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">社交依赖度</label>
                    <select
                      value={data.socialDep || '中等'}
                      onChange={(e) => updateData('socialDep', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="极高">极高 - 无法忍受独处</option>
                      <option value="较高">较高 - 需要定期社交</option>
                      <option value="中等">中等 - 平衡状态</option>
                      <option value="较低">较低 - 享受孤独</option>
                      <option value="极低">极低 - 完全独立</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[#d4af37] font-medium mb-2">无法割舍的现实羁绊</label>
                    <textarea
                      value={data.bonds || ''}
                      onChange={(e) => updateData('bonds', e.target.value)}
                      placeholder="描述您最珍视的人、物或承诺（将影响锚点与剧情）..."
                      rows={3}
                      className="w-full astral-input px-4 py-3 resize-y"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[#d4af37] font-medium mb-2">接入艾瑟拉的契机</label>
                    <textarea
                      value={data.entryReason || ''}
                      onChange={(e) => updateData('entryReason', e.target.value)}
                      placeholder="是什么让您决定以意识投射进入源界？"
                      rows={3}
                      className="w-full astral-input px-4 py-3 resize-y"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: 降临目的·初始倾向 */}
            {currentStep === 4 && (
              <div className="animate-fade-in">
                <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d4af37] text-[#0a0a0f] font-bold mr-3">04</span>
                  <h2 className="text-xl md:text-2xl font-bold inline">降临目的·初始倾向</h2>
                  <p className="text-[#a0a0b0] mt-2 text-sm md:text-base">
                    确认您此刻接入源界的核心目的，将决定在盘根大陆、翡翠洲或灰烬大陆等地的初始任务线与阵营倾向。
                  </p>
                </div>

                <div>
                  <label className="block text-[#d4af37] font-medium mb-3">主要目标（多选）</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {goalOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => {
                          const current = data.goals || [];
                          if (current.includes(opt.value)) {
                            updateData('goals', current.filter(g => g !== opt.value));
                          } else {
                            updateData('goals', [...current, opt.value]);
                          }
                        }}
                        className={`option-card p-4 flex flex-col items-center justify-center text-center min-h-[90px] ${
                          (data.goals || []).includes(opt.value) ? 'selected' : ''
                        }`}
                      >
                        <span className="text-2xl mb-1">{opt.icon}</span>
                        <span className={`text-sm ${(data.goals || []).includes(opt.value) ? 'text-[#d4af37] font-semibold' : 'text-[#a0a0b0]'}`}>
                          {opt.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-[#d4af37] font-medium mb-2">您期望在艾瑟拉成为什么样的存在？</label>
                  <textarea
                    value={data.idealSelf || ''}
                    onChange={(e) => updateData('idealSelf', e.target.value)}
                    placeholder="描述您在源界中的理想形象（冒险者、学者、领主、独行侠…）"
                    rows={4}
                    className="w-full astral-input px-4 py-3 resize-y"
                  />
                </div>
              </div>
            )}

            {/* Step 5: 种族与职业 */}
            {currentStep === 5 && (
              <div className="animate-fade-in">
                <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d4af37] text-[#0a0a0f] font-bold mr-3">05</span>
                  <h2 className="text-xl md:text-2xl font-bold inline">种族与职业</h2>
                  <p className="text-[#a0a0b0] mt-2 text-sm md:text-base">
                    选择您在艾瑟拉意识投射后的形态与战斗方式。种族将决定出生地、势力倾向及 NPC 对您的初始态度。
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-[#d4af37] font-medium mb-3">
                    种族选择 <span className="text-[#e74c3c]">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {raceOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => updateData('race', opt.value)}
                        className={`option-card p-4 flex flex-col items-center justify-center text-center min-h-[100px] ${
                          data.race === opt.value ? 'selected' : ''
                        }`}
                      >
                        <span className="text-3xl mb-1">{opt.icon}</span>
                        <span className={`font-medium ${data.race === opt.value ? 'text-[#d4af37]' : 'text-[#e8e8e8]'}`}>
                          {opt.label}
                        </span>
                        <span className="text-xs text-[#666] mt-1">{opt.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[#d4af37] font-medium mb-2">
                    基础职业 <span className="text-[#e74c3c]">*</span>
                  </label>
                  <select
                    value={data.classSelect || ''}
                    onChange={(e) => updateData('classSelect', e.target.value)}
                    className="w-full astral-input px-4 py-3"
                  >
                    <option value="">请选择...</option>
                    <optgroup label="物理系">
                      <option value="剑士">剑士</option>
                      <option value="游侠">游侠</option>
                      <option value="刺客">刺客</option>
                      <option value="守卫">守卫</option>
                    </optgroup>
                    <optgroup label="魔法系（本源之力）">
                      <option value="法师">法师</option>
                      <option value="牧师">牧师</option>
                      <option value="术士">术士</option>
                      <option value="德鲁伊">德鲁伊</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[#d4af37] font-medium mb-2">
                    角色昵称（在艾瑟拉中的名号） <span className="text-[#e74c3c]">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.charName || ''}
                    onChange={(e) => updateData('charName', e.target.value)}
                    placeholder="输入您在源界中的角色名"
                    className="w-full astral-input px-4 py-3"
                  />
                </div>
              </div>
            )}

            {/* Step 6: 投影形象与装备 */}
            {currentStep === 6 && (
              <div className="animate-fade-in">
                <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d4af37] text-[#0a0a0f] font-bold mr-3">06</span>
                  <h2 className="text-xl md:text-2xl font-bold inline">投影形象与装备</h2>
                  <p className="text-[#a0a0b0] mt-2 text-sm md:text-base">
                    定制您在艾瑟拉中的意识投影外观与初始装备风格。外观与 NPC 无异，需从零获取装备与物资。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">发色/肤色主调</label>
                    <select
                      value={data.colorTheme || '乌黑'}
                      onChange={(e) => updateData('colorTheme', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="乌黑">乌黑如夜</option>
                      <option value="银白">银白如月</option>
                      <option value="赤红">赤红如血</option>
                      <option value="湛蓝">湛蓝如海</option>
                      <option value="翠绿">翠绿如林</option>
                      <option value="紫晶">紫晶如魔法</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">瞳色</label>
                    <select
                      value={data.eyeColor || '琥珀'}
                      onChange={(e) => updateData('eyeColor', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="琥珀">琥珀金</option>
                      <option value="翡翠">翡翠绿</option>
                      <option value="深渊">深渊紫</option>
                      <option value="霜蓝">霜冻蓝</option>
                      <option value="烈焰">烈焰红</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">体型风格</label>
                    <select
                      value={data.bodyType || '标准'}
                      onChange={(e) => updateData('bodyType', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="纤细">纤细敏捷型</option>
                      <option value="标准">均衡标准型</option>
                      <option value="强壮">强壮力量型</option>
                      <option value="神秘">神秘飘渺型</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">显著特征</label>
                    <input
                      type="text"
                      value={data.features || ''}
                      onChange={(e) => updateData('features', e.target.value)}
                      placeholder="如：疤痕、龙鳞纹、义肢、符文烙印"
                      className="w-full astral-input px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">主武器偏好</label>
                    <select
                      value={data.weapon || '长剑'}
                      onChange={(e) => updateData('weapon', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="长剑">长剑</option>
                      <option value="双刀">双刀</option>
                      <option value="法杖">法杖</option>
                      <option value="弓箭">长弓</option>
                      <option value="拳套">拳套</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">护甲风格</label>
                    <select
                      value={data.armor || '布衣'}
                      onChange={(e) => updateData('armor', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="布衣">布衣</option>
                      <option value="皮甲">皮甲</option>
                      <option value="板甲">板甲</option>
                      <option value="法袍">法袍</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: 本源亲和与天赋倾向 */}
            {currentStep === 7 && (
              <div className="animate-fade-in">
                <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d4af37] text-[#0a0a0f] font-bold mr-3">07</span>
                  <h2 className="text-xl md:text-2xl font-bold inline">本源亲和与天赋倾向</h2>
                  <p className="text-[#a0a0b0] mt-2 text-sm md:text-base">
                    艾瑟拉由本源之力驱动，魔法分支包括元素、自然、符文、暗影、死灵等。选择您从零开始后最先觉醒的元素亲和与先天倾向。
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-[#d4af37] font-medium mb-3">主要元素亲和</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {elementOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => updateData('element', opt.value)}
                        className={`option-card p-4 flex flex-col items-center justify-center text-center min-h-[80px] ${
                          data.element === opt.value ? 'selected' : ''
                        }`}
                      >
                        <span className="text-2xl mb-1">{opt.icon}</span>
                        <span className={`text-sm ${data.element === opt.value ? 'text-[#d4af37] font-semibold' : 'text-[#a0a0b0]'}`}>
                          {opt.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[#d4af37] font-medium mb-3">先天特长（选择两项）</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {talentOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => {
                          const current = data.talents || [];
                          if (current.includes(opt.value)) {
                            updateData('talents', current.filter(t => t !== opt.value));
                          } else if (current.length < 2) {
                            updateData('talents', [...current, opt.value]);
                          } else {
                            updateData('talents', [current[1], opt.value]);
                          }
                        }}
                        className={`option-card p-4 flex flex-col items-center justify-center text-center min-h-[80px] ${
                          (data.talents || []).includes(opt.value) ? 'selected' : ''
                        }`}
                      >
                        <span className="text-2xl mb-1">{opt.icon}</span>
                        <span className={`text-sm ${(data.talents || []).includes(opt.value) ? 'text-[#d4af37] font-semibold' : 'text-[#a0a0b0]'}`}>
                          {opt.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[#d4af37] font-medium mb-2">特殊缺陷（可选）</label>
                  <select
                    value={data.flaw || '无'}
                    onChange={(e) => updateData('flaw', e.target.value)}
                    className="w-full astral-input px-4 py-3"
                  >
                    <option value="无">无</option>
                    <option value="恐高">恐高症</option>
                    <option value="怕火">火焰恐惧</option>
                    <option value="路痴">方向感缺失</option>
                    <option value="嗜睡">嗜睡体质</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 8: 艾瑟拉出身与背景 */}
            {currentStep === 8 && (
              <div className="animate-fade-in">
                <div className="mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d4af37] text-[#0a0a0f] font-bold mr-3">08</span>
                  <h2 className="text-xl md:text-2xl font-bold inline">艾瑟拉出身与背景</h2>
                  <p className="text-[#a0a0b0] mt-2 text-sm md:text-base">
                    编织您在源界中的「出身」——系统将视作您在此世的来历，用于 GM 叙事中的地点、势力与任务线。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">出身地区</label>
                    <select
                      value={data.region || '王都'}
                      onChange={(e) => updateData('region', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="王都">盘根大陆·王都/帝国</option>
                      <option value="精灵森">翡翠洲·永夜森林/翠叶部落</option>
                      <option value="矮人堡">世界脊·铁砧城/晶脉堡</option>
                      <option value="边境">裂土荒原/深渊裂隙边缘</option>
                      <option value="学院">碎梦海/浮空列岛</option>
                      <option value="流浪">无根之人</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d4af37] font-medium mb-2">社会阶层</label>
                    <select
                      value={data.socialClass || '平民'}
                      onChange={(e) => updateData('socialClass', e.target.value)}
                      className="w-full astral-input px-4 py-3"
                    >
                      <option value="贵族">落魄贵族</option>
                      <option value="平民">普通平民</option>
                      <option value="商人">商人/地精商会关联</option>
                      <option value="学者">学者家庭</option>
                      <option value="流浪">街头流浪</option>
                      <option value="孤儿">战争孤儿</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[#d4af37] font-medium mb-3">起始阵营倾向</label>
                    <div className="flex justify-between text-xs text-[#a0a0b0] mb-2">
                      <span>守序善良</span>
                      <span>绝对中立</span>
                      <span>混乱邪恶</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={data.alignment || 50}
                      onChange={(e) => updateData('alignment', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[#d4af37] font-medium mb-2">背景故事概要</label>
                    <textarea
                      value={data.backstory || ''}
                      onChange={(e) => updateData('backstory', e.target.value)}
                      placeholder="简述您在此世的来历与为何成为冒险者（可提及本源之泉、副本、红名区等）..."
                      rows={4}
                      className="w-full astral-input px-4 py-3 resize-y"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[#d4af37] font-medium mb-2">秘密（仅您与 GM 知晓）</label>
                    <textarea
                      value={data.secret || ''}
                      onChange={(e) => updateData('secret', e.target.value)}
                      placeholder="角色隐藏的秘密（可与复活机制、虚数之钥、上古遗族等谜团挂钩）..."
                      rows={3}
                      className="w-full astral-input px-4 py-3 resize-y"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Swipe hint - mobile only */}
            <div className="text-center text-[#a0a0b0] text-sm py-4 mt-4 opacity-60 md:hidden">
              ◀ 左右滑动切换步骤 ▶
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6 pt-5 border-t border-[rgba(255,255,255,0.1)]">
              {currentStep > 1 && (
                <button
                  onClick={handlePrev}
                  className="btn-secondary px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  ← 上一步
                </button>
              )}
              <button
                onClick={handleNext}
                className="btn-primary px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ml-auto"
              >
                {currentStep === totalSteps ? '✓ 生成角色' : '下一步 →'}
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[rgba(10,10,15,0.95)] backdrop-blur-lg border-t border-[rgba(255,255,255,0.1)] py-2 px-4 flex justify-around z-40 lg:hidden safe-bottom">
        {[
          { step: 1, icon: '👤', label: '现实' },
          { step: 3, icon: '🔗', label: '羁绊' },
          { step: 5, icon: '⚔️', label: '种族' },
          { step: 7, icon: '✨', label: '能力' },
          { step: 9, icon: '📜', label: '完成' },
        ].map((item) => (
          <button
            key={item.step}
            onClick={() => item.step <= 8 ? goToStep(item.step) : currentStep === 8 && handleNext()}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
              (currentStep >= item.step - 1 && currentStep <= item.step + 1) || (item.step === 9 && showResult)
                ? 'text-[#d4af37]' 
                : 'text-[#a0a0b0]'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile padding for bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
