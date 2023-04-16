import AudioModule from './AudioModule.js';
import NoteChangeEvent from '../events/NoteChangeEvent.js';

function fetchAndCacheBuffers(context, filePathArray) {
    return new Promise(resolve => {
        const cache = [];
        filePathArray.forEach(path => {
            fetch(path).then(response => {
                response.arrayBuffer().then(arrayBuffer => {
                    context.decodeAudioData(arrayBuffer).then(buffer => {
                        cache.push({path, buffer});
                        if (cache.length === filePathArray.length) {
                            resolve(cache);
                        }
                    });
                });
            });
        });
    });
}

export default class NoiseModule extends AudioModule {
    _initialise() {
        const context = this._audioContext;
        this._gain = context.createGain();

        fetchAndCacheBuffers(context, [
            'media/white-noise.mp3',
            'media/pink-noise.mp3',
            'media/brown-noise.mp3',
        ]).then(cache => {
            this._buffers = {};
            cache.forEach(entry => {
                this._buffers[entry.path.replace(/^.*\/(\w+)-noise\.mp3$/, '$1')] = entry.buffer;
            });
            this._update();
        });
    }

    get _initialPatch() {
        return {
            type: 'white',   // white, pink, brown
        };
    }

    _onPatchChange(evt) {
        super._onPatchChange(evt);
        this._update();
    }

    _update() {
        if (this._buffers) {
            if (this._source) {
                this._source.disconnect(this._gain);
            }
            this._source = this._audioContext.createBufferSource();
            this._source.buffer = this._buffers[this._patch.get('type')];
            this._source.loop = true;
            this._source.loopStart = 0.2;
            this._source.loopEnd = this._source.buffer.duration - 0.2;
            this._source.connect(this._gain);
            this._source.start();
        }
    }

    get noiseOut() {
        return this._gain;
    }
}
