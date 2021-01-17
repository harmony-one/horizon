function promisfy(fn, ctx) {
    return function() {
        let args = arguments;

        return new Promise(function(resolve, reject) {
            function callback(e, ...result) {
                if (e) {
                    reject(e);
                } else {
                    if(result.length == 1){
                        resolve(result[0]);
                    }else{
                        resolve(result);
                    }
                }
            }

            let fnArgs = [];
            for (let i of args) {
                fnArgs.push(i);
            }
            fnArgs.push(callback);

            fn.apply(ctx, fnArgs);
        });
    }
}

// for callbacks without error for its first argument
function promisfyNoError(fn, ctx) {
    return function() {
        let args = arguments;

        return new Promise(function(resolve, reject) {
            function callback(result) {
                resolve(result);
            }

            let fnArgs = [];
            for (let i of args) {
                fnArgs.push(i);
            }
            fnArgs.push(callback);

            fn.apply(ctx, fnArgs);
        });
    }
}

function waitFor(obj, evt) {
    function normalEvent(resolve, reject) {
        function callback(e, result) {
            if (e) {
                reject(e);
            } else {
                resolve(result);
            }
        }

        obj.on(evt, callback);
    }

    // TODO:
    // fix possible encoding error
    function streamDataEvent(resolve, reject) {
        let data = '';
        let hasError = false;

        obj.on('data', function(chunk) {
            data += chunk;
        });

        obj.on('end', function() {
            if (!hasError) {
                resolve(data);
            }
        });

        obj.on('error', function(err) {
            reject(err);
        })
    }

    if (evt === 'data' || evt === 'stream') {
        return new Promise(streamDataEvent);
    } else {
        return new Promise(normalEvent);
    }
}

exports.promisfy = promisfy;
exports.waitFor = waitFor;
exports.promisfyNoError = promisfyNoError;
