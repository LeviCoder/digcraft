

/*
  TODO:
  - harvesting of blocks to inventory
  - placing blocks
  - generating ores
  - water flow

*/


function setup() {
createCanvas(600, 600);


var blockSize = 40;
var terrain, p;
var blocks = [];



// compares two objects for overlap
function coll(a, b) {
  return a.x + a.w > b.x &&
         b.x + b.w > a.x &&
         a.y + a.h > b.y &&
         b.y + b.h > a.y;
}
// makes sure a block is within the level
function checkBlock(x, y) {
  return y >= 0 &&
         y <  blocks.length &&
         x >= 0 &&
         x <  blocks[y].length &&
         blocks[y][x];
}
// returns an array of near blocks
function nearBlocks(x, y, s) {

  x -= terrain.minX*blockSize;

  x = ~~(x/blockSize) - s;
  y = ~~(y/blockSize) - s;
  var out = [];

  for(var sy = 0; sy <= s*2; sy++) {
    for(var sx = 0; sx <= s*2; sx++) {
      if(checkBlock(sy + y, sx + x)) {
        out.push(blocks[sx + x][sy + y]);
      }

    }
  }

  return out;

}
function myNoise(x, y) {
  return noise(x + 5000000, y || 0);
}



var cam = {
  x: 0,
  y: 0,

  drag: 0.1,

  update: function() {
    this.x += ((p.x - (width - p.w)*0.5) - this.x)*this.drag;
    this.y += ((constrain(p.y - (height - p.h)*0.5, -Infinity, (terrain.height + terrain.airspace)*blockSize - 600)) - this.y)*this.drag;
  },
};

var water = {
  q: [],
  sides: [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
  ],

  new: function (x, y) {
    this.q.push({x: x, y: y});
  },

  searchNeighbors: function (x, y) {
    var n = [];
    for(var i = 0; i < this.sides.length; i++) {
      if(blocks[this.sides[i][0] + x] && blocks[this.sides[i][0] + x][this.sides[i][1] + y]) {
        n.push([i, blocks[this.sides[i][0] + x][this.sides[i][1] + y].typeName, this.sides[i][0] + x, this.sides[i][1] + y])
      } else {
        n.push([i, false]);
      }
    }
    return n;
  },

  op: function (n) {
    var b = this.searchNeighbors(n.x, n.y);
    console.log(b);

    if(b[6][1] && b[6][1] !== "air" && !b[6][1].includes("water")) {
      if(b[3][1] === "air") {
        blocks[b[3][2]][b[3][3]] = new Block(b[3][2]*blockSize, b[3][3]*blockSize, b[6][1])
      }
      if(b[4][1] === "air") {
        blocks[b[4][2]][b[4][3]] = new Block(b[4][2]*blockSize, b[4][3]*blockSize, b[6][1])
      }
    }
  },


  update: function () {
    if(frameCount % 20 === 0) {
      var n = this.q.length;
      while(n > 1) {
        this.op(this.q[0]);
        this.q.shift();
        n--;
      }
    }
  },


}


var blockTypes = {
  "air": {
    solid: false,
    drops: false,
    color: color(0, 1),
    health: 100,
  },
  "water": {
    solid: false,
    drops: false,
    color: color(138, 191, 210),
    health: 100,
  },
  "water surface": {
    solid: false,
    drops: false,
    color: color(138, 191, 210),

    oy: blockSize*0.2,
    h: blockSize*0.8,
    health: 100,
  },
  "bedrock": {
    solid: true,
    drops: false,
    color: color(74, 60, 42),
    health: 10000000000,
  },

  "dirt": {
    solid: true,
    drops: "dirt",
    color: color(125, 95, 64),
    health: 60,
  },
  "grassy dirt": {
    solid: true,
    drops: "dirt",
    color: color(124, 154, 94),
    health: 60,
  },
  "sand": {
    solid: true,
    drops: "sand",
    color: color(222, 201, 132),
    health: 40,
  },
  "stone": {
    solid: true,
    drops: "stone",
    color: color(132, 128, 115),
    health: 100,
  },
};
var Block = function(x, y, type) {

  this.typeName = type;
  this.type = blockTypes[type];

  this.x = x + (this.type.ox || 0);
  this.y = y + (this.type.oy || 0);

  this.w = this.type.w || blockSize;
  this.h = this.type.h || blockSize;

  this.damaged = false;
  this.health = this.type.health || 100;

  if(type.includes("water")) {
    water.new(x/blockSize, y/blockSize);
  }

};
Block.prototype.destruct = function () {
  console.log(this.typeName + " drops " + this.type.drops);

  var x = this.x/blockSize - terrain.minX, y = this.y/blockSize;
  for(var i = 0; i < water.sides.length; i++) {
    //console.log(blocks[water.sides[i][0] + x]);
    if(blocks[water.sides[i][0] + x] && blocks[water.sides[i][0] + x][water.sides[i][1] + y]) {
      console.log(blocks[water.sides[i][0] + x][water.sides[i][1] + y].typeName);
    }
    if(blocks[water.sides[i][0] + x] && blocks[water.sides[i][0] + x][water.sides[i][1] + y] && blocks[water.sides[i][0] + x][water.sides[i][1] + y].typeName.includes("water")) {
      water.new(water.sides[i][0] + x, water.sides[i][1] + y);
      console.log("water");
    }
  }
};
Block.prototype.draw = function () {
  fill(this.type.color);
  rect(this.x, this.y, this.w, this.h);
  if(!this.damaged) {
    this.health = this.type.health;
  }
  this.damaged = false;
};


terrain = {
  // greatest extremes to either side
  minX: 0,
  maxX: 0,

  airspace: 0,
  height: 50,
  sealevel: 15,

  biomes: "forest desert highlands".split(" "),

  topsoil: {
    "forest": "dirt",
    "desert": "sand",
    "highlands": "dirt",
  },

  biomeR: "forest",
  biomeL: "forest",
  nextBiomeR: "desert",
  nextBiomeL: "highlands",

  bWidthR: random(20, 30),
  bWidthL: random(20, 30),

  transition: 10,
  countR: 0,
  countL: 0,

  elevator: {
    "forest": function(x) {
      return myNoise(x*0.05)*30;
    },
    "desert": function(x) {
      return myNoise(x*0.05)*7 + 10;
    },
    "highlands": function(x) {
      return 0;
    },
  },

  genBlockOld: function(x, y, elev, biome) {
    var b = y > elev ? (biome === "desert" ? "sand" : "dirt") : (y > this.sealevel ? "water" : "air");
    return new Block(x*blockSize, y*blockSize, y === this.height - 1 ? "bedrock" : b);
  },

  isAir: function (x, y, elev) {
    var y2 = 18 + noise(x*0.02) * 40, s = 8 - sq(noise(x*0.07 + 20)*6.4)*0.6;
    return y < elev || y > y2 - s && y < y2 || noise(x *0.04, y*0.18) < 0.40*constrain(min(y*0.044, (50 - y)*0.18), 0, 1);
  },

  genBlockOld2: function(x, y, elev, biome) {

    var b = y < elev ? (y >= this.sealevel ? (y === this.sealevel ? "water surface" : "water") : "air") : "stone";
    if(y === elev && this.topsoil[biome].includes("dirt") && y <= this.sealevel) {
      b = "grassy " + this.topsoil[biome];
    } else if(y >= elev && y < elev + 6) {
      b = this.topsoil[biome];
    }
    var y2 = 8 + noise(x*0.02) * 50, s = noise(20 + x*0.06)*29 - 12;
    if(y < noise(x*0.05)*30 || y > y2 - s && y < y2 + s || noise(x *0.03, y*0.06) < 0.39) {
      b = "air";
    }
    return y === this.height - 1 ? "bedrock" : b;
  },

  genBlockOld3: function(x, y, elev, biome, gr, s, l) {

    var b = y < elev ? (y >= this.sealevel ? (y === this.sealevel ? "water surface" : "water") : "air") : "stone";
    var b = gr ? (s ? "stone" : "air") : (s ? "stone" : y > this.sealevel ? "water" : "air");
    if(b === "stone") {

      if(y === elev && this.topsoil[biome].includes("dirt") && y <= this.sealevel) {
        b = "grassy " + this.topsoil[biome];
      } else if(y >= elev && y < elev + 6) {
        b = this.topsoil[biome];
      }
    }
    return y === this.height - 1 ? "bedrock" : b;
  },

  genBlock: function(x, y, elev, biome, gr, s, l) {

    var b = y <= elev ? (y > this.sealevel && !gr ? "water" : "air") : (s ? "stone" : "air");

    if(b === "stone") {
      if(!gr && this.topsoil[biome].includes("dirt") && y <= this.sealevel) {
        b = "grassy " + this.topsoil[biome];
      } else if(y >= elev && y < elev + 6) {
        b = this.topsoil[biome];
      }
    }

    return y === this.height - 1 ? "bedrock" : b;
  },

  genCol: function(side) {
    var arr = [];
    var x = side < 0 ? this.minX - 1 : this.maxX;
    this.minX = min(x, this.minX);
    this.maxX = max(x + 1, this.maxX);

    var elev = 0, b = "forest";
    if(side < 0) {
      elev = this.elevator[this.biomeL](x);
      elev = this.countL > this.bWidthL ? lerp(
        elev,
        this.elevator[this.nextBiomeL](x),
        constrain((this.countL - this.bWidthL)/this.transition, 0, 1)) : elev;
      this.countL++;

      b = this.countL < this.bWidthL + this.transition*0.5 ? this.biomeL : this.nextBiomeL;
    } else {
      elev = this.elevator[this.biomeR](x);
      elev = this.countR > this.bWidthR ? lerp(
        elev,
        this.elevator[this.nextBiomeR](x),
        constrain((this.countR - this.bWidthR)/this.transition, 0, 1)) : elev;
      this.countR++;
      b = this.countR < this.bWidthR + this.transition*0.5 ? this.biomeR : this.nextBiomeR;
    }

    var count = 5;
    var last = 0;
    var groundReached = false;

    for(var i = 0; i < this.height; i++) {
      var s = !this.isAir(x, i, elev);
      var j = this.genBlock(x, i, ~~elev, b, groundReached, s, last);
      arr.push(new Block(x*blockSize, i*blockSize, j));
      last = s;
      groundReached = groundReached || s;
    }



    if(side < 0) {
      blocks.unshift(arr);
      this.countL++;
      if(this.countL > this.bWidthL + this.transition) {
        this.countL = 0;
        this.bWidthL = random(10, 30);
        this.biomeL = this.nextBiomeL;
        this.nextBiomeL = this.biomes[~~random(this.biomes.length)];
      }
    } else {
      blocks.push(arr);
      this.countR++;
      if(this.countR > this.bWidthR + this.transition) {
        this.countR = 0;
        this.bWidthR = random(10, 30);
        this.biomeR = this.nextBiomeR;
        this.nextBiomeR = this.biomes[~~random(this.biomes.length)];
      }
    }
  },
};
var p = {
  x: 0,
  y: 0,
  w: 30,
  h: 50,

  vx: 0,
  vy: 0,

  onGround: false,
  inWater: false,
  waterTime: 0,
  su: 0,

  jump: -12,
  speed: 1.8,
  drag: 0.8,
  grav: 0.6,


  range: 500,
  damage: 3,

  marchShot: function (x, y, vx, vy, n) {
    if(n < this.range && x > cam.x && y > cam.y && x < cam.x + 600 && y < cam.y + 600) {
      fill(255, 0, 255);
      ellipse(x, y, 2, 2);
      if(y > 0 && x < terrain.maxX*blockSize && x > terrain.minX*blockSize) {
        var b = blocks[~~(x/blockSize) - terrain.minX + (x > 0 ? 0 : -1)][~~(y/blockSize)];
        if(b.typeName !== "air" && !b.typeName.includes("water")) {
          n = this.range;
          b.damaged = true;
          b.health -= this.damage;
          if(b.health <= 0) {
            b.destruct();
            blocks[~~(x/blockSize) - terrain.minX + (x > 0 ? 0 : -1)][~~(y/blockSize)] = new Block(b.x, b.y, "air");
          }
        }
      }
      this.marchShot(x + vx, y + vy, vx, vy, n + 1);
    }
  },
  shoot: function() {
    if(m.press) {
      var x = this.x + this.w*0.5, y = this.y + this.w*0.5;
      var a = 180 + atan2((x - cam.x) - mouseX, (y - cam.y) - mouseY);
      this.marchShot(x + sin(a)*30, y + cos(a)*30, sin(a), cos(a), 0);
    }
  },

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

    this.vy += this.grav;
  },
  swim: function() {
    if((keys.w || keys[38])){
      if(this.waterTime > 10 && this.su % 30 < 20) {
        this.vy -= 1.4;
      }
      this.su++;
    } else if(this.su % 30 === 0){
      this.su = 0;
    }
    if(this.su > 0) {
      this.su++;
    }

    if(keys.a || keys[37]) {
      this.vx -= this.speed;
    }
    if(keys.d || keys[39]) {
      this.vx += this.speed;
    }

    if(keys.s || keys[40]) {
      this.vy += 0.4;
    }

    this.vy += this.grav*0.5;
  },


  collide: function (vx, vy, arr) {

    // saves current x and y. newX and newY get changed instead of the actual coords so every block gets a chance to damage the player
    var newX = this.x;
    var newY = this.y;
    for(var i = 0; i < arr.length; i++) {

      if(coll(this, arr[i])) {
        if(arr[i].type.solid) {


          this.touch = true;

          if(vx < 0) {

            newX = arr[i].x + arr[i].w;
            this.vx = 0;
            this.facing = -1;

          } else if(vx > 0) {
            newX = arr[i].x - this.w;
            this.vx = 0;
            this.facing = 1;
          }
          if(vy < 0) {

            newY = arr[i].y + arr[i].h;
            this.vy = 0;

          } else if(vy > 0) {
            newY = arr[i].y - this.h;
            this.vy = 0;
            this.onGround = true;
          }

        } else if(arr[i].typeName === "water" || arr[i].typeName === "water surface") {
          this.inWater = true;
        }
      }

    }

    this.x = newX;
    this.y = newY;
  },

  draw: function() {
    fill(255);
    rect(this.x, this.y, this.w, this.h);
  },

  update: function () {

    if(this.inWater) {
      this.waterTime++;
      this.vx *= 0.9;
      this.vy *= this.vy > 0 ? 0.7 : 0.87;
      this.swim();
    } else {
      this.waterTime = 0;
      this.su = 0;
      this.move();
    }


    this.vx *= this.drag;
    this.vy = constrain(this.vy, this.jump, -this.jump);

    var arr = nearBlocks(this.x + this.w*0.5, this.y + this.h*0.5, 1);

    this.onGround = false;
    this.inWater = false;

    this.y += this.vy;
    this.collide(0, this.vy, arr);

    this.x += this.vx;
    this.collide(this.vx, 0, arr);



    this.shoot();

    this.draw();
  }
};


draw = function() {

  background(177, 211, 222);

  push();
  cam.update();
  translate(~~-cam.x, ~~-cam.y);

  if(cam.x < terrain.minX*blockSize) {
    terrain.genCol(-1);
  }
  if(cam.x + 600 > terrain.maxX*blockSize) {
    terrain.genCol(1);
  }

  water.update();

  var arr = nearBlocks(cam.x + 300, cam.y + 300, 30);

  noStroke();
  for(var i = 0; i < arr.length; i++) {
    arr[i].draw();
  }

  p.update();

  pop();

  fill(255);
  text(p.su, 30, 40);

  m.click = false;
};


document.getElementsByTagName("canvas")[0].addEventListener('contextmenu', function (e) {
  // do something here...
  e.preventDefault();
}, false);

// end of global setup function
}
