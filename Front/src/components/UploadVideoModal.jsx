// src/components/UploadVideoModal.jsx
import { useState } from 'react';
import {useNavigate} from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { getToken } from '../utils/tokenUtils';
import './UploadVideoModal.css';

const UploadVideoModal = ({ isOpen, onClose, onUploaded }) => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!file) return setError('⚠️ Select a video file first');

      setLoading(true);
      setError('');
      try {
          /* --- 예시 FormData 업로드 --- */
          const fd = new FormData();
          fd.append('video', file);
          fd.append('title', title);
          fd.append('description', desc);

          const token = getToken();
          await fetch(API_CONFIG.ENDPOINTS.UPLOAD_VIDEO, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`
              },
              body: fd
          });
          onUploaded?.();
          onClose();
      } catch (err) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

    return (
        <div className="uvm-overlay" onClick={onClose}>
            <div className="uvm-card" onClick={(e) => e.stopPropagation()}>
                <h2>Upload Video</h2>

                <form onSubmit={handleSubmit} className="uvm-form">
                    <label className="uvm-label">
                        Video File
                        <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])} />
                    </label>

                    <label className="uvm-label">
                        Title
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </label>

                    <label className="uvm-label">
                        Description
                        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
                    </label>

                    {error && <p className="uvm-error">{error}</p>}

                    <div className="uvm-actions">
                        <button type="button" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Uploading…' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadVideoModal;
