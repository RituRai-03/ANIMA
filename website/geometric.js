const camera = document.getElementById("camera");
const startCamera = document.getElementById("start-camera");
const cameraMessage = document.getElementById("camera-message");
const trackingStatus = document.getElementById("tracking-status");

let handLandmarker = null;


// ============================================================
// MediaPipe Hand Tracking Initialization
// ============================================================

async function initializeHandTracking() {

    try {

        trackingStatus.textContent = "LOADING HAND TRACKING";

        const vision = await import(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm"
        );

        const { HandLandmarker, FilesetResolver } = vision;

        const filesetResolver =
            await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
            );

        handLandmarker =
            await HandLandmarker.createFromOptions(
                filesetResolver,
                {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",

                        delegate: "GPU"
                    },

                    numHands: 2,

                    minHandDetectionConfidence: 0.75,
                    minHandPresenceConfidence: 0.70,
                    minTrackingConfidence: 0.70,

                    runningMode: "VIDEO"
                }
            );

        trackingStatus.textContent =
            "HAND TRACKING READY";

        console.log(
            "MediaPipe Hand Landmarker ready."
        );

        detectHands();

    } catch (error) {

        console.error(
            "MediaPipe initialization failed:",
            error
        );

        trackingStatus.textContent =
            "TRACKING ERROR";

    }

}


// ============================================================
// Continuous Hand Detection
// ============================================================

function detectHands() {

    if (!handLandmarker || camera.readyState < 2) {

        requestAnimationFrame(detectHands);

        return;
    }


    const canvas =
        document.getElementById("ar-canvas");

    const ctx =
        canvas.getContext("2d");


    // Match canvas to camera resolution
    if (
        canvas.width !== camera.videoWidth ||
        canvas.height !== camera.videoHeight
    ) {

        canvas.width = camera.videoWidth;
        canvas.height = camera.videoHeight;

    }


    // Detect hands
    const results =
        handLandmarker.detectForVideo(
            camera,
            performance.now()
        );


    // Clear previous frame
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // --------------------------------------------------------
    // Draw detected landmarks
    // --------------------------------------------------------

    if (
        results.landmarks &&
        results.landmarks.length > 0
    ) {

        const handCount =
            results.landmarks.length;


        trackingStatus.textContent =
            `${handCount} HAND${handCount > 1 ? "S" : ""} DETECTED`;


        results.landmarks.forEach(
            (landmarks) => {

                landmarks.forEach(
                    (point) => {

                        const x =
                            point.x * canvas.width;

                        const y =
                            point.y * canvas.height;


                        ctx.beginPath();

                        ctx.arc(
                            x,
                            y,
                            4,
                            0,
                            Math.PI * 2
                        );


                        ctx.fillStyle =
                            "#78A9D6";

                        ctx.fill();

                    }
                );

            }
        );

    } else {

        trackingStatus.textContent =
            "NO HAND";

    }


    // Continue detection
    requestAnimationFrame(
        detectHands
    );

}


// ============================================================
// Webcam
// ============================================================

async function startWebcam() {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia(
                {
                    video: {
                        width: 960,
                        height: 540,
                        facingMode: "user"
                    },

                    audio: false
                }
            );


        camera.srcObject = stream;


        cameraMessage.style.display =
            "none";


        trackingStatus.textContent =
            "CAMERA READY";


        // Wait until the video has dimensions
        // before starting MediaPipe.
        if (camera.readyState < 2) {

            await new Promise(
                (resolve) => {

                    camera.addEventListener(
                        "loadeddata",
                        resolve,
                        { once: true }
                    );

                }
            );

        }


        await initializeHandTracking();

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        trackingStatus.textContent =
            "CAMERA ERROR";


        cameraMessage.style.display =
            "flex";


        cameraMessage.querySelector("h2").textContent =
            "Camera Access Failed";


        cameraMessage.querySelector("p").textContent =
            "Please allow camera access and try again.";

    }

}


// ============================================================
// Start Camera Button
// ============================================================

startCamera.addEventListener(
    "click",
    startWebcam
);