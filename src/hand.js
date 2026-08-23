import {
  FilesetResolver,
  HandLandmarker
} from "@mediapipe/tasks-vision";

let handLandmarker;

function setLoadingStatus(message) {
  const status = document.getElementById("loading-status");

  if (status) {
    status.textContent = message;
  }

  console.log(message);
}

export async function initHand() {
  try {
    setLoadingStatus("Loading MediaPipe WASM...");

    const vision = await FilesetResolver.forVisionTasks(
      "/mediapipe/wasm"
    );

    setLoadingStatus("MediaPipe WASM loaded ✓");

    setLoadingStatus("Loading hand tracking model... \n (This make take a while)");

    handLandmarker =
      await HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: "/models/hand_landmarker.task"
          },

          runningMode: "VIDEO",

          numHands: 1
        }
      );

    setLoadingStatus("Hand tracking ready ✓");

    console.log("MediaPipe ready");

  } catch (error) {
    setLoadingStatus("MediaPipe failed ✕");
    console.error("MediaPipe initialization failed:", error);

    throw error;
  }
}

export function detectHand(video, time) {
  if (!handLandmarker)
    return null;

  const result =
    handLandmarker.detectForVideo(
      video,
      time
    );

  if (result.landmarks.length > 0) {
    return result.landmarks[0];
  }

  return null;
}