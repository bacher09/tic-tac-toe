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
  var field, user_move, end_game, move_count, CELL_COUNT, self;

  self = this;
  CELL_COUNT = 9;

  this.reset = function() {
    field = [0, 0, 0,
             0, 0, 0,
             0, 0, 0];

    user_move = TicTacToeGame.USER_X;
    move_count = 0;
    end_game = false;
  }

  this.getField = function() {
      return field;
  }

  this.move = function(who, x, y, callback, wincallback) {
    if(end_game)
      throw new GameIsEnd("Game compleate");

    if(who != TicTacToeGame.USER_X && who != TicTacToeGame.USER_O)
        throw new ArgumentError("Bad who value");

    if(user_move !== who)
        throw new ArgumentError("Bad Player move");

    if(x < 0 || x > 2)
        throw new ArgumentError("Bad x value");

    if(y < 0 || y > 2)
        throw new ArgumentError("Bad y value");

    if(self.freeCell(x, y))
      field[y*3 + x] = who;
    else
        throw new ArgumentError("This move already done");

    user_move = self.nextUser();
    move_count++;
    if(typeof callback !== "undefined")
        callback(who, x, y);

    this.win(wincallback);
  }

  this.getMoveCount = function() {
    return move_count;
  }

  this.freeCell = function(x, y) {
    return field[y*3 + x] === 0;
  }

  this.getFreeCellCount = function() {
    return CELL_COUNT - self.getMoveCount();
  }

  this.forEachItem = function(callback) {
    for(var i=0; i < 3; i++){
      for(var j=0; j < 3; j++) {
        callback(i, j, field[3*j + i]);
      }
    }
  }

  this.item = function(x, y) {
    return field[y*3 + x];
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

  this.anotherUser = function(who) {
    if(who === TicTacToeGame.USER_X)
      return TicTacToeGame.USER_O;
    else if(who === TicTacToeGame.USER_O)
      return TicTacToeGame.USER_X;
    else
      throw new ArgumentError("Bad who parameter");
  }

  this.nextUser = function() {
    return self.anotherUser(user_move);
  }

  this.curUser = function() {
    return user_move;
  }

  this.reset();
}

// 0 -- empty space, 1 - x, 2 - o
TicTacToeGame.USER_X = 1;
TicTacToeGame.USER_O = 2;


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

  this.drawMove = function(who, x, y) {
    if(who === TicTacToeGame.USER_X)
      self.drawX(x, y);
    else if(who === TicTacToeGame.USER_O)
      self.drawO(x, y);
    else
      throw new ArgumentError("Bad who param");
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
  var tic_obj, obj;
  obj = {};
  tic_obj = new TicTacToeGame();

  obj.start = function() {
    view.clickEnable();
  }

  obj.restart = function() {
    tic_obj.reset();
    view.reinit();
    obj.start();
  }

  obj.clickHandler = function(x, y){
    if(!tic_obj.freeCell(x, y)) return;

    tic_obj.move(tic_obj.curUser(), x, y, function(who, x, y) {
      view.drawMove(who, x, y);
    }, function(wins) {
      view.clickDisable();
      view.drawWinner(wins);
    });
  }

  view.onclick = obj.clickHandler;

  return obj;
}

function ComputerPlayController(view) {
  var obj, user_type, bot_type, tic_obj;
  obj = {};
  tic_obj = new TicTacToeGame();

  obj.start = function() {
    obj.chooseUser();
    if(user_type === TicTacToeGame.USER_O) obj.botMove();
    view.clickEnable();
  }

  obj.restart = function() {
    tic_obj.reset();
    view.reinit();
    obj.start();
  }

  obj.chooseUser = function() {
    user_type = Math.round(Math.random()) + 1;
    bot_type = tic_obj.anotherUser(user_type);
  }

  obj.makeMove = function(who, x, y){
    tic_obj.move(who, x, y, function(who, x, y){
      view.drawMove(who, x, y)
    }, function(wins) {
      view.clickDisable();
      view.drawWinner(wins);
    });
  }

  obj.randFreeItem = function() {
    var free_cells, rand_num, n, cord, i, j;
    free_cells = tic_obj.getFreeCellCount();
    if(free_cells === 0) return;
    free_cells--;
    n = 0;
    rand_num = Math.round(Math.random() * free_cells);
    for(i=0; i < 3; i++){
      for(j=0; j < 3; j++) {
        if(tic_obj.item(i, j) === 0) {
          if(n === rand_num) return {x: i, y: j};
          n++;
        }
      }
    }
  }

  obj.botMove = function(){
    var cord;
    cord = obj.randFreeItem();
    if(cord !== undefined) obj.makeMove(bot_type, cord.x, cord.y);
  }

  obj.clickHandler = function(x, y) {
    if(!tic_obj.freeCell(x, y)) return;
    obj.makeMove(user_type, x, y);
    if(!tic_obj.gameIsEnd()) obj.botMove();
  }

  view.onclick = obj.clickHandler;

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

// base start game
(function() {
  console.log("Add");
  window.addEventListener("load", function() {
    var view, control;
    console.log("Second");
    view = new TicView(document.getElementById("game"));
    control = ComputerPlayController(view);
    document.querySelector("section.game-controls > button").
      addEventListener("click", function() {
        control.restart();
      }, false)
  }, false)
})();
