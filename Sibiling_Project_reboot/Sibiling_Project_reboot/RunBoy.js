//The location of the sprite sheet
heroSpriteSheet = "runboySprite.png";

//Sets up different animation of runboy and initializes the controls
function RunBoy(game, canvasWidth, worldWidth) {

    this.rightStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 300, 100, 150, 0.01, 1, true, false);
    this.leftStanding = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 100, 300, 100, 150, 0.01, 1, true, false);

    this.runRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 0, 100, 150, 0.008, 120, true, false);
    this.runLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 150, 100, 150, 0.008, 120, true, false);

    this.jumpRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 475, 114, 160, .0333, 45, false);
    this.jumpLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 650, 114, 160, 0.0333, 45, false);

    this.fallRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 450, 475, 114, 160, 0.033, 45, false);
    this.fallLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 450, 650, 114, 160, 0.033, 45, false);

    this.jumping = false;
    this.running = false;
    this.standing = true;
    this.canPass = true;

    this.canvasWidth = canvasWidth;
    this.worldWidth = worldWidth;
    this.boundingbox = new BoundingBox(20, 540, 90, 140);
    this.currentPlatform = null;//when its null I'm not currently on a platform.
    this.lastBottom = this.boundingbox.bottom;//keeps track of where the bounding box's bottom was before it changed. should be when falling.
    

    // set the sprite's starting position on the canvas
    Entity.call(this, game, 20, 520);
}

RunBoy.prototype = new Entity();
RunBoy.prototype.constructor = RunBoy;

//The update method for run boy
//has the controls for when he will run and jump and will move the player across the screen.
RunBoy.prototype.update = function () {

    //console.log("world: " + this.worldX);
    //console.log("x: " + this.x)
    var tempX = this.x;
    var tempWorldX = this.worldX;
    if (this.game.rightArrow) {

        //console.log("In right");

        this.running = true;
        //this.standing = false;
        direction = true;
        //console.log(this.game.rightLimit);

        if ((this.x < this.canvasWidth / 2) || (this.worldX >= this.worldWidth - this.canvasWidth / 2)) {

            if (this.worldX + 110 <= this.worldWidth - 7) {
                this.x += 7;
                this.worldX += 7;
                this.boundingbox = new BoundingBox(this.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height); 
            }

        } else if (this.worldX >= this.worldWidth) {
            this.worldX = this.worldWidth;
            // stops undate the world x when at the end of the world.
        } else {
            this.worldX += 7; 
        }
        this.didICollide();
        //console.log(this.currentPlatform === null);
    }

    if (this.game.leftArrow) {
        
        //console.log("in left");
        this.running = true;
        //this.standing = false;
        direction = false;

        if (this.worldX < this.canvasWidth / 2 && (this.x >= 7) || (this.worldX > this.worldWidth - this.canvasWidth / 2)) {
            //console.log("update me");
            this.x -= 7;
            this.worldX -= 7;
            this.boundingbox = new BoundingBox(this.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
            //this.boundingbox.x = this.worldX;
            
        } else if (this.x <= 0 || this.worldX <= 0) {
            this.worldX = 0;
            this.x = 0;
            // stop moving and update the x's if stuck at the edge.
        } else {
            this.worldX -= 7;
            //this will stop him from getting stuck when colliding.
            this.boundingbox = new BoundingBox(this.boundingbox.x - 1, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        this.didICollide();
        //puts the bounding box back where it needs to be.
        if (!this.worldX <= 0) {
            this.boundingbox = new BoundingBox(this.boundingbox.x + 1, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }

    }

    //If I can't pass and I have not current platform I can't move;
    if (!this.canPass && this.currentPlatform === null) {
        this.worldX = tempWorldX;
        this.x = tempX;
        this.boundingbox = new BoundingBox(this.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
    }
    //If I can't pass then I must not have a current platform, so make sure current platform doesn't exist.
    else if (this.canPass) {//if I'm not colliding with anything I should be on anything.
        this.currentPlatform = null;
    }
    
    
    //console.log(this.canPass);
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

            var duration = this.jumpRight.elapsedTime + this.game.clockTick; //the duration of the jump.
            if (duration > this.jumpRight.totalTime / 2) duration = this.jumpRight.totalTime - duration;
            duration = duration / this.jumpRight.totalTime;
            // linear jump
           // height = maxHeight * 2 * duration + 17;

            // quadratic jump
            height = (4 * duration - 4 * duration * duration) * maxHeight + 17;
            this.jumpRight.drawFrame(this.game.clockTick, ctx, this.x, this.y - height / 2);
            var temp = this.y - height / 2;
            //this.boundingbox.y = temp;
            this.lastBottom = this.boundingbox.bottom;
            this.boundingbox = new BoundingBox(this.boundingbox.x, temp, this.boundingbox.width, this.boundingbox.height);

            if (this.jumpRight.isDone()) {
                this.jumpRight.elapsedTime = 0;
                this.jumping = false;
                //this.boundingbox.y = 540;
                this.boundingbox = new BoundingBox(this.boundingbox.x, 540, this.boundingbox.width, this.boundingbox.height);
            }
            this.didICollide();
            if (!this.canPass) {
                this.jumpLeft.elapsedTime = 0;
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
            var temp = this.y - height / 2;
            this.lastBottom = this.boundingbox.bottom;
            this.boundingbox = new BoundingBox(this.boundingbox.x, temp, this.boundingbox.width, this.boundingbox.height);

            if (this.jumpLeft.isDone()) {
                this.jumpLeft.elapsedTime = 0;
                this.jumping = false;
                this.boundingbox = new BoundingBox(this.boundingbox.x, 540, this.boundingbox.width, this.boundingbox.height);
            }
            this.didICollide();
            if (!this.canPass) {
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
    ctx.strokeStyle = "purple";
    ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
}

RunBoy.prototype.didICollide = function () {
    //console.log("check if they collide");
    this.canPass = true;
    for (i = 0; i < this.game.entities.length; i++) {
        var entity = this.game.entities[i];
        if (entity instanceof Block) {
            //console.log(this.boundingbox.collide(entity.boundingBox));
            //if (entity != this.currentPlatform) {
                this.canPass = !this.boundingbox.collide(entity.boundingBox);
                if (entity.boundingBox.top > this.lastBottom) {
                    this.currentPlatform = entity;
                }
           // }
        }
    }
    
}