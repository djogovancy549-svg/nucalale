/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { sound } from './audio/soundEngine';
import { 
  GameState, 
  PlayerStats, 
  RegionId, 
  Quest, 
  GameItem, 
  Enemy,
  PlayableCharacter 
} from './types/game';
import { INITIAL_PLAYER_STATS, INITIAL_ITEMS } from './data/gameData';
import { PLAYABLE_CHARACTERS } from './data/charactersData';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { DialogueModal } from './components/DialogueModal';
import { InventoryModal } from './components/InventoryModal';
import { QuestModal } from './components/QuestModal';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React State mirrors for UI HUD
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [selectedCharacter, setSelectedCharacter] = useState<PlayableCharacter>(PLAYABLE_CHARACTERS[0]);
  const [showCharacterSelect, setShowCharacterSelect] = useState<boolean>(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ ...INITIAL_PLAYER_STATS });
  const [currentRegion, setCurrentRegion] = useState<RegionId>('NAGEKEO');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [inventory, setInventory] = useState<GameItem[]>([...INITIAL_ITEMS]);
  const [activeDialogueId, setActiveDialogueId] = useState<string | null>(null);
  const [bossEnemy, setBossEnemy] = useState<Enemy | null>(null);
  const [magicCooldown, setMagicCooldown] = useState<number>(0);
  const [rollCooldown, setRollCooldown] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize Game Engine on Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    engine.inventory = [...INITIAL_ITEMS];
    engine.setCharacter(PLAYABLE_CHARACTERS[0]);

    // Connect callbacks
    engine.onStatsChange = (newStats) => {
      setPlayerStats({ ...newStats });
    };

    engine.onRegionChange = (newRegion) => {
      setCurrentRegion(newRegion);
      const boss = engine.enemies.find((e) => e.type === 'boss_siluman_dheke_kabora');
      setBossEnemy(boss || null);
    };

    engine.onQuestUpdate = (newQuests) => {
      setQuests([...newQuests]);
    };

    engine.onOpenDialogue = (dialogueId) => {
      setActiveDialogueId(dialogueId);
      engine.setGameState('DIALOGUE');
      setGameState('DIALOGUE');
    };

    engine.onGameStateChange = (newState) => {
      setGameState(newState);
    };

    // Cooldown poller for HUD
    const cdInterval = setInterval(() => {
      if (engineRef.current) {
        setMagicCooldown(Math.max(0, engineRef.current.skillCooldowns.magic));
        setRollCooldown(Math.max(0, engineRef.current.skillCooldowns.roll));
        const boss = engineRef.current.enemies.find((e) => e.type === 'boss_siluman_dheke_kabora');
        setBossEnemy(boss || null);
      }
    }, 100);

    engine.start();

    return () => {
      clearInterval(cdInterval);
      engine.stop();
    };
  }, []);

  // Keyboard Shortcuts for Menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'TITLE') return;

      if (e.code === 'Escape') {
        e.preventDefault();
        if (showCharacterSelect) {
          setShowCharacterSelect(false);
          return;
        }
        if (gameState === 'PLAYING') {
          engineRef.current?.setGameState('PAUSED');
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED' || gameState === 'INVENTORY' || gameState === 'QUEST_LOG' || gameState === 'DIALOGUE') {
          engineRef.current?.setGameState('PLAYING');
          setGameState('PLAYING');
          setActiveDialogueId(null);
        }
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setShowCharacterSelect((prev) => !prev);
      } else if (e.code === 'Tab' || e.code === 'KeyI') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          engineRef.current?.setGameState('INVENTORY');
          setGameState('INVENTORY');
        } else if (gameState === 'INVENTORY') {
          engineRef.current?.setGameState('PLAYING');
          setGameState('PLAYING');
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          engineRef.current?.setGameState('QUEST_LOG');
          setGameState('QUEST_LOG');
        } else if (gameState === 'QUEST_LOG') {
          engineRef.current?.setGameState('PLAYING');
          setGameState('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showCharacterSelect]);

  // Start Game handler
  const handleStartGame = useCallback(() => {
    sound.startAmbientMusic('NAGEKEO');
    if (engineRef.current) {
      engineRef.current.setGameState('PLAYING');
      setGameState('PLAYING');
      setQuests([...engineRef.current.quests]);
      setInventory([...engineRef.current.inventory]);
      setPlayerStats({ ...engineRef.current.playerStats });
    }
  }, []);

  // Select Character handler
  const handleSelectCharacter = (char: PlayableCharacter) => {
    setSelectedCharacter(char);
    if (engineRef.current) {
      engineRef.current.setCharacter(char);
    }
  };

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  // Dialogue option selection
  const handleDialogueOption = (action?: string, questId?: string, nextNodeId?: string) => {
    if (action === 'acceptQuest' && questId && engineRef.current) {
      const q = engineRef.current.quests.find((item) => item.id === questId);
      if (q && q.targetType === 'talk') {
        engineRef.current.completeQuest(q);
      }
    } else if (action === 'heal' && engineRef.current) {
      sound.playGongTone(260);
      engineRef.current.playerStats.hp = engineRef.current.playerStats.maxHp;
      engineRef.current.playerStats.mana = engineRef.current.playerStats.maxMana;
      engineRef.current.playerStats.stamina = engineRef.current.playerStats.maxStamina;
      setPlayerStats({ ...engineRef.current.playerStats });
      engineRef.current.addFloatingText('HP & Mana Pulih Sepenuhnya!', engineRef.current.player.x, engineRef.current.player.y - 40, '#22c55e');
    }

    if (nextNodeId) {
      setActiveDialogueId(nextNodeId);
    } else {
      setActiveDialogueId(null);
      engineRef.current?.setGameState('PLAYING');
      setGameState('PLAYING');
    }
  };

  // Item Use
  const handleUseItem = (itemId: string) => {
    if (engineRef.current) {
      engineRef.current.useQuickItem(itemId);
      setInventory([...engineRef.current.inventory]);
      setPlayerStats({ ...engineRef.current.playerStats });
    }
  };

  // Revive at shrine
  const handleRevive = () => {
    if (engineRef.current) {
      engineRef.current.loadRegion('NAGEKEO', 1300, 1100);
      engineRef.current.playerStats.hp = engineRef.current.playerStats.maxHp;
      engineRef.current.playerStats.mana = engineRef.current.playerStats.maxMana;
      engineRef.current.playerStats.stamina = engineRef.current.playerStats.maxStamina;
      setPlayerStats({ ...engineRef.current.playerStats });
      engineRef.current.setGameState('PLAYING');
      setGameState('PLAYING');
    }
  };

  // Restart entire game
  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.setCharacter(selectedCharacter);
      engineRef.current.inventory = [...INITIAL_ITEMS];
      engineRef.current.loadRegion('NAGEKEO');
      setInventory([...INITIAL_ITEMS]);
      engineRef.current.setGameState('PLAYING');
      setGameState('PLAYING');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-body">
      {/* 60fps Native Game Canvas Container */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <TitleScreen
          selectedCharacter={selectedCharacter}
          onOpenCharacterSelect={() => setShowCharacterSelect(true)}
          onStartGame={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Active Playing HUD */}
      {gameState !== 'TITLE' && (
        <HUD
          stats={playerStats}
          currentRegion={currentRegion}
          selectedCharacter={selectedCharacter}
          activeQuests={quests}
          bossEnemy={bossEnemy}
          magicCooldown={magicCooldown}
          rollCooldown={rollCooldown}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenInventory={() => {
            engineRef.current?.setGameState('INVENTORY');
            setGameState('INVENTORY');
          }}
          onOpenQuests={() => {
            engineRef.current?.setGameState('QUEST_LOG');
            setGameState('QUEST_LOG');
          }}
          onOpenCharacterSelect={() => setShowCharacterSelect(true)}
          onOpenPause={() => {
            engineRef.current?.setGameState('PAUSED');
            setGameState('PAUSED');
          }}
          onTriggerAttack={() => engineRef.current?.triggerParangAttack()}
          onTriggerWhip={() => engineRef.current?.triggerWhipAttack()}
          onTriggerMagic={() => engineRef.current?.triggerKelimutuMagic()}
          onTriggerRoll={() => engineRef.current?.triggerRoll()}
          onTriggerInteract={() => engineRef.current?.triggerInteract()}
          onUseItem={handleUseItem}
          onVirtualMove={(dx, dy) => engineRef.current?.setVirtualMovement(dx, dy)}
        />
      )}

      {/* 10 Playable Characters Selection Modal (5 Cowok, 5 Cewek) */}
      {showCharacterSelect && (
        <CharacterSelectModal
          selectedCharacter={selectedCharacter}
          onSelectCharacter={handleSelectCharacter}
          onClose={() => setShowCharacterSelect(false)}
        />
      )}

      {/* Modals & Sub-states */}
      {gameState === 'DIALOGUE' && activeDialogueId && (
        <DialogueModal
          dialogueId={activeDialogueId}
          onClose={() => {
            setActiveDialogueId(null);
            engineRef.current?.setGameState('PLAYING');
            setGameState('PLAYING');
          }}
          onSelectOption={handleDialogueOption}
        />
      )}

      {gameState === 'INVENTORY' && (
        <InventoryModal
          stats={playerStats}
          items={inventory}
          onClose={() => {
            engineRef.current?.setGameState('PLAYING');
            setGameState('PLAYING');
          }}
          onUseItem={handleUseItem}
        />
      )}

      {gameState === 'QUEST_LOG' && (
        <QuestModal
          quests={quests}
          onClose={() => {
            engineRef.current?.setGameState('PLAYING');
            setGameState('PLAYING');
          }}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => {
            engineRef.current?.setGameState('PLAYING');
            setGameState('PLAYING');
          }}
          onRestart={handleRestart}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'VICTORY' && (
        <VictoryModal
          stats={playerStats}
          onContinue={() => {
            engineRef.current?.setGameState('PLAYING');
            setGameState('PLAYING');
          }}
          onRestart={handleRestart}
        />
      )}

      {gameState === 'GAME_OVER' && (
        <GameOverModal
          onRevive={handleRevive}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
