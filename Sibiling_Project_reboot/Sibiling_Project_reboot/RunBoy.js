//The location of the sprite sheet
heroSpriteSheet = "blue_player.png";

//Sets up different animation of runboy and initializes the controls
function RunBoy(game) {

    this.rightStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 40, 334, 60, 125, 0.01, 1, true, false);
    this.leftStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 145, 330, 60, 120, 0.01, 1, true, false);

    this.runRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 19, 143, 143, 0.15, 6, true, false);
    this.runLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 164, 143, 143, 0.15, 6, true, false);

    this.jumpRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 410, 490, 100, 110, .4, 4, false);
    this.jumpLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 410, 360, 100, 110, 0.4, 4, false);
    this.jumping = false;
    this.running = false;
    this.standing = true;

    // set the sprite's starting position on the canvas
    Entity.call(this, game, 20, 550);
}

RunBoy.prototype = new Entity();
RunBoy.prototype.constructor = RunBoy;

//The update method for run boy
//has the controls for when he will run and jump and will move the player across the screen.
RunBoy.prototype.update = function () {

    if (this.game.rightArrow) {

        this.running = true;
        this.standing = false;
        direction = true;
        this.x += 7;
        
    }

    if (this.game.leftArrow) {
        this.running = true;
        this.standing = false;
        direction = false;
        this.x -= 7;
        
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

        //is there a differece between this if and else?
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

            if (this.jumpRight.isDone()) {
                this.jumpRight.elapsedTime = 0;
                this.jumping = false;
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

            if (this.jumpLeft.isDone()) {
                this.jumpLeft.elapsedTime = 0;
                this.jumping = false;
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
}