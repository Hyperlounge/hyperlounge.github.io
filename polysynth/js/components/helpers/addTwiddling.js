
export default function addTwiddling(element) {
    let _startCallback = () => {};
    let _twiddleCallback = (deltaX, deltaY) => {};
    let _endCallback = () => {};
    let _doubleTapCallback;
    let _firstTap = false;

    element.addEventListener('dblclick', evt => {
        _doubleTapCallback();
    });

    element.addEventListener('mousedown', evt => {
        const startX = evt.pageX;
        const startY = evt.pageY;
        const targetRect = element.getBoundingClientRect();
        const targetX = evt.clientX - targetRect.left;
        const targetY = evt.clientY - targetRect.top;
        _startCallback(targetX, targetY);

        const moveHandler = evt => {
            const deltaX = evt.pageX - startX;
            const deltaY = evt.pageY - startY;
            _twiddleCallback(deltaX, deltaY);
        }

        const endHandler = evt => {
            document.body.removeEventListener('mousemove', moveHandler);
            document.body.removeEventListener('mouseup', endHandler);
            document.body.removeEventListener('mouseleave', endHandler);
            _endCallback();
        }

        document.body.addEventListener('mousemove', moveHandler);
        document.body.addEventListener('mouseup', endHandler);
        document.body.addEventListener('mouseleave', endHandler);
    });

    element.addEventListener('touchstart', evt => {
        evt.preventDefault();

        if (_doubleTapCallback) {
            if (_firstTap) {
                _firstTap = false;
                _doubleTapCallback();
                return;
            }
            _firstTap = true;
            setTimeout(() => {
                _firstTap = false;
            }, 500);
        }

        const touch = evt.targetTouches[0];
        const touchId = touch.identifier;
        const startX = touch.pageX;
        const startY = touch.pageY;
        const targetRect = element.getBoundingClientRect();
        const targetX = touch.clientX - targetRect.left;
        const targetY = touch.clientY - targetRect.top;
        _startCallback(targetX, targetY);

        const moveHandler = evt => {
            const touch = Array.from(evt.touches).find(item => item.identifier === touchId);
            const deltaX = touch.pageX - startX;
            const deltaY = touch.pageY - startY;
            _twiddleCallback(deltaX, deltaY);
        }

        const endHandler = evt => {
            const touch = Array.from(evt.changedTouches).find(item => item.identifier === touchId);
            if (touch) {
                document.body.removeEventListener('touchmove', moveHandler);
                document.body.removeEventListener('touchend', endHandler);
                document.body.removeEventListener('touchcancel', endHandler);
                _endCallback();
            }
        }

        document.body.addEventListener('touchmove', moveHandler);
        document.body.addEventListener('touchend', endHandler);
        document.body.addEventListener('touchcancel', endHandler);
    });

    return {
        onStart(callback) {
            _startCallback = callback;
            return this;
        },
        onTwiddle(callback) {
            _twiddleCallback = callback;
            return this;
        },
        onEnd(callback) {
            _endCallback = callback;
            return this;
        },
        onDoubleTap(callback) {
            _doubleTapCallback = callback;
            return this;
        }
    }
}
