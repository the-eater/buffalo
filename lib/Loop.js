class Loop {
   constructor(obj = {}) {
     let { backoffPoint = 20000 } = obj;
     this._id = 0;
     this.queue = new Map();
     this.interval = 0;
     this.previousTick = 0;
     this.intervalHandle = false;
     this.intervalBackoff = 0;
     this.intervalBackoffPoint = 10;

     window.addEventListener('message', (e) => {
       if (e.data.backoffDaemon === 'yes') {
         this.tick();
       }
     });
   }

   tick() {
     if (this.queue.length === 0) {
       this.killInterval();
       return;
     }

     this.handleQueue();

     this.intervalBackoff++;

     if (this.intervalBackoff > this.intervalBackoffPoint) {
       this.queueSlowTick();
       return;
     }

     this.queueFastTick();
   }

   queueSlowTick() {
     if (this.intervalHandle !== false) {
       // Already started slow ticker
       return;
     }

     this.intervalHandle = setInterval(() => this.tick(), 4);
   }

   queueFastTick() {
     window.postMessage({ backoffDaemon: 'yes' }, location.href);
   }

   killInterval() {
     if (this.intervalHandle === false) {
       return;
     }

     clearInterval(this.intervalHandle);
   }

   handleQueue() {
     let current = performance.now();
     let past = this.previousTick ? current - this.previousTick : 0;

     for(let [id, queueItem] of this.queue) {
       try {
         queueItem(past);
       } catch (e) {

       }
     }
     this.previousTick = current;
   }

   add(cb) {
     let id = this._id++;
     this.queue.set(id, cb);
     this.boost();
     this.tick();

     return {
       stop: () => {
         this.queue.delete(id);
       }
     }
   }

   boost() {
     this.intervalBackoff = 0;
   }
}
