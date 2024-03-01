
$(document).ready(function() {

	var layers = $('[data-depth]'),
		$window = $(window),
		winHeight = $window.height(),
		winWidth = $window.width(),
		scrollMode = true,
		smallScreen = Math.max(winWidth, winHeight) < 700,
		isTouchDevice = function() {  return 'ontouchstart' in window || 'onmsgesturechange' in window;},
		isDesktop = window.screenX != 0 && !isTouchDevice();

	layers.wrap('<div class="layerWrapper" style="position: relative"/>').parent().css({transform: 'translate3d(1px,1px,1px)'});

	if (! isDesktop) window.addEventListener('deviceorientation', onDeviceOrientation);

	window.addEventListener('scroll', onScroll);

	window.addEventListener('resize', onResize);

	onScroll();

	function onDeviceOrientation(event) {
		if (scrollMode) {
			scrollMode = false;
			window.removeEventListener('scroll', onScroll);
		}
		setLayerOffsets(event);
	}

	function onScroll(event) {
		if (smallScreen) {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('deviceorientation', onDeviceOrientation);
			setDividerHeights();
		} else {
			setLayerOffsets(event);
		}
	}

	function onResize() {
		if (scrollMode && smallScreen) {
			setDividerHeights();
		}
	}

	function setLayerOffsets(event) {
		var tilt,
			winHeight = $window.height(),
			winWidth = $window.width(),
			scrollTop = $window.scrollTop(),
			portrait = winHeight > winWidth;

		if (event !== undefined && event.gamma !== undefined) {
			if (!portrait) {
				tilt = Math.abs(event.gamma);
			} else {
				if (Math.abs(event.gamma) > 90) {
					tilt = 180 - Math.abs(event.beta);
				} else {
					tilt = Math.abs(event.beta);
				}
			}
		}

		layers.each(function(i, elem) {
			var $elem = $(elem),
				elemOffset = $elem.offset(),
				elemHeight = $elem.height(),
				delta,
				shift;

			if ((elemOffset.top < winHeight + scrollTop)
			&& (elemOffset.top + elemHeight > scrollTop)) {
				if (scrollMode) {
					delta = ((scrollTop + winHeight/2) - (elemOffset.top + elemHeight/2)) * 0.2;
				} else {
					delta = (60 - tilt) * elemHeight * 0.002;
				}
				shift = delta * parseFloat($elem.data('depth'));
				$elem.parent().css({top: shift + 'px'});
			}
		});
	}

	function setDividerHeights() {
		var dividerHeight = Math.floor($(window).width() * 720 / 1280);

		$('.divider').css({height: dividerHeight + 'px'});
		$('.artwork').css({height: dividerHeight + 'px', top: 0});
		$('.layerWrapper').css({top: 0});
	}
})
