import React, { useState, useEffect } from 'react';
import { BarChart2, Info, AlertTriangle, FileSpreadsheet, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import styles from './ReportGenerate.module.css';

const PROVINCES = [
  { code: 'QN', name: 'Quảng Ninh', count: 84 },
  { code: 'TH', name: 'Thanh Hóa', count: 31 },
  { code: 'HT', name: 'Hà Tĩnh', count: 12 },
  { code: 'NA', name: 'Nghệ An', count: 0 },
  { code: 'QB', name: 'Quảng Bình', count: 5 },
  { code: 'QT', name: 'Quảng Trị', count: 7 },
];

const ReportGenerate = () => {
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(2026);
  const [selectedProvinces, setSelectedProvinces] = useState(['QN', 'TH', 'HT', 'QB', 'QT']);
  const [formats, setFormats] = useState({ detail: true, summary: true });
  const [status, setStatus] = useState('idle'); // idle, loading, success

  const totalRecords = PROVINCES.filter(p => selectedProvinces.includes(p.code)).reduce((sum, p) => sum + p.count, 0);

  const handleSelectAll = () => {
    setSelectedProvinces(PROVINCES.map(p => p.code));
  };

  const handleDeselectAll = () => {
    setSelectedProvinces([]);
  };

  const handleToggleProvince = (code) => {
    setSelectedProvinces(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleGenerate = () => {
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  return (
    <div className={styles.generatePage}>
      
      {status === 'success' ? (
        <div className={styles.successBanner}>
          <CheckCircle2 className={styles.successIcon} />
          <h2 className={styles.successTitle}>Báo cáo tạo thành công</h2>
          <p className={styles.successDesc}>
            Đã tổng hợp <strong>{totalRecords} tàu</strong> · <strong>{selectedProvinces.length} tỉnh</strong> · <strong>Quý {['I', 'II', 'III', 'IV'][quarter-1]}/{year}</strong>
          </p>
          
          <div className={styles.downloadActions}>
            <Button variant="primary" icon={Download}>
              Tải Bảng kê tổng hợp
            </Button>
            <Button variant="secondary" icon={Download}>
              Tải Báo cáo quý
            </Button>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <Button variant="ghost" onClick={() => setStatus('idle')} icon={RefreshCw}>
              Tạo báo cáo khác
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Section A */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Chọn kỳ báo cáo</h2>
            
            <div className={styles.quarterSelector}>
              {[1, 2, 3, 4].map(q => (
                <button 
                  key={q}
                  className={`${styles.quarterBtn} ${quarter === q ? styles.quarterBtnActive : ''}`}
                  onClick={() => setQuarter(q)}
                >
                  Quý {['I', 'II', 'III', 'IV'][q-1]}
                </button>
              ))}
            </div>

            <div className={styles.yearInput}>
              <Input 
                type="number" 
                label="Năm" 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))} 
              />
            </div>

            {totalRecords > 0 ? (
              <div className={styles.infoBox}>
                <BarChart2 className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <strong>Quý {['I', 'II', 'III', 'IV'][quarter-1]}/{year}</strong>: Dữ liệu từ {quarter === 1 ? '01/01' : quarter === 2 ? '01/04' : quarter === 3 ? '01/07' : '01/10'}/{year} đến {quarter === 1 ? '31/03' : quarter === 2 ? '30/06' : quarter === 3 ? '30/09' : '31/12'}/{year}.<br/>
                  Hiện có <strong>{totalRecords} bản ghi</strong> trong DB cho kỳ này.
                </div>
              </div>
            ) : (
              <div className={styles.warningBox}>
                <AlertTriangle size={20} />
                Không có dữ liệu cho kỳ này. Hãy upload hồ sơ trước.
              </div>
            )}
          </div>

          {/* Section B */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Chọn tỉnh báo cáo</h2>
            
            <div className={styles.selectionActions}>
              <span>Đã chọn {selectedProvinces.length} tỉnh · {totalRecords} bản ghi</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span className={styles.selectLink} onClick={handleSelectAll}>Chọn tất cả</span>
                <span className={styles.selectLink} onClick={handleDeselectAll}>Bỏ chọn tất cả</span>
              </div>
            </div>

            <div className={styles.provinceGrid}>
              {PROVINCES.map(prov => {
                const checked = selectedProvinces.includes(prov.code);
                return (
                  <label key={prov.code} className={`${styles.provinceCheckbox} ${checked ? styles.checked : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput} 
                      checked={checked}
                      onChange={() => handleToggleProvince(prov.code)}
                    />
                    <span className={styles.provinceLabel}>{prov.name}</span>
                    <span className={styles.provinceCount}>{prov.count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Area */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Định dạng đầu ra</h2>
            
            <div className={styles.formatCards}>
              <div 
                className={`${styles.formatCard} ${formats.detail ? styles.checked : ''}`}
                onClick={() => setFormats(prev => ({ ...prev, detail: !prev.detail }))}
              >
                <div style={{ marginTop: 2 }}>
                  <input type="checkbox" checked={formats.detail} readOnly className={styles.checkboxInput} />
                </div>
                <FileSpreadsheet className={styles.formatIcon} size={24} />
                <div className={styles.formatInfo}>
                  <span className={styles.formatTitle}>Bảng kê tổng hợp</span>
                  <span className={styles.formatDesc}>Danh sách chi tiết từng tàu theo thứ tự thời gian</span>
                </div>
              </div>
              
              <div 
                className={`${styles.formatCard} ${formats.summary ? styles.checked : ''}`}
                onClick={() => setFormats(prev => ({ ...prev, summary: !prev.summary }))}
              >
                <div style={{ marginTop: 2 }}>
                  <input type="checkbox" checked={formats.summary} readOnly className={styles.checkboxInput} />
                </div>
                <BarChart2 className={styles.formatIcon} size={24} />
                <div className={styles.formatInfo}>
                  <span className={styles.formatTitle}>Báo cáo quý theo tỉnh</span>
                  <span className={styles.formatDesc}>Thống kê phân loại theo tỉnh, nhóm Lmax và vật liệu</span>
                </div>
              </div>
            </div>

            <div className={styles.submitArea}>
              <Button 
                size="lg" 
                style={{ width: '100%' }} 
                icon={status === 'loading' ? null : RefreshCw}
                loading={status === 'loading'}
                disabled={selectedProvinces.length === 0 || (!formats.detail && !formats.summary) || totalRecords === 0}
                onClick={handleGenerate}
              >
                {status === 'loading' ? 'Đang tổng hợp dữ liệu từ DB...' : 'Tạo báo cáo & Tải xuống'}
              </Button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default ReportGenerate;
