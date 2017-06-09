(function (global) {
    const queue = [];
    const jobQueue = {
        add(tasks) {
            queue.push(...tasks);
        }
    };
    (function poll() {
        let count = 100;
        while (count--) {
            const next = queue.pop();
            next && next();
        }
        requestAnimationFrame(poll);
    })();
    global.jobQueue = jobQueue;
})(this);
