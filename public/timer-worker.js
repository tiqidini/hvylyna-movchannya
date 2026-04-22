let timerId = null;

self.onmessage = function(e) {
  if (e.data === 'start') {
    if (timerId) clearTimeout(timerId);
    
    // Precise clock alignment logic
    const tick = () => {
      const now = Date.now();
      const delay = 1000 - (now % 1000); // Time until next whole second
      
      self.postMessage('tick');
      
      // Schedule next tick precisely at the start of the next second
      timerId = setTimeout(tick, delay);
    };
    
    tick();
  } else if (e.data === 'stop') {
    if (timerId) clearTimeout(timerId);
    timerId = null;
  }
};
