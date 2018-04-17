import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, CENTER_X, CENTER_Y, 
    ROWS, COLUMNS, TILE_SIZE, ANCHOR_OFFSET, LAUNCHER_HEIGHT, 
    SCOREBOARD_HEIGHT, MAX_ARROW_RANGE, CURRENT_BUBBLE_X, 
    CURRENT_BUBBLE_Y, NEXT_BUBBLE_X, NEXT_BUBBLE_Y, BUBBLE_PHYSICS_SIZE
} from '../utils/Constants';
import Player from '../entities/Player';
import Bubble from '../entities/Bubble';
import Round from '../entities/Round';
import Boundary from '../entities/Boundary';
import { Colors } from '../utils/Colors';
import { EntityMap } from '../utils/EntityMap';

class Play extends Phaser.State {
    preload() {
        this.round = new Round(this.game.player.currentRound.level, TILE_SIZE, ANCHOR_OFFSET);

        // stats
        this.score = 0
        this.nowPlaying = false;
        this.roundComplete = false;
        this.gameover = false;
        this.paused = false;
        this.time = 0;
        this.bonus = 0;
        this.launchCountdown = 10;
    }

    create() {       
        // builder
        this.createTiles();
        this.createBoundaries();
        this.createLauncher();
        this.createStage();
        this.createScoreboard();
        this.createInitialLaunchBubbles();
        this.createOverlay('READY');

        // game logic
        this.pregame(this.startGame);

        // events
        this.game.keySpace.onDown.add(this.launchBubble, this);
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
        this.topBoundary = this.add.sprite(0, 0);
        this.topBoundary.addChild(
            new Boundary(this.game,
                { x1: this.round.startX, y1: this.round.startY },
                { x2: this.round.endX, y2: this.round.startY },
                Colors.skyBlue
            )
        );

        this.bottomBoundary = this.add.sprite(0, 0);
        this.bottomBoundary.addChild(
            new Boundary(this.game,
                { x1: this.round.startX, y1: this.round.endY },
                { x2: this.round.endX, y2: this.round.endY },
                Colors.skyBlue
            )
        );

        this.physics.enable(this.topBoundary, Phaser.Physics.ARCADE);
        this.topBoundary.body.immovable = true;
        this.topBoundary.body.allowGravity = false;
        this.topBoundary.body.setSize(CANVAS_WIDTH, 31);

        // this.physics.enable(this.bottomBoundary, Phaser.Physics.ARCADE);
        // this.bottomBoundary.body.immovable = true;
        // this.bottomBoundary.body.allowGravity = false;
        // this.bottomBoundary.body.setSize(CANVAS_WIDTH, 31);

        // move boundary by => boundary.x += val;

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
                // this.blocks.create((ANCHOR_OFFSET * i) + blockOffset, TILE_SIZE * ROWS / 2, 'blocks-vertical-half-1');
                // right
                this.blocks.create(CANVAS_WIDTH - (TILE_SIZE * i) - ANCHOR_OFFSET, TILE_SIZE * ROWS / 2, 'blocks-vertical-1');
                // this.blocks.create(CANVAS_WIDTH - (ANCHOR_OFFSET * i) - blockOffset, TILE_SIZE * ROWS / 2, 'blocks-vertical-half-1');
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
        this.scoreText = this.add.bitmapText(5, 11, 'upheaval', 'SCORE 000000000', 25);
        this.scoreText.anchor.set(0, 0.5);

        this.roundText = this.add.bitmapText(CANVAS_WIDTH - 130, 11, 'upheaval', 'ROUND 001', 25);
        this.roundText.anchor.set(0, 0.5);
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
    }

    createStage() {
        this.bubbles = this.add.physicsGroup(Phaser.Physics.ARCADE, this.world, "bubbles");

        for(let i = 0; i < this.round.matrix.length; i++) {
            for(let j = 0; j < this.round.matrix[i].length; j++) {
                let colorCode = this.round.matrix[i][j];
                if (colorCode === EntityMap.zero || 
                    colorCode === EntityMap.empty || 
                    colorCode === EntityMap.block ||
                    colorCode === EntityMap.outOfBounds) continue;
                let { x, y } = this.round.getCoordinates(i, j);  
                this.round.getIndices(x,y);
                this.createBubble(x, y, colorCode, this.bubbles);
            }
        }        

        this.bubbles.setAll('body.immovable', true);
        this.bubbles.setAll('body.allowGravity', false);
    }

    createInitialLaunchBubbles() {     
        this.currentBubble = this.createRandomBubble(CURRENT_BUBBLE_X, CURRENT_BUBBLE_Y);
        this.nextBubble = this.createRandomBubble(NEXT_BUBBLE_X, NEXT_BUBBLE_Y);
    }

    createBubble(x, y, colorCode, group) {
        let color = EntityMap.colors[colorCode];
        let bubbleGraphic = new Bubble(this.game, TILE_SIZE, Colors[color]);
        let bubble = this.add.sprite(x, y, null, null, group);
        bubbleGraphic.addDot(() => colorCode === EntityMap.gold);
        bubble.addChild(bubbleGraphic);
        bubble.scale.set(0.9, 0.9);
        bubble.anchor.set(0.5, 0.5);
        bubble.colorCode = colorCode;

        // physics
        this.physics.enable(bubble, Phaser.Physics.ARCADE);
        bubble.body.setSize(BUBBLE_PHYSICS_SIZE, BUBBLE_PHYSICS_SIZE);
        bubble.body.bounce.set(1);

        return bubble;
    }

    createRandomBubble(x, y, group) {
        let randomColorCode = this.getRandomBubbleCode();
        return this.createBubble(x, y, randomColorCode, group);
    }

    getRandomBubbleCode() {
        let min = EntityMap.BUBBLE_START;
        let max = EntityMap.BUBBLE_END;
        return Math.floor(Math.random() * (max - min) + min);
    }

    createOverlay(message) {
        this.overlay = this.add.graphics(0, 0);
        this.overlay.beginFill(0x000000);
        this.overlay.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.overlay.alpha = 0.3;

        this.message = this.add.bitmapText(CENTER_X, CENTER_Y, 'upheaval', message, 30);
        this.message.anchor.set(0.5, 0.5);
    }

    removeOverlay() {
        this.overlay.destroy();
        this.message.destroy();
    }

    // add 'ready go' text before starting the game.
    // calls the startGame function after 'ready go' text disappears
    pregame(cb) {
        // create a one-off timers that autodestroys itself
        // TODO: maybe use async await / yield / promises?
        let pregameTimer1 = this.time.create(true);
        pregameTimer1.add(Phaser.Timer.SECOND * 1.5, () => {
            let pregameTimer2 = this.time.create(true);
            pregameTimer2.add(Phaser.Timer.SECOND * 1.5, cb, this);
            pregameTimer2.start();
            this.message.setText('GO');
        }, this);

        pregameTimer1.start();
    }

    // remove overlay, starts timer, setups stats, enable input
    startGame() {
        console.log('NOW PLAYING...');
        this.nowPlaying = true;
        this.removeOverlay();
    }

    win() {
        console.log('GAME OVER PLAYER WINS...');
        this.nowPlaying = false;
        this.createOverlay('YOU WIN!!!');
    }

    winAll() {

    }

    lose() {
        console.log('GAME OVER PLAYER LOSES...');
        this.nowPlaying = false;
        this.createOverlay('YOU LOSE');
    }

    gameover() {

    }

    update() {
        if(this.nowPlaying) {
            this.handleCursorInput();
            this.handleCollision();
        }
    }

    launchBubble() {
        if (this.nowPlaying) {
            console.log('LAUNCH BUBBLE');
            
            this.physics.arcade.velocityFromAngle(
                // https://phaser.io/docs/2.4.4/Phaser.Physics.Arcade.html#velocityFromRotation
                // need to subtract 90 to get the coordinates adjusted
                this.arrow.angle - 90, 330, this.currentBubble.body.velocity);
        }
    }

    handleCursorInput() {
        if (this.game.keyLeft.isDown) {
            if (this.arrow.angle >= -MAX_ARROW_RANGE) {
                this.arrow.angle -= 1.4;
                this.launcherWheel.angle -= 1.4;
            } else {
                this.arrow.angle = -MAX_ARROW_RANGE;
                this.launcherWheel.angle = -MAX_ARROW_RANGE;
            }
        } else if (this.game.keyRight.isDown) {
            if (this.arrow.angle <= MAX_ARROW_RANGE) {
                this.arrow.angle += 1.4;
                this.launcherWheel.angle += 1.4;
            } else {
                this.arrow.angle = MAX_ARROW_RANGE;
                this.launcherWheel.angle = MAX_ARROW_RANGE;
            }
        }
    }

    handleCollision() {
        let blockCollision = this.physics.arcade.collide(this.currentBubble, this.blocks, () => console.log('BLOCK COLLISION'), null, this);
        let topBoundaryCollsion = this.physics.arcade.collide(this.currentBubble, this.topBoundary, () => console.log('TOP BOUNDARY COLLISION'), null, this);
        let bubbleCollision = this.physics.arcade.collide(this.currentBubble, this.bubbles, () => console.log('BUBBLE COLLISION'), null, this);

        if (topBoundaryCollsion || bubbleCollision) {
            this.snapToGrid();
            this.checkCluster();
        }
    }

    snapToGrid() {
        let curx = this.currentBubble.x;
        let cury = this.currentBubble.y;
        let { i, j } = this.round.getIndices(curx, cury);
        console.log('INDICES FOUND i: ' + i + ' j: ' + j);

        if (this.round.matrix[i][j] === EntityMap.outOfBounds) {
            this.lose();
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
    
                let newBubble = this.createBubble(x, y, this.currentBubble.colorCode, this.bubbles);
                this.round.matrix[i][j] = this.currentBubble.colorCode;
                newBubble.body.immovable = true;
                newBubble.body.allowGravity = false;
    
                this.currentBubble.body.velocity.x = 0;
                this.currentBubble.body.velocity.y = 0;
                this.currentBubble.destroy();
    
                this.currentBubble = this.nextBubble;
                this.currentBubble.x = CURRENT_BUBBLE_X;
                this.currentBubble.y = CURRENT_BUBBLE_Y;
                this.nextBubble = this.createRandomBubble(NEXT_BUBBLE_X, NEXT_BUBBLE_Y);
            }
        }
    }

    checkCluster() {

    }

    shutdown() {

    }
}

export default Play;