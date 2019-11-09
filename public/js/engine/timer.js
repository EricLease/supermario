export default class Timer {
    constructor(deltaTime = 1/60) {        
        let accumulatedTime = 0;
        let lastTime = 0;
        
        this.started = false;
        this.updateProxy = (time) => {
            this.started = true;

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
            
            this.enqueue();
        }
    }

    enqueue() {
        requestAnimationFrame(this.updateProxy);
    }

    start() { if (!this.started) this.enqueue(); }
    pause() { this.paused = true; }
    resume() { this.paused = false; this.start(); }
}