heroSpriteSheet = "runboySprite.png";
direction = true;
screenOffSet = 0;
var backImg = "neighBackgroundext.png";
var gameEngine;
var canvasWidth = 1250;
var canvasHeight = 700;

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

//initializes the asset manager.
function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

//
AssetManager.prototype.queueDownload = function (path) {
    console.log(path.toString());
    this.downloadQueue.push(path);
}

AssetManager.prototype.isDone = function () {
    return (this.downloadQueue.length === this.successCount + this.errorCount);
}
AssetManager.prototype.downloadAll = function (callback) {
    if (this.downloadQueue.length === 0) window.setTimeout(callback, 100);
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function () {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.addEventListener("error", function () {
            that.errorCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.src = path;
        this.cache[path] = img;
    }
}

//gets an asset to add to the cache.
AssetManager.prototype.getAsset = function (path) {
    //console.log(path.toString());
    return this.cache[path];
}

//Creates an animation to be created for the user.
function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, frameDuration, frames, loop, reverse) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
    
}

//Draws an image on the canvas
Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth * scaleBy,
                  this.frameHeight * scaleBy);
}

//
Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
}

//Intializes the timer for the game.
function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

//Controls the game Timer.
Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

//The game engine.
function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
    this.LeftLimit = null;
    this.rightLimit = null;
    this.canvasWidth = canvasWidth;
    this.viewPort = null;

}

GameEngine.prototype.setViewPort = function (viewPort) {
    this.viewPort = viewPort;
};

//Intilizes the game engine. Sets up things to start the game.
GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.timer = new Timer();
    this.LeftLimit = 0;
    this.rightLimit = 1450;
    console.log('game initialized');
}

//Starts looping through the game.
GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

//Sets up listeners for input from the user.
GameEngine.prototype.startInput = function () {
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        if (x < 1024) {
            x = Math.floor(x / 32);
            y = Math.floor(y / 32);
        }

        return { x: x, y: y };
    }

    var that = this;


    this.ctx.canvas.addEventListener("keydown", function (e) {
        if (e.keyCode === 39) {
            that.rightArrow = true;
            that.isRightArrowUp = false;
            direction = true; // true = right
        }

        if (e.keyCode === 37) {
            that.leftArrow = true;
            that.isLeftArrowUp = false;
            direction = false; // false = left
        }

        if (e.keyCode === 32) {
            that.space = true;
        }
        e.preventDefault();
    }, false);

    this.ctx.canvas.addEventListener("keyup", function (e) {
        if (e.keyCode === 39) {
            that.rightArrow = false;
            that.isRightArrowUp = true;
        }
        if (e.keyCode === 37) {
            that.leftArrow = false;
            that.isLeftArrowUp = true;
        }
        e.preventDefault();
    }, false);

    console.log('Input started');
}

//Adds and entity to the game engine.
GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
}

//Draws all entities onto the canvas.
GameEngine.prototype.draw = function (drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {

        // Only draw an entity if it is within the Viewport
        if (this.entities[i].worldX > this.viewPort.leftX && this.entities[i].worldX < this.viewPort.rightX) {
            this.entities[i].draw(this.ctx);
        }

    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

/*
Update all entities
*/
GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        // Update all entities' x value except Runboy
        if (!(entity instanceof RunBoy)) {
            entity.x = canvasWidth + (entity.worldX - this.viewPort.rightX);
        }

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
};

//What the games does during a loop of the game.
GameEngine.prototype.loop = function () {
    this.clockTick = this.timer.tick();
    this.update();
    this.viewPort.update(); // update the viewPort with Runboy's new coordinates
    this.draw();
};

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.worldX = x; //initial worldX is the same as x
    this.worldY = y; //initial worldY is the same as y
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
};

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
    }
};

/*
 * Tells the game engine which Entities should be drawn based on their proximity
 * to the hero. The Viewport is currently larger than the canvas by 800 px. This is
 * to account for the width of any Entity and can be adjusted if necessary.
 */
function Viewport(hero, canvasWidth, canvasHeight, worldWidth, worldHeight) {
    this.hero = hero;
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.leftX = (this.hero.worldX - 400) - canvasWidth / 2;
    this.rightX = (this.hero.worldX + 400) + canvasWidth / 2;
}

Viewport.prototype.constructor = Viewport;

Viewport.prototype.update = function () {
    this.leftX = (this.hero.worldX - 400) - this.width / 2;
    this.rightX = (this.hero.worldX + 400) + this.height / 2;
};



/*
 * A simple object to test scrolling
 */
function Block(game, canvasWidth) {
    this.game = game;
    this.worldX = 1900;
    this.worldY = 560;
    this.width = 130;
    this.height = 100;
    this.canvasWidth = canvasWidth;

    this.boundingBox = new BoundingBox(this.worldX, this.worldY, this.width, this.height);
    // set the block's initial position in the world
    Entity.call(this, game, this.worldX, this.worldY);
};

Block.prototype = new Entity();
Block.prototype.constructor = Block;

Block.prototype.update = function () {
    this.boundingBox = new BoundingBox(this.x, this.y, this.width, this.height);
    Entity.prototype.update.call(this);
};

Block.prototype.draw = function (ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = "red";
    ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
};

/*
 * A time for the game clock.
 */
function GameTimer(game) {
    this.game = game;
    this.time = 0;
    this.startTime = Date.now();
}

GameTimer.prototype = new Entity();
GameTimer.prototype.constructor = GameTimer;

GameTimer.prototype.update = function () {
    this.time = (Date.now() - this.startTime) / 1000;
    document.getElementById("timer").innerHTML = this.time;
};

var ASSET_MANAGER = new AssetManager();
ASSET_MANAGER.queueDownload(backImg);
ASSET_MANAGER.queueDownload(heroSpriteSheet);
window.onload = initialize;
function initialize() {
    ASSET_MANAGER.downloadAll(function () {

        var canvas = document.getElementById('world');
        canvas.setAttribute("tabindex", 0);
        canvas.focus();
        var ctx = canvas.getContext('2d');

        gameEngine = new GameEngine();
        var gameWorld = new Background(gameEngine, canvasWidth);
        //var block = new Block(gameEngine, canvasWidth);
        var boy = new RunBoy(gameEngine, canvasWidth, gameWorld.width);
        var timer = new GameTimer(gameEngine);
        var line = new BoundingLine(gameEngine, 50, 200, 250, 300);
        var theCrate = new Crate(gameEngine, 400, 575);

        gameEngine.addEntity(gameWorld);
        //gameEngine.addEntity(block);
        gameEngine.addEntity(line);
        
        gameEngine.addEntity(boy);
        gameEngine.addEntity(timer);

        gameEngine.addEntity(theCrate);
        var viewPort = new Viewport(boy, canvasWidth, canvas.height, gameWorld.width, gameWorld.height);
        gameEngine.setViewPort(viewPort);

        gameEngine.init(ctx);
        gameEngine.start();
    });
}
