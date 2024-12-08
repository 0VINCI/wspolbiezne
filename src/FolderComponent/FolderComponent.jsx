import React, { useState, useEffect } from "react";
import "./FolderComponent.css";

export const FolderComponent = ({
  id,
  isSimulationRunning,
  currentFile,
  onFileProcessed,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isSimulationRunning && currentFile) {
      const fileSizeStr = currentFile.size;
      let fileSizeInGB;
      if (fileSizeStr.includes("GB")) {
        fileSizeInGB = parseFloat(fileSizeStr);
      } else if (fileSizeStr.includes("MB")) {
        fileSizeInGB = parseFloat(fileSizeStr) / 1024;
      } else {
        fileSizeInGB = parseFloat(fileSizeStr) / (1024 * 1024);
      }

      const totalTime = (fileSizeInGB / 100) * 3 * 1000;
      const intervalTime = totalTime / 100;
      let interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            onFileProcessed(currentFile);
            return 0;
          }
          return prev + 1;
        });
      }, intervalTime);

      return () => clearInterval(interval);
    }
  }, [isSimulationRunning, currentFile, onFileProcessed, id]);

  return (
    <div className="card">
      <h2>{`Katalog ${id}`}</h2>
      {currentFile ? (
        <div>
          <p>{`Przetwarzanie pliku: ${currentFile.size}`}</p>
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
            >
              {progress > 0 && <span>{`${Math.round(progress)}%`}</span>}
            </div>
          </div>
        </div>
      ) : (
        <p>Oczekiwanie na plik...</p>
      )}
    </div>
  );
};
