var backImg = "neighBackgroundext.png";


function Background(game) {
    Entity.call(this, game, 0, 0);
}

Background.prototype = new Entity();
Background.prototype.constructor = Background;

Background.prototype.update = function () {
    Entity.prototype.update.call(this);
}

Background.prototype.draw = function (ctx) {
    this.image = ASSET_MANAGER.getAsset(backImg);
    try {
        ctx.drawImage(this.image, 0, 0);
    } catch (Exception) {
        console.log(Exception.message);
    }

}