/**
 * Main Application
 * Initializes the Phaser game and handles UI interactions
 */
document.addEventListener('DOMContentLoaded', function() {
    // Configure and start Phaser game
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 400,
        parent: 'game-container',
        scene: [RaceScene],
        backgroundColor: '#55aa55',
        pixelArt: false
    };
    
    // Initialize the game
    const game = new Phaser.Game(config);
    
    // Store scene reference once created
    let raceScene = null;
    
    // Setup event handlers
    const startRaceButton = document.getElementById('start-race');
    const resetRaceButton = document.getElementById('reset-race');
    
    // Function to access the race scene once it's created
    // The 'create' event doesn't exist on game.events in Phaser 3
    // We'll use a slight delay to ensure the scene is ready
    setTimeout(() => {
        raceScene = game.scene.getScene('RaceScene');
        console.log("Race scene initialized:", raceScene);
    }, 1000);
    
    startRaceButton.addEventListener('click', function() {
        console.log("Start race button clicked, race scene:", raceScene);
        if (raceScene && !raceScene.raceInProgress) {
            raceScene.startRace();
            startRaceButton.disabled = true;
            resetRaceButton.disabled = true;
            
            // Enable reset after a short delay
            setTimeout(() => {
                resetRaceButton.disabled = false;
            }, 3000);
        }
    });
    
    resetRaceButton.addEventListener('click', function() {
        if (raceScene) {
            raceScene.resetRace();
            startRaceButton.disabled = false;
        }
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Start race with spacebar
        if (event.code === 'Space' && raceScene && !raceScene.raceInProgress) {
            startRaceButton.click();
        }
        
        // Reset race with 'R' key
        if (event.code === 'KeyR') {
            resetRaceButton.click();
        }
    });
    
    // Function to adjust the game container size on window resize
    function resizeGameContainer() {
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        
        if (game.scale && containerWidth < 800) {
            const scale = containerWidth / 800;
            game.scale.resize(containerWidth, 400 * scale);
        } else if (game.scale) {
            game.scale.resize(800, 400);
        }
    }
    
    // Initial resize and event listener
    window.addEventListener('resize', resizeGameContainer);
    setTimeout(resizeGameContainer, 100);
    
    // Create directory for assets if needed
    function ensureAssetsExist() {
        // In a real implementation, this would check if assets exist on the server
        // For this implementation, the assets are generated dynamically in the RaceScene
        console.log("Initializing racing simulator...");
    }
    
    ensureAssetsExist();
});
