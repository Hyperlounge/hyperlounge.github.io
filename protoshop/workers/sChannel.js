
importScripts('minionHeader.js');
var window = self;
importScripts('../lib/jsBezier-0.6.js');

var lookup,
	curve;

self.onmessage = function(event) {
	console.log('minion sChannel executing');

	var i,
		val,
		data = create8BitBuffer(event.data.buffer),
		adjustments = event.data.adjustments,
		useCurve = adjustments.saturation || adjustments.colourEmphasis;

	if (useCurve) {
		curve = {
			curve: deriveCurve(adjustments),
			lastY: 0,
			lastUp: true
		};
	}

	lookup = new Lookup(256);
	var table = lookup.table;
	for (i = 0; i < 256; i++) {
		val = i;
		if (useCurve) {
			val = getPointOnCurve(curve, val);
		}

		table[i] = Math.max(0, Math.min(255, Math.round(val)));
	}

	for (i = data.length - 1; i--; ) {
		data[i] = lookup.table[data[i]];
	}

	console.log('minion sChannel finished');
	sendMessage({
		method: 'result',
		content: data.buffer || data
	}, [data.buffer]);
}

function deriveCurve(adjustments) {
	var range = 255;

	var x1 = range/3;
	var y1 = range*2/3;
	var x2 = range*2/3;
	var y2 = range/3;

	var colourEmphasis = Math.min(254, adjustments.colourEmphasis ? adjustments.colourEmphasis.value : 0);
	var saturation = adjustments.saturation ? adjustments.saturation.value : 0;

	if (colourEmphasis) {
		x1 += colourEmphasis/3;
		y1 += colourEmphasis/3;
		x2 -= colourEmphasis/3;
		y2 -= colourEmphasis/3;
	}

	if (saturation) {
		x1 -= saturation/1.5;
		y1 -= saturation/1.5;
		x2 -= saturation/1.5;
		y2 -= saturation/1.5;
	}

	var pt1 = {x:0, y:0},
		pt2 = {x:x1, y:range-y1},
		pt3 = {x:x2, y:range-y2},
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

