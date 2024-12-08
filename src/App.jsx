import React, { useState, useEffect } from "react";
import "./App.css";
import { FolderComponent } from "./FolderComponent/FolderComponent";

let fileIdCounter = 0;
let nextClientId = 1;

const App = () => {
  const [clients, setClients] = useState([]);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [timeTicker, setTimeTicker] = useState(0);

  const [assignedFiles, setAssignedFiles] = useState({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  });
  useEffect(() => {
    let interval = null;
    if (isSimulationRunning) {
      interval = setInterval(() => {
        setTimeTicker((prev) => prev + 1);
      }, 500);
    } else if (!isSimulationRunning && interval !== null) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSimulationRunning]);

  const generateRandomFileSize = () => {
    const size = Math.floor(Math.random() * (1e12 - 1e3 + 1)) + 1e3;
    if (size < 1e6) return `${(size / 1e3).toFixed(2)} KB`;
    if (size < 1e9) return `${(size / 1e6).toFixed(2)} MB`;
    return `${(size / 1e9).toFixed(2)} GB`;
  };

  const addClient = () => {
    const numFiles = Math.floor(Math.random() * 5) + 1;
    const files = Array.from({ length: numFiles }, () => ({
      id: ++fileIdCounter,
      size: generateRandomFileSize(),
      inProgress: false,
    })).sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    const newClientId = nextClientId++;

    const newClient = {
      id: newClientId,
      files,
      startTime: Date.now(),
    };

    setClients((prev) => [...prev, newClient]);
    setUpdateTrigger((prev) => prev + 1);
  };

  const onFileProcessed = (processedFile) => {
    const { clientId, fileId } = processedFile;

    setClients((prevClients) =>
      prevClients
        .map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              files: client.files.filter((file) => file.id !== fileId),
            };
          }
          return client;
        })
        .filter((client) => client.files.length > 0)
    );

    let folderIdToFree = null;
    for (let i = 1; i <= 5; i++) {
      if (assignedFiles[i]?.fileId === fileId) {
        folderIdToFree = i;
        break;
      }
    }

    if (folderIdToFree) {
      setAssignedFiles((prev) => ({
        ...prev,
        [folderIdToFree]: null,
      }));
    }

    setUpdateTrigger((prev) => prev + 1);
  };

  const toggleSimulation = () => {
    setIsSimulationRunning((prev) => !prev);
    setUpdateTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (isSimulationRunning) {
      let localClients = structuredClone(clients);
      let updatedAssignedFiles = { ...assignedFiles };
      let changed = false;

      for (let folderId = 1; folderId <= 5; folderId++) {
        if (!updatedAssignedFiles[folderId]) {
          const { file, updatedClients } = findNextFile(localClients);
          if (file) {
            updatedAssignedFiles[folderId] = file;
            localClients = updatedClients;
            changed = true;
          }
        }
      }

      if (changed) {
        setClients(localClients);
        setAssignedFiles(updatedAssignedFiles);
      }
    }
  }, [isSimulationRunning, updateTrigger]);

  function findNextFile(localClients) {
    const clientPriorities = localClients
      .filter((client) => client.files.some((f) => !f.inProgress))
      .map((client) => {
        const fileToProcess = client.files.find((f) => !f.inProgress);
        if (!fileToProcess) return null;

        const fileSize = parseFloat(fileToProcess.size);
        const waitingTime = (Date.now() - client.startTime) / 1000;
        const priority =
          clients.length / fileSize + waitingTime / clients.length;
        return { client, fileToProcess, priority };
      })
      .filter(Boolean);

    if (clientPriorities.length === 0)
      return { file: null, updatedClients: localClients };

    const highestPriorityClient = clientPriorities.reduce((max, curr) =>
      curr.priority > max.priority ? curr : max
    );
    const { client, fileToProcess } = highestPriorityClient;

    // Ustawiamy inProgress na lokalnej kopii
    const updatedClients = localClients.map((c) => {
      if (c.id === client.id) {
        return {
          ...c,
          files: c.files.map((f) =>
            f.id === fileToProcess.id ? { ...f, inProgress: true } : f
          ),
        };
      }
      return c;
    });

    return {
      file: {
        clientId: client.id,
        fileId: fileToProcess.id,
        size: fileToProcess.size,
      },
      updatedClients,
    };
  }

  return (
    <div className="page-container">
      <header className="header">
        <img src="/folder-svgrepo-com.svg" alt="logo" />
        <h5>Symulacja przesyłania plików</h5>
      </header>

      <div className="grid-container">
        {Array(5)
          .fill(null)
          .map((_, index) => (
            <FolderComponent
              key={index}
              id={index + 1}
              isSimulationRunning={isSimulationRunning}
              currentFile={assignedFiles[index + 1]}
              onFileProcessed={onFileProcessed}
            />
          ))}
      </div>

      <div style={{ margin: "20px" }}>
        <button
          onClick={toggleSimulation}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: isSimulationRunning ? "#d9534f" : "#5cb85c",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {isSimulationRunning ? "Zatrzymaj" : "Rozpocznij"}
        </button>
        <button
          onClick={addClient}
          disabled={!isSimulationRunning}
          style={{
            padding: "10px 20px",
            backgroundColor: isSimulationRunning ? "#0275d8" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isSimulationRunning ? "pointer" : "not-allowed",
          }}
        >
          Dodaj klienta
        </button>
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid black", padding: "10px" }}>
              ID Klienta
            </th>
            <th style={{ border: "1px solid black", padding: "10px" }}>
              Pliki
            </th>
            <th style={{ border: "1px solid black", padding: "10px" }}>
              Czas oczekiwania (s)
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={`client-${client.id}`}>
              <td
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                {client.id}
              </td>
              <td
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                {client.files
                  .map((f) => f.size + (f.inProgress ? " (inProgress)" : ""))
                  .join(", ")}
              </td>
              <td
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                {((Date.now() - client.startTime) / 1000).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
