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

export default fetchAndCacheBuffers;