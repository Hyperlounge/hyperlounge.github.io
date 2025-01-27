
importScripts('minionHeader.js');

self.onmessage = function(event) {
	console.log('minion vignette executing');
	var i,
		val,
		x,
		y,
		gammaCorrection,
		data = create8BitBuffer(event.data.buffer),
		dimensions = event.data.dimensions,
		width = dimensions.width,
		height = dimensions.height,
		distFromCenter,
		adjustments = event.data.adjustments,
		amount = adjustments.vignette.amount,
		radius = Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2)),
		spread = (20 + (255 - adjustments.vignette.spread))/20,
		gamma = (130 + amount)/130;



	for (i = dimensions.pixels - 1; i--; ) {
		val = data[i];
		gammaCorrection = 255 * Math.pow(val/255, 1/gamma) - val;
		y = Math.floor(i / width);
		x = i - (y * width);
		distFromCenter = Math.sqrt(Math.pow(x - width/2 , 2) + Math.pow(y - height/2, 2));
		gammaCorrection *= 3 * Math.pow(distFromCenter/radius, spread);
		data[i] = Math.max(0, val - gammaCorrection);
	}

	console.log('minion vignette finished');
	sendMessage({
		method: 'result',
		content: data.buffer || data
	}, [data.buffer]);
}

