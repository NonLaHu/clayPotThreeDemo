import {
  FilesetResolver,
  HandLandmarker
} from "@mediapipe/tasks-vision";


let handLandmarker;


export async function initHand(){

const vision =
await FilesetResolver.forVisionTasks(
  "/mediapipe/wasm"
);


  handLandmarker =
    await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions:{
modelAssetPath:
"/models/hand_landmarker.task"
        },

        runningMode:"VIDEO",

        numHands:1
      }
    );


  console.log(
    "MediaPipe ready"
  );

}



export function detectHand(
  video,
  time
){

  if(!handLandmarker)
    return null;


  const result =
    handLandmarker.detectForVideo(
      video,
      time
    );


  if(
    result.landmarks.length > 0
  ){

    return result.landmarks[0];

  }


  return null;

}