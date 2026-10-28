import React from 'react';
import { Trophy, Award, RotateCcw, Compass, Sparkles } from 'lucide-react';
import { PlayerStats } from '../types/game';
import { sound } from '../audio/soundEngine';

interface VictoryModalProps {
  stats: PlayerStats;
  onContinue: () => void;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onContinue,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-xl bg-slate-950 border border-amber-500/60 rounded-3xl shadow-2xl p-6 sm:p-8 text-center text-slate-100 flex flex-col items-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Victory Icon */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
          KEDAMAIAN FLORES PULIH!
        </h2>
        <p className="font-display text-sm tracking-widest uppercase text-amber-300 mt-1 mb-4">
          Sang Ksatria Tanah Nuca Lale
        </p>

        <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto mb-6">
          Dengan keberanian menaklukkan kawah sakral Kelimutu, ketiga danau purba kembali memancarkan sinar suci tiga warna. 
          Leluhur Manggarai dan rakyat Flores menyematkan gelar pahlawan abadi untukmu!
        </p>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md p-4 bg-slate-900/90 border border-slate-800 rounded-2xl mb-6">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400">Tingkat Akhir</span>
            <span className="text-xl font-bold font-mono text-amber-300 tabular-nums">Lv.{stats.level}</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-[11px] text-slate-400">Total Koin Adat</span>
            <span className="text-xl font-bold font-mono text-yellow-400 tabular-nums">{stats.gold}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400">Daya Serang</span>
            <span className="text-xl font-bold font-mono text-red-400 tabular-nums">{stats.attack}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button
            onClick={() => {
              sound.playUiClick();
              onContinue();
            }}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Lanjut Jelajahi Flores</span>
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              onRestart();
            }}
            className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Mulai Petualangan Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
