"use strict";

function ArgumentError (message) {
  this.message = message;
  this.name = "ArgumentError";
}

function TicTacToeGame () {
  var field, last_move;
  // 0 -- empty space, 1 - x, 2 - o

  this.reset = function() {
    field = [0, 0, 0,
             0, 0, 0,
             0, 0, 0];

    last_move = 0;
  }

  this.getField = function() {
      return field;
  }

  this.move = function(who, x, y, callback) {
    if(who != 1 && who != 2)
        throw new ArgumentError("Bad who value");

    if(last_move == who)
        throw new ArgumentError("Player has already made the move");

    if(last_move === 0 && who === 2)
        throw new ArgumentError("First move should by done by x");

    if(x < 0 || x > 2)
        throw new ArgumentError("Bad x value");

    if(y < 0 || y > 2)
        throw new ArgumentError("Bad y value");

    if(field[y*3 + x] === 0)
      field[y*3 + x] = who;
    else
        throw new ArgumentError("This move already done");

    last_move = who;
    if(typeof callback !== "undefined")
        callback(who, x, y);
  }

  this.win = function() {
    var i, j, first, t;
    // vertical check
    for(i=0; i<3; i++) {
      t = true;
      first = field[i]; // (i, 0)
      if(first === 0) continue;
      for(j=1; j<3; j++) {
        if(field[i+j*3] !== first) {
          t = false;
          break;
        }
      }
      if(t) return {winner: first, type:"vertical", base: i, startCord: [i, 0], endCord: [i, j]}; 
    }

    // horizontal check
    for(j=0; j<3; j++) {
      t = true;
      first = field[3*j]; // (0, j)
      if(first === 0) continue;
      for(i=1; i<3; i++) {
        if(field[i+j*3] !== first) {
          t = false;
          break;
        }
      }
      if(t) return {winner: first, type: "horizontal", base: j, startCord: [0, j], endCord: [i, j]};
    }

    // diagonal check
    if(field[1+3] !== 0) {
      // main diagonal
      if((field[0] === field[1+3]) && (field[0] === field[2+2*3]))
        return {winner: field[0], type: "diagonal", base: 0, startCord: [0, 0], endCord: [2, 2]};
      // another diagonal
      if((field[2] === field[1+3]) && (field[2] === field[0+2*3]))
        return {winner: field[2], type: "diagonal", base: 1, startCord: [2, 0], endCord: [0, 2]};
    }
  }

  this.reset();
}

function getClickCanvasCords(canvas, e) {
  var x, y;
  if (e.pageX || e.pageY) { 
    x = e.pageX;
    y = e.pageY;
  } else { 
    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
  } 
  x -= canvas.offsetLeft;
  y -= canvas.offsetTop;
  return {x: x, y: y};
}

function CanvasTicTacToe(dCanvas) {
  var ctx, canvas, w_size, h_size, tic_obj, self;
  self = this;
  var user_move;

  user_move = 1;
  
  canvas = dCanvas;
  ctx = dCanvas.getContext("2d");
  tic_obj = new TicTacToeGame();

  this.init = function() {
    this.reset();

    w_size = canvas.width / 3;
    h_size = canvas.height / 3;

    // 2 vertical lines
    ctx.moveTo(w_size + 0.5, 0)
    ctx.lineTo(w_size + 0.5, canvas.height)

    ctx.moveTo(2 * w_size + 0.5, 0.5)
    ctx.lineTo(2 * w_size + 0.5, canvas.height)

    // 2 horizontal lines
    ctx.moveTo(0, h_size + 0.5)
    ctx.lineTo(canvas.width, h_size + 0.5)

    ctx.moveTo(0, 2*h_size + 0.5)
    ctx.lineTo(canvas.width, 2*h_size + 0.5)

    ctx.stroke();
  }

  this.drawX = function(x, y) {
    var x1, y1, x2, y2;
    x1 = w_size * x;
    y1 = h_size * y;
    x2 = x1 + w_size;
    y2 = y1 + h_size;
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    // line first
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    // line second
    ctx.moveTo(x2, y1);
    ctx.lineTo(x1, y2);
    ctx.closePath();
    ctx.stroke();
  }

  this.drawO = function(x, y) {
    var min_size = Math.min(w_size, h_size);
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.arc(w_size * x + w_size/2, h_size * y + h_size/2, min_size/2 - min_size/10, 0, 2*Math.PI);
    ctx.closePath();
    ctx.stroke();
  }

  this.move = function(who, x, y) {
    try {
      tic_obj.move(who, x, y, function(who, x, y) {
        if(who === 1)
          self.drawX(x, y);
        else
          self.drawO(x, y);

        self.win();
      });
    } catch(e) {
      if(e.name !== "ArgumentError")
        throw e;
    }
  }

  this.win = function() {
    var wins, temp;
    wins = tic_obj.win();
    if(wins !== undefined) {
      ctx.beginPath();
      ctx.strokeStyle = "cyan";
      ctx.lineCap = "round";
      ctx.lineWidth = 5;
      if(wins.type === "horizontal") {
        temp = (wins.base + 0.5) * h_size + 0.5;
        ctx.moveTo(0, temp);
        ctx.lineTo(canvas.width, temp);
      } else if (wins.type === "vertical") {
        temp = (wins.base * 0.5) * w_size + 0.5;
        ctx.moveTo(temp, 0);
        ctx.lineTo(temp, canvas.height);
      } else {
        if(wins.base === 0) {
          ctx.moveTo(0, 0);
          ctx.lineTo(canvas.width, canvas.height);
        } else {
          ctx.moveTo(canvas.width, 0);
          ctx.lineTo(0, canvas.height);
        }
      }

      ctx.closePath();
      ctx.stroke();
    }
  }

  this.reset = function () {
    // reset canvas
    canvas.width = canvas.width;
    tic_obj.reset();
  }

  this.init();

  function click(x, y) {
    self.move(user_move, x, y);
    if(user_move === 1)
      user_move = 2;
    else
      user_move = 1;
  }

  function ticOnClick(e) {
    var cords, x, y;
    cords = getClickCanvasCords(canvas, e);
    x = Math.floor(cords.x / w_size);
    y = Math.floor(cords.y / h_size);
    click(x, y);
  }

  dCanvas.addEventListener("click", ticOnClick, false);
}
