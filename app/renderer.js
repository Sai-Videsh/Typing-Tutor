const { ipcRenderer } = require('electron');

let currentParagraph = '';
let startTime = 0;
let selectedDifficulty = 'Easy'; // Set default difficulty
let currentUser = ''; // Add this to store username globally

// Add this function to validate and set username
window.setUsername = function() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();
    
    if (!username) {
        usernameInput.style.borderColor = '#ff4444';
        usernameInput.placeholder = 'Please enter your name first';
        setTimeout(() => {
            usernameInput.style.borderColor = '#3e497a';
            usernameInput.placeholder = 'Enter your name';
        }, 2000);
        return false;
    }
    
    currentUser = username;
    usernameInput.disabled = true; // Lock the username field
    return true;
};

// Add this function to check if we can enable the start button
function checkStartConditions() {
    const username = document.getElementById('username').value.trim();
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = !username || !selectedDifficulty;
}

// Update setDifficulty function
window.setDifficulty = function(level) {
    selectedDifficulty = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
    document.getElementById('easyBtn').style.fontWeight = (level === 'Easy') ? 'bold' : 'normal';
    document.getElementById('mediumBtn').style.fontWeight = (level === 'Medium') ? 'bold' : 'normal';
    document.getElementById('hardBtn').style.fontWeight = (level === 'Hard') ? 'bold' : 'normal';
    checkStartConditions(); // Check if we can enable start button
};

// Update runTypingTutor to use stored username
window.runTypingTutor = async function() {
    if (!setUsername()) return; // Validate username first
    if (!selectedDifficulty) return;

    document.getElementById('output').innerText = 'Loading...';
    document.getElementById('result').innerText = '';
    document.getElementById('userInput').value = '';
    document.getElementById('submitBtn').disabled = false; // Enable submit on new test

    const result = await ipcRenderer.invoke('run-typing-tutor', ['--get-paragraph', selectedDifficulty]);
    const match = result.match(/Random Paragraph:\s*([\s\S]*)/);
    currentParagraph = match ? match[1].trim() : '';
    document.getElementById('output').innerText = currentParagraph || "Could not load paragraph!";
    startTime = Date.now();
};

// Update submitTyping to use stored username
window.submitTyping = async function() {
    if (!currentUser) return; // Ensure we have a username

    const userInput = document.getElementById('userInput').value;
    const timeTaken = (Date.now() - startTime) / 1000; // seconds
    const caseInsensitive = document.getElementById('caseSensitive').checked ? 0 : 1;

    const args = [
        currentUser,
        selectedDifficulty,
        caseInsensitive.toString(),
        timeTaken.toString(),
        userInput,
        currentParagraph
    ];
    const result = await ipcRenderer.invoke('run-typing-tutor', args);

    // Only show the stats part (everything after "Typing Stats:")
    const statsMatch = result.match(/Typing Stats:\n([\s\S]*)/);
    document.getElementById('result').innerText = statsMatch ? statsMatch[1].trim() : result;
    document.getElementById('submitBtn').disabled = true; // Disable after submit
};

// Update showLeaderboard to use stored username
window.showLeaderboard = async function() {
    if (!currentUser) {
        if (!setUsername()) return;
    }

    const result = await ipcRenderer.invoke('run-typing-tutor', [
        '--get-leaderboard',
        selectedDifficulty || "Easy",
        currentUser
    ]);

    document.getElementById('leaderboard').innerHTML = result;
    document.getElementById('leaderboard').style.display = 'block';
};

document.getElementById('userInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitTyping();
  }
});

// Add event listener for username input
document.getElementById('username').addEventListener('input', function() {
    checkStartConditions();
});

// When page loads, highlight Easy button
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('easyBtn').style.fontWeight = 'bold';
    checkStartConditions(); // Check if we can enable start button
});