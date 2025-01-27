
var cj = createjs;
var getRGB = cj.Graphics.getRGB;
var strokeColour = getRGB(150, 150, 150);
var knobColour = getRGB(200, 200, 0);
var toneCurve,
	w, h,
	stage,
	graph,
	handle1,
	handle2,
	original,
	imageLoaded = false,
	work,
	margin = 10,
	stageWidth = 720,
	stageHeight = 720,
	width = 256,
	height = 256,
	working = false,
	pendingJobs = {adjustments: {}},
	brightness = 0,
	contrast = 0,
	shadows = 0,
	highlights = 0,
	imageProcessor,
	histogram,
	workerProxies = {};

function Minion(path, skipTest) {
	var _this = this;
	this.path = path;
	this.worker = new Worker(path);
	this.canUseTransferable = false;
	if (this.worker.webkitPostMessage) {
		this.canUseTransferable = true;
		this.worker.postMessage = this.worker.webkitPostMessage;
	} else {
		if (skipTest) {
			this.canUseTransferable = true;
		} else {
			// send a test ArrayBuffer 1 byte long
			try {
				var ab = new ArrayBuffer(1);
				this.worker.postMessage({method: "test", content: ab}, [ab]);
				// if the ArrayBuffer is now empty,
				// transferables are supported
				if (ab.byteLength === 0) {
					this.canUseTransferable = true;
				}
			} catch(error) {
				this.canUseTransferable = false;
			}
		}
	}
	this.sendMessage = function(message, transferable) {
		if (this.canUseTransferable) {
			this.worker.postMessage(message, transferable);
		} else {
			this.worker.postMessage(message);
		}
	};
	this.worker.onmessage = function(event) {
		if (_this.onmessage) {
			_this.onmessage(event.data);
		}
	}
	this.worker.onerror = function(event) {
		console.log('WORKER ERROR: ' + path + ', line: ' + event.lineno + ': ' + event.message);
	}
}

var adjustments = {
	range: {
		settings: {
			active: {
				val: true
			},
			blackPoint: {
				val: 0,
				minValue: 0,
				maxValue: 255
			},
			whitePoint: {
				val: 255,
				minValue: 0,
				maxValue: 255
			}
		}
	},
	brightness: {
		settings: {
			active: {
				val: true
			},
			value: {
				val: 0,
				minValue: -127,
				maxValue: 127
			}
		}
	},
	contrast: {
		settings: {
			active: {
				val: true
			},
			value: {
				val: 0,
				minValue: -127,
				maxValue: 127
			}
		}
	},
	highlights: {
		settings: {
			active: {
				val: true
			},
			value: {
				val: 0,
				minValue: 0,
				maxValue: 255
			}
		}
	},
	shadows: {
		settings: {
			active: {
				val: true
			},
			value: {
				val: 0,
				minValue: 0,
				maxValue: 255
			}
		}
	},
	whiteBalance: {
		settings: {
			active: {
				val: true
			},
			by: {
				val: 0,
				minValue: -127,
				maxValue: 127
			},
			gm: {
				val: 0,
				minValue: -127,
				maxValue: 127
			}
		}
	},
	saturation: {
		settings: {
			active: {
				val: true
			},
			value: {
				val: 0,
				minValue: -127,
				maxValue: 127
			}
		}
	},
	hue: {
		settings: {
			active: {
				val: true
			},
			value: {
				val: 0,
				minValue: -127,
				maxValue: 127
			}
		}
	},
	colourEmphasis: {
		settings: {
			active: {
				val: true
			},
			value: {
				val: 0,
				minValue: 0,
				maxValue: 255
			}
		}
	},
	vignette: {
		settings: {
			active: {
				val: true
			},
			amount: {
				val: 0,
				minValue: 0,
				maxValue: 255
			},
			spread: {
				val: 127,
				minValue: 0,
				maxValue: 255
			}
		}
	},
	crossProcess: {
		settings: {
			active: {
				val: true
			},
			amount: {
				val: 0,
				minValue: 0,
				maxValue: 255
			}
		}
	}
}

imageProcessor = new Minion('workers/image-processor.js');

function scriptInit() {

	$('.adjustment').each(function(i, e) {
		var $adjustmentElem = $(e);
		var adjustmentName = $adjustmentElem.attr('id');
		var settings = adjustments[adjustmentName].settings;

		var checkBox = $adjustmentElem.find('input:checkbox')[0];
		if (checkBox) {
			checkBox = $(checkBox);
			checkBox.prop('checked', settings.active.val);
			checkBox.change(function() {
				settings.active.val = $(this).prop('checked');
				processAdjustment(adjustmentName);
			})
		}
		$adjustmentElem.find('div[data-setting]').each(function(i, e) {
			var $settingElem = $(e);
			var settingElemID;
			var settingName = $(e).attr('data-setting');
			var setting = settings[settingName];
			var slider = $settingElem.find('p.slider')[0];
			var histogramPara = $settingElem.find('p.histogram')[0];
			var textField = $settingElem.find('input:text')[0];
			if (histogramPara) {
				settingElemID = adjustmentName + '-histogram';
				$settingElem.find('p.histogram').attr('id', settingElemID);
				histogram = new Histogram(settingElemID, 100);
				histogram.setBlackPoint(settings['blackPoint'].val);
				histogram.setWhitePoint(settings['whitePoint'].val);
				histogram.onChanged = function(name, value) {
					settings[name].val = value;
					if (checkBox && ! checkBox.prop('checked')) {
						checkBox.prop('checked', settings.active.val = true);
					}
					processAdjustment(adjustmentName);
				}
			}
			if (slider) {
				settingElemID = adjustmentName + '-' + settingName + '-slider';
				$settingElem.find('p.slider').attr('id', settingElemID);
				slider = new CanvasSlider(settingElemID, setting.minValue, setting.maxValue);
				slider.setValue(setting.val);
				slider.onChanged = function(val) {
					setting.val = val;
					if (textField) {
						textField.prop('value', setting.val);
					}
					if (checkBox && ! checkBox.prop('checked')) {
						checkBox.prop('checked', settings.active.val = true);
					}
					processAdjustment(adjustmentName);
				}
			}
			if (textField) {
				var setVal = function(tf, newVal) {
					setting.val = newVal;
					$(tf).prop('value', newVal);
					slider.setValue(newVal);
					if (checkBox && ! checkBox.prop('checked')) {
						checkBox.prop('checked', settings.active.val = true);
					}
					processAdjustment(adjustmentName);
				}
				textField = $(textField);
				textField.prop('value', setting.val);
				textField.keydown(function(event) {
					var newVal;
					var keyCode = event.which;
					switch(keyCode) {
						case 38:
							event.preventDefault();
							newVal = Math.min(setting.maxValue, setting.val + 1);
							setVal(this, newVal);
							break;
						case 40:
							event.preventDefault();
							newVal = Math.max(setting.minValue, setting.val - 1);
							setVal(this, newVal);
							break;
					}
					if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105) || keyCode == 8 || keyCode == 13 || keyCode == 189 || keyCode == 109 || keyCode == 37 || keyCode == 39) {
						// key OK
					} else {
						event.preventDefault();
					}
				});
				textField.change(function() {
					var newVal = parseInt($(this).prop('value'));
					if (! isNaN(newVal)) {
						newVal = Math.max(setting.minValue, Math.min(setting.maxValue, Math.round(newVal)));
						if (newVal != setting.val) {
							setting.val = newVal;
							$(this).prop('value', newVal);
							slider.setValue(newVal);
							if (checkBox && ! checkBox.prop('checked')) {
								checkBox.prop('checked', settings.active.val = true);
							}
							processAdjustment(adjustmentName);
						}
					}
				})
			}
		})
	});


	$('.adjustment-group').each(function(i, e) {
		var $elem = $(e);
		var $heading = $elem.find('h1');
		$elem.prop('data-openHeight', $elem.height());
		$elem.prop('data-closedHeight', $heading.height() - 5);
		$elem.height($elem.prop('data-openHeight'));
		if ($elem.hasClass('closed')) {
			$elem.height($elem.prop('data-closedHeight'));
		}
		$elem.addClass('animated');
		$heading.click(function() {
			if ($elem.hasClass('closed')) {
				$elem.removeClass('closed');
				$elem.height($elem.prop('data-openHeight'));
			} else {
				$elem.addClass('closed');
				$elem.height($elem.prop('data-closedHeight'));
			}
		})
	})

	stage = new cj.Stage("stage");


	original = new cj.Bitmap("media/beach.jpg");
	original.image.onload = function() {
		imageLoaded = true;

		work = new cj.DisplayObject();
		work.shadow = new cj.Shadow("#000000", 1, 5, 10);

		stage.addChild(work);

		scriptResize();
	}

	document.ontouchmove = function(event){
		event.preventDefault();
	}
}

function processAdjustment(list) {
	if (typeof(list) == 'string') list = [list];
	var settings,
		message,
		messageSettings,
		i,
		name,
		key,
		content = {};

	if (! working) {
		working = true;
		for (i = 0; i < list.length; i++) {
			name = list[i];
			settings = adjustments[name].settings;
			messageSettings = content[name] = {};
			for (key in settings) {
				if (settings.hasOwnProperty(key)) {
					messageSettings[key] = settings[key].val;
				}
			}
		}
		message = {
			method: 'applyAdjustments',
			content: content
		};
		imageProcessor.sendMessage(message);
	} else {
		for (i = 0; i < list.length; i++) {
			name = list[i];
			pendingJobs.adjustments[name] = true;
		}
	}
}

function processAllAdjustments() {
	var list = [];
	for (var name in adjustments) {
		if (adjustments.hasOwnProperty(name)) {
			list.push(name);
		}
	}

	processAdjustment(list);
}

function scriptResize() {
	if (imageLoaded) {
		var imageMargin = 20;
		var image = original.image;
		var main = $("#main");
		stageWidth = main.width();
		stageHeight = main.height();

		var s = Math.min((stageWidth - imageMargin*2)/image.width, (stageHeight - imageMargin*2)/image.height);
		w = Math.round(image.width * s);
		h = Math.round(image.height * s);

		original.cache(0, 0, image.width, image.height, s);
		work.x = Math.round((stageWidth - w)/2);
		work.y = Math.round((stageHeight - h)/2);
		work.cache(0, 0, w, h);

		updateOriginal();
		processAllAdjustments();
	}
}

function updateOriginal() {
	if (! working) {
		working = true;
		var buffer = original.cacheCanvas.getContext('2d').getImageData(0, 0, w, h).data.buffer;
		var message = {
			method: 'updateOriginal',
			content: {
				width: w,
				height: h,
				buffer: buffer
			}
		}
		imageProcessor.sendMessage(message, [buffer]);
	} else {
		pendingJobs.updateOriginal = true;
	}
}

imageProcessor.onmessage = function(message) {
	// TODO: handle queueing of tasks
	var data,
		minion,
		transferable;
	switch (message.method) {
		case 'alert':
			alert(message.content);
			break;
		case 'log':
			console.log(message.content);
			break;
		case 'test':
			break;
		case 'histogram':
			doPendingJobs();
			data = new Uint32Array(message.content);
			histogram.updateHistogram(data, w * h / 60);
			break;
		case 'result':
			doPendingJobs();
			data = new Uint8ClampedArray(message.content);
			var ctx = work.cacheCanvas.getContext('2d');
			var imageData = ctx.getImageData(0, 0, w, h);
			var imageDataData = imageData.data;
			for (var i = data.length - 1; i--; ) {
				imageDataData[i] = data[i];
			}
			ctx.putImageData(imageData,0,0);
			work.visible = true;
			stage.update();
			break;
		case 'createWorkerProxy':
			minion = workerProxies[message.id] = new Minion('workers/' + message.path, true);
			minion.id = message.id;
			minion.onmessage = function(data) {
				switch(data.method) {
					case 'test':
						break;
					case 'alert':
						alert(data.content);
						break;
					case 'log':
						console.log(data.content);
						break;
					default:
						var transferable = [];
						if (data.content instanceof ArrayBuffer) transferable.push(data.content);
						imageProcessor.sendMessage({
							method: 'messageFromProxy',
							id: this.id,
							content: data.content
						}, transferable);
						break;
				}
			};
			break;
		case 'messageToProxy':
			minion = workerProxies[message.id];
			transferable = [];
			for (var key in message.message) {
				if (message.message.hasOwnProperty(key)) {
					if (message.message[key] instanceof ArrayBuffer) transferable.push(message.message[key]);
				}
			}
			minion.sendMessage(message.message, transferable);
			break;
	}
}

function doPendingJobs() {
	working = false;
	if (pendingJobs.updateOriginal) {
		delete pendingJobs.updateOriginal;
		updateOriginal();
	} else if (pendingJobs.adjustments) {
		var list = [];
		for (var name in pendingJobs.adjustments) {
			if (pendingJobs.adjustments.hasOwnProperty(name)) {
				list.push(name);
				delete pendingJobs.adjustments[name];
			}
		}
		if (list.length) processAdjustment(list);
	}
}


