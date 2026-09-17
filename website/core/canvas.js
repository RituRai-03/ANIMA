// ============================================================
// Canvas Manager (Guarantees clean frame clearing, no ghosting)
// ============================================================

export class CanvasManager {
    constructor(canvasElement, videoElement) {
        this.canvas = canvasElement;
        this.video = videoElement;
        this.ctx = canvasElement.getContext("2d");
        this.width = 0;
        this.height = 0;
    }

    resize() {
        if (this.video && this.video.videoWidth > 0 && this.video.videoHeight > 0) {
            if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.width = this.canvas.width;
                this.height = this.canvas.height;
            }
        }
    }

    clear() {
        this.resize();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
