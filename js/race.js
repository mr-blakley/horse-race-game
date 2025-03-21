/**
 * Race Scene
 * Manages the horse racing simulation using Phaser
 */
class RaceScene extends Phaser.Scene {
    constructor() {
        super('RaceScene');
        
        this.horses = [];
        this.numHorses = 6;
        this.trackLength = 1200; // Increased track length for oval path
        this.raceInProgress = false;
        this.finishedHorses = [];
        this.raceStartTime = 0;
        
        // Oval track parameters
        this.trackWidth = 700;
        this.trackHeight = 300;
        this.trackCenterX = 400;
        this.trackCenterY = 200;
    }
    
    preload() {
        // Create the assets dynamically instead of trying to load them
        this.createPlaceholderAssets();
        
        // Load horse silhouette
        this.load.image('horse', 'assets/horse-silhouette.png');
        
        console.log("Preloading horse image");
    }
    
    create() {
        // Create track background
        this.trackBackground = this.add.image(0, 0, 'track').setOrigin(0, 0);
        this.trackBackground.displayWidth = this.scale.width;
        this.trackBackground.displayHeight = 400;
        
        // Add finish line
        this.finishLine = this.add.image(this.trackCenterX + 250, this.trackCenterY - 50, 'finishLine').setOrigin(0.5, 1);
        this.finishLine.displayWidth = 10;
        this.finishLine.displayHeight = 100;
        this.finishLine.rotation = Math.PI / 2; // Rotate to be vertical
        
        // Starting line is at the same position for oval track
        this.startLine = this.add.graphics();
        this.startLine.lineStyle(2, 0xffffff, 1);
        this.startLine.lineBetween(this.trackCenterX + 250, this.trackCenterY - 100, this.trackCenterX + 250, this.trackCenterY);
        
        // Add lane dividers (now circles)
        this.lanes = this.add.graphics();
        this.lanes.lineStyle(1, 0xaaaaaa, 0.5);
        for (let i = 1; i < this.numHorses; i++) {
            // Draw an ellipse for each lane divider
            const radiusX = this.trackWidth / 2 - (i * 15);
            const radiusY = this.trackHeight / 2 - (i * 15);
            this.lanes.strokeEllipse(this.trackCenterX, this.trackCenterY, radiusX * 2, radiusY * 2);
        }
        
        // Create race status text
        this.statusText = this.add.text(this.scale.width / 2, 20, 'Ready to Race', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5, 0);
        
        // Create countdown text
        this.countdownText = this.add.text(this.scale.width / 2, 200, '', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5, 0.5).setAlpha(0);
        
        // Initialize horse list display
        this.initHorseList();

        console.log("Race scene created and ready");
    }
    
    initHorseList() {
        // Clear existing horses
        this.horses.forEach(horse => horse.destroy());
        this.horses = [];
        this.finishedHorses = [];
        
        // Create horses
        const horseListElement = document.getElementById('horse-list');
        if (horseListElement) {
            horseListElement.innerHTML = '';
            
            for (let i = 0; i < this.numHorses; i++) {
                const horseName = nameGenerator.generateName();
                const horseColor = this.getRandomHexColor();
                
                // Create horse instance
                const horse = new Horse(this, i, horseName, Phaser.Display.Color.HexStringToColor(horseColor).color);
                this.horses.push(horse);
                
                // Add horse to the HTML list
                const horseElement = document.createElement('div');
                horseElement.className = 'horse-item';
                horseElement.innerHTML = `
                    <div class="horse-color" style="background-color: ${horseColor}"></div>
                    <div class="horse-name">Lane ${i + 1}: ${horseName}</div>
                `;
                horseListElement.appendChild(horseElement);
            }
            
            // Clear results panel
            const resultsPanel = document.getElementById('results-panel');
            if (resultsPanel) {
                resultsPanel.innerHTML = '';
            }
        } else {
            console.error("Could not find horse-list element");
        }
    }
    
    getRandomHexColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    
    startRace() {
        console.log("Starting race...");
        if (this.raceInProgress) {
            console.log("Race already in progress");
            return;
        }
        
        this.raceInProgress = true;
        this.finishedHorses = [];
        
        // Reset horses
        this.horses.forEach(horse => horse.reset());
        
        // Update status
        this.statusText.setText('Race is starting...');
        
        // Start countdown
        this.startCountdown();
    }
    
    startCountdown() {
        let count = 3;
        this.countdownText.setText(count.toString());
        this.countdownText.setAlpha(1);
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdownText.setText(count.toString());
            } else {
                clearInterval(countdownInterval);
                this.countdownText.setText('GO!');
                
                setTimeout(() => {
                    this.countdownText.setAlpha(0);
                    this.beginRace();
                }, 1000);
            }
        }, 1000);
    }
    
    beginRace() {
        console.log("Begin race called, setting race in progress");
        this.statusText.setText('Race in Progress');
        this.raceStartTime = this.time.now;
        
        // Enable the update loop
        this.raceInProgress = true;
    }
    
    horseFinished(horse) {
        this.finishedHorses.push(horse);
        horse.position = this.finishedHorses.length;
        
        // Update status
        if (this.finishedHorses.length === 1) {
            this.statusText.setText(`${horse.name} takes first place!`);
        } else if (this.finishedHorses.length === this.horses.length) {
            this.raceInProgress = false;
            this.statusText.setText('Race Complete');
        }
        
        // Update results panel
        this.updateResultsPanel();
    }
    
    updateResultsPanel() {
        const resultsPanel = document.getElementById('results-panel');
        if (!resultsPanel) {
            console.error("Could not find results-panel element");
            return;
        }
        
        resultsPanel.innerHTML = '';
        
        this.finishedHorses.forEach((horse, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            if (index === 0) {
                resultItem.classList.add('result-highlight');
            }
            
            const finishTime = ((horse.finishTime - this.raceStartTime) / 1000).toFixed(2);
            
            resultItem.innerHTML = `
                <div class="result-position">${index + 1}. ${horse.name}</div>
                <div class="result-time">Time: ${finishTime}s</div>
            `;
            
            resultsPanel.appendChild(resultItem);
        });
    }
    
    resetRace() {
        this.raceInProgress = false;
        this.statusText.setText('Ready to Race');
        
        // Re-initialize horses
        this.initHorseList();
    }
    
    update(time, delta) {
        if (!this.raceInProgress) return;
        
        console.log("Race update, time:", time, "delta:", delta);
        
        // Update each horse
        this.horses.forEach(horse => {
            horse.update(time, delta);
        });
    }
    
    // Calculate position on oval track based on distance
    getPositionOnTrack(distance, laneOffset) {
        // Normalize distance to track length (0 to 1)
        const normalizedDistance = (distance % this.trackLength) / this.trackLength;
        
        // Calculate angle based on normalized distance (0 to 2π)
        const angle = normalizedDistance * Math.PI * 2;
        
        // Lane offset reduces the radius (inner lanes have smaller radius)
        const radiusX = this.trackWidth / 2 - laneOffset;
        const radiusY = this.trackHeight / 2 - laneOffset;
        
        // Calculate position on the oval
        const x = this.trackCenterX + radiusX * Math.cos(angle);
        const y = this.trackCenterY + radiusY * Math.sin(angle);
        
        // Calculate rotation angle (tangent to the oval)
        const rotationAngle = Math.atan2(-radiusY * Math.sin(angle), -radiusX * Math.cos(angle));
        
        return { x, y, rotation: rotationAngle };
    }
    
    createPlaceholderAssets() {
        // Create track texture
        const trackGraphics = this.make.graphics({x: 0, y: 0, add: false});
        
        // Draw grass background
        trackGraphics.fillStyle(0x55aa55);
        trackGraphics.fillRect(0, 0, 800, 400);
        
        // Draw oval-shaped track
        trackGraphics.fillStyle(0xbbaa88);
        
        // Draw outer ellipse
        const outerX = this.trackCenterX;
        const outerY = this.trackCenterY;
        const outerWidth = this.trackWidth;
        const outerHeight = this.trackHeight;
        
        // Draw inner ellipse (to create an oval ring)
        const innerWidth = this.trackWidth - 120;
        const innerHeight = this.trackHeight - 120;
        
        // Fill the outer ellipse
        trackGraphics.fillEllipse(outerX, outerY, outerWidth, outerHeight);
        
        // Cut out the inner ellipse by setting composite operation
        trackGraphics.fillStyle(0x55aa55);
        trackGraphics.fillEllipse(outerX, outerY, innerWidth, innerHeight);
        
        // Generate texture
        trackGraphics.generateTexture('track', 800, 400);
        
        // Create finish line texture
        const finishGraphics = this.make.graphics({x: 0, y: 0, add: false});
        finishGraphics.fillStyle(0xffffff);
        
        // Create checkered pattern
        const squareSize = 5;
        for (let y = 0; y < 100; y += squareSize * 2) {
            for (let x = 0; x < 10; x += squareSize) {
                finishGraphics.fillRect(x, y, squareSize, squareSize);
                finishGraphics.fillRect(x + squareSize, y + squareSize, squareSize, squareSize);
            }
        }
        
        // Generate texture
        finishGraphics.generateTexture('finishLine', 10, 100);
    }
}
