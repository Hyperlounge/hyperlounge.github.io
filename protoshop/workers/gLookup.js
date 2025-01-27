
importScripts('minionHeader.js');
var window = self;
importScripts('../lib/jsBezier-0.6.js');

var lookup,
	curve;


self.onmessage = function(event) {
	console.log('minion gLookup executing');

	var i,
		val,
		adjustments = event.data.adjustments,
		useCurve = adjustments.crossProcess;

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

	console.log('minion gLookup finished');
	sendMessage({
		method: 'result',
		content: table.buffer || table
	}, [table.buffer]);
}

function deriveCurve(adjustments) {
	var crossProcess = adjustments.crossProcess ? adjustments.crossProcess.amount : 0;

	var range = 255;

	var x1 = 0;
	var y1 = 0;
	var x4 = range;
	var y4 = range;
	var x2 = range/3;
	var y2 = range/3;
	var x3 = range*2/3;
	var y3 = range*2/3;


	if (crossProcess) {
		//x1 += crossProcess/10;
		//y1 -= crossProcess/10;
		x2 -= crossProcess/12;
		y2 += crossProcess/12;
	}

	var pt1 = {x:x1, y:y1},
		pt2 = {x:x2, y:y2},
		pt3 = {x:x3, y:y3},
		pt4 = {x:x4, y:y4},
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
