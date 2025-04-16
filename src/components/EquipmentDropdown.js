import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';

const equipmentOptions = ["039", "085", "082", "091", "129", "064", "054", "אולרים", "מק", "כרטיסים", "אחר"];
const CLEAR_PASSWORD = "9363335";

const equipmentTranslations = {
  "Olrarim": "אולרים",
  "MK": "מק",
  "Cartisim": "כרטיסים"
};

export default function EquipmentDropdown() {
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [serials, setSerials] = useState([]);
  const [checkedSerials, setCheckedSerials] = useState({});
  const [customSerial, setCustomSerial] = useState("");
  const [logs, setLogs] = useState([]);
  const [copyText, setCopyText] = useState("");
  const [allEquipmentData, setAllEquipmentData] = useState({});
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Load all equipment data
  useEffect(() => {
    const loadEquipmentData = async () => {
      const data = {};
      for (const equipment of equipmentOptions.filter(opt => opt !== "Other")) {
        const docRef = doc(db, "equipment", equipment);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          data[equipment] = docSnap.data().serials || [];
        }
      }
      setAllEquipmentData(data);
    };
    loadEquipmentData();
  }, []);

  // Update serials when selection changes
  useEffect(() => {
    if (!selectedEquipment) {
      setSerials([]);
      return;
    }
    
    if (selectedEquipment === "Other") {
      setSerials([]);
    } else {
      setSerials(allEquipmentData[selectedEquipment] || []);
    }
    setCheckedSerials({});
    setCustomSerial("");
  }, [selectedEquipment, allEquipmentData]);

  // Subscribe to logs updates
  useEffect(() => {
    const q = collection(db, "equipment_logs");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logsData = [];
      querySnapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logsData);
      updateCopyText(logsData);
    });
    return unsubscribe;
  }, [allEquipmentData]);

  const handleCheckboxChange = (serial) => {
    setCheckedSerials(prev => ({
      ...prev,
      [serial]: !prev[serial]
    }));
  };

  const handleAddCustomSerial = () => {
    if (customSerial.trim() && !serials.includes(customSerial.trim())) {
      setSerials(prev => [...prev, customSerial.trim()]);
      setCustomSerial("");
    }
  };

  const saveToFirestore = async () => {
    // Get current document
    const docRef = doc(db, "equipment_logs", selectedEquipment);
    const docSnap = await getDoc(docRef);
    const currentData = docSnap.exists() ? docSnap.data() : null;
    const currentSerials = currentData?.checkedSerials || [];

    // Calculate changes
    const selectedSerials = Object.keys(checkedSerials).filter(serial => checkedSerials[serial]);
    const newlyChecked = selectedSerials.filter(serial => !currentSerials.includes(serial));
    const newlyUnchecked = currentSerials.filter(serial => checkedSerials[serial] === false);

    // No changes case
    if (newlyChecked.length === 0 && newlyUnchecked.length === 0) {
      alert("No changes detected");
      return;
    }

    // Update checked serials
    const updatedCheckedSerials = [
      ...currentSerials.filter(serial => !newlyUnchecked.includes(serial)),
      ...newlyChecked
    ];

    await setDoc(docRef, {
      equipment: selectedEquipment,
      checkedSerials: updatedCheckedSerials,
      timestamp: new Date()
    }, { merge: true });

    setCheckedSerials({});
    alert("Changes saved successfully!");
  };

  const clearDatabase = async () => {
    setShowPasswordInput(true);
  };

  const confirmClearDatabase = async () => {
    if (password !== CLEAR_PASSWORD) {
      alert("Incorrect password");
      return;
    }

    if (window.confirm("Are you sure you want to clear all equipment logs?")) {
      try {
        const querySnapshot = await getDocs(collection(db, "equipment_logs"));
        const deletePromises = [];
        querySnapshot.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });
        await Promise.all(deletePromises);
        alert("Database cleared successfully!");
        setPassword("");
        setShowPasswordInput(false);
      } catch (error) {
        console.error("Error clearing database: ", error);
        alert("Error clearing database");
      }
    }
  };

  const updateCopyText = (logsData) => {
    let text = "";
    
    logsData.forEach(log => {
      if (log.checkedSerials?.length > 0) {
        // Translate equipment name if needed
        const equipmentName = equipmentTranslations[log.equipment] || log.equipment;
        text += `${equipmentName}\n`;

        // Get the original serials list to determine correct labels
        const originalSerials = log.equipment === "Other" 
          ? [] 
          : allEquipmentData[log.equipment] || [];

        log.checkedSerials.forEach((serial) => {
          if (["Olrarim", "MK", "Cartisim", "Other"].includes(log.equipment)) {
            text += `${serial}\n`;
          } else if (log.equipment === "129") {
            const index = originalSerials.indexOf(serial);
            text += `${index === 0 ? "סיאף" : "מבן"}: ${serial}\n`;
          } else {
            const index = originalSerials.indexOf(serial);
            text += `${index === 0 ? "יעט" : "מבן"}: ${serial}\n`;
          }
        });
        text += "\n";
      }
    });

    setCopyText(text);
  };

  return (
    <div className="equipment-tracker">
      <h1>דוח צ</h1>
      
      <div className="selector-container">
        <h2>בחר צופן</h2>
        <select
          value={selectedEquipment}
          onChange={(e) => setSelectedEquipment(e.target.value)}
        >
          <option value="">-- Select --</option>
          {equipmentOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {selectedEquipment && (
        <div className="serials-container">
          <h3>Serial Numbers:</h3>
          
          {selectedEquipment === "Other" ? (
            <div className="custom-serial-section">
              <div className="custom-serial-input">
                <input
                  type="text"
                  value={customSerial}
                  onChange={(e) => setCustomSerial(e.target.value)}
                  placeholder="Enter custom serial number"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSerial()}
                />
                <button className="add-button" onClick={handleAddCustomSerial}>Add</button>
              </div>
              
              {serials.map((serial) => (
                <div key={serial} className="serial-item">
                  <input
                    type="checkbox"
                    id={`custom-${serial}`}
                    checked={checkedSerials[serial] || false}
                    onChange={() => handleCheckboxChange(serial)}
                  />
                  <label htmlFor={`custom-${serial}`}>
                    {serial}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            serials.map((serial) => (
              <div key={serial} className="serial-item">
                <input
                  type="checkbox"
                  id={serial}
                  checked={checkedSerials[serial] || false}
                  onChange={() => handleCheckboxChange(serial)}
                />
                <label htmlFor={serial}>
                  {!["Olrarim", "MK", "Cartisim"].includes(selectedEquipment) 
                    ? (selectedEquipment === "129" 
                        ? (serials.indexOf(serial) === 0 ? "סיאף" : "מבן")
                        : (serials.indexOf(serial) === 0 ? "יעט" : "מבן")
                      ) + `: ${serial}`
                    : serial
                  }
                </label>
              </div>
            ))
          )}
          
          <button 
            className="save-button"
            onClick={saveToFirestore}
            disabled={Object.keys(checkedSerials).filter(k => checkedSerials[k]).length === 0}
          >
            Save
          </button>
        </div>
      )}

      <div className="copy-area">
        <div className="copy-controls">
          <h3>דוח נוכחי:</h3>
          <button 
            className="clear-button"
            onClick={clearDatabase}
          >
            מחק הכל
          </button>
        </div>

        {showPasswordInput && (
          <div className="password-modal">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            <div className="password-buttons">
              <button className="confirm-button" onClick={confirmClearDatabase}>Confirm</button>
              <button className="cancel-button" onClick={() => setShowPasswordInput(false)}>Cancel</button>
            </div>
          </div>
        )}

        <textarea 
          className="logs-textarea"
          value={copyText}
          readOnly
          onClick={(e) => e.target.select()}
        />
        <button 
          className="copy-button"
          onClick={() => {
            navigator.clipboard.writeText(copyText);
            alert("Copied to clipboard!");
          }}
        >
          העתק דוח
        </button>
      </div>
    </div>
  );
}