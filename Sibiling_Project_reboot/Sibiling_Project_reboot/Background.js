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
    this.width = 3000; //the width of the level or world
    this.height = height;
    this.game = game;
    Entity.call(this, game, 0, 0);
}

Background.prototype = new Entity();
Background.prototype.constructor = Background;

Background.prototype.update = function () {
    Entity.prototype.update.call(this);
};

Background.prototype.draw = function () {
};