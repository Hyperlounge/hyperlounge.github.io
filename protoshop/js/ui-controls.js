/**
 * Created with IntelliJ IDEA.
 * User: derekking
 * Date: 31/07/2013
 * Time: 13:24
 * To change this template use File | Settings | File Templates.
 */
var cj = createjs;
var getRGB = cj.Graphics.getRGB;
var strokeColour = getRGB(150, 150, 150);
var bgColour = getRGB(34, 34, 34, 0.01);
var knobColour = getRGB(200, 200, 0);
var isTouchDevice = !!('ontouchstart' in window) // works on most browsers
		|| !!('onmsgesturechange' in window); // works on ie10

function Histogram(parentElementID, maxBarHeight) {
	var parentElement = $('#' + parentElementID),
		canvasID = parentElementID + '-canvas',
		margins = 12,
		topMargin = 2,
		knobW = 8,
		range = 256,
		trackY = 4,
		width = range + margins * 2,
		height = maxBarHeight + 14,
		knobHeight = 16,
		g,
		_this = this,
		canvas = $('<canvas id="' + canvasID + '" width="' + width + '" height="' + height + '" unselectable="on" onselectstart="return false;" ondragstart="return false;"></canvas>');

	parentElement.append(canvas);
	this.margins = margins;
	this.stage = new cj.Stage(canvasID);
	this.stage.mouseMoveOutside = true;
	this.data = new Uint32Array(256);
	this.blackPoint = 0;
	this.whitePoint = range;

	cj.Touch.enable(this.stage, true);

	var frame = new cj.Shape();
	g = frame.graphics;
	g.s(strokeColour).ss(2,2).drawRect(margins, topMargin, range, maxBarHeight);
	this.stage.addChild(frame);

	this.bars = new cj.Shape();
	this.stage.addChild(this.bars);

	this.blackPointKnob = new cj.Shape();
	g = this.blackPointKnob.graphics;
	g.ss(0).beginFill(bgColour).drawRect(0, 0, margins * 2, knobHeight);
	g.ss(0).beginFill(knobColour).moveTo(margins, trackY).lineTo(margins + knobW / 2, knobHeight).lineTo(margins - knobW / 2, knobHeight).lineTo(margins, trackY).endFill();
	this.blackPointKnob.y = height - knobHeight;
	this.stage.addChild(this.blackPointKnob);

	this.whitePointKnob = this.blackPointKnob.clone(true);
	this.whitePointKnob.x = range;
	this.stage.addChild(this.whitePointKnob);

	this.onChanged = null;
	this.calcVal = function(name, stageX) {
		stageX = Math.round(stageX);
		if (name == 'blackPoint') {
			_this.setBlackPoint(stageX - _this.margins);
		} else {
			_this.setWhitePoint(stageX - _this.margins);
		}
		if (_this.onChanged !== null) {
			_this.onChanged(name, _this[name]);
		}
	};

	this.blackPointKnob.onPress = function(evt) {
		_this.calcVal('blackPoint', evt.stageX);
		evt.onMouseMove = function(evt) {
			_this.calcVal('blackPoint', evt.stageX);
		}
	};

	this.whitePointKnob.onPress = function(evt) {
		_this.calcVal('whitePoint', evt.stageX);
		evt.onMouseMove = function(evt) {
			_this.calcVal('whitePoint', evt.stageX);
		}
	};

	this.setBlackPoint = function(value) {
		this.blackPoint = value;
		this.blackPoint = Math.max(0, Math.min(this.blackPoint, this.whitePoint - 2 * this.margins));
		this.blackPointKnob.x = this.blackPoint;
		this.redraw();
	}

	this.setWhitePoint = function(value) {
		this.whitePoint = value;
		this.whitePoint = Math.max(this.blackPoint + 2 * this.margins, Math.min(this.whitePoint, range));
		this.whitePointKnob.x = this.whitePoint;
		this.redraw();
	}

	this.updateHistogram = function(data, maxValue) {
		var g = this.bars.graphics;
		g.clear().s(strokeColour).ss(1);
		for (var i = 0; i < range; i++) {
			var barHeight = Math.min(maxBarHeight, Math.round(maxBarHeight * data[i] / maxValue));
			g.moveTo(margins + 0.5 + i, topMargin + maxBarHeight);
			g.lineTo(margins + 0.5 + i, topMargin + maxBarHeight - barHeight);
		}
		this.stage.update();
	}

	this.redraw = function() {
		this.stage.update();
	}

	this.redraw();
}

function CanvasSlider(parentElementID, min, max) {
	var parentElement = $('#' + parentElementID),
		canvasID = parentElementID + '-canvas',
		range = max - min,
		margins = 12,
		trackY = 4,
		knobW = 8,
		width = range + margins * 2,
		height = 16,
		g,
		_this = this,
		canvas = $('<canvas id="' + canvasID + '" width="' + width + '" height="' + height + '" unselectable="on" onselectstart="return false;" ondragstart="return false;"></canvas>');

	parentElement.append(canvas);
	this.margins = margins;
	this.min = min;
	this.max = max;
	this.range = range;
	this.stage = new cj.Stage(canvasID);
	this.stage.mouseMoveOutside = true;
	this.value = 0;

	cj.Touch.enable(this.stage, true);

	this.track = new cj.Shape();
	g = this.track.graphics;
	g.ss(0).beginFill(bgColour).drawRect(0, 0, width, height);
	g.s(strokeColour).ss(2,2).moveTo(margins, trackY).lineTo(margins + range, trackY);
	g.s(strokeColour).ss(2,2).moveTo(margins, trackY).lineTo(margins, 0);
	g.s(strokeColour).ss(2,2).moveTo(margins + range, trackY).lineTo(margins + range, 0);
	if (min != 0) {
		g.s(strokeColour).ss(2,2).moveTo(margins - min, trackY).lineTo(margins - min, 0);
	}
	this.stage.addChild(this.track);

	this.knob = new cj.Shape();
	g = this.knob.graphics;
	g.ss(0).beginFill(knobColour).moveTo(margins, trackY).lineTo(margins + knobW / 2, height).lineTo(margins - knobW / 2, height).lineTo(margins, trackY).endFill();
	this.knob.y = 0;
	this.stage.addChild(this.knob);
	this.redraw = function() {
		this.knob.x = this.value - min;
		this.stage.update();
	};
	this.calcVal = function(stageX) {
		stageX = Math.round(stageX);
		this.value = Math.min(this.range, Math.max(0, stageX - this.margins)) + this.min;
		this.redraw();
		if (this.onChanged !== null) {
			this.onChanged(this.value);
		}
	};
	this.onChanged = null;

	this.track.onPress = function(evt) {
		_this.calcVal(evt.stageX);
		evt.onMouseMove = evt.onMouseUp = function(evt) {
			_this.calcVal(evt.stageX);
		}
	};

	this.setValue = function(value) {
		this.value = Math.min(Math.max(this.min, value), this.max);
		this.redraw();
	};
	this.redraw();
}
