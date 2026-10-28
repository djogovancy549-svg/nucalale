import React from 'react';
import { Skull, RotateCcw, Heart } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface GameOverModalProps {
  onRevive: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  onRevive,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-slate-950 border border-red-600/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-center text-slate-100 flex flex-col items-center">
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(239,68,68,0.4)]">
          <Skull className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-red-500">
          KSATRIA TERGUGUR
        </h2>
        <p className="text-xs uppercase tracking-widest text-slate-400 mt-1 mb-4">
          Hawa Liar Tanah Flores Menguasaimu
        </p>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Jangan menyerah! Berdoalah di mata air leluhur Mbaru Niang untuk bangkit kembali dan menuntaskan takdirmu di Pulau Flores.
        </p>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              sound.playUiClick();
              onRevive();
            }}
            className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>Bangkit di Mata Air Suci</span>
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              onRestart();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Mulai Ulang dari Awal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
