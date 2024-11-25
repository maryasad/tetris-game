class Tetris {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.gridSize = 30;
        this.columns = 10;
        this.rows = 20;

        // Set canvas dimensions
        this.canvas.width = this.columns * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;

        // Next piece preview canvas
        this.nextPieceCanvas = document.getElementById('next-piece-preview');
        this.nextPieceContext = this.nextPieceCanvas.getContext('2d');
        this.nextPieceCanvas.width = 120;  // Enough for most piece shapes
        this.nextPieceCanvas.height = 120;

        // Tetromino shapes
        this.shapes = [
            [[1,1,1,1]],
            [[1,1],[1,1]],
            [[1,1,1],[0,1,0]],
            [[1,1,1],[1,0,0]],
            [[1,1,1],[0,0,1]],
            [[1,1,0],[0,1,1]],
            [[0,1,1],[1,1,0]]
        ];

        this.colors = [
            '#FF0D72', '#0DC2FF', '#0DFF72', 
            '#F538FF', '#FF8E0D', '#FFE138', 
            '#3877FF'
        ];

        this.currentPiece = null;
        this.nextPiece = this.createPiece();
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.dropSpeed = 1000;
        this.lastDropTime = 0;
        this.linesCleared = 0;

        // Add sound effects
        this.sounds = {
            move: new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'), // Short beep
            rotate: new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm14IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YV'), // Short beep
            clear: new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm14IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YW')  // Short beep
        };
    }

    createBoard() {
        return Array.from({ length: this.rows }, () => 
            Array(this.columns).fill(0)
        );
    }

    drawBoard() {
        // Draw background grid
        this.context.fillStyle = '#222';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.context.lineWidth = 1;
        
        for (let i = 0; i <= this.rows; i++) {
            this.context.beginPath();
            this.context.moveTo(0, i * this.gridSize);
            this.context.lineTo(this.canvas.width, i * this.gridSize);
            this.context.stroke();
        }
        
        for (let i = 0; i <= this.columns; i++) {
            this.context.beginPath();
            this.context.moveTo(i * this.gridSize, 0);
            this.context.lineTo(i * this.gridSize, this.canvas.height);
            this.context.stroke();
        }

        // Draw blocks with gradient effect
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (this.board[row][col]) {
                    const gradient = this.context.createLinearGradient(
                        col * this.gridSize,
                        row * this.gridSize,
                        (col + 1) * this.gridSize,
                        (row + 1) * this.gridSize
                    );
                    gradient.addColorStop(0, this.board[row][col]);
                    gradient.addColorStop(1, this.adjustColor(this.board[row][col], -30));
                    
                    this.context.fillStyle = gradient;
                    this.context.fillRect(
                        col * this.gridSize,
                        row * this.gridSize,
                        this.gridSize - 1,
                        this.gridSize - 1
                    );
                }
            }
        }
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    createPiece() {
        const randomIndex = Math.floor(Math.random() * this.shapes.length);
        const shape = this.shapes[randomIndex];
        const color = this.colors[randomIndex];

        return {
            shape: shape,
            color: color,
            x: Math.floor(this.columns / 2) - Math.floor(shape[0].length / 2),
            y: 0
        };
    }

    drawPiece(piece) {
        piece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.context.fillStyle = piece.color;
                    this.context.fillRect(
                        (piece.x + dx) * this.gridSize,
                        (piece.y + dy) * this.gridSize,
                        this.gridSize - 1,
                        this.gridSize - 1
                    );
                }
            });
        });
    }

    drawNextPiece() {
        // Clear previous preview
        this.nextPieceContext.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        
        // Set background
        this.nextPieceContext.fillStyle = '#222';
        this.nextPieceContext.fillRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);

        // Draw grid lines
        this.nextPieceContext.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.nextPieceContext.lineWidth = 1;
        
        const previewGridSize = 30;
        for (let i = 0; i <= 4; i++) {
            this.nextPieceContext.beginPath();
            this.nextPieceContext.moveTo(0, i * previewGridSize);
            this.nextPieceContext.lineTo(this.nextPieceCanvas.width, i * previewGridSize);
            this.nextPieceContext.stroke();
            
            this.nextPieceContext.beginPath();
            this.nextPieceContext.moveTo(i * previewGridSize, 0);
            this.nextPieceContext.lineTo(i * previewGridSize, this.nextPieceCanvas.height);
            this.nextPieceContext.stroke();
        }

        // Draw next piece
        this.nextPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.nextPieceContext.fillStyle = this.nextPiece.color;
                    this.nextPieceContext.fillRect(
                        dx * previewGridSize + previewGridSize,
                        dy * previewGridSize + previewGridSize,
                        previewGridSize - 1,
                        previewGridSize - 1
                    );
                }
            });
        });
    }

    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;

        if (this.collide()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;

            if (dy > 0) {
                this.mergePiece();
                this.clearLines();
                this.currentPiece = this.nextPiece;
                this.currentPiece.x = Math.floor(this.columns / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
                this.currentPiece.y = 0;
                
                this.nextPiece = this.createPiece();
                this.drawNextPiece();  // Update next piece preview
                
                if (this.collide()) {
                    this.gameOver = true;
                }
            }
        }
    }

    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, index) => 
            this.currentPiece.shape.map(row => row[index]).reverse()
        );

        const previousShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;

        if (this.collide()) {
            this.currentPiece.shape = previousShape;
        }
    }

    collide() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (
                    this.currentPiece.shape[y][x] &&
                    (this.currentPiece.x + x < 0 ||
                     this.currentPiece.x + x >= this.columns ||
                     this.currentPiece.y + y >= this.rows ||
                     (this.board[this.currentPiece.y + y] &&
                      this.board[this.currentPiece.y + y][this.currentPiece.x + x]))
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    mergePiece() {
        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.board[this.currentPiece.y + dy][this.currentPiece.x + dx] = this.currentPiece.color;
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                // Animate line clear
                this.animateLineClear(row);
                
                // Remove the line and add empty line at top
                this.board.splice(row, 1);
                this.board.unshift(Array(this.columns).fill(0));
                linesCleared++;
                row++; // Check the same row again
                
                this.sounds.clear.play();
            }
        }
        
        if (linesCleared > 0) {
            this.updateScore(linesCleared);
            this.linesCleared += linesCleared;
            this.updateLevel();
        }
    }

    animateLineClear(row) {
        const flash = this.context.createLinearGradient(0, row * this.gridSize, this.canvas.width, row * this.gridSize);
        flash.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        flash.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        flash.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
        
        this.context.fillStyle = flash;
        this.context.fillRect(0, row * this.gridSize, this.canvas.width, this.gridSize);
    }

    updateScore(linesCleared) {
        const points = [100, 300, 500, 800]; // Points for 1, 2, 3, 4 lines
        this.score += points[linesCleared - 1] * this.level;
        document.getElementById('score').textContent = this.score;
    }

    updateLevel() {
        const newLevel = Math.floor(this.linesCleared / 10) + 1;
        if (newLevel !== this.level) {
            this.level = newLevel;
            this.dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100); // Speed up as level increases
            document.getElementById('level').textContent = this.level;
        }
    }

    update(time) {
        if (this.gameOver) return;

        if (time - this.lastDropTime > this.dropSpeed) {
            this.movePiece(0, 1);
            this.lastDropTime = time;
        }

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBoard();
        this.drawPiece(this.currentPiece);
    }

    start() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.drawNextPiece();  // Draw initial next piece
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        this.dropSpeed = 1000;
        this.lastDropTime = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetris-board');
    const tetris = new Tetris(canvas);
    let animationFrameId;

    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');

    startBtn.addEventListener('click', () => {
        tetris.start();
        startGameLoop();
    });

    pauseBtn.addEventListener('click', () => {
        cancelAnimationFrame(animationFrameId);
    });

    function startGameLoop() {
        function update(time) {
            tetris.update(time);
            animationFrameId = requestAnimationFrame(update);

            if (tetris.gameOver) {
                cancelAnimationFrame(animationFrameId);
                alert('Game Over! Your score: ' + tetris.score);
            }
        }
        animationFrameId = requestAnimationFrame(update);
    }

    document.addEventListener('keydown', (event) => {
        if (tetris.gameOver) return;

        switch(event.key) {
            case 'ArrowLeft':
                tetris.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                tetris.movePiece(1, 0);
                break;
            case 'ArrowDown':
                tetris.movePiece(0, 1);
                break;
            case 'ArrowUp':
                tetris.rotatePiece();
                break;
        }
    });
});
