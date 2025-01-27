
var Uint8ClampedArray = Uint8ClampedArray || Uint8Array;
var workerProxies = {};


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

function CodeError(message) {
	this.message = message;
	this.name = "CodeError";
}

function Cache8Bit(totPixels) {
	this.data = canUseArrayBuffer ? new Uint8ClampedArray(totPixels) : [];
	this.valid = false;
}

function Lookup(range) {
	this.range = range;	// number of input values
	this.table = canUseArrayBuffer ? new Uint8Array(range) : [];
	this.valid = false;
}

function Minion(id, path) {
	var _this = this;
	this.id = id;

	if (self.Worker != undefined) {
		this.worker = new Worker(path);
		this.worker.postMessage = this.worker.webkitPostMessage || this.worker.postMessage;
		this.sendMessage = function(message, transferable, callBack) {
			console.log('sending to minion ' + path);
			this.callBack = callBack;
			if (canUseTransferable) {
				this.worker.postMessage(message, transferable);
			} else {
				this.worker.postMessage(message);
			}
		};
		this.worker.onmessage = function(event) {
			switch(event.data.method) {
				case 'test':
					break;
				case 'alert':
				case 'log':
					sendMessage(event.data);
					break;
				default:
					_this.callBack(event.data.content);
					break;
			}
		};
		this.worker.onerror = function(event) {
			sendMessage({
				method: 'log',
				content: 'WORKER ERROR: ' + path + ', line: ' + event.lineno + ': ' + event.message
			});
		}
	} else {
		this.path = path;
		workerProxies[id] = this;
		sendMessage({
			method: 'createWorkerProxy',
			id: id,
			path: path
		}, []);

		this.sendMessage = function(message, transferable, callBack) {
			this.callBack = callBack;
			sendMessage({
				method: 'messageToProxy',
				id: this.id,
				message: message
			}, transferable);
		}

		this.onmessage = function(content) {
			this.callBack(content);
		}
	}
}

function Adjustment(settings, noEffectCondition) {
	var key;
	this.settings = {active: false};
	this.defaults = {active: false};
	this.noEffectCondition = noEffectCondition;
	for (key in settings) {
		if (settings.hasOwnProperty(key)) {
			this.settings[key] = settings[key];
			this.defaults[key] = settings[key];
		}
	}
	this.setSettings = function(object) {
		for (key in object) {
			if (object.hasOwnProperty(key)) {
				if (this.settings[key] != object[key]) {
					this.settings[key] = object[key];
					this.changed = true;
				}
			} else {
				throw(new CodeError('Setting "' + key + '" is invalid.'));
			}
		}
	};
	this.noEffect = function() {
		with(this.settings) {
			return eval(this.noEffectCondition);
		}
	}
}

function Job(tasks) {
	var _this = this;
	this.taskRegistry = {};
	this.totPendingOrExecutingTasks = 0;

	this.execute = function(callBack) {
		this.executeCallBack = callBack || this.executeCallBack;
		var i,
			id,
			task,
			arePendingDependencies;

		// execute all pending jobs that have no pending dependencies
		for (id in this.taskRegistry) {
			if (this.taskRegistry.hasOwnProperty(id)) {
				task = this.taskRegistry[id];
				if (task.pending) {
					arePendingDependencies = false;
					for (i = 0; i < task.dependencyList.length; i++) {
						var otherTask = this.getTaskByID(task.dependencyList[i]);
						if (otherTask.pending || otherTask.executing) {
							arePendingDependencies = true;
							break;
						}
					}
					if (! arePendingDependencies) {
						console.log('task ' + task.id + ' executing');
						task.executing = true;
						task.pending = false;
						task.handler(task, function(task) {
							_this.registerTaskCompleted(task);
						});
					}
				}
			}
		}
	};

	this.registerTaskCompleted = function(task) {
		task.executing = false;
		console.log('task ' + task.id + ' completed');
		this.totPendingOrExecutingTasks--;
		if (this.totPendingOrExecutingTasks == 0) {
			if (this.executeCallBack) this.executeCallBack();
		} else {
			this.execute();
		}

	};

	this.getTaskByID = function(id) {
		return this.taskRegistry[id];
	}

	this.addTask = function(id, handler, dependencyList) {
		var task = {};
		task.id = id;
		task.dependencyList = dependencyList;
		task.handler = handler;
		task.pending = false;
		task.executing = false;
		task.invalidate = function() {
			if (! this.pending) {
				this.pending = true;
				_this.totPendingOrExecutingTasks++;
				console.log('task ' + this.id + ' pending');
				for (var id in _this.taskRegistry) {
					if (_this.taskRegistry.hasOwnProperty(id)) {
						var dependant = _this.taskRegistry[id];
						if (dependant.dependencyList.indexOf(this.id) > -1) {
							dependant.invalidate();
						}
					}
				}
			}
		}
		this.taskRegistry[id] = task;
	};

	if (tasks) {
		for (var i = 0; i < tasks.length; i++) {
			var args = tasks[i];
			var id = args.shift();
			var handler = args.shift();
			this.addTask(id, handler, args);
		}
	}
}

var dimensions = {
	width: 0,
	height: 0,
	pixels: 0
};

var methods = {
	updateOriginal: updateOriginal,
	applyAdjustments: applyAdjustments
};

var caches = {
	originalData: null,
	originalH: null,
	originalS: null,
	originalL: null,
	adjustedH: null,
	adjustedS: null,
	adjustedL: null,
	adjustedVignette: null,
	adjustedR: null,
	adjustedG: null,
	adjustedB: null,
	finalR: null,
	finalG: null,
	finalB: null
};

var lookups = {
	r: new Lookup(65536),
	g: new Lookup(65536),
	b: new Lookup(65536)
};

var adjustments = {
	whiteBalance: new Adjustment({
		by: 0,
		gm: 0
	}, '(by == 0 && gm == 0) || active == false'),
	range: new Adjustment({
		whitePoint: 255,
		blackPoint: 0
	}, '(whitePoint == 255 && blackPoint == 0) || active == false'),
	brightness: new Adjustment({
		value: 0
	}, 'value == 0 || active == false'),
	contrast: new Adjustment({
		value: 0
	}, 'value == 0 || active == false'),
	highlights: new Adjustment({
		value: 0
	}, 'value == 0 || active == false'),
	shadows: new Adjustment({
		value: 0
	}, 'value == 0 || active == false'),
	saturation: new Adjustment({
		value: 0
	}, 'value == 0 || active == false'),
	hue: new Adjustment({
		value: 0
	}, 'value == 0 || active == false'),
	colourEmphasis: new Adjustment({
		value: 0
	}, 'value == 0 || active == false'),
	crossProcess: new Adjustment({
		amount: 0
	}, 'amount == 0 || active == false'),
	vignette: new Adjustment({
		amount: 0,
		spread: 127
	}, 'amount == 0 || active == false')
};

// set up sub-workers

var minions = {
	hChannel: new Minion('hchannel', 'hChannel.js'),
	sChannel: new Minion('sChannel', 'sChannel.js'),
	vChannel: new Minion('vChannel', 'vChannel.js'),
	vignette: new Minion('vignette', 'vignette.js'),
	rLookup: new Minion('rLookup', 'rLookup.js'),
	gLookup: new Minion('gLookup', 'gLookup.js'),
	bLookup: new Minion('bLookup', 'bLookup.js'),
	rChannel: new Minion('rChannel', 'rgbChannel.js'),
	gChannel: new Minion('gChannel', 'rgbChannel.js'),
	bChannel: new Minion('bChannel', 'rgbChannel.js')
};

// set up jobs and their dependencies

var jobs = {
	doAdjustments: new Job([
		['toHLS',		calcHLS],
		['hChannel',	calcHChannel,	'toHLS'],
		['vChannel',	calcVChannel,	'toHLS'],
		['sChannel',	calcSChannel,	'toHLS'],
		['vignette',	calcVignette,	'vChannel'],
		['toRGB',		calcRGB,		'hChannel', 'sChannel', 'vignette'],
		['rLookup',		calcRLookup],
		['gLookup',		calcGLookup],
		['bLookup',		calcBLookup],
		['rChannel',	calcRChannel,	'toRGB',	'rLookup'],
		['gChannel',	calcGChannel,	'toRGB',	'gLookup'],
		['bChannel',	calcBChannel,	'toRGB',	'bLookup'],
		['finish',		finishAdjustments,		'rChannel', 'gChannel', 'bChannel']
	])
};

// job handlers

function calcHLS(task, callBack) {
	var toDo = {},
		toDoCount = 0,
		adjustmentName,
		adjustment,
		list = [
			'whiteBalance'
		];

	while (adjustmentName = list.shift()) {
		adjustment = adjustments[adjustmentName];
		if (! adjustment.noEffect()) {
			toDo[adjustmentName] = adjustment.settings;
			toDoCount++;
		}
	}

	var i,
		shiftR = 0,
		shiftG = 0,
		shiftB = 0,
		totPixels = dimensions.pixels,
		data = caches.originalData,
		hData = caches.originalH.data,
		sData = caches.originalS.data,
		lData = caches.originalL.data,
		histogram = canUseTransferable ? new Uint32Array(256) : [];

	if (toDo.whiteBalance) {
		shiftG = -toDo.whiteBalance.gm/5;
		shiftB = -toDo.whiteBalance.by/3;
		shiftR = (toDo.whiteBalance.gm/5 + toDo.whiteBalance.by/3)/2;

		console.log('shiftG=' + shiftG);
	}
	for (i = totPixels - 1; i--; ) {
		var offset = i * 4;
		var r = Math.max(0, Math.min(255, (data[offset] + shiftR))) / 255,
			g = Math.max(0, Math.min(255, (data[offset + 1] + shiftG))) / 255,
			b = Math.max(0, Math.min(255, (data[offset + 2] + shiftB))) / 255;
		var hsv = rgbToHsv(r, g, b);
		hData[i] = Math.round(hsv.h * 255);
		sData[i] = Math.round(hsv.s * 255);
		lData[i] = Math.round(hsv.v * 255);
		histogram[lData[i]]++;
	}

	caches.originalH.valid = true;
	caches.originalS.valid = true;
	caches.originalL.valid = true;

	console.log('sending histogram');
	sendMessage({
		method: "histogram",
		content: histogram.buffer || histogram
	}, [histogram.buffer]);

	if (callBack) {
		callBack(task);
	}
}

function calcHChannel(task, callBack) {
	var toDo = {},
		toDoCount = 0,
		adjustmentName,
		adjustment,
		list = [
			'hue'
		];

	while (adjustmentName = list.shift()) {
		adjustment = adjustments[adjustmentName];
		if (! adjustment.noEffect()) {
			toDo[adjustmentName] = adjustment.settings;
			toDoCount++;
		}
	}

	var data = copy8BitBuffer(caches.originalH.data);
	if (toDoCount) {
		minions.hChannel.sendMessage({
			adjustments: toDo,
			buffer: data.buffer || data
		}, [data.buffer], function(data) {
			caches.adjustedH.data = create8BitBuffer(data);
			caches.adjustedH.valid = true;
			callBack(task);
		});
	} else {
		caches.adjustedH.data = data;
		caches.adjustedH.valid = true;
		callBack(task);
	}
}

function calcVChannel(task, callBack) {
	var toDo = {},
		toDoCount = 0,
		adjustmentName,
		adjustment,
		list = [
			'range',
			'brightness',
			'contrast',
			'highlights',
			'shadows',
			'crossProcess'
		];

	while(adjustmentName = list.shift()) {
		adjustment = adjustments[adjustmentName];
		if (! adjustment.noEffect()) {
			toDo[adjustmentName] = adjustment.settings;
			toDoCount++;
		}
	}

	var data = copy8BitBuffer(caches.originalL.data);
	if (toDoCount) {
		minions.vChannel.sendMessage({
			adjustments: toDo,
			buffer: data.buffer || data
		}, [data.buffer], function(data) {
			caches.adjustedL.data = create8BitBuffer(data);
			caches.adjustedL.valid = true;
			callBack(task);
		});
	} else {
		caches.adjustedL.data = data;
		caches.adjustedL.valid = true;
		callBack(task);
	}
}

function calcSChannel(task, callBack) {
	var toDo = {},
		toDoCount = 0,
		adjustmentName,
		adjustment,
		list = [
			'saturation',
			'colourEmphasis'
		];

	while(adjustmentName = list.shift()) {
		adjustment = adjustments[adjustmentName];
		if (! adjustment.noEffect()) {
			toDo[adjustmentName] = adjustment.settings;
			toDoCount++;
		}
	}

	var data = copy8BitBuffer(caches.originalS.data);
	if (toDoCount) {
		minions.sChannel.sendMessage({
			adjustments: toDo,
			buffer: data.buffer || data
		}, [data.buffer], function(data) {
			caches.adjustedS.data = create8BitBuffer(data);
			caches.adjustedS.valid = true;
			callBack(task);
		});
	} else {
		caches.adjustedS.data = data;
		caches.adjustedS.valid = true;
		callBack(task);
	}
}

function calcVignette(task, callBack) {
	var toDo = {},
		toDoCount = 0,
		adjustmentName,
		adjustment,
		list = [
			'vignette'
		];

	while(adjustmentName = list.shift()) {
		adjustment = adjustments[adjustmentName];
		if (! adjustment.noEffect()) {
			toDo[adjustmentName] = adjustment.settings;
			toDoCount++;
		}
	}

	var data = copy8BitBuffer(caches.adjustedL.data);
	if (toDoCount) {
		minions.vignette.sendMessage({
			adjustments: toDo,
			dimensions: dimensions,
			buffer: data.buffer || data
		}, [data.buffer], function(data) {
			caches.adjustedVignette.data = create8BitBuffer(data);
			caches.adjustedVignette.valid = true;
			callBack(task);
		});
	} else {
		caches.adjustedVignette.data = data;
		caches.adjustedVignette.valid = true;
		callBack(task);
	}
}

function calcRGB(task, callBack) {
	var i,
		totPixels = dimensions.pixels,
		hData = caches.adjustedH.data,
		sData = caches.adjustedS.data,
		vData = caches.adjustedVignette.data,
		rData = caches.adjustedR.data,
		gData = caches.adjustedG.data,
		bData = caches.adjustedB.data;

	for (i = totPixels - 1; i--; ) {
		var h = hData[i] / 255,
			v = vData[i] / 255,
			s = sData[i] / 255;

		var rgb = hsvToRgb(h, s, v);
		rData[i] = Math.round(rgb.r * 255);
		gData[i] = Math.round(rgb.g * 255);
		bData[i] = Math.round(rgb.b * 255);
	}

	caches.adjustedR.valid = true;
	caches.adjustedG.valid = true;
	caches.adjustedB.valid = true;

	callBack(task);
}

function calcRGBLookup(task, callBack, lookup, minion) {
	var toDo = {},
		toDoCount = 0,
		adjustmentName,
		adjustment,
		list = [
			'crossProcess'
		];

	while(adjustmentName = list.shift()) {
		adjustment = adjustments[adjustmentName];
		if (! adjustment.noEffect()) {
			toDo[adjustmentName] = adjustment.settings;
			toDoCount++;
		}
	}

	if (toDoCount) {
		minion.sendMessage({
			adjustments: toDo
		}, [], function(data) {
			lookup.table = create8BitBuffer(data);
			lookup.valid = true;
			callBack(task);
		});
	} else {
		lookup.valid = false;
		callBack(task);
	}
}

function calcRGBChannel(task, callBack, lookup, minion, inputCache, outputCache) {
	var data = copy8BitBuffer(inputCache.data);
	if (lookup.valid) {
		var table = copy8BitBuffer(lookup.table);
		var buffer = copy8BitBuffer(inputCache.data);
		minion.sendMessage({
			lookup: table.buffer || table,
			buffer: buffer.buffer || buffer
		}, [table.buffer, data.buffer], function(data) {
			outputCache.data = create8BitBuffer(data);
			outputCache.valid = true;
			callBack(task);
		});
	} else {
		outputCache.data = data;
		outputCache.valid = true;
		callBack(task);
	}
}

function calcRLookup(task, callBack) {
	calcRGBLookup(task, callBack, lookups.r, minions.rLookup);
}

function calcRChannel(task, callBack) {
	calcRGBChannel(task, callBack, lookups.r, minions.rChannel, caches.adjustedR, caches.finalR);
}

function calcGLookup(task, callBack) {
	calcRGBLookup(task, callBack, lookups.g, minions.gLookup);
}

function calcGChannel(task, callBack) {
	calcRGBChannel(task, callBack, lookups.g, minions.gChannel, caches.adjustedG, caches.finalG);
}

function calcBLookup(task, callBack) {
	calcRGBLookup(task, callBack, lookups.b, minions.bLookup);
}

function calcBChannel(task, callBack) {
	calcRGBChannel(task, callBack, lookups.b, minions.bChannel, caches.adjustedB, caches.finalB);
}

function finishAdjustments(task, callBack) {
	var i,
		data = copy8BitBuffer(caches.originalData),
		totPixels = dimensions.pixels,
		r = caches.finalR.data,
		g = caches.finalG.data,
		b = caches.finalB.data;

	for (i = totPixels - 1; i--; ) {
		var offset = i * 4;
		data[offset] = r[i];
		data[offset + 1] = g[i];
		data[offset + 2] = b[i];
	}

	console.log('sending result');

	sendMessage({
		method: "result",
		content: data.buffer || data
	}, [data.buffer]);

	callBack(task);
}

self.onmessage = function(event) {
	var data = event.data;
	switch (data.method) {
		case 'test':
			sendMessage({
				method: 'test',
				content: data.content
			}, []);
			break;
		case 'debug':
			sendMessage({
				method: 'debug',
				content: data.content
			}, []);
			break;
		case 'messageFromProxy':
			var workerProxy = workerProxies[data.id];
			workerProxy.onmessage(data.content);
			break;
		default:
			if (data.method != 'test') {
				methods[data.method](data.content);
			}
			break;
	}
}

function updateOriginal(content) {
	console.log('updateOriginal');

	var i,
		data = create8BitBuffer(content.buffer),
		totPixels = data.length / 4;

	dimensions = {
		width: content.width,
		height: content.height,
		pixels: totPixels
	};


	for (i in caches) {
		if (caches.hasOwnProperty(i)) {
			caches[i] = new Cache8Bit(totPixels);
		}
	}

	caches.originalData = data;

	calcHLS();

}

function applyAdjustments(object) {
	console.log('applyAdjustments ' + JSON.stringify(object));
	var job = jobs.doAdjustments;

	for (var name in object) {
		if (object.hasOwnProperty(name)) {

			var adjustment = adjustments[name];
			adjustment.setSettings(object[name]);

			switch(name) {
				case 'whiteBalance':
					job.getTaskByID('toHLS').invalidate();
					break;
				case 'range':
				case 'contrast':
				case 'brightness':
				case 'highlights':
				case 'shadows':
					job.getTaskByID('vChannel').invalidate();
					break;
				case 'saturation':
				case 'colourEmphasis':
					job.getTaskByID('sChannel').invalidate();
					break;
				case 'hue':
					job.getTaskByID('hChannel').invalidate();
					break;
				case 'vignette':
					job.getTaskByID('vignette').invalidate();
					break;
				case 'crossProcess':
					job.getTaskByID('vChannel').invalidate();
					job.getTaskByID('rLookup').invalidate();
					job.getTaskByID('gLookup').invalidate();
					job.getTaskByID('bLookup').invalidate();
					break;
			}
		} else {
			throw(new CodeError('Adjustment "' + name + '" not recognized.'));
		}
	}

	job.execute();
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

function rgbToHsv(r, g, b) {
	var min,
		max,
		delta,
		h,
		s,
		v;

	min = Math.min(r, Math.min(g, b));
	max = Math.max(r, Math.max(g, b));
	v = max;

	delta = max - min;

	if (max != 0) {
		s = delta / max;
	} else {
		s = 0;
		h = 0;
		return {h: h, s: s, v: v};
	}

	if (r == max && g == min) {
		h = 0;
	} else if (r == max) {
		h = mod((g - b) / delta, 6);
	} else if (g == max) {
		h = 2 + (b - r) / delta;
	} else {
		h = 4 + (r - g) / delta;
	}

	h *= 60;
	if (h < 0) h += 360;

	h /= 360;

	return {h: h, s: s, v: v};
}

function mod(value1, value2) {
	var div = value1 / value2;
	return (value1 - Math.floor(div) * value2);
}

function hsvToRgb(h, s, v) {
	h *= 360;

	var i, f, p, q, t;

	if (s == 0) {
		return {r: v, g: v, b: v};
	}

	h /= 60;
	i = Math.floor(h);
	f = h - i;
	p = v * (1 - s);
	q = v * (1 - s * f);
	t = v * (1 - s * (1 - f));

	var rgb;

	switch (i) {
		case 0: rgb = {r: v, g: t, b: p}; break;
		case 1: rgb = {r: q, g: v, b: p}; break;
		case 2: rgb = {r: p, g: v, b: t}; break;
		case 3: rgb = {r: p, g: q, b: v}; break;
		case 4: rgb = {r: t, g: p, b: v}; break;
		default: rgb = {r: v, g: p, b: q}; break;
	}

	return rgb;
}