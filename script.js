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
    const sadFace = document.getElementById('sad-face');
    const confettiContainer = document.getElementById('confetti');

    // Initialize particles.js
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#6c5ce7" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#6c5ce7", opacity: 0.3, width: 1 },
            move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" }
            }
        }
    });

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
                showSadFace();
                return;
            }
            
            // Deduct bet from balance
            balance -= bet;
            updateBalance();
            
            // Disable button during spin
            spinBtn.disabled = true;
            spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SPINNING';
            
            // Spin each reel with different durations for a more natural effect
            spinReel(reels[0], 1000);
            spinReel(reels[1], 1200);
            spinReel(reels[2], 1400, function() {
                // All reels have stopped
                spinBtn.disabled = false;
                spinBtn.innerHTML = '<i class="fas fa-redo"></i> SPIN';
                
                // Check for win
                const values = reels.map(reel => reel.textContent);
                if (values[0] === '7' && values[1] === '7' && values[2] === '7') {
                    // Three 7s - mega win (20x)
                    const winAmount = bet * 20;
                    balance += winAmount;
                    updateBalance();
                    showResultMessage(resultMessage, `JACKPOT! 777! You won ${winAmount}`, 'win');
                    triggerConfetti();
                    triggerFloatingCoins(30);
                    playSound('win');
                } else if (values[0] === values[1] && values[1] === values[2]) {
                    // All three match - big win (5x)
                    const winAmount = bet * 5;
                    balance += winAmount;
                    updateBalance();
                    showResultMessage(resultMessage, `TRIPLE! You won ${winAmount}`, 'win');
                    triggerConfetti();
                    playSound('win');
                } else if (values[0] === values[1] || values[1] === values[2] || values[0] === values[2]) {
                    // Two match - small win (2x)
                    const winAmount = bet * 2;
                    balance += winAmount;
                    updateBalance();
                    showResultMessage(resultMessage, `DOUBLE! You won ${winAmount}`, 'win');
                    playSound('win');
                } else {
                    // No matches - lose
                    showResultMessage(resultMessage, `You lost ${bet}`, 'lose');
                    showSadFace();
                    playSound('lose');
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
                showSadFace();
                return;
            }
            
            // Deduct bet from balance
            balance -= bet;
            updateBalance();
            
            // Disable launch button, enable cashout
            launchBtn.disabled = true;
            launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> FLYING';
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
                cashoutBtn.innerHTML = `<i class="fas fa-hand-holding-usd"></i> CASHOUT ${rocketMultiplier.toFixed(1)}x`;
                
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
            launchBtn.innerHTML = '<i class="fas fa-paper-plane"></i> LAUNCH';
            cashoutBtn.disabled = true;
            
            // Animate rocket flying away
            rocketExploded = true;
            playSound('win');
            
            if (rocketMultiplier >= 5) {
                triggerConfetti();
            }
            
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
            playSound('explosion');
            
            setTimeout(function() {
                rocket.innerHTML = '<i class="fas fa-rocket"></i>';
                rocket.style.fontSize = '30px';
                rocket.style.bottom = '0';
                
                // Reset buttons
                launchBtn.disabled = false;
                launchBtn.innerHTML = '<i class="fas fa-paper-plane"></i> LAUNCH';
                cashoutBtn.disabled = true;
                
                showResultMessage(resultMessage, `Rocket exploded! You lost ${betAmount.textContent}`, 'lose');
                showSadFace();
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
        document.getElementById('launch-btn').innerHTML = '<i class="fas fa-paper-plane"></i> LAUNCH';
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
                showSadFace();
                return;
            }
            
            if (!coinChoice) return;
            
            // Deduct bet from balance
            balance -= bet;
            updateBalance();
            
            // Disable buttons during flip
            flipBtn.disabled = true;
            flipBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> FLIPPING';
            choiceButtons.forEach(btn => btn.disabled = true);
            
            // Flip the coin
            coin.classList.add('flipping');
            playSound('flip');
            
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
                    if (winAmount > bet * 3) {
                        triggerConfetti();
                    }
                    playSound('win');
                } else {
                    showResultMessage(resultMessage, `You lost ${bet}!`, 'lose');
                    showSadFace();
                    playSound('lose');
                }
                
                // Reset for next flip
                setTimeout(function() {
                    coin.classList.remove('flipping');
                    choiceButtons.forEach(btn => {
                        btn.disabled = false;
                        btn.classList.remove('selected');
                    });
                    flipBtn.disabled = false;
                    flipBtn.innerHTML = '<i class="fas fa-sync-alt"></i> FLIP';
                    coinChoice = null;
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
        document.getElementById('flip-btn').innerHTML = '<i class="fas fa-sync-alt"></i> FLIP';
        document.getElementById('coin-result').classList.remove('show');
        coinChoice = null;
    }

    function setupBalanceModal() {
        addBalanceBtn.addEventListener('click', function() {
            addBalanceModal.classList.add('active');
            playSound('click');
        });
        
        closeModalBtn.addEventListener('click', function() {
            addBalanceModal.classList.remove('active');
            playSound('click');
        });
        
        balanceOptions.forEach(option => {
            option.addEventListener('click', function() {
                const amount = parseInt(this.dataset.amount);
                balance += amount;
                updateBalance();
                addBalanceModal.classList.remove('active');
                playSound('coins');
                triggerFloatingCoins(10);
            });
        });
    }

    function updateBalance() {
        balanceElement.textContent = balance;
        
        // Animate balance change
        balanceElement.classList.add('balance-update');
        setTimeout(() => {
            balanceElement.classList.remove('balance-update');
        }, 500);
        
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

    function showSadFace() {
        sadFace.classList.add('show');
        setTimeout(() => {
            sadFace.classList.remove('show');
        }, 2000);
    }

    function triggerConfetti() {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6c5ce7', '#00cec9', '#fdcb6e', '#00b894']
        });
    }

    function triggerFloatingCoins(count) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.className = 'floating-coin';
                coin.innerHTML = '<i class="fas fa-coins"></i>';
                coin.style.left = `${Math.random() * 100}%`;
                coin.style.top = '100vh';
                coin.style.color = ['#fdcb6e', '#00cec9', '#6c5ce7'][Math.floor(Math.random() * 3)];
                document.body.appendChild(coin);
                
                setTimeout(() => {
                    document.body.removeChild(coin);
                }, 3000);
            }, i * 100);
        }
    }

    function playSound(type) {
        // In a real implementation, you would play actual sound files here
        // For this demo, we'll just simulate it with console logs
        const sounds = {
            'win': { pitch: 1.5, duration: 0.5 },
            'lose': { pitch: 0.8, duration: 0.3 },
            'click': { pitch: 1.2, duration: 0.1 },
            'coins': { pitch: 1.8, duration: 0.8 },
            'explosion': { pitch: 0.5, duration: 1.0 },
            'flip': { pitch: 1.0, duration: 1.5 }
        };
        
        // This would be replaced with actual audio playback
        console.log(`Playing ${type} sound`);
    }
});
