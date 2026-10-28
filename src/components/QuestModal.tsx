import React from 'react';
import { Scroll, X, CheckCircle2, Circle, Award, BookOpen } from 'lucide-react';
import { Quest } from '../types/game';
import { sound } from '../audio/soundEngine';

interface QuestModalProps {
  quests: Quest[];
  onClose: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ quests, onClose }) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-emerald-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <Scroll className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display font-bold text-xl text-emerald-300">
              Buku Catatan Pengembaraan Flores
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

        {/* Quest List */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {quests.map((q) => (
            <div
              key={q.id}
              className={`p-4 rounded-xl border transition ${
                q.completed
                  ? 'bg-slate-900/40 border-slate-800 opacity-75'
                  : 'bg-slate-900/90 border-emerald-500/30 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  {q.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <h3 className={`font-semibold text-sm ${q.completed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                    {q.title}
                  </h3>
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  {q.region}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-2.5 pl-6">
                {q.description}
              </p>

              {/* Progress & Rewards */}
              <div className="flex items-center justify-between pl-6 text-xs border-t border-slate-800/80 pt-2">
                <div className="flex items-center gap-3 text-slate-400">
                  {q.targetType === 'defeat' && (
                    <span className="font-mono text-amber-300 font-semibold tabular-nums">
                      Tumbang: {q.currentCount}/{q.targetCount}
                    </span>
                  )}
                  {q.completed && <span className="text-emerald-400 font-medium">Telah Selesai</span>}
                </div>

                <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px]">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{q.rewardExp} EXP</span>
                  <span>+{q.rewardGold} Koin</span>
                </div>
              </div>
            </div>
          ))}

          {/* Flores Cultural Lore Footer */}
          <div className="mt-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-300">Catatan Adat:</strong> Tradisi tarian perang Caci dan tenun Songke di Manggarai adalah lambang kearifan luhur untuk menjaga keharmonisan alam, manusia, dan Sang Pencipta (Mori Kraeng).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
