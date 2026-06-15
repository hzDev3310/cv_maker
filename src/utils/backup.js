import { exportBackupPayload, restoreBackupPayload } from "./storage";

function toBackupFilename(ts = Date.now()) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `cv-builder-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}

export function buildBackupBlob() {
  const payload = exportBackupPayload();
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
}

export async function saveBackupFile() {
  const blob = buildBackupBlob();
  const filename = toBackupFilename();

  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      startIn: "documents",
      types: [
        {
          description: "CV Builder backup",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return filename;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return filename;
}

export async function readBackupFile(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  if (!payload || payload.app !== "cv-builder") {
    throw new Error("Invalid backup file.");
  }
  return payload;
}

export function applyBackupPayload(payload) {
  return restoreBackupPayload(payload);
}

