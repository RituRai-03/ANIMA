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
        } else if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const w = Math.max(640, Math.floor(rect.width || 960));
            const h = Math.max(360, Math.floor(rect.height || 540));
            if (this.canvas.width !== w || this.canvas.height !== h) {
                this.canvas.width = w;
                this.canvas.height = h;
                this.width = w;
                this.height = h;
            }
        }
    }

    clear() {
        this.resize();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = "transparent";
        this.ctx.setLineDash([]);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

