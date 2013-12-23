"use strict";

// exceptions
function ArgumentError(message) {
  this.message = message;
  this.name = "ArgumentError";
}

function GameIsEnd(message) {
  this.message = message;
  this.name = "GameIsEnd";
}

function RoomIsFull(message) {
  this.message = message;
  this.name = "RoomIsFull";
}

// main code
function TicTacToeGame () {
  var field, last_move, end_game, self;
  // 0 -- empty space, 1 - x, 2 - o

  self = this;

  this.reset = function() {
    field = [0, 0, 0,
             0, 0, 0,
             0, 0, 0];

    last_move = 0;
    end_game = false;
  }

  this.getField = function() {
      return field;
  }

  this.move = function(who, x, y, callback, wincallback) {
    if(end_game)
      throw new GameIsEnd("Game compleate");

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

    if(self.freeCell(x, y))
      field[y*3 + x] = who;
    else
        throw new ArgumentError("This move already done");

    last_move = who;
    if(typeof callback !== "undefined")
        callback(who, x, y);

    this.win(wincallback);
  }

  this.freeCell = function(x, y) {
    return field[y*3 + x] === 0;
  }

  function findWins() {
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

  this.win = function(callback) {
    var wins;
    wins = findWins();
    if(wins !== undefined) {
      end_game = true;
      if(typeof callback !== "undefined") callback(wins);
    }
  }

  this.gameIsEnd = function() {
    return end_game;
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

function TicView(dCanvas) {
  var ctx, canvas, w_size, h_size, click_disabled, self;

  self = this;
  click_disabled = true;
  canvas = dCanvas;
  ctx = dCanvas.getContext("2d");
  this.onclick = undefined;

  this.clear = function() {
    canvas.width = canvas.width;
  }

  this.init = function() {
    w_size = canvas.width / 3;
    h_size = canvas.height / 3;

    ctx.beginPath();
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
    ctx.closePath();
  }

  this.reinit = function() {
    this.clear();
    this.init();
  }

  this.drawX = function(x, y) {
    var x1, y1, x2, y2, temp1, temp2;
    temp1 = w_size/12;
    temp2 = h_size/12;
    x1 = w_size * x + temp1;
    y1 = h_size * y + temp2;
    x2 = x1 + w_size - 2*temp1;
    y2 = y1 + h_size - 2*temp2;
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineCap = "round";
    ctx.lineWidth = 8;
    // line first
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    // line second
    ctx.moveTo(x2, y1);
    ctx.lineTo(x1, y2);
    ctx.stroke();
    ctx.closePath();
  }

  this.drawO = function(x, y) {
    var min_size = Math.min(w_size, h_size);
    ctx.beginPath();
    ctx.strokeStyle = "red";
    //ctx.strokeStyle = "#444";
    ctx.lineWidth = 8;
    ctx.arc(w_size * x + w_size/2, h_size * y + h_size/2, min_size/2 - min_size/12, 0, 2*Math.PI);
    ctx.stroke();
    ctx.closePath();
  }

  this.drawWinner = function(wins) {
    var temp;
    ctx.beginPath();
    ctx.strokeStyle = "cyan";
    ctx.lineCap = "round";
    ctx.lineWidth = 5;
    if(wins.type === "horizontal") {
      temp = (wins.base + 0.5) * h_size + 0.5;
      ctx.moveTo(0, temp);
      ctx.lineTo(canvas.width, temp);
    } else if (wins.type === "vertical") {
      temp = (wins.base + 0.5) * w_size + 0.5;
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

    ctx.stroke();
    ctx.closePath();
  }

  this.clickPaused = function() {
    return click_disabled;
  }

  this.clickEnable = function() {
    click_disabled = false;
  }

  this.clickDisable = function() {
    click_disabled = true;
  }

  function onClick(e) {
    var cords, x, y;
    if(self.clickPaused() || (typeof self.onclick === "undefined"))
      return;

    cords = getClickCanvasCords(canvas, e);
    x = Math.floor(cords.x / w_size);
    y = Math.floor(cords.y / h_size);
    self.onclick(x, y);
  }

  dCanvas.addEventListener("click", onClick, false);

  this.init();

}

function SelfPlayController(view) {
  var tic_obj, user_move, obj;
  obj = {};
  tic_obj = new TicTacToeGame();
  user_move = 1;

  obj.start = function() {
    view.clickEnable();
  }

  obj.restart = function() {
    tic_obj.reset();
    user_move = 1;
    view.reinit();
    obj.start();
  }

  view.onclick = function(x, y){
    if(!tic_obj.freeCell(x, y)) return;

    tic_obj.move(user_move, x, y, function(who, x, y) {
      if(who === 1)
        view.drawX(x, y);
      else
        view.drawO(x, y);

      changeUser();
    }, function(wins) {
      view.clickDisable();
      view.drawWinner(wins);
    });
  }

  function changeUser() {
    if(user_move === 1)
      user_move = 2;
    else
      user_move = 1;
  }

  return obj;
}

function RemoteCanvasTicTacToe(room_id, dCanvas) {
  var ws, SERVER_URL, player_type, is_wait, self;

  self = this;
  player_type = 0;
  is_wait = true;
  SERVER_URL = "ws://localhost:8888/socket/";

  function buildUrl(room_id) {
    return SERVER_URL + room_id;
  }

  // create web socket
  ws = new WebSocket(buildUrl(room_id));
  ws.onmessage = function(stream) {
    var msg = JSON.parse(stream.data);
    switch(msg.type) {
      case "full":
        throw new RoomIsFull("Sory this game already started");
        break;
      case "message":
        // get chat message
        break;
      case "newplayer":
        // new player connected
        break;
      case "gamestart":
        self.start(msg.val);
        break;
      case "playerexit":
        self.stop();
        break;
      case "move":
        self.receiveMove(msg.x, msg.y);
        break;
    }
  }
  // inherit CanvasTicTacToe
  CanvasTicTacToe.call(this, dCanvas);

  this.start = function(p) {
    player_type = p;
    if(p === 1) is_wait = false;
  }

  this.otherPlayer = function() {
    switch(player_type) {
      case 1:
        return 2;
      case 2:
        return 1;
      default:
        return 0;
      }
  }

  this.receiveMove = function(x, y) {
    this.move(self.otherPlayer(), x, y, function() {
      is_wait = false;
    });
  }

  this.userMove = function(x, y) {
    this.move(player_type, x, y, function() {
      ws.send(JSON.stringify({type: "move", x: x, y: y}));
      is_wait = true;
    });
  }

  this.stop = function() {
    is_wait = true;
  }

  this.paused = function() {
    return (player_type == 0) || this.gameIsEnd() || is_wait;
  }

  this.click = function(x, y) {
    self.userMove(x, y);
  }
}
