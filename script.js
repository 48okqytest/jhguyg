document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let balance = 1000;
    let currentGame = 'slots';
    let coinChoice = null;
    let rocketInterval;
    let rocketMultiplier = 1;
    let rocketPosition = 0;
    let rocketExploded = false;

    // DOM elements
    const balanceElement = document.getElementById('balance');
    const gameTabs = document.querySelectorAll('.game-tab');
    const games = document.querySelectorAll('.game');
    const addBalanceBtn = document.getElementById('add-balance');
    const addBalanceModal = document.getElementById('add-balance-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const balanceOptions = document.querySelectorAll('.balance-option');

    // Initialize the app
    init();

    function init() {
        // Set up event listeners
        setupGameTabs();
        setupSlotsGame();
        setupRocketGame();
        setupCoinFlipGame();
        setupBalanceModal();

        // Update balance display
        updateBalance();
    }

    function setupGameTabs() {
        gameTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs and games
                gameTabs.forEach(t => t.classList.remove('active'));
                games.forEach(g => g.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding game
                this.classList.add('active');
                currentGame = this.dataset.game;
                document.getElementById(`${currentGame}-game`).classList.add('active');
                
                // Reset any game states when switching
                resetRocketGame();
                resetCoinFlipGame();
            });
        });
    }

    function setupSlotsGame() {
        const spinBtn = document.getElementById('spin-btn');
        const betAmount = document.getElementById('slots-bet');
        const betButtons = document.querySelectorAll('#slots-game .bet-btn');
        const reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ];
        const resultMessage = document.getElementById('slots-result');

        // Bet amount controls
        betButtons.forEach(button => {
            button.addEventListener('click', function() {
                let currentBet = parseInt(betAmount.textContent);
                let change = parseInt(this.dataset.amount);
                let newBet = currentBet + change;
                
                if (newBet >= 10 && newBet <= balance) {
                    betAmount.textContent = newBet;
                } else if (newBet < 10) {
                    betAmount.textContent = 10;
                } else if (newBet > balance) {
                    betAmount.textContent = balance;
                }
            });
        });

        // Spin button
        spinBtn.addEventListener('click', function() {
            const bet = parseInt(betAmount.textContent);
            
            if (bet > balance) {
                showResultMessage(resultMessage, `You don't have enough balance!`, 'lose');
                return;
            }
            
            // Deduct bet from balance
            balance -= bet;
            updateBalance();
            
            // Disable button during spin
            spinBtn.disabled = true;
            
            // Spin each reel with different durations for a more natural effect
            spinReel(reels[0], 1000);
            spinReel(reels[1], 1200);
            spinReel(reels[2], 1400, function() {
                // All reels have stopped
                spinBtn.disabled = false;
                
                // Check for win
                const values = reels.map(reel => reel.textContent);
                if (values[0] === values[1] && values[1] === values[2]) {
                    // All three match - big win
                    const winAmount = bet * 5;
                    balance += winAmount;
                    updateBalance();
                    showResultMessage(resultMessage, `JACKPOT! You won ${winAmount}`, 'win');
                } else if (values[0] === values[1] || values[1] === values[2] || values[0] === values[2]) {
                    // Two match - small win
                    const winAmount = bet * 2;
                    balance += winAmount;
                    updateBalance();
                    showResultMessage(resultMessage, `You won ${winAmount}`, 'win');
                } else {
                    // No matches - lose
                    showResultMessage(resultMessage, `You lost ${bet}`, 'lose');
                }
            });
        });
    }

    function spinReel(reel, duration, callback) {
        const symbols = ['7', '🍒', '🍋', '🍊', '🍇', '🍉'];
        const startTime = Date.now();
        
        function updateReel() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Faster spinning at start, slowing down at end
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            
            if (progress < 1) {
                // Still spinning - show random symbol
                const randomIndex = Math.floor(Math.random() * symbols.length);
                reel.textContent = symbols[randomIndex];
                requestAnimationFrame(updateReel);
            } else {
                // Finished - set final symbol
                const randomIndex = Math.floor(Math.random() * symbols.length);
                reel.textContent = symbols[randomIndex];
                if (callback) callback();
            }
        }
        
        updateReel();
    }

    function setupRocketGame() {
        const launchBtn = document.getElementById('launch-btn');
        const cashoutBtn = document.getElementById('cashout-btn');
        const betAmount = document.getElementById('rocket-bet');
        const betButtons = document.querySelectorAll('#rocket-game .bet-btn');
        const rocket = document.getElementById('rocket');
        const resultMessage = document.getElementById('rocket-result');

        // Bet amount controls
        betButtons.forEach(button => {
            button.addEventListener('click', function() {
                let currentBet = parseInt(betAmount.textContent);
                let change = parseInt(this.dataset.amount);
                let newBet = currentBet + change;
                
                if (newBet >= 10 && newBet <= balance) {
                    betAmount.textContent = newBet;
                } else if (newBet < 10) {
                    betAmount.textContent = 10;
                } else if (newBet > balance) {
                    betAmount.textContent = balance;
                }
            });
        });

        // Launch button
        launchBtn.addEventListener('click', function() {
            const bet = parseInt(betAmount.textContent);
            
            if (bet > balance) {
                showResultMessage(resultMessage, `You don't have enough balance!`, 'lose');
                return;
            }
            
            // Deduct bet from balance
            balance -= bet;
            updateBalance();
            
            // Disable launch button, enable cashout
            launchBtn.disabled = true;
            cashoutBtn.disabled = false;
            
            // Reset rocket position
            rocketPosition = 0;
            rocket.style.bottom = `${rocketPosition}px`;
            rocketExploded = false;
            rocketMultiplier = 1;
            
            // Start rocket animation
            rocketInterval = setInterval(function() {
                if (rocketExploded) return;
                
                rocketPosition += 2;
                rocket.style.bottom = `${rocketPosition}px`;
                
                // Calculate current multiplier based on position
                rocketMultiplier = 1 + Math.floor(rocketPosition / 50) * 0.2;
                
                // Update cashout button
                cashoutBtn.textContent = `CASHOUT ${rocketMultiplier.toFixed(1)}x`;
                
                // Random chance to explode increases with height
                const explosionChance = rocketPosition / 1000;
                if (Math.random() < explosionChance) {
                    explodeRocket();
                }
                
                // Limit rocket height
                if (rocketPosition >= 250) {
                    explodeRocket();
                }
            }, 50);
        });

        // Cashout button
        cashoutBtn.addEventListener('click', function() {
            if (rocketExploded) return;
            
            clearInterval(rocketInterval);
            
            const bet = parseInt(betAmount.textContent);
            const winAmount = Math.floor(bet * rocketMultiplier);
            balance += winAmount;
            updateBalance();
            
            showResultMessage(resultMessage, `Cashed out at ${rocketMultiplier.toFixed(1)}x! You won ${winAmount}`, 'win');
            
            // Reset buttons
            launchBtn.disabled = false;
            cashoutBtn.disabled = true;
            
            // Animate rocket flying away
            rocketExploded = true;
            setTimeout(function() {
                rocket.style.bottom = '250px';
                rocket.style.opacity = '0';
                setTimeout(function() {
                    rocket.style.transition = 'none';
                    rocket.style.bottom = '0';
                    rocket.style.opacity = '1';
                    setTimeout(() => rocket.style.transition = 'bottom 0.1s linear', 10);
                }, 1000);
            }, 500);
        });

        function explodeRocket() {
            if (rocketExploded) return;
            
            clearInterval(rocketInterval);
            rocketExploded = true;
            
            // Show explosion animation
            rocket.innerHTML = '💥';
            rocket.style.fontSize = '40px';
            
            setTimeout(function() {
                rocket.innerHTML = '<i class="fas fa-rocket"></i>';
                rocket.style.fontSize = '30px';
                rocket.style.bottom = '0';
                
                // Reset buttons
                launchBtn.disabled = false;
                cashoutBtn.disabled = true;
                
                showResultMessage(resultMessage, `Rocket exploded! You lost ${betAmount.textContent}`, 'lose');
            }, 1000);
        }
    }

    function resetRocketGame() {
        clearInterval(rocketInterval);
        const rocket = document.getElementById('rocket');
        rocket.innerHTML = '<i class="fas fa-rocket"></i>';
        rocket.style.bottom = '0';
        rocket.style.fontSize = '30px';
        rocket.style.opacity = '1';
        rocket.style.transition = 'bottom 0.1s linear';
        
        document.getElementById('launch-btn').disabled = false;
        document.getElementById('cashout-btn').disabled = true;
        document.getElementById('rocket-result').classList.remove('show');
    }

    function setupCoinFlipGame() {
        const flipBtn = document.getElementById('flip-btn');
        const coin = document.getElementById('coin');
        const betAmount = document.getElementById('coin-bet');
        const betButtons = document.querySelectorAll('#coinflip-game .bet-btn');
        const choiceButtons = document.querySelectorAll('.coin-choice');
        const resultMessage = document.getElementById('coin-result');

        // Bet amount controls
        betButtons.forEach(button => {
            button.addEventListener('click', function() {
                let currentBet = parseInt(betAmount.textContent);
                let change = parseInt(this.dataset.amount);
                let newBet = currentBet + change;
                
                if (newBet >= 10 && newBet <= balance) {
                    betAmount.textContent = newBet;
                } else if (newBet < 10) {
                    betAmount.textContent = 10;
                } else if (newBet > balance) {
                    betAmount.textContent = balance;
                }
            });
        });

        // Coin choice buttons
        choiceButtons.forEach(button => {
            button.addEventListener('click', function() {
                choiceButtons.forEach(btn => btn.classList.remove('selected'));
                this.classList.add('selected');
                coinChoice = this.dataset.choice;
                flipBtn.disabled = false;
            });
        });

        // Flip button
        flipBtn.addEventListener('click', function() {
            const bet = parseInt(betAmount.textContent);
            
            if (bet > balance) {
                showResultMessage(resultMessage, `You don't have enough balance!`, 'lose');
                return;
            }
            
            if (!coinChoice) return;
            
            // Deduct bet from balance
            balance -= bet;
            updateBalance();
            
            // Disable buttons during flip
            flipBtn.disabled = true;
            choiceButtons.forEach(btn => btn.disabled = true);
            
            // Flip the coin
            coin.classList.add('flipping');
            
            // Determine result after animation
            setTimeout(function() {
                const isHeads = Math.random() < 0.5;
                const result = isHeads ? 'heads' : 'tails';
                
                // Check if player won
                if (result === coinChoice) {
                    const winAmount = bet * 1.95; // Slight house edge
                    balance += Math.floor(winAmount);
                    updateBalance();
                    showResultMessage(resultMessage, `You won ${Math.floor(winAmount)}!`, 'win');
                } else {
                    showResultMessage(resultMessage, `You lost ${bet}!`, 'lose');
                }
                
                // Reset for next flip
                setTimeout(function() {
                    coin.classList.remove('flipping');
                    choiceButtons.forEach(btn => btn.disabled = false);
                    flipBtn.disabled = false;
                }, 500);
            }, 1500);
        });
    }

    function resetCoinFlipGame() {
        const coin = document.getElementById('coin');
        coin.classList.remove('flipping');
        
        document.querySelectorAll('.coin-choice').forEach(btn => {
            btn.classList.remove('selected');
            btn.disabled = false;
        });
        
        document.getElementById('flip-btn').disabled = true;
        document.getElementById('coin-result').classList.remove('show');
        coinChoice = null;
    }

    function setupBalanceModal() {
        addBalanceBtn.addEventListener('click', function() {
            addBalanceModal.classList.add('active');
        });
        
        closeModalBtn.addEventListener('click', function() {
            addBalanceModal.classList.remove('active');
        });
        
        balanceOptions.forEach(option => {
            option.addEventListener('click', function() {
                const amount = parseInt(this.dataset.amount);
                balance += amount;
                updateBalance();
                addBalanceModal.classList.remove('active');
            });
        });
    }

    function updateBalance() {
        balanceElement.textContent = balance;
        
        // Update bet amounts if they exceed balance
        const betAmounts = document.querySelectorAll('.bet-amount span');
        betAmounts.forEach(amountElement => {
            const currentBet = parseInt(amountElement.textContent);
            if (currentBet > balance) {
                amountElement.textContent = balance >= 10 ? balance : 10;
            }
        });
    }

    function showResultMessage(element, message, type) {
        element.textContent = message;
        element.classList.remove('win', 'lose', 'show');
        setTimeout(() => {
            element.classList.add(type, 'show');
        }, 10);
        
        // Hide message after some time
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
});
