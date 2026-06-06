import { useState, useRef } from 'react';
import { UploadCloud, FileText, X, CheckCircle, AlertTriangle, XCircle, Search, Server } from 'lucide-react';
import Button from '../components/ui/Button';
import styles from './Upload.module.css';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const docxFiles = newFiles.filter(f => f.name.endsWith('.docx'));
    if (docxFiles.length !== newFiles.length) {
      alert("Chỉ chấp nhận file .docx. Các file định dạng khác đã bị loại bỏ.");
    }
    setFiles(prev => [...prev, ...docxFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setResults(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/api/reports/upload-batch', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Có lỗi xảy ra');
      }
      
      setResults(data);
      setFiles([]); // Clear selected files on success
    } catch (error) {
      alert("Lỗi kết nối máy chủ: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.uploadPage}>
      
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div 
          className={`${styles.dropZone} ${isDragging ? styles.dragActive : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadCloud className={styles.dropIcon} size={48} />
          <h3 className={styles.dropText}>Kéo thả file .docx vào đây</h3>
          <p className={styles.dropSubtext}>Hỗ trợ xử lý đa luồng hàng loạt file</p>
          
          <div className={styles.divider}>hoặc</div>
          
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Chọn file từ máy tính
          </Button>
          
          <input 
            type="file" 
            multiple 
            accept=".docx" 
            className={styles.fileInput} 
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
        </div>

        {files.length > 0 && (
          <div className={styles.fileList}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{files.length} file đã chọn</span>
              <Button size="sm" variant="ghost" onClick={() => setFiles([])}>Xóa tất cả</Button>
            </div>
            
            {files.map((file, idx) => (
              <div key={idx} className={styles.fileItem}>
                <FileText className={styles.fileIcon} size={20} />
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{formatSize(file.size)}</div>
                </div>
                <button className={styles.removeBtn} onClick={() => removeFile(idx)}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button 
          size="lg" 
          onClick={handleProcess} 
          disabled={files.length === 0 || processing}
          loading={processing}
          icon={Server}
        >
          {processing ? `Đang xử lý ${files.length} file...` : 'Xử lý & Lưu vào DB'}
        </Button>
      </div>

      {/* Right Panel */}
      <div className={styles.resultsFeed}>
        <div className={styles.resultsHeader}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Kết quả xử lý</h3>
          {results && (
            <div className={styles.summaryBanner}>
              <span className={styles.summarySuccess}>✅ {results.success} thành công</span>
              <span className={styles.summaryWarning}>⚠️ {results.failed} lỗi/bỏ qua</span>
            </div>
          )}
        </div>

        {results ? (
          <div className={styles.resultsList}>
            {results.data.map((res, idx) => {
              const isSuccess = res.status === 'Thành công';
              const isSkip = res.status === 'Đã tồn tại, bỏ qua';
              const Icon = isSuccess ? CheckCircle : isSkip ? AlertTriangle : XCircle;
              const iconColor = isSuccess ? 'var(--success)' : isSkip ? 'var(--warning)' : 'var(--error)';

              return (
                <div key={idx} className={styles.resultItem}>
                  <div className={styles.resultTop}>
                    <Icon className={styles.resultIcon} size={20} color={iconColor} />
                    <span className={styles.resultFileName}>{res.file_name}</span>
                  </div>
                  
                  {isSuccess ? (
                    <div className={styles.resultDetails}>
                      <span>{res.registration_no}</span>
                      <span className={styles.dot}>•</span>
                      <span>{res.owner_name}</span>
                      <span className={styles.dot}>•</span>
                      <span>{res.province_code}</span>
                      <span className={styles.dot}>•</span>
                      <span>Lmax {res.lmax}m</span>
                      <span className={styles.dot}>•</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{res.inspection_type}</span>
                    </div>
                  ) : (
                    <div className={styles.resultDetails} style={{ color: iconColor }}>
                      {res.error || res.status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Search className={styles.emptyIcon} />
            <p>Chưa có file nào được tải lên hôm nay</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Kéo thả file vào khu vực bên trái để bắt đầu</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default Upload;
