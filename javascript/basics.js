var keys = {};
keyPressed = function() {
  keys[keyCode] = true;
  keys[key] = true;
  console.log(keyCode)
};
keyReleased = function() {
  delete keys[keyCode];
  delete keys[key];
};

function mouseIn(x, y, w, h) {
  return mouseX > x && mouseY > y && mouseX < x + w && mouseY < y + h;
};

var m = {
  x: 0,
  y: 0,

  press: false,
  click: false,

  within: function(x, y, w, h) {
    return this.x > x && this.y > y && this.x < x + w && this.y < y + h;
  }
};
mousePressed = function() {
  m.press = true;
};
mouseReleased = function() {
  m.press = false;
  m.click = true;
};

var rgb;

preload = function() {
  createCanvas(600, 600);
  angleMode("degrees");
  frameRate(60)

  rgb = function(r, g, b) {
    return color(r, g, b)
  }
}
