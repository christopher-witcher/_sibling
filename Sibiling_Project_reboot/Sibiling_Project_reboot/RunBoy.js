//The location of the sprite sheet
heroSpriteSheet = "runboySprite.png";
moveDistance = 7;

//Sets up different animation of runboy and initializes the controls
function RunBoy(game, canvasWidth, worldWidth) {

    this.rightStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 15, 315, 85, 150, 0.01, 1, true, false);
    this.leftStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 95, 318, 85, 150, 0.01, 1, true, false);

    this.runRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 10, 100, 150, 0.008, 120, true, false);
    this.runLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 160, 100, 150, 0.008, 120, true, false);

    this.jumpRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 10, 485, 114, 160, .0333, 45, false);
    this.jumpLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 10, 660, 114, 160, 0.0333, 45, false);

    this.fallRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 450, 475, 114, 160, 0.033, 45, false);
    this.fallLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 450, 650, 114, 160, 0.033, 45, false);

    // set the sprite's starting position on the canvas
    Entity.call(this, game, 0, 525);

    this.jumping = false;
    this.running = false;
    this.runningJump = false;
    this.standing = true;
    this.canPass = true;
    this.height = 0;

    this.canvasWidth = canvasWidth;
    this.worldWidth = worldWidth;
    this.worldX = this.x;
    this.worldY = this.y;
    this.boundingbox = new BoundingBox(this.x, this.y, 90, 140);

}

RunBoy.prototype = new Entity();
RunBoy.prototype.constructor = RunBoy;

//The update method for run boy
//has the controls for when he will run and jump and will move the player across the screen.
RunBoy.prototype.update = function () {
    var maxHeight = 300;
    var tempX = this.x;
    var tempWorldX = this.worldX;

    /*
     * Running and Jumping
     */
    if ((this.game.space && (this.game.rightArrow || this.game.leftArrow)) || this.runningJump) {
        this.runningJump = true;
        this.jumping = false;
        this.running = false;
        this.standing = false;

        if (direction) { // Right

            var duration = this.jumpRight.elapsedTime + this.game.clockTick; //the duration of the jump.
            if (duration > this.jumpRight.totalTime / 2) {
                duration = this.jumpRight.totalTime - duration;
            }
            duration = duration / this.jumpRight.totalTime;
            this.height = (4 * duration - 4 * duration * duration) * maxHeight + 17;

            if (this.jumpRight.isDone()) {
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
                this.jumpLeft.elapsedTime = 0;
                this.runningJump = false;
            }
        }
        this.move();
        this.game.space = false; //stop Runboy from jumping continuously
        this.boundingbox = new BoundingBox(this.x, this.y - this.height / 2, this.boundingbox.width, this.boundingbox.height);

        /*
         * Standing and Jumping
         */
    } else if ((this.game.space && this.standing) || this.jumping) {
        this.jumping = true;
        this.runningJump = false;
        this.running = false;
        this.standing = false;

        if (direction) { // Right

            var duration = this.jumpRight.elapsedTime + this.game.clockTick; //the duration of the jump.
            if (duration > this.jumpRight.totalTime / 2) {
                duration = this.jumpRight.totalTime - duration;
            }
            duration = duration / this.jumpRight.totalTime;
            this.height = (4 * duration - 4 * duration * duration) * maxHeight + 17;

            if (this.jumpRight.isDone()) {
                this.jumpRight.elapsedTime = 0;
                this.jumping = false;
            }
            this.boundingbox = new BoundingBox(this.x + moveDistance, this.y - this.height / 2, this.boundingbox.width, this.boundingbox.height);

        } else { // Left

            var duration = this.jumpLeft.elapsedTime + this.game.clockTick;
            if (duration > this.jumpLeft.totalTime / 2) {
                duration = this.jumpLeft.totalTime - duration;
            }
            duration = duration / this.jumpLeft.totalTime;
            this.height = (4 * duration - 4 * duration * duration) * maxHeight + 17;

            if (this.jumpLeft.isDone()) {
                this.jumpLeft.elapsedTime = 0;
                this.jumping = false;
            }
            this.boundingbox = new BoundingBox(this.x - moveDistance, this.y - this.height / 2, this.boundingbox.width, this.boundingbox.height);
        }
        this.game.space = false; //stop Runboy from jumping continuously

        /*
         * Running Right
         */
    } else if (this.game.rightArrow && !this.game.space) {

        this.running = true;
        this.standing = false;
        this.jumping = false;
        this.runningJump = false;
        var tempX = this.x;
        this.move();
        if (this.x > tempX) {
            this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);
        } else {
            this.boundingbox = new BoundingBox(this.x + moveDistance, this.y, this.boundingbox.width, this.boundingbox.height);
        }

        /*
         * Running Left
         */
    } else if (this.game.leftArrow && !this.game.space) {

        this.running = true;
        this.standing = false;
        this.jumping = false;
        this.runningJump = false;
        var tempX = this.x;
        this.move();
        if (this.x < tempX) {
            this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);
        } else {
            this.boundingbox = new BoundingBox(this.x - moveDistance, this.y, this.boundingbox.width, this.boundingbox.height);
        }

        /*
         * Standing
         */
    } else if (!this.game.leftArrow && !this.game.rightArrow && !this.game.space) {
        this.standing = true;
        this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);
    }

    this.didICollide();

    if (!this.canPass) {
        this.worldX = tempWorldX;
        this.x = tempX;
        this.boundingbox = new BoundingBox(this.x, this.y, this.boundingbox.width, this.boundingbox.height);
    }

    Entity.prototype.update.call(this);
};

/*
 * Determines whether RunBoy moves on the canvas, in the world, or both.
 */
RunBoy.prototype.move = function () {
    var canvasMidpoint = this.canvasWidth / 2;

    if (direction) {
        if ((this.worldX < canvasMidpoint) || ((this.worldX >= this.worldWidth - canvasMidpoint) && (this.x + 90 <= this.canvasWidth - moveDistance))) {
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

RunBoy.prototype.draw = function (ctx) {

    // Jumping
    if (this.jumping || this.runningJump) {

        //jumping to the right.
        if (direction) {
            this.jumpRight.drawFrame(this.game.clockTick, ctx, this.x, this.y - this.height / 2);

            //jumping to the left.
        } else {
            this.jumpLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y - this.height / 2);
        }

        // Running, can't run in both directions.
    } else if (this.running && (this.game.isLeftArrowUp === false || this.game.isRightArrowUp === false)) {

        if (direction) {
            this.runRight.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        } else {
            this.runLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        }

        // Standing
    } else {

        if (direction) {
            this.rightStanding.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        } else {
            this.leftStanding.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        }
    }

    ctx.strokeStyle = "purple";
    ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
};

RunBoy.prototype.didICollide = function () {
    //console.log("check if they collide");
    this.canPass = true;
    for (i = 0; i < this.game.entities.length; i++) {

        var entity = this.game.entities[i];

        if (entity instanceof Block) {
            document.getElementById("runX").innerHTML = this.x;
            document.getElementById("runWorldX").innerHTML = this.worldX;

            document.getElementById("runLeft").innerHTML = this.boundingbox.left;
            document.getElementById("runRight").innerHTML = this.boundingbox.right;
            document.getElementById("runTop").innerHTML = this.boundingbox.top;
            document.getElementById("runBottom").innerHTML = this.boundingbox.bottom;

            document.getElementById("blockLeft").innerHTML = entity.boundingBox.left;
            document.getElementById("blockRight").innerHTML = entity.boundingBox.right;
            document.getElementById("blockTop").innerHTML = entity.boundingBox.top;
            document.getElementById("blockBottom").innerHTML = entity.boundingBox.bottom;

            this.canPass = !this.boundingbox.collide(entity.boundingBox);
        }
    }

}