import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, CENTER_X, CENTER_Y, 
    ROWS, COLUMNS, TILE_SIZE, ANCHOR_OFFSET, LAUNCHER_HEIGHT, 
    SCOREBOARD_HEIGHT, MAX_ARROW_RANGE, CURRENT_BUBBLE_X, 
    LAUNCH_COUNTDOWN, CURRENT_BUBBLE_Y, NEXT_BUBBLE_X, 
    NEXT_BUBBLE_Y, BUBBLE_PHYSICS_SIZE, TOP_BOUNDARY_LAUNCH_LIMIT,
    ROUND_MODE_1, ROUND_MODE_2, TOTAL_ROUNDS, MAX_SCORE
} from '../utils/Constants';
import Player from '../entities/Player';
import Bubble from '../entities/Bubble';
import Boundary from '../entities/Boundary';
import Round from '../entities/Round';
import Status from '../entities/Status';
import Navigation from '../entities/Navigation';
import ScoreKeeper from '../utils/ScoreKeeper';
import { Colors } from '../utils/Colors';
import { EntityMap } from '../utils/EntityMap';
import { getRandomInteger, appendDigits } from '../utils/Helpers';

class Tutorial extends Phaser.State {
    preload() {
        // stats
        this.nowPlaying = false;
        this.scoreKeeper = new ScoreKeeper();
        this.launchCountdown = LAUNCH_COUNTDOWN;
        this.topBoundaryLaunchLimit = TOP_BOUNDARY_LAUNCH_LIMIT;
        this.round = new Round(0, TILE_SIZE, ANCHOR_OFFSET);
        this.totalScore = 0;
        // this.bubbleLaunched = false;
        // this.paused = false;
    }

    create() {       
        // builder
        this.createTiles();
        this.createBoundaries();
        this.createLauncher();
        this.createStage();
        this.createScoreboard();
        this.createInstructions();
        this.currentBubble = this.createRandomBubble(CURRENT_BUBBLE_X, CURRENT_BUBBLE_Y);
        this.nextBubble = this.createRandomBubble(NEXT_BUBBLE_X, NEXT_BUBBLE_Y);
        this.theme = this.game.data.audio.theme0;

        // game logic
        this.startGame();

        // events
        this.game.keySpace.onDown.add(this.launchBubble, this);
        this.game.keyEnter.onDown.addOnce(this.changeState, this);
        this.game.keyDown.onDown.add(this.changeCurrentNavigation, this);
        this.game.keyUp.onDown.add(this.changeCurrentNavigation, this); 
    }

    createTiles() {
        this.tiles = this.add.group();
        this.tiles.createMultiple(ROWS * COLUMNS, 'tile-2', null, true);
        this.tiles.setAll('width', TILE_SIZE);
        this.tiles.setAll('height', TILE_SIZE);
        // rows and columns are opposites for this method
        this.tiles.align(COLUMNS, ROWS, TILE_SIZE, TILE_SIZE);
    }

    createBoundaries() {
        this.topBoundary = new Boundary(this.game,
            { x1: this.round.startX, y1: this.round.startY },
            { x2: this.round.endX, y2: this.round.startY },
            Colors.skyBlue
        );
        
        this.bottomBoundary = new Boundary(this.game,
            { x1: this.round.startX, y1: this.round.endY },
            { x2: this.round.endX, y2: this.round.endY },
            Colors.skyBlue
        );

        this.physics.enable(this.topBoundary, Phaser.Physics.ARCADE);
        this.topBoundary.body.immovable = true;
        this.topBoundary.body.allowGravity = false;
        this.topBoundary.body.setSize(CANVAS_WIDTH, 31);

        // blocks
        this.blocks = this.add.physicsGroup(Phaser.Physics.ARCADE, this.world, "blocks");

        // top
        this.blocks.create(0 + ANCHOR_OFFSET, 0 + ANCHOR_OFFSET, 'block-1').scale.set(0.1, 0.1)
        this.blocks.create(0 + (TILE_SIZE * COLUMNS) / 2, 0 + ANCHOR_OFFSET, 'blocks-horizontal-1');
        this.blocks.create(CANVAS_WIDTH - ANCHOR_OFFSET, 0 + ANCHOR_OFFSET, 'block-1').scale.set(0.1, 0.1);
        
        // bottom
        this.blocks.create(0 + ANCHOR_OFFSET, CANVAS_HEIGHT - ANCHOR_OFFSET, 'block-1').scale.set(0.1, 0.1)
        this.blocks.create(0 + (TILE_SIZE * COLUMNS) / 2, CANVAS_HEIGHT - ANCHOR_OFFSET, 'blocks-horizontal-1');
        this.blocks.create(CANVAS_WIDTH - ANCHOR_OFFSET, CANVAS_HEIGHT - ANCHOR_OFFSET, 'block-1').scale.set(0.1, 0.1);

        let blocksLength = (COLUMNS - this.round.cols) / 2;

        if(Math.ceil(blocksLength) - blocksLength !== 0) {
            blocksLength = Math.floor(blocksLength);
            let blockOffset = ANCHOR_OFFSET / 2;

            for (let i = 0; i < blocksLength; i++) {
                // left
                this.blocks.create((TILE_SIZE * i) + ANCHOR_OFFSET, TILE_SIZE * ROWS / 2, 'blocks-vertical-1');
                // right
                this.blocks.create(CANVAS_WIDTH - (TILE_SIZE * i) - ANCHOR_OFFSET, TILE_SIZE * ROWS / 2, 'blocks-vertical-1');
            }

            // add half blocks
            this.blocks.create((ANCHOR_OFFSET * blocksLength * 2) + blockOffset, TILE_SIZE * ROWS / 2, 'blocks-vertical-half-1');
            this.blocks.create(CANVAS_WIDTH - (ANCHOR_OFFSET * blocksLength * 2) - blockOffset, TILE_SIZE * ROWS / 2, 'blocks-vertical-half-1');

        }else {
            for (let i = 0; i < blocksLength; i++) {
                // left
                this.blocks.create((TILE_SIZE * i) + ANCHOR_OFFSET, TILE_SIZE * ROWS / 2, 'blocks-vertical-1');
                // right
                this.blocks.create(CANVAS_WIDTH - (TILE_SIZE * i) - ANCHOR_OFFSET, TILE_SIZE * ROWS / 2, 'blocks-vertical-1');
            }
        }

        this.blocks.setAll('anchor', { x: 0.5, y: 0.5 });
        this.blocks.setAll('body.immovable', true);
        this.blocks.setAll('body.allowGravity', false);
    }

    createScoreboard() {
        this.totalScoreText = this.add.bitmapText(13, 13, 'upheaval', appendDigits(14, this.totalScore, 'TOTAL'), 25);
        this.totalScoreText.anchor.set(0, 0.5);

        this.roundText = this.add.bitmapText(CANVAS_WIDTH - 12, 13, 'upheaval', 'TUTORIAL', 25);
        this.roundText.anchor.set(1, 0.5);
    }

    createLauncher() {
        // polnareff
        this.polnareff = this.add.sprite(CENTER_X - 72, CANVAS_HEIGHT + 6 - (2 * TILE_SIZE), 'polnareff-1', 0);
        this.polnareff.scale.set(0.8, 0.8);
        this.polnareff.anchor.set(0.5, 0.5);
        this.polnareff.animations.add('bounce', [0, 1], 2, true);
        this.polnareff.animations.play('bounce'); 
        
        // launcher pieces
        this.arrow = this.add.sprite(CENTER_X, CANVAS_HEIGHT - LAUNCHER_HEIGHT + ANCHOR_OFFSET, 'arrow-1');
        this.arrow.anchor.set(0.5, 0.95);

        // wheel
        this.launcherWheel = this.add.sprite(CENTER_X - 14, CANVAS_HEIGHT - (2 * TILE_SIZE), 'launcher-wheel-1');
        this.launcherWheel.anchor.set(0.5, 0.5);
        this.launcherWheel.width = 57;
        this.launcherWheel.height = 57;

        // platform
        this.launcherPlatform = this.add.sprite(CENTER_X - 1, CANVAS_HEIGHT - (2 * TILE_SIZE), 'launcher-platform-1');
        this.launcherPlatform.anchor.set(0.26, 0.5);
        this.launcherPlatform.width = 90;
        this.launcherPlatform.height = 62;
        
        // next text
        this.nextText = this.add.bitmapText(CENTER_X + 91, CANVAS_HEIGHT - LAUNCHER_HEIGHT + TILE_SIZE + 13, 'upheaval', 'NEXT', 20);
        this.nextText.anchor.set(0.5, 0.5);

        // speech bubble 
        this.speechBubble = this.add.sprite(CENTER_X - 118, CANVAS_HEIGHT - LAUNCHER_HEIGHT + 8, 'speech-bubble-1');
        this.speechBubble.scale.set(0.7, 0.7);
        this.speechBubble.alpha = 0;
        this.speechBubbleText = this.add.bitmapText(CENTER_X - 97, CANVAS_HEIGHT - LAUNCHER_HEIGHT + 23, 'upheaval', this.launchCountdown, 20);
        this.speechBubbleText.alpha = 0;
        this.speechBubbleText.anchor.set(0.5, 0.5);
    }

    // TODO: refactor
    createStage() {
        this.bubbles = this.add.physicsGroup(Phaser.Physics.ARCADE, this.world, "bubbles");
        this.round.clearSelection();

        for(let i = 0; i < this.round.matrix.length; i++) {
            for(let j = 0; j < this.round.matrix[i].length; j++) {
                let colorCode = this.round.matrix[i][j];
                if (colorCode === EntityMap.zero || 
                    colorCode === EntityMap.empty || 
                    colorCode === EntityMap.outOfBounds) continue;
                if (colorCode === EntityMap.block || colorCode === EntityMap.halfBlock) {
                    if(j === 0) {
                        if(this.round.cols === ROUND_MODE_1) {
                            let topBlock = this.blocks.create((TILE_SIZE * COLUMNS) / 2, (TILE_SIZE + ANCHOR_OFFSET) + (TILE_SIZE * i), 'blocks-horizontal-1');
                            topBlock.anchor.set(0.5, 0.5);
                            topBlock.body.immovable = true;
                            topBlock.body.allowGravity = false;
                        } else if (this.round.cols === ROUND_MODE_2) {
                            let halfBlock1 = this.blocks.create(this.round.startX, (TILE_SIZE) + (TILE_SIZE * i), 'blocks-horizontal-half-1');
                            halfBlock1.body.immovable = true;
                            halfBlock1.body.allowGravity = false;
                            let halfBlock2 = this.blocks.create(this.round.startX, (TILE_SIZE + ANCHOR_OFFSET) + (TILE_SIZE * i), 'blocks-horizontal-half-1');
                            halfBlock2.body.immovable = true;
                            halfBlock2.body.allowGravity = false;
                        }
                        this.topBoundary.y = TILE_SIZE + (TILE_SIZE * i);
                    }
                }else {
                    let { x, y } = this.round.getCoordinates(i, j);
                    this.createBubble(x, y, colorCode, this.bubbles);
                    if (colorCode !== EntityMap.gold && 
                        colorCode !== EntityMap.white && 
                        colorCode !== EntityMap.rainbow) {
                        this.round.addSelection(colorCode);
                    }
                }
            }
        }        

        this.bubbles.setAll('body.immovable', true);
        this.bubbles.setAll('body.allowGravity', false);
    }

    createBubble(x, y, colorCode, group) {
        let bubble = null;

        if (colorCode === EntityMap.rainbow) {
            bubble = new Bubble(this.game, TILE_SIZE, x, y, colorCode, group, EntityMap.collision.rainbow.name, 0);
        }else {
            bubble = new Bubble(this.game, TILE_SIZE, x, y, colorCode, group);
        }

        // physics
        this.physics.enable(bubble, Phaser.Physics.ARCADE);
        bubble.body.setSize(BUBBLE_PHYSICS_SIZE, BUBBLE_PHYSICS_SIZE);
        bubble.body.bounce.set(1);

        return bubble;
    }

    createRandomBubble(x, y, group) {
        let randomColorCode = getRandomInteger(this.round.selection);
        let rainbowChance = Math.floor(Math.random() * 100);
        if(rainbowChance === 10) {
            randomColorCode = EntityMap.rainbow;
        }
        return this.createBubble(x, y, randomColorCode, group);
    }

    createInstructions() {
        let style1 = {
            font: "15px monospace",
            fill: "white",
            align: "left",
            stroke: 'black',
            strokeThickness: 3
        };

        let style2 = { 
            font: "11px monospace", 
            fill: "white", 
            align: "left",
            stroke: 'black', 
            strokeThickness: 3
        };

        let rules = "• Clear all bubbles\nusing the launcher\n"
            + "• Remove bubble by\nattaching to clusters\nof 3 or more with the\nsame color\n"
            + "• Bubbles hanging from\nclusters are removed\n"
            + "• Each bubble removed\nis worth 10 points\n"
            + "• Each hanging bubble\nremoved is worth\n10^(hanging bubbles)\npoints per color\n"
            + "• There are a total\nof 50 rounds and\n6 credits per game\nGood Luck!"

        // adding rules and controls
        let rulesHeader = this.add.text(30, 34, "OBJECTIVE:" ,style1);
        let rulesDesc = this.add.text(5, 60, rules, style2);

        let controls = "• SPACE:\nLaunch bubble\n"
            + "• ARROW LEFT/RIGHT:\nRotate launcher\n"
            + "• ENTER:\nSelect navigation\n"
            + "• ARROW UP/DOWN:\nSwitch navigation"
        
        let controlHeader = this.add.text(CANVAS_WIDTH - 120, 34, "CONTROLS:", style1);
        let controlDesc = this.add.text(CANVAS_WIDTH - 150, 60, controls, style2);

        // adding instruction text
        let instructions = this.add.text(
            7, CANVAS_HEIGHT - 10,
            "Press ENTER to go back",
            { font: "12px monospace", fill: "white", align: "left", stroke: 'black', strokeThickness: 3 },
        );

        instructions.anchor.set(0, 0.5);

        instructions.alpha = 0;

        // Yoyo the text
        let instructionsTween = this.add.tween(instructions).
            to({ alpha: 1 }, 500, "Linear", true, 0, -1);

        instructionsTween.yoyo(true, 300); 
    }

    // remove overlay, starts timer, setups stats, enable input
    startGame() {
        console.log('NOW PLAYING TUTORIAL...');
        this.nowPlaying = true;
        this.launchTimer = this.time.create(false);
        this.launchTimer.loop(Phaser.Timer.SECOND * 1, this.updateLaunchCountdown, this);
        this.launchTimer.start();

        this.gameTimer = this.time.create(false);
        this.gameTimer.loop(Phaser.Timer.SECOND * 1, () => {this.scoreKeeper.time++;}, this);
        this.gameTimer.start();
    }

    stopGame(result) {
        let win = result === 'WIN';
        this.nowPlaying = false;
        this.launchTimer.destroy();
        this.gameTimer.destroy();
        this.scoreKeeper.calculateFinalResult(win);
        let { score, time, bonus } = this.scoreKeeper;

        switch(result) {
            case 'WIN':
                this.win(score, time, bonus);
                break;
            case 'LOSE':
                this.lose(score, time, bonus);
                break;
            default:
                this.win(score, time, bonus);
                break;
        }

        if (this.game.data.player) {
            this.updatePlayerStatus(score, time, bonus);
        }

        //this.theme.stop();
    }

    win(score, time, bonus) {
        console.log('GAME OVER PLAYER WINS...');
        this.status = new Status(this.game,
            { fill: 0x00000 },
            { x: CENTER_X, y: CENTER_Y - 100, font: 'upheaval', message: 'YOU WIN', fontSize: 45 },
            {
                x: CENTER_X - 92, y: CENTER_Y + 5, font: 'upheaval', fontSize: 30, distance: 110,
                message: { score, time, bonus }
            }
        );

        this.navigation = new Navigation(this.game, [
            { name: 'GO BACK', stateName: 'menu', font: 'upheaval', fontSize: 30 },
            { name: 'RESET', stateName: 'tutorial', font: 'upheaval', fontSize: 30 },
        ], CENTER_X, CENTER_Y + 110, 40);

        this.navigation.createPolnareff(CENTER_X - 105, CENTER_Y + 113, 38);

        this.game.data.audio.gameWin.play();
    }

    lose(score, time, bonus) {
        console.log('GAME OVER PLAYER LOSES...');
        this.status = new Status(this.game,
            { fill: 0x00000 },
            { x: CENTER_X, y: CENTER_Y - 100, font: 'upheaval', message: 'YOU LOSE', fontSize: 45},
            { x: CENTER_X - 92, y: CENTER_Y + 5, font: 'upheaval', fontSize: 30, distance: 110,
                message: { score, time, bonus }}
        );  
        
        this.navigation = new Navigation(this.game, [
            { name: 'GO BACK', stateName: 'menu', font: 'upheaval', fontSize: 30 },
            { name: 'RESET', stateName: 'tutorial', font: 'upheaval', fontSize: 30 },
        ], CENTER_X, CENTER_Y + 110, 40);
        
        this.navigation.createPolnareff(CENTER_X - 105, CENTER_Y + 113, 38);

        this.game.data.audio.gameLose.play();
    }

    updatePlayerStatus(score, time, bonus) {
        if(score > 0) {
            this.totalScore += bonus;

            if (this.totalScore >= MAX_SCORE) {
                this.totalScore = MAX_SCORE; 
            }
        }

        this.totalScoreText.setText(appendDigits(14, this.totalScore, 'TOTAL'));
    }

    changeCurrentNavigation(e) {
        if(!this.nowPlaying && this.navigation) {
            if (e.keyCode === this.game.keyDown.keyCode) {
                this.navigation.changeCurrentNavigation(1);
            }
    
            if (e.keyCode === this.game.keyUp.keyCode) {
                this.navigation.changeCurrentNavigation(-1);
            }
        }

        this.game.data.audio.switchNavigation.play();
    }

    changeState(e) {
        if(!this.nowPlaying && this.navigation) {
            let currentIndex = this.navigation.currentIndex;
            let state = this.navigation.children[currentIndex].stateName;
            this.navigation.tweenNavigation(currentIndex, () => this.state.start(state));
            this.game.data.audio.selectNavigation.play();
        }else {
            this.state.start('menu');
        }
    }

    launchBubble() {
        if (this.nowPlaying) {
            console.log('LAUNCH BUBBLE... RESETTING COUNTDOWN ', this.launchCountdown);
            this.launchCountdown = LAUNCH_COUNTDOWN;
            this.physics.arcade.velocityFromAngle(
                // https://phaser.io/docs/2.4.4/Phaser.Physics.Arcade.html#velocityFromRotation
                // need to subtract 90 to get the coordinates adjusted
                this.arrow.angle - 90, 330, this.currentBubble.body.velocity);
            
            this.game.data.audio.launchBubble.play();
        }
    }

    update() {
        if(this.nowPlaying) {
            this.updateCursorInput();
            this.updateCollision();
        }
    }

    updateLaunchCountdown() {
        if (this.launchCountdown <= Math.floor(LAUNCH_COUNTDOWN / 4)) {
            this.speechBubble.alpha = 1;
            this.speechBubbleText.alpha = 1;
            this.speechBubbleText.setText(this.launchCountdown);

            // TODO: use another soundfx
            this.game.data.audio.switchNavigation.play();

            if(this.launchCountdown === 0) {
                this.launchBubble();
            }
        }else {
            this.speechBubble.alpha = 0;
            this.speechBubbleText.alpha = 0;
        }

        this.launchCountdown--;
    }

    updateCursorInput() {
        if (this.game.keyLeft.isDown) {
            if (this.arrow.angle >= -MAX_ARROW_RANGE) {
                this.arrow.angle -= 1.2;
                this.launcherWheel.angle -= 1.2;
            } else {
                this.arrow.angle = -MAX_ARROW_RANGE;
                this.launcherWheel.angle = -MAX_ARROW_RANGE;
            }
        } else if (this.game.keyRight.isDown) {
            if (this.arrow.angle <= MAX_ARROW_RANGE) {
                this.arrow.angle += 1.2;
                this.launcherWheel.angle += 1.2;
            } else {
                this.arrow.angle = MAX_ARROW_RANGE;
                this.launcherWheel.angle = MAX_ARROW_RANGE;
            }
        }
    }

    updateCollision() {
        let blockCollision = this.physics.arcade.collide(
            this.currentBubble, this.blocks, () => {
                console.log('BLOCK COLLISION');
        }, null, this);

        let topBoundaryCollsion = this.physics.arcade.collide(
            this.currentBubble, this.topBoundary, () => {
                console.log('TOP BOUNDARY COLLISION');
            }, null, this);
        
        // NOTE: will need to research further.
        // ideally want the snapToGrid and updateTopBoundary methods within
        // the collision callback since it is unsure whether the cb is async
        let bubbles = {};
        let bubbleCollision = this.physics.arcade.collide(
            this.currentBubble, this.bubbles, (currentBubble, collidingBubble) => {
                console.log('BUBBLE COLLISION');
                bubbles.currentBubble = currentBubble;
                bubbles.collidingBubble = collidingBubble;
            }, null, this);

        if(topBoundaryCollsion || bubbleCollision) {
            this.snapToGrid(bubbles.currentBubble, bubbles.collidingBubble);
            this.updateTopBoundary();
        }
    }

    // TODO: refactor
    snapToGrid(currentBubble, collidingBubble) {
        let curx = this.currentBubble.x;
        let cury = this.currentBubble.y;
        let { i, j } = this.round.getIndices(curx, cury);
        console.log('INDICES FOUND i: ' + i + ' j: ' + j);

        if(i < 0) {
            console.log('NEGATIVE INDEX: adjusting i sign');
            i = 0;
        }

        if(j < 0) {
            console.log('NEGATIVE INDEX: adjusting j sign');
            j = 0;
        }

        if (this.round.matrix[i][j] === EntityMap.outOfBounds) {
            this.checkLose();
        }else {
            // adjustments for empty spaces
            if (this.round.matrix[i][j] === EntityMap.empty) {
                console.log('MATRIX EMPTY: adjusting j position');
                j -= 1;
    
                if(this.round.matrix[i][j] !== EntityMap.zero) {
                    console.log('MATRIX FILLED: adjusting i and j position');
                    i += 1;
                    j += 1;
                }
            }
    
            if (this.round.matrix[i][j] === EntityMap.zero) {
                let { x, y } = this.round.getCoordinates(i, j);
                console.log('SNAPING TO x: ' + x + ' y: ' + y + ' i: ' + i + ' j: ' + j);
    
                let currentColor = this.currentBubble.data.colorCode;
                let newBubble = this.createBubble(x, y, currentColor, this.bubbles);
                this.round.matrix[i][j] = currentColor;
                newBubble.body.immovable = true;
                newBubble.body.allowGravity = false;
    
                this.currentBubble.body.velocity.x = 0;
                this.currentBubble.body.velocity.y = 0;
                this.currentBubble.destroy();
    
                this.currentBubble = this.nextBubble;
                this.currentBubble.x = CURRENT_BUBBLE_X;
                this.currentBubble.y = CURRENT_BUBBLE_Y;
                this.nextBubble = this.createRandomBubble(NEXT_BUBBLE_X, NEXT_BUBBLE_Y);

                if (this.removeMatchingBubbles(i, j, currentBubble, collidingBubble)) {
                    this.bubbles.destroy();
                    this.createStage();
                    this.updateScore(currentColor);
                    
                    console.log('REMAINING BUBBLES...', this.bubbles);
                    this.checkWin();
                }
            }
        }
    }

    removeMatchingBubbles(i, j, currentBubble, collidingBubble) {
        // remove bubbles connected to target
        // identify floating bubbles
        // partition by colorCode
        if ((currentBubble || collidingBubble) && (currentBubble.key || collidingBubble.key)) {
            return this.handleSpecialCollision(i, j, currentBubble, collidingBubble);
        }else {
            return this.handleDefaultCollision(i, j);
        }
    }

    handleSpecialCollision(curI, curJ, currentBubble, collidingBubble) {
        // TODO: refactor if other special collision are to be included
        // will only add the rainbow collision for now
        if (currentBubble.key === EntityMap.collision.rainbow.name || collidingBubble.key === EntityMap.collision.rainbow.name) {
            // set the targetColor and rainbow at x,y to 0
            // remove floaters
            let targetColor = null;
            let collidingBubbleIndices = this.round.getIndices(collidingBubble.x, collidingBubble.y);
            let collidingBubbleI = collidingBubbleIndices.i;
            let collidingBubbleJ = collidingBubbleIndices.j;

            if(currentBubble.key) {
                targetColor = this.round.matrix[collidingBubbleI][collidingBubbleJ];
                this.scoreKeeper.add(this.round.matrix[curI][curJ], curI, curJ);
                this.round.matrix[curI][curJ] = EntityMap.zero;
            }else {
                targetColor = this.round.matrix[curI][curJ];
                this.scoreKeeper.add(this.round.matrix[collidingBubbleI][collidingBubbleJ], collidingBubbleI, collidingBubbleJ);
                this.round.matrix[collidingBubbleI][collidingBubbleJ] = EntityMap.zero;
            }

            for(let i = 0; i < this.round.matrix.length; i++) {
                for(let j = 0; j < this.round.matrix[i].length; j++) {
                    if (this.round.matrix[i][j] === targetColor) {
                        this.scoreKeeper.add(this.round.matrix[i][j], i, j);
                        this.round.matrix[i][j] = EntityMap.zero;
                    }
                }
            }

            this.removeFloatingBubbles();
            return true;
        }else {
            return false;
        }
    }

    handleDefaultCollision(i, j) {
        // start from the currentBubble indices
        let targetColor = this.round.matrix[i][j];
        let target = this.round.getBubbleHash(i, j);
        let matches = new Set();
        let queue = [target];

        while (queue.length) {
            let current = queue.shift();
            matches.add(current);
            let { indices } = this.round.fromBubbleHash(current);
            let neighbors = this.getNeighbors(indices.i, indices.j);

            neighbors.forEach(hash => {
                let { colorCode } = this.round.fromBubbleHash(hash);
                if (colorCode === targetColor && !matches.has(hash)) {
                    queue.push(hash);
                }
            });
        }

        if (matches.size > 2) {
            console.log('MATCH DETECTED REMOVING BUBBLES...');

            matches.forEach(hash => {
                let { indices, colorCode } = this.round.fromBubbleHash(hash);
                let { i, j } = indices;
                this.scoreKeeper.add(colorCode, i, j);
                this.round.matrix[i][j] = EntityMap.zero;
            });

            this.removeFloatingBubbles();
            return true;
        } else {
            return false;
        }
    }

    removeFloatingBubbles() {
        let topRow = this.round.matrix[this.round.topRow];
        let memo = new Set();
        let hasFloats = false;

        topRow.forEach((el, j) => {
            if (this.round.isBubble(this.round.topRow, j)) {
                this.floodFill(this.round.topRow, j, memo);
            }
        });

        console.log('REMOVING POTENTIAL FLOATING BUBBLES... ', memo);

        for (let i = 0; i < this.round.matrix.length; i++) {
            for (let j = 0; j < this.round.matrix[i].length; j++) {
                let hash = this.round.getBubbleHash(i, j);
                if (this.round.isBubble(i, j) && !memo.has(hash)) {
                    this.scoreKeeper.add(this.round.matrix[i][j], i, j);
                    this.round.matrix[i][j] = EntityMap.zero;
                    hasFloats = true;
                }
            }
        }

        if(hasFloats) {
            this.game.data.audio.nonTargetBubble.play();
        }else {
            this.game.data.audio.targetBubble.play();
        }
    }

    floodFill(i, j, memo) {
        memo.add(this.round.getBubbleHash(i, j));

        let neighbors = this.getNeighbors(i, j).filter(hash => !memo.has(hash));

        if (neighbors.length) {
            neighbors.forEach(hash => {
                let { indices } = this.round.fromBubbleHash(hash);
                this.floodFill(indices.i, indices.j, memo);
            });
        }
    }

    // return array of adjacent bubbles
    getNeighbors(i, j) {
        // bubble {i, j, points, type, visited}
        let neighbors = [];

        // left
        if(this.round.isBubble(i, j-1)) {
            neighbors.push(this.round.getBubbleHash(i, j-1));
        }

        // right
        if(this.round.isBubble(i, j+1)) {
            neighbors.push(this.round.getBubbleHash(i, j+1));
        }

        if(this.round.isSmallRow(i)) {
            // top left
            if (this.round.isBubble(i-1, j)) {
                neighbors.push(this.round.getBubbleHash(i-1, j));
            }
            // top right
            if (this.round.isBubble(i-1, j+1)) {
                neighbors.push(this.round.getBubbleHash(i-1, j+1));
            }
            // bottom left
            if (this.round.isBubble(i+1, j)) {
                neighbors.push(this.round.getBubbleHash(i+1, j));
            }
            // bottom right
            if (this.round.isBubble(i+1, j+1)) {
                neighbors.push(this.round.getBubbleHash(i+1, j+1));
            }
        }else {
            // top left
            if (this.round.isBubble(i-1, j-1)) {
                neighbors.push(this.round.getBubbleHash(i-1, j-1));
            }
            // top right
            if (this.round.isBubble(i-1, j)) {
                neighbors.push(this.round.getBubbleHash(i-1, j));
            }
            // bottom left
            if (this.round.isBubble(i+1, j-1)) {
                neighbors.push(this.round.getBubbleHash(i+1, j-1));
            }
            // bottom right
            if (this.round.isBubble(i+1, j)) {
                neighbors.push(this.round.getBubbleHash(i+1, j));
            }
        }
        return neighbors;
    }

    updateTopBoundary() {
        if(this.nowPlaying) {
            if (this.topBoundaryLaunchLimit === 0) {
                let isValid = this.round.shiftTopBoundary();
    
                console.log('SHIFTING TOP BOUNDARY... RESETTING LIMIT');
                this.bubbles.destroy();
                this.createStage();
    
                this.topBoundaryLaunchLimit = TOP_BOUNDARY_LAUNCH_LIMIT;
    
                if(!isValid) this.checkLose();
            }else {
                console.log('LAUNCH LIMIT ', this.topBoundaryLaunchLimit);
                this.topBoundaryLaunchLimit--;
            }
        }
    }

    updateScore(currentColor) {
        console.log('UPDATING SCORE');

        this.scoreKeeper.calculate(currentColor);

        // animate scores
        this.scoreKeeper.mergeMap.forEach((bubble, idx) => {
            let {i, j, score} = bubble;
            let {x, y} = this.round.getCoordinates(i, j);

            let scoreText = this.add.bitmapText(x, y, 'upheaval', score, 20);
            scoreText.anchor.set(0.5, 0.5);

            let scoreTween = this.add.tween(scoreText)
                .to({ alpha: 0, y: y-10}, 600, Phaser.Easing.Linear.None, true, 0);
            
            scoreTween.onComplete.add(() => scoreText.destroy(), this);
        });

        this.totalScore += this.scoreKeeper.currentScore;
        this.totalScoreText.setText(appendDigits(14, this.totalScore, 'TOTAL'));
        this.scoreKeeper.refreshMaps();
    }

    checkLose() {
        this.stopGame('LOSE');
    }

    checkWin() {
        if(!this.bubbles.length ||
            this.bubbles.children.every(bubble => bubble.data.colorCode === EntityMap.gold)) {
            this.stopGame('WIN');
        }
    }

    shutdown() {
        this.game.keySpace.onDown.remove(this.launchBubble, this);
        this.game.keyEnter.onDown.remove(this.changeState, this);
        this.game.keyDown.onDown.remove(this.changeCurrentNavigation, this);
        this.game.keyUp.onDown.remove(this.changeCurrentNavigation, this);
    }
}

export default Tutorial;