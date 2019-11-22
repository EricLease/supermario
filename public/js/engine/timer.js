export default class Timer {
    constructor(deltaTime = 1/60) {        
        let accumulatedTime = 0;
        let lastTime = 0;
        
        this.started = false;
        this.updateProxy = (time) => {            
            if (!this.started) {
                lastTime = time;
                this.started = true;
            }
            

            if (this.paused) {
                lastTime = time;
            } else {
                accumulatedTime += (time - lastTime) / 1000;

                while(accumulatedTime > deltaTime) {
                    this.update(deltaTime);
                    accumulatedTime -= deltaTime;
                }
                
                lastTime = time;
            }
            
            this._handle = null;
            this.enqueue();
        }
    }

    enqueue() {
        if (this._handle) return;

        this._handle = requestAnimationFrame(this.updateProxy);
    }

    start() { if (!this.started) this.enqueue(); }
    pause() { this.paused = true; }
    resume() { this.paused = false; this.start(); }
    
    stop() {   
        if (!this.started || !this._handle) return;

        window.cancelAnimationFrame(this._handle);
        this._handle = null;
        this.started = false;
    }
}