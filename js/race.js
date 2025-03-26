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
        this.currentTime = 0;
        
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
        this.finishLine = this.add.graphics();
        this.finishLine.lineStyle(2, 0xffffff, 1);
        
        // Create a checkered pattern for the finish line
        const finishX = this.trackCenterX + (this.trackWidth * 0.35);
        const finishTopY = this.trackCenterY - (this.trackHeight * 0.3);
        const finishBottomY = this.trackCenterY;
        const segmentHeight = (finishBottomY - finishTopY) / 10; // 10 segments for checkered pattern
        
        for (let i = 0; i < 10; i++) {
            this.finishLine.fillStyle(i % 2 === 0 ? 0x000000 : 0xffffff, 1);
            this.finishLine.fillRect(
                finishX - 5, 
                finishTopY + (i * segmentHeight), 
                10, 
                segmentHeight
            );
        }
        
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
            this.finishLine.clear();
            const finishX = this.trackCenterX + (this.trackWidth * 0.35);
            const finishTopY = this.trackCenterY - (this.trackHeight * 0.3);
            const finishBottomY = this.trackCenterY;
            const segmentHeight = (finishBottomY - finishTopY) / 10; // 10 segments for checkered pattern
            
            for (let i = 0; i < 10; i++) {
                this.finishLine.fillStyle(i % 2 === 0 ? 0x000000 : 0xffffff, 1);
                this.finishLine.fillRect(
                    finishX - 5, 
                    finishTopY + (i * segmentHeight), 
                    10, 
                    segmentHeight
                );
            }
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
        
        // Define specific horses for all lanes
        const specificHorses = [
            "Fusaichi Pegasus", // Lane 1 (index 0) - Black
            "Aura Boost",       // Lane 2 (index 1) - White Smoke
            "Orchid Dream",     // Lane 3 (index 2) - Orchid
            "Shell Beach",      // Lane 4 (index 3) - Light Sea Green
            "Rose Runner",      // Lane 5 (index 4) - American Rose
            "Dusty Trails",     // Lane 6 (index 5) - Tan
            "Amber Flash",      // Lane 7 (index 6) - Dark Orange
            "Green Lightning",  // Lane 8 (index 7) - Lime Green
            "Royal Thunder",    // Lane 9 (index 8) - Royal Blue
            "Pink Dash",        // Lane 10 (index 9) - Hot Pink
            "Silver Streak",    // Lane 11 (index 10) - Silver
            "Golden Arrow"      // Lane 12 (index 11) - Dark Goldenrod
        ];
        
        // Define fixed colors for each lane
        const fixedColors = [
            "#000000", // Black
            "#F5F5F5", // White Smoke
            "#DA70D6", // Orchid
            "#20B2AA", // Light Sea Green
            "#FF033E", // American Rose
            "#D2B48C", // Tan
            "#FF8C00", // Dark Orange
            "#32CD32", // Lime Green
            "#4169E1", // Royal Blue
            "#FF69B4", // Hot Pink
            "#C0C0C0", // Silver
            "#B8860B"  // Dark Goldenrod
        ];
        
        // Create horses
        const horseListElement = document.getElementById('horse-list');
        if (horseListElement) {
            horseListElement.innerHTML = '';
            
            for (let i = 0; i < this.numHorses; i++) {
                // Use specific horse name for each lane
                const horseName = (i < specificHorses.length) ? specificHorses[i] : `Horse ${i+1}`;
                
                // Get color for this lane
                const horseColor = (i < fixedColors.length) ? fixedColors[i] : this.getRandomHexColor();
                
                // Create horse instance with explicit color
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
                console.log(`Added horse ${i+1}: ${horseName} with color ${horseColor}`);
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
        this.raceStartTime = performance.now();
        this.finishedHorses = [];
        
        // Hide the entire results panel container
        const resultsPanel = document.querySelector('.results-panel');
        if (resultsPanel) {
            resultsPanel.style.display = 'none';
            console.log('Hiding results panel container at race start');
        }
        
        this.updateRaceInfo();
        this.updateHorseList();
        
        // Reset horses
        this.horses.forEach(horse => horse.reset());
        
        // Start countdown
        this.startCountdown();
    }
    
    startCountdown() {
        let count = 3;
        this.countdownText.setText(count.toString());
        this.countdownText.setAlpha(1);
        
        // Disable the race movement during countdown
        this.raceInProgress = false;
        
        // Clear the race time display during countdown
        const raceTimeElement = document.getElementById('race-time');
        if (raceTimeElement) {
            raceTimeElement.textContent = '0.00s';
        }
        
        const resultsPanel = document.querySelector('.results-panel');
        resultsPanel.style.display = 'none';
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdownText.setText(count.toString());
            } else {
                clearInterval(countdownInterval);
                this.countdownText.setText('GO!');
                
                // When GO appears, wait briefly then start the race
                setTimeout(() => {
                    this.countdownText.setAlpha(0);
                    this.beginRace();
                    resultsPanel.style.display = 'block'; // Show results panel after race
                }, 1000);
            }
        }, 1000);
    }
    
    beginRace() {
        console.log("Begin race called, setting race in progress");
        
        // Set the race start time to the current time when the race actually begins
        this.raceStartTime = this.time.now;
        
        // Enable race movement and update the timer
        this.raceInProgress = true;
        
        // Update the timer initially to 0.00
        const raceTimeElement = document.getElementById('race-time');
        if (raceTimeElement) {
            raceTimeElement.textContent = '0.00s';
        }
    }
    
    horseFinished(horse) {
        console.log(`Horse ${horse.name} finished the race in position ${this.finishedHorses.length + 1}`);
        this.finishedHorses.push(horse);
        horse.position = this.finishedHorses.length;
        
        // If all horses have finished
        if (this.finishedHorses.length >= this.numHorses) {
            this.raceInProgress = false;
            console.log("Race completed!");
            
            // Display the winner prominently
            const winner = this.finishedHorses[0];
            const finishTime = ((winner.finishTime - this.raceStartTime) / 1000).toFixed(2);
            console.log(`Winner: ${winner.name} with time ${finishTime}s`);
            
            // Update the UI to show the final results
            this.updateResultsPanel();
        } else if (this.finishedHorses.length === 1) {
            // Update status for first place finisher
        }
        
        // Update results panel
        this.updateResultsPanel();
    }
    
    updateResultsPanel() {
        const resultsContent = document.getElementById('results-panel');
        const resultsContainer = document.querySelector('.results-panel');
        
        if (!resultsContent || !resultsContainer) {
            console.error("Could not find results panel elements");
            return;
        }
        
        resultsContent.innerHTML = '';
        resultsContainer.style.display = 'none';
        console.log('Hiding results panel container during update');
        
        if (!this.raceInProgress && this.finishedHorses.length === this.numHorses) {
            // Show race results only after the race is complete
            resultsContainer.style.display = 'block';
            console.log('Showing results panel container after race');
            
            const resultsTitle = document.createElement('h2');
            resultsTitle.textContent = 'Race Results';
            resultsContent.appendChild(resultsTitle);

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
                resultsContent.appendChild(resultItem);
            });
        }
    }
    
    updateHorseList() {
        const horseListElement = document.getElementById('horse-list');
        if (horseListElement) {
            horseListElement.innerHTML = ''; // Clear the current list

            // Sort horses by distance
            const sortedHorses = this.horses.slice().sort((a, b) => b.distance - a.distance);

            // Display top 6 horses
            sortedHorses.slice(0, 7).forEach((horse, index) => {
                const horseElement = document.createElement('div');
                horseElement.className = 'horse-item';
                horseElement.innerHTML = `
                    <div class="horse-position">${index + 1}</div> &nbsp;
                    <div class="horse-color" style="background-color: ${Phaser.Display.Color.IntegerToColor(horse.color).rgba}"></div>
                    <div class="horse-name">${horse.name}</div>
                `;
                horseListElement.appendChild(horseElement);
            });
        }
    }
    
    resetRace() {
        // Reset race state
        this.raceInProgress = false;
        this.raceStartTime = 0;
        this.currentTime = 0;
        this.finishedHorses = [];
        
        // Hide results panel when resetting
        const resultsContainer = document.querySelector('.results-panel');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
            console.log('Hiding results panel on reset');
        }
        
        // Reset horses
        this.horses.forEach(horse => horse.reset());
        
        // Reset camera position
        this.cameras.main.scrollX = 0;
        
        // Update UI
        this.updateRaceInfo();
        this.updateHorseList();
        this.updateResultsPanel();
        
        // Enable UI controls
        this.enableRaceControls();
    }
    
    enableRaceControls() {
        const startRaceButton = document.getElementById('start-race');
        if (startRaceButton) {
            startRaceButton.disabled = false;
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
            
            // Update the raceTime - only if race has actually started
            if (this.raceStartTime > 0) {
                this.currentTime = time;
                this.updateRaceInfo();
                
                // Update UI elements
                this.updateHorseList();
                this.updateResultsPanel();
                
                // Check if all horses have finished
                if (this.finishedHorses.length >= this.numHorses) {
                    this.raceInProgress = false;
                    console.log("Race completed!");
                }
            }
        }
    }
    
    updateRaceInfo() {
        const raceTimeElement = document.getElementById('race-time');
        const lapProgressElement = document.getElementById('lap-progress');
        
        if (raceTimeElement && lapProgressElement) {
            // Only show elapsed time if race has started
            if (this.raceStartTime > 0) {
                const elapsedTime = (this.currentTime - this.raceStartTime) / 1000;
                raceTimeElement.textContent = `Race Time: ${elapsedTime.toFixed(2)}s`;
            } else {
                raceTimeElement.textContent = 'Race Time: 0.00s';
            }
            
            // Update lap information
            if (this.horses.length > 0) {
                const leadingHorse = this.horses.reduce((leader, horse) => 
                    !horse.finished && horse.distance > leader.distance ? horse : leader, this.horses[0]);
                const leadingLap = Math.min(this.totalLaps, Math.floor(leadingHorse.distance / this.trackLength) + 1);
                lapProgressElement.textContent = `Lap: ${leadingLap}/${this.totalLaps}`;
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
