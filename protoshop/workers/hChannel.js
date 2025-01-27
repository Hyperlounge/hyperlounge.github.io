
importScripts('minionHeader.js');

self.onmessage = function(event) {
	console.log('minion hChannel executing');

	var i,
		val,
		data = create8BitBuffer(event.data.buffer),
		adjustments = event.data.adjustments,
		hue = adjustments.hue ? adjustments.hue.value : 0;

	if (hue) {
		for (i = data.length - 1; i--; ) {
			val = data[i];
			val += hue;
			if (val < 0) val += 255;
			if (val > 255) val -= 255;
			data[i] = val;
		}
	}

	console.log('minion hChannel finished');
	sendMessage({
		method: 'result',
		content: data.buffer || data
	}, [data.buffer]);
}

