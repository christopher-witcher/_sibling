heroSpriteSheet = "runboySprite.png";
direction = true;
screenOffSet = 0;
var backImg = "neighBackgroundext.png";
var gameEngine;
var canvasWidth = 1250;
var canvasHeight = 700;
var boardPieces = [];
var rewindFrame;
gameEngine = null;

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
//loads all the image files.
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

    this.locX = x;
    this.locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    this.clipX = index * this.frameWidth + offset;
    this.clipY = vindex * this.frameHeight + this.startY;


    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  this.locX, this.locY,
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

function RewindAnimation(spriteSheet, rewindStack) {
    this.spriteSheet = spriteSheet;
    this.myRewindStack = rewindStack;
    this.previousFrame = null;
}

RewindAnimation.prototype.drawFrame = function (tick, ctx, scaleBy) {
         
    if (this.myRewindStack.length > 0) {
        var current = this.myRewindStack.pop();

        ctx.drawImage(this.spriteSheet,
                         current.clipX, current.clipY, current.frameWidth, current.frameHeight,
                         current.canvasX, current.canvasY, current.frameWidth, current.frameHeight);
        this.previousFrame = current;
        return current;
    }
       
    return this.previousFrame;


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
    this.addListeners = true;
    this.score = 0;
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
    //this.timer = new Timer();
    this.LeftLimit = 0;
    this.rightLimit = 1450;
    document.getElementById("score").innerHTML = this.score;
    console.log('game initialized');
}

//Starts looping through the game.
GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    this.timer = new Timer();
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

//Sets up addListeners for input from the user.
GameEngine.prototype.startInput = function () {
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top + 23; //canvas top is 23 pixels from top

        return { x: x, y: y };
    }

    var that = this;

    this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
 
        GetButtonCoordinates();

        function GetButtonCoordinates() {
            var button = document.getElementById("startButton");
            var p = GetScreenCoordinates(button);

            if (that.click.x > p.x && that.click.x < p.x + button.offsetWidth &&
                that.click.y > p.y && that.click.y < p.y + button.offsetHeight) {

                
                //button.setAttribute("hidden", true);
                ////button.setAttribute("disabled", true);
                //this.gameEngine.start();
            }
        }
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mouseleave", function (e) {
        that.mouse = null;
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
        e.preventDefault();
    }, false);

    this.keyDown = function (e) {
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
    }

    this.ctx.canvas.addEventListener("keydown", this.keyDown, false);

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

/*
* Gets the x and y coordinates of an HTML object.
*/
function GetScreenCoordinates(obj) {
    var p = {};
    p.x = obj.offsetLeft;
    p.y = obj.offsetTop;
    while (obj.offsetParent) {
        p.x = p.x + obj.offsetParent.offsetLeft;
        p.y = p.y + obj.offsetParent.offsetTop;
        if (obj == document.getElementsByTagName("body")[0]) {
            break;
        }
        else {
            obj = obj.offsetParent;
        }
    }
    return p;
};


//Adds and entity to the game engine.
GameEngine.prototype.addEntity = function (entity) {
    //console.log('added entity');
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

    // add or remove keydown addListeners depending on whether Runboy is currently jumping
    if (this.addListeners) {
        this.ctx.canvas.addEventListener("keydown", this.keyDown, false);
    } else {
        this.ctx.canvas.removeEventListener("keydown", this.keyDown, false);
    }


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

//A class for the bounding box of collision detection.
function BoundingBox(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.left = x;
    this.top = y;
    this.right = this.left + width;
    this.bottom = this.top + height;
}

//checks if this bounding box collided with the other.
BoundingBox.prototype.collide = function (oth) {

    if (oth == null) { //DO NOT CHANGE TO ===
        return null;
    }

    if (this.right > oth.left && this.left < oth.right && this.top < oth.bottom && this.bottom > oth.top) {
        return true;
    }

    return false;
};

/*
* An item that the character can interact with in the world.
*/
function Item(game, x, y, point, clipX, clipY, frameWidth, frameHeight) {
    this.game = game;
    this.worldX = x;
    this.worldY = y;
    this.points = point;
    //sprite information goes here.
    this.drawItem = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), clipX, clipY, frameWidth, frameHeight, 0.01, 1, true);
    this.width = frameWidth;
    this.height = frameHeight;
    //made both width and height 50 because  the frameWidtha and framHeight are way to large.
    this.boundingBox = new BoundingBox(this.worldX, this.worldY, 50, 50);

    Entity.call(this, game, this.worldX, this.worldY);
};

Item.prototype = new Entity();
Item.prototype.constructor = Item;

/*
* updates the item.
*/
Item.prototype.update = function () {
    this.boundingBox = new BoundingBox(this.x, this.y, this.boundingBox.width, this.boundingBox.height);
    Entity.prototype.update.call(this);
};

/*
* draws the item 
*/
Item.prototype.draw = function (ctx) {
    //ctx.fillStyle = "purple";
    //ctx.fillRect(this.x, this.y, this.width, this.height);
    this.drawItem.drawFrame(this.game.clockTick, ctx, this.x, this.y, 0.25);
    ctx.strokeStyle = "red";
    ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
};

function FinishLine(game, gameWidth) {
    this.game = game;
    //console.log(gameWidth);
    this.x = gameWidth;
    this.y = 125;
    this.width = 394;
    this.height = 446;
    this.finishLineAnimation = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 3000, 394, 446, 0.066, 30, true, false);
    //this.boundingBox = new BoundingBox(this.x, this.y, this.width, this.height);

    Entity.call(this, game, this.x, this.y);
}

FinishLine.prototype = new Entity();
FinishLine.prototype.constructor = FinishLine;

FinishLine.prototype.update = function () {
    //this.boundingBox = new BoundingBox(this.x, this.y, this.width, this.height);
    Entity.prototype.update.call(this);
};

FinishLine.prototype.draw = function (ctx) {
    //ctx.fillStyle = "purple";
    //ctx.fillRect(this.x, this.y, this.width, this.height);
    //ctx.strokeStyle = "red";
    //ctx.strokeRect(, this.boundingBox.width, this.boundingBox.height);
    this.finishLineAnimation.drawFrame(this.game.clockTick, ctx, this.x, this.y);
};

/*
* A simple object to test scrolling
*/
function Block(game, x, y, width, height) {
    this.game = game;
    this.worldX = x;
    this.worldY = y;
    this.width = width;
    this.height = height;

    this.boundingBox = new BoundingBox(this.worldX, this.worldY, this.width, this.height);
    // set the block's initial position in the world
    Entity.call(this, game, this.worldX, this.worldY);
};

Block.prototype = new Entity();
Block.prototype.constructor = Block;

Block.prototype.update = function () {
    this.boundingBox = new BoundingBox(this.worldX, this.worldY, this.width, this.height);
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
    this.time = (Date.now() - this.startTime);
    var formattedTime = convertTime(this.time);
    document.getElementById("timer").innerHTML = formattedTime;
};

function convertTime(miliseconds) {
    var totalSeconds = 120 - Math.floor(miliseconds / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds - minutes * 60;
    if (seconds === 0) {
        seconds = "0" + seconds;
    } else if (seconds % 10 === seconds) {
        seconds = "0" + seconds;
    }
    return minutes + ':' + seconds;
}

/*
* Starts the game. This function is called by the HTML button called "startButton".
*/
function startGame() {
    var button = document.getElementById("startButton");
    button.parentNode.removeChild(button);
    var title = document.getElementById("gameTitle");
    title.parentNode.removeChild(title);
    gameEngine.start();
    gameEngine.ctx.canvas.focus();
    var timer = new GameTimer(gameEngine);
    gameEngine.addEntity(timer);
}

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
        var line = new FinishLine(gameEngine, gameWorld.width);
        var boy = new RunBoy(gameEngine, canvasWidth, gameWorld.width);

        var nextWidth = boardPieces[0](650, gameEngine);
        nextWidth = boardPieces[1](nextWidth += 500, gameEngine);
        nextWidth = boardPieces[3](nextWidth += 500, gameEngine);

        gameEngine.addEntity(gameWorld);
        gameEngine.addEntity(line);
        gameEngine.addEntity(boy);

        var viewPort = new Viewport(boy, canvasWidth, canvas.height, gameWorld.width, gameWorld.height);
        gameEngine.setViewPort(viewPort);

        gameEngine.init(ctx);
    });
}



function Platform(game, the_x, the_y, canvasWidth, clipX, clipY, frameWidth, frameHeight) {
    this.game = game;
    this.worldX = the_x;
    this.worldY = the_y;
    this.width = frameWidth;
    this.height = frameHeight;
    this.canvasWidth = canvasWidth;
    this.drawPlatform = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), clipX, clipY, this.width, this.height, 0.01, 1, true);
    this.boundingBox = new BoundingBox(this.worldX, this.worldY, this.width, this.height);


    Entity.call(this, game, this.worldX, this.worldY);
    //this.game.addEntity(this);
}

Platform.prototype = new Entity();
Platform.prototype.constructor = Platform;

Platform.prototype.update = function () {
    this.boundingBox = new BoundingBox(this.x, this.y, this.width, this.height);
    Entity.prototype.update.call(this);
};

Platform.prototype.draw = function (ctx) {

    ctx.strokeStyle = "red";
    ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
    this.drawPlatform.drawFrame(this.game.clockTick, ctx, this.x, this.y);
};

var leftCrateSteps = function (game, x, y, height) {
    var size = 50;
    for (var i = 1; i <= height; i++) {
        var tempX;
        var tempY;
        for (var j = 1; j <= i; j++) {
            tempX = (j - 1) * size + x;
            tempY = (i - 1) * size + y;
            var crate = new Platform(game, tempX, tempY, canvasWidth, 1450, 4900, size, size);
            game.addEntity(crate);
        }
        var current = Math.floor(Math.random() * gameItems.length)
        var item = new Item(game, tempX, tempY - 60, gameItems[current].points, gameItems[current].clipX, gameItems[current].clipY,
            gameItems[current].frameWidth, gameItems[current].frameHeight);
        game.addEntity(item);
    }
};

var rightCrateSteps = function (game, x, y, height) {
    var size = 50;
    var start = 1;
    for (var j = height; j >= 1; j--) {
        var tempX;
        var tempY;
        for (var i = start; i <= height; i++) {
            tempX = (i - 1) * size + x;
            tempY = (j - 1) * size + y;
            if (i === start) {
                var current = Math.floor(Math.random() * gameItems.length);
                var item = new Item(game, tempX, tempY - 60, gameItems[current].points, gameItems[current].clipX,
                    gameItems[current].clipY, gameItems[current].frameWidth, gameItems[current].frameHeight);
                game.addEntity(item);
            }

            var crate = new Platform(game, tempX, tempY, canvasWidth, 1450, 4900, size, size);
            game.addEntity(crate);
        }



        start++;
    }
};

var rectPlatform = function (game, x, y, width, height) {
    var size = 50;
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            var tempX = j * size + x;
            var tempY = i * size + y;

            var crate = new Platform(game, tempX, tempY, canvasWidth, 1450, 4900, size, size);
            game.addEntity(crate);
            if (i === 0) {
                var current = Math.floor(Math.random() * gameItems.length)
                var item = new Item(game, tempX, tempY - 60, gameItems[current].points, gameItems[current].clipX, gameItems[current].clipY,
                    gameItems[current].frameWidth, gameItems[current].frameHeight);
                game.addEntity(item);
            }
        }
    }
    //var item = new Item(game, x + 75, y - 60, 10, 0, 0, 50, 50);
    //game.addEntity(item);


};

var spacerSection = function (game, x, y, width, height) {
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            var tempX = j * size + x;
            var tempY = i * size + y;
            var current = Math.floor(Math.random() * gameItems.length)
            var item = new Item(game, tempX, tempY - 60, gameItems[current].points, gameItems[current].clipX, gameItems[current].clipY,
                gameItems[current].frameWidth, gameItems[current].frameHeight);
            game.addEntity(item);

        }
    }
};

boardPieces[0] = function (startX, game) {
    var levelOne = rectPlatform(game, startX, 534, 4, 1);
    var levelTwo = rectPlatform(gameEngine, startX + 450, 415, 4, 1);
    var levelThree = rectPlatform(gameEngine, startX + 775, 296, 4, 1);
    var tallCrates = rectPlatform(gameEngine, startX + 1180, 150, 4, 5);
    var sectionF = rectPlatform(gameEngine, startX + 1680, 150, 8, 1);
    var sectWidth = 8 * 50 + startX + 1680;
    var zeroEnemy = new Enemy(game, startX + 650, 429);
    //spacerSection(game, sectWidth += 250, 415, 4,2);
    game.addEntity(zeroEnemy);
    return sectWidth;
};

boardPieces[1] = function (startX, game) {
    var stairsOne = rightCrateSteps(game, startX, 380, 4);
    var platTwo = rectPlatform(game, startX += 200, 380, 4, 4);
    var stairsThree = leftCrateSteps(game, startX += 200, 380, 4);

    return startX + 500;
};

boardPieces[2] = function (startX, game) {
    var levelOne = rectPlatform(game, startX, 484, 4, 2);


};

boardPieces[3] = function (startX, game) {
    var sectOne = rightCrateSteps(game, startX, 475, 2);
    var sectTwo = rectPlatform(game, startX += 100, 475, 3, 2);
    var sectFour = rectPlatform(game, startX += 300, 350, 4, 1);
    var sectThree = new Platform(game, startX += 350, 470, canvasWidth, 1200, 4700, 175, 118);
    game.addEntity(sectThree);
};


/******************
* All items to be used in game engine
*
**********************/

var gameItems = [];

gameItems[0] = {
    clipX: 2315,
    clipY: 4755,
    frameWidth: 2475 - 2315,
    frameHeight: 4895 - 4755,
    points: 20
};

gameItems[1] = {
    clipX: 2500,
    clipY: 4770,
    frameWidth: 2580 - 2500,
    frameHeight: 4890 - 4770,
    points: 20
};

gameItems[2] = {
    clipX: 2700,
    clipY: 4720,
    frameWidth: 2790 - 2700,
    frameHeight: 4900 - 4720,
    points: 30
};

gameItems[3] = {
    clipX: 2820,
    clipY: 4750,
    frameWidth: 2905 - 2820,
    frameHeight: 4905 - 4750,
    points: 30
};

gameItems[4] = {
    clipX: 2905,
    clipY: 4745,
    frameWidth: 3045 - 2905,
    frameHeight: 4910 - 4745,
    points: 40
};

//gameItems[5]

//gameItems[6]

//gameItems[7]

//gameItems[8]

//gameItems[9]

//gameItems[10]

//gameItems[11]
