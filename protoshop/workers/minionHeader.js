//var Uint8ClampedArray = Uint8ClampedArray || Uint8Array;
var Uint8ClampedArray = Uint8Array;

function alert(message) {
	sendMessage({
		method: 'alert',
		content: location.href + '\n\n' + message
	});
}

var console = {
	log: function(message) {
		/*
		sendMessage({
			method: 'log',
			content: location.href + ': ' + message
		});
		*/
	}
}

var canUseTransferable = false;
var canUseArrayBuffer = ArrayBuffer !== undefined;
var myPostMessage = self.postMessage;
// use webkitPostMessage if present
if (self.webkitPostMessage) {
	self.postMessage = self.webkitPostMessage;
	canUseTransferable = true;
} else {
	// send a test ArrayBuffer 1 byte long
	try {
		var ab = new ArrayBuffer(1);
		self.postMessage({method: "test", content: ab}, [ab]);
		// if the ArrayBuffer is now empty,
		// transferables are supported
		if (ab.byteLength === 0) {
			canUseTransferable = true;
		}
	} catch(error) {
		canUseTransferable = false;
	}
}

function sendMessage(message, transferable) {
	if (canUseTransferable) {
		self.postMessage(message, transferable);
	} else {
		// fall-back
		self.postMessage(message);
	}
}

function Lookup(range) {
	this.range = range;	// number of input values
	this.table = canUseArrayBuffer ? new Uint8Array(range) : [];
	this.valid = false;
}

function create8BitBuffer(data) {
	if (data instanceof ArrayBuffer) {
		return new Uint8ClampedArray(data);
	} else {
		return data;
	}
}

function copy8BitBuffer(source) {
	if (source.slice) {
		return source.slice(0);
	} else {
		var copy = new Uint8Array(source.length);
		for (var i = source.length - 1; i--; ) {
			copy[i] = source[i];
		}
		return copy;
	}
}