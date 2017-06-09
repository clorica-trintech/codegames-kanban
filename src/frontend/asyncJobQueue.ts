type Tasks = ((...args: any[]) => any)[];
type JobQueue = {
  add(tasks: Tasks): void;
};

(function (global) {
  const queue: Tasks = [];

  const jobQueue: JobQueue = {
    add(tasks: Tasks) {
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