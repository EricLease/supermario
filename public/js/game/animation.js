export function createAnimation(frames, frameLen) {
    return function resolveFrame(distance) {
        const frameIndex = Math.floor(distance / frameLen) % frames.length;
        
        return frames[frameIndex];
    };
}