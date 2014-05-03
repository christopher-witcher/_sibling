var obstacles;
var legos;

function Board(game) {
    this.backDrop = new Animation(ASSET_MANAGER.getAsset(backImg), 0, 0, 1036, 735, .01, 1, true, false);
    Entity.call(this, game, 0, 0);
    this.game = game;
    this.obstacles = [];
    this.legos = [];
}

Board.prototype = new Entity();
Board.prototype.constructor = Board;

Board.prototype.update = function () {

    Entity.prototype.update.call(this);
}

Board.prototype.draw = function (ctx) {
    this.image = ASSET_MANAGER.getAsset(backImg);
    this.backDrop.drawFrame(this.game.clockTick, ctx, 0, 0);

}