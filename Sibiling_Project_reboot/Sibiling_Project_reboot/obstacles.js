//The location of the sprite sheet
var heroSpriteSheet = "runboySprite.png";


//A class for the bounding box of collision detection.
function BoundingBox(x, y, width, height, game) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.left = x;
    this.top = y;
    this.right = this.left + width;
    this.bottom = this.top + height;
    if (game !== null) {
        Entity.call(this, game, this.x, this.y);
    }
}

BoundingBox.prototype = new Entity();
BoundingBox.prototype.constructor = BoundingBox;

//checks if this bounding box collided with the other.
BoundingBox.prototype.collide = function (oth) {
    //console.log("I'm checking");
    if (oth == null) {
        return null;
    }
    //console.log("my right: " + this.right + " their left: " + oth.left);
    //console.log(this.right > oth.left);
    //console.log(this.left < oth.right);
    //console.log(this.top < oth.bottom);
    //console.log(this.bottom > oth.top);
    if (this.right > oth.left && this.left < oth.right && this.top < oth.bottom && this.bottom > oth.top) {
        return true;
    }
    //console.log("no collision");
    return false;
}

BoundingBox.prototype.update = function () {

    Entity.prototype.update.call(this);
};

BoundingBox.prototype.draw = function (ctx) {
    ctx.strokeStyle = "green";
    ctx.lineWidth = "5";
    ctx.strokeRect(this.x, this.y, this.width, this.height);
   
};

//Object created to have a collision line for diagnol regions
function BoundingLine(game, leftX, leftY, rightX, rightY) {
    this.leftX = leftX;
    this.leftY = leftY;
    this.rightX = rightX;
    this.rightY = rightY;
    this.slope = (this.rightY - this.leftY) / (this.rightX - rightX);
    this.line = function (the_x) {
        return this.slope * the_x;
    };
    Entity.call(this, game, 0, 0);
}

BoundingLine.prototype = new Entity();
BoundingLine.prototype.constructor = BoundingLine;

BoundingLine.prototype.update = function () {

    Entity.prototype.update.call(this);
};


BoundingLine.prototype.draw = function (ctx) {
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(this.leftX, this.leftY);
    ctx.lineTo(this.rightX, this.rightY);
    ctx.closePath();
    ctx.stroke();
};
//Used to test if a box instersects the line

BoundingLine.prototype.collide = function (other) {
    var output;

    if (other === null) {
        output = null;
    } else if (other.y === this.line(other.x) || other.y === this.line(other.right)) {
        output = true;
    } else if (other.bottom === this.line(other.x) || other.bottom === this.line(other.right)) {
        output = true;
    } else {
        output = false;
    }

    return output;
}

function Crate(game, x, y) {
    this.x = x;
    this.y = y;
    this.game = game;
    this.drawCrate = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 5000, 50, 50, 0.01, 1, true);
    this.boundingbox = new BoundingBox(this.x, this.y, 50, 50, this.game);
    this.game.addEntity(this.boundingbox);
    
    Entity.call(this, game, this.x, this.y);
    //this.game.addEntity(this);
}

Crate.prototype = new Entity();
Crate.prototype.constructor = Crate;

Crate.prototype.update = function () {
    Entity.prototype.update.call(this);
};

Crate.prototype.draw = function (ctx) {
    
    this.drawCrate.drawFrame(this.game.clockTick, ctx, this.x, this.y);
}