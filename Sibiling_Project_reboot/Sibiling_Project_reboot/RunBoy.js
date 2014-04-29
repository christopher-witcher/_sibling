//The location of the sprite sheet
heroSpriteSheet = "runboySprite.png";

//Sets up different animation of runboy and initializes the controls
function RunBoy(game, canvasWidth, worldWidth) {

    this.rightStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 300, 100, 150, 0.01, 1, true, false);
    this.leftStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 100, 300, 100, 150, 0.01, 1, true, false);

    this.runRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 0, 100, 150, 0.008, 120, true, false);
    this.runLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 150, 100, 150, 0.008, 120, true, false);

    this.jumpRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 475, 114, 160, .0333, 90, false);
    this.jumpLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 650, 114, 160, 0.0333, 60, false);
    this.jumping = false;
    this.running = false;
    this.standing = true;

    this.canvasWidth = canvasWidth;
    this.worldWidth = worldWidth;
   this.boundingbox = new BoundingBox(20, 540, 90, 140);
    

    // set the sprite's starting position on the canvas
    Entity.call(this, game, 20, 520);
}

RunBoy.prototype = new Entity();
RunBoy.prototype.constructor = RunBoy;

//The update method for run boy
//has the controls for when he will run and jump and will move the player across the screen.
RunBoy.prototype.update = function () {

    if (this.game.rightArrow) {

        this.running = true;
        //this.standing = false;
        direction = true;
        //console.log(this.game.rightLimit);

        if ((this.x < this.canvasWidth / 2) || (this.worldX >= this.worldWidth - this.canvasWidth / 2)) {

            if (this.worldX + 110 <= this.worldWidth - 7) {
                this.x += 7;
                this.worldX += 7;
                this.boundingbox = new BoundingBox(this.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
                //this.boundingbox.x = this.worldX;
                
            }
        } else if (this.worldX === this.worldWidth) {
            // do nothing, he's at the right edge of the world and canvas
        } else {
            this.worldX += 7; // need to fix case where Runboy keeps running at right edge (worldX should not increase)
            //this.boundingbox.x = this.boundingbox.x + 7;
        }
        this.didICollide();
    }

    if (this.game.leftArrow) {
        this.running = true;
        //this.standing = false;
        direction = false;

        if (this.worldX < this.canvasWidth / 2 && (this.x >= 7) || (this.worldX > this.worldWidth - this.canvasWidth / 2)) {
            this.x -= 7;
            this.worldX -= 7;
            this.boundingbox = new BoundingBox(this.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
            //this.boundingbox.x = this.worldX;
            
        } else if (this.x === 0 || this.worldX === 0) {
            // do nothing, he's at the left edge of the world and canvas
        } else {
            this.worldX -= 7; // need to fix case where Runboy keeps running at left edge (worldX should not decrease)
        }
        this.didICollide();
    }

    if (this.running === false) {
        this.standing = true;
    }

    if (this.game.space) {
        this.jumping = true;
        //this.x += 10;
    }
    Entity.prototype.update.call(this);
}

RunBoy.prototype.draw = function (ctx) {

    //checks if the player want to jump.
    if (this.jumping) {

        var height = 0;
        var maxHeight = 300;

        //running to the right.
        if (direction) {

            var duration = this.jumpRight.elapsedTime + this.game.clockTick;
            if (duration > this.jumpRight.totalTime / 2) duration = this.jumpRight.totalTime - duration;
            duration = duration / this.jumpRight.totalTime;
            // linear jump
            height = maxHeight * 2 * duration + 17;

            // quadratic jump
            height = (4 * duration - 4 * duration * duration) * maxHeight + 17;
            this.jumpRight.drawFrame(this.game.clockTick, ctx, this.x, this.y - height / 2);
            this.boundingbox.y = this.y - height / 2;

            if (this.jumpRight.isDone()) {
                this.jumpRight.elapsedTime = 0;
                this.jumping = false;
                this.boundingbox.y = 540;
            }
        //running to the left.
        } else {
            var duration = this.jumpLeft.elapsedTime + this.game.clockTick;
            if (duration > this.jumpLeft.totalTime / 2) duration = this.jumpLeft.totalTime - duration;
            duration = duration / this.jumpLeft.totalTime;
            // linear jump
            height = maxHeight * 2 * duration + 17;

            // quadratic jump
            height = (4 * duration - 4 * duration * duration) * maxHeight + 17;
            this.jumpLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y - height / 2);
            this.boundingbox.y = this.y - height / 2;

            if (this.jumpLeft.isDone()) {
                this.jumpLeft.elapsedTime = 0;
                this.jumping = false;
                this.boundingbox.y = 540;
            }
        }
    //control for running. can't run in both directions.
    } else if (this.running && (this.game.isLeftArrowUp === false || this.game.isRightArrowUp === false)) {
        //this.standing = false;
        if (direction) {
            this.runRight.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        } else {
            this.runLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        }
    //if there is no movement they are standing.
    } else {

        if (direction) {
            this.rightStanding.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        } else {
            this.leftStanding.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        }

    }
    ctx.strokeStyle = "purple";
    ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
}

RunBoy.prototype.didICollide = function () {
    //console.log("check if they collide");
    for (i = 0; i < this.game.entities.length; i++) {
        var entity = this.game.entities[i];
        if (entity instanceof Block) {
            //console.log("I'm a box");
            console.log(this.boundingbox.collide(entity.boundingBox));
        }
    }
    
}