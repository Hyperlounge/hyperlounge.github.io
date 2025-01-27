
importScripts('minionHeader.js');

self.onmessage = function(event) {
	console.log('minion rgbChannel executing');

	var i,
		data = create8BitBuffer(event.data.buffer),
		table = create8BitBuffer(event.data.lookup);

	var length = data.length;
	for (i = length - 1; i--; ) {
		data[i] = table[data[i]];
	}

	console.log('minion rgbChannel finished');
	sendMessage({
		method: 'result',
		content: data.buffer || data
	}, [data.buffer]);
}

