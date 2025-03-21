/**
 * Horse Name Generator
 * Generates unique horse names by combining adjectives and nouns
 */
class NameGenerator {
    constructor() {
        this.adjectives = [
            "Swift", "Mighty", "Brave", "Royal", "Noble", "Dashing", "Glorious", "Majestic",
            "Proud", "Golden", "Thunder", "Lightning", "Silver", "Wild", "Lucky", "Blazing",
            "Stellar", "Cosmic", "Northern", "Southern", "Eastern", "Western", "Mystic", "Ancient",
            "Fiery", "Stormy", "Rapid", "Steady", "Grand", "Regal", "Crimson", "Emerald"
        ];
        
        this.nouns = [
            "Arrow", "Spirit", "Star", "Wind", "Shadow", "Flame", "Legend", "Champion",
            "Fury", "Rider", "Runner", "Dash", "Dream", "Quest", "Knight", "Storm",
            "Bolt", "Glory", "Victory", "Prince", "Duke", "King", "Queen", "Duchess",
            "Whisper", "Thunder", "Lightning", "Breeze", "Gale", "Tempest", "Blaze", "Flash"
        ];
        
        this.usedNames = new Set();
    }
    
    generateName() {
        let name = "";
        let attempts = 0;
        const maxAttempts = 100;
        
        while ((name === "" || this.usedNames.has(name)) && attempts < maxAttempts) {
            const adjIndex = Math.floor(Math.random() * this.adjectives.length);
            const nounIndex = Math.floor(Math.random() * this.nouns.length);
            
            name = `${this.adjectives[adjIndex]} ${this.nouns[nounIndex]}`;
            attempts++;
        }
        
        if (attempts === maxAttempts) {
            // If we've tried too many times, just add a number suffix
            name = `${name} ${Math.floor(Math.random() * 100)}`;
        }
        
        this.usedNames.add(name);
        return name;
    }
    
    reset() {
        this.usedNames.clear();
    }
}

// Export the name generator
const nameGenerator = new NameGenerator();
