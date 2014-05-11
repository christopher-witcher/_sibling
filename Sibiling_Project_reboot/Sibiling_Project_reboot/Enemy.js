//The location of the sprite sheet

enemyMoveDistance = 3;
maxMove = 100;

//Sets up different animation of runboy and initializes the controls
function Enemy(game, startingX, startingY) {

    //Animations for the enemy.

    // set the sprite's starting position on the canvas
    Entity.call(this, game, startingX, startingY);

    this.canPass = true;
    this.height = 0;
    this.baseHeight = startingHeight;

    this.myDirection = true;
    this.moveCount = 0;

    this.boundingbox = new BoundingBox(this.worldX, this.worldY, 90, 145); 

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

    Entity.prototype.update.call(this);
    this.boundingbox = new BoundingBox(this.worldX, this.worldY, 90, 145);
};


Enemy.prototype.draw = function (ctx) {

    //walking right
    if (this.myDirection) {
        //the animation for the right direction.
    }
    //walking left
    else {
        //the animation for the left direction.
    }

    ctx.strokeStyle = "green";
    ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
};

Enemy.prototype.didICollide = function () {
    //console.log("check if they collide");
    this.canPass = true;

    for (var i = 0; i < this.game.entities.length; i++) {

        var entity = this.game.entities[i];
        var result = this.boundingbox.collide(entity.boundingBox);

        if (this.canPass && entity.hasOwnProperty('boundingBox')) {
            this.canPass = !result;
        }
    }

}