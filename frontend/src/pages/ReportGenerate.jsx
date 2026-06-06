import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart2, CheckCircle2, Download, FileSpreadsheet, RefreshCw } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { downloadBlob, generateReportFromDb, getExportOptions } from '../api/reportApi';
import styles from './ReportGenerate.module.css';

const OUTPUT_TYPES = [
  {
    code: 'registry',
    key: 'detail',
    title: 'Bảng kê tổng hợp',
    desc: 'Danh sách chi tiết từng tàu theo thứ tự thời gian',
    icon: FileSpreadsheet,
  },
  {
    code: 'summary',
    key: 'summary',
    title: 'Báo cáo quý theo tỉnh',
    desc: 'Thống kê phân loại theo tỉnh, nhóm Lmax và vật liệu',
    icon: BarChart2,
  },
];

const quarterLabel = (quarter) => ['I', 'II', 'III', 'IV'][quarter - 1];

const ReportGenerate = () => {
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [options, setOptions] = useState({ total: 0, provinces: [] });
  const [selectedProvinces, setSelectedProvinces] = useState([]);
  const [formats, setFormats] = useState({ detail: true, summary: true });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchOptions = async () => {
      setStatus('loading-options');
      setError('');

      try {
        const data = await getExportOptions({ quarter, year });
        if (!active) return;
        setOptions(data);
        setSelectedProvinces((current) => {
          const validCodes = new Set((data.provinces || []).map((item) => item.code));
          const kept = current.filter((code) => validCodes.has(code));
          if (kept.length > 0) return kept;
          return (data.provinces || []).filter((item) => item.count > 0).map((item) => item.code);
        });
        setStatus('idle');
      } catch (err) {
        if (!active) return;
        setOptions({ total: 0, provinces: [] });
        setSelectedProvinces([]);
        setError(err.response?.data?.detail || 'Không tải được dữ liệu báo cáo từ CSDL.');
        setStatus('idle');
      }
    };

    fetchOptions();

    return () => {
      active = false;
    };
  }, [quarter, year]);

  const totalRecords = useMemo(
    () =>
      (options.provinces || [])
        .filter((province) => selectedProvinces.includes(province.code))
        .reduce((sum, province) => sum + (province.count || 0), 0),
    [options.provinces, selectedProvinces],
  );

  const selectedFileTypes = OUTPUT_TYPES.filter((type) => formats[type.key]).map((type) => type.code);

  const handleSelectAll = () => {
    setSelectedProvinces((options.provinces || []).map((province) => province.code));
  };

  const handleDeselectAll = () => {
    setSelectedProvinces([]);
  };

  const handleToggleProvince = (code) => {
    setSelectedProvinces((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  };

  const handleGenerate = async () => {
    setStatus('loading');
    setError('');

    try {
      const blob = await generateReportFromDb({
        quarter,
        year,
        provinces: selectedProvinces,
        fileTypes: selectedFileTypes,
        createdBy: 'Nguyen Thi Binh',
      });
      downloadBlob(blob, `report_q${quarter}_${year}.zip`);
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Không tạo được báo cáo.');
      setStatus('idle');
    }
  };

  const isLoading = status === 'loading' || status === 'loading-options';

  return (
    <div className={styles.generatePage}>
      {status === 'success' ? (
        <div className={styles.successBanner}>
          <CheckCircle2 className={styles.successIcon} />
          <h2 className={styles.successTitle}>Báo cáo tạo thành công</h2>
          <p className={styles.successDesc}>
            Đã tổng hợp <strong>{totalRecords} tàu</strong> · <strong>{selectedProvinces.length} tỉnh</strong> ·{' '}
            <strong>Quý {quarterLabel(quarter)}/{year}</strong>
          </p>

          <div className={styles.downloadActions}>
            <Button variant="primary" icon={Download} onClick={handleGenerate}>
              Tải lại file ZIP
            </Button>
            <Button variant="ghost" onClick={() => setStatus('idle')} icon={RefreshCw}>
              Tạo báo cáo khác
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Chọn kỳ báo cáo</h2>

            <div className={styles.quarterSelector}>
              {[1, 2, 3, 4].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`${styles.quarterBtn} ${quarter === item ? styles.quarterBtnActive : ''}`}
                  onClick={() => setQuarter(item)}
                >
                  Quý {quarterLabel(item)}
                </button>
              ))}
            </div>

            <div className={styles.yearInput}>
              <Input type="number" label="Năm" value={year} min="2000" max="2100" onChange={(e) => setYear(Number(e.target.value))} />
            </div>

            {totalRecords > 0 ? (
              <div className={styles.infoBox}>
                <BarChart2 className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <strong>Quý {quarterLabel(quarter)}/{year}</strong>
                  {options.period_start && <>: {options.period_start} đến {options.period_end}.</>}
                  <br />
                  Hiện có <strong>{totalRecords}</strong> bản ghi đã chọn trong DB.
                </div>
              </div>
            ) : (
              <div className={styles.warningBox}>
                <AlertTriangle size={20} />
                {status === 'loading-options' ? 'Đang tải dữ liệu...' : 'Không có dữ liệu cho lựa chọn hiện tại.'}
              </div>
            )}

            {error && (
              <div className={styles.warningBox}>
                <AlertTriangle size={20} />
                {error}
              </div>
            )}
          </div>

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
              {(options.provinces || []).map((province) => {
                const checked = selectedProvinces.includes(province.code);
                return (
                  <label key={province.code} className={`${styles.provinceCheckbox} ${checked ? styles.checked : ''}`}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={checked}
                      onChange={() => handleToggleProvince(province.code)}
                    />
                    <span className={styles.provinceLabel}>{province.name}</span>
                    <span className={styles.provinceCount}>{province.count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Định dạng đầu ra</h2>

            <div className={styles.formatCards}>
              {OUTPUT_TYPES.map((type) => {
                const Icon = type.icon;
                const checked = formats[type.key];
                return (
                  <div
                    key={type.code}
                    className={`${styles.formatCard} ${checked ? styles.checked : ''}`}
                    onClick={() => setFormats((current) => ({ ...current, [type.key]: !current[type.key] }))}
                  >
                    <div style={{ marginTop: 2 }}>
                      <input type="checkbox" checked={checked} readOnly className={styles.checkboxInput} />
                    </div>
                    <Icon className={styles.formatIcon} size={24} />
                    <div className={styles.formatInfo}>
                      <span className={styles.formatTitle}>{type.title}</span>
                      <span className={styles.formatDesc}>{type.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.submitArea}>
              <Button
                size="lg"
                style={{ width: '100%' }}
                icon={isLoading ? null : RefreshCw}
                loading={isLoading}
                disabled={selectedProvinces.length === 0 || selectedFileTypes.length === 0 || totalRecords === 0}
                onClick={handleGenerate}
              >
                {isLoading ? 'Đang xử lý dữ liệu...' : 'Tạo báo cáo & Tải xuống'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportGenerate;
