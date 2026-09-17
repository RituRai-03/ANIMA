// ============================================================
// Gesture Classifier & Spatial Math Engine
// ============================================================

export function calculate3DDistance(p1, p2) {
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + dz ** 2);
}

export function isFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx, wristIdx = 0) {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];
    const wrist = landmarks[wristIdx];

    const distTipWrist = calculate3DDistance(tip, wrist);
    const distPipWrist = calculate3DDistance(pip, wrist);

    const distTipMcp = calculate3DDistance(tip, mcp);
    const distPipMcp = calculate3DDistance(pip, mcp);

    return distTipWrist > distPipWrist && distTipMcp > distPipMcp;
}

export function isThumbExtended(landmarks) {
    const thumbTip = landmarks[4];
    const pinkyMcp = landmarks[17];
    const indexMcp = landmarks[5];
    const wrist = landmarks[0];

    const distToPinky = calculate3DDistance(thumbTip, pinkyMcp);
    const distToIdx = calculate3DDistance(thumbTip, indexMcp);
    const distToWrist = calculate3DDistance(thumbTip, wrist);

    return distToPinky > 0.23 || (distToIdx > 0.14 && distToWrist > 0.20);
}

export function classifyHandGesture(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    const pinchDist = calculate3DDistance(thumbTip, indexTip);

    // 1. PINCH
    if (pinchDist < 0.065) {
        return { gesture: "PINCH", pinchDist };
    }

    const indexExt = isFingerExtended(landmarks, 8, 6, 5);
    const middleExt = isFingerExtended(landmarks, 12, 10, 9);
    const ringExt = isFingerExtended(landmarks, 16, 14, 13);
    const pinkyExt = isFingerExtended(landmarks, 20, 18, 17);
    const thumbExt = isThumbExtended(landmarks);

    const extCount = (indexExt ? 1 : 0) + (middleExt ? 1 : 0) + (ringExt ? 1 : 0) + (pinkyExt ? 1 : 0);

    // 2. OPEN PALM
    if (extCount >= 4 || (extCount === 4 && thumbExt)) {
        return { gesture: "OPEN_PALM", pinchDist };
    }

    // 3. FIST
    if (extCount === 0 && !thumbExt) {
        return { gesture: "FIST", pinchDist };
    }

    // 4. POINT
    if (indexExt && !middleExt && !ringExt && !pinkyExt) {
        return { gesture: "POINT", pinchDist };
    }

    // 5. PEACE
    if (indexExt && middleExt && !ringExt && !pinkyExt) {
        return { gesture: "PEACE", pinchDist };
    }

    // 6. ROCK / METAL (or WEB POSE if middle+ring curled & thumb extended)
    if (indexExt && pinkyExt && !middleExt && !ringExt) {
        if (thumbExt) {
            return { gesture: "WEB_POSE", pinchDist };
        }
        return { gesture: "ROCK", pinchDist };
    }

    // 7. THUMBS UP / DOWN
    if (extCount === 0 && thumbExt) {
        const thumbMcp = landmarks[2];
        if (thumbTip.y < thumbMcp.y - 0.04) {
            return { gesture: "THUMBS_UP", pinchDist };
        } else if (thumbTip.y > thumbMcp.y + 0.04) {
            return { gesture: "THUMBS_DOWN", pinchDist };
        }
    }

    return { gesture: "IDLE", pinchDist };
}

export function getLandmarkPx(lm, w, h) {
    return {
        x: (1 - lm.x) * w,
        y: lm.y * h
    };
}

export function getPalmCenterPx(landmarks, w, h) {
    const wrist = landmarks[0];
    const idxMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    const cx = ((1 - wrist.x) + (1 - idxMcp.x) + (1 - pinkyMcp.x)) / 3.0 * w;
    const cy = (wrist.y + idxMcp.y + pinkyMcp.y) / 3.0 * h;

    return { x: cx, y: cy };
}
