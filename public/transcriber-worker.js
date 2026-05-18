import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

env.allowLocalModels = false;
env.useBrowserCache = true;

// Optimisé pour Intel Core i7-8650U (8 threads logiques) - Performance maximale
env.backends.onnx.wasm.numThreads = 8;

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
      chunk_length_s: 180,  // Gros chunks pour réduire les itérations (i7-8650U peut gérer)
      stride_length_s: 3,   // Petit overlap pour meilleure couverture
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
