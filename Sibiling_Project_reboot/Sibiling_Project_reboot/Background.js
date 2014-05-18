/*
var backImg = "neighBackgroundext.png";


function Background(game) {
    this.backDrop = new Animation(ASSET_MANAGER.getAsset(backImg), 0, 0, 2048, 700, 0.01, 1, true, false);
    Entity.call(this, game, 0, 0);
    this.game = game;
}

Background.prototype = new Entity();
Background.prototype.constructor = Background;

Background.prototype.update = function () {
    
    Entity.prototype.update.call(this);
}

Background.prototype.draw = function (ctx) {
    this.image = ASSET_MANAGER.getAsset(backImg);
    this.backDrop.drawFrame(this.game.clockTick, ctx, 0, 0);

}
*/

/*
* For having a blank background
*/
function Background(game, height) {
    this.width = 10000; //the width of the level or world
    this.height = height;
    this.game = game;
    //this.worldX = 0;
    //this.worldY = 0;
    //this.drawBackDrop = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 3700, 4300, 1754, 700, 0.01, 1, true, false);
    Entity.call(this, game, 0, 0);

}

Background.prototype = new Entity();
Background.prototype.constructor = Background;

Background.prototype.update = function () {
    this.x = 0;
    this.y = 0;
    Entity.prototype.update.call(this);
};

Background.prototype.draw = function (ctx) {
   // this.drawBackDrop.drawFrame(this.game.clockTick, ctx, this.x, this.y,0.8);
};