heroSpriteSheet = "runboySprite.png";
direction = true;
screenOffSet = 0;
var backImg = "neighBackgroundext.png";
var gameEngine;
var canvasWidth = 1250;
var canvasHeight = 700;
var boardPieces = [];
var rewindFrame;

sdParentNode = null;
startDisplay = null;
gameEngine = null;
timer = null;
gameOver = false;
// 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
gameTimeLength = 220000;
// 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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
    this.completed = false;


}

//Draws an image on the canvas
Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
            this.completed = true;
        }
    } else if (this.isDone()) {
        this.completed = true;
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
    this.currentLineInterval = 0;
    this.movingUp = true;
}

RewindAnimation.prototype.drawFrame = function (tick, ctx, scaleBy) {
         
    if (this.myRewindStack.length > 0) {
        var current = this.myRewindStack.pop();

        ctx.drawImage(this.spriteSheet,
                         current.clipX, current.clipY, current.frameWidth, current.frameHeight,
                         current.canvasX, current.canvasY, current.frameWidth, current.frameHeight);
        this.previousFrame = current;
       ctx.drawImage(this.spriteSheet, 5565, 4550, 302, 310, 625, 250, 302*.33, 310*.33)
        
        for (var i = 1; i <= 10; i++) {
            if (this.currentLineInterval < 10 && this.movingUp) {
            this.currentLineInterval += 1;
        } else if (this.currentLineInterval >= 10 && this.movingUp) {
            this.movingUp = false;
            this.currentLineInterval -= 1;
        } else if (this.currentLineInterval > -10 && !this.movingUp) {
            this.currentLineInterval -= 1;
        } else {
            this.movingUp = true;
            this.currentLineInterval += 1;
        }
            ctx.strokeStyle = "#000";
            ctx.beginPath();
            ctx.moveTo(0, i*70 + this.currentLineInterval);
            ctx.lineTo(canvasWidth, i*70 + this.currentLineInterval);
            ctx.stroke();
        }

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
    this.numItems = 0;
    this.running = true;
    this.finishLineCompleted = false;
    this.runInsideComplete = false;
    this.closeDoorCompleted = false;
    
}

GameEngine.prototype.setViewPort = function (viewPort) {
    this.viewPort = viewPort;
};

//GameEngine.prototype.running = true;

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
 
        //GetButtonCoordinates();

        //function GetButtonCoordinates() {
        //    var button = document.getElementById("startButton");
        //    var p = GetScreenCoordinates(button);

        //    if (that.click.x > p.x && that.click.x < p.x + button.offsetWidth &&
        //        that.click.y > p.y && that.click.y < p.y + button.offsetHeight) {

                
        //        //button.setAttribute("hidden", true);
        //        ////button.setAttribute("disabled", true);
        //        //this.gameEngine.start();
        //    }
        //}
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
            // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            document.getElementById("jumpSound").play();
            // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    if (this.running === true) {
        for (var i = 0; i < this.entities.length; i++) {

            // Only draw an entity if it is within the Viewport
            if (this.entities[i].worldX > this.viewPort.leftX && this.entities[i].worldX < this.viewPort.rightX) {
                this.entities[i].draw(this.ctx);
            }

        }
    } else {
        finishLine.draw(this.ctx);
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

        // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // check to see if time has run out
        if (entity instanceof GameTimer && !gameOver) {
            if (Number(entity.time) > gameTimeLength) {
                this.running = false;
                gameOver = true;
                this.endGame();
            }
        }
        // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

BoundingBox.prototype.equals = function (oth) {

    return this.x === oth.x && this.y === oth.y && this.width === oth.width && this.height === oth.height;

}

/*
* An item that the character can interact with in the world.
*/
function Item(game, x, y, point, clipX, clipY, frameWidth, frameHeight, scale) {
    this.game = game;
    this.worldX = x;
    this.worldY = y;
    this.points = point;
    //sprite information goes here.
    this.drawItem = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), clipX, clipY, frameWidth, frameHeight, 0.01, 1, true);
    this.width = frameWidth;
    this.height = frameHeight;
    this.scaleBy = scale;
    this.limitIndex = Math.floor((Math.random() * 15) + 7);
    this.movingUp = true;
    //made both width and height 50 because  the frameWidtha and framHeight are way to large.
    this.boundingBox = new BoundingBox(this.worldX, this.worldY, this.width * scale, this.height * scale);

    Entity.call(this, game, this.worldX, this.worldY);
    this.upperLimit = this.y - this.limitIndex;
    this.lowerLimit = this.y + this.limitIndex;
};

Item.prototype = new Entity();
Item.prototype.constructor = Item;

/*
* updates the item.
*/
Item.prototype.update = function () {
    if (this.movingUp && this.y > this.upperLimit) {
        this.y -= 1;
    } else if (this.movingUp && this.y <= this.upperLimit) {
        this.y += 1;
        this.movingUp = false;
    } else if (!this.movingUp && this.y < this.lowerLimit) {
        this.y += 1;
    } else if(!this.movingUp && this.y >= this.lowerLimit) {
        this.y -= 1;
        this.movingUp = true;
    }

    this.boundingBox = new BoundingBox(this.x, this.y, this.boundingBox.width, this.boundingBox.height);

    Entity.prototype.update.call(this);
};

/*
* draws the item 
*/
Item.prototype.draw = function (ctx) {
    //ctx.fillStyle = "purple";
    //ctx.fillRect(this.x, this.y, this.width, this.height);
    this.drawItem.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.scaleBy);
    //ctx.strokeStyle = "red";
    //ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
};

function FinishLine(game, gameWidth, ctx) {
   // this.game = game;
    this.ctx = ctx;
    //console.log(gameWidth);
    //this.x = gameWidth;
    //this.y = 125;
    //this.width = 394;
    //this.height = 446;
    this.x = gameWidth;
    this.y = 100;
    this.width = 20;
    this.height = 200;
    this.boundingBoxOffSetX = 294;
    this.boundingBoxOffSetY = 225;
    this.runUpStairsCompleted = false;
    this.doorClosed = false;
    this.finishLineAnimation = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 3000, 394, 446, 0.076, 30, false, false);
    this.finishLineDoorOpen = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 3000, 394, 446, 0.01, 1, true, false);
    this.runInsideAnimation = new Animation(ASSET_MANAGER.getAsset(heroSpriteSheet), 0, 3500, 60, 180, 0.011, 120, false, false);

    this.boundingBox = new BoundingBox(this.x + this.boundingBoxOffSetX, this.y + +this.boundingBoxOffSetY, this.width, this.height + 75);
    this.runInsideCounter = 0;
    this.doorClosingCounter = 0;
    this.finishLineCompleted = false;
    Entity.call(this, game, this.x, this.y);
}

FinishLine.prototype = new Entity();
FinishLine.prototype.constructor = FinishLine;

FinishLine.prototype.isCompleted = function () {
    return this.finishLineCompleted;
}

FinishLine.prototype.update = function () {
    if (this.game.running === false && this.game.runInsideComplete === false) {
        return;
    }
    this.boundingBox = new BoundingBox(this.x + this.boundingBoxOffSetX, this.y + this.boundingBoxOffSetY, this.width, this.height);
    Entity.prototype.update.call(this);
};

FinishLine.prototype.draw = function (ctx, game) {
    //ctx.fillStyle = "white";
    //ctx.fillRect(this.x, this.y, this.width, this.height);
    //ctx.strokeStyle = "red";
    //ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
    if (this.game.running === true) {
        this.finishLineDoorOpen.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
    } else if (this.game.running === false && this.runInsideAnimation.completed === false) {
        var canvasX = this.x + this.boundingBoxOffSetX;
        var canvasY = this.y + this.boundingBoxOffSetY;
        this.finishLineDoorOpen.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
        this.runInsideAnimation.drawFrame(this.game.clockTick, this.ctx, this.x + 250,
            this.y + 313);
        this.runUpStairsCompleted = this.runInsideAnimation.completed;
        console.log("running inside");
    } else if (this.game.running === false && this.runUpStairsCompleted === true && this.doorClosed === false) {
        this.finishLineAnimation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
        this.doorClosed = this.finishLineAnimation.completed;
    } else if (this.game.running === false && !gameOver) {
        
        this.game.endGame();
        gameOver = true;
    }
   
    
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
    //ctx.strokeStyle = "red";
    //ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
};

/*
* A time for the game clock.
*/
function GameTimer(game) {
    this.game = game;
    this.time = 0;
    this.startTime = Date.now();
    this.stopped = false;
}

GameTimer.prototype = new Entity();
GameTimer.prototype.constructor = GameTimer;

GameTimer.prototype.update = function () {
    if (!this.stopped) { 
        this.time = (Date.now() - this.startTime);
        var formattedTime = convertTime(this.time);
        document.getElementById("timer").innerHTML = formattedTime;
    }
};

function convertTime(miliseconds) {
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var totalSeconds = (gameTimeLength / 1000) - Math.floor(miliseconds / 1000);
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    initAudio();
    document.getElementById('bgSound').play();
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (document.getElementById("startDisplay")) {
        sdParentNode = document.getElementById("startDisplay").parentNode;
        startDisplay = document.getElementById("startDisplay");
        sdParentNode.removeChild(startDisplay);
    }
    gameEngine.start();
    gameEngine.ctx.canvas.focus();
    timer = new GameTimer(gameEngine);
    gameEngine.addEntity(timer);
};


GameEngine.prototype.endGame = function () {
    timer.stopped = true;
    var timeLeft = timer.time;
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var timeBonus = Math.ceil((gameTimeLength - Number(timeLeft)) / 1000) * 10;
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var element = document.createElement('div');
    element.id = "endDisplay";
    document.body.appendChild(element);
    element.appendChild(document.createTextNode("Game Over"));
    element.style.position = "absolute";
    element.style.left = "500px";
    element.style.top = "130px";
    element.style.fontSize = "65px";
    //element.style.color = "#D0F8FF";
    element.style.color = "red";
    element.style.textShadow = "0 0 5px #A5F1FF, 0 0 10px #A5F1FF, 0 0 20px #A5F1FF, 0 0 30px #A5F1FF, 0 0 40px #A5F1FF";

    var element2 = document.createElement('ul');
    element2.id = "list";
    document.body.appendChild(element2);
    element2.style.position = "absolute";
    element2.style.left = "500px";
    element2.style.top = "270px";
    element2.style.fontSize = "25px";
    //element2.style.color = "#D0F8FF";
    element2.style.color = "red";
    element2.style.textShadow = "0 0 5px #A5F1FF, 0 0 10px #A5F1FF, 0 0 20px #A5F1FF, 0 0 30px #A5F1FF, 0 0 40px #A5F1FF";

    var elem3 = document.createElement('li');
    elem3.appendChild(document.createTextNode("Score: " + (gameEngine.score + timeBonus)));

    var elem4 = document.createElement('li');
    elem4.appendChild(document.createTextNode("Items Collected: " + gameEngine.numItems));

    var elem5 = document.createElement('li');
    elem5.appendChild(document.createTextNode("Time Bonus: " + timeBonus));

    element2.appendChild(elem3);
    element2.appendChild(elem4);
    element2.appendChild(elem5);

    var resetButton = document.createElement('input');
    document.body.appendChild(resetButton);
    resetButton.id = "rb";
    resetButton.type = "button";
    resetButton.value = "Play Again";
    resetButton.style.position = "absolute";
    resetButton.style.left = "540px";
    resetButton.style.top = "470px";
    resetButton.style.display = "inline-block";
    resetButton.style.width = "200px";
    resetButton.style.border = "1px solid red";
    resetButton.style.backgroundColor = "#A5F1FF";
    resetButton.style.fontSize = "150%";
    resetButton.style.color = "red";
    resetButton.style.borderRadius = "5px";
    resetButton.onclick = function () { location.reload() };
    
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    document.getElementById('bgSound').pause();
    document.getElementById('rewindSound').pause();
    // 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
        this.finishLine = new FinishLine(gameEngine, gameWorld.width, ctx);
        var boy = new RunBoy(gameEngine, canvasWidth, gameWorld.width);
        var nextWidth = 700;
        for(var i = 0; i < boardPieces.length; i++){
            nextWidth = boardPieces[i](nextWidth, gameEngine);
            nextWidth += 500;
        }
        nextWidth -= 200;
        nextWidth += spacerSection(gameEngine, nextWidth, 375, 12, 3);
        nextWidth += rectPlatform(gameEngine, nextWidth, 450, 5, 1, true);
        nextWidth += 200;
        nextWidth += rectPlatform(gameEngine, nextWidth, 350, 5, 1, true);
        var lastEnemy = new Enemy(gameEngine, nextWidth, 435);
        gameEngine.addEntity(lastEnemy);
        gameEngine.addEntity(this.finishLine);
        gameEngine.addEntity(boy);
        
        var viewPort = new Viewport(boy, canvasWidth, canvas.height, gameWorld.width, gameWorld.height);
        gameEngine.setViewPort(viewPort);

        gameEngine.init(ctx);
        gameEngine.addEntity(gameWorld);
    });
}


// 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function initAudio() {

    var bgAudio = document.createElement('audio');
    bgAudio.id = "bgSound";
    document.body.appendChild(bgAudio);
    bgAudio.src = "bgMusic.mp3";
    bgAudio.preload = "auto";

    var jumpAudio = document.createElement('audio');
    jumpAudio.id = "jumpSound";
    document.body.appendChild(jumpAudio);
    jumpAudio.src = "Jump18.wav";

    var itemAudio = document.createElement('audio');
    itemAudio.id = "itemSound";
    document.body.appendChild(itemAudio);
    itemAudio.src = "ItemPickup.wav";

    var rewindAudio = document.createElement('audio');
    rewindAudio.id = "rewindSound";
    document.body.appendChild(rewindAudio);
    rewindAudio.src = "rewindSound3.wav";
}
// 5/28 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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

    //ctx.strokeStyle = "red";
    //ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
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
            gameItems[current].frameWidth, gameItems[current].frameHeight, 0.3);
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
                    gameItems[current].clipY, gameItems[current].frameWidth, gameItems[current].frameHeight, 0.3);
                game.addEntity(item);
            }

            var crate = new Platform(game, tempX, tempY, canvasWidth, 1450, 4900, size, size);
            game.addEntity(crate);
        }



        start++;
    }
};

var rectPlatform = function (game, x, y, width, height, createItems) {
    var size = 50;
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            var tempX = j * size + x;
            var tempY = i * size + y;

            var crate = new Platform(game, tempX, tempY, canvasWidth, 1450, 4900, size, size);
            game.addEntity(crate);
            if (i === 0 && createItems) {
                var current = Math.floor(Math.random() * gameItems.length)
                var item = new Item(game, tempX, tempY - 60, gameItems[current].points, gameItems[current].clipX, gameItems[current].clipY,
                    gameItems[current].frameWidth, gameItems[current].frameHeight, 0.3);
                game.addEntity(item);
            }
        }
    }
    //var item = new Item(game, x + 75, y - 60, 10, 0, 0, 50, 50);
    //game.addEntity(item);

    return width * size;
};

var spacerSection = function (game, x, y, width, height) {
    var size = 50;
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            var tempX = j * size + x;
            var tempY = i * size + y;
            var current = Math.floor(Math.random() * gameItems.length)
            var item = new Item(game, tempX, tempY - 60, gameItems[current].points, gameItems[current].clipX, gameItems[current].clipY,
                gameItems[current].frameWidth, gameItems[current].frameHeight,0.3);
            game.addEntity(item);

        }
    }

    return width * size;
};

boardPieces[0] = function (startX, game) {
    //var zeroEnemy = new Enemy(game, startX + 650, 435, true);
    var zeroEnemy = new Enemy(game, startX + 650, 435, true);

    var levelOne = rectPlatform(game, startX, 534, 4, 1, true);
    var levelTwo = rectPlatform(gameEngine, startX += 450, 415, 4, 1, true);
    var levelThree = rectPlatform(gameEngine, startX += 375, 296, 4, 1,true);
    var tallCrates = rectPlatform(gameEngine, startX += 455, 150, 4, 5, true);
    var sectionF = rectPlatform(gameEngine, startX += 500, 150, 8, 1, true);
    var dumpster = new Platform(game, startX - 100, 455, canvasWidth, 1200, 4700, 175, 118);
    game.addEntity(dumpster);
    
    //spacerSection(game, sectWidth += 250, 415, 4,2);
    game.addEntity(zeroEnemy);
    return startX;
};

boardPieces[1] = function (startX, game) {
    var stairsOne = rightCrateSteps(game, startX, 380, 4);
    var platTwo = rectPlatform(game, startX += 200, 380, 4, 4, true);
    var stairsThree = leftCrateSteps(game, startX += 200, 380, 4);

    return startX;
};

boardPieces[2] = function (startX, game) {
    var levelOne = rectPlatform(game, startX - 425, 150, 8, 1, true);
    var levelTwo = rectPlatform(game, startX += 200, 484, 4, 2, true);
    var levelThree = rectPlatform(game, startX += 50, 209, 4, 1, true);
    return startX;
};

boardPieces[3] = function (startX, game) {
    var sectOne = rightCrateSteps(game, startX+=50, 425, 3);
    var sectTwo = rectPlatform(game, startX += 150, 425, 2, 3, true);
    var sectFour = rectPlatform(game, startX += 300, 350, 4, 1, true);
    var enemyFive = new Enemy(game, startX - 50, 435);
    var sectThree = new Platform(game, startX += 400, 455, canvasWidth, 1200, 4700, 175, 118);
    game.addEntity(sectThree);
    game.addEntity(enemyFive);

    return startX;
};

boardPieces[4] = function (startX, game) {
    
    var sectTwo = rectPlatform(game, startX, 150, 1, 4, false);
    var sectOne = rectPlatform(game, startX, 300, 4, 1, false);
    var sectThree = rectPlatform(game, startX += 350, 425, 4, 1, true);
    var sectFour = rectPlatform(game, startX += 100, 175, 5, 1, true);
    var sectFivea = new Platform(game, startX += 500, 158, canvasWidth, 20, 4505, 248, 422);
    game.addEntity(sectFivea);
    var sectFiveb = rectPlatform(game, startX += 275, 275, 3, 1);
    //var sectFiveb = new Platform(game, startX += 250, 171, canvasWidth, 275, 4518, 187, 409);
    //game.addEntity(sectFiveb);
    var enemySeven = new Enemy(game, startX, 125);
    var sectSix = rectPlatform(game, startX += 150, 275, 8, 1);
    game.addEntity(enemySeven);
    var specialItem = new Item(game, startX + 150, 400, 250, 2600, 4750, 82, 148, 0.8);
    game.addEntity(specialItem);
    var sectEight = rectPlatform(game, startX += 350, 325, 1, 2);
    var enemyNine = new Enemy(game, startX += 50, startingHeight);
    var sectTen = rectPlatform(game, startX += 200, 300, 4, 1);

    game.addEntity(enemyNine);


    return startX;
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
