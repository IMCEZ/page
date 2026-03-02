/**
 * ASTRAL CHRONICLES / Azure Legend - 共享配置
 * API 配置与角色数据在 creation 与 game 视图间共享
 */
const APP_CONFIG = {
  storageKeys: {
    apiUrl: 'astral_api_url',
    apiKey: 'astral_api_key',
    model: 'astral_model',
    temperature: 'astral_temperature',
    maxTokens: 'astral_max_tokens',
    characterDraft: 'jrpg_character_creator_v2',
    createdCharacter: 'astral_created_character',
    openingScene: 'astral_opening_scene'
  },
  defaultApiUrl: 'https://api.openai.com/v1/chat/completions',
  defaultModel: 'claude-opus-4-6'
};

function getApiConfig() {
  return {
    url: localStorage.getItem(APP_CONFIG.storageKeys.apiUrl) || '',
    key: localStorage.getItem(APP_CONFIG.storageKeys.apiKey) || '',
    model: localStorage.getItem(APP_CONFIG.storageKeys.model) || 'claude-sonnet-4-20250514',
    temperature: parseFloat(localStorage.getItem(APP_CONFIG.storageKeys.temperature)) || 0.8,
    maxTokens: parseInt(localStorage.getItem(APP_CONFIG.storageKeys.maxTokens), 10) || 2000
  };
}

function saveApiConfig(config) {
  if (config.url !== undefined) localStorage.setItem(APP_CONFIG.storageKeys.apiUrl, config.url);
  if (config.key !== undefined) localStorage.setItem(APP_CONFIG.storageKeys.apiKey, config.key);
  if (config.model !== undefined) localStorage.setItem(APP_CONFIG.storageKeys.model, config.model);
  if (config.temperature !== undefined) localStorage.setItem(APP_CONFIG.storageKeys.temperature, config.temperature);
  if (config.maxTokens !== undefined) localStorage.setItem(APP_CONFIG.storageKeys.maxTokens, String(config.maxTokens));
}

function getCreatedCharacter() {
  try {
    const raw = sessionStorage.getItem(APP_CONFIG.storageKeys.createdCharacter);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function setCreatedCharacter(data) {
  sessionStorage.setItem(APP_CONFIG.storageKeys.createdCharacter, JSON.stringify(data));
}

function getOpeningScene() {
  return sessionStorage.getItem(APP_CONFIG.storageKeys.openingScene) || '';
}

function setOpeningScene(text) {
  sessionStorage.setItem(APP_CONFIG.storageKeys.openingScene, text || '');
}
