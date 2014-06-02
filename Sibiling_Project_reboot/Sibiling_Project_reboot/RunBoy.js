//The location of the sprite sheet
heroSpriteSheet = "runboySprite.png";
moveDistance = 7;
startingHeight = 435;

//Sets up different animation of runboy and initializes the controls
function RunBoy(game, canvasWidth, worldWidth) {

    this.rightStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 12, 6, 100, 150, 0.01, 1, true, false);
    this.leftStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 156, 100, 150, 0.01, 1, true, false);

    this.runRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 100, 0, 100, 150, 0.011, 120, true, false);
   
    this.runLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 100, 160, 100, 150, 0.011, 120, true, false);

    this.jumpRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 10, 325, 114, 158, .015, 89, false);
    this.jumpLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 10, 485, 114, 158, .015, 89, false);

    this.fallRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 10146, 336, 114, 160, 0.01, 1, true);
    this.fallLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 10146, 496, 114, 148, 0.01, 1, true);
    //End of Game Animation
    
    this.rewindFrame = null;

    // set the sprite's starting position on the canvas
    Entity.call(this, game, 0, startingHeight);
    //Entity.call(this, game, canvasWidth / 2, startingHeight);

    this.jumping = false;
    this.running = false;
    this.runningJump = false;
    this.standing = true;
    this.falling = false;
    this.canPass = true;
    this.landed = false;
    this.collission = false;

    this.height = 0;
    this.baseHeight = startingHeight;
    this.canvasWidth = canvasWidth;
    this.worldWidth = worldWidth;
    this.worldX = this.x;
    //this.worldX = 8100;
    this.worldY = this.y;
    this.boundingbox = new BoundingBox(this.x, this.y, 90, 145); //145
    //when its null I'm not currently on a platform.
    this.currentPlatform = null;
    //keeps track of where the bounding box's bottom was before it changed. should be when falling.
    this.lastBottom = this.boundingbox.bottom;
    this.lastTop = this.boundingbox.top;

    //stores character's rewindStack
    this.myRewindStack = [];
    this.rewinding = false;
    this.game = game;
    this.lastFrame = null;
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.rewindCount = 0;
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}

RunBoy.prototype = new Entity();
RunBoy.prototype.constructor = RunBoy;

//The update method for run boy
//has the controls for when he will run and jump and will move the player across the screen.
RunBoy.prototype.update = function () {
    if (this.game.running === false) {
        return;
    }

    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    if (this.rewinding === true) {

        this.boundingbox = new BoundingBox(this.lastFrame.canvasX, this.lastFrame.canvasY, this.boundingbox.width, this.boundingbox.height);
        return;

    } else if (this.myRewindStack.length === 0 && this.rewindCount > 0) {
        ///////////////////////////////////////////////
        var rwSound = document.getElementById('rewindSound');
        rwSound.pause();
        rwSound.currentTime = 0;
        ///////////////////////////////////////////////
        this.x = this.lastFrame.canvasX;
        this.worldX = this.lastFrame.worldX;
        direction = this.lastFrame.direction;

        if (this.lastFrame.currentPlatform != null) {
            this.currentPlatform = this.lastFrame.currentPlatform;
            this.y = (this.currentPlatform.boundingBox.top - 3) - this.boundingbox.height;
            this.worldY = this.lastFrame.worldY;

        } else {
            this.y = this.lastFrame.canvasY;
            this.worldY = this.lastFrame.worldY;
        }

        // 5/30 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.baseHeight = this.y;

        // de-activate keydown Listeners while jumping or falling, otherwise activate them
        if (this.falling || this.jumping || this.runningJump) {
            this.game.addListeners = false;
        } else {
            this.game.addListeners = true;
        }
        // 5/30 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        return;
    }
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var maxHeight = 300;
    var tempX = this.x;
    var tempWorldX = this.worldX;
    var tempY = this.y;

    /*
     * Falling
     */
    if (this.currentPlatform === null && this.y !== startingHeight && !this.runningJump && !this.jumping) {
        this.falling = true;
        //var prevY = this.y;
        this.y = this.y + moveDistance;
        this.move();

        if (this.y > startingHeight) {
            this.y = startingHeight;
            this.falling = false;
            this.standing = true;
            this.baseHeight = this.y;
            this.falling = false;
        }

        this.lastBottom = this.boundingbox.bottom;
        this.lastTop = this.boundingbox.top;
        this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);

    }

    /*
     * Running and Jumping
     */


    // !!!!!!!!!!!!Changed to to a else if!!! 5/24/2014
    else if ((this.game.space && (this.game.rightArrow || this.game.leftArrow)) || this.runningJump) {
        this.runningJump = true;
        this.jumping = false;
        this.running = false;
        this.standing = false;
        var done = false;

        if (direction) { // Right

            var duration = this.jumpRight.elapsedTime + this.game.clockTick; //the duration of the jump.
            if (duration > this.jumpRight.totalTime / 2) {
                duration = this.jumpRight.totalTime - duration;
            }
            duration = duration / this.jumpRight.totalTime;
            this.height = (4 * duration - 4 * duration * duration) * maxHeight + 17;

            if (this.jumpRight.isDone()) {
                done = true;
                this.jumpRight.elapsedTime = 0;
                this.runningJump = false;
            }

        } else { // Left

            var duration = this.jumpLeft.elapsedTime + this.game.clockTick;
            if (duration > this.jumpLeft.totalTime / 2) {
                duration = this.jumpLeft.totalTime - duration;
            }
            duration = duration / this.jumpLeft.totalTime;

            this.height = (4 * duration - 4 * duration * duration) * maxHeight + 17;

            if (this.jumpLeft.isDone()) {
                done = true;
                this.jumpLeft.elapsedTime = 0;
                this.runningJump = false;
            }
        }

        this.move();
        this.game.space = false; //stop Runboy from jumping continuously
        if (done) {
            this.y = this.baseHeight;
        }
        else {
            this.y = this.baseHeight - this.height / 2;
        }
        this.didICollide();

        if (this.landed) {
            if (direction) {
                this.jumpRight.elapsedTime = 0;
                this.x = this.x - moveDistance;
            }
            else {
                this.jumpLeft.elapsedTime = 0;
                this.x = this.x + moveDistance;
            }
            this.baseHeight = this.y;
            this.runningJump = false;
            this.y = tempY;
        }
        this.lastBottom = this.boundingbox.bottom;
        this.lastTop = this.boundingbox.top;
        this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);

        /*
         * Standing and Jumping
         */
    } else if ((this.game.space && this.standing) || this.jumping) {
        this.jumping = true;
        this.runningJump = false;
        this.running = false;
        this.standing = false;
        this.game.isRightArrowUp = true;
        this.game.isLeftArrowUp = true;
        this.game.rightArrow = false;
        this.game.leftArrow = false;

        if (direction) { // Right
            var duration = this.jumpRight.elapsedTime + this.game.clockTick; //the duration of the jump.
            if (duration > this.jumpRight.totalTime / 2) {
                duration = this.jumpRight.totalTime - duration;
            }
            duration = duration / this.jumpRight.totalTime;
            this.height = (4 * duration - 4 * duration * duration) * maxHeight + 17;

            this.lastBottom = this.boundingbox.bottom;
            this.y = this.baseHeight - this.height / 2;

            if (this.jumpRight.isDone()) {
                this.y = this.baseHeight;
                this.jumpRight.elapsedTime = 0;
                this.jumping = false;
            }

            this.lastBottom = this.boundingbox.bottom;
            this.lastTop = this.boundingbox.top;
            this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);

        } else { // Left

            var duration = this.jumpLeft.elapsedTime + this.game.clockTick;
            if (duration > this.jumpLeft.totalTime / 2) {
                duration = this.jumpLeft.totalTime - duration;
            }
            duration = duration / this.jumpLeft.totalTime;
            this.height = (4 * duration - 4 * duration * duration) * maxHeight + 17;

            this.lastBottom = this.boundingbox.bottom;
            this.lastTop = this.boundingbox.top;
            this.y = this.baseHeight - this.height / 2;

            if (this.jumpLeft.isDone()) {
                this.y = this.baseHeight;
                this.jumpLeft.elapsedTime = 0;
                this.jumping = false;
            }

            this.lastBottom = this.boundingbox.bottom;
            this.lastTop = this.boundingbox.top;
            this.boundingbox = new BoundingBox(this.x - moveDistance, this.y, this.boundingbox.width, this.boundingbox.height);
        }

        if (this.landed) {
            if (direction) {
                this.jumpRight.elapsedTime = 0;
                this.x = this.x - moveDistance;
            }
            else {
                this.jumpLeft.elapsedTime = 0;
                this.x = this.x + moveDistance;
            }
            this.baseHeight = this.y;
            this.jumping = false;
            this.y = tempY;
        }

        this.game.space = false; //stop Runboy from jumping continuously

        /*
         * Running Right
         */
    } else if (this.game.rightArrow) {
        this.running = true;
        this.standing = false;
        this.jumping = false;
        this.runningJump = false;
        var tempX = this.x;
        this.move();
        this.lastBottom = this.boundingbox.bottom;
        this.lastTop = this.boundingbox.top;
        if (this.x > tempX) {
            this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);
        } else {//for when the world x moves but running boy doesn't move?
            this.boundingbox = new BoundingBox(this.x + moveDistance, this.y, this.boundingbox.width, this.boundingbox.height);
        }

        /*
         * Running Left
         */
    } else if (this.game.leftArrow) {
        this.running = true;
        this.standing = false;
        this.jumping = false;
        this.runningJump = false;
        var tempX = this.x;
        this.move();
        this.lastBottom = this.boundingbox.bottom;
        this.lastTop = this.boundingbox.top;
        if (this.x < tempX) {
            this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);
        } else {//for when the world x moves but running boy doesn't move?
            this.boundingbox = new BoundingBox(this.x - moveDistance, this.y, this.boundingbox.width, this.boundingbox.height);
        }

        /*
         * Standing
         */
    } else if (!this.game.leftArrow && !this.game.rightArrow && !this.game.space) {
        this.standing = true;
        this.lastBottom = this.boundingbox.bottom;
        this.lastTop = this.boundingbox.top;
        this.boundingbox = new BoundingBox(this.x, this.y, 80, this.boundingbox.height);
    }

    this.didICollide();

    if (!this.canPass) {
        this.worldX = tempWorldX;
        this.x = tempX;
        this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);
    }
        //If I can pass then I must not have a current platform near me to collide with, so make sure current platform doesn't exist.
    else if (!this.collission) {
        this.currentPlatform = null;
    }

    // de-activate keydown Listeners while jumping or falling, otherwise activate them
    if (this.falling || this.jumping || this.runningJump) {
        this.game.addListeners = false;
    } else {
        this.game.addListeners = true;
    }

    Entity.prototype.update.call(this);
};

/*
* Determines whether RunBoy moves on the canvas, in the world, or both.
*/
RunBoy.prototype.move = function () {
    var canvasMidpoint = this.canvasWidth / 2;

    if (direction) {
        if ((this.worldX < canvasMidpoint) || ((this.worldX >= this.worldWidth - canvasMidpoint) &&
            (this.x + 90 <= this.canvasWidth - moveDistance))) {
            this.x += moveDistance;
            this.worldX += moveDistance;

        } else if (this.worldX >= this.worldWidth) { // he's at the right edge of the world and canvas
            this.worldX = this.worldWidth;

        } else { // he's in the middle of the canvas facing right
            this.worldX += moveDistance;
        }

    } else {
        if (this.worldX < canvasMidpoint && (this.x >= moveDistance) || (this.worldX > this.worldWidth - canvasMidpoint)) {
            this.x -= moveDistance;
            this.worldX -= moveDistance;

        } else if (this.x <= 0 || this.worldX <= 0) { // he's at the left edge of the world and canvas
            this.worldX = 0;
            this.x = 0;

        } else { // he's in the middle of the canvas facing left
            this.worldX -= moveDistance;
        }
    }
};

RunBoy.prototype.moveRewind = function () {
    var canvasMidpoint = this.canvasWidth / 2;

    if (this.worldX < canvasMidpoint || this.worldX > (this.worldWidth - canvasMidpoint)) {
        this.x = this.lastFrame.canvasX;
        this.worldX = this.lastFrame.worldX; //-= moveDistance;

    } else if (this.x <= 0 || this.worldX <= 0) { // he's at the left edge of the world and canvas
        this.worldX = 0;
        this.x = 0;

    } else { // he's in the middle of the canvas facing left
        this.worldX = this.lastFrame.worldX;
        //this.x = this.lastFrame.worldX;
    }

    this.y = this.lastFrame.canvasY;
    

    //if (this.myRewindStack.length === 1) {
    //    this.boundingbox = new BoundingBox(this.rewindFrame.x, this.rewindFrame.y,
    //        this.rewindFrame.width, this.rewindFrame.height);
    //}
    direction = this.rewindFrame.direction;
    this.falling = this.rewindFrame.falling;
    this.jumping = this.rewindFrame.jumping;
    this.runningJump = this.rewindFrame.runningJump;
    this.currentPlatform = this.rewindFrame.currentPlatform;
    this.worldY = this.lastFrame.worldY;
}

RunBoy.prototype.draw = function (ctx) {
    if (this.game.running === false) {
        return;
    }

    if (this.rewinding === true) {
        var canvasMidpoint = this.canvasWidth / 2;
        if (this.myRewindStack.length === 0) {

            this.rewinding = false;
            return;
        }
        this.lastFrame = this.rewindFrame.drawFrame(this.game.clockTick, ctx);
        this.moveRewind();
        


        //}
    } else if (this.falling) {
        //fall to the right.
        if (direction) {
            this.fallRight.drawFrame(this.game.clockTick, ctx, this.x, this.y);
            this.addRewindFrame(this.fallRight.clipX, this.fallRight.clipY,
                this.fallRight.frameWidth, this.fallRight.frameHeight);
        }
            //fall to the left.
        else {
            this.fallLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y);
            this.addRewindFrame(this.fallLeft.clipX, this.fallLeft.clipY,
                this.fallLeft.frameWidth, this.fallLeft.frameHeight);
        }
    }
        // Jumping
    else if (this.jumping || this.runningJump) {

        //jumping to the right.
        if (direction) {
            this.jumpRight.drawFrame(this.game.clockTick, ctx, this.x, this.y);
            this.addRewindFrame(this.jumpRight.clipX, this.jumpRight.clipY,
                this.jumpRight.frameWidth, this.jumpRight.frameHeight);

            //jumping to the left.
        } else {
            this.jumpLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y);
            this.addRewindFrame(this.jumpLeft.clipX, this.jumpLeft.clipY,
                this.jumpLeft.frameWidth, this.jumpLeft.frameHeight);
        }

        // Running, can't run in both directions.
    } else if (this.running && (this.game.isLeftArrowUp === false || this.game.isRightArrowUp === false)) {

        if (direction) {
            this.runRight.drawFrame(this.game.clockTick, ctx, this.x, this.y);
            this.addRewindFrame(this.runRight.clipX, this.runRight.clipY,
                this.runRight.frameWidth, this.runRight.frameHeight);

        } else {
            this.runLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y);
            this.addRewindFrame(this.runLeft.clipX, this.runLeft.clipY,
                this.runLeft.frameWidth, this.runLeft.frameHeight);
        }

        // Standing
    } else {

        if (direction) {
            this.rightStanding.drawFrame(this.game.clockTick, ctx, this.x, this.y);
            this.addRewindFrame(this.rightStanding.clipX, this.rightStanding.clipY, this.rightStanding.frameWidth,
                this.rightStanding.frameHeight);
        } else {
            this.leftStanding.drawFrame(this.game.clockTick, ctx, this.x, this.y);
            this.addRewindFrame(this.leftStanding.clipX, this.leftStanding.clipY, this.leftStanding.frameWidth,
                this.leftStanding.frameHeight);

        }
    }

    ctx.strokeStyle = "purple";
    ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);

    ctx.strokeStyle = "#A4A4A4";
    ctx.strokeRect(1000, 25, 215, 10);
    ctx.fillStyle = "#D8D8D8";
    ctx.fillRect(1001, 26, 213, 8);
    ctx.fillStyle = "#40FF00";
    ctx.fillRect(1001, 26, (this.worldX / this.worldWidth) * 214, 8);
};

RunBoy.prototype.didICollide = function () {
    //console.log("check if they collide");
    //if (this.game.running === false) {
    //    this.game.endGame();
    //    return;
    //}
    this.canPass = true;
    this.landed = false;
    this.collission = false;

    for (var i = 0; i < this.game.entities.length; i++) {

        var entity = this.game.entities[i];
        var result = this.boundingbox.collide(entity.boundingBox);

        

        if (result && !entity.removeFromWorld && entity instanceof Item) {
            // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            this.game.playSounds(document.getElementById('itemSound'));
            // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            entity.removeFromWorld = true;
            this.game.score += entity.points;
            this.game.numItems++;
            document.getElementById("score").innerHTML = this.game.score;
        }
        else if (result && entity instanceof FinishLine) {
            this.game.running = false;
        }
        else if (result && entity instanceof Enemy) {
            // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            this.game.playSounds(document.getElementById('rewindSound'));
            this.rewindCount++;
            // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            this.rewindMe();
            //console.log(entity.boundingbox.x);
        }
        else if (result && entity instanceof Platform) {

            this.collission = true;

            //check if I landed on a platform first
            if (entity.boundingBox.top > this.lastBottom && !this.landed) { //put in separate if state and change landed.
                this.currentPlatform = entity;
                this.landed = result;

                // He landed on a platform while falling
                if (this.falling) {
                    this.falling = false;
                    this.standing = true;
                    this.jumping = false;
                    this.runningJump = false;
                    this.baseHeight = this.y;
                }
                
            }
            else if (entity.boundingBox.bottom < this.lastTop && !this.landed) {
                this.landed = result;
            }
            else if (this.canPass && (this.currentPlatform == null || entity.y < this.currentPlatform.y)) {
                this.canPass = !result;
            }
      
            }
        }
    }



RunBoy.prototype.rewindMe = function () {
    //this.spriteSheet = ;
    this.rewinding = true;
    this.rewindFrame = new RewindAnimation(ASSET_MANAGER.getAsset(heroSpriteSheet), this.myRewindStack);
    this.draw(this.game.ctx);
}
var frameCount = 0;
RunBoy.prototype.addRewindFrame = function (clipX, clipY, frameWidth, frameHeight) {
    if (this.myRewindStack.length >= 600) {
        this.myRewindStack.shift();
    }
    var finalIndex = this.myRewindStack.length - 1;
    var last = this.myRewindStack[finalIndex];
    var current = {
        canvasX: Math.floor(this.x), canvasY: Math.floor(this.y), worldX: Math.floor(this.worldX), worldY: Math.floor(this.worldY),
        clipX: clipX, clipY: clipY,
        frameWidth: frameWidth, frameHeight: frameHeight, direction: direction ? true : false, falling: this.falling,
        jumping: this.jumping, runningJump: this.runningJump, running: this.running, boundingbox: this.boundingbox, 
        currentPlatform: this.currentPlatform
    };
    this.lastFrame = current;
    this.myRewindStack.push(current);

}