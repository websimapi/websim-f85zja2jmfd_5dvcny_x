import { Zombie } from './zombie.js';
import { Bullet } from './bullet.js';
import { Player } from './player.js';
import { ParticleSystem } from './particles.js';
import { UpgradeSystem } from './upgrade-system.js';
import { PowerUp } from './power-up.js';
import { HomingBomb } from './bomb.js';
import { drawPlayerModel } from './player-model.js';
import { ShardUpgradeTree } from './shard-upgrade-tree.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('scoreValue');
        this.ammoElement = document.getElementById('ammoValue');
        this.healthElement = document.getElementById('healthValue');
        this.shootButton = document.getElementById('shootButton');
        this.reloadButton = document.getElementById('reloadButton');
        this.bombButton = document.getElementById('bombButton');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartButton = document.getElementById('restartButton');
        this.waveElement = document.getElementById('waveValue');
        this.coinsElement = document.getElementById('coinsValue');
        this.shardsElement = document.getElementById('shardsValue');

        this.score = 0;
        this.coins = 0;
        this.shards = 0;
        this.gameRunning = true;
        this.zombies = [];
        this.bullets = [];
        this.bombs = [];
        this.powerUps = [];
        this.particleSystem = new ParticleSystem();
        this.player = new Player();
        this.upgradeSystem = new UpgradeSystem();
        this.shardTree = new ShardUpgradeTree();
        
        this.zombieSpawnTimer = 0;
        // Spawn more zombies and faster progression
        this.zombieSpawnInterval = 90; // spawn more frequently
        this.zombieSpeed = 0.6;
        this.waveNumber = 1;
        this.zombiesInWave = 20; // start with more zombies per wave
        this.zombiesKilledInWave = 0;
        this.waveActive = true;
        this.waveBreakTimer = 0;
        this.waveBreakDuration = 180;
        
        this.animationFrameId = null;
        this.isPaused = false;

        // Homing bomb cooldown (ms)
        this.bombCooldownMs = 2500;
        this.lastBombTime = -99999;
        this.autoBomb = false;

        // Starting abilities
        this.startingAbilities = this.createStartingAbilities();
        this.selectedAbilityId = null;
        this.abilityChosen = false;

        // Wave upgrade system (post-wave draft)
        this.waveUpgradePool = this.createWaveUpgradePool();
        this.lastWaveUpgradeChoices = [];

        // Difficulty defaults (will be set when player chooses)
        this.difficulty = 'normal';
        this.difficultyPresets = this.createDifficultyPresets();

        this.createWaveBreakOverlay();
        this.createMobileControls();
        this.preloadAudio();
        this.init();
    }

    // New: define difficulty presets
    createDifficultyPresets() {
        return {
            easy: {
                label: 'Easy',
                zombieHealthMul: 0.8,
                zombieSpeedMul: 0.85,
                spawnIntervalMul: 1.2,
                waveSizeMul: 0.8,
                startingCoins: 100,
                bombCooldownMul: 0.9,
                playerHealthBonus: 2,
                description: 'Relaxed waves, more starting coins, extra health.'
            },
            normal: {
                label: 'Normal',
                zombieHealthMul: 1,
                zombieSpeedMul: 1,
                spawnIntervalMul: 1,
                waveSizeMul: 1,
                startingCoins: 50,
                bombCooldownMul: 1,
                playerHealthBonus: 0,
                description: 'Standard challenge.'
            },
            hard: {
                label: 'Hard',
                zombieHealthMul: 1.25,
                zombieSpeedMul: 1.15,
                spawnIntervalMul: 0.85,
                waveSizeMul: 1.2,
                startingCoins: 20,
                bombCooldownMul: 1.15,
                playerHealthBonus: -1,
                description: 'More dangerous zombies and larger waves.'
            },
            nightmare: {
                label: 'Nightmare',
                zombieHealthMul: 1.6,
                zombieSpeedMul: 1.35,
                spawnIntervalMul: 0.7,
                waveSizeMul: 1.5,
                startingCoins: 0,
                bombCooldownMul: 1.4,
                playerHealthBonus: -2,
                description: 'Brutal: big waves, strong fast zombies, minimal resources.'
            },
            custom: {
                label: 'Custom',
                zombieHealthMul: 1,
                zombieSpeedMul: 1,
                spawnIntervalMul: 1,
                waveSizeMul: 1,
                startingCoins: 50,
                bombCooldownMul: 1,
                playerHealthBonus: 0,
                description: 'Tweak values in code or later UI.'
            }
        };
    }

    // New: create a simple difficulty selection overlay that appears before ability selection
    showDifficultySelect() {
        this.isPaused = true;
        let overlay = document.getElementById('difficultySelectOverlay');
        if (overlay) return;

        overlay = document.createElement('div');
        overlay.id = 'difficultySelectOverlay';
        overlay.className = 'abilities-overlay';
        overlay.innerHTML = `
            <div class="abilities-card">
                <h1>Choose Difficulty</h1>
                <p style="color:#ccc">Pick a preset to shape wave intensity, zombie stats, and starting resources.</p>
                <div class="abilities-grid" id="difficultyGrid">
                    ${Object.keys(this.difficultyPresets).map(key => {
                        const p = this.difficultyPresets[key];
                        return `
                        <label class="ability-option" data-diff="${key}" style="min-height:86px;">
                            <input type="radio" name="difficulty" value="${key}">
                            <div class="ability-content">
                                <div class="ability-header">
                                    <span class="ability-name">${p.label}</span>
                                    <span class="tag" style="background:#333;color:#fff">${key.toUpperCase()}</span>
                                </div>
                                <div style="font-size:13px;color:#ddd;margin-top:8px;">
                                    ${p.description}
                                </div>
                            </div>
                        </label>`;
                    }).join('')}
                </div>
                <div class="abilities-actions">
                    <button id="confirmDifficultyButton" class="primary">Confirm Difficulty</button>
                </div>
            </div>
        `;
        document.getElementById('gameContainer').appendChild(overlay);

        overlay.querySelectorAll('.ability-option').forEach(el => {
            el.addEventListener('click', (e) => {
                const radio = el.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    overlay.querySelectorAll('.ability-option').forEach(opt => opt.classList.remove('selected'));
                    el.classList.add('selected');
                    this.difficulty = radio.value;
                }
            });
        });

        const confirmBtn = overlay.querySelector('#confirmDifficultyButton');
        confirmBtn.addEventListener('click', () => {
            // apply chosen difficulty (default to normal if none)
            if (!this.difficulty || !this.difficultyPresets[this.difficulty]) this.difficulty = 'normal';
            this.applyDifficulty(this.difficulty);
            const ov = document.getElementById('difficultySelectOverlay');
            if (ov) ov.remove();
            // after difficulty, proceed to ability selection
            this.showAbilitySelect();
        });
    }

    // New: apply preset values to game and player
    applyDifficulty(key) {
        const preset = this.difficultyPresets[key] || this.difficultyPresets['normal'];
        // adjust core game scaling
        this.zombieSpawnInterval = Math.max(14, Math.floor(90 * preset.spawnIntervalMul));
        this.zombieSpeed = 0.6 * preset.zombieSpeedMul;
        // adjust wave sizing multiplier (used when starting new waves)
        this._waveSizeMul = preset.waveSizeMul;
        // set starting coins and bomb cooldown multipliers
        this.coins = preset.startingCoins;
        this.bombCooldownMs = Math.max(400, Math.floor(this.bombCooldownMs * preset.bombCooldownMul));
        // tweak player health
        this.player.maxHealth = Math.max(1, this.player.maxHealth + (preset.playerHealthBonus || 0));
        this.player.health = Math.min(this.player.health, this.player.maxHealth);
        // For future spawned zombies, apply health multiplier by storing a flag on the game
        this._zombieHealthMul = preset.zombieHealthMul;
        // update UI to reflect starting coins/health
        this.updateCoinDisplay();
        this.updateHealthDisplay();
    }

    createStartingAbilities() {
        return [
            {
                id: 'glass_cannon',
                name: 'Glass Cannon',
                pros: ['+80% damage', '+4 ammo'],
                cons: ['-2 max health'],
                apply: (game) => {
                    game.player.damageMultiplier *= 1.8;
                    game.player.maxAmmo += 4;
                    game.player.ammo = game.player.maxAmmo;
                    game.player.maxHealth = Math.max(1, game.player.maxHealth - 2);
                    game.player.health = game.player.maxHealth;
                    game.updateAmmoDisplay();
                    game.updateHealthDisplay();
                }
            },
            {
                id: 'tank',
                name: 'Bulldozer',
                pros: ['+3 max health', 'Short invulnerability after hit'],
                cons: ['-25% damage'],
                apply: (game) => {
                    game.player.maxHealth += 3;
                    game.player.health = game.player.maxHealth;
                    game.player.damageMultiplier *= 0.75;
                    // Slightly longer invulnerability window
                    game.player.invulnerableTimer = 0; // reset
                    game.updateHealthDisplay();
                }
            },
            {
                id: 'rapid_reload',
                name: 'Gunsmith',
                pros: ['-40% reload time', '+10% stamina regen'],
                cons: ['-2 ammo'],
                apply: (game) => {
                    game.player.reloadDuration = Math.floor(game.player.reloadDuration * 0.6);
                    game.player.staminaRegenRate *= 1.1;
                    game.player.maxAmmo = Math.max(2, game.player.maxAmmo - 2);
                    game.player.ammo = game.player.maxAmmo;
                    game.updateAmmoDisplay();
                }
            },
            {
                id: 'rich_start',
                name: 'Rich Kid',
                pros: ['+150 starting coins', '+20% coin gain'],
                cons: ['+10% zombie speed from wave 2+'],
                apply: (game) => {
                    game.coins += 150;
                    const coinUpgrade = game.upgradeSystem.upgrades.find(u => u.id === 'coins');
                    if (coinUpgrade) {
                        coinUpgrade.level += 1;
                    }
                    // tag game so later waves are a bit faster
                    game.richKidChosen = true;
                    game.updateCoinDisplay();
                }
            },
            {
                id: 'bomb_specialist',
                name: 'Bomb Specialist',
                pros: ['Homing bomb deals +40% damage', 'Cooldown -20%'],
                cons: ['-1 max health', '-10% bullet damage'],
                apply: (game) => {
                    game.bombCooldownMs = Math.floor(game.bombCooldownMs * 0.8);
                    const homingUpgrade = game.upgradeSystem.upgrades.find(u => u.id === 'homing');
                    if (homingUpgrade) homingUpgrade.level += 1;
                    game.player.maxHealth = Math.max(1, game.player.maxHealth - 1);
                    game.player.health = game.player.maxHealth;
                    game.player.damageMultiplier *= 0.9;
                    game.updateHealthDisplay();
                }
            }
        ];
    }

    // Procedurally generate 120+ wave upgrades with rarities and pros/cons
    createWaveUpgradePool() {
        const pool = [];
        let idCounter = 0;

        const makeUpgrade = (type, tier, rarity) => {
            const id = `wu_${type}_${tier}_${idCounter++}`;
            let name = '';
            const pros = [];
            const cons = [];

            const rarityLabel = rarity.toUpperCase();

            switch (type) {
                case 'damage':
                    name = `Overloaded Rounds ${tier}`;
                    {
                        const dmg = 6 + tier * 2;
                        const hpPenalty = 4 + tier;
                        pros.push(`+${dmg}% bullet damage`);
                        cons.push(`-${hpPenalty}% max health`);
                    }
                    break;
                case 'health':
                    name = `Bulwark Plating ${tier}`;
                    {
                        const hp = 1 + Math.floor(tier / 2);
                        const dmgPenalty = 5 + tier;
                        pros.push(`+${hp} max health`);
                        cons.push(`-${dmgPenalty}% bullet damage`);
                    }
                    break;
                case 'reload':
                    name = `Quickdraw Mechanism ${tier}`;
                    {
                        const reload = 6 + tier * 2;
                        const ammoPenalty = 1 + Math.floor(tier / 4);
                        pros.push(`-${reload}% reload time`);
                        cons.push(`-${ammoPenalty} max ammo`);
                    }
                    break;
                case 'stamina':
                    name = `Adrenal Surge ${tier}`;
                    {
                        const regen = 10 + tier * 2;
                        const speedBuff = 3 + tier;
                        pros.push(`+${regen}% stamina regen & max stamina`);
                        cons.push(`+${speedBuff}% zombie speed`);
                    }
                    break;
                case 'coins':
                    name = `Greedy Instinct ${tier}`;
                    {
                        const coin = 12 + tier * 2;
                        const hpBuff = 4 + tier;
                        pros.push(`+${coin}% coin gain`);
                        cons.push(`+${hpBuff}% zombie health`);
                    }
                    break;
                case 'bomb':
                    name = `High-Yield Explosives ${tier}`;
                    {
                        const bombDmg = 15 + tier * 3;
                        const cd = 8 + tier * 2;
                        pros.push(`+${bombDmg}% bomb damage`);
                        cons.push(`+${cd}% bomb cooldown`);
                    }
                    break;
            }

            return {
                id,
                type,
                tier,
                rarity,
                name,
                rarityLabel,
                pros,
                cons,
                apply: (game) => {
                    const p = game.player;
                    const u = game.upgradeSystem;
                    switch (type) {
                        case 'damage': {
                            const dmg = 1 + (6 + tier * 2) / 100;
                            const hpPenalty = 1 - (4 + tier) / 100;
                            p.damageMultiplier *= dmg;
                            p.maxHealth = Math.max(1, Math.round(p.maxHealth * hpPenalty));
                            if (p.health > p.maxHealth) p.health = p.maxHealth;
                            game.updateHealthDisplay();
                            break;
                        }
                        case 'health': {
                            const hp = 1 + Math.floor(tier / 2);
                            const dmgPenalty = 1 - (5 + tier) / 100;
                            p.maxHealth += hp;
                            p.health = p.maxHealth;
                            p.damageMultiplier *= dmgPenalty;
                            game.updateHealthDisplay();
                            break;
                        }
                        case 'reload': {
                            const reload = (6 + tier * 2) / 100;
                            const ammoPenalty = 1 + Math.floor(tier / 4);
                            p.reloadDuration = Math.max(20, Math.floor(p.reloadDuration * (1 - reload)));
                            p.maxAmmo = Math.max(1, p.maxAmmo - ammoPenalty);
                            p.ammo = Math.min(p.ammo, p.maxAmmo);
                            game.updateAmmoDisplay();
                            break;
                        }
                        case 'stamina': {
                            const regen = (10 + tier * 2) / 100;
                            const speedBuff = (3 + tier) / 100;
                            p.staminaRegenRate *= 1 + regen;
                            p.maxStamina *= 1 + regen;
                            p.stamina = Math.min(p.stamina, p.maxStamina);
                            game.zombieSpeed *= 1 + speedBuff;
                            break;
                        }
                        case 'coins': {
                            const coin = (12 + tier * 2) / 100;
                            const hpBuff = (4 + tier) / 100;
                            const coinUpgrade = u.upgrades.find(x => x.id === 'coins');
                            if (coinUpgrade) {
                                coinUpgrade.level += Math.max(1, Math.round(coinUpgrade.level * coin));
                            }
                            // buff existing zombies and future base zombieSpeed/health indirectly via wave scaling
                            game.zombies.forEach(z => {
                                z.maxHealth *= 1 + hpBuff;
                                z.health *= 1 + hpBuff;
                            });
                            game.zombieSpeed *= 1 + hpBuff * 0.25;
                            break;
                        }
                        case 'bomb': {
                            const bombDmg = (15 + tier * 3) / 100;
                            const cd = (8 + tier * 2) / 100;
                            const homingUpgrade = u.upgrades.find(x => x.id === 'homing');
                            if (homingUpgrade) homingUpgrade.level += 1;
                            game.bombCooldownMs = Math.floor(game.bombCooldownMs * (1 + cd));
                            // store a bomb damage multiplier on the game
                            if (!game.bombDamageMultiplier) game.bombDamageMultiplier = 1;
                            game.bombDamageMultiplier *= 1 + bombDmg;
                            break;
                        }
                    }
                }
            };
        };

        const rarities = ['common', 'common', 'rare', 'rare', 'epic', 'legendary'];
        const types = ['damage', 'health', 'reload', 'stamina', 'coins', 'bomb'];

        // 6 types * 20 tiers = 120 upgrades
        types.forEach(type => {
            for (let tier = 1; tier <= 20; tier++) {
                let rarity;
                if (tier <= 6) rarity = 'common';
                else if (tier <= 11) rarity = 'rare';
                else if (tier <= 17) rarity = 'epic';
                else rarity = 'legendary';

                pool.push(makeUpgrade(type, tier, rarity));
            }
        });

        return pool;
    }

    showAbilitySelect() {
        // pause gameplay until ability picked
        this.isPaused = true;

        // if overlay already exists, don't recreate
        let overlay = document.getElementById('abilitySelectOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'abilitySelectOverlay';
            overlay.className = 'abilities-overlay';
            overlay.innerHTML = `
                <div class="abilities-card">
                    <h1>Choose Your Starting Ability</h1>
                    <p>Pick exactly one starting ability. Each choice has strong pros and clear tradeoffs.</p>
                    <div class="abilities-grid">
                        ${this.startingAbilities.map(a => `
                            <label class="ability-option" data-id="${a.id}">
                                <input type="radio" name="startingAbility" value="${a.id}">
                                <div class="ability-content">
                                    <div class="ability-header">
                                        <span class="ability-name">${a.name}</span>
                                    </div>
                                    <div class="ability-pros-cons">
                                        <div class="pros">
                                            <span class="tag tag-pro">Pros</span>
                                            <ul>
                                                ${a.pros.map(p => `<li>${p}</li>`).join('')}
                                            </ul>
                                        </div>
                                        <div class="cons">
                                            <span class="tag tag-con">Cons</span>
                                            <ul>
                                                ${a.cons.map(c => `<li>${c}</li>`).join('')}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                    <div class="abilities-actions">
                        <button id="confirmAbilityButton" class="primary">Lock In Choice</button>
                    </div>
                </div>
            `;
            document.getElementById('gameContainer').appendChild(overlay);

            // click on card selects radio
            overlay.querySelectorAll('.ability-option').forEach(el => {
                el.addEventListener('click', (e) => {
                    const radio = el.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        this.selectedAbilityId = radio.value;
                        overlay.querySelectorAll('.ability-option').forEach(opt => opt.classList.remove('selected'));
                        el.classList.add('selected');
                        e.stopPropagation();
                    }
                });
            });

            const confirmBtn = overlay.querySelector('#confirmAbilityButton');
            confirmBtn.addEventListener('click', () => {
                if (!this.selectedAbilityId) return;
                const ability = this.startingAbilities.find(a => a.id === this.selectedAbilityId);
                if (!ability) return;
                ability.apply(this);
                this.abilityChosen = true;
                overlay.remove();
                // resume into instructions overlay next
                this.showInstructions();
            });
        }
    }

    showInstructions() {
        const overlay = document.getElementById('instructionsOverlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        // prevent game running until dismissed
        this.isPaused = true;
        // Attach handlers
        const startBtn = document.getElementById('startGameButton');
        const closeBtn = document.getElementById('viewControlsButton');
        const dismiss = () => {
            overlay.classList.add('hidden');
            // show thank you card briefly before unpausing
            this.showThankYouCard();
        };
        if (startBtn) startBtn.onclick = dismiss;
        if (closeBtn) closeBtn.onclick = dismiss;
    }

    // New: brief thank-you card shown when starting the game
    showThankYouCard(durationMs = 1400) {
        // create overlay
        let overlay = document.getElementById('thankYouOverlay');
        if (overlay) overlay.remove();
        overlay = document.createElement('div');
        overlay.id = 'thankYouOverlay';
        overlay.className = 'thank-you-overlay';
        overlay.innerHTML = `
            <div class="thank-you-card" role="status" aria-live="polite">
                <h2>Thank you for playing!</h2>
                <p>Good luck — survive the waves.</p>
            </div>
        `;
        document.getElementById('gameContainer').appendChild(overlay);

        // play quick "yay" when the card appears
        if (this.sounds && this.sounds.yay) {
            const y = this.sounds.yay.cloneNode();
            y.volume = 0.92;
            y.play().catch(()=>{});
        }

        // small entrance animation (fade in via CSS transform)
        overlay.querySelector('.thank-you-card').style.transform = 'scale(0.98)';
        overlay.querySelector('.thank-you-card').style.opacity = '0';
        requestAnimationFrame(() => {
            const card = overlay.querySelector('.thank-you-card');
            if (card) {
                card.style.transition = 'transform 220ms ease, opacity 220ms ease';
                card.style.transform = 'scale(1)';
                card.style.opacity = '1';
            }
        });

        setTimeout(() => {
            const ov = document.getElementById('thankYouOverlay');
            if (ov) ov.remove();
            // play start sound once when dismissing the card
            if (this.sounds && this.sounds.start) {
                const s = this.sounds.start.cloneNode();
                s.volume = 0.9;
                s.play().catch(()=>{});
            }
            this.isPaused = false;
            if (!this.animationFrameId) this.gameLoop();
        }, durationMs);
    }

    createWaveBreakOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'waveBreakOverlay';
        overlay.className = 'hidden';
        overlay.innerHTML = `
            <div class="wave-break-content">
                <h2>Wave Complete!</h2>
                <div class="wave-break-timer">5</div>
                <p>Next wave starting soon...</p>
            </div>
        `;
        document.getElementById('gameContainer').appendChild(overlay);
        
        // Ensure it doesn't overlap with other UI elements
        overlay.style.zIndex = '500';
    }

    createMobileControls() {
        // Mobile buttons removed to avoid duplicate shoot/reload controls.
        // Keep touch controls for simple tap/reload gestures.
        this.setupTouchControls();
    }

    setupTouchControls() {
        let touchStartX, touchStartY, touchStartTime;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const deltaTime = Date.now() - touchStartTime;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance < 30 && deltaTime < 200) {
                this.shoot();
            } else if (deltaY < -50 && Math.abs(deltaX) < 50) {
                this.reload();
            }
        }, { passive: false });
    }

    init() {
        this.shootButton.addEventListener('click', () => this.shoot());
        this.reloadButton.addEventListener('click', () => this.reload());
        this.bombButton.addEventListener('click', () => this.useHomingBomb());
        this.restartButton.addEventListener('click', () => this.restart());

        const autoToggle = document.getElementById('autoBombToggle');
        if (autoToggle) autoToggle.addEventListener('change', (e) => { this.autoBomb = e.target.checked; });

        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.shoot();
            }
            if (e.key === 'r' || e.key === 'R') {
                this.reload();
            }
            if (e.key === 'b' || e.key === 'B') {
                this.useHomingBomb();
            }
        });

        this.addShopButton();
        // start with difficulty selection, then ability selection after choice
        this.showDifficultySelect();
    }

    addShopButton() {
        const shopButton = document.getElementById('shopButton');
        shopButton.addEventListener('click', () => this.toggleShop());
    }

    toggleShop() {
        if (this.isPaused) {
            this.closeShop();
        } else {
            this.showShop();
        }
    }

    showShop() {
        this.isPaused = true;
        const shopOverlay = document.createElement('div');
        shopOverlay.id = 'shopOverlay';
        shopOverlay.className = 'shop-overlay';
        shopOverlay.innerHTML = this.generateShopHTML();
        document.getElementById('gameContainer').appendChild(shopOverlay);
    }

    generateShopHTML() {
        return `
            <h2 style="color: #FFD700; text-align: center; margin-bottom: 20px;">UPGRADE SHOP</h2>
            <p style="text-align: center; color: #FFD700; font-size: 20px; margin-bottom: 8px;">Coins: ${this.coins}</p>
            <p style="text-align: center; color: #66e0ff; font-size: 16px; margin-bottom: 20px;">Shards: ${this.shards}</p>
            <div id="upgradeOptions">
                ${this.upgradeSystem.getUpgradeOptions().map(upgrade => this.generateUpgradeHTML(upgrade)).join('')}
            </div>
            <h3 class="shard-section-title">Shard Tech Tree</h3>
            <div class="shard-balance">You have ${this.shards} shards.</div>
            <div class="shard-tree-grid">
                ${this.generateShardTreeHTML()}
            </div>
            <button onclick="game.closeShop()" class="close-shop-button">CLOSE SHOP</button>
        `;
    }

    // NEW: Render a single coin-based upgrade block for the shop
    generateUpgradeHTML(upgrade) {
        const maxed = upgrade.level >= upgrade.maxLevel;
        const canAfford = upgrade.canAfford(this.coins) && !maxed;
        const statusText = maxed
            ? 'Max level reached'
            : canAfford
                ? 'Ready to purchase'
                : 'Not enough coins';
        const btnLabel = maxed ? 'MAXED' : `BUY (${upgrade.cost})`;
        const btnDisabledAttr = canAfford ? '' : 'disabled';
        const btnColor = maxed ? '#4caf50' : (canAfford ? '#FFD700' : '#555');

        return `
            <div class="upgrade-item">
                <h3>
                    ${upgrade.name}
                    <span style="float:right;font-size:12px;color:#ccc;">
                        Lv ${upgrade.level}/${upgrade.maxLevel}
                    </span>
                </h3>
                <p>${upgrade.description}</p>
                <p style="font-size:13px;color:#aaa;margin-top:4px;">${statusText}</p>
                <button
                    class="upgrade-button"
                    style="background:${btnColor};color:${maxed ? '#fff' : '#000'};"
                    ${btnDisabledAttr}
                    onclick="game.purchaseUpgrade('${upgrade.id}')"
                >
                    ${btnLabel}
                </button>
            </div>
        `;
    }

    generateShardTreeHTML() {
        return this.shardTree.getNodes().map(node => {
            const purchased = node.purchased;
            const prereqsMet = this.shardTree.prereqsMet(node.id);
            const canAfford = this.shardTree.canAfford(this, node.id);
            const canBuy = this.shardTree.canPurchase(this, node.id);
            const statusText = purchased
                ? 'Unlocked'
                : (!prereqsMet ? 'Requires: ' + (node.prereqs || []).join(', ') : canAfford ? 'Ready to unlock' : 'Need more shards');
            const btnLabel = purchased ? 'OWNED' : `UNLOCK (${node.cost})`;
            const btnColor = purchased ? '#4caf50' : (canBuy ? '#66e0ff' : '#555');
            const disabledAttr = purchased || !canBuy ? 'disabled' : '';
            return `
                <div class="shard-node">
                    <div class="shard-node-header">
                        <span class="shard-node-name">${node.name}</span>
                        <span class="shard-node-tier">${node.branch} T${node.tier}</span>
                    </div>
                    <div class="shard-node-desc">${node.description}</div>
                    <div class="shard-node-meta">${statusText}</div>
                    <button style="background:${btnColor};color:#000;" ${disabledAttr}
                        onclick="game.purchaseShardNode('${node.id}')">${btnLabel}</button>
                </div>
            `;
        }).join('');
    }

    closeShop() {
        const shopOverlay = document.getElementById('shopOverlay');
        if (shopOverlay) {
            shopOverlay.remove();
        }
        this.isPaused = false;
    }

    purchaseUpgrade(upgradeId) {
        try {
            const upgrade = this.upgradeSystem.upgrades.find(u => u.id === upgradeId);
            if (upgrade && upgrade.canAfford(this.coins) && upgrade.level < upgrade.maxLevel) {
                this.coins -= upgrade.cost;
                upgrade.apply(this);
                this.closeShop();
                this.showShop();
                this.updateCoinDisplay();
                this.updateAmmoDisplay();
                this.updateHealthDisplay();
            }
        } catch (error) {
            this.handleError('Purchase failed: ' + error.message);
        }
    }

    purchaseShardNode(nodeId) {
        try {
            const success = this.shardTree.purchaseNode(this, nodeId);
            if (!success) return;
            this.closeShop();
            this.showShop();
            this.updateShardDisplay();
            this.updateAmmoDisplay();
            this.updateHealthDisplay();
        } catch (error) {
            this.handleError('Shard purchase failed: ' + error.message);
        }
    }

    shoot() {
        if (this.isPaused || !this.gameRunning) return;
        
        try {
            if (this.player.canShoot()) {
                this.player.shoot();
                this.updateAmmoDisplay();
                this.createMuzzleFlash();
                this.fireBullets();
                // play shoot sound (clone to allow overlap)
                if (this.sounds && this.sounds.shoot) {
                    const s = this.sounds.shoot.cloneNode();
                    s.volume = 0.7;
                    s.play().catch(()=>{});
                }
            }
        } catch (error) {
            this.handleError('Shoot failed: ' + error.message);
        }
    }

    useHomingBomb() {
        if (this.isPaused || !this.gameRunning) return;
        const now = performance.now();
        if (now - this.lastBombTime < this.bombCooldownMs) {
            // still cooling down
            return;
        }
        this.lastBombTime = now;

        // bomb damage scales with upgrade homing level
        const homingLevel = this.upgradeSystem.getHomingLevel();
        // base damage 6, each extra level adds 1.5 damage roughly
        const damage = 6 + (homingLevel - 1) * 1.5;
        const bomb = new HomingBomb(100, 300, damage, this);
        this.bombs.push(bomb);

        // visual & audio particles
        this.particleSystem.createMuzzleFlash(120, 300);
        this.createFloatingText(120, 260, 'BOMB!', '#ff8800');
        // update button UI quickly
        this.updateBombButtonState();
        // play bomb sound (clone to allow overlap)
        if (this.sounds && this.sounds.bomb) {
            const s = this.sounds.bomb.cloneNode();
            s.volume = 0.85;
            s.play().catch(()=>{});
        }
    }

    updateBombButtonState() {
        const now = performance.now();
        const remaining = Math.max(0, this.bombCooldownMs - (now - this.lastBombTime));
        if (remaining > 0) {
            this.bombButton.disabled = true;
            this.bombButton.textContent = `BOMB (${Math.ceil(remaining/1000*10)/10}s)`;
            this.bombButton.style.backgroundColor = '#666';
        } else {
            this.bombButton.disabled = false;
            this.bombButton.textContent = 'BOMB';
            this.bombButton.style.backgroundColor = '#ff8844';
        }
    }

    createMuzzleFlash() {
        this.particleSystem.createMuzzleFlash(100, 300);
        
        // Add shell casings
        for (let i = 0; i < 2; i++) {
            this.particleSystem.particles.push({
                x: 120,
                y: 290,
                vx: Math.random() * 3 + 2,
                vy: Math.random() * -3 - 1,
                life: 30,
                maxLife: 30,
                color: '#FFD700',
                size: 2,
                type: 'shell',
                gravity: 0.3
            });
        }
    }

    fireBullets() {
        const nearestZombie = this.findNearestZombie();
        const bulletCount = this.upgradeSystem.getBulletCount();
        const totalDamage = this.upgradeSystem.getDamage() * this.player.getDamage();
        
        // Distribute total damage across pellets so total damage remains balanced
        const damagePerPellet = Math.max(0.5, totalDamage / bulletCount);

        // Determine central aim angle toward nearest zombie or default aim
        let centerAngle = Math.atan2(0, 1); // default right
        if (nearestZombie) {
            const targetY = nearestZombie.y;
            centerAngle = Math.atan2(targetY - 300, 700 - 100);
        } else {
            centerAngle = Math.atan2((300) - 300, 700 - 100); // straight right (0)
        }

        // Spread increases slightly with pellet count
        const baseSpread = 0.25; // radians (wider spread)
        const spreadFactor = baseSpread * Math.min(1.8, 1 + (bulletCount - 8) * 0.02);

        for (let i = 0; i < bulletCount; i++) {
            // Evenly distribute pellets across the spread with small randomness
            const t = bulletCount === 1 ? 0.5 : i / (bulletCount - 1);
            const offset = (t - 0.5) * 2; // -1 .. 1
            const randomJitter = (Math.random() - 0.5) * 0.12;
            const angle = centerAngle + offset * spreadFactor + randomJitter;
            this.bullets.push(new Bullet(100, 300, 12 + Math.random() * 1.5, angle, damagePerPellet));
        }

        // Spawn a visible shotgun shell casing that falls to the ground for visual realism
        // single prominent shell per shot; uses particleSystem 'shell' behavior (gravity handled there)
        this.particleSystem.particles.push({
            x: 120 + (Math.random() - 0.5) * 8,
            y: 290 + (Math.random() - 0.5) * 6,
            vx: Math.random() * 2 + 1.5,           // ejected to the right
            vy: -Math.random() * 2 - 1.5,          // initial upward toss
            life: 160,
            maxLife: 160,
            color: '#c7a04b',
            size: 5,
            type: 'shell',
            gravity: 0.45
        });
    }

    reload() {
        if (this.isPaused || !this.gameRunning) return;
        
        try {
            if (this.player.reload()) {
                this.updateAmmoDisplay();
                // play reload sound (clone to allow overlap)
                if (this.sounds && this.sounds.reload) {
                    const s = this.sounds.reload.cloneNode();
                    s.volume = 0.7;
                    s.play().catch(()=>{});
                }
            }
        } catch (error) {
            this.handleError('Reload failed: ' + error.message);
        }
    }

    updateAmmoDisplay() {
        this.ammoElement.textContent = `${this.player.ammo}/${this.player.maxAmmo}`;
        
        if (this.player.reloading) {
            this.updateButtonState('RELOADING...', true, '#666', true, '#666');
        } else if (this.player.canShoot()) {
            this.updateButtonState('SHOOT', false, '#ff4444', false, '#44ff44');
        } else {
            this.updateButtonState('NO AMMO', true, '#666', false, '#44ff44');
        }
        
        // Remove duplicate ammo display updates
        if (this.player.reloading) {
            this.shootButton.textContent = 'RELOADING...';
            this.shootButton.disabled = true;
        } else if (this.player.canShoot()) {
            this.shootButton.textContent = 'SHOOT';
            this.shootButton.disabled = false;
        } else {
            this.shootButton.textContent = 'NO AMMO';
            this.shootButton.disabled = true;
        }
    }

    updateButtonState(shootText, shootDisabled, shootColor, reloadDisabled, reloadColor) {
        this.shootButton.textContent = shootText;
        this.shootButton.disabled = shootDisabled;
        this.shootButton.style.backgroundColor = shootColor;
        this.reloadButton.disabled = reloadDisabled;
        this.reloadButton.style.backgroundColor = reloadColor;
    }

    updateHealthDisplay() {
        this.healthElement.textContent = `${this.player.health}/${this.player.maxHealth}`;
        this.healthElement.parentElement.style.color = this.player.invulnerable ? '#ffaaaa' : '#ff4444';
        
        // Remove duplicate health bar drawing in drawUI method
        // Remove duplicate wave progress drawing
    }

    updateCoinDisplay() {
        this.coinsElement.textContent = this.coins;
    }

    updateShardDisplay() {
        if (this.shardsElement) {
            this.shardsElement.textContent = this.shards;
        }
    }

    spawnZombie() {
        const y = 100 + Math.random() * 400;
        const zombieType = this.getRandomZombieType();
        const zombieConfigs = {
            runner: { speed: this.zombieSpeed * 1.9, health: 1 },
            fast: { speed: this.zombieSpeed * 1.4, health: 1 },
            normal: { speed: this.zombieSpeed, health: 1 },
            crawler: { speed: this.zombieSpeed * 0.5, health: 1 },
            spitter: { speed: this.zombieSpeed * 0.8, health: 1 },
            exploder: { speed: this.zombieSpeed * 0.6, health: 2 },
            tank: { speed: this.zombieSpeed * 0.7, health: 3 },
            armored: { speed: this.zombieSpeed * 0.75, health: 2 },
            healer: { speed: this.zombieSpeed * 0.6, health: 2 },
            screecher: { speed: this.zombieSpeed * 0.85, health: 1 },
            brute: { speed: this.zombieSpeed * 0.5, health: 12 },
            necromancer: { speed: this.zombieSpeed * 0.5, health: 10 },
            stalker: { speed: this.zombieSpeed * 1.1, health: 1 },
            acid: { speed: this.zombieSpeed * 0.9, health: 2 },
            mutant: { speed: this.zombieSpeed * 0.8, health: 4 },
            vomiter: { speed: this.zombieSpeed * 0.7, health: 2 },
            shielder: { speed: this.zombieSpeed * 0.6, health: 3 },
            kamikaze: { speed: this.zombieSpeed * 1.3, health: 1 },
            phaser: { speed: this.zombieSpeed * 1.0, health: 2 },
            leaper: { speed: this.zombieSpeed * 1.6, health: 1 },
            mimic: { speed: this.zombieSpeed * 0.9, health: 2 },
            frost: { speed: this.zombieSpeed * 0.6, health: 2 },
            electro: { speed: this.zombieSpeed * 0.85, health: 2 },
            swarm: { speed: this.zombieSpeed * 1.3, health: 1 },
            razor: { speed: this.zombieSpeed * 1.0, health: 2 },
            ghost: { speed: this.zombieSpeed * 1.1, health: 1 },
            juggernaut: { speed: this.zombieSpeed * 0.5, health: 6 },
            bomber: { speed: this.zombieSpeed * 1.2, health: 1 },
            behemoth: { speed: this.zombieSpeed * 0.35, health: 45 }
        };
        
        const baseConfig = zombieConfigs[zombieType] || zombieConfigs['normal'];
        // Apply difficulty health multiplier if present
        const health = Math.max(1, Math.round((baseConfig.health || 1) * (this._zombieHealthMul || 1)));
        const speed = baseConfig.speed;
        const z = new Zombie(this.canvas.width, y, speed, zombieType, health);
        // pass game reference for special behaviors (healer, necromancer)
        z.gameRef = this;
        this.zombies.push(z);
    }

    getRandomZombieType() {
        const random = Math.random();
        // Increased variety and special spawns as waves progress; include rare boss chance
        const bossChance = Math.min(0.02 + this.waveNumber * 0.002, 0.12); // scales with wave, caps at 12%
        if (random < bossChance && this.waveNumber > 2) {
            // pick a boss type (include behemoth as very rare)
            const pick = Math.random();
            if (pick < 0.15) return 'brute';
            if (pick < 0.35) return 'necromancer';
            if (pick < 0.5) return 'behemoth';
            return Math.random() < 0.5 ? 'brute' : 'necromancer';
        }

        if (this.waveNumber > 8) {
            if (random < 0.12) return 'runner';
            if (random < 0.22) return 'fast';
            if (random < 0.30) return 'spitter';
            if (random < 0.36) return 'crawler';
            if (random < 0.44) return 'exploder';
            if (random < 0.50) return 'armored';
            if (random < 0.56) return 'healer';
            if (random < 0.62) return 'screecher';
            if (random < 0.68) return 'tank';
            if (random < 0.72) return 'stalker';
            if (random < 0.76) return 'acid';
            if (random < 0.80) return 'vomiter';
            if (random < 0.84) return 'kamikaze';
            if (random < 0.88) return 'phaser';
            if (random < 0.91) return 'leaper';
            if (random < 0.94) return 'mimic';
            if (random < 0.96) return 'frost';
            if (random < 0.98) return 'electro';
            if (random < 0.99) return 'swarm';
            return 'mutant';
        } else if (this.waveNumber > 5) {
            if (random < 0.10) return 'runner';
            if (random < 0.18) return 'fast';
            if (random < 0.24) return 'spitter';
            if (random < 0.30) return 'crawler';
            if (random < 0.36) return 'exploder';
            if (random < 0.42) return 'armored';
            if (random < 0.48) return 'healer';
            if (random < 0.52) return 'screecher';
            if (random < 0.56) return 'tank';
            if (random < 0.59) return 'stalker';
            if (random < 0.62) return 'acid';
            if (random < 0.65) return 'vomiter';
            if (random < 0.68) return 'kamikaze';
            if (random < 0.71) return 'phaser';
            if (random < 0.74) return 'leaper';
            if (random < 0.77) return 'razor';
            if (random < 0.80) return 'ghost';
            return 'mutant';
        } else if (this.waveNumber > 2) {
            if (random < 0.08) return 'fast';
            if (random < 0.12) return 'crawler';
            if (random < 0.16) return 'spitter';
            if (random < 0.18) return 'runner';
            if (random < 0.21) return 'exploder';
            if (random < 0.24) return 'armored';
            if (random < 0.26) return 'stalker';
            if (random < 0.28) return 'acid';
            if (random < 0.30) return 'healer';
            if (random < 0.32) return 'screecher';
            if (random < 0.34) return 'tank';
            if (random < 0.36) return 'vomiter';
            if (random < 0.38) return 'kamikaze';
            if (random < 0.40) return 'phaser';
        }
        return 'normal';
    }

    spawnPowerUp() {
        if (Math.random() < 0.03 && this.powerUps.length < 2) {
            const types = ['ammo', 'health', 'coins', 'damage'];
            const type = types[Math.floor(Math.random() * types.length)];
            const x = 200 + Math.random() * 400;
            const y = 150 + Math.random() * 300;
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    handleWaveLogic() {
        if (!this.waveActive) {
            return;
        }

        if (this.zombiesKilledInWave >= this.zombiesInWave && this.zombies.length === 0) {
            this.onWaveComplete();
            return;
        }

        this.zombieSpawnTimer++;
        if (this.zombieSpawnTimer >= this.zombieSpawnInterval) {
            this.spawnZombie();
            this.zombieSpawnTimer = 0;
        }
    }

    onWaveComplete() {
        this.waveActive = false;
        this.isPaused = true;
        this.waveBreakTimer = 0;
        const overlay = document.getElementById('waveBreakOverlay');
        if (overlay) overlay.classList.add('hidden');
        this.showWaveUpgradeSelect();
    }

    showWaveUpgradeSelect() {
        const container = document.getElementById('gameContainer');
        if (!container) return;

        // pick 3 random upgrades from pool
        const choices = [];
        const usedIndices = new Set();
        while (choices.length < 3 && usedIndices.size < this.waveUpgradePool.length) {
            const idx = Math.floor(Math.random() * this.waveUpgradePool.length);
            if (!usedIndices.has(idx)) {
                usedIndices.add(idx);
                choices.push(this.waveUpgradePool[idx]);
            }
        }
        this.lastWaveUpgradeChoices = choices;

        let overlay = document.getElementById('waveUpgradeOverlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'waveUpgradeOverlay';
        overlay.className = 'abilities-overlay';
        overlay.innerHTML = `
            <div class="abilities-card">
                <h1>Wave Reward Upgrades</h1>
                <p>Choose one upgrade. Each option has a rarity and a trade-off that will shape your run.</p>
                <div class="abilities-grid">
                    ${choices.map(u => `
                        <label class="ability-option" data-id="${u.id}">
                            <input type="radio" name="waveUpgrade" value="${u.id}">
                            <div class="ability-content">
                                <div class="ability-header">
                                    <span class="ability-name">${u.name}</span>
                                    <span class="tag" style="background:${this.getRarityColor(u.rarity)};color:#000;">
                                        ${u.rarityLabel}
                                    </span>
                                </div>
                                <div class="ability-pros-cons">
                                    <div class="pros">
                                        <span class="tag tag-pro">Pros</span>
                                        <ul>
                                            ${u.pros.map(p => `<li>${p}</li>`).join('')}
                                        </ul>
                                    </div>
                                    <div class="cons">
                                        <span class="tag tag-con">Cons</span>
                                        <ul>
                                            ${u.cons.map(c => `<li>${c}</li>`).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </label>
                    `).join('')}
                </div>
                <div class="abilities-actions">
                    <button id="confirmWaveUpgradeButton" class="primary">Take Upgrade & Continue</button>
                </div>
            </div>
        `;
        container.appendChild(overlay);

        // selection behavior
        let selectedId = null;
        overlay.querySelectorAll('.ability-option').forEach(el => {
            el.addEventListener('click', (e) => {
                const radio = el.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    selectedId = radio.value;
                    overlay.querySelectorAll('.ability-option').forEach(opt => opt.classList.remove('selected'));
                    el.classList.add('selected');
                    e.stopPropagation();
                }
            });
        });

        const confirmBtn = overlay.querySelector('#confirmWaveUpgradeButton');
        confirmBtn.addEventListener('click', () => {
            if (!selectedId) return;
            const chosen = this.waveUpgradePool.find(u => u.id === selectedId);
            if (chosen && typeof chosen.apply === 'function') {
                chosen.apply(this);
            }
            overlay.remove();
            this.isPaused = false;
            this.startNewWave();
        });
    }

    getRarityColor(rarity) {
        switch (rarity) {
            case 'common': return '#b0b0b0';
            case 'rare': return '#4ea5ff';
            case 'epic': return '#c266ff';
            case 'legendary': return '#ffcc33';
            default: return '#888888';
        }
    }

    startNewWave() {
        this.waveNumber++;
        // Bigger waves: scale faster so later waves become significantly larger
        // Apply difficulty wave size multiplier if set
        const baseCount = 15 + this.waveNumber * 6;
        const mul = this._waveSizeMul || 1;
        this.zombiesInWave = Math.max(6, Math.round(baseCount * mul));
        this.zombiesKilledInWave = 0;
        this.waveActive = true;
        // Spawn interval shortens with waves to increase pressure
        this.zombieSpawnInterval = Math.max(12, Math.floor((90 - this.waveNumber * 6) * (1 / (this._waveSizeMul || 1))));
        // base speed
        let speedBase = 0.6 + this.waveNumber * 0.12;
        if (this.richKidChosen && this.waveNumber > 1) {
            speedBase *= 1.1; // Rich Kid slight global speed penalty
        }
        // apply difficulty speed multiplier
        speedBase *= (this.difficultyPresets[this.difficulty]?.zombieSpeedMul || 1);
        this.zombieSpeed = Math.min(2.6, speedBase);
         
        const bonusCoins = Math.max(0, Math.round(this.waveNumber * 10 * (1 / (this.difficultyPresets[this.difficulty]?.waveSizeMul || 1))));
        this.coins += bonusCoins;
        this.createFloatingText(400, 300, `WAVE ${this.waveNumber} COMPLETE!`, '#FFD700');
        this.createFloatingText(400, 330, `+${bonusCoins} COINS BONUS`, '#FFD700');
        this.updateCoinDisplay();
         
        document.getElementById('waveBreakOverlay').classList.add('hidden');
    }

    update() {
        if (this.isPaused || !this.gameRunning) return;

        // Auto-bomb: if enabled and cooldown ready and zombies present, fire automatically
        if (this.autoBomb && this.zombies.length > 0) {
            const now = performance.now();
            if (now - this.lastBombTime >= this.bombCooldownMs) {
                this.useHomingBomb();
            }
        }

        this.handleWaveLogic();
        this.spawnPowerUp();
        this.player.update();
        this.updateAmmoDisplay();
        this.updateHealthDisplay();

        // Update game objects
        this.updateZombies();
        this.updateBullets();
        this.updateBombs();
        this.updateCollisions();
        this.updatePowerUps();
        this.particleSystem.update();

        if (this.player.health <= 0) {
            this.gameOver();
        }

        // Update bomb button state each tick
        this.updateBombButtonState();
    }

    updateBombs() {
        this.bombs = this.bombs.filter(b => {
            b.update();
            return !b.exploded;
        });
    }

    handleWaveLogic() {
        if (!this.waveActive) {
            return;
        }

        if (this.zombiesKilledInWave >= this.zombiesInWave && this.zombies.length === 0) {
            this.onWaveComplete();
            return;
        }

        this.zombieSpawnTimer++;
        if (this.zombieSpawnTimer >= this.zombieSpawnInterval) {
            this.spawnZombie();
            this.zombieSpawnTimer = 0;
        }
    }

    onWaveComplete() {
        this.waveActive = false;
        this.isPaused = true;
        this.waveBreakTimer = 0;
        const overlay = document.getElementById('waveBreakOverlay');
        if (overlay) overlay.classList.add('hidden');
        this.showWaveUpgradeSelect();
    }

    showWaveUpgradeSelect() {
        const container = document.getElementById('gameContainer');
        if (!container) return;

        // pick 3 random upgrades from pool
        const choices = [];
        const usedIndices = new Set();
        while (choices.length < 3 && usedIndices.size < this.waveUpgradePool.length) {
            const idx = Math.floor(Math.random() * this.waveUpgradePool.length);
            if (!usedIndices.has(idx)) {
                usedIndices.add(idx);
                choices.push(this.waveUpgradePool[idx]);
            }
        }
        this.lastWaveUpgradeChoices = choices;

        let overlay = document.getElementById('waveUpgradeOverlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'waveUpgradeOverlay';
        overlay.className = 'abilities-overlay';
        overlay.innerHTML = `
            <div class="abilities-card">
                <h1>Wave Reward Upgrades</h1>
                <p>Choose one upgrade. Each option has a rarity and a trade-off that will shape your run.</p>
                <div class="abilities-grid">
                    ${choices.map(u => `
                        <label class="ability-option" data-id="${u.id}">
                            <input type="radio" name="waveUpgrade" value="${u.id}">
                            <div class="ability-content">
                                <div class="ability-header">
                                    <span class="ability-name">${u.name}</span>
                                    <span class="tag" style="background:${this.getRarityColor(u.rarity)};color:#000;">
                                        ${u.rarityLabel}
                                    </span>
                                </div>
                                <div class="ability-pros-cons">
                                    <div class="pros">
                                        <span class="tag tag-pro">Pros</span>
                                        <ul>
                                            ${u.pros.map(p => `<li>${p}</li>`).join('')}
                                        </ul>
                                    </div>
                                    <div class="cons">
                                        <span class="tag tag-con">Cons</span>
                                        <ul>
                                            ${u.cons.map(c => `<li>${c}</li>`).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </label>
                    `).join('')}
                </div>
                <div class="abilities-actions">
                    <button id="confirmWaveUpgradeButton" class="primary">Take Upgrade & Continue</button>
                </div>
            </div>
        `;
        container.appendChild(overlay);

        // selection behavior
        let selectedId = null;
        overlay.querySelectorAll('.ability-option').forEach(el => {
            el.addEventListener('click', (e) => {
                const radio = el.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    selectedId = radio.value;
                    overlay.querySelectorAll('.ability-option').forEach(opt => opt.classList.remove('selected'));
                    el.classList.add('selected');
                    e.stopPropagation();
                }
            });
        });

        const confirmBtn = overlay.querySelector('#confirmWaveUpgradeButton');
        confirmBtn.addEventListener('click', () => {
            if (!selectedId) return;
            const chosen = this.waveUpgradePool.find(u => u.id === selectedId);
            if (chosen && typeof chosen.apply === 'function') {
                chosen.apply(this);
            }
            overlay.remove();
            this.isPaused = false;
            this.startNewWave();
        });
    }

    getRarityColor(rarity) {
        switch (rarity) {
            case 'common': return '#b0b0b0';
            case 'rare': return '#4ea5ff';
            case 'epic': return '#c266ff';
            case 'legendary': return '#ffcc33';
            default: return '#888888';
        }
    }

    startNewWave() {
        this.waveNumber++;
        // Bigger waves: scale faster so later waves become significantly larger
        // Apply difficulty wave size multiplier if set
        const baseCount = 15 + this.waveNumber * 6;
        const mul = this._waveSizeMul || 1;
        this.zombiesInWave = Math.max(6, Math.round(baseCount * mul));
        this.zombiesKilledInWave = 0;
        this.waveActive = true;
        // Spawn interval shortens with waves to increase pressure
        this.zombieSpawnInterval = Math.max(12, Math.floor((90 - this.waveNumber * 6) * (1 / (this._waveSizeMul || 1))));
        // base speed
        let speedBase = 0.6 + this.waveNumber * 0.12;
        if (this.richKidChosen && this.waveNumber > 1) {
            speedBase *= 1.1; // Rich Kid slight global speed penalty
        }
        // apply difficulty speed multiplier
        speedBase *= (this.difficultyPresets[this.difficulty]?.zombieSpeedMul || 1);
        this.zombieSpeed = Math.min(2.6, speedBase);
         
        const bonusCoins = Math.max(0, Math.round(this.waveNumber * 10 * (1 / (this.difficultyPresets[this.difficulty]?.waveSizeMul || 1))));
        this.coins += bonusCoins;
        this.createFloatingText(400, 300, `WAVE ${this.waveNumber} COMPLETE!`, '#FFD700');
        this.createFloatingText(400, 330, `+${bonusCoins} COINS BONUS`, '#FFD700');
        this.updateCoinDisplay();
         
        document.getElementById('waveBreakOverlay').classList.add('hidden');
    }

    updateZombies() {
        const playerX = 100;
        const playerY = 300;

        this.zombies.forEach((zombie, zIndex) => {
            // Slight idle vertical movement
            zombie.y += Math.sin(Date.now() * 0.001 + zombie.x * 0.01) * 0.5;

            // If staggered, reduce forward movement
            if (zombie.staggerTimer > 0) {
                zombie.x -= zombie.speed * 0.5;
                zombie.staggerTimer--;
            } else {
                // Move toward player position (both X and Y) for more realistic pursuit
                const dx = playerX - zombie.x;
                const dy = playerY - zombie.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                // Normalized direction
                const nx = dx / dist;
                const ny = dy / dist;
                // Advance zombie toward player
                zombie.x += nx * zombie.speed;
                zombie.y += ny * zombie.speed * 0.6; // less vertical speed so they don't jitter too much
            }

            // Update internal zombie state
            zombie.update();

            // Check collision with player and apply damage
            const pdx = zombie.x - playerX;
            const pdy = zombie.y - playerY;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            const hitDistance = Math.max(zombie.width, zombie.height) * 0.5 + 18; // player hit radius ~18

            if (pdist < hitDistance) {
                // Kamikaze: explode on player contact dealing larger damage in AOE
                if (zombie.type === 'kamikaze') {
                    // kamikaze explode: apply immediate damage to player and nearby zombies (visual)
                    const dmg = 3;
                    this.player.takeDamage(dmg);
                    // create gore/flash
                    this.particleSystem.createBlood(zombie.x, zombie.y, 'mutant');
                    this.createFloatingText(playerX, playerY - 20, `-${dmg} HP`, '#ff8844');
                    // remove kamikaze
                    const idxk = this.zombies.indexOf(zombie);
                    if (idxk !== -1) this.zombies.splice(idxk, 1);
                    return;
                }

                // Attempt to damage player (respects invulnerability)
                const damaged = this.player.takeDamage(zombie.type === 'tank' ? 2 : 1);
                if (damaged) {
                    // Pain Dampeners shard node: restore stamina and stagger nearby zombies
                    if (this._painDampeners) {
                        this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 10);
                        this.zombies.forEach(z => {
                            const d = Math.hypot(z.x - playerX, z.y - playerY);
                            if (d < 90) z.staggerTimer = Math.max(z.staggerTimer, 10);
                        });
                    }

                    // Visual feedback: blood, floating text and stagger the zombie
                    this.particleSystem.createBlood(playerX + Math.random() * 10 - 5, playerY + Math.random() * 10 - 5, zombie.type);
                    this.createFloatingText(playerX, playerY - 20, `-${zombie.type === 'tank' ? 2 : 1} HP`, '#ff4444');
                    zombie.staggerTimer = 30;
                    // Bounce zombie back a bit to avoid instant repeated hits
                    zombie.x -= 30;
                    // Update health UI immediately
                    this.updateHealthDisplay();
                }
            }
        });
    }

    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            bullet.y += bullet.drop * bullet.distanceTravelled * 0.001;
            return bullet.x < this.canvas.width + 50 && bullet.lifetime > 0;
        });
    }

    updateCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            let hit = false;
            
            for (let j = this.zombies.length - 1; j >= 0; j--) {
                const zombie = this.zombies[j];
                if (bullet.collidesWith(zombie)) {
                    this.handleZombieHit(zombie, bullet, j);
                    hit = true;
                    break;
                }
            }
            if (hit) {
                this.bullets.splice(i, 1);
            }
        }
    }

    handleZombieHit(zombie, bullet, zIndex) {
        let dmg = bullet.damage;

        // Apply crits from shard tree if present
        if (this._critChance && Math.random() < this._critChance) {
            const mult = this._critMultiplier || 2;
            dmg *= mult;
            this.createFloatingText(zombie.x, zombie.y - 30, 'CRIT!', '#ff88ff');
        }

        zombie.health -= dmg;
        zombie.staggerTimer = 5;
        this.particleSystem.createBlood(zombie.x, zombie.y, zombie.type);
        
        // Add impact sparks
        for (let k = 0; k < 3; k++) {
            this.particleSystem.particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 15,
                maxLife: 15,
                color: '#ffff00',
                size: 1,
                type: 'spark'
            });
        }
        
        if (zombie.health <= 0) {
            this.killZombie(zombie, zIndex);

            // Adrenaline Loop shard node: track rapid kills for ammo refund
            if (this._adrenalineLoop) {
                const now = performance.now();
                if (!this._loopKillWindow || now - this._loopKillWindow > 6000) {
                    this._loopKillWindow = now;
                    this._loopKillCount = 1;
                } else {
                    this._loopKillCount = (this._loopKillCount || 0) + 1;
                    if (this._loopKillCount >= 5) {
                        this._loopKillCount = 0;
                        if (this.player.ammo < this.player.maxAmmo) {
                            this.player.ammo += 1;
                            this.createFloatingText(100, 270, '+1 AMMO (Loop)', '#66ff88');
                            this.updateAmmoDisplay();
                        }
                    }
                }
            }

            // play hit/kill sound
            if (this.sounds && this.sounds.hit) {
                const s = this.sounds.hit.cloneNode();
                s.volume = 0.8;
                s.play().catch(()=>{});
            }
        }
    }

    killZombie(zombie, index) {
        this.particleSystem.createBlood(zombie.x, zombie.y, zombie.type);
        
        if (zombie.type === 'tank') {
            for (let k = 0; k < 5; k++) {
                this.particleSystem.particles.push({
                    x: zombie.x,
                    y: zombie.y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10 - 3,
                    life: 60,
                    maxLife: 60,
                    color: '#4B0000',
                    size: Math.random() * 6 + 3,
                    type: 'gore'
                });
            }
        }
        
        this.zombies.splice(index, 1);
        const points = zombie.type === 'tank' ? 30 : zombie.type === 'fast' ? 20 : 10;
        const coinReward = Math.floor((zombie.type === 'tank' ? 5 : zombie.type === 'fast' ? 3 : 1) * this.upgradeSystem.getCoinMultiplier());
        
        this.score += points;
        this.coins += coinReward;
        this.zombiesKilledInWave++;
        
        this.createFloatingText(zombie.x, zombie.y - 20, `+${points}`, '#ffff00');
        this.createFloatingText(zombie.x, zombie.y + 10, `+${coinReward}`, '#FFD700');

        // 30% base chance to drop a shard, modified by shard-drop bonuses
        let shardChance = 0.30 + (this._shardDropBonus || 0);
        // Slightly higher shard chance for tank / boss variants
        if (zombie.type === 'tank' || zombie.isBoss || zombie.isBehemoth) {
            shardChance += 0.1;
        }
        if (Math.random() < shardChance) {
            this.shards += 1;
            this.createFloatingText(zombie.x, zombie.y - 40, '+1 SHARD', '#66e0ff');
        }
        
        this.scoreElement.textContent = this.score;
        this.updateCoinDisplay();
        this.updateShardDisplay();
    }

    updatePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update();
            
            const dx = powerUp.x - 100;
            const dy = powerUp.y - 300;
            if (Math.sqrt(dx*dx + dy*dy) < 40) {
                powerUp.apply(this);
                return false;
            }
            
            return powerUp.life > 0;
        });
    }

    draw() {
        this.clearCanvas();
        this.drawBackground();
        this.drawPlayer();
        this.drawGameObjects();
        this.drawUI();
    }

    clearCanvas() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Sky gradient (night -> ember)
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#1a0b0b');
        skyGrad.addColorStop(0.45, '#2b0f05');
        skyGrad.addColorStop(0.75, '#3a0f07');
        skyGrad.addColorStop(1, '#200000');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, w, h);

        // Distant haze of embers (soft radial)
        const emberRad = Math.max(w, h) * 0.9;
        const emberGrad = this.ctx.createRadialGradient(w * 0.8, h * 0.6, 0, w * 0.8, h * 0.6, emberRad);
        emberGrad.addColorStop(0, 'rgba(255,120,20,0.12)');
        emberGrad.addColorStop(0.4, 'rgba(255,80,10,0.05)');
        emberGrad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = emberGrad;
        this.ctx.fillRect(0, 0, w, h);

        // Procedural animated flame layers across bottom
        const time = Date.now() * 0.002;
        const layers = [
            {amp: 28, freq: 0.008, speed: 0.9, hue: 24, alpha: 0.95, yOff: 1.0},
            {amp: 44, freq: 0.006, speed: 1.1, hue: 14, alpha: 0.55, yOff: 0.9},
            {amp: 68, freq: 0.004, speed: 0.7, hue: 8, alpha: 0.35, yOff: 0.78}
        ];

        for (let li = 0; li < layers.length; li++) {
            const L = layers[li];
            const pathY = h - 40 * L.yOff;
            this.ctx.save();
            // soft glow fill using gradient
            const g = this.ctx.createLinearGradient(0, pathY - L.amp * 1.4, 0, h);
            g.addColorStop(0, `rgba(255,${150 - li*20},${20 + li*10},${L.alpha})`);
            g.addColorStop(0.6, `rgba(200,60,20,${L.alpha * 0.4})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = g;

            this.ctx.beginPath();
            this.ctx.moveTo(0, h);
            // draw smooth sin-wave flame top
            const segments = 24;
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const x = t * w;
                const noise = Math.sin((x * L.freq) + time * L.speed) + 0.6 * Math.sin((x * L.freq * 2.3) - time * L.speed * 0.6);
                const y = pathY - noise * L.amp;
                this.ctx.lineTo(x, y);
            }
            this.ctx.lineTo(w, h);
            this.ctx.closePath();
            this.ctx.fill();

            // Add a soft top highlight stroke to emphasize flicker
            this.ctx.lineWidth = 1.2;
            this.ctx.strokeStyle = `rgba(255,${200 - li*30},${60 - li*10},${0.12 + li*0.05})`;
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Foreground ground strip (charred) with subtle ember particles
        this.ctx.fillStyle = '#0f0f0f';
        this.ctx.fillRect(0, h - 50, w, 50);

        // tiny embers floating up
        for (let i = 0; i < 12; i++) {
            const px = (i * 97 + (Date.now() * 0.03 % w)) % w;
            const py = h - 20 - (Math.sin(Date.now() * 0.002 + i) * 8 + (i * 4));
            const alpha = 0.2 + (Math.sin(Date.now() * 0.004 + i) + 1) * 0.12;
            const rad = 1 + (i % 3);
            const g2 = this.ctx.createRadialGradient(px, py, 0, px, py, 10);
            g2.addColorStop(0, `rgba(255,${160 + (i%3)*20},0,${alpha})`);
            g2.addColorStop(1, 'rgba(255,120,20,0)');
            this.ctx.fillStyle = g2;
            this.ctx.beginPath();
            this.ctx.arc(px, py, rad + 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawPlayer() {
        // delegate complex player rendering to modular player model for clarity and easier updates
        drawPlayerModel(this);
    }

    drawGameObjects() {
        this.zombies.forEach(zombie => zombie.draw(this.ctx));
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
        this.bombs.forEach(b => b.draw(this.ctx));
        this.particleSystem.draw(this.ctx);
    }

    drawUI() {
        this.waveElement.textContent = this.waveNumber;
        this.coinsElement.textContent = this.coins;
        
        // Remove duplicate wave progress drawing since it's already handled elsewhere
        // Remove duplicate countdown display
    }

    drawWaveProgress() {
        const progressWidth = 200;
        const progressHeight = 10;
        const progress = this.zombiesKilledInWave / this.zombiesInWave;
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(400 - progressWidth/2, 550, progressWidth, progressHeight);
        
        const gradient = this.ctx.createLinearGradient(400 - progressWidth/2, 0, 400 + progressWidth/2, 0);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(progress, '#00ff00');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(400 - progressWidth/2, 550, progressWidth * progress, progressHeight);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(400 - progressWidth/2, 550, progressWidth, progressHeight);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Wave ${this.waveNumber}: ${this.zombiesKilledInWave}/${this.zombiesInWave}`, 400, 540);
    }

    gameLoop() {
        try {
            if (!this.isPaused) {
                this.update();
            }
            this.draw();
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            this.handleError('Game loop error: ' + error.message);
        }
    }

    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.remove('hidden');
    }

    restart() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Reset game state
        Object.assign(this, {
            score: 0,
            coins: 0,
            shards: 0,
            zombies: [],
            bullets: [],
            bombs: [],
            powerUps: [],
            zombieSpawnTimer: 0,
            zombieSpawnInterval: 120,
            zombieSpeed: 0.5,
            waveNumber: 1,
            zombiesInWave: 10,
            zombiesKilledInWave: 0,
            waveActive: true,
            gameRunning: true,
            isPaused: false,
            player: new Player(),
            upgradeSystem: new UpgradeSystem(),
            shardTree: new ShardUpgradeTree(),
            lastBombTime: -99999
        });

        // Wave upgrade system reset
        this.waveUpgradePool = this.createWaveUpgradePool();
        this.lastWaveUpgradeChoices = [];

        // Update UI
        this.scoreElement.textContent = this.score;
        this.updateAmmoDisplay();
        this.updateHealthDisplay();
        this.updateCoinDisplay();
        this.updateShardDisplay();
        this.gameOverElement.classList.add('hidden');
        document.getElementById('waveBreakOverlay').classList.add('hidden');

        this.gameLoop();
    }

    findNearestZombie() {
        if (this.zombies.length === 0) return null;
        
        return this.zombies.reduce((nearest, zombie) => {
            const distance = Math.abs(zombie.x - 100) + Math.abs(zombie.y - 300);
            const nearestDistance = Math.abs(nearest.x - 100) + Math.abs(nearest.y - 300);
            return distance < nearestDistance ? zombie : nearest;
        });
    }

    createFloatingText(x, y, text, color) {
        this.particleSystem.createFloatingText(x, y, text, color);
    }

    // Helper: draw rounded rectangle path (does not fill/stroke by itself if you want to chain)
    roundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w/2, h/2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // Helper: slightly darken or lighten a hex color by factor (-1..1)
    shadeColor(hex, percent) {
        try {
            const c = hex.replace('#','');
            const num = parseInt(c,16);
            let r = (num >> 16) + Math.round(255 * percent);
            let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
            let b = (num & 0x0000FF) + Math.round(255 * percent);
            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));
            return '#' + ( (1<<24) + (r<<16) + (g<<8) + b ).toString(16).slice(1);
        } catch (e) {
            return hex;
        }
    }

    // Helper: draw jointed legs with knee, shin and foot; uses simple IK-ish positioning
    drawLegs(torsoHeight, crouchFactor, breathing, swayX) {
        const legTop = torsoHeight/2 + 2;
        const thighLength = 20 * (1 - crouchFactor * 0.35);
        const shinLength = 22 * (1 - crouchFactor * 0.25);
        const footLength = 18;
        const walkSway = this.player.walkSway * 0.6;
        const time = Date.now() * 0.003;
        // compute dynamic knee bend based on breathing/walk for subtle motion
        const leftPhase = Math.sin(time) * 0.6;
        const rightPhase = Math.sin(time + Math.PI) * 0.6;
        const pantsColor = '#2f3843';
        const bootColor = '#141414';

        // draw one leg helper
        const drawOne = (offsetX, phase) => {
            const kneeBend = 6 + phase * 6 + crouchFactor * 12;
            const thighW = 10;

            // thigh
            this.ctx.save();
            this.ctx.translate(offsetX + swayX * 0.6, legTop);
            this.ctx.rotate((phase * 0.08) - crouchFactor * 0.1);
            this.ctx.fillStyle = pantsColor;
            this.roundRect(this.ctx, -thighW/2, 0, thighW, thighLength, 4);
            this.ctx.fill();

            // knee -> shin
            this.ctx.translate(0, thighLength - kneeBend*0.5);
            this.ctx.rotate(kneeBend * 0.01);
            this.ctx.fillStyle = pantsColor;
            this.roundRect(this.ctx, -thighW/2 + 2, 0, thighW - 4, shinLength, 3);
            this.ctx.fill();

            // foot with slight rotation to match ground contact
            this.ctx.translate(0, shinLength);
            const footAngle = -phase * 0.05 + crouchFactor * 0.12;
            this.ctx.rotate(footAngle);
            this.ctx.fillStyle = bootColor;
            this.ctx.fillRect(-thighW/2 - 2, 0, footLength, 6);
            this.ctx.restore();
        };

        drawOne(-8, leftPhase);
        drawOne(14, rightPhase);
    }

    // Preload and store audio assets for quick playback
    preloadAudio() {
        this.sounds = {
            shoot: new Audio('shoot.mp3'),
            reload: new Audio('reload.mp3'),
            bomb: new Audio('bomb.mp3'),
            hit: new Audio('hit.mp3'),
            waveComplete: new Audio('wave_complete.mp3'),
            start: new Audio('start.mp3'),
            // yay uses the existing start.mp3 asset as a short celebratory sound
            yay: new Audio('start.mp3')
        };
        // set low-latency settings
        Object.values(this.sounds).forEach(a => {
            a.preload = 'auto';
            a.volume = 0.9;
        });
    }
}

// Start the game
window.game = new Game();