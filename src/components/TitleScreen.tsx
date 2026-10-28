import React, { useEffect } from 'react';
import { Volume2, VolumeX, Play, Shield, Compass, Sparkles, Users } from 'lucide-react';
import { PlayableCharacter } from '../types/game';
import { sound } from '../audio/soundEngine';

interface TitleScreenProps {
  selectedCharacter: PlayableCharacter;
  onOpenCharacterSelect: () => void;
  onStartGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedCharacter,
  onOpenCharacterSelect,
  onStartGame,
  isMuted,
  onToggleMute,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        onOpenCharacterSelect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, onOpenCharacterSelect]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Background Hero Artwork */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/flores_rpg_hero_landscape_1793202486242.jpg"
          alt="Lansekap Danau Tiga Warna Kelimutu dan Kampung Wae Rebo Flores"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105 animate-pulse duration-[12000ms]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-slate-950/65 to-black/40" />
      </div>

      {/* Top Bar Navigation */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
          <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
            Nusa Tenggara Timur · Nagekeo & Flores
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-200 bg-black/40 hover:bg-black/60 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Suara Mati' : 'Audio Aktif'}</span>
          </button>
        </div>
      </header>

      {/* Hero Centerpiece & Inline SVG Title Lockup */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
        {/* Custom SVG Flores Cultural Emblem */}
        <div className="mb-3">
          <svg className="w-16 h-16 md:w-20 md:h-20 text-amber-400 mx-auto filter drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="44" strokeWidth="2" strokeDasharray="4 2" />
            <polygon points="50,12 85,75 15,75" strokeWidth="2.5" />
            <polygon points="50,88 15,25 85,25" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="10" fill="currentColor" fillOpacity="0.4" strokeWidth="2" />
            <line x1="50" y1="20" x2="50" y2="80" strokeWidth="2" />
            <line x1="20" y1="50" x2="80" y2="50" strokeWidth="2" />
          </svg>
        </div>

        {/* Title Lockup */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-md">
          NUCA LALE
        </h1>
        <p className="font-display text-lg sm:text-2xl tracking-[0.25em] uppercase text-amber-200/90 mt-1 mb-2">
          Legenda Siluman Nagekeo
        </p>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed text-wrap balance mb-6">
          Kutukan Siluman Ata Polo dan Raja Siluman Dheke Kabora mengancam ketenteraman Pulau Flores. 
          Pilihlah salah satu dari 10 Ksatria & Srikandi pilihan rakyat Nagekeo untuk mengembalikan kedamaian tanah leluhur!
        </p>

        {/* Active Character Quick Preview Card */}
        <div className="flex items-center gap-3 bg-black/60 border border-amber-500/40 p-2.5 rounded-2xl mb-6 shadow-xl max-w-sm w-full mx-auto">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-400 shrink-0">
            <img
              src={selectedCharacter.portrait}
              alt={selectedCharacter.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 right-0 bg-amber-500 px-1 text-[9px] font-bold text-slate-950 font-mono">
              Lv.1
            </div>
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs text-amber-200">{selectedCharacter.name}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                {selectedCharacter.gender === 'male' ? '♂ Pria' : '♀ Wanita'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">{selectedCharacter.title}</p>
          </div>
          <button
            onClick={() => {
              sound.playUiClick();
              onOpenCharacterSelect();
            }}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Ganti
          </button>
        </div>

        {/* Action Button & Shortcuts */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <button
            onClick={() => {
              sound.playUiClick();
              onStartGame();
            }}
            className="w-full sm:w-auto flex-1 group flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-base rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Mulai Petualangan</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onOpenCharacterSelect();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/50 text-amber-300 rounded-xl transition cursor-pointer text-sm font-semibold"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Pilih Karakter (10)</span>
          </button>
        </div>

        {/* 4 Iconic Regions Badge Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-8 max-w-2xl w-full text-[11px]">
          <div className="p-2 rounded-lg bg-black/50 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 justify-center">
            <Compass className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>01. Wae Rebo & Nagekeo</span>
          </div>
          <div className="p-2 rounded-lg bg-black/50 border border-sky-500/30 text-sky-300 flex items-center gap-1.5 justify-center">
            <Shield className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            <span>02. Gua Wolowea</span>
          </div>
          <div className="p-2 rounded-lg bg-black/50 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>03. Savana Danga & Bajo</span>
          </div>
          <div className="p-2 rounded-lg bg-black/50 border border-red-500/30 text-red-300 flex items-center gap-1.5 justify-center">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span>04. Kawah Ebulobo & Kelimutu</span>
          </div>
        </div>
      </main>

      {/* Control Hint Line */}
      <footer className="relative z-10 py-3 px-6 border-t border-white/10 bg-black/75 text-center text-xs text-slate-400 font-mono">
        <p className="truncate">
          WASD Bergerak · J/Spasi Serang · K Cambuk Caci · Q Sihir Kelimutu · Shift Hindar · E Interaksi · C Pilih Karakter · Tab Tas · Esc Jeda
        </p>
      </footer>
    </div>
  );
};
