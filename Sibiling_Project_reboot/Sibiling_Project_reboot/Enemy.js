//The location of the sprite sheet
var enemyList = [];

enemyList[0] = {
    runRightX: 100,
    runRightY: 1050,
    runLeftX: 100,
    runLeftY: 1200
};

enemyList[1] = {};

enemyList[2] = {};

enemyMoveDistance = 3;
maxMove = 100;

//Sets up different animation of runboy and initializes the controls
function Enemy(game, startingX, startingY) {
    this.currentEnemy = 0;

    //Animations for the enemy.
    this.runRight = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), enemyList[this.currentEnemy].runRightX, enemyList[this.currentEnemy].runRightY, 100, 150,
        0.008, 120, true, false);

    this.runLeft = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), enemyList[this.currentEnemy].runLeftX, enemyList[this.currentEnemy].runLeftY, 100, 150,
        0.008, 120, true, false);
    // set the sprite's starting position on the canvas

    this.canPass = true;
    this.height = 0;
    this.baseHeight = startingHeight;

    this.myDirection = true;
    this.moveCount = 0;

    this.boundingBox = new BoundingBox(this.worldX, this.worldY, 90, 145);
    Entity.call(this, game, startingX, startingY);
}

Enemy.prototype = new Entity();
Enemy.prototype.constructor = Enemy;

Enemy.prototype.update = function () {
    
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
    this.boundingBox = new BoundingBox(this.x, this.y, 90, 145);
    Entity.prototype.update.call(this);
};


Enemy.prototype.draw = function (ctx) {

    //walking right
    if (this.myDirection) {
        this.runRight.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    }
    //walking left
    else {
        this.runLeft.drawFrame(this.game.clockTick, ctx, this.x, this.y);
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