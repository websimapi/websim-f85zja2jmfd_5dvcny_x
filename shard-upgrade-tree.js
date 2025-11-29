export class ShardUpgradeTree {
    constructor() {
        // Highly branched, long-term upgrades; costs scale steeply and many have prerequisites
        this.nodes = [
            // Core offense branch
            {
                id: 'core_damage_1',
                name: 'Reinforced Barrels I',
                tier: 1,
                branch: 'Offense',
                cost: 3,
                description: '+5% global bullet damage.',
                prereqs: [],
                purchased: false,
                apply(game) {
                    game.player.damageMultiplier *= 1.05;
                }
            },
            {
                id: 'core_damage_2',
                name: 'Reinforced Barrels II',
                tier: 2,
                branch: 'Offense',
                cost: 6,
                description: '+7% global bullet damage.',
                prereqs: ['core_damage_1'],
                purchased: false,
                apply(game) {
                    game.player.damageMultiplier *= 1.07;
                }
            },
            {
                id: 'core_damage_3',
                name: 'Reinforced Barrels III',
                tier: 3,
                branch: 'Offense',
                cost: 12,
                description: '+10% global bullet damage; +1 pellet.',
                prereqs: ['core_damage_2'],
                purchased: false,
                apply(game) {
                    game.player.damageMultiplier *= 1.10;
                    const pellets = game.upgradeSystem.upgrades.find(u => u.id === 'pellets');
                    if (pellets) pellets.level += 1;
                }
            },
            {
                id: 'crit_shots_1',
                name: 'Critical Focus I',
                tier: 3,
                branch: 'Offense',
                cost: 10,
                description: '10% chance for pellets to deal +100% damage.',
                prereqs: ['core_damage_2'],
                purchased: false,
                apply(game) {
                    game._critChance = (game._critChance || 0) + 0.1;
                    game._critMultiplier = Math.max(game._critMultiplier || 2, 2);
                }
            },
            {
                id: 'crit_shots_2',
                name: 'Critical Focus II',
                tier: 5,
                branch: 'Offense',
                cost: 18,
                description: 'Additional 10% crit chance and +25% crit damage.',
                prereqs: ['crit_shots_1'],
                purchased: false,
                apply(game) {
                    game._critChance = (game._critChance || 0) + 0.1;
                    game._critMultiplier = (game._critMultiplier || 2) + 0.25;
                }
            },

            // Core defense branch
            {
                id: 'core_defense_1',
                name: 'Composite Vest I',
                tier: 1,
                branch: 'Defense',
                cost: 3,
                description: '+1 max health.',
                prereqs: [],
                purchased: false,
                apply(game) {
                    game.player.maxHealth += 1;
                    game.player.health = game.player.maxHealth;
                    game.updateHealthDisplay();
                }
            },
            {
                id: 'core_defense_2',
                name: 'Composite Vest II',
                tier: 2,
                branch: 'Defense',
                cost: 7,
                description: '+1 max health, +10% invulnerability time.',
                prereqs: ['core_defense_1'],
                purchased: false,
                apply(game) {
                    game.player.maxHealth += 1;
                    game.player.health = game.player.maxHealth;
                    game.player.invulnerableTimer = Math.floor(game.player.invulnerableTimer * 1.1);
                    game.updateHealthDisplay();
                }
            },
            {
                id: 'core_defense_3',
                name: 'Pain Dampeners',
                tier: 4,
                branch: 'Defense',
                cost: 14,
                description: 'Taking damage restores 10 stamina and slightly staggers nearby zombies.',
                prereqs: ['core_defense_2'],
                purchased: false,
                apply(game) {
                    game._painDampeners = true;
                }
            },

            // Stamina / mobility branch
            {
                id: 'stamina_1',
                name: 'Conditioning I',
                tier: 1,
                branch: 'Stamina',
                cost: 4,
                description: '+15% max stamina and regen.',
                prereqs: [],
                purchased: false,
                apply(game) {
                    game.player.maxStamina *= 1.15;
                    game.player.staminaRegenRate *= 1.15;
                }
            },
            {
                id: 'stamina_2',
                name: 'Conditioning II',
                tier: 3,
                branch: 'Stamina',
                cost: 9,
                description: '+20% max stamina and regen.',
                prereqs: ['stamina_1'],
                purchased: false,
                apply(game) {
                    game.player.maxStamina *= 1.2;
                    game.player.staminaRegenRate *= 1.2;
                }
            },
            {
                id: 'stamina_3',
                name: 'Adrenaline Loop',
                tier: 5,
                branch: 'Stamina',
                cost: 16,
                description: 'Killing 5 zombies quickly refunds 1 ammo (once every 6s).',
                prereqs: ['stamina_2'],
                purchased: false,
                apply(game) {
                    game._adrenalineLoop = true;
                    game._loopKillWindow = 0;
                    game._loopKillCount = 0;
                }
            },

            // Bomb specialization branch
            {
                id: 'bomb_core_1',
                name: 'Shockwave Casing',
                tier: 2,
                branch: 'Bomb',
                cost: 8,
                description: '+20% homing bomb radius.',
                prereqs: [],
                purchased: false,
                apply(game) {
                    game._bombRadiusBonus = (game._bombRadiusBonus || 0) + 0.2;
                }
            },
            {
                id: 'bomb_core_2',
                name: 'Reactive Explosives',
                tier: 4,
                branch: 'Bomb',
                cost: 15,
                description: '+25% bomb damage, +10% cooldown.',
                prereqs: ['bomb_core_1'],
                purchased: false,
                apply(game) {
                    if (!game.bombDamageMultiplier) game.bombDamageMultiplier = 1;
                    game.bombDamageMultiplier *= 1.25;
                    game.bombCooldownMs = Math.floor(game.bombCooldownMs * 1.1);
                }
            },
            {
                id: 'bomb_core_3',
                name: 'Chain Detonation',
                tier: 6,
                branch: 'Bomb',
                cost: 24,
                description: 'Bomb kills have a 25% chance to refund 1 ammo and 1 shard.',
                prereqs: ['bomb_core_2'],
                purchased: false,
                apply(game) {
                    game._chainDetonation = true;
                }
            },

            // Economy / meta branch
            {
                id: 'economy_1',
                name: 'Smuggled Crates',
                tier: 2,
                branch: 'Economy',
                cost: 6,
                description: '+10% coin gain, +5% shard drop chance.',
                prereqs: [],
                purchased: false,
                apply(game) {
                    game._shardDropBonus = (game._shardDropBonus || 0) + 0.05;
                    const coinUpgrade = game.upgradeSystem.upgrades.find(u => u.id === 'coins');
                    if (coinUpgrade) coinUpgrade.level += 1;
                }
            },
            {
                id: 'economy_2',
                name: 'Black Market Ties',
                tier: 4,
                branch: 'Economy',
                cost: 14,
                description: '+15% coin gain, +5% shard drop chance, but +10% zombie health.',
                prereqs: ['economy_1'],
                purchased: false,
                apply(game) {
                    game._shardDropBonus = (game._shardDropBonus || 0) + 0.05;
                    const coinUpgrade = game.upgradeSystem.upgrades.find(u => u.id === 'coins');
                    if (coinUpgrade) coinUpgrade.level += 2;
                    game._zombieHealthMul = (game._zombieHealthMul || 1) * 1.1;
                }
            },
            {
                id: 'economy_3',
                name: 'Endless Contract',
                tier: 7,
                branch: 'Economy',
                cost: 30,
                description: '+20% coin gain, +10% shard drop chance, waves spawn +5% faster.',
                prereqs: ['economy_2'],
                purchased: false,
                apply(game) {
                    game._shardDropBonus = (game._shardDropBonus || 0) + 0.1;
                    game._endlessContract = true;
                    game.zombieSpawnInterval = Math.floor(game.zombieSpawnInterval * 0.95);
                }
            }
        ];
    }

    getNodes() {
        return this.nodes;
    }

    getNode(id) {
        return this.nodes.find(n => n.id === id);
    }

    isPurchased(id) {
        const n = this.getNode(id);
        return !!(n && n.purchased);
    }

    prereqsMet(id) {
        const n = this.getNode(id);
        if (!n || !n.prereqs || n.prereqs.length === 0) return true;
        return n.prereqs.every(pid => this.isPurchased(pid));
    }

    canAfford(game, id) {
        const n = this.getNode(id);
        if (!n) return false;
        return game.shards >= n.cost;
    }

    canPurchase(game, id) {
        const n = this.getNode(id);
        if (!n || n.purchased) return false;
        if (!this.prereqsMet(id)) return false;
        return this.canAfford(game, id);
    }

    purchaseNode(game, id) {
        const n = this.getNode(id);
        if (!n || n.purchased) return false;
        if (!this.canPurchase(game, id)) return false;
        game.shards -= n.cost;
        n.purchased = true;
        if (typeof n.apply === 'function') {
            n.apply(game);
        }
        return true;
    }
}