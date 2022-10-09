

// old version





// remember basics.js


function setup() {

createCanvas(600, 600);

var blockSize = 10;

const smelts = {
  "iron ore": ["iron ingot", 1],
  "wood": ["charcoal", 2]
}

var chunks = [];
var chunkDetails = [];

var blockTypes = {
  "air": {
    solid: false,
    drops: false,
    color: rgb(62, 47, 32),
  },
  "dirt": {
    solid: true,
    drops: "dirt",
    color: color(0, 0, 0, 0),
  }
};
// compares two objects for overlap
function coll(a, b) {
  return a.x + a.w > b.x &&
         b.x + b.w > a.x &&
         a.y + a.h > b.y &&
         b.y + b.h > a.y;
};


function checkChunk(x, y, ch) {
  return x >= 0 && y >= 0 && y < ch.length && x < ch[y].length;
}

// returns an array of near blocks
function nearBlocksInChunk(x, y, ch, s) {

  x = ~~((x + chunkDetails[ch].x)/blockSize) - s;
  y = ~~(y/blockSize) - s;
  var out = [];

  s = chunks[ch]

  for(var sy = 0; sy <= s*2; sy++) {
    for(var sx = 0; sx <= s*2; sx++) {
      if(checkChunk(sx + x, sy + y, s)) {
        out.push(s[sy + y][sx + x]);
      }

    }
  }

  return out;

};

// returns an array of near blocks
function nearBlocks(x, y, s) {

  var cx = constrain(round(x/(blockSize*16)) - 1, 0, chunks.length - 1);
  var cy = constrain((y - blockSize*16), 0, chunks.length - 33);

  var out = [];

  for(var i = cx; i < cx + 2 && i < chunks.length; i++) {
    out.concat(nearBlocksInChunk(x, y, i, s))
  }

  return out;

};


var Block = function(x, y, type) {

  this.typeName = type;
  this.type = blockTypes[type];

  this.x = x + (this.type.ox || 0);
  this.y = y + (this.type.oy || 0);

  this.w = this.type.w || blockSize;
  this.h = this.type.h || blockSize;

};
Block.prototype.draw = function () {
  fill(this.type.color);
  rect(this.x, this.y, this.w, this.h)
}

var terrain = {

  // greatest extremes to either side
  minX: 0,
  maxX: 0,

  height: 30,
  sealevel: 10,

  generateBlock: function(x, y, elev) {
    return new Block(x*blockSize, y*blockSize, y < elev ? "dirt" : "air")
  },

  generateChunk: function(end) {
    var a = [];

    var x = end < 0 ? this.minX - 16 : this.maxX;
    this.minX = min(x, this.minX);
    this.maxX = max(x + 16, this.maxX);

    var elev = [];
    for(var i = 0; i < 16; i++) {
      elev.push(noise((x + i)*0.05)*this.height)
    }

    for(var y = 0; y < this.height; y++) {
      a.push([])
      for(var i = 0; i < 16; i++) {
        a[y].push(terrain.generateBlock(x + i, y, elev[i]))
      }
    }

    var b = {
      x: x*blockSize*16,
      processes: [],
    }

    if(end < 0) {
      chunks.unshift(a);
      chunkDetails.unshift(b);
    } else {
      chunks.push(a);
      chunkDetails.push(b);
    }
  },
};
for(var i = 0; i < 3; i++) {
  terrain.generateChunk(1);
}

var p = {
  x: 200,
  y: 0,
  w: 20,
  h: 20,

  onGround: false,
  jump: -12,
  speed: 0.3,
  drag: 0.95,

  move: function() {
    if((keys.w || keys[38]) && this.onGround) {
      this.vy = this.jump;
    }

    if(keys.a || keys[37]) {
      this.vx -= this.speed;
    }
    if(keys.d || keys[39]) {
      this.vx += this.speed;
    }
  },

  collide: function (vx, vy, arr) {

    // saves current x and y. newX and newY get changed instead of the actual coords so every block gets a chance to damage the player
    var newX = this.x;
    var newY = this.y;
    for(var i = 0; i < arr.length; i++) {

      if(coll(this, arr[i])) {
        if(arr[i].solid && arr[i].typeName !== "water") {


          this.touch = true;

          if(vx < 0) {

            newX = arr[i].x + arr[i].w;
            this.setDamage(arr[i].dmg[1]);
            this.vx = 0;
            this.facing = -1;

          } else if(vx > 0) {
            newX = arr[i].x - this.w;
            this.setDamage(arr[i].dmg[2]);
            this.vx = 0;
            this.facing = 1;
          }

          if(vy < 0) {

            newY = arr[i].y + arr[i].h;
            this.vy = 0;
            this.setDamage(arr[i].dmg[3]);

          } else if(vy > 0) {
            newY = arr[i].y - this.h;
            this.vy = 0;
            this.onGround = true;
            this.setDamage(arr[i].dmg[0]);
          }

        } else if(arr[i].typeName === "water") {

        }
      }

    }

    this.x = newX;
    this.y = newY;
  },

  draw: function() {
    fill(255);
    rect(this.x, this.y, this.w, this.h)
  },

  update: function () {

    this.move();

    this.x += this.vx;

    var arr = nearBlocks(this.x, this.y, 3)
    this.collide(this.vx, 0, arr);

    this.y += this.vy;
    this.collide(0, this.vy, arr);

    this.draw();
  }
}

var cam = {
  x: 0,
  y: 0,

  move: function () {

  }
}

function drawChunks() {
  var cx = constrain(~~((mouseX - blockSize*16)/(blockSize*16)), 0, chunks.length - 1);

  var arr = nearBlocks(cam.x, cam.y);
  noStroke();
  /*for(var i = cx; i < cx + 2 && i < chunks.length; i++) {
    for(var y = 0; y < chunks[i].length; y++) {
      for(var x = 0; x < chunks[i][y].length; x++) {
        chunks[i][y][x].draw();
      }
    }
  }*/

  for(var i = 0; i < arr.length; i++) {
    arr[i].draw();
  }
}

draw = function() {

  push();
  translate(-~~cam.x, -~~cam.y);

  background(200, 222, 215);
  drawChunks();

  p.update();

  pop();

  m.click = false;
}


// end of global setup function
}
