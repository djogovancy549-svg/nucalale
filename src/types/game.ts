export type GameState = 
  | 'TITLE'
  | 'CHARACTER_SELECT'
  | 'PLAYING'
  | 'DIALOGUE'
  | 'INVENTORY'
  | 'QUEST_LOG'
  | 'PAUSED'
  | 'VICTORY'
  | 'GAME_OVER';

export type RegionId = 'NAGEKEO' | 'GERO' | 'MULAKOLI' | 'ENDE' | 'MAUMERE' | 'KELIMUTU';

export interface RegionInfo {
  id: RegionId;
  name: string;
  subtitle: string;
  description: string;
  themeColor: string;
  ambientType: 'mist' | 'cave' | 'coastal' | 'volcanic';
  recommendedLevel: number;
}

export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'quest' | 'material';

export interface GameItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  icon: string;
  value: number;
  attackBonus?: number;
  defenseBonus?: number;
  hpRestore?: number;
  manaRestore?: number;
  staminaRestore?: number;
  speedBonus?: number;
  equipped?: boolean;
}

export interface PlayerStats {
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  attack: number;
  defense: number;
  speed: number;
  gold: number;
  whipSkillLevel: number;
  kelimutuAttunement: 'none' | 'ice' | 'nature' | 'magma';
}

export interface PlayableCharacter {
  id: string;
  name: string;
  title: string;
  gender: 'male' | 'female';
  portrait: string;
  weaponType: 'parang' | 'whip' | 'spear' | 'magic';
  weaponName: string;
  description: string;
  loreStory: string;
  specialPerk: string;
  role: 'Fighter' | 'Assassin' | 'Marksman' | 'Mage' | 'Tank';
  tier: 'Mythic Hero' | 'Epic Hero' | 'Legendary Hero';
  statsBar: {
    attack: number;
    durability: number;
    skillEffect: number;
    difficulty: number;
  };
  battleQuote: string;
  statBonus: {
    hp: number;
    mana: number;
    attack: number;
    defense: number;
    speed: number;
  };
  visualTheme: {
    hairColor: string;
    clothColor: string;
    accentColor: string;
    headbandColor: string;
  };
}

export interface Quest {
  id: string;
  title: string;
  region: RegionId;
  description: string;
  targetCount: number;
  currentCount: number;
  targetType: 'talk' | 'defeat' | 'collect' | 'boss';
  targetName: string;
  completed: boolean;
  rewardExp: number;
  rewardGold: number;
  rewardItem?: GameItem;
}

export interface DialogueNode {
  speaker: string;
  title: string;
  portrait: string;
  text: string;
  options?: {
    text: string;
    action?: 'acceptQuest' | 'completeQuest' | 'heal' | 'openShop' | 'close';
    questId?: string;
    nextNodeId?: string;
  }[];
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
  type?: 'spark' | 'smoke' | 'leaf' | 'ember' | 'water' | 'trail' | 'blood' | 'afterimage';
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  fromPlayer: boolean;
  life: number;
  spellType?: 'parang' | 'whip' | 'fire' | 'ice' | 'nature' | 'spear';
}

export type EnemyType = 
  | 'siluman_ata_polo' 
  | 'siluman_ine_bua' 
  | 'siluman_jara_gena' 
  | 'siluman_bido_wolowea' 
  | 'siluman_embu_golo' 
  | 'boss_siluman_dheke_kabora';

export interface Enemy {
  id: number;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  aggroRadius: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  isWindup: boolean;
  windupTimer: number;
  windupDuration: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';
  facing: 'left' | 'right' | 'up' | 'down';
  size: number;
  expReward: number;
  goldReward: number;
  dropItemId?: string;
  hitFlashTimer: number;
  animFrame?: number;
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  region: RegionId;
  x: number;
  y: number;
  facing: 'left' | 'right' | 'up' | 'down';
  dialogueId: string;
  portrait: string;
  hasQuestNotification?: boolean;
}

export interface InteractiveProp {
  id: string;
  type: 'chest' | 'shrine' | 'portal' | 'lore_stone';
  name: string;
  x: number;
  y: number;
  radius: number;
  opened?: boolean;
  targetRegion?: RegionId;
  contentItemId?: string;
  loreText?: string;
}
