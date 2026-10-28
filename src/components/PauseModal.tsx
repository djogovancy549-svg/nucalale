import React from 'react';
import { Play, Volume2, VolumeX, RotateCcw, Compass, HelpCircle } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-4">
        {/* Title */}
        <div className="text-center pb-2 border-b border-white/10">
          <h2 className="font-display font-bold text-2xl text-amber-300">
            JEDA PERMAINAN
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Petualangan di Pulau Flores dihentikan sejenak
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 mt-2">
          <button
            onClick={() => {
              sound.playUiClick();
              onResume();
            }}
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Lanjutkan Petualangan</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl transition cursor-pointer text-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span>{isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              if (window.confirm('Mulai ulang petualangan dari awal?')) {
                onRestart();
              }
            }}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-slate-900 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-300 rounded-xl transition cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Mulai Ulang Game</span>
          </button>
        </div>

        {/* Controls Guide */}
        <div className="mt-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Petunjuk Kontrol:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <span>WASD / Panah</span>
            <span className="text-slate-300">Bergerak</span>
            <span>J / Spasi</span>
            <span className="text-slate-300">Tebasan Parang</span>
            <span>K</span>
            <span className="text-slate-300">Cambuk Caci</span>
            <span>Q</span>
            <span className="text-slate-300">Sihir Kelimutu</span>
            <span>Shift</span>
            <span className="text-slate-300">Hindar / Guling</span>
            <span>E</span>
            <span className="text-slate-300">Aksi / Dialog</span>
          </div>
        </div>
      </div>
    </div>
  );
};
