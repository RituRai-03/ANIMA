// ============================================================
// Truthful Camera Manager & Telemetry State Machine
// ============================================================

export const CAMERA_STATES = {
    OFFLINE: "CAMERA OFFLINE",
    REQUESTING: "REQUESTING CAMERA",
    READY: "CAMERA READY",
    TRACKING: "TRACKING",
    TRACKING_LOST: "TRACKING LOST",
    ERROR: "CAMERA ERROR"
};

export class CameraManager {
    constructor(videoElement, messageElement, statusElement) {
        this.video = videoElement;
        this.messageEl = messageElement;
        this.statusEl = statusElement;
        this.stream = null;
        this.state = CAMERA_STATES.OFFLINE;
        this.updateStatus(CAMERA_STATES.OFFLINE);
    }

    updateStatus(stateText, extraInfo = "") {
        this.state = stateText;
        if (this.statusEl) {
            this.statusEl.textContent = extraInfo ? `${stateText}: ${extraInfo}` : stateText;
            if (stateText === CAMERA_STATES.TRACKING) {
                this.statusEl.style.color = "#00ff66";
            } else if (stateText === CAMERA_STATES.TRACKING_LOST) {
                this.statusEl.style.color = "#ffaa00";
            } else if (stateText === CAMERA_STATES.ERROR) {
                this.statusEl.style.color = "#ff2255";
            } else {
                this.statusEl.style.color = "#78A9D6";
            }
        }
    }

    async start(width = 960, height = 540) {
        this.updateStatus(CAMERA_STATES.REQUESTING);
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: "user"
                },
                audio: false
            });

            this.video.srcObject = this.stream;
            
            if (this.messageEl) {
                this.messageEl.style.display = "none";
            }

            if (this.video.readyState < 2) {
                await new Promise((resolve) => {
                    this.video.addEventListener("loadeddata", resolve, { once: true });
                });
            }

            this.updateStatus(CAMERA_STATES.READY);
            return true;
        } catch (error) {
            console.error("Camera Initialization Failure:", error);
            this.updateStatus(CAMERA_STATES.ERROR);
            if (this.messageEl) {
                this.messageEl.style.display = "flex";
                const h2 = this.messageEl.querySelector("h2");
                const p = this.messageEl.querySelector("p");
                if (h2) h2.textContent = "Camera Access Failed";
                if (p) p.textContent = "Webcam permission was denied or device is unavailable. Please check settings and retry.";
            }
            return false;
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.updateStatus(CAMERA_STATES.OFFLINE);
    }
}
