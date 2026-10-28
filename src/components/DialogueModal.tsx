import React from 'react';
import { MessageSquare, ArrowRight, X } from 'lucide-react';
import { DialogueNode } from '../types/game';
import { DIALOGUES_DATA } from '../data/gameData';
import { sound } from '../audio/soundEngine';

interface DialogueModalProps {
  dialogueId: string;
  onClose: () => void;
  onSelectOption: (action?: string, questId?: string, nextNodeId?: string) => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  dialogueId,
  onClose,
  onSelectOption,
}) => {
  const dialogue: DialogueNode = DIALOGUES_DATA[dialogueId] || {
    speaker: 'Penduduk Flores',
    title: 'Warga Lokal',
    portrait: 'elder',
    text: 'Semoga leluhur memberkahi perjalananmu di tanah Flores.',
    options: [{ text: 'Terima kasih.', action: 'close' }],
  };

  const getPortraitSrc = (p: string) => {
    if (p === 'elder' || p === 'weaver') {
      return '/src/assets/images/flores_rpg_mbaru_niang_1793202486660.jpg';
    }
    if (p === 'ranger' || p === 'spirit') {
      return '/src/assets/images/flores_rpg_komodo_dragon_1793202486887.jpg';
    }
    return '/src/assets/images/flores_rpg_warrior_portrait_1793202487152.jpg';
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playUiClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Portrait */}
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-amber-500/50 shrink-0 bg-slate-900 shadow-md">
            <img
              src={getPortraitSrc(dialogue.portrait)}
              alt={dialogue.speaker}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Dialogue Body */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h2 className="font-display font-bold text-lg text-amber-300">
                {dialogue.speaker}
              </h2>
              <span className="text-xs text-slate-400">· {dialogue.title}</span>
            </div>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed my-3 font-body bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              "{dialogue.text}"
            </p>

            {/* Options list */}
            <div className="flex flex-col gap-2 mt-4">
              {dialogue.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sound.playUiClick();
                    onSelectOption(opt.action, opt.questId, opt.nextNodeId);
                  }}
                  className="group flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-100 bg-slate-900 hover:bg-amber-950/40 border border-amber-500/30 hover:border-amber-400/80 rounded-xl transition cursor-pointer"
                >
                  <span>{opt.text}</span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
