Plx.PointerInput = function() {
  Plx.System.call(this);
  this.componentTypes = [Plx.Pointerable];
  this.pointerComponents = [];
  this.componentsInDrag = {};
  
  // this.pointers is mouse and touch data combined
  this.pointers = {};

  // controls
  var _this = this;
  this.mouseDownFunc = function(event){_this.onMouseDown(event)};
  this.mouseUpFunc = function(event){_this.onMouseUp(event)};
  this.mouseMoveFunc = function(event){_this.onMouseMove(event)};
  
  this.touchStartFunc = function(event){_this.onTouchStart(event)};
  this.touchEndFunc = function(event){_this.onTouchEnd(event)};
  this.touchMoveFunc = function(event){_this.onTouchMove(event)};
  this.touchCancelFunc = function(event){_this.onTouchCancel(event)};
  this.touchLeaveFunc = function(event){_this.onTouchLeave(event)};
  // mouse events
  document.getElementById("canvas").addEventListener("mousedown", this.mouseDownFunc, false);
  document.getElementById("canvas").addEventListener("mouseup", this.mouseUpFunc, false);
  document.getElementById("canvas").addEventListener("mousemove", this.mouseMoveFunc, false);
  // touch events
  document.getElementById("canvas").addEventListener("touchstart", this.touchStartFunc, false);
  document.getElementById("canvas").addEventListener("touchend", this.touchEndFunc, false);
  document.getElementById("canvas").addEventListener("touchmove", this.touchMoveFunc, false);
  document.getElementById("canvas").addEventListener("touchcancel", this.touchCancelFunc, false);
  document.getElementById("canvas").addEventListener("touchleave", this.touchLeaveFunc, false);
};

Plx.PointerInput.prototype = Object.create(Plx.System.prototype);
Plx.PointerInput.prototype.constructor = Plx.PointerInput;

Plx.PointerInput.prototype.update = function() {
  
};

Plx.PointerInput.prototype.addComponent = function(component) {
  this.pointerComponents.push(component);
};

Plx.PointerInput.prototype.removeComponent = function(component) {
  var index = this.pointerComponents.indexOf(component);
  if (index >= 0) {
    this.pointerComponents.splice(index, 1);
    if (this.componentsInDrag[component.id])
      delete this.componentsInDrag[component.id];
  }
};

// TODO: if we scale the game we probably need to scale these inputs too (in the opposite direction though)
Plx.PointerInput.prototype.onMouseDown = function(event) {
  this.mouseDown = true;
  var rect = document.getElementById("canvas").getBoundingClientRect();
  this.pointerStart("mouse", event.layerX - rect.left, event.layerY - rect.top);
};

Plx.PointerInput.prototype.onMouseUp = function(event) {
  this.mouseDown = false;
  this.pointerEnd("mouse");
};

Plx.PointerInput.prototype.onMouseMove = function(event) {
  if (this.mouseDown) {
    var rect = document.getElementById("canvas").getBoundingClientRect();
    this.pointerMove("mouse", event.clientX - rect.left, event.clientY - rect.top);
  }
};

// NOTE: layerX,Y is relative to the element, clientX,Y is relative to the document make these compatible (they just so hapen to be the same in thie case)
Plx.PointerInput.prototype.onTouchStart = function(event) {
  event.preventDefault(); // This is a hack so that Android dispatches the touchend event (I guess it also disables native scrolling) I guess this also prevents the mouse event from being sent
  for (var i = 0; i < event.changedTouches.length; i ++) {
    var touch = event.changedTouches[i];
    var rect = document.getElementById("canvas").getBoundingClientRect();
    this.pointerStart(touch.identifier, touch.clientX - rect.left, touch.clientY - rect.top);
  }
};

Plx.PointerInput.prototype.onTouchEnd = function(event) {
  event.preventDefault();
  for (var i = 0; i < event.changedTouches.length; i ++) {
    var touch = event.changedTouches[i];
    this.pointerEnd(touch.identifier);
  }
};

Plx.PointerInput.prototype.onTouchCancel = function(event) {
  this.onTouchEnd(event);
};

Plx.PointerInput.prototype.onTouchLeave = function(event) {
  this.onTouchEnd(event);
};

Plx.PointerInput.prototype.onTouchMove = function(event) {
  event.preventDefault();
  for (var i = 0; i < event.changedTouches.length; i ++) {
    var touch = event.changedTouches[i];
    var rect = document.getElementById("canvas").getBoundingClientRect();
    this.pointerMove(touch.identifier, touch.clientX - rect.left, touch.clientY - rect.top);
  }
};

Plx.PointerInput.prototype.pointerStart = function(id, x, y) {
  // scale x, y
  x = x / this.scene.game.displayRatio;
  y = y / this.scene.game.displayRatio;

  var pointer = this.pointers[id] = {x: x, y: y, target: null};
  for (var i = 0; i < this.pointerComponents.length; i ++) {
    var pointerComponent = this.pointerComponents[i];
    if (!pointerComponent.enabled)
      continue;
    if (pointerComponent.collisionCheck(pointer.x, pointer.y)) {
      pointerComponent.beacon.emit("tapped", null);
      pointerComponent.beacon.emit("entered", null);
      pointer.target = pointerComponent;
      if (pointerComponent.draggable && !this.componentsInDrag[pointerComponent.id]) {
        this.componentsInDrag[pointerComponent.id] = {xOffset: x - pointer.target.physics.x, yOffset: y - pointer.target.physics.y};
        pointerComponent.beacon.emit("dragStarted", null);
      }
      break;
    }
  }
};

Plx.PointerInput.prototype.pointerEnd = function(id) {
  var pointer = this.pointers[id];
  if (!pointer)
    return;
  if (pointer.target) {
    pointer.target.beacon.emit("lifted", null);
    pointer.target.beacon.emit("exited", null);
    if (this.componentsInDrag[pointer.target.id]) {
      pointer.target.beacon.emit("dragEnded", null);
      delete this.componentsInDrag[pointer.target.id];
    }
  }
  delete this.pointers[id];
};

Plx.PointerInput.prototype.pointerMove = function(id, x, y) {
  // scale x, y
  x = x / this.scene.game.displayRatio;
  y = y / this.scene.game.displayRatio;

  var pointer = this.pointers[id];
  if (!pointer) {
    pointer = this.pointers[id] = {x: x, y: y, target: null};
  }
  pointer.x = x;
  pointer.y = y;
  if (pointer.target) {
    if (this.componentsInDrag[pointer.target.id]) {
      var xOffset = this.componentsInDrag[pointer.target.id].xOffset;
      var yOffset = this.componentsInDrag[pointer.target.id].yOffset;
      pointer.target.syncLocation(x, y, xOffset, yOffset);
    }
    else {
      if (pointer.target.collisionCheck(pointer.x, pointer.y)) {
      }
      else {
        pointer.target.beacon.emit("exited", null);
        pointer.target = null;
      }
    }
  }
  else {
    for (var i = 0; i < this.pointerComponents.length; i ++) {
      var pointerComponent = this.pointerComponents[i];
      if (!pointerComponent.enabled)
        continue;
      if (pointerComponent.collisionCheck(pointer.x, pointer.y)) {
        pointerComponent.beacon.emit("entered", null);
        pointer.target = pointerComponent;
        break;
      }
    }
  }
};

Plx.PointerInput.prototype.destroy = function() {
  document.getElementById("canvas").removeEventListener("mousedown", this.mouseDownFunc, false);
  document.getElementById("canvas").removeEventListener("mouseup", this.mouseUpFunc, false);
  document.getElementById("canvas").removeEventListener("mousemove", this.mouseMoveFunc, false);

  document.getElementById("canvas").removeEventListener("touchstart", this.touchStartFunc, false);
  document.getElementById("canvas").removeEventListener("touchend", this.touchEndFunc, false);
  document.getElementById("canvas").removeEventListener("touchmove", this.touchMoveFunc, false);
  document.getElementById("canvas").removeEventListener("touchcancel", this.touchCancelFunc, false);
  document.getElementById("canvas").removeEventListener("touchleave", this.touchLeaveFunc, false);
};
