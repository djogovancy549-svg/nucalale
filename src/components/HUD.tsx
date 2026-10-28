import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  Flame, 
  Zap, 
  Coins, 
  Volume2, 
  VolumeX, 
  Backpack, 
  Scroll, 
  Pause,
  Compass,
  Sword,
  Sparkles,
  ShieldAlert,
  Users
} from 'lucide-react';
import { PlayerStats, RegionId, Quest, Enemy, PlayableCharacter } from '../types/game';
import { REGIONS_DATA } from '../data/gameData';
import { sound } from '../audio/soundEngine';

interface HUDProps {
  stats: PlayerStats;
  currentRegion: RegionId;
  selectedCharacter: PlayableCharacter;
  activeQuests: Quest[];
  bossEnemy?: Enemy | null;
  magicCooldown: number;
  rollCooldown: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenQuests: () => void;
  onOpenCharacterSelect: () => void;
  onOpenPause: () => void;
  onTriggerAttack: () => void;
  onTriggerWhip: () => void;
  onTriggerMagic: () => void;
  onTriggerRoll: () => void;
  onTriggerInteract: () => void;
  onUseItem: (itemId: string) => void;
  onVirtualMove: (dx: number, dy: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  currentRegion,
  selectedCharacter,
  activeQuests,
  bossEnemy,
  magicCooldown,
  rollCooldown,
  isMuted,
  onToggleMute,
  onOpenInventory,
  onOpenQuests,
  onOpenCharacterSelect,
  onOpenPause,
  onTriggerAttack,
  onTriggerWhip,
  onTriggerMagic,
  onTriggerRoll,
  onTriggerInteract,
  onUseItem,
  onVirtualMove,
}) => {
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowTouchControls(isTouch);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const touch = e.touches[0];
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 40;

    let normX = 0;
    let normY = 0;
    if (dist > 0) {
      normX = dx / dist;
      normY = dy / dist;
    }

    const clampedDist = Math.min(dist, maxRadius);
    setStickPos({ x: normX * clampedDist, y: normY * clampedDist });
    onVirtualMove(normX, normY);
  };

  const handleTouchEnd = () => {
    setStickPos({ x: 0, y: 0 });
    onVirtualMove(0, 0);
  };

  const region = REGIONS_DATA[currentRegion];
  const activeQuest = activeQuests.find((q) => !q.completed);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 sm:p-6 overflow-hidden font-body text-slate-100">
      {/* TOP ROW */}
      <div className="w-full flex items-start justify-between gap-4">
        {/* Status Cluster: Character Avatar & HP/Mana/Stamina/Gold */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/85 border border-amber-500/40 p-2.5 rounded-xl shadow-lg">
          {/* Character Portrait with user reference style */}
          <button
            onClick={() => {
              sound.playUiClick();
              onOpenCharacterSelect();
            }}
            title="Ganti Karakter Ksatria [C]"
            className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-amber-400/80 shrink-0 bg-slate-900 cursor-pointer shadow-md hover:scale-105 transition-transform"
          >
            <img
              src={selectedCharacter.portrait}
              alt={selectedCharacter.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Orange Level Badge matching user photo reference */}
            <div className="absolute bottom-0 right-0 bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-slate-950 rounded-tl-lg font-mono border-t border-l border-amber-300">
              Lv.{stats.level}
            </div>
          </button>

          <div className="flex flex-col gap-1 w-32 sm:w-44">
            {/* Character Name & Class */}
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-xs text-amber-200 truncate">
                {selectedCharacter.name}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-mono">
                {selectedCharacter.gender === 'male' ? 'Pria' : 'Wanita'}
              </span>
            </div>

            {/* HP Bar */}
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-red-400">
                <Heart className="w-3.5 h-3.5 fill-current" /> HP
              </span>
              <span className="font-mono tabular-nums text-red-200">
                {Math.max(0, Math.round(stats.hp))}/{stats.maxHp}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100))}%` }}
              />
            </div>

            {/* Mana Bar */}
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-sky-400">
                <Flame className="w-3.5 h-3.5 fill-current" /> MANA
              </span>
              <span className="font-mono tabular-nums text-sky-200">
                {Math.max(0, Math.round(stats.mana))}/{stats.maxMana}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (stats.mana / stats.maxMana) * 100))}%` }}
              />
            </div>

            {/* Stamina Bar */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-100"
                style={{ width: `${Math.max(0, Math.min(100, (stats.stamina / stats.maxStamina) * 100))}%` }}
              />
            </div>

            {/* Gold */}
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium mt-0.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono tabular-nums font-bold">{stats.gold}</span>
              <span className="text-[10px] text-amber-200/70">Koin Adat</span>
            </div>
          </div>
        </div>

        {/* BOSS HP BAR (Top Center) */}
        {bossEnemy && bossEnemy.hp > 0 && (
          <div className="pointer-events-auto flex-1 max-w-md mx-auto bg-slate-950/90 border border-red-600/50 p-2.5 rounded-xl shadow-2xl flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider mb-1 font-display">
              <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
              <span>{bossEnemy.name}</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-red-800">
              <div
                className="h-full bg-gradient-to-r from-red-700 via-orange-600 to-yellow-500 transition-all duration-150"
                style={{ width: `${Math.max(0, (bossEnemy.hp / bossEnemy.maxHp) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-slate-300 mt-0.5">
              {bossEnemy.hp} / {bossEnemy.maxHp}
            </span>
          </div>
        )}

        {/* Top Right: Region & Controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Region Indicator */}
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col text-right">
              <span className="font-semibold text-slate-100">{region.name}</span>
              <span className="text-[10px] text-slate-400">{region.subtitle}</span>
            </div>
          </div>

          {/* Action Menu Buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playUiClick();
                onOpenCharacterSelect();
              }}
              title="Pilih Karakter (10 Ksatria Pria & Wanita) [C]"
              className="p-2 bg-slate-950/85 hover:bg-slate-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">10 Karakter</span>
            </button>
            <button
              onClick={() => {
                sound.playUiClick();
                onOpenInventory();
              }}
              title="Buka Tas / Perlengkapan [Tab]"
              className="p-2 bg-slate-950/85 hover:bg-slate-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 rounded-lg transition-colors cursor-pointer"
            >
              <Backpack className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sound.playUiClick();
                onOpenQuests();
              }}
              title="Buku Catatan Misi [M]"
              className="p-2 bg-slate-950/85 hover:bg-slate-900 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <Scroll className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
              className="p-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={() => {
                sound.playUiClick();
                onOpenPause();
              }}
              title="Menu Jeda [Esc]"
              className="p-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Active Quest Preview Banner */}
          {activeQuest && (
            <div className="pointer-events-auto bg-slate-950/85 border border-amber-500/30 p-2.5 rounded-lg max-w-xs text-xs">
              <div className="flex items-center justify-between text-amber-400 font-semibold mb-0.5">
                <span className="truncate">Misi: {activeQuest.title}</span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                {activeQuest.description}
              </p>
              {activeQuest.targetType === 'defeat' && (
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                  <span>Target Siluman:</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    {activeQuest.currentCount} / {activeQuest.targetCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: Skills & Mobile Controls */}
      <div className="w-full flex items-end justify-between">
        {showTouchControls ? (
          <div
            ref={joystickBaseRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="pointer-events-auto relative w-28 h-28 rounded-full bg-black/50 border-2 border-white/20 flex items-center justify-center touch-none mb-2"
          >
            <div
              className="w-12 h-12 rounded-full bg-amber-500/80 border border-white shadow-md transition-transform duration-75"
              style={{
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              }}
            />
          </div>
        ) : (
          <div className="w-28" />
        )}

        {/* Center: Action Hotbar */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 border border-amber-500/30 p-2 rounded-xl shadow-xl">
          {/* Main Attack */}
          <button
            onClick={() => onTriggerAttack()}
            className="relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 rounded-lg active:scale-95 transition cursor-pointer"
          >
            <Sword className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-10">
              {selectedCharacter.weaponType === 'spear' ? 'Tombak' : selectedCharacter.weaponType === 'magic' ? 'Tongkat' : 'Parang'}
            </span>
            <span className="absolute top-0.5 right-1 text-[9px] font-mono text-amber-300">J / Spasi</span>
          </button>

          {/* Cambuk Caci */}
          <button
            onClick={() => onTriggerWhip()}
            className="relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 rounded-lg active:scale-95 transition cursor-pointer"
          >
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] text-slate-400 mt-0.5">Caci</span>
            <span className="absolute top-0.5 right-1 text-[9px] font-mono text-amber-300">K</span>
          </button>

          {/* Sihir Kelimutu */}
          <button
            onClick={() => onTriggerMagic()}
            disabled={magicCooldown > 0}
            className="relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 rounded-lg active:scale-95 transition disabled:opacity-50 cursor-pointer overflow-hidden"
          >
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px] text-slate-400 mt-0.5">Sihir</span>
            <span className="absolute top-0.5 right-1 text-[9px] font-mono text-cyan-300">Q</span>
            {magicCooldown > 0 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs font-mono text-cyan-300 tabular-nums font-bold">
                {magicCooldown.toFixed(1)}s
              </div>
            )}
          </button>

          {/* Guling / Hindar */}
          <button
            onClick={() => onTriggerRoll()}
            disabled={rollCooldown > 0}
            className="relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 rounded-lg active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            <span className="text-base font-bold text-emerald-400">💨</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Hindar</span>
            <span className="absolute top-0.5 right-1 text-[9px] font-mono text-emerald-300">Shift</span>
          </button>

          {/* Interaksi */}
          <button
            onClick={() => onTriggerInteract()}
            className="relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 hover:bg-slate-800 border border-yellow-500/40 rounded-lg active:scale-95 transition cursor-pointer"
          >
            <span className="text-base font-bold text-yellow-400">💬</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Aksi</span>
            <span className="absolute top-0.5 right-1 text-[9px] font-mono text-yellow-300">E</span>
          </button>

          {/* Quick Item 1 */}
          <button
            onClick={() => onUseItem('madu_flores')}
            title="Gunakan Madu Flores (+80 HP) [1]"
            className="hidden sm:flex relative flex-col items-center justify-center w-12 h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg active:scale-95 transition cursor-pointer"
          >
            <span className="text-sm">🍯</span>
            <span className="text-[9px] text-slate-400">Madu</span>
            <span className="absolute top-0.5 right-1 text-[9px] font-mono text-slate-400">1</span>
          </button>

          {/* Quick Item 2 */}
          <button
            onClick={() => onUseItem('kopi_bajawa')}
            title="Gunakan Kopi Bajawa (+Stamina/Mana) [2]"
            className="hidden sm:flex relative flex-col items-center justify-center w-12 h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg active:scale-95 transition cursor-pointer"
          >
            <span className="text-sm">☕</span>
            <span className="text-[9px] text-slate-400">Kopi</span>
            <span className="absolute top-0.5 right-1 text-[9px] font-mono text-slate-400">2</span>
          </button>
        </div>

        <div className="w-28 flex justify-end">
          {showTouchControls && (
            <button
              onClick={onTriggerInteract}
              className="pointer-events-auto p-4 rounded-full bg-yellow-500/80 text-slate-950 font-bold text-sm shadow-lg mb-2 active:scale-90"
            >
              [E] Aksi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
