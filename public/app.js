const input = document.querySelector("#audio-input");
const pickBtn = document.querySelector("#pick-btn");
const statusEl = document.querySelector("#status");
const outputEl = document.querySelector("#output");
const fileNameEl = document.querySelector("#file-name");
const copyBtn = document.querySelector("#copy-btn");
const worker = new Worker("./transcriber-worker.js", { type: "module" });

let pendingResolve = null;
let pendingReject = null;

worker.addEventListener("message", (event) => {
  const { type, message, text, progress, language } = event.data || {};

  if (type === "status") {
    setStatus(message, "pending");
    return;
  }

  if (type === "download") {
    if (progress?.status === "downloading") {
      const percent = progress.progress ? Math.round(progress.progress) : 0;
      setStatus(`Telechargement du modele... ${percent}%`, "pending");
    }
    return;
  }

  if (type === "result" && pendingResolve) {
    pendingResolve({ text, language });
    pendingResolve = null;
    pendingReject = null;
    return;
  }

  if (type === "error" && pendingReject) {
    pendingReject(new Error(message));
    pendingResolve = null;
    pendingReject = null;
  }
});

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.classList.remove("pending", "error");
  if (type) {
    statusEl.classList.add(type);
  }
}

function showFileName(file) {
  fileNameEl.textContent = file ? `Fichier: ${file.name}` : "Aucun fichier selectionne";
}

async function decodeAudioFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext({ sampleRate: 16000 });

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const channelData = audioBuffer.numberOfChannels > 1
      ? mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0);

    return resampleAudio(channelData, audioBuffer.sampleRate, 16000);
  } finally {
    await audioContext.close();
  }
}

function mixToMono(audioBuffer) {
  const length = audioBuffer.length;
  const output = new Float32Array(length);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      output[index] += data[index] / audioBuffer.numberOfChannels;
    }
  }

  return output;
}

function resampleAudio(samples, inputRate, targetRate) {
  if (inputRate === targetRate) {
    return samples;
  }

  const ratio = inputRate / targetRate;
  const outputLength = Math.round(samples.length / ratio);
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, samples.length - 1);
    const weight = position - left;
    output[index] = samples[left] * (1 - weight) + samples[right] * weight;
  }

  return output;
}

function transcribeInWorker(audio, language) {
  return new Promise((resolve, reject) => {
    pendingResolve = resolve;
    pendingReject = reject;
    worker.postMessage({ type: "transcribe", audio, language });
  });
}

async function transcribeSelectedFile() {
  const file = input.files[0];
  if (!file) {
    setStatus("Choisis un fichier MP3.", "error");
    return;
  }

  showFileName(file);
  pickBtn.disabled = true;
  copyBtn.disabled = true;
  outputEl.textContent = "";
  setStatus("Preparation de l'audio...", "pending");

  try {
    const audio = await decodeAudioFile(file);
    const result = await transcribeInWorker(audio, "");
    outputEl.textContent = result.text || "Aucun texte renvoye.";
    copyBtn.disabled = false;
    setStatus("Termine (auto)");
  } catch (error) {
    setStatus(error.message, "error");
    outputEl.textContent = "La transcription a echoue.";
  } finally {
    pickBtn.disabled = false;
  }
}

pickBtn.addEventListener("click", () => {
  input.click();
});

input.addEventListener("change", () => {
  transcribeSelectedFile();
});

copyBtn.addEventListener("click", async () => {
  if (!outputEl.textContent || outputEl.textContent === "Le texte apparaitra ici.") {
    return;
  }

  try {
    await navigator.clipboard.writeText(outputEl.textContent);
    copyBtn.textContent = "Copie";
    setTimeout(() => {
      copyBtn.textContent = "Copier";
    }, 1200);
  } catch {
    copyBtn.textContent = "Echec copie";
    setTimeout(() => {
      copyBtn.textContent = "Copier";
    }, 1200);
  }
});
