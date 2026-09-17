// ============================================================
// MediaPipe Hand Tracker Module
// ============================================================

export class HandTracker {
    constructor() {
        this.landmarker = null;
        this.isLoaded = false;
        this.lastVideoTime = -1;
    }

    async init(statusCallback) {
        try {
            if (statusCallback) statusCallback("LOADING HAND MODEL");

            const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm");
            const { HandLandmarker, FilesetResolver } = vision;

            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
            );

            this.landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                numHands: 2,
                minHandDetectionConfidence: 0.65,
                minHandPresenceConfidence: 0.65,
                minTrackingConfidence: 0.65,
                runningMode: "VIDEO"
            });

            this.isLoaded = true;
            if (statusCallback) statusCallback("TRACKER READY");
            return true;
        } catch (error) {
            console.error("HandLandmarker Initialization Error:", error);
            if (statusCallback) statusCallback("TRACKING ERROR");
            return false;
        }
    }

    detect(video) {
        if (!this.isLoaded || !this.landmarker || !video || video.readyState < 2) {
            return null;
        }

        const now = performance.now();
        return this.landmarker.detectForVideo(video, now);
    }
}
