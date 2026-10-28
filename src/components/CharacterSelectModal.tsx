import React, { useState } from 'react';
import { Users, X, Check, Shield, Sword, Heart, Flame, Zap, UserCheck, BookOpen, LogOut } from 'lucide-react';
import { PlayableCharacter } from '../types/game';
import { PLAYABLE_CHARACTERS } from '../data/charactersData';
import { sound } from '../audio/soundEngine';

interface CharacterSelectModalProps {
  selectedCharacter: PlayableCharacter;
  onSelectCharacter: (char: PlayableCharacter) => void;
  onClose: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'male' | 'female'>('all');
  const [highlightedChar, setHighlightedChar] = useState<PlayableCharacter>(selectedCharacter);

  const filteredCharacters = PLAYABLE_CHARACTERS.filter((c) => {
    if (activeTab === 'male') return c.gender === 'male';
    if (activeTab === 'female') return c.gender === 'female';
    return true;
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Exit Button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-bold text-xl text-amber-300">
              Pilih Ksatria & Srikandi Flores (Kisah & Senjata Unik)
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Tab Controls (5 Cowok & 5 Cewek) */}
        <div className="flex items-center gap-2 mb-4 bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('all');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua (10)
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('male');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'male'
                ? 'bg-amber-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5 Ksatria Pria
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('female');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'female'
                ? 'bg-amber-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5 Srikandi Wanita
          </button>
        </div>

        {/* Main Content: Split Grid of Characters + Detailed Selected Inspector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto pr-1">
          {/* Characters Carousel / Grid (7 cols) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto p-1">
            {filteredCharacters.map((char) => {
              const isSelected = selectedCharacter.id === char.id;
              const isHighlighted = highlightedChar.id === char.id;

              return (
                <button
                  key={char.id}
                  onClick={() => {
                    sound.playUiClick();
                    setHighlightedChar(char);
                  }}
                  className={`group relative flex flex-col items-center p-2.5 rounded-xl border transition cursor-pointer text-left overflow-hidden ${
                    isHighlighted
                      ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-500/40'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-slate-950 border border-slate-700">
                    <img
                      src={char.portrait}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-slate-200 border border-white/20">
                      {char.gender === 'male' ? '♂ Pria' : '♀ Wanita'}
                    </span>
                    {isSelected && (
                      <span className="absolute bottom-1 left-1 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                        <Check className="w-2.5 h-2.5" /> Aktif
                      </span>
                    )}
                  </div>

                  <div className="w-full">
                    <h3 className="font-display font-bold text-xs text-slate-100 truncate">
                      {char.name}
                    </h3>
                    <p className="text-[10px] text-amber-300 truncate">
                      {char.weaponName}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Highlighted Character Details + Lore Story (5 cols) */}
          <div className="md:col-span-5 bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800 mb-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-400 bg-slate-950 shrink-0">
                  <img
                    src={highlightedChar.portrait}
                    alt={highlightedChar.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold text-base text-amber-200">
                      {highlightedChar.name}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      {highlightedChar.gender === 'male' ? 'Pria' : 'Wanita'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {highlightedChar.title}
                  </p>
                  <p className="text-[11px] text-amber-400 font-mono mt-0.5">
                    Senjata: {highlightedChar.weaponName}
                  </p>
                </div>
              </div>

              {/* Unique Lore Story */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kisah & Latar Belakang:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{highlightedChar.loreStory}"
                </p>
              </div>

              {/* Special Perk */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5 mb-3 text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Keistimewaan Adat:
                </span>
                <p className="text-[11px] text-slate-300 leading-tight">
                  {highlightedChar.specialPerk}
                </p>
              </div>

              {/* Stat Modifiers */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <div className="flex justify-between items-center bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-400" /> HP Bonus
                  </span>
                  <span className="text-red-300 font-bold">+{highlightedChar.statBonus.hp}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-sky-400" /> Mana Bonus
                  </span>
                  <span className="text-sky-300 font-bold">+{highlightedChar.statBonus.mana}</span>
                </div>
              </div>
            </div>

            {/* Select Action Button */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  sound.playLevelUp();
                  onSelectCharacter(highlightedChar);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <UserCheck className="w-4 h-4" />
                <span>Pilih & Mainkan Karakter Ini</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
