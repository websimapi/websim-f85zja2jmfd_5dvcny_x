export class Bullet {
    constructor(x, y, speed, angle, damage = 1) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.angle = angle;
        this.damage = damage;
        this.radius = 3;
        this.lifetime = 60;
        this.distanceTravelled = 0;
        this.drop = 0; // Bullet drop per unit distance
        this.trail = [];
        this.maxTrailLength = 8;
    }

    update() {
        const prevX = this.x;
        const prevY = this.y;
        
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        this.distanceTravelled += this.speed;
        this.lifetime--;
        
        // Speed degradation
        this.speed *= 0.995;
        
        // Bullet drop increases with distance
        this.drop += 0.02;
        this.y += this.drop * 0.1;
        
        // Add to trail
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    draw(ctx) {
        // Draw bullet trail
        if (this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = (i + 1) / this.trail.length;
                const width = (i + 1) * 0.5;
                
                ctx.globalAlpha = alpha * 0.8;
                ctx.strokeStyle = this.damage > 1 ? '#ffaa00' : '#ffff88';
                ctx.lineWidth = width;
                ctx.beginPath();
                ctx.moveTo(this.trail[i].x, this.trail[i].y);
                ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
                ctx.stroke();
            }
        }
        
        // Draw bullet
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.damage > 1 ? '#ff8800' : '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bullet glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
        gradient.addColorStop(0, this.damage > 1 ? 'rgba(255, 170, 0, 0.6)' : 'rgba(255, 255, 0, 0.6)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(zombie) {
        // More accurate collision detection using distance
        const dx = this.x - zombie.x;
        const dy = this.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if bullet is within zombie bounds
        return distance < (zombie.width / 2 + this.radius);
    }
}