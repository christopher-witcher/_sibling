//The location of the sprite sheet
var enemyList = [];

enemyList[0] = {
    runRightX: 100,
    runRightY: 1350,
    runLeftX: 100,
    runLeftY: 1515,
    runHeight: 140,
    runWidth: 100,
    jumpLeftX: 0,
    jumpLeftY: 1650,
    jumpRightX: 0,
    jumpRight: 1815,
    jumpHeight: 140,
    jumpWidth: 100,
    runOffSet: 8,
    scaleBy: 1,
    jumpScaleBy: 1.2

};

enemyList[1] = {
    runRightX: 100,
    runRightY: 2100,
    runLeftX: 100,
    runLeftY: 2250,
    runHeight: 150,
    runWidth: 100,
    jumpLeftX: 0,
    jumpLeftY: 2560,
    jumpRightX: 0,
    jumpRightY: 2400,
    jumpHeight: 160,
    jumpWidth: 114,
    runOffSet: 10,
    scaleBy: 0.9,
    jumpScaleBy: 1.2
};

enemyList[2] = {
    runRightX: 100,
    runRightY: 800,
    runLeftX: 100,
    runLeftY: 640,
    runHeight: 150,
    runWidth: 99,
    jumpLeftX: 0,
    jumpLeftY: 1120,
    jumpRightX: 0,
    jumpRightY: 960,
    jumpHeight: 160,
    jumpWidth: 114,
    runOffSet: 10,
    scaleBy: 0.9,
    jumpScaleBy: 1.2
};

enemyMoveDistance = 3;
maxMove = 100;
var globalCurrentEnemy = 0;
//Sets up different animation of runboy and initializes the controls
function Enemy(game, startingX, startingY, jump) {
    //this.currentEnemy = Math.floor(Math.random() * enemyList.length);
    if (globalCurrentEnemy >= 2) {
        globalCurrentEnemy = 0;
    } else {
        globalCurrentEnemy += 1;
    }
    this.currentEnemy = globalCurrentEnemy;
    //Animations for the enemy.
    this.runRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), enemyList[this.currentEnemy].runRightX, enemyList[this.currentEnemy].runRightY,
        enemyList[this.currentEnemy].runWidth, enemyList[this.currentEnemy].runHeight,
        0.008, 120, true, false);

    this.runLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), enemyList[this.currentEnemy].runLeftX, enemyList[this.currentEnemy].runLeftY, enemyList[this.currentEnemy].runWidth, enemyList[this.currentEnemy].runHeight,
        0.008, 120, true, false);


    // 5/27/2014 Need to change to actual jumping animation.
    this.jumpRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), enemyList[this.currentEnemy].jumpRightX, enemyList[this.currentEnemy].jumpRightY,
        enemyList[this.currentEnemy].jumpWidth, enemyList[this.currentEnemy].jumpHeight, 0.015, 89, true);

    this.jumpLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), enemyList[this.currentEnemy].jumpLeftX, enemyList[this.currentEnemy].jumpLeftY,
        enemyList[this.currentEnemy].jumpWidth, enemyList[this.currentEnemy].jumpHeight, 0.015, 89, true);


    // set the sprite's starting position on the canvas

    this.canPass = true;
    this.jump = jump;
    this.height = 0;
    this.baseHeight = startingHeight;
    this.scaleBy = enemyList[this.currentEnemy].scaleBy;
    this.myDirection = true;
    this.moveCount = 0;

    this.boundingBox = new BoundingBox(this.worldX, this.worldY, 90, 145);
    Entity.call(this, game, startingX, startingY);
}

Enemy.prototype = new Entity();
Enemy.prototype.constructor = Enemy;

Enemy.prototype.update = function () {

    var maxHeight = 310;
    
    ///Adding in jumping. 5/27/2014
    if (this.jump) {

        //start jump
        if (this.moveCount === maxMove * 2) {

            if (this.myDirection) { // Right
                var duration = this.jumpRight.elapsedTime + this.game.clockTick; //the duration of the jump.
                if (duration > this.jumpRight.totalTime / 2) {
                    duration = this.jumpRight.totalTime - duration;
                }
                duration = duration / this.jumpRight.totalTime;
                this.height = (4 * duration - 4 * duration * duration) * maxHeight + 17;

                this.y = this.baseHeight - this.height / 2;

                if (this.jumpRight.isDone()) {
                    this.y = this.baseHeight;
                    this.jumpRight.elapsedTime = 0;
                    this.moveCount = 0;
                    this.myDirection = false;
                }

            } else { // Left

                var duration = this.jumpLeft.elapsedTime + this.game.clockTick;
                if (duration > this.jumpLeft.totalTime / 2) {
                    duration = this.jumpLeft.totalTime - duration;
                }
                duration = duration / this.jumpLeft.totalTime;
                this.height = (4 * duration - 4 * duration * duration) * maxHeight + 17;

                this.y = this.baseHeight - this.height / 2;

                if (this.jumpLeft.isDone()) {
                    this.y = this.baseHeight;
                    this.jumpLeft.elapsedTime = 0;
                    this.moveCount = 0;
                    this.myDirection = true;
                    
                }
                
            }
        }
        else {
            this.moveCount++;
        }
        //console.log(this.moveCount);
    }//The end of jumping being added 5/27/2014
    else {
        if (this.moveCount > maxMove) {
            this.myDirection = !this.myDirection;
            this.moveCount = 0;
        }
        if (this.myDirection) {
            this.worldX = this.worldX + enemyMoveDistance;
            this.moveCount++;
        }
        else {
            this.worldX = this.worldX - enemyMoveDistance;
            this.moveCount++;
        }
    }
    this.boundingBox = new BoundingBox(this.x, this.y, 90, 145);
    Entity.prototype.update.call(this);
};


Enemy.prototype.draw = function (ctx) {

    if (this.jump) {
        if (this.myDirection) {
            this.jumpRight.drawFrame(this.game.clockTick, ctx, this.x, this.y, enemyList[this.currentEnemy].jumpScaleBy);
        }
        else {
            this.jumpLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y, enemyList[this.currentEnemy].jumpScaleBy);
        }
    }
    else {
        //walking right
        if (this.myDirection) {
            this.runRight.drawFrame(this.game.clockTick, ctx, this.x, this.y + enemyList[this.currentEnemy].runOffSet, this.scaleBy);
        }
            //walking left
        else {
            this.runLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y + enemyList[this.currentEnemy].runOffSet, this.scaleBy);
        }
    }

    ctx.strokeStyle = "green";
    ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
};

Enemy.prototype.didICollide = function () {boundingBox
    //console.log("check if they collide");
    this.canPass = true;

    for (var i = 0; i < this.game.entities.length; i++) {

        var entity = this.game.entities[i];
        var result = this.boundingBox.collide(entity.boundingBox);

        if (this.canPass && entity.hasOwnProperty('boundingBox')) {
            this.canPass = !result;
        }
    }

}