import React, { useState } from 'react';
import { Users, X, Check, Shield, Sword, Heart, Flame, Zap, BookOpen, LogOut, Award, Sparkles, Volume2 } from 'lucide-react';
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Fighter': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Assassin': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'Marksman': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'Mage': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'Tank': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Mythic Hero': return 'from-amber-500 to-yellow-300 text-slate-950 font-black';
      case 'Legendary Hero': return 'from-purple-600 to-pink-500 text-white font-bold';
      default: return 'from-blue-600 to-indigo-500 text-white font-bold';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-5 bg-black/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-5xl bg-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[94vh] bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        
        {/* Top Header with MOBA Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 tracking-wider">
                PEMILIHAN PAHLAWAN FLORES (MOBA EDITION)
              </h2>
              <p className="text-xs text-slate-400">
                Pilih dari 10 Ksatria & Srikandi legendaris Nagekeo, Ende, dan Kelimutu dengan kemampuan bertarung tingkat tinggi.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-red-950/90 hover:bg-red-900 border border-red-500/60 text-red-200 rounded-xl transition cursor-pointer shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Tab Controls (Semua / 5 Pria / 5 Wanita) */}
        <div className="flex items-center gap-2 mb-4 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('all');
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Pahlawan (10)
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('male');
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'male'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ♂ 5 Ksatria Pria
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('female');
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'female'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ♀ 5 Srikandi Wanita
          </button>
        </div>

        {/* Main Grid: Heroes Grid (7 Cols) + Inspector (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto pr-1">
          
          {/* Heroes Selection Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-1.5">
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
                  className={`group relative flex flex-col items-center p-2 rounded-xl border-2 transition cursor-pointer text-left overflow-hidden bg-slate-900/90 ${
                    isHighlighted
                      ? 'border-amber-400 bg-gradient-to-b from-amber-950/70 to-slate-900 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20 scale-[1.02]'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {/* Portrait & Role Tag */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-slate-950 border border-slate-700 shadow-inner">
                    <img
                      src={char.portrait}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Role Badge */}
                    <span className={`absolute top-1 left-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase backdrop-blur-sm ${getRoleColor(char.role)}`}>
                      {char.role}
                    </span>

                    {/* Gender Tag */}
                    <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-slate-200 border border-white/20">
                      {char.gender === 'male' ? '♂' : '♀'}
                    </span>

                    {isSelected && (
                      <span className="absolute bottom-1 inset-x-1 flex items-center justify-center gap-1 text-[10px] font-black py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow">
                        <Check className="w-3 h-3 stroke-[3]" /> AKTIF DIPAKAI
                      </span>
                    )}
                  </div>

                  <div className="w-full px-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-xs text-slate-100 truncate">
                        {char.name}
                      </h3>
                    </div>
                    <p className="text-[10px] text-amber-400/90 truncate font-mono">
                      {char.weaponName}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Inspector Panel (MOBA Style) */}
          <div className="lg:col-span-5 bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div>
              {/* Header Info */}
              <div className="flex items-center gap-3.5 pb-3 border-b border-slate-800 mb-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-400 bg-slate-950 shrink-0 shadow-lg">
                  <img
                    src={highlightedChar.portrait}
                    alt={highlightedChar.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className={`absolute bottom-0 inset-x-0 text-[8px] text-center font-black uppercase py-0.5 bg-gradient-to-r ${getTierColor(highlightedChar.tier)}`}>
                    {highlightedChar.tier}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-display font-black text-base text-amber-200">
                      {highlightedChar.name}
                    </h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold border uppercase ${getRoleColor(highlightedChar.role)}`}>
                      {highlightedChar.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    {highlightedChar.title}
                  </p>
                  <p className="text-[11px] text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                    <Sword className="w-3 h-3" /> Senjata: {highlightedChar.weaponName}
                  </p>
                </div>
              </div>

              {/* Voice Quote */}
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 mb-3 flex items-start gap-2">
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 italic font-medium leading-relaxed">
                  "{highlightedChar.battleQuote}"
                </p>
              </div>

              {/* Stats Bars (MOBA Style) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Award className="w-3.5 h-3.5" /> Statistik Tempur Pahlawan
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Skala 100</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Attack */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400">Serangan (Attack)</span>
                      <span className="text-amber-400 font-bold">{highlightedChar.statsBar.attack}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-600 to-yellow-400 h-full rounded-full" style={{ width: `${highlightedChar.statsBar.attack}%` }}></div>
                    </div>
                  </div>

                  {/* Durability */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400">Ketahanan (Durability)</span>
                      <span className="text-emerald-400 font-bold">{highlightedChar.statsBar.durability}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full" style={{ width: `${highlightedChar.statsBar.durability}%` }}></div>
                    </div>
                  </div>

                  {/* Skill Effect */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400">Efek Skill (Skill Effect)</span>
                      <span className="text-purple-400 font-bold">{highlightedChar.statsBar.skillEffect}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-400 h-full rounded-full" style={{ width: `${highlightedChar.statsBar.skillEffect}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Perk */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5 mb-3 text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Pasif & Keistimewaan Adat:
                </span>
                <p className="text-[11px] text-slate-300 leading-tight">
                  {highlightedChar.specialPerk}
                </p>
              </div>
            </div>

            {/* Select Action Button */}
            <div className="mt-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  sound.playLevelUp();
                  onSelectCharacter(highlightedChar);
                  onClose();
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xl tracking-wide uppercase"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Pilih & Gunakan Ksatria Ini</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
