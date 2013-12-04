/*
  TERMS OF USE - EASING EQUATIONS
  ---------------------------------------------------------------------------------
  Open source under the BSD License.

  Copyright © 2001 Robert Penner All rights reserved.

  Redistribution and use in source and binary forms, with || without
  modification, are permitted provided that the following conditions are met:

  Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer. Redistributions in binary
  form must reproduce the above copyright notice, this list of conditions and
  the following disclaimer in the documentation and/or other materials provided
  with the distribution. Neither the name of the author nor the names of
  contributors may be used to endorse || promote products derived from this
  software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
  FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
  DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
  SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
  CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
  OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  ---------------------------------------------------------------------------------
*/

// @t is the current time (or position) of the tween. This can be seconds || frames, steps, seconds, ms, whatever – as long as the unit is the same as is used for the total time [3].
// @b is the beginning value of the property.
// @c is the change between the beginning and destination value of the property.
// @d is the total time of the tween.

Plx.Tween = function(target, property, heartbeatBeacon, heartbeatEvent) {
  this.target = target;
  this.property = property;
  this.heartbeatBeacon = heartbeatBeacon;
  this.heartbeatEvent = heartbeatEvent;
  this.beacon = new Plx.Beacon(this);
  this.time = 0;
  this.heartbeatOn = false;
  this.startValue = 0;
  this.endValue = 0;
  this.duration = 0;
};

// utility function to move entity with a physics component
Plx.Tween.move = function(target, changeX, changeY, duration, delay) {
  return Plx.Tween.moveTo(target, target.physicsComponent.rect.loc.x + changeX, target.physicsComponent.rect.loc.y + changeY, duration, delay);
};

Plx.Tween.moveTo = function(target, destX, destY, duration, delay) {
  var tweenX = new Plx.Tween(target.physicsComponent, 'x', target.scene.beacon, 'updated');
  var tweenY = new Plx.Tween(target.physicsComponent, 'y', target.scene.beacon, 'updated');
  if (delay) {
    var timer = new Plx.Timer(delay, 1, 0, target.scene.beacon, 'updated');
    timer.start();
    timer.beacon.observe(this, 'timed', function(event) {
      tweenX.start(target.physicsComponent.rect.loc.x, destX, duration);
      tweenY.start(target.physicsComponent.rect.loc.y, destY, duration);
    });
  }
  else {
    tweenX.start(target.physicsComponent.rect.loc.x, destX, duration);
    tweenY.start(target.physicsComponent.rect.loc.y, destY, duration);
  }
  
  return [tweenX, tweenY];
};

Plx.Tween.prototype.start = function(startValue, endValue, duration) {
  this.startValue = startValue;
  this.endValue = endValue;
  this.duration = duration;
  if (!this.heartbeatOn) {
    this.heartbeatBeacon.observe(this, this.heartbeatEvent, this.onHeartbeat);
    this.heartbeatOn = true;
  }
  
  this.time = 0;
};

Plx.Tween.prototype.onHeartbeat = function(event) {
  if (this.time == 0) {
    if (this.property == 'x')
      this.target.rect.loc.x = this.startValue;
    if (this.property == 'y')
      this.target.rect.loc.y = this.startValue;
    this.time++;
  }
  else if (this.time < this.duration) {
    var changeAmount = Plx.Easing.easeInOutSine(this.time, this.startValue, this.endValue - this.startValue, this.duration) - Plx.Easing.easeInOutSine(this.time - 1, this.startValue, this.endValue - this.startValue, this.duration);
    if (this.property == 'x')
      this.target.speedX = changeAmount;
    if (this.property == 'y')
      this.target.speedY = changeAmount;
    this.time++;
  }
  else {
    if (this.property == 'x') {
      this.target.rect.loc.x = this.endValue;
      this.target.speedX = 0;
    }
    if (this.property == 'y') {
      this.target.rect.loc.y = this.endValue;
      this.target.speedY = 0;
    }
    
    this.beacon.emit('completed', {target:this.target}); //TODO: update this event to completed in assimilate
    this.heartbeatBeacon.ignore(this, this.heartbeatEvent, this.onHeartbeat);
    this.heartbeatOn = false;
  }

  this.target.beacon.emit('updated', null);
};

Plx.Tween.prototype.destroy = function() {

}
  // titleLike = new Sprient 'Squishy_Float_Idle'
  // titleLike.physicsComponent.setX (@game.width - 69) / 2
  // titleLike.physicsComponent.setY @game.height
  // timer = new Timer tweenPause * 1, 1, 0, @beacon, 'updated'
  // timer.start()
  // timer.beacon.observe @, 'timed', (event)=>
  //   tween = new Tween titleLike.physicsComponent, 'y', @beacon, 'updated'
  //   tween.beacon.observe @, 'completed', ->
  //   tween.start titleLike.physicsComponent.rect.loc.y, 155, tweenTime
  // @addEntity titleLike



// only has static functions
Plx.Easing = {};
Plx.Easing.PI_M2 = Math.PI * 2;
Plx.Easing.PI_D2 = Math.PI / 2;

// Linear
Plx.Easing.easeLinear = function(t, b, c, d) {
  return c * t / d + b;
};

// Sine
Plx.Easing.easeInSine = function(t, b, c, d) {
  return -c * Math.cos(t / d * Plx.Easing.PI_D2) + c + b;
};

Plx.Easing.easeOutSine = function(t, b, c, d) {
  return c * Math.sin(t / d * Plx.Easing.PI_D2) + b;
};

Plx.Easing.easeInOutSine = function(t, b, c, d) {
  return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
};

// Quintic
Plx.Easing.easeInQuint = function(t, b, c, d) {
  return c * (t /= d) * t * t * t * t + b;
};

Plx.Easing.easeOutQuint = function(t, b, c, d) {
  return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
};

Plx.Easing.easeInOutQuint = function(t, b, c, d) {
  if ((t /= d / 2) < 1)
    return c / 2 * t * t * t * t * t + b;
  return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
};

// Quartic
Plx.Easing.easeInQuart = function(t, b, c, d) {
  return c * (t /= d) * t * t * t + b;
};

Plx.Easing.easeOutQuart = function(t, b, c, d) {
  return -c * ((t = t / d - 1) * t * t * t - 1) + b;
};

Plx.Easing.easeInOutQuart = function(t, b, c, d) {
  if ((t /= d / 2) < 1)
    return c / 2 * t * t * t * t + b;
  return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
};

// Quadratic
Plx.Easing.easeInQuad = function(t, b, c, d) {
  return c * (t /= d) * t + b;
};

Plx.Easing.easeOutQuad = function(t, b, c, d) {
  return -c * (t /= d) * (t - 2) + b;
};

Plx.Easing.easeInOutQuad = function(t, b, c, d) {
  if ((t /= d / 2) < 1)
    return c / 2 * t * t + b;
  return -c / 2 * ((--t) * (t - 2) - 1) + b;
};

// Exponential
Plx.Easing.easeInExpo = function(t, b, c, d) {
  if (t == 0)
    return b;
  else
    return c * Math.pow(2, 10 * (t / d - 1)) + b;
};

Plx.Easing.easeOutExpo = function(t, b, c, d) {
  if (t == d)
    return b + c;
  else
    return c * (-Math.pow(2, -10 * t / d) + 1) + b;
};

Plx.Easing.easeInOutExpo = function(t, b, c, d) {
  if (t == 0)
    return b;
  if (t == d)
    return b + c;
  if ((t /= d / 2) < 1)
    return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
  return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
};

// Elastic
Plx.Easing.easeInElastic = function(t, b, c, d, a, p) {
  if (t == 0)
    return b;
  if ((t /= d) == 1)
    return b + c;
  if (!p)
    p = d * .3;
  if (!a || a < Math.abs(c)) {
    a = c;
    var s = p / 4;
  }
  else {
    s = p / Plx.Easing.PI_M2 * Math.asin(c / a);
  }
  return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * Plx.Easing.PI_M2 / p)) + b;
};

Plx.Easing.easeOutElastic = function(t, b, c, d, a, p) {
  if (t == 0)
    return b
  if ((t /= d) == 1)
    return b + c;
  if (!p)
    p = d * .3;
  if (!a || a < Math.abs(c)) {
    a = c;
    var s = p / 4;
  }
  else {
    s = p / Plx.Easing.PI_M2 * Math.asin(c / a);
  }
  return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * Plx.Easing.PI_M2 / p ) + c + b;
};

Plx.Easing.easeInOutElastic = function(t, b, c, d, a, p) {
  a = a || null;
  p = p || null;
  if (t == 0)
    return b;
  if ((t /= d / 2) == 2)
    return b + c;
  if (!p)
    p = d * .3 * 1.5;
  if (!a || a < Math.abs(c)) {
    a = c;
    var s = p / 4;
  }
  else {
    s = p / Plx.Easing.PI_M2 * Math.asin(c / a);
  }
  if (t < 1)
    return -.5 * (a * Math.pow(2, 10 * (t -=1 )) * Math.sin((t * d - s) * Plx.Easing.PI_M2 / p )) + b;
  return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * Plx.Easing.PI_M2 / p) * .5 + c + b;
};

// Circular
Plx.Easing.easeInCircular = function(t, b, c, d) {
  return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
};

Plx.Easing.easeOutCircular = function(t, b, c, d) {
  return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
};

Plx.Easing.easeInOutCircular = function(t, b, c, d) {
  if ((t /= d / 2) < 1)
    return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
  return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
};

// Back
Plx.Easing.easeInBack = function(t, b, c, d, s) {
  s = s || 1.70158;
  return c * (t /= d) * t * ((s + 1) * t - s) + b;
};

Plx.Easing.easeOutBack = function(t, b, c, d, s) {
  s = s || 1.70158;
  return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
};

Plx.Easing.easeInOutBack = function(t, b, c, d, s) {
  s = s || 1.70158;
  if ((t /= d / 2) < 1)
    return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
  return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
};

// Bounce
Plx.Easing.easeInBounce = function(t, b, c, d) {
  return c - Plx.Easing.easeOutBounce(d - t, 0, c, d) + b;
};

Plx.Easing.easeOutBounce = function(t, b, c, d) {
  if ((t /= d) < (1 / 2.75))
    return c * (7.5625 * t * t) + b;
  else if (t < (2 / 2.75))
    return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
  else if (t < (2.5 / 2.75))
    return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
  return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
};

Plx.Easing.easeInOutBounce = function(t, b, c, d) {
  if (t < d / 2)
    return Plx.Easing.easeInBounce(t * 2, 0, c, d) * .5 + b;
  return Plx.Easing.easeOutBounce(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
};

// Cubic
Plx.Easing.easeInCubic = function(t, b, c, d) {
  return c * (t /= d) * t * t + b;
};

Plx.Easing.easeOutCubic = function(t, b, c, d) {
  return c * ((t = t / d - 1) * t * t + 1) + b;
};

Plx.Easing.easeInOutCubic = function(t, b, c, d) {
  if ((t /= d / 2) < 1)
    return c / 2 * t * t * t + b;
  return c / 2 * ((t -= 2) * t * t + 2) + b;
};
