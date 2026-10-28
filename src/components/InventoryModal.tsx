import React, { useState } from 'react';
import { Backpack, X, Shield, Sword, Heart, Flame, Zap, Sparkles } from 'lucide-react';
import { GameItem, PlayerStats } from '../types/game';
import { sound } from '../audio/soundEngine';

interface InventoryModalProps {
  stats: PlayerStats;
  items: GameItem[];
  onClose: () => void;
  onUseItem: (itemId: string) => void;
  onEquipItem?: (item: GameItem) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  stats,
  items,
  onClose,
  onUseItem,
}) => {
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(items[0] || null);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <Backpack className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-bold text-xl text-amber-300">
              Tas & Perlengkapan Ksatria
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Split: Stats & Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-1">
          {/* Column 1: Player Attribute Sheet */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-amber-500/40 bg-slate-950">
                <img
                  src="/src/assets/images/flores_rpg_warrior_portrait_1793202487152.jpg"
                  alt="Ksatria Bara"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-100">Bara Flores</h3>
                <span className="text-xs text-amber-400 font-mono">Tingkat {stats.level}</span>
              </div>
            </div>

            {/* Attributes list with tabular-nums */}
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-red-400" /> Darah Maksimal
                </span>
                <span className="font-mono tabular-nums text-slate-200 font-semibold">{stats.maxHp} HP</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-sky-400" /> Mana Spiritual
                </span>
                <span className="font-mono tabular-nums text-slate-200 font-semibold">{stats.maxMana} MP</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Stamina Tubuh
                </span>
                <span className="font-mono tabular-nums text-slate-200 font-semibold">{stats.maxStamina}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sword className="w-3.5 h-3.5 text-yellow-400" /> Daya Serang
                </span>
                <span className="font-mono tabular-nums text-amber-300 font-bold">{stats.attack}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Ketahanan Zirah
                </span>
                <span className="font-mono tabular-nums text-emerald-300 font-bold">{stats.defense}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Elemen Kelimutu
                </span>
                <span className="text-cyan-300 uppercase font-mono font-semibold">Tiga Kawah</span>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Item Bag & Details */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Bag Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto p-1">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sound.playUiClick();
                    setSelectedItem(item);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                    selectedItem?.id === item.id
                      ? 'bg-amber-950/50 border-amber-400'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                    {item.name}
                  </span>
                </button>
              ))}
              {items.length === 0 && (
                <div className="col-span-5 py-8 text-center text-xs text-slate-500">
                  Tas kosong. Kalahkan musuh atau buka peti di Flores untuk mendapatkan barang pusaka.
                </div>
              )}
            </div>

            {/* Selected Item Preview Box */}
            {selectedItem && (
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{selectedItem.icon}</span>
                    <div>
                      <h4 className="font-display font-bold text-amber-200">
                        {selectedItem.name}
                      </h4>
                      <span className="text-xs uppercase tracking-wider text-slate-400">
                        Jenis: {selectedItem.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {selectedItem.description}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    {selectedItem.attackBonus && (
                      <span className="text-amber-400 font-semibold font-mono">
                        +{selectedItem.attackBonus} Serangan
                      </span>
                    )}
                    {selectedItem.defenseBonus && (
                      <span className="text-emerald-400 font-semibold font-mono">
                        +{selectedItem.defenseBonus} Pertahanan
                      </span>
                    )}
                    {selectedItem.hpRestore && (
                      <span className="text-red-400 font-semibold font-mono">
                        +{selectedItem.hpRestore} Pemulihan HP
                      </span>
                    )}
                    {selectedItem.manaRestore && (
                      <span className="text-sky-400 font-semibold font-mono">
                        +{selectedItem.manaRestore} Pemulihan Mana
                      </span>
                    )}
                    {selectedItem.staminaRestore && (
                      <span className="text-yellow-400 font-semibold font-mono">
                        +{selectedItem.staminaRestore} Stamina
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  {selectedItem.type === 'consumable' && (
                    <button
                      onClick={() => {
                        onUseItem(selectedItem.id);
                        onClose();
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Gunakan Ramuan
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
