/**
 * Race Scene
 * Manages the horse racing simulation using Phaser
 */
class RaceScene extends Phaser.Scene {
    constructor() {
        super('RaceScene');
        
        this.horses = [];
        this.numHorses = 12;
        this.trackLength = 1200; // Length of a single lap
        this.totalLaps = 4;     // Total number of laps to complete
        this.totalRaceDistance = this.trackLength * this.totalLaps; // Total race distance
        this.raceInProgress = false;
        this.finishedHorses = [];
        this.raceStartTime = 0;
        
        // Initialize track parameters - will be updated in create()
        this.trackWidth = 0;
        this.trackHeight = 0;
        this.trackCenterX = 0;
        this.trackCenterY = 0;
    }
    
    preload() {
        // Create the assets dynamically instead of trying to load them
        this.createPlaceholderAssets();
        
        // Load horse silhouette
        this.load.image('horse', 'assets/horse-silhouette.png');
        
        console.log("Preloading horse image");
    }
    
    create() {
        // Set track dimensions based on screen size
        this.updateTrackDimensions();
        
        // Create track background
        this.trackBackground = this.add.image(0, 0, 'track').setOrigin(0, 0);
        this.trackBackground.displayWidth = this.scale.width;
        this.trackBackground.displayHeight = this.scale.height;
        
        // Add finish line
        this.finishLine = this.add.image(this.trackCenterX + (this.trackWidth * 0.35), this.trackCenterY - (this.trackHeight * 0.15), 'finishLine').setOrigin(0.5, 1);
        this.finishLine.displayWidth = 10;
        this.finishLine.displayHeight = this.trackHeight * 0.3;
        this.finishLine.rotation = Math.PI / 2; // Rotate to be vertical
        
        // Starting line is at the same position for oval track
        this.startLine = this.add.graphics();
        this.startLine.lineStyle(2, 0xffffff, 1);
        this.startLine.lineBetween(
            this.trackCenterX + (this.trackWidth * 0.35), 
            this.trackCenterY - (this.trackHeight * 0.3), 
            this.trackCenterX + (this.trackWidth * 0.35), 
            this.trackCenterY
        );
        
        // Add lane dividers (now circles)
        this.createLaneDividers();
        
        // Create race status text
        this.statusText = this.add.text(this.scale.width / 2, 20, 'Ready to Race', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5, 0);
        
        // Create countdown text
        this.countdownText = this.add.text(this.scale.width / 2, this.scale.height / 2, '', {
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
    
    // Method to update track dimensions based on screen size
    updateTrackDimensions() {
        // Set track center to center of screen
        this.trackCenterX = this.scale.width / 2;
        this.trackCenterY = this.scale.height / 2;
        
        // Set track size based on screen dimensions
        this.trackWidth = this.scale.width * 0.85;
        this.trackHeight = this.scale.height * 0.75;
        
        // Update track length based on dimensions - approximate the oval circumference
        const a = this.trackWidth / 2; // semi-major axis
        const b = this.trackHeight / 2; // semi-minor axis
        // Approximate ellipse circumference using the formula: 2π * sqrt((a² + b²) / 2)
        this.trackLength = 2 * Math.PI * Math.sqrt((a * a + b * b) / 2);
        
        // Regenerate track assets with new dimensions
        this.createPlaceholderAssets();
        
        // Update track display if it exists
        if (this.trackBackground) {
            this.trackBackground.displayWidth = this.scale.width;
            this.trackBackground.displayHeight = this.scale.height;
        }
        
        // Update finish line if it exists
        if (this.finishLine) {
            this.finishLine.setPosition(this.trackCenterX + (this.trackWidth * 0.35), this.trackCenterY - (this.trackHeight * 0.15));
            this.finishLine.displayHeight = this.trackHeight * 0.3;
        }
        
        // Update start line if it exists
        if (this.startLine) {
            this.startLine.clear();
            this.startLine.lineStyle(2, 0xffffff, 1);
            this.startLine.lineBetween(
                this.trackCenterX + (this.trackWidth * 0.35), 
                this.trackCenterY - (this.trackHeight * 0.3), 
                this.trackCenterX + (this.trackWidth * 0.35), 
                this.trackCenterY
            );
        }
        
        // Update lane dividers
        if (this.lanes) {
            this.createLaneDividers();
        }
        
        // Update horses if they exist
        if (this.horses && this.horses.length > 0) {
            this.horses.forEach(horse => {
                // Use a middle lane as the reference path for all horses (lane 6 or 7)
                const referenceIndex = Math.floor(this.numHorses / 2) - 1; // For 12 horses, this will be lane 6
                const laneWidth = Math.min(this.trackWidth, this.trackHeight) / 300; // Reduced for more compact formation
                // Set all horses to follow the middle lane's path with minimal variation
                horse.laneOffset = (this.numHorses - 1 - referenceIndex) * laneWidth;
                // Add a tiny offset for visual separation (1/10th of the already small lane width)
                horse.laneOffset += (horse.lane - referenceIndex) * (laneWidth * 0.1);
                
                // Update horse position if not in a race
                if (!this.raceInProgress) {
                    const startPosition = this.getPositionOnTrack(0, horse.laneOffset);
                    if (horse.sprite) {
                        horse.sprite.x = startPosition.x;
                        horse.sprite.y = startPosition.y;
                        horse.sprite.rotation = startPosition.rotation + Math.PI/2;
                    }
                    if (horse.nameText) {
                        const nameOffsetX = horse.sprite.width * horse.sprite.scale * 0.5;
                        const nameOffsetY = horse.sprite.height * horse.sprite.scale * 0.5;
                        horse.nameText.x = startPosition.x - nameOffsetX;
                        horse.nameText.y = startPosition.y - nameOffsetY;
                    }
                }
            });
        }
    }
    
    // Method to create lane dividers
    createLaneDividers() {
        if (this.lanes) {
            this.lanes.clear();
        } else {
            this.lanes = this.add.graphics();
        }
        
        this.lanes.lineStyle(1, 0xaaaaaa, 0.5);
        
        // Draw a single ellipse for the track boundary
        const outerRadiusX = this.trackWidth / 2;
        const outerRadiusY = this.trackHeight / 2;
        this.lanes.strokeEllipse(this.trackCenterX, this.trackCenterY, outerRadiusX * 2, outerRadiusY * 2);
        
        // Draw inner ellipse (to create an oval ring)
        const innerRadiusX = this.trackWidth / 2 - (this.trackWidth / 10);
        const innerRadiusY = this.trackHeight / 2 - (this.trackHeight / 10);
        this.lanes.strokeEllipse(this.trackCenterX, this.trackCenterY, innerRadiusX * 2, innerRadiusY * 2);
    }
    
    initHorseList() {
        // Clear existing horses
        this.horses.forEach(horse => horse.destroy());
        this.horses = [];
        this.finishedHorses = [];
        
        // Debug log
        console.log("Initializing horse list with " + this.numHorses + " horses");
        
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
                
                // Debug log
                console.log(`Added horse ${i+1}: ${horseName}`);
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
        
        // Add race status header with lap info
        if (this.raceInProgress) {
            const statusHeader = document.createElement('div');
            statusHeader.className = 'race-status-header';
            const leadingHorse = this.horses.reduce((leader, horse) => 
                !horse.finished && horse.distance > leader.distance ? horse : leader, this.horses[0]);
            const leadingLap = Math.min(this.totalLaps, Math.floor(leadingHorse.distance / this.trackLength) + 1);
            statusHeader.textContent = `Race Progress: Lap ${leadingLap}/${this.totalLaps}`;
            resultsPanel.appendChild(statusHeader);
        }
        
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
        
        // Show progress for horses still racing
        const racingHorses = this.horses.filter(horse => !horse.finished);
        if (racingHorses.length > 0 && racingHorses.length < this.numHorses) {
            const progressHeader = document.createElement('div');
            progressHeader.className = 'progress-header';
            progressHeader.textContent = 'Still Racing';
            resultsPanel.appendChild(progressHeader);
            
            // Sort horses by distance traveled
            racingHorses.sort((a, b) => b.distance - a.distance);
            
            // Show top 3 racing horses
            racingHorses.slice(0, 3).forEach(horse => {
                const progressItem = document.createElement('div');
                progressItem.className = 'progress-item';
                
                const totalProgress = Math.min(100, (horse.distance / this.totalRaceDistance * 100)).toFixed(1);
                const lap = Math.min(this.totalLaps, Math.floor(horse.distance / this.trackLength) + 1);
                progressItem.textContent = `${horse.name}: Lap ${lap}/${this.totalLaps} (${totalProgress}%)`;
                resultsPanel.appendChild(progressItem);
            });
        }
    }
    
    updateHorseList() {
        const horseListElement = document.getElementById('horse-list');
        if (horseListElement) {
            const horseItems = horseListElement.querySelectorAll('.horse-item');
            
            this.horses.forEach((horse, index) => {
                if (horseItems[index]) {
                    // Update position class based on finished status
                    if (horse.finished) {
                        horseItems[index].classList.add('finished');
                    } else {
                        horseItems[index].classList.remove('finished');
                    }
                    
                    // Update lap information
                    let lapInfoElement = horseItems[index].querySelector('.horse-lap-info');
                    if (!lapInfoElement) {
                        lapInfoElement = document.createElement('div');
                        lapInfoElement.className = 'horse-lap-info';
                        horseItems[index].appendChild(lapInfoElement);
                    }
                    
                    if (horse.finished) {
                        lapInfoElement.textContent = 'Finished!';
                        lapInfoElement.classList.add('finished');
                    } else {
                        const lapProgress = Math.min(100, ((horse.distance % this.trackLength) / this.trackLength * 100)).toFixed(0);
                        lapInfoElement.textContent = `Lap ${horse.currentLap}/${this.totalLaps} (${lapProgress}%)`;
                        lapInfoElement.classList.remove('finished');
                    }
                }
            });
        }
    }
    
    resetRace() {
        if (!this.raceInProgress) {
            console.log("Resetting race with " + this.numHorses + " horses");
            this.initHorseList();
            this.statusText.setText('Ready to Race');
            
            // Reset buttons
            const startRaceButton = document.getElementById('start-race');
            if (startRaceButton) {
                startRaceButton.disabled = false;
            }
        } else {
            console.log("Cannot reset while race is in progress");
            this.raceInProgress = false; // Force reset if race is still in progress
            setTimeout(() => this.resetRace(), 100); // Try again after a short delay
        }
    }
    
    update(time, delta) {
        if (this.raceInProgress) {
            // Update horses
            this.horses.forEach(horse => {
                if (!horse.finished) {
                    horse.update(time, delta);
                }
            });
            
            // Update the raceTime
            const totalRaceTime = (time - this.raceStartTime) / 1000;
            const raceTimeElement = document.getElementById('race-time');
            if (raceTimeElement) {
                raceTimeElement.textContent = totalRaceTime.toFixed(2) + 's';
            }
            
            // Update horse list and results panel
            this.updateHorseList();
            this.updateResultsPanel();
            
            // Check if all horses have finished
            if (this.finishedHorses.length >= this.numHorses) {
                this.raceInProgress = false;
                console.log("Race completed!");
            }
        }
    }
    
    // Calculate position on oval track based on distance
    getPositionOnTrack(distance, laneOffset) {
        // Normalize distance to track length (0 to 1)
        const normalizedDistance = (distance % this.trackLength) / this.trackLength;
        
        // Calculate angle based on normalized distance (0 to 2π)
        const angle = normalizedDistance * Math.PI * 2;
        
        // Calculate the base radius (without lane offset) - increased for larger path
        const baseRadiusX = (this.trackWidth / 2) - (this.trackWidth / 55);
        const baseRadiusY = (this.trackHeight / 2) - (this.trackHeight / 55);
        
        // Apply lane offset - smaller offset for more similar paths
        const radiusX = baseRadiusX - laneOffset;
        const radiusY = baseRadiusY - laneOffset;
        
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
        
        // Get current dimensions
        const width = this.scale.width || 800;
        const height = this.scale.height || 600;
        
        // Draw grass background
        trackGraphics.fillStyle(0x55aa55);
        trackGraphics.fillRect(0, 0, width, height);
        
        // Draw oval-shaped track
        trackGraphics.fillStyle(0xbbaa88);
        
        // Draw outer ellipse
        const outerX = this.trackCenterX;
        const outerY = this.trackCenterY;
        const outerWidth = this.trackWidth;
        const outerHeight = this.trackHeight;
        
        // Draw inner ellipse (to create an oval ring) - adjusted for larger path
        const innerWidth = this.trackWidth - (this.trackWidth / 10);
        const innerHeight = this.trackHeight - (this.trackHeight / 10);
        
        // Fill the outer ellipse
        trackGraphics.fillEllipse(outerX, outerY, outerWidth, outerHeight);
        
        // Cut out the inner ellipse by setting composite operation
        trackGraphics.fillStyle(0x55aa55);
        trackGraphics.fillEllipse(outerX, outerY, innerWidth, innerHeight);
        
        // Generate texture
        trackGraphics.generateTexture('track', width, height);
        
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
