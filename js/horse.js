/**
 * Horse Class
 * Manages individual horses in the race
 */
class Horse {
    constructor(scene, lane, name, color) {
        this.scene = scene;
        this.lane = lane;
        this.name = name || nameGenerator.generateName();
        this.color = color || this.getRandomColor();
        
        // Performance characteristics - even tighter range for more competitive racing
        this.baseSpeed = Math.random() * 0.3 + 2.0; // Speed between 2.0 and 2.3 (tighter range)
        this.stamina = Math.random() * 0.2 + 0.8; // Stamina between 0.8 and 1.0 (better minimum)
        this.acceleration = Math.random() * 0.15 + 0.45; // Acceleration between 0.45 and 0.6
        this.luckFactor = Math.random() * 0.15; // Random luck factor between 0 and 0.15 (reduced variability)
        
        // Current state
        this.currentSpeed = 0;
        this.distance = 0;
        this.currentLap = 1;
        this.finished = false;
        this.finishTime = null;
        this.position = null;
        this.catchUpFactor = 0; // Will be used to help trailing horses catch up
        this.leadHandicap = 0; // Will slow down leading horses slightly
        
        // Lap-specific factors for variability - reduced range for closer competition
        this.lapFactors = [];
        for (let i = 0; i < this.scene.totalLaps; i++) {
            this.lapFactors.push({
                speedBoost: (Math.random() * 0.2) - 0.05, // Between -0.05 and 0.15 (less penalty)
                staminaBoost: (Math.random() * 0.15) // Between 0 and 0.15 (no penalties)
            });
        }
        
        // Sprite configuration
        this.sprite = null;
        this.nameText = null;
        
        // Use a middle lane as the reference path for all horses
        const referenceIndex = Math.floor(this.scene.numHorses / 2) - 1; // For 12 horses, this will be lane 6
        const laneWidth = Math.min(this.scene.trackWidth, this.scene.trackHeight) / 300; // Reduced for more compact formation
        // Set all horses to follow the middle lane's path with minimal variation
        this.laneOffset = (this.scene.numHorses - 1 - referenceIndex) * laneWidth;
        // Add a tiny offset for visual separation (1/10th of the already small lane width)
        this.laneOffset += (this.lane - referenceIndex) * (laneWidth * 0.1);
        
        // Initialize sprite
        this.createSprite();
    }
    
    getRandomColor() {
        const colors = [
            0xff0000, // Red
            0x00ff00, // Green
            0x0000ff, // Blue
            0xffff00, // Yellow
            0xff00ff, // Magenta
            0x00ffff, // Cyan
            0xffa500, // Orange
            0x800080, // Purple
            0x008000, // Dark Green
            0x800000, // Maroon
            0x808000, // Olive
            0x008080, // Teal
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createSprite() {
        // Get starting position
        const startPosition = this.scene.getPositionOnTrack(0, this.laneOffset);
        
        // Create horse sprite using the silhouette image
        this.sprite = this.scene.add.image(startPosition.x, startPosition.y, 'horse');
        
        // Scale the sprite to an even smaller size
        const scaleBase = Math.min(this.scene.trackWidth, this.scene.trackHeight) / 8000;
        this.sprite.setScale(Math.max(0.015, scaleBase));
        
        // Apply color tint to the horse silhouette
        this.sprite.setTint(this.color);
        
        // Set initial rotation to match the track
        this.sprite.rotation = startPosition.rotation + Math.PI/2; // Add 90° to point along the track
        
        // Add running animation
        this.legMovement = 0;
        
        // Lane number - position relative to track dimensions
        const laneTextY = this.scene.trackCenterY - (this.scene.trackHeight * 0.4) + (this.lane * (this.scene.trackHeight * 0.06));
        this.laneText = this.scene.add.text(20, laneTextY, this.lane + 1, { 
            fontSize: '14px', 
            fontFamily: 'Arial',
            color: '#000'
        });
        
        // Horse name follows the horse - adjust text position based on horse size
        const nameOffsetX = this.sprite.width * this.sprite.scale * 0.5;
        const nameOffsetY = this.sprite.height * this.sprite.scale * 0.5;
        this.nameText = this.scene.add.text(startPosition.x - nameOffsetX, startPosition.y - nameOffsetY, this.name, { 
            fontSize: '10px', 
            fontFamily: 'Arial',
            color: '#000',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: { x: 2, y: 1 }
        });
        
        // Group all elements
        this.group = this.scene.add.group([this.sprite, this.laneText, this.nameText]);
    }
    
    update(time, delta) {
        if (this.finished) return;
        
        // Debug log on first few updates for first horse only
        if (this.lane === 0 && this.distance < 100) {
            console.log(`Horse ${this.name} update: speed=${this.currentSpeed.toFixed(2)}, distance=${this.distance.toFixed(2)}`);
        }
        
        // Calculate which lap we're on - this is critical for the 4-lap race
        const previousLap = this.currentLap;
        this.currentLap = Math.min(this.scene.totalLaps, Math.floor(this.distance / this.scene.trackLength) + 1);
        
        // Detect lap change and log it
        if (this.currentLap > previousLap) {
            console.log(`${this.name} starting lap ${this.currentLap} of ${this.scene.totalLaps}`);
        }
        
        // Calculate catch-up factor based on position in the race
        this.updateRacePositioningFactors();
        
        // Get lap-specific performance factors
        const lapIndex = this.currentLap - 1;
        const lapFactor = this.lapFactors[lapIndex] || { speedBoost: 0, staminaBoost: 0 };
        
        // Calculate speed based on time and current lap factor
        const raceProgress = this.distance / this.scene.totalRaceDistance;
        const staminaFactor = Math.max(0.8, 1 - raceProgress / (this.stamina + lapFactor.staminaBoost));
        const randomFactor = 1 + (Math.random() - 0.5) * this.luckFactor;
        
        // Accelerate up to base speed, applying lap-specific boost, catch-up mechanics, and lead handicap
        const lapAdjustedBaseSpeed = this.baseSpeed * (1 + lapFactor.speedBoost + this.catchUpFactor - this.leadHandicap);
        if (this.currentSpeed < lapAdjustedBaseSpeed) {
            // Faster acceleration for trailing horses
            const accelerationBoost = 1 + this.catchUpFactor;
            this.currentSpeed += this.acceleration * accelerationBoost * (delta / 1000);
        }
        
        // Ensure minimum speed for all horses (creates a more consistent and exciting race)
        const minRaceSpeed = 1.0 + (this.catchUpFactor * 2);
        this.currentSpeed = Math.max(minRaceSpeed, this.currentSpeed);
        
        // Apply stamina and random factors
        const actualSpeed = this.currentSpeed * staminaFactor * randomFactor;
        
        // Move horse forward - scale speed based on track size
        const speedScale = Math.max(1, Math.min(this.scene.trackWidth, this.scene.trackHeight) / 300);
        this.distance += actualSpeed * (delta / 1000) * 100 * speedScale;
        
        // Get position on the oval track - this function handles the looping
        const lapDistance = this.distance % this.scene.trackLength;
        const trackPos = this.scene.getPositionOnTrack(lapDistance, this.laneOffset);
        
        // Update sprite positions
        this.sprite.x = trackPos.x;
        this.sprite.y = trackPos.y;
        this.sprite.rotation = trackPos.rotation + Math.PI/2; // Add 90° to point along the track
        
        // Update name text position
        const nameOffsetX = this.sprite.width * this.sprite.scale * 0.5;
        const nameOffsetY = this.sprite.height * this.sprite.scale * 0.5;
        this.nameText.x = trackPos.x - nameOffsetX;
        this.nameText.y = trackPos.y - nameOffsetY;
        
        // Add a slight bobbing motion for running effect
        this.legMovement += delta * 0.01;
        const bobHeight = Math.sin(this.legMovement) * 1; // Reduced bobbing
        this.sprite.y += bobHeight;
        
        // Check if finished the entire race (all laps)
        // The horse should finish when it completes 4 laps (last lap)
        const totalDistance = this.scene.totalLaps * this.scene.trackLength;
        
        // Check if the horse has reached the finish line on the 4th lap
        if (this.distance >= totalDistance && lapDistance >= 0 && lapDistance <= 50) {
            if (!this.finished) {
                this.finished = true;
                this.finishTime = time;
                this.scene.horseFinished(this);
                console.log(`Horse ${this.name} finished the race! (${this.scene.totalLaps} laps)`);
            }
        }
    }
    
    // Update method name for clarity
    updateRacePositioningFactors() {
        if (!this.scene.raceInProgress || this.finished) return;
        
        // Find the leading horse and the trailing horses
        const activeHorses = this.scene.horses.filter(h => !h.finished);
        if (activeHorses.length <= 1) return;
        
        // Sort by distance
        activeHorses.sort((a, b) => b.distance - a.distance);
        
        // Find the leading horse
        const leadingHorse = activeHorses[0];
        const leadingDistance = leadingHorse.distance;
        
        // Find this horse's position (index) in the sorted array
        const thisHorseIndex = activeHorses.findIndex(h => h === this);
        
        // Calculate relative position (0 = leading, 1 = last)
        const relativePosition = thisHorseIndex / (activeHorses.length - 1);
        
        // Calculate distance behind the leader
        const distanceBehind = leadingDistance - this.distance;
        
        // Apply lead handicap to leading horses to keep the pack tighter
        if (this === leadingHorse) {
            // Leading horse gets a small handicap to keep the race exciting
            // This increases as the lead grows
            const leadDistanceToSecond = this.distance - activeHorses[1].distance;
            const maxHandicap = 0.15; // Maximum 15% slowdown
            const minLeadThreshold = this.scene.trackLength * 0.05; // 5% of a lap
            const maxLeadThreshold = this.scene.trackLength * 0.2; // 20% of a lap
            
            if (leadDistanceToSecond > minLeadThreshold) {
                // Calculate handicap based on lead distance
                const leadFactor = Math.min(1, (leadDistanceToSecond - minLeadThreshold) / 
                                         (maxLeadThreshold - minLeadThreshold));
                this.leadHandicap = maxHandicap * leadFactor;
                
                // Reduce handicap in final lap to avoid frustrating finishes
                if (this.currentLap >= this.scene.totalLaps) {
                    this.leadHandicap *= 0.5;
                }
            } else {
                // If not far ahead, gradually reduce any existing handicap
                this.leadHandicap = Math.max(0, this.leadHandicap - 0.01);
            }
            
            // No catch-up for leader
            this.catchUpFactor = 0;
        } else {
            // Not the leader, so no handicap
            this.leadHandicap = 0;
            
            // Calculate catch-up factor - higher for horses further behind
            // This creates a rubber-banding effect to keep races exciting
            const maxCatchUpFactor = 0.4; // Maximum 40% speed boost (increased from 30%)
            const minDistanceThreshold = this.scene.trackLength * 0.05; // 5% of a lap (reduced from 10%)
            const maxDistanceThreshold = this.scene.trackLength * 0.4; // 40% of a lap (reduced from 50%)
            
            if (distanceBehind > minDistanceThreshold) {
                // Calculate catch-up factor based on distance behind leader
                // Clamp catch-up to maxCatchUpFactor
                const distanceFactor = Math.min(1, (distanceBehind - minDistanceThreshold) / 
                                             (maxDistanceThreshold - minDistanceThreshold));
                
                // Apply stronger catch-up for horses that are farther back in position
                this.catchUpFactor = maxCatchUpFactor * (distanceFactor * 0.7 + relativePosition * 0.3);
                
                // Add extra catch-up in later laps to ensure all horses finish relatively close
                if (this.currentLap >= this.scene.totalLaps - 1) {
                    this.catchUpFactor *= 1.8; // Increased from 1.5 for stronger comeback potential
                }
                
                // Additional boost for horses more than half a lap behind (prevention of being lapped)
                if (distanceBehind > this.scene.trackLength * 0.5) {
                    this.catchUpFactor += 0.2;
                }
            } else {
                // If not far behind, gradually reduce any existing catch-up
                this.catchUpFactor = Math.max(0, this.catchUpFactor - 0.01);
            }
        }
    }
    
    reset() {
        this.currentSpeed = 0;
        this.distance = 0;
        this.currentLap = 1;
        this.finished = false;
        this.finishTime = null;
        this.position = null;
        this.catchUpFactor = 0;
        this.leadHandicap = 0; // Reset lead handicap
        
        // Use a middle lane as the reference path for all horses
        const referenceIndex = Math.floor(this.scene.numHorses / 2) - 1; // For 12 horses, this will be lane 6
        const laneWidth = Math.min(this.scene.trackWidth, this.scene.trackHeight) / 300; // Reduced for more compact formation
        // Set all horses to follow the middle lane's path with minimal variation
        this.laneOffset = (this.scene.numHorses - 1 - referenceIndex) * laneWidth;
        // Add a tiny offset for visual separation (1/10th of the already small lane width)
        this.laneOffset += (this.lane - referenceIndex) * (laneWidth * 0.1);
        
        // Reset position back to starting position
        const startPosition = this.scene.getPositionOnTrack(0, this.laneOffset);
        this.sprite.x = startPosition.x;
        this.sprite.y = startPosition.y;
        this.sprite.rotation = startPosition.rotation + Math.PI/2;
        
        // Update name text position
        const nameOffsetX = this.sprite.width * this.sprite.scale * 0.5;
        const nameOffsetY = this.sprite.height * this.sprite.scale * 0.5;
        this.nameText.x = startPosition.x - nameOffsetX;
        this.nameText.y = startPosition.y - nameOffsetY;
        
        this.legMovement = 0;
    }
    
    destroy() {
        if (this.group) {
            this.group.destroy(true);
        }
    }
}
