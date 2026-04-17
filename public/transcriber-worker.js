import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

env.allowLocalModels = false;
env.useBrowserCache = true;

env.backends.onnx.wasm.numThreads = 1;

env.backends.onnx.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/";

let transcriberPromise;

async function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
      progress_callback: (progress) => {
        self.postMessage({ type: "download", progress });
      }
    });
  }

  return transcriberPromise;
}

self.onmessage = async (event) => {
  if (event.data?.type !== "transcribe") {
    return;
  }

  try {
    self.postMessage({ type: "status", message: "Chargement du modele Whisper..." });
    const transcriber = await getTranscriber();

    self.postMessage({ type: "status", message: "Transcription en cours..." });
    const result = await transcriber(event.data.audio, {
      language: event.data.language || null,
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false
    });

    self.postMessage({
      type: "result",
      text: result.text?.trim() || "",
      language: event.data.language || "auto"
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error?.message || "La transcription locale a echoue."
    });
  }
};
