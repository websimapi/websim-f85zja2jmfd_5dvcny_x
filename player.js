export class Player {
    constructor() {
        this.maxAmmo = 8;
        this.ammo = this.maxAmmo;
        this.reloading = false;
        this.reloadTime = 0;
        this.reloadDuration = 60; // frames
        this.maxHealth = 5;
        this.health = this.maxHealth;
        this.damageMultiplier = 1;  // Base damage multiplier from upgrades
        this.damageBoost = 1;         // Temporary damage boost from power-ups
        this.damageBoostTimer = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        
        // Realistic additions
        this.recoilTimer = 0;
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaRegenRate = 0.5;
        this.breathingTimer = 0;

        // New realistic properties
        this.aimAngle = 0;           // small aim tilt for gun
        this.isCrouching = false;    // crouch state
        this.crouchTimer = 0;
        this.crouchTransition = 0;   // 0..1 transition for smooth crouch
        this.movementSpeed = 0;      // not used for full movement but for sway
        this.walkSway = 0;
    }

    canShoot() {
        return this.ammo > 0 && !this.reloading && this.stamina >= 10;
    }

    shoot() {
        if (this.canShoot()) {
            this.ammo--;
            this.stamina -= 10;
            this.recoilTimer = 18; // slightly longer for more visible recoil
            // momentarily increase aim angle upwards to simulate muzzle climb
            this.aimAngle -= 0.28 + Math.random() * 0.06;
        }
    }

    reload() {
        if (!this.reloading && this.ammo < this.maxAmmo) {
            this.reloading = true;
            this.reloadTime = 0;
            return true;
        }
        return false;
    }

    takeDamage(amount = 1) {
        if (!this.invulnerable) {
            this.health -= amount;
            this.invulnerable = true;
            this.invulnerableTimer = 90; // 1.5 seconds of invulnerability
            return true;
        }
        return false;
    }

    toggleCrouch(enable) {
        this.isCrouching = enable;
    }

    update() {
        // Update reload
        if (this.reloading) {
            this.reloadTime++;
            if (this.reloadTime >= this.reloadDuration) {
                this.ammo = this.maxAmmo;
                this.reloading = false;
            }
        }

        // Update recoil - recoil decays smoothly and reduces aimAngle over time
        if (this.recoilTimer > 0) {
            this.recoilTimer--;
        }
        // recoil influences aim recovery
        this.aimAngle *= 0.92;
        if (Math.abs(this.aimAngle) < 0.005) this.aimAngle = 0;

        // Update stamina
        if (this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate);
        }

        // Update damage boost
        if (this.damageBoostTimer > 0) {
            this.damageBoostTimer--;
            if (this.damageBoostTimer <= 0) {
                this.damageBoost = 1;
            }
        }

        // Update invulnerability
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        // Breathing animation
        this.breathingTimer += 0.03; // slower breathing for realism

        // Crouch transition smoothing
        const target = this.isCrouching ? 1 : 0;
        this.crouchTransition += (target - this.crouchTransition) * 0.12;
        // walk sway increases slightly if moving (hookable externally)
        this.walkSway += (Math.sin(this.breathingTimer * 1.2) * 0.6 - this.walkSway) * 0.08;
    }

    getDamage() {
        return this.damageMultiplier * this.damageBoost;
    }

    getBreathingOffset() {
        return Math.sin(this.breathingTimer) * (this.isCrouching ? 1 : 2);
    }

    getRecoilOffset() {
        // Recoil vertical offset to push gun up when fired
        return Math.max(0, this.recoilTimer) * 0.6;
    }

    getAimAngle() {
        // returns small angle in radians for gun tilt
        return this.aimAngle;
    }

    getCrouchFactor() {
        return this.crouchTransition; // 0..1
    }

    getBreathingSway() {
        return Math.sin(this.breathingTimer * 0.9) * 1.5;
    }
}