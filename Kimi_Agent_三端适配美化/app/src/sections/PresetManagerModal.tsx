import type { Preset } from '@/types';

interface PresetManagerModalProps {
  presets?: Preset[];
  onClose: () => void;
}

export function PresetManagerModal({ presets, onClose }: PresetManagerModalProps) {
  const hasPresets = Array.isArray(presets) && presets.length > 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto bg-[rgba(20,20,35,0.95)] border border-[rgba(212,175,55,0.4)] rounded-2xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
        <h3 className="text-[#d4af37] text-xl font-semibold mb-6 flex items-center gap-2">
          📋 预设管理
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-[#a0a0b0]">
            预设决定守秘人的语气、节奏与世界细节展开方式。你可以在这里为不同冒险风格创建和管理预设组合。
          </p>

          <div className="border border-[rgba(255,255,255,0.08)] rounded-lg p-3 bg-[rgba(0,0,0,0.35)]">
            {hasPresets ? (
              <ul className="space-y-2">
                {presets!.map((preset) => (
                  <li
                    key={preset.name}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-[rgba(10,10,20,0.9)] hover:bg-[rgba(212,175,55,0.08)] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-[#e8e8e8] font-medium truncate">
                        {preset.name}
                      </div>
                      <div className="text-xs text-[#a0a0b0]">
                        v{preset.version} · {preset.entries.length} 条预设词条
                      </div>
                    </div>
                    <button
                      className="ml-3 px-3 py-1.5 text-xs border border-[rgba(212,175,55,0.6)] text-[#d4af37] rounded-md hover:bg-[rgba(212,175,55,0.15)] transition-colors"
                    >
                      编辑
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="text-2xl mb-1">📝</div>
                <p className="text-sm text-[#a0a0b0]">
                  目前还没有任何预设。
                </p>
                <p className="text-xs text-[#777795]">
                  你可以先使用默认叙事风格，后续在这里为不同跑团风格创建独立预设。
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 btn-primary py-2.5 rounded-lg font-semibold"
            >
              新建预设（占位）
            </button>
            <button
              className="flex-1 px-4 py-2.5 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-[#e8e8e8] rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            >
              导入 / 导出（占位）
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-[#e8e8e8] rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

