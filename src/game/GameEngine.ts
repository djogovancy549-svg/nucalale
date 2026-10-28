import { 
  GameState, 
  RegionId, 
  PlayerStats, 
  Enemy, 
  NPC, 
  InteractiveProp, 
  Particle, 
  Projectile, 
  FloatingText,
  Quest,
  GameItem,
  PlayableCharacter
} from '../types/game';
import { REGIONS_DATA, INITIAL_PLAYER_STATS, INITIAL_QUESTS, ALL_DATABASE_ITEMS } from '../data/gameData';
import { PLAYABLE_CHARACTERS } from '../data/charactersData';
import { sound } from '../audio/soundEngine';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public width: number = 1200;
  public height: number = 800;
  public worldWidth: number = 2600;
  public worldHeight: number = 2000;

  public camera = { x: 0, y: 0 };
  private cameraShake = 0;

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private hitstopTimer: number = 0;
  private animFrameId: number | null = null;

  public currentRegion: RegionId = 'NAGEKEO';
  public gameState: GameState = 'TITLE';
  public playerStats: PlayerStats = { ...INITIAL_PLAYER_STATS };
  public quests: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
  public inventory: GameItem[] = [];
  public selectedCharacter: PlayableCharacter = PLAYABLE_CHARACTERS[0];

  public player = {
    x: 1300,
    y: 1100,
    vx: 0,
    vy: 0,
    radius: 22,
    facing: 'down' as 'left' | 'right' | 'up' | 'down',
    isMoving: false,
    isAttacking: false,
    attackTimer: 0,
    attackDuration: 0.22,
    attackType: 'parang' as 'parang' | 'whip' | 'spear' | 'magic',
    attackComboStep: 0,
    isRolling: false,
    rollTimer: 0,
    rollDuration: 0.28,
    rollAngle: 0,
    rollCooldown: 0,
    invincibleTimer: 0,
    walkFrame: 0,
    walkTimer: 0,
    breatheTimer: 0,
    ribbonWave: 0,
    auraPulse: 0,
  };

  public enemies: Enemy[] = [];
  public npcs: NPC[] = [];
  public props: InteractiveProp[] = [];
  public particles: Particle[] = [];
  public projectiles: Projectile[] = [];
  public floatingTexts: FloatingText[] = [];

  public skillCooldowns = {
    parang: 0,
    whip: 0,
    magic: 0,
    roll: 0,
  };

  private keysHeld: Record<string, boolean> = {};
  public virtualInput = { dx: 0, dy: 0 };

  public onStatsChange?: (stats: PlayerStats) => void;
  public onRegionChange?: (region: RegionId) => void;
  public onQuestUpdate?: (quests: Quest[]) => void;
  public onOpenDialogue?: (dialogueId: string) => void;
  public onGameStateChange?: (state: GameState) => void;

  private ambientTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindInputs();
  }

  public setCharacter(char: PlayableCharacter) {
    this.selectedCharacter = char;
    this.player.attackType = char.weaponType;
    
    this.playerStats.maxHp = INITIAL_PLAYER_STATS.maxHp + char.statBonus.hp;
    this.playerStats.hp = this.playerStats.maxHp;
    this.playerStats.maxMana = INITIAL_PLAYER_STATS.maxMana + char.statBonus.mana;
    this.playerStats.mana = this.playerStats.maxMana;
    this.playerStats.attack = INITIAL_PLAYER_STATS.attack + char.statBonus.attack;
    this.playerStats.defense = INITIAL_PLAYER_STATS.defense + char.statBonus.defense;
    this.playerStats.speed = INITIAL_PLAYER_STATS.speed + char.statBonus.speed;

    if (this.onStatsChange) {
      this.onStatsChange(this.playerStats);
    }
  }

  public resize() {
    this.width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.height = this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  private bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.keysHeld[e.code] = true;
      this.keysHeld[e.key.toLowerCase()] = true;

      if (this.gameState === 'PLAYING') {
        if (e.code === 'KeyJ' || e.code === 'Space') {
          this.triggerParangAttack();
        } else if (e.code === 'KeyK') {
          this.triggerWhipAttack();
        } else if (e.code === 'KeyQ') {
          this.triggerKelimutuMagic();
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          this.triggerRoll();
        } else if (e.code === 'KeyE') {
          this.triggerInteract();
        } else if (e.code === 'Digit1') {
          this.useQuickItem('madu_flores');
        } else if (e.code === 'Digit2') {
          this.useQuickItem('kopi_bajawa');
        } else if (e.code === 'Digit3') {
          this.useQuickItem('jagung_bose');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld[e.code] = false;
      this.keysHeld[e.key.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      this.keysHeld = {};
    });
  }

  public setVirtualMovement(dx: number, dy: number) {
    this.virtualInput.dx = dx;
    this.virtualInput.dy = dy;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loadRegion(this.currentRegion);
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public setGameState(state: GameState) {
    this.gameState = state;
    if (this.onGameStateChange) {
      this.onGameStateChange(state);
    }
  }

  // Region Loading: Nagekeo -> Ende -> Maumere -> Kelimutu
  public loadRegion(regionId: RegionId, spawnX?: number, spawnY?: number) {
    this.currentRegion = regionId;
    this.enemies = [];
    this.npcs = [];
    this.props = [];
    this.projectiles = [];
    this.particles = [];

    sound.switchRegionMusic(regionId);

    if (regionId === 'NAGEKEO') {
      this.worldWidth = 2600;
      this.worldHeight = 2000;
      this.player.x = spawnX ?? 1300;
      this.player.y = spawnY ?? 1100;

      // NPCs
      this.npcs.push({
        id: 'npc_nagekeo',
        name: 'Tetua Kraeng Nagekeo',
        title: 'Pemimpin Adat Nagekeo',
        region: 'NAGEKEO',
        x: 1300,
        y: 950,
        facing: 'down',
        dialogueId: 'elder_nagekeo',
        portrait: 'elder',
        hasQuestNotification: true,
      });

      // Props: Megalith altar & Portals
      this.props.push({
        id: 'shrine_nagekeo',
        type: 'shrine',
        name: 'Mata Air Sakral Megalit Nagekeo',
        x: 1550,
        y: 1000,
        radius: 35,
      });

      this.props.push({
        id: 'chest_nagekeo',
        type: 'chest',
        name: 'Peti Pusaka Nagekeo',
        x: 950,
        y: 900,
        radius: 25,
        contentItemId: 'kopi_bajawa',
      });

      this.props.push({
        id: 'portal_to_ende',
        type: 'portal',
        name: 'Jalur Menuju Tanah Ende',
        x: 2400,
        y: 1000,
        radius: 50,
        targetRegion: 'ENDE',
      });

      // Spawn Siluman Ata Polo
      for (let i = 0; i < 5; i++) {
        this.spawnEnemy('siluman_ata_polo', 600 + Math.random() * 800, 1300 + Math.random() * 500);
      }
      this.spawnEnemy('siluman_ine_bua', 900, 1600);
    } else if (regionId === 'ENDE') {
      this.worldWidth = 2400;
      this.worldHeight = 1800;
      this.player.x = spawnX ?? 300;
      this.player.y = spawnY ?? 900;

      this.npcs.push({
        id: 'npc_weaver_ende',
        name: 'Mama Maria Ende',
        title: 'Maestro Tenun Ende',
        region: 'ENDE',
        x: 800,
        y: 700,
        facing: 'down',
        dialogueId: 'weaver_ende',
        portrait: 'weaver',
      });

      this.props.push({
        id: 'portal_back_nagekeo',
        type: 'portal',
        name: 'Kembali ke Nagekeo',
        x: 200,
        y: 900,
        radius: 45,
        targetRegion: 'NAGEKEO',
      });

      this.props.push({
        id: 'portal_to_maumere',
        type: 'portal',
        name: 'Menuju Teluk & Savana Maumere',
        x: 2200,
        y: 900,
        radius: 50,
        targetRegion: 'MAUMERE',
      });

      this.props.push({
        id: 'chest_ende',
        type: 'chest',
        name: 'Peti Karst Ende',
        x: 1600,
        y: 500,
        radius: 25,
        contentItemId: 'kristal_liang_bua',
      });

      // Spawn Siluman Bido Wolowea & Embu Golo
      for (let i = 0; i < 5; i++) {
        this.spawnEnemy('siluman_bido_wolowea', 700 + Math.random() * 800, 600 + Math.random() * 600);
      }
      for (let i = 0; i < 3; i++) {
        this.spawnEnemy('siluman_embu_golo', 1300 + Math.random() * 600, 600 + Math.random() * 600);
      }
    } else if (regionId === 'MAUMERE') {
      this.worldWidth = 2600;
      this.worldHeight = 1900;
      this.player.x = spawnX ?? 400;
      this.player.y = spawnY ?? 1000;

      this.npcs.push({
        id: 'npc_sailor_maumere',
        name: 'Daeng Maumere',
        title: 'Nahkoda Teluk Maumere',
        region: 'MAUMERE',
        x: 800,
        y: 1100,
        facing: 'down',
        dialogueId: 'sailor_maumere',
        portrait: 'sailor',
        hasQuestNotification: true,
      });

      this.props.push({
        id: 'portal_back_ende',
        type: 'portal',
        name: 'Kembali ke Ende',
        x: 200,
        y: 1000,
        radius: 45,
        targetRegion: 'ENDE',
      });

      this.props.push({
        id: 'portal_to_kelimutu',
        type: 'portal',
        name: 'Menuju Puncak Kawah Kelimutu',
        x: 2400,
        y: 1100,
        radius: 50,
        targetRegion: 'KELIMUTU',
      });

      // Spawn Siluman Jara Gena
      for (let i = 0; i < 6; i++) {
        this.spawnEnemy('siluman_jara_gena', 1100 + Math.random() * 800, 1000 + Math.random() * 500);
      }
    } else if (regionId === 'KELIMUTU') {
      this.worldWidth = 2400;
      this.worldHeight = 2200;
      this.player.x = spawnX ?? 1200;
      this.player.y = spawnY ?? 1900;

      this.npcs.push({
        id: 'spirit_kelimutu_npc',
        name: 'Roh Penjaga Tiga Warna',
        title: 'Roh Sakral Kelimutu',
        region: 'KELIMUTU',
        x: 1200,
        y: 1650,
        facing: 'down',
        dialogueId: 'spirit_kelimutu',
        portrait: 'spirit',
        hasQuestNotification: true,
      });

      this.props.push({
        id: 'portal_back_maumere',
        type: 'portal',
        name: 'Kembali ke Maumere',
        x: 1200,
        y: 2100,
        radius: 50,
        targetRegion: 'MAUMERE',
      });

      this.props.push({
        id: 'chest_kelimutu_epic',
        type: 'chest',
        name: 'Peti Magma Kelimutu',
        x: 1600,
        y: 700,
        radius: 28,
        contentItemId: 'parang_naga_komodo',
      });

      // Boss: Raja Siluman Dheke Kabora
      this.spawnBoss(1200, 750);
    }

    if (this.onRegionChange) {
      this.onRegionChange(regionId);
    }
  }

  private spawnEnemy(type: Enemy['type'], x: number, y: number) {
    let name = 'Siluman Ata Polo';
    let hp = 85;
    let attack = 19;
    let defense = 5;
    let speed = 3.3;
    let size = 25;
    let expReward = 35;
    let goldReward = 18;
    let dropItemId: string | undefined = undefined;

    if (type === 'siluman_ata_polo') {
      name = 'Siluman Ata Polo';
      hp = 95;
      attack = 20;
      defense = 6;
      speed = 3.4;
      size = 25;
      expReward = 38;
      goldReward = 20;
      dropItemId = 'madu_flores';
    } else if (type === 'siluman_ine_bua') {
      name = 'Siluman Ine Bu\'a';
      hp = 125;
      attack = 25;
      defense = 8;
      speed = 2.8;
      size = 24;
      expReward = 55;
      goldReward = 32;
      dropItemId = 'kopi_bajawa';
    } else if (type === 'siluman_bido_wolowea') {
      name = 'Siluman Bido Wolowea';
      hp = 115;
      attack = 23;
      defense = 8;
      speed = 3.7;
      size = 22;
      expReward = 48;
      goldReward = 26;
      dropItemId = 'kristal_liang_bua';
    } else if (type === 'siluman_embu_golo') {
      name = 'Siluman Embu Golo';
      hp = 190;
      attack = 32;
      defense = 16;
      speed = 2.3;
      size = 35;
      expReward = 80;
      goldReward = 48;
      dropItemId = 'madu_flores';
    } else if (type === 'siluman_jara_gena') {
      name = 'Siluman Jara Gena';
      hp = 175;
      attack = 36;
      defense = 12;
      speed = 3.9;
      size = 32;
      expReward = 90;
      goldReward = 55;
      dropItemId = 'kalung_taring_komodo';
    }

    const enemy: Enemy = {
      id: Math.floor(Math.random() * 1000000),
      type,
      name,
      x,
      y,
      vx: 0,
      vy: 0,
      hp,
      maxHp: hp,
      attack,
      defense,
      speed,
      aggroRadius: 310,
      attackRange: size + 28,
      attackCooldown: 1.3,
      attackTimer: 0,
      isWindup: false,
      windupTimer: 0,
      windupDuration: 0.4,
      state: 'patrol',
      facing: 'down',
      size,
      expReward,
      goldReward,
      dropItemId,
      hitFlashTimer: 0,
      animFrame: 0,
    };

    this.enemies.push(enemy);
  }

  private spawnBoss(x: number, y: number) {
    const boss: Enemy = {
      id: 99999,
      type: 'boss_siluman_dheke_kabora',
      name: 'Raja Siluman Dheke Kabora (Tanduk Emas)',
      x,
      y,
      vx: 0,
      vy: 0,
      hp: 1400,
      maxHp: 1400,
      attack: 55,
      defense: 28,
      speed: 2.7,
      aggroRadius: 700,
      attackRange: 90,
      attackCooldown: 1.7,
      attackTimer: 0,
      isWindup: false,
      windupTimer: 0,
      windupDuration: 0.55,
      state: 'idle',
      facing: 'down',
      size: 60,
      expReward: 800,
      goldReward: 600,
      dropItemId: 'sisik_ora_emas',
      hitFlashTimer: 0,
      animFrame: 0,
    };
    this.enemies.push(boss);
  }

  // Combat Triggers
  public triggerParangAttack() {
    if (this.player.isAttacking || this.player.isRolling) return;
    if (this.playerStats.stamina < 10) return;

    this.playerStats.stamina -= 10;
    this.player.isAttacking = true;
    this.player.attackTimer = this.player.attackDuration;
    this.player.attackComboStep = (this.player.attackComboStep + 1) % 3;

    sound.playAttackSlash();

    const reach = 75;
    const { dirX, dirY } = this.getFacingVector(this.player.facing);
    const attackCenterX = this.player.x + dirX * reach;
    const attackCenterY = this.player.y + dirY * reach;

    this.applyMeleeDamage(attackCenterX, attackCenterY, reach, this.playerStats.attack * (1 + this.player.attackComboStep * 0.3), 'parang');

    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: attackCenterX + (Math.random() - 0.5) * 40,
        y: attackCenterY + (Math.random() - 0.5) * 40,
        vx: dirX * 160 + (Math.random() - 0.5) * 70,
        vy: dirY * 160 + (Math.random() - 0.5) * 70,
        life: 0.22,
        maxLife: 0.22,
        color: this.selectedCharacter.visualTheme.accentColor,
        size: 4 + Math.random() * 3,
        decay: 1,
        type: 'spark',
      });
    }

    if (this.onStatsChange) this.onStatsChange(this.playerStats);
  }

  public triggerWhipAttack() {
    if (this.player.isAttacking || this.player.isRolling) return;
    if (this.playerStats.stamina < 16) return;

    this.playerStats.stamina -= 16;
    this.player.isAttacking = true;
    this.player.attackType = 'whip';
    this.player.attackTimer = 0.3;

    sound.playWhipCrack();
    this.addCameraShake(7);

    const reach = 115;
    this.applyMeleeDamage(this.player.x, this.player.y, reach, this.playerStats.attack * 1.6, 'whip');

    for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
      const px = this.player.x + Math.cos(angle) * (reach * 0.85);
      const py = this.player.y + Math.sin(angle) * (reach * 0.85);
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * 100,
        vy: Math.sin(angle) * 100,
        life: 0.25,
        maxLife: 0.25,
        color: '#f59e0b',
        size: 4.5,
        decay: 1,
        type: 'spark',
      });
    }

    if (this.onStatsChange) this.onStatsChange(this.playerStats);
  }

  public triggerKelimutuMagic() {
    if (this.skillCooldowns.magic > 0) return;
    if (this.playerStats.mana < 20) {
      this.addFloatingText('Mana Kurang!', this.player.x, this.player.y - 30, '#94a3b8');
      return;
    }

    this.playerStats.mana -= 20;
    this.skillCooldowns.magic = 1.3;

    const { dirX, dirY } = this.getFacingVector(this.player.facing);
    const speed = 460;

    const spellType = this.playerStats.kelimutuAttunement === 'none' ? 'nature' : this.playerStats.kelimutuAttunement;
    sound.playMagicCast(spellType === 'magma' ? 'fire' : spellType === 'ice' ? 'ice' : 'nature');

    let color = '#10b981';
    if (spellType === 'magma') color = '#ef4444';
    if (spellType === 'ice') color = '#06b6d4';

    this.projectiles.push({
      id: Math.random(),
      x: this.player.x + dirX * 25,
      y: this.player.y + dirY * 25,
      vx: dirX * speed,
      vy: dirY * speed,
      damage: this.playerStats.attack * 2.4,
      radius: 16,
      color,
      fromPlayer: true,
      life: 1.5,
      spellType: spellType === 'magma' ? 'fire' : spellType === 'ice' ? 'ice' : 'nature',
    });

    if (this.onStatsChange) this.onStatsChange(this.playerStats);
  }

  public triggerRoll() {
    if (this.player.isRolling || this.skillCooldowns.roll > 0) return;
    if (this.playerStats.stamina < 12) return;

    this.playerStats.stamina -= 12;
    this.player.isRolling = true;
    this.player.rollTimer = this.player.rollDuration;
    this.player.invincibleTimer = this.player.rollDuration;
    this.player.rollAngle = 0;
    this.skillCooldowns.roll = 0.5;

    sound.playRoll();

    let { dirX, dirY } = this.getFacingVector(this.player.facing);
    if (this.virtualInput.dx !== 0 || this.virtualInput.dy !== 0) {
      dirX = this.virtualInput.dx;
      dirY = this.virtualInput.dy;
    }
    this.player.vx = dirX * this.playerStats.speed * 2.8;
    this.player.vy = dirY * this.playerStats.speed * 2.8;

    if (this.onStatsChange) this.onStatsChange(this.playerStats);
  }

  public triggerInteract() {
    for (const npc of this.npcs) {
      const dist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
      if (dist < 85) {
        sound.playUiClick();
        if (this.onOpenDialogue) {
          this.onOpenDialogue(npc.dialogueId);
        }
        return;
      }
    }

    for (const prop of this.props) {
      const dist = Math.hypot(prop.x - this.player.x, prop.y - this.player.y);
      if (dist < prop.radius + 40) {
        if (prop.type === 'portal' && prop.targetRegion) {
          sound.playLevelUp();
          this.addFloatingText(`Menuju ${REGIONS_DATA[prop.targetRegion].name}...`, this.player.x, this.player.y - 40, '#38bdf8');
          setTimeout(() => {
            this.loadRegion(prop.targetRegion!);
          }, 350);
          return;
        } else if (prop.type === 'shrine') {
          sound.playGongTone(220);
          this.playerStats.hp = this.playerStats.maxHp;
          this.playerStats.mana = this.playerStats.maxMana;
          this.playerStats.stamina = this.playerStats.maxStamina;
          this.addFloatingText('Mata Air Sakral! HP & Mana Pulih!', this.player.x, this.player.y - 40, '#4ade80');
          for (let i = 0; i < 15; i++) {
            this.particles.push({
              x: this.player.x + (Math.random() - 0.5) * 40,
              y: this.player.y + (Math.random() - 0.5) * 40,
              vx: (Math.random() - 0.5) * 40,
              vy: -60 - Math.random() * 50,
              life: 0.6,
              maxLife: 0.6,
              color: '#34d399',
              size: 4,
              decay: 1,
              type: 'spark',
            });
          }
          if (this.onStatsChange) this.onStatsChange(this.playerStats);
          return;
        } else if (prop.type === 'chest' && !prop.opened) {
          prop.opened = true;
          sound.playItemPickup();
          if (prop.contentItemId && ALL_DATABASE_ITEMS[prop.contentItemId]) {
            const item = ALL_DATABASE_ITEMS[prop.contentItemId];
            this.inventory.push(item);
            this.addFloatingText(`Pusaka Diperoleh: ${item.name}!`, this.player.x, this.player.y - 40, '#fbbf24');
          }
          return;
        } else if (prop.type === 'lore_stone' && prop.loreText) {
          sound.playSasandoNote(440);
          this.addFloatingText(prop.loreText, this.player.x, this.player.y - 50, '#e0e7ff', 24);
          return;
        }
      }
    }
  }

  public useQuickItem(itemId: string) {
    const itemIndex = this.inventory.findIndex((i) => i.id === itemId);
    const item = itemIndex >= 0 ? this.inventory[itemIndex] : ALL_DATABASE_ITEMS[itemId];

    if (!item) return;

    sound.playItemPickup();
    if (item.hpRestore) {
      this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + item.hpRestore);
      this.addFloatingText(`+${item.hpRestore} HP`, this.player.x, this.player.y - 30, '#22c55e');
    }
    if (item.manaRestore) {
      this.playerStats.mana = Math.min(this.playerStats.maxMana, this.playerStats.mana + item.manaRestore);
      this.addFloatingText(`+${item.manaRestore} Mana`, this.player.x, this.player.y - 50, '#38bdf8');
    }
    if (item.staminaRestore) {
      this.playerStats.stamina = Math.min(this.playerStats.maxStamina, this.playerStats.stamina + item.staminaRestore);
      this.addFloatingText(`+${item.staminaRestore} Stamina`, this.player.x, this.player.y - 70, '#facc15');
    }

    if (itemIndex >= 0) {
      this.inventory.splice(itemIndex, 1);
    }

    if (this.onStatsChange) this.onStatsChange(this.playerStats);
  }

  private applyMeleeDamage(cx: number, cy: number, radius: number, rawDamage: number, type: 'parang' | 'whip') {
    let hitAny = false;

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = Math.hypot(enemy.x - cx, enemy.y - cy);
      if (dist < radius + enemy.size) {
        hitAny = true;
        const actualDmg = Math.max(7, Math.round(rawDamage - enemy.defense * 0.4));
        enemy.hp -= actualDmg;
        enemy.hitFlashTimer = 0.16;

        const kx = enemy.x - this.player.x;
        const ky = enemy.y - this.player.y;
        const klen = Math.hypot(kx, ky) || 1;
        const knockDist = type === 'whip' ? 140 : 60;
        enemy.x += (kx / klen) * knockDist;
        enemy.y += (ky / klen) * knockDist;

        this.addFloatingText(`-${actualDmg}`, enemy.x, enemy.y - enemy.size, type === 'whip' ? '#f59e0b' : '#ef4444', 16);

        for (let p = 0; p < 8; p++) {
          this.particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 180,
            vy: (Math.random() - 0.5) * 180,
            life: 0.25,
            maxLife: 0.25,
            color: '#ef4444',
            size: 4,
            decay: 1,
            type: 'spark',
          });
        }

        if (enemy.hp <= 0) {
          this.handleEnemyDefeat(enemy);
        }
      }
    }

    if (hitAny) {
      sound.playHitImpact(type === 'whip');
      this.hitstopTimer = 0.045;
      this.addCameraShake(type === 'whip' ? 9 : 4.5);
    }
  }

  private handleEnemyDefeat(enemy: Enemy) {
    this.addFloatingText(`+${enemy.expReward} EXP`, enemy.x, enemy.y - 30, '#a855f7');
    this.addFloatingText(`+${enemy.goldReward} Koin`, enemy.x, enemy.y - 50, '#eab308');

    this.playerStats.exp += enemy.expReward;
    this.playerStats.gold += enemy.goldReward;

    if (this.playerStats.exp >= this.playerStats.maxExp) {
      this.playerStats.level++;
      this.playerStats.exp -= this.playerStats.maxExp;
      this.playerStats.maxExp = Math.round(this.playerStats.maxExp * 1.5);
      this.playerStats.maxHp += 30;
      this.playerStats.hp = this.playerStats.maxHp;
      this.playerStats.maxMana += 20;
      this.playerStats.mana = this.playerStats.maxMana;
      this.playerStats.attack += 7;
      this.playerStats.defense += 5;
      sound.playLevelUp();
      this.addFloatingText('LEVEL UP!', this.player.x, this.player.y - 60, '#22c55e', 24);
    }

    let questUpdated = false;
    for (const q of this.quests) {
      if (!q.completed) {
        if (q.targetType === 'defeat' && q.targetName === enemy.type) {
          q.currentCount = Math.min(q.targetCount, q.currentCount + 1);
          questUpdated = true;
          if (q.currentCount >= q.targetCount) {
            this.completeQuest(q);
          }
        } else if (q.targetType === 'boss' && enemy.type === 'boss_siluman_dheke_kabora') {
          q.currentCount = 1;
          questUpdated = true;
          this.completeQuest(q);
          setTimeout(() => {
            this.setGameState('VICTORY');
          }, 1500);
        }
      }
    }

    if (questUpdated && this.onQuestUpdate) {
      this.onQuestUpdate(this.quests);
    }

    if (enemy.dropItemId && ALL_DATABASE_ITEMS[enemy.dropItemId]) {
      const drop = ALL_DATABASE_ITEMS[enemy.dropItemId];
      this.inventory.push(drop);
      this.addFloatingText(`Siluman menjatuhkan ${drop.name}!`, enemy.x, enemy.y - 70, '#f59e0b');
    }

    if (this.onStatsChange) this.onStatsChange(this.playerStats);
  }

  public completeQuest(q: Quest) {
    q.completed = true;
    sound.playLevelUp();
    this.addFloatingText(`Misi Selesai: ${q.title}!`, this.player.x, this.player.y - 70, '#10b981', 20);
    this.playerStats.exp += q.rewardExp;
    this.playerStats.gold += q.rewardGold;
    if (q.rewardItem) {
      this.inventory.push(q.rewardItem);
    }
    if (this.onQuestUpdate) this.onQuestUpdate(this.quests);
    if (this.onStatsChange) this.onStatsChange(this.playerStats);
  }

  private addCameraShake(amount: number) {
    this.cameraShake = Math.max(this.cameraShake, amount);
  }

  public addFloatingText(text: string, x: number, y: number, color = '#ffffff', size = 14) {
    this.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      life: 1.2,
      maxLife: 1.2,
      size,
    });
  }

  private getFacingVector(facing: 'left' | 'right' | 'up' | 'down') {
    switch (facing) {
      case 'left': return { dirX: -1, dirY: 0 };
      case 'right': return { dirX: 1, dirY: 0 };
      case 'up': return { dirX: 0, dirY: -1 };
      case 'down': return { dirX: 0, dirY: 1 };
    }
  }

  // 60fps Loop
  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const rawDt = (timestamp - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05);
    this.lastTime = timestamp;

    if (this.gameState === 'PLAYING') {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.update(dt);
      }
    }

    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.ambientTime += dt;
    this.player.breatheTimer += dt * 3.5;
    this.player.ribbonWave += dt * 6;
    this.player.auraPulse += dt * 4;

    this.playerStats.stamina = Math.min(this.playerStats.maxStamina, this.playerStats.stamina + 15 * dt);
    this.playerStats.mana = Math.min(this.playerStats.maxMana, this.playerStats.mana + 5 * dt);

    if (this.skillCooldowns.magic > 0) this.skillCooldowns.magic -= dt;
    if (this.skillCooldowns.roll > 0) this.skillCooldowns.roll -= dt;

    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
    }

    if (this.player.isRolling) {
      this.player.rollTimer -= dt;
      this.player.rollAngle += Math.PI * 8 * dt;
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;

      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: 0,
        vy: 0,
        life: 0.18,
        maxLife: 0.18,
        color: 'rgba(245, 158, 11, 0.45)',
        size: 18,
        decay: 1,
        type: 'afterimage',
      });

      if (this.player.rollTimer <= 0) {
        this.player.isRolling = false;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.rollAngle = 0;
      }
    } else {
      let moveX = 0;
      let moveY = 0;

      if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) moveX -= 1;
      if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) moveX += 1;
      if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) moveY -= 1;
      if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) moveY += 1;

      if (Math.hypot(this.virtualInput.dx, this.virtualInput.dy) > 0.1) {
        moveX = this.virtualInput.dx;
        moveY = this.virtualInput.dy;
      }

      const moveLen = Math.hypot(moveX, moveY);
      if (moveLen > 0) {
        const normX = moveX / moveLen;
        const normY = moveY / moveLen;
        const currentSpeed = this.playerStats.speed * 60;

        this.player.x += normX * currentSpeed * dt;
        this.player.y += normY * currentSpeed * dt;
        this.player.isMoving = true;

        if (Math.abs(normX) > Math.abs(normY)) {
          this.player.facing = normX > 0 ? 'right' : 'left';
        } else {
          this.player.facing = normY > 0 ? 'down' : 'up';
        }

        this.player.walkTimer += dt * 11;
        this.player.walkFrame = Math.floor(this.player.walkTimer) % 4;

        if (Math.random() < 0.3) {
          this.particles.push({
            x: this.player.x + (Math.random() - 0.5) * 12,
            y: this.player.y + 20,
            vx: -normX * 18,
            vy: -normY * 18,
            life: 0.25,
            maxLife: 0.25,
            color: '#a8a29e',
            size: 3.5,
            decay: 1,
            type: 'smoke',
          });
        }
      } else {
        this.player.isMoving = false;
        this.player.walkTimer = 0;
        this.player.walkFrame = 0;
      }
    }

    this.player.x = Math.max(60, Math.min(this.worldWidth - 60, this.player.x));
    this.player.y = Math.max(60, Math.min(this.worldHeight - 60, this.player.y));

    if (this.player.isAttacking) {
      this.player.attackTimer -= dt;
      if (this.player.attackTimer <= 0) {
        this.player.isAttacking = false;
      }
    }

    const targetCamX = this.player.x - this.width / 2;
    const targetCamY = this.player.y - this.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 25);
    }

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;

      if (enemy.hitFlashTimer > 0) {
        enemy.hitFlashTimer -= dt;
      }

      const distToPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);

      if (enemy.isWindup) {
        enemy.windupTimer -= dt;
        if (enemy.windupTimer <= 0) {
          enemy.isWindup = false;
          if (distToPlayer < enemy.attackRange + 15) {
            this.damagePlayer(enemy.attack);
          }
        }
      } else if (distToPlayer < enemy.aggroRadius) {
        const dx = (this.player.x - enemy.x) / distToPlayer;
        const dy = (this.player.y - enemy.y) / distToPlayer;

        enemy.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');

        if (distToPlayer > enemy.attackRange) {
          enemy.x += dx * enemy.speed * 50 * dt;
          enemy.y += dy * enemy.speed * 50 * dt;
        } else {
          enemy.attackTimer -= dt;
          if (enemy.attackTimer <= 0) {
            enemy.isWindup = true;
            enemy.windupTimer = enemy.windupDuration;
            enemy.attackTimer = enemy.attackCooldown;
          }
        }
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      this.particles.push({
        x: proj.x,
        y: proj.y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 0.2,
        maxLife: 0.2,
        color: proj.color,
        size: 3.5,
        decay: 1,
        type: 'spark',
      });

      if (proj.fromPlayer) {
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0) continue;
          const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
          if (dist < proj.radius + enemy.size) {
            const actualDmg = Math.round(proj.damage - enemy.defense * 0.3);
            enemy.hp -= actualDmg;
            enemy.hitFlashTimer = 0.2;
            sound.playHitImpact(true);
            this.addFloatingText(`-${actualDmg}`, enemy.x, enemy.y - enemy.size, proj.color, 18);
            proj.life = -1;

            if (enemy.hp <= 0) {
              this.handleEnemyDefeat(enemy);
            }
            break;
          }
        }
      }

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 30 * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    if (Math.random() < 0.3) {
      this.spawnAmbientParticles();
    }
  }

  private damagePlayer(amount: number) {
    if (this.player.invincibleTimer > 0) return;

    const actualDmg = Math.max(5, Math.round(amount - this.playerStats.defense * 0.5));
    this.playerStats.hp -= actualDmg;
    this.player.invincibleTimer = 0.45;
    sound.playHitImpact(true);
    this.addCameraShake(7);

    this.addFloatingText(`-${actualDmg}`, this.player.x, this.player.y - 30, '#ef4444', 18);

    if (this.playerStats.hp <= 0) {
      this.playerStats.hp = 0;
      this.setGameState('GAME_OVER');
    }

    if (this.onStatsChange) this.onStatsChange(this.playerStats);
  }

  private spawnAmbientParticles() {
    const rx = this.camera.x + Math.random() * this.width;
    const ry = this.camera.y + Math.random() * this.height;

    if (this.currentRegion === 'NAGEKEO') {
      this.particles.push({
        x: rx,
        y: ry,
        vx: 18 + Math.random() * 20,
        vy: -5 + Math.random() * 10,
        life: 3.5,
        maxLife: 3.5,
        color: 'rgba(255, 255, 255, 0.18)',
        size: 18 + Math.random() * 25,
        decay: 1,
        type: 'smoke',
      });
    } else if (this.currentRegion === 'KELIMUTU') {
      this.particles.push({
        x: rx,
        y: ry,
        vx: (Math.random() - 0.5) * 30,
        vy: -45 - Math.random() * 55,
        life: 2.0,
        maxLife: 2.0,
        color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
        size: 2.5 + Math.random() * 3.5,
        decay: 1,
        type: 'ember',
      });
    } else if (this.currentRegion === 'ENDE') {
      this.particles.push({
        x: rx,
        y: ry,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 2.2,
        maxLife: 2.2,
        color: 'rgba(56, 189, 248, 0.4)',
        size: 3.5,
        decay: 1,
        type: 'spark',
      });
    } else if (this.currentRegion === 'MAUMERE') {
      this.particles.push({
        x: rx,
        y: ry,
        vx: 25 + Math.random() * 15,
        vy: -15,
        life: 3.0,
        maxLife: 3.0,
        color: 'rgba(254, 240, 138, 0.25)',
        size: 2.5,
        decay: 1,
        type: 'leaf',
      });
    }
  }

  // Canvas Render Pipeline
  private render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();
    const shakeX = (Math.random() - 0.5) * this.cameraShake;
    const shakeY = (Math.random() - 0.5) * this.cameraShake;
    this.ctx.translate(-Math.round(this.camera.x + shakeX), -Math.round(this.camera.y + shakeY));

    // 1. Animated Flores Regional Backdrop
    this.renderWorldBackground();

    // 2. Interactive Props
    this.renderProps();

    // 3. NPCs
    this.renderNPCs();

    // 4. Nagekeo Siluman Enemies
    this.renderEnemies();

    // 5. MOBA-Style High-Fidelity Animated Human Player
    this.renderMobaPlayer();

    // 6. Projectiles
    this.renderProjectiles();

    // 7. Particles
    this.renderParticles();

    // 8. Floating Combat Text
    this.renderFloatingText();

    this.ctx.restore();

    this.renderScreenVignette();
  }

  private renderWorldBackground() {
    if (this.currentRegion === 'NAGEKEO') {
      // Nagekeo Highland Megaliths & Sa'o Houses
      this.ctx.fillStyle = '#11291d';
      this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

      // Ceremonial Megalith Circle (Nagekeo Tradition)
      this.ctx.strokeStyle = '#374151';
      this.ctx.lineWidth = 52;
      this.ctx.beginPath();
      this.ctx.arc(1300, 1000, 260, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = '#1f2937';
      this.ctx.beginPath();
      this.ctx.arc(1300, 1000, 70, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#9ca3af';
      this.ctx.lineWidth = 6;
      this.ctx.stroke();

      // Traditional Megalith Stones (Ngadhu / Bhaga)
      this.drawMegalithStone(1300, 910);
      this.drawMegalithStone(1240, 930);
      this.drawMegalithStone(1360, 930);

      const houseAngles = [0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4];
      houseAngles.forEach((ang) => {
        const hx = 1300 + Math.cos(ang) * 480;
        const hy = 1000 + Math.sin(ang) * 480;
        this.drawMbaruNiang(hx, hy);
      });
    } else if (this.currentRegion === 'ENDE') {
      // Historic Ende Karst Cliffs & Caves
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

      this.ctx.fillStyle = '#1e293b';
      for (let x = 80; x < this.worldWidth; x += 300) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 100);
        this.ctx.lineTo(x + 90, 310);
        this.ctx.lineTo(x + 180, 100);
        this.ctx.fill();
      }

      for (let x = 220; x < this.worldWidth; x += 350) {
        const y = 500 + ((x * 19) % 750);
        this.drawCrystalCluster(x, y);
      }
    } else if (this.currentRegion === 'MAUMERE') {
      // Maumere Coastal Bay & Savana
      this.ctx.fillStyle = '#d97706';
      this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

      // Turquoise Ocean
      this.ctx.fillStyle = '#0284c7';
      this.ctx.fillRect(1700, 0, this.worldWidth - 1700, this.worldHeight);

      // Animated wave ripples
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      const waveOffset = Math.sin(this.ambientTime * 2.5) * 25;
      this.ctx.moveTo(1700 + waveOffset, 0);
      for (let y = 0; y <= this.worldHeight; y += 40) {
        const x = 1700 + Math.sin(y * 0.02 + this.ambientTime * 3.5) * 30;
        this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();

      this.ctx.fillStyle = '#78350f';
      this.ctx.fillRect(700, 1050, 1000, 130);
      this.ctx.strokeStyle = '#451a03';
      this.ctx.lineWidth = 3;
      for (let px = 700; px <= 1650; px += 35) {
        this.ctx.strokeRect(px, 1050, 35, 130);
      }

      this.drawPhinisiBoat(2050, 1100);
    } else if (this.currentRegion === 'KELIMUTU') {
      this.ctx.fillStyle = '#18181b';
      this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

      this.drawCraterLake(700, 600, 220, '#0d9488', '#14b8a6', 'Tiwu Nuwa Muri Koo Fai');
      this.drawCraterLake(1700, 600, 200, '#991b1b', '#ef4444', 'Tiwu Ata Polo');
      this.drawCraterLake(1200, 1250, 190, '#0284c7', '#38bdf8', 'Tiwu Ata Mbupu');
    }
  }

  private drawMegalithStone(x: number, y: number) {
    this.ctx.fillStyle = '#4b5563';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 12, y + 30);
    this.ctx.lineTo(x - 6, y - 40);
    this.ctx.lineTo(x + 6, y - 40);
    this.ctx.lineTo(x + 12, y + 30);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#1f2937';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawMbaruNiang(x: number, y: number) {
    this.ctx.fillStyle = '#292524';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 85);
    this.ctx.lineTo(x + 70, y + 20);
    this.ctx.lineTo(x - 70, y + 20);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#44403c';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    for (let dy = -60; dy < 15; dy += 16) {
      const width = (dy + 85) * 0.7;
      this.ctx.strokeStyle = '#57534e';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y + dy, width, 0, Math.PI);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = '#d97706';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 85);
    this.ctx.lineTo(x, y - 105);
    this.ctx.stroke();

    this.ctx.fillStyle = '#1c1917';
    this.ctx.fillRect(x - 12, y - 5, 24, 25);
  }

  private drawCrystalCluster(x: number, y: number) {
    this.ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    this.ctx.strokeStyle = '#bae6fd';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 40);
    this.ctx.lineTo(x + 18, y);
    this.ctx.lineTo(x - 18, y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawPhinisiBoat(x: number, y: number) {
    this.ctx.fillStyle = '#78350f';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 130, y);
    this.ctx.lineTo(x + 130, y);
    this.ctx.lineTo(x + 90, y + 65);
    this.ctx.lineTo(x - 90, y + 65);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#451a03';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    this.ctx.strokeStyle = '#292524';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 30, y);
    this.ctx.lineTo(x - 30, y - 130);
    this.ctx.moveTo(x + 40, y);
    this.ctx.lineTo(x + 40, y - 110);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(254, 243, 199, 0.95)';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 30, y - 120);
    this.ctx.lineTo(x - 95, y - 35);
    this.ctx.lineTo(x - 30, y - 35);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawCraterLake(cx: number, cy: number, radius: number, coreColor: string, rimColor: string, name: string) {
    this.ctx.fillStyle = '#27272a';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius + 25, 0, Math.PI * 2);
    this.ctx.fill();

    const grad = this.ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    grad.addColorStop(0, rimColor);
    grad.addColorStop(1, coreColor);
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    const ripple = (this.ambientTime * 22) % (radius * 0.85);
    this.ctx.arc(cx, cy, ripple, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.ctx.font = '600 13px Cinzel, serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(name, cx, cy + radius + 40);
  }

  private renderProps() {
    for (const prop of this.props) {
      if (prop.type === 'portal') {
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(prop.x, prop.y, prop.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.strokeStyle = '#93c5fd';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const spin = this.ambientTime * 3.5;
        this.ctx.arc(prop.x, prop.y, prop.radius * 0.6, spin, spin + Math.PI * 1.5);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(prop.name, prop.x, prop.y - prop.radius - 10);
      } else if (prop.type === 'shrine') {
        this.ctx.fillStyle = '#065f46';
        this.ctx.beginPath();
        this.ctx.arc(prop.x, prop.y, prop.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#34d399';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.fillStyle = '#ecfdf5';
        this.ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Mata Air Sakral [E]', prop.x, prop.y + 4);
      } else if (prop.type === 'chest') {
        this.ctx.fillStyle = prop.opened ? '#451a03' : '#b45309';
        this.ctx.fillRect(prop.x - 18, prop.y - 12, 36, 24);
        this.ctx.strokeStyle = '#fef08a';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(prop.x - 18, prop.y - 12, 36, 24);

        if (!prop.opened) {
          this.ctx.fillStyle = '#fde047';
          this.ctx.font = '10px "Plus Jakarta Sans", sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('[E] Buka', prop.x, prop.y - 18);
        }
      }
    }
  }

  private renderNPCs() {
    for (const npc of this.npcs) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.ctx.beginPath();
      this.ctx.ellipse(npc.x, npc.y + 16, 16, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = npc.portrait === 'elder' ? '#78350f' : npc.portrait === 'sailor' ? '#0369a1' : '#b45309';
      this.ctx.beginPath();
      this.ctx.arc(npc.x, npc.y, 16, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#fde047';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(npc.x - 10, npc.y - 2, 20, 14);

      if (npc.hasQuestNotification) {
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = 'bold 18px "Cinzel", serif';
        this.ctx.textAlign = 'center';
        const bounce = Math.sin(this.ambientTime * 5) * 4;
        this.ctx.fillText('!', npc.x, npc.y - 28 + bounce);
      }

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(npc.name, npc.x, npc.y - 24);
    }
  }

  private renderEnemies() {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;

      const isFlashing = enemy.hitFlashTimer > 0;

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      this.ctx.beginPath();
      this.ctx.ellipse(enemy.x, enemy.y + enemy.size * 0.85, enemy.size * 0.9, enemy.size * 0.4, 0, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.save();
      this.ctx.translate(enemy.x, enemy.y);

      if (enemy.type === 'siluman_ata_polo') {
        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#3f1d24';
        this.ctx.beginPath();
        this.ctx.arc(0, -6, enemy.size * 0.55, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#1c1917';
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -14);
        this.ctx.lineTo(-14, -26);
        this.ctx.lineTo(-4, -16);
        this.ctx.moveTo(10, -14);
        this.ctx.lineTo(14, -26);
        this.ctx.lineTo(4, -16);
        this.ctx.fill();

        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(-5, -6, 2.5, 0, Math.PI * 2);
        this.ctx.arc(5, -6, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#27171d';
        this.ctx.fillRect(-12, 0, 24, 20);

        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(-12, 10);
        this.ctx.lineTo(-24, 18);
        this.ctx.moveTo(12, 10);
        this.ctx.lineTo(24, 18);
        this.ctx.stroke();
      } else if (enemy.type === 'siluman_ine_bua') {
        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#14532d';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -18);
        this.ctx.lineTo(16, 22);
        this.ctx.lineTo(-16, 22);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#e2e8f0';
        this.ctx.beginPath();
        this.ctx.arc(0, -12, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, enemy.size * 0.9, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (enemy.type === 'siluman_jara_gena') {
        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#7c2d12';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, enemy.size * 1.1, enemy.size * 0.65, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(enemy.facing === 'left' ? -18 : 18, -10, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#f97316';
        this.ctx.beginPath();
        const hx = enemy.facing === 'left' ? -10 : 10;
        this.ctx.moveTo(hx, -20);
        this.ctx.lineTo(hx - 5, -30);
        this.ctx.lineTo(hx + 5, -24);
        this.ctx.fill();

        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(-16, 12, 8, 6);
        this.ctx.fillRect(8, 12, 8, 6);
      } else if (enemy.type === 'siluman_bido_wolowea') {
        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#1e1b4b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();

        const wingFlap = Math.sin(this.ambientTime * 14) * 12;
        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#312e81';
        this.ctx.beginPath();
        this.ctx.moveTo(-6, 0);
        this.ctx.lineTo(-28, -14 + wingFlap);
        this.ctx.lineTo(-14, 12);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(6, 0);
        this.ctx.lineTo(28, -14 + wingFlap);
        this.ctx.lineTo(14, 12);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (enemy.type === 'siluman_embu_golo') {
        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#27272a';
        this.ctx.fillRect(-20, -18, 40, 36);

        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-14, -10);
        this.ctx.lineTo(6, 0);
        this.ctx.lineTo(-4, 14);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-20, -18, 40, 36);
      } else if (enemy.type === 'boss_siluman_dheke_kabora') {
        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#450a0a';
        this.ctx.beginPath();
        this.ctx.arc(0, -14, enemy.size * 0.45, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(-12, -22);
        this.ctx.quadraticCurveTo(-38, -45, -28, -60);
        this.ctx.moveTo(12, -22);
        this.ctx.quadraticCurveTo(38, -45, 28, -60);
        this.ctx.stroke();

        this.ctx.fillStyle = isFlashing ? '#ffffff' : '#1c1917';
        this.ctx.fillRect(-26, 4, 52, 42);

        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(28, 0);
        this.ctx.lineTo(55, -35);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(-8, -14, 4, 0, Math.PI * 2);
        this.ctx.arc(8, -14, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }

      if (enemy.isWindup) {
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, enemy.size + 14, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.restore();

      const barW = enemy.size * 2.2;
      const barH = 5;
      const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.size - 14, barW, barH);
      this.ctx.fillStyle = enemy.type === 'boss_siluman_dheke_kabora' ? '#dc2626' : '#22c55e';
      this.ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.size - 14, barW * hpPct, barH);
    }
  }

  // ================= FULLY ANIMATED 3D CHIBI CHARACTER SPRITE MODEL =================
  private renderMobaPlayer() {
    const p = this.player;
    const char = this.selectedCharacter;
    const isFemale = char.gender === 'female';

    // 1. Tactical Aura Ring & Ground Shadow
    const auraRadius = 28 + Math.sin(p.auraPulse * 3) * 4;
    this.ctx.strokeStyle = char.visualTheme.accentColor;
    this.ctx.lineWidth = 3.5;
    this.ctx.beginPath();
    this.ctx.ellipse(p.x, p.y + 26, auraRadius, auraRadius * 0.45, 0, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.ctx.beginPath();
    this.ctx.ellipse(p.x, p.y + 27, 20, 9, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (p.invincibleTimer > 0 && Math.sin(this.ambientTime * 30) > 0) {
      return;
    }

    this.ctx.save();
    this.ctx.translate(p.x, p.y);

    if (p.isRolling) {
      this.ctx.rotate(p.rollAngle);
      this.ctx.fillStyle = char.visualTheme.clothColor;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = char.visualTheme.accentColor;
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
      this.ctx.restore();
      return;
    }

    const legAngle = p.isMoving ? Math.sin(p.walkTimer * 1.5) * 0.7 : 0;
    const armSwing = p.isMoving ? Math.sin(p.walkTimer * 1.5) * 0.6 : 0;
    const breathe = Math.sin(p.breatheTimer * 2) * 2;

    const isLeft = p.facing === 'left';
    const isRight = p.facing === 'right';
    const isUp = p.facing === 'up';

    // 2. Animated Legs (Boots)
    this.ctx.fillStyle = '#1c1917';
    this.ctx.save();
    this.ctx.translate(-5, 12);
    this.ctx.rotate(legAngle);
    this.ctx.fillRect(-3.5, 0, 7, 14);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(5, 12);
    this.ctx.rotate(-legAngle);
    this.ctx.fillRect(-3.5, 0, 7, 14);
    this.ctx.restore();

    // 3. Chibi Torso & Songke Woven Armor
    const torsoW = isFemale ? 22 : 26;
    const torsoH = 22;
    this.ctx.fillStyle = char.visualTheme.clothColor;
    this.ctx.beginPath();
    this.ctx.roundRect(-torsoW / 2, -7 + breathe, torsoW, torsoH, [7]);
    this.ctx.fill();

    // Golden Armor Accent & Belt
    this.ctx.fillStyle = char.visualTheme.accentColor;
    this.ctx.fillRect(-torsoW / 2 - 3, -6 + breathe, 8, 6);
    this.ctx.fillRect(torsoW / 2 - 5, -6 + breathe, 8, 6);

    this.ctx.fillStyle = char.visualTheme.headbandColor;
    this.ctx.fillRect(-torsoW / 2 - 1, 9 + breathe, torsoW + 2, 4.5);

    // 4. Chibi Head & Hair
    const headY = -20 + breathe;
    
    this.ctx.fillStyle = '#f6ad55';
    this.ctx.beginPath();
    this.ctx.arc(0, headY, isFemale ? 13 : 14, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = char.visualTheme.hairColor;
    this.ctx.beginPath();
    this.ctx.arc(0, headY - 3, isFemale ? 15 : 14.5, Math.PI, 0);
    this.ctx.fill();

    if (isFemale) {
      this.ctx.beginPath();
      this.ctx.moveTo(-13, headY);
      this.ctx.lineTo(-18, headY + 22);
      this.ctx.lineTo(-10, headY + 18);
      this.ctx.moveTo(13, headY);
      this.ctx.lineTo(18, headY + 22);
      this.ctx.lineTo(10, headY + 18);
      this.ctx.fill();
    }

    if (!isUp) {
      this.ctx.fillStyle = '#ffffff';
      const eyeOff = isLeft ? -4.5 : isRight ? 4.5 : 0;
      this.ctx.beginPath();
      this.ctx.arc(-4 + eyeOff, headY - 1, 3, 0, Math.PI * 2);
      this.ctx.arc(4 + eyeOff, headY - 1, 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#0f172a';
      this.ctx.beginPath();
      this.ctx.arc(-4 + eyeOff, headY - 1, 1.5, 0, Math.PI * 2);
      this.ctx.arc(4 + eyeOff, headY - 1, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Headband with Waving Ribbon
    this.ctx.fillStyle = char.visualTheme.headbandColor;
    this.ctx.fillRect(-13, headY - 8, 26, 6);
    this.ctx.fillStyle = char.visualTheme.accentColor;
    this.ctx.fillRect(-6, headY - 7, 12, 4);

    const ribbonWave = Math.sin(p.ribbonWave * 1.5) * 6;
    this.ctx.strokeStyle = char.visualTheme.headbandColor;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(isLeft ? 12 : -12, headY - 5);
    this.ctx.quadraticCurveTo(isLeft ? 26 : -26, headY - 10 + ribbonWave, isLeft ? 36 : -36, headY + ribbonWave);
    this.ctx.stroke();

    // 5. Animated Arms & Weapon
    this.ctx.save();
    this.ctx.translate(torsoW / 2, -3 + breathe);
    
    if (p.isAttacking) {
      const { dirX, dirY } = this.getFacingVector(p.facing);
      const attackProgress = 1 - p.attackTimer / p.attackDuration;
      const attackAngle = (attackProgress - 0.5) * Math.PI * 1.7;
      const baseAngle = Math.atan2(dirY, dirX);
      this.ctx.rotate(baseAngle + attackAngle);

      this.ctx.fillStyle = '#f8fafc';
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(50, -12);
      this.ctx.lineTo(58, 6);
      this.ctx.lineTo(0, 10);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)';
      this.ctx.lineWidth = 8;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 64, -0.9, 0.9);
      this.ctx.stroke();
    } else {
      this.ctx.rotate(armSwing);
      this.ctx.fillStyle = '#b45309';
      this.ctx.fillRect(0, 0, 6, 16);

      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fillRect(3, 10, 5, 26);
      this.ctx.fillStyle = char.visualTheme.accentColor;
      this.ctx.fillRect(3, 5, 5, 8);
    }
    this.ctx.restore();

    this.ctx.restore();

    // 6. Name Tag & Health Bar
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${char.name} (Lv.${this.playerStats.level})`, p.x, p.y - 48);

    const barW = 50;
    const barH = 6;
    const hpPct = Math.max(0, this.playerStats.hp / this.playerStats.maxHp);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(p.x - barW / 2, p.y - 60, barW, barH);
    this.ctx.fillStyle = '#22c55e';
    this.ctx.fillRect(p.x - barW / 2, p.y - 60, barW * hpPct, barH);
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(p.x - barW / 2, p.y - 60, barW, barH);
  }

  private renderProjectiles() {
    for (const proj of this.projectiles) {
      this.ctx.fillStyle = proj.color;
      this.ctx.beginPath();
      this.ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private renderParticles() {
    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderFloatingText() {
    for (const ft of this.floatingTexts) {
      const alpha = Math.min(1, ft.life / (ft.maxLife * 0.4));
      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.font = `bold ${ft.size}px "Plus Jakarta Sans", sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.globalAlpha = 1.0;
    }
  }

  private renderScreenVignette() {
    const grad = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.4,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.75
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}
