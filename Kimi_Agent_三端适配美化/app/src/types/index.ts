// 角色数据类型
export interface CharacterData {
  realName: string;
  ageGroup: string;
  realJob: string;
  gameExp: string;
  keywords: string;
  personalityExtro: number;
  personalityLogic: number;
  personalityRisk: number;
  fear: string;
  familyStatus: string;
  socialDep: string;
  bonds: string;
  entryReason: string;
  goals: string[];
  idealSelf: string;
  race: string;
  classSelect: string;
  charName: string;
  colorTheme: string;
  eyeColor: string;
  bodyType: string;
  features: string;
  weapon: string;
  armor: string;
  element: string;
  talents: string[];
  flaw: string;
  region: string;
  socialClass: string;
  alignment: number;
  backstory: string;
  secret: string;
}

// 聊天消息类型
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  name?: string;
  meta?: any;
}

// 会话类型
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  source: 'local' | 'cloud';
  messages: ChatMessage[];
}

// 预设词条类型
export interface PresetEntry {
  id: string;
  name: string;
  content: string;
  defaultEnabled: boolean;
}

// 预设类型
export interface Preset {
  name: string;
  version: string;
  entries: PresetEntry[];
}

// API 配置类型
export interface ApiConfig {
  source: 'openai_official' | 'third_party';
  url: string;
  key: string;
  model: string;
  temperature: number;
  maxTokens: number;
  outputCharLimit: number;
}

// 用户信息类型
export interface UserInfo {
  id: string;
  email: string;
  nickname: string;
  username: string;
  discord_avatar?: string;
  auth_provider: string;
}

// 游戏状态类型
export interface GameStatus {
  location: string;
  time: string;
  gold: number;
}
