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
        
        // Performance characteristics
        this.baseSpeed = Math.random() * 1 + 1.5; // Speed between 1.5 and 2.5
        this.stamina = Math.random() * 0.5 + 0.5; // Stamina between 0.5 and 1
        this.acceleration = Math.random() * 0.4 + 0.3; // Acceleration between 0.3 and 0.7
        this.luckFactor = Math.random() * 0.3; // Random luck factor between 0 and 0.3
        
        // Current state
        this.currentSpeed = 0;
        this.distance = 0;
        this.finished = false;
        this.finishTime = null;
        this.position = null;
        
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
        
        // Calculate speed based on time
        const raceProgress = this.distance / this.scene.trackLength;
        const staminaFactor = Math.max(0.7, 1 - raceProgress / this.stamina);
        const randomFactor = 1 + (Math.random() - 0.5) * this.luckFactor;
        
        // Accelerate up to base speed
        if (this.currentSpeed < this.baseSpeed) {
            this.currentSpeed += this.acceleration * (delta / 1000);
        }
        
        // Apply stamina and random factors
        const actualSpeed = this.currentSpeed * staminaFactor * randomFactor;
        
        // Move horse forward - scale speed based on track size
        const speedScale = Math.max(1, Math.min(this.scene.trackWidth, this.scene.trackHeight) / 300);
        this.distance += actualSpeed * (delta / 1000) * 100 * speedScale;
        
        // Get position on the oval track
        const trackPos = this.scene.getPositionOnTrack(this.distance, this.laneOffset);
        
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
        
        // Check if finished
        if (this.distance >= this.scene.trackLength) {
            this.distance = this.scene.trackLength;
            if (!this.finished) {
                this.finished = true;
                this.finishTime = time;
                this.scene.horseFinished(this);
                console.log(`Horse ${this.name} finished the race!`);
            }
        }
    }
    
    reset() {
        this.currentSpeed = 0;
        this.distance = 0;
        this.finished = false;
        this.finishTime = null;
        this.position = null;
        
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
