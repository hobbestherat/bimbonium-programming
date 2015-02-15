var _pos = [0, 0];
var _oldPos = [0, 0];
var _direction = 0.0;
var canvas;
var overlay;
var context
var _penDown = true;
var _color = "black";
var _w, _h;
var _commands;
var _animationStepNumber;
var _startTime;
var _totalTime = 0;
var _animation = true;
var _turnDelay = 10;
var _stepDelay = 10;

function hasStoredData(id) {
	if (!document.getElementById(id)) {
		return false;
	}
	return (document.getElementById(id).innerHTML.trim() != "");
}

function getStoredData(id) {
	if (!document.getElementById(id)) {
		return "";
	}
	return decodeURI(document.getElementById(id).innerHTML);
}

function setStoredData(id, data) {
	if (!document.getElementById(id)) {
		// create the data element
		var dataStore = document.getElementById("dataStore")
		if (dataStore) {
			var dataDiv = document.createElement("div");
			dataDiv.id = id;
			dataStore.appendChild(dataDiv);
		}
	}
	document.getElementById(id).innerHTML = encodeURI(data);
}

function animationStep(timestamp) {
  if (!_startTime) {
  	_startTime = timestamp;
  }
	if (_animationStepNumber >= _commands.length) {
		 drawRobotAtCurrentPos();  
		return;
	}
  var progress = timestamp - _startTime;

  var step = _commands[_animationStepNumber];
  while (step.progressEnd < progress) {
  	finalizeStep(step);
    _animationStepNumber++;
    if (_animationStepNumber < _commands.length) {
    	step = _commands[_animationStepNumber];
    } else {
      drawRobotAtCurrentPos();  
    	return;
    }
  }

  // now we are in the current animation step.
  overlayContext.clearRect(0, 0, _w, _h);

  var stepProgress = 1.0;
  var duration = (step.progressEnd - step.progressStart);
  if (duration > 0) {
  	stepProgress = (progress - step.progressStart) / duration;
  }
  if (step.op == "rotate") {
  	var a = step.start_direction + (step.end_direction - step.start_direction) * stepProgress;
  	drawRobot(step.from, a);
  } 
  if (step.op == "step") {
  	var p = [step.from[0] + (step.to[0] - step.from[0]) * stepProgress,
  	     step.from[1] + (step.to[1] - step.from[1]) * stepProgress];
  	if (step.down) {
	  	overlayContext.beginPath();
	  	overlayContext.strokeStyle = step.color;
			overlayContext.moveTo(_w / 2 + step.from[0], _h / 2 - step.from[1]);
			overlayContext.lineTo(_w / 2 + p[0], _h / 2 - p[1]);
			overlayContext.stroke();
		}
  	drawRobot(p, step.start_direction);	
  }
  if (step.op == "wait") {
  	drawRobot(step.from, step.start_direction);	
  }

	if (_animationStepNumber < _commands.length) {
		window.requestAnimationFrame(animationStep);
  } else {
  	drawRobotAtCurrentPos();  
  }
}

function startAnimation() {
	window.requestAnimationFrame(animationStep);
}

function finalizeStep(step) {
	if (step.op == "step") {
		if (step.down) {
	 		context.beginPath();
	 		context.strokeStyle = step.color;
			context.moveTo(_w / 2 + step.from[0], _h / 2 - step.from[1]);
			context.lineTo(_w / 2 + step.to[0], _h / 2 - step.to[1]);
			context.stroke();
	  }
	}
}

// stepDelay ms/step of stepsize, turnDelay ms/degree 
function init(aCanvas, aOverlay, animation, stepDelay, turnDelay) {
	if (typeof animation !== 'undefined') {
		_animation = animation;
	} else {
		_animation = true;
	}
	_stepDelay = stepDelay || 10;
	_turnDelay = turnDelay || 10;

	canvas = aCanvas;
	overlay = aOverlay;
	_pos = [0, 0];
	_oldPos = [0, 0];
	_direction = 0.0;
	_commands = new Array();
	_animationStepNumber = 0;
	_startTime = null;
	_totalTime = 0.0;
	_penDown = true;

  _w = canvas.clientWidth;
  _h = canvas.clientHeight;
	context = canvas.getContext('2d');
	context.clearRect(0, 0, _w, _h);
	overlayContext = overlay.getContext('2d');

	// now we are in the current animation step.
  drawRobotAtCurrentPos();  
}

function drawRobotAtCurrentPos() {
	overlayContext.clearRect(0, 0, _w, _h);
  drawRobot(_pos, _direction); 
}

function registerAnimationStep(data, duration) {
	data.progressStart = _totalTime;
	data.progressEnd = _totalTime + duration;
	_totalTime += duration;
	_commands.push(data);	
}

function drawRobot(p, dir) {
  overlayContext.beginPath();
  overlayContext.arc(_w / 2 + p[0], _h / 2 - p[1], 10, 0, 2 * Math.PI, false);
  overlayContext.fillStyle = '#880000';
  overlayContext.fill();
 
  overlayContext.beginPath();
  overlayContext.fillStyle = "#00FF00";
  overlayContext.arc(_w / 2 + p[0] + Math.cos(dir) * 5 + Math.cos(dir + Math.PI / 2) * 5, 
  	  _h / 2 - p[1] - Math.sin(dir) * 5 - Math.sin(dir + Math.PI / 2) * 5, 2, 0, 2 * Math.PI, false);
    overlayContext.arc(_w / 2 + p[0] + Math.cos(dir) * 5 + Math.cos(dir - Math.PI / 2) * 5, 
  	  _h / 2 - p[1] - Math.sin(dir) * 5 - Math.sin(dir - Math.PI / 2) * 5, 2, 0, 2 * Math.PI, false);
   overlayContext.fill();
}

// commands that can be used in the bimbo-script
function step(number) {
	var STEP_SIZE = 30;
	number = number || 1;
	var from = [_pos[0], _pos[1]];
	_pos[0] += Math.cos(_direction) * number * STEP_SIZE;
	_pos[1] += Math.sin(_direction) * number * STEP_SIZE;
	var to = [_pos[0], _pos[1]];
	var thisStep = {op : "step", dist : number, from : from, to : to, down : _penDown, 
		  color : _color,
		  start_direction : _direction, end_direction : _direction};
	if (_animation) {
		registerAnimationStep(thisStep, Math.abs(_stepDelay * number * STEP_SIZE));
	} else {
		finalizeStep(thisStep);
	}
}

function left(degrees) {
	degrees = degrees || 90.0;
	var from = [_pos[0], _pos[1]];
	var thisStep = {op : "rotate", from : from, to : from, start_direction : _direction, 
		  end_direction : _direction + degrees / 180 * Math.PI, angle : degrees};
  if (_animation) {
	  registerAnimationStep(thisStep, Math.abs(_turnDelay * degrees));
  } else {
		finalizeStep(thisStep);
	}
	_direction += degrees / 180 * Math.PI;
}

function right(degrees) {
	degrees = degrees || 90.0;
	left(-degrees);
}

function up() {
	_penDown = false;
}

function down() {
	_penDown = true;
}

function wait(ms) {
	var p = [_pos[0], _pos[1]];
	var thisStep = {op : "wait", from : p, to : p, start_direction : _direction, 
		  end_direction : _direction};
	registerAnimationStep(thisStep, ms);
}

function color(col) {
	_color = col;
}

schritt = step;
Schritt = step;
SCHRITT = step;
Step = step;
STEP = step;
links = left;
Links = left;
LINKS = left;
Left = left;
LEFT = left;
rechts = right;
Rechts = right;
RECHTS = right;
Right = right;
RIGHT = right;

