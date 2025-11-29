export class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 20;
        this.life = 300; // 5 seconds at 60fps
        this.maxLife = 300;
        this.bobOffset = 0;
        this.collected = false;
    }

    update() {
        this.life--;
        this.bobOffset += 0.1;
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / this.maxLife);
        const bobY = Math.sin(this.bobOffset) * 5;
        const pulse = Math.sin(this.bobOffset * 2) * 0.2 + 0.8;

        ctx.globalAlpha = alpha;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(this.x, this.y + bobY, 0, this.x, this.y + bobY, this.radius * 1.5);
        gradient.addColorStop(0, this.getColor() + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.radius * 1.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getIcon(), this.x, this.y + bobY);

        ctx.globalAlpha = 1;
    }

    getColor() {
        switch(this.type) {
            case 'ammo': return '#00ff00';
            case 'health': return '#ff0000';
            case 'coins': return '#FFD700';
            case 'damage': return '#ff00ff';
            default: return '#ffffff';
        }
    }

    getIcon() {
        switch(this.type) {
            case 'ammo': return '🔫';
            case 'health': return '❤️';
            case 'coins': return '💰';
            case 'damage': return '⚡';
            default: return '?';
        }
    }

    apply(game) {
        switch(this.type) {
            case 'ammo':
                game.player.ammo = Math.min(game.player.ammo + 4, game.player.maxAmmo);
                game.updateAmmoDisplay();
                game.createFloatingText(this.x, this.y, '+4 AMMO', '#00ff00');
                break;
            case 'health':
                game.player.health = Math.min(game.player.health + 2, game.player.maxHealth);
                game.updateHealthDisplay();
                game.createFloatingText(this.x, this.y, '+2 HP', '#ff0000');
                break;
            case 'coins':
                const coinAmount = Math.floor(10 * game.upgradeSystem.getCoinMultiplier());
                game.coins += coinAmount;
                game.updateCoinDisplay();
                game.createFloatingText(this.x, this.y, `+${coinAmount} COINS`, '#FFD700');
                break;
            case 'damage':
                // Temporary damage boost
                game.player.damageBoost = 2;
                game.player.damageBoostTimer = 180; // 3 seconds
                game.createFloatingText(this.x, this.y, 'DAMAGE BOOST!', '#ff00ff');
                break;
        }
    }
}