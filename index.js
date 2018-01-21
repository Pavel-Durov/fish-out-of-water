var audioInput, img;

var bar_width = 20;
var whiteThreshold = 0.009;
var blackThreshold = 0.1;

//RGB colour of black pixels
var black_rgb = [0, 0, 255];
//RGB colour of shite pixels
var white_rgb = [255, 128, 0];


//General object representation of pixels
var Pixels = function (rgba, nextRgba, originalRgba, spread) {
  this.rgba = rgba;
  this.nextRgba = nextRgba;
  this.originalRgba = originalRgba;
  this.spread = spread;
  this.colourFlag = false;
  this.arr = [];
  this.rgba = false;
  this.lastPixelIndex = 0;
  this.isFinished = function () {
    return this.percent == 100;
  };
  this.getNextPixel = function (pixelCollection) {
    var result = undefined;
    if (this.lastPixelIndex < this.arr.length) {
      result = this.arr[this.lastPixelIndex];
      this.lastPixelIndex++;
    }
    return result;
  };
  this.flipColour = function (pixels) {
    this.arr = shuffleArr(this.arr);
    this.lastPixelIndex = 0;
    this.percent = 0;
    this.colourFlag = !this.colourFlag;
    this.rgba  = this.nextRgba;
  };
  this.calculatePixelSpread = function(volume){
    return (volume * 10) * this.spread;
  }
};

var white = new Pixels(black_rgb, white_rgb, black_rgb, 4000);
var black = new Pixels(white_rgb, black_rgb, white_rgb, 2300);

function preload() {
  //Supports only Black & White threshold image 
  //Cause: We sort pixels into two categories: black & white by rough rgb values check (see IsWhitePixel function)
  img = loadImage('https://i.imgur.com/97Q0dNU.jpg');
}

function setup() {
  processImage(img);
  createCanvas(bar_width + img.width, img.height);
  audioInput = new p5.AudioIn();
  audioInput.start();
}

//p5.js function - drawing graphics into our canvas
function draw() {
  var volume = audioInput.getLevel();
  if (volume > blackThreshold) {
    drawPixels(black, volume)
  } else if (volume > whiteThreshold) {
    drawPixels(white, volume)
  }
  drawVolumeBar(volume);
  updateUiCounter();
}

//Identifies whether given rgb array is white by comparing r,g,b values to 255 value
function isWhitePixel(rgbArr) {
  return rgbArr[0] === 255 && rgbArr[1] === 255 && rgbArr[2] === 255;
}

//Iterates on image pixels and sorts them into 2 categories: black/white
function processImage(img) {
  img.loadPixels();
  for (var x = 0; x < img.width; x++) {
    for (var y = 0; y < img.height; y++) {
      var index = (x + y * img.width) * 4;
      var r = img.pixels[index];
      var g = img.pixels[index + 1];
      var b = img.pixels[index + 2];
      var alpha = img.pixels[index + 3];
      var pixel = { x: x, y: y, rgba: [r, g, b, alpha] };

      if (isWhitePixel(pixel.rgba)) {
        white.arr.push(pixel);
      } else {
        black.arr.push(pixel)
      }
    }
  }
  white.arr = shuffleArr(white.arr);
  black.arr = shuffleArr(black.arr);
}

//Updated ui counter: See index.html 'placeholder for: orange: 0.0%, blue: 0.0%' 
function updateUiCounter() {
  black.percent = (black.lastPixelIndex / black.arr.length) * 100;
  white.percent = (white.lastPixelIndex / white.arr.length) * 100;
  var msg = 'Orange: ' + black.percent.toFixed(1) + '% | ' + 'Blue: ' + white.percent.toFixed(1) + '%';
  var counterDiv = document.getElementById('counter');
  counterDiv.innerText = msg;
}

//Draws pixels to canvas
function drawPixels(pixels, volume) {
  noStroke();
  if (pixels.isFinished()) {
    pixels.flipColour();
  } else {
    if (!pixels.colourFlag) {
      pixels.rgba = pixels.originalRgba;
    }
  }
  fill(pixels.rgba[0], pixels.rgba[1], pixels.rgba[2]);

  //Spreading 
  var spreadLimit = pixels.calculatePixelSpread(volume)
  for (var i = 0; i < spreadLimit; i++) {
    var pixel = pixels.getNextPixel();
    if (pixel) {
      ellipse(bar_width + pixel.x, pixel.y, 1, 1);
    }
  }
}

function drawVolumeAmplitude(volume) {
  var y = map(volume, 0, 1, img.height, 0);
  noStroke();
  fill(175);
  rect(0, 0, bar_width, height);
  fill(0);
  rect(0, y, bar_width, y);
}

function drawVolumeThreshold(threshold) {
  stroke(0);
  fill(0, 0, 0);
  var y = map(threshold, 0, 1, img.height, 0);
  line(0, y, 19, y);
}

function drawVolumeBar(volume) {
  drawVolumeAmplitude(volume);
  drawVolumeThreshold(whiteThreshold);
  drawVolumeThreshold(blackThreshold);
}

//Shuffles array (rearranges array elements in random order).
//Returns new arrays.
function shuffleArr(array) {
  var index = array.length, temporaryValue, randomIndex;
  while (0 !== index) {
    randomIndex = Math.floor(Math.random() * index);
    index -= 1;
    temporaryValue = array[index];
    array[index] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}
