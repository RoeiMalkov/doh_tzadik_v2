import { useState } from 'react';

export default function NameModal({ isOpen, onClose, onSubmit, showName }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (showName && !name.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    onSubmit(name);
    setName("");
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {showName ? (
          <>
            <h3>Enter Your Name</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
            />
            {error && <p className="error">{error}</p>}
          </>
        ) : (
          <h3>Confirm Submission</h3>
        )}
        <div className="modal-buttons">
          <button onClick={handleSubmit}>
            Submit
          </button>
          <button onClick={() => {
            onClose();
            setName("");
            setError("");
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}