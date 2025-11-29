export class UpgradeSystem {
    constructor() {
        this.upgrades = [
            {
                id: 'damage',
                name: 'Damage Boost',
                description: 'Increase bullet damage',
                cost: 50,
                level: 1,
                maxLevel: 10,
                purchased: false,
                apply: function(game) {
                    this.level++;
                    this.cost = Math.floor(this.cost * 1.4);
                    game.player.damageMultiplier = this.level;  // Apply to player's damage multiplier
                },
                canAfford: function(coins) {
                    return coins >= this.cost;
                }
            },
            {
                id: 'pellets',
                name: 'Pellet Count',
                description: 'Increase shotgun pellet count',
                cost: 75,
                level: 10,              // increased base pellet count
                maxLevel: 30,          // raised max level
                purchased: false,
                apply: function(game) {
                    this.level += 1;   // more granular increments
                    this.cost = Math.floor(this.cost * 1.35);
                    // Update player's max ammo to match pellet count if needed
                    if (game.player.maxAmmo < this.level) {
                        game.player.maxAmmo = this.level;
                        game.player.ammo = Math.min(game.player.ammo, this.level);
                        game.updateAmmoDisplay();
                    }
                },
                canAfford: function(coins) {
                    return coins >= this.cost;
                }
            },
            {
                id: 'ammo',
                name: 'Ammo Capacity',
                description: 'Increase maximum ammo',
                cost: 100,
                level: 8,
                maxLevel: 20,
                purchased: false,
                apply: function(game) {
                    this.level += 2;
                    game.player.maxAmmo = this.level;
                    game.player.ammo = this.level;
                    game.updateAmmoDisplay();
                    this.cost = Math.floor(this.cost * 1.6);
                },
                canAfford: function(coins) {
                    return coins >= this.cost;
                }
            },
            {
                id: 'reload',
                name: 'Fast Reload',
                description: 'Decrease reload time',
                cost: 80,
                level: 1,
                maxLevel: 8,
                purchased: false,
                apply: function(game) {
                    this.level++;
                    game.player.reloadDuration = Math.max(30, 90 - (this.level * 7));
                    this.cost = Math.floor(this.cost * 1.4);
                },
                canAfford: function(coins) {
                    return coins >= this.cost;
                }
            },
            {
                id: 'coins',
                name: 'Coin Magnet',
                description: 'Increase coin rewards by 20% per level',
                cost: 120,
                level: 1,
                maxLevel: 10,
                purchased: false,
                apply: function(game) {
                    this.level++;
                    this.cost = Math.floor(this.cost * 1.7);
                },
                canAfford: function(coins) {
                    return coins >= this.cost;
                }
            },
            {
                id: 'health',
                name: 'Health Boost',
                description: 'Increase maximum health',
                cost: 150,
                level: 5,
                maxLevel: 15,
                purchased: false,
                apply: function(game) {
                    this.level += 1;
                    game.player.maxHealth = this.level;
                    game.player.health = this.level;
                    game.updateHealthDisplay();
                    this.cost = Math.floor(this.cost * 1.8);
                },
                canAfford: function(coins) {
                    return coins >= this.cost;
                }
            },
            // New homing bomb upgrade
            {
                id: 'homing',
                name: 'Homing Bomb',
                description: 'Unlock and upgrade a reusable homing bomb (reduces cooldown / increases damage)',
                cost: 200,
                level: 1,           // 1 = unlocked base damage
                maxLevel: 10,
                purchased: false,
                apply: function(game) {
                    this.level++;
                    // Each level increases bomb damage modestly and slightly reduces cooldown in game logic if desired
                    this.cost = Math.floor(this.cost * 1.6);
                },
                canAfford: function(coins) {
                    return coins >= this.cost;
                }
            }
        ];
    }

    getBulletCount() {
        const pelletUpgrade = this.upgrades.find(u => u.id === 'pellets');
        return pelletUpgrade ? pelletUpgrade.level : 10; // default 10 pellets
    }

    getDamage() {
        const damageUpgrade = this.upgrades.find(u => u.id === 'damage');
        return damageUpgrade ? damageUpgrade.level : 1;
    }

    getCoinMultiplier() {
        const coinUpgrade = this.upgrades.find(u => u.id === 'coins');
        return coinUpgrade ? (1 + (coinUpgrade.level - 1) * 0.2) : 1;
    }

    getUpgradeOptions() {
        return this.upgrades;
    }

    // helper to get homing bomb level
    getHomingLevel() {
        const u = this.upgrades.find(x => x.id === 'homing');
        return u ? u.level : 0;
    }
}