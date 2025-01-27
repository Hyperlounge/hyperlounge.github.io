
importScripts('minionHeader.js');
var window = self;
importScripts('../lib/jsBezier-0.6.js');

var lookup,
	curve;

self.onmessage = function(event) {
	console.log('minion vChannel executing');

	var i,
		val,
		data = create8BitBuffer(event.data.buffer),
		adjustments = event.data.adjustments,
		useCurve = adjustments.brightness || adjustments.contrast || adjustments.highlights || adjustments.shadows || adjustments.crossProcess,
		useRange = adjustments.range;

	if (useCurve) {
		curve = {
			curve: deriveCurve(adjustments),
			lastY: 0,
			lastUp: true
		};
	}

	lookup = new Lookup(256);
	var table = lookup.table,
		spread,
		blackPoint;

	if (useRange) {
		spread = adjustments.range.whitePoint - adjustments.range.blackPoint;
		blackPoint = adjustments.range.blackPoint;
	}
	for (i = 0; i < 256; i++) {
		val = i;
		if (useRange) {
			val = val * 255/spread - blackPoint;
		}
		if (useCurve) {
			val = getPointOnCurve(curve, val);
		}

		table[i] = Math.max(0, Math.min(255, Math.round(val)));
	}

	for (i = data.length - 1; i--; ) {
		data[i] = lookup.table[data[i]];
	}

	console.log('minion vChannel finished');
	sendMessage({
		method: 'result',
		content: data.buffer || data
	}, [data.buffer]);
}

function deriveCurve(adjustments) {
	var range = 255;

	var x1 = range/3;
	var y1 = range/3;
	var x2 = range*2/3;
	var y2 = range*2/3;

	var contrast = adjustments.contrast ? adjustments.contrast.value : 0;
	var brightness = adjustments.brightness ? adjustments.brightness.value : 0;
	var highlights = Math.min(254, adjustments.highlights ? adjustments.highlights.value : 0);
	var shadows = adjustments.shadows ? adjustments.shadows.value : 0;
	var crossProcess = adjustments.crossProcess ? adjustments.crossProcess.amount : 0;

	contrast = Math.min(127, contrast + crossProcess / 6);

	if (contrast) {
		x1 += contrast/1.5;
		y1 -= contrast/1.5;
		x2 -= contrast/1.5;
		y2 += contrast/1.5;
	}

	if (brightness) {
		x1 -= brightness/1.5;
		y1 += brightness/1.5;
		x2 -= brightness/1.5;
		y2 += brightness/1.5;
	}

	if (highlights) {
		x2 += highlights/3;
		x1 -= highlights/20;
		y1 += highlights/20;
		x1 += highlights/6;
		y1 += highlights/6;
	}

	if (shadows) {
		x1 -= shadows/3;
		x2 += shadows/20;
		y2 -= shadows/20;
		x2 -= shadows/6;
		y2 -= shadows/6;
	}

	var pt1 = {x:0, y:0},
		pt2 = {x:x1, y:y1},
		pt3 = {x:x2, y:y2},
		pt4 = {x:range, y:range},
		curve = [pt1, pt2, pt3, pt4];

	return curve;
}


function getPointOnCurve(curveObject, val) {
	var dist,
		minDist = {distance:Number.POSITIVE_INFINITY},
		nearestPoint = null,
		testPoint,
		y,
		up = curveObject.lastUp,
		curve = curveObject.curve,
		height = 255;

	for (y = curveObject.lastY; up ? y <= height + 1 : y > -1; up ? y++ : y--) {
		testPoint = {x:val, y:y};
		dist = jsBezier.distanceFromCurve(testPoint, curve)
		if ( dist.distance < minDist.distance) {
			nearestPoint = testPoint;
			minDist = dist;
		} else {
			if (nearestPoint == null) {
				up = !up;
			} else {
				y = nearestPoint.y;
				val = y;
				curveObject.lastY = y;
				curveObject.lastUp = jsBezier.gradientAtPoint(curve, minDist.location) > 0;
				break;
			}
		}
	}
	return val;
}

