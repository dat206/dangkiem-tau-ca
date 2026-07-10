import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, Filter, Search, Trash2, X } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import styles from './Vessels.module.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

const FALLBACK_OPTIONS = {
  provinces: [],
  inspectionTypes: [
    { value: 'HN', label: 'Hàng năm (HN)' },
    { value: 'TĐ', label: 'Trên đà (TĐ)' },
    { value: 'ĐK', label: 'Định kỳ (ĐK)' },
    { value: 'GS', label: 'Giám sát (GS)' },
    { value: 'BT', label: 'Bất thường / cải hoán (BT)' },
    { value: 'ĐM', label: 'Lần đầu / đóng mới (ĐM)' },
  ],
  lengthGroups: [
    { value: 'duoi_12', label: '< 12m' },
    { value: 'L12_15', label: '12 - 15m' },
    { value: 'L15_20', label: '15 - 20m' },
    { value: 'L20_24', label: '20 - 24m' },
    { value: 'L24_30', label: '24 - 30m' },
    { value: 'L30_plus', label: '>= 30m' },
  ],
};

const inspectionBadgeVariant = (type) => {
  if (type === 'HN') return 'info';
  if (type === 'TĐ') return 'purple';
  if (type === 'ĐK') return 'success';
  if (type === 'GS') return 'teal';
  return 'warning';
};

const materialBadgeVariant = (material) => {
  if (material === 'Gỗ') return 'brown';
  if (material === 'Thép') return 'gray';
  if (material === 'FRP') return 'teal';
  return 'gray';
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return value;
};

const getDownloadName = (response) => {
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || 'du_lieu_tau.csv';
};

const Vessels = () => {
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [options, setOptions] = useState(FALLBACK_OPTIONS);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [prov, setProv] = useState('');
  const [type, setType] = useState('');
  const [length, setLength] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('skip', String((page - 1) * pageSize));
    params.set('limit', String(pageSize));
    if (search) params.set('search', search);
    if (prov) params.set('province_code', prov);
    if (type) params.set('inspection_type', type);
    if (length) params.set('length_group', length);
    return params;
  }, [length, page, pageSize, prov, search, type]);

  const exportParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (prov) params.set('province_code', prov);
    if (type) params.set('inspection_type', type);
    if (length) params.set('length_group', length);
    return params;
  }, [length, prov, search, type]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(total, page * pageSize);

  const visiblePages = useMemo(() => {
    const count = Math.min(pageCount, 5);
    const start = Math.max(1, Math.min(page - 2, pageCount - count + 1));
    return Array.from({ length: count }, (_, idx) => start + idx);
  }, [page, pageCount]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/vessels/?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`API trả về ${res.status}`);
      }
      const json = await res.json();
      setData(json.items || []);
      setTotal(json.total || 0);
      setCheckedIds(new Set()); // reset checkboxes khi load trang mới
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu tàu.');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/vessels/options`);
        if (!res.ok) return;
        const json = await res.json();
        setOptions({
          provinces: json.provinces || [],
          inspectionTypes: json.inspectionTypes?.length ? json.inspectionTypes : FALLBACK_OPTIONS.inspectionTypes,
          lengthGroups: json.lengthGroups?.length ? json.lengthGroups : FALLBACK_OPTIONS.lengthGroups,
        });
      } catch {
        setOptions(FALLBACK_OPTIONS);
      }
    };

    fetchOptions();
  }, []);

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setProv('');
    setType('');
    setLength('');
    setPage(1);
  };

  const updateProv = (value) => {
    setProv(value);
    setPage(1);
  };

  const updateType = (value) => {
    setType(value);
    setPage(1);
  };

  const updateLength = (value) => {
    setLength(value);
    setPage(1);
  };

  const updatePageSize = (value) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const downloadCsv = async () => {
    setExporting(true);
    try {
      const query = exportParams.toString();
      const res = await fetch(`${API_BASE}/api/vessels/export${query ? `?${query}` : ''}`);
      if (!res.ok) {
        throw new Error(`API trả về ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getDownloadName(res);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Không xuất được CSV.');
    } finally {
      setExporting(false);
    }
  };

  const deleteVessel = async (id, event) => {
    event.stopPropagation();
    if (!window.confirm('Xác nhận xóa hồ sơ tàu này?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/vessels/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Lỗi ${res.status}`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Không xóa được tàu.');
    }
  };

  const deleteAllVessels = async () => {
    const count = total;
    if (!window.confirm(`Xác nhận xóa tất cả ${count} tàu hiện đang lọc? Hành động này không thể hoàn tác!`)) return;
    setDeleting(true);
    try {
      const query = exportParams.toString();
      const res = await fetch(`${API_BASE}/api/vessels/${query ? `?${query}` : ''}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Lỗi ${res.status}`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Không xóa được dữ liệu.');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Checkbox helpers ───────────────────────────────────────────────────────
  const allPageChecked = data.length > 0 && data.every((row) => checkedIds.has(row.id));
  const somePageChecked = data.some((row) => checkedIds.has(row.id));

  const toggleAll = () => {
    if (allPageChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        data.forEach((row) => next.delete(row.id));
        return next;
      });
    } else {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        data.forEach((row) => next.add(row.id));
        return next;
      });
    }
  };

  const toggleRow = (id, event) => {
    event.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (checkedIds.size === 0) return;
    if (!window.confirm(`Xác nhận xóa ${checkedIds.size} hồ sơ đã chọn?`)) return;
    setDeleting(true);
    try {
      await Promise.all(
        [...checkedIds].map((id) =>
          fetch(`${API_BASE}/api/vessels/${id}`, { method: 'DELETE' }).then((r) => {
            if (!r.ok) throw new Error(`Lỗi xóa ID ${id}`);
          })
        )
      );
      setCheckedIds(new Set());
      fetchData();
    } catch (err) {
      setError(err.message || 'Không xóa được một số hồ sơ.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.vesselsPage}>
      <form className={styles.filterBar} onSubmit={applySearch}>
        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <Input
              label="Tìm kiếm"
              placeholder="Tìm theo số ĐK, chủ tàu, địa chỉ, file..."
              iconLeft={Search}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className={styles.filterItem}>
            <label className={styles.selectLabel}>Tỉnh</label>
            <select className={styles.selectInput} value={prov} onChange={(event) => updateProv(event.target.value)}>
              <option value="">Tất cả tỉnh</option>
              {options.provinces.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}{item.count !== undefined ? ` (${item.count})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label className={styles.selectLabel}>Hình thức KT</label>
            <select className={styles.selectInput} value={type} onChange={(event) => updateType(event.target.value)}>
              <option value="">Tất cả</option>
              {options.inspectionTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label className={styles.selectLabel}>Nhóm Lmax</label>
            <select className={styles.selectInput} value={length} onChange={(event) => updateLength(event.target.value)}>
              <option value="">Tất cả</option>
              {options.lengthGroups.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}{item.count !== undefined ? ` (${item.count})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          <Button type="submit" icon={Filter} loading={loading}>
            Lọc dữ liệu
          </Button>
          <button type="button" className={styles.clearBtn} onClick={clearFilters}>
            Xóa bộ lọc
          </button>
        </div>
      </form>

      <div>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderLeft}>
            <span className={styles.recordCount}>
              Hiển thị {startRecord}-{endRecord} / {total} kết quả
            </span>
            <div className={styles.deleteBtnGroup}>
              <button
                type="button"
                className={styles.deleteSelectedBtn}
                onClick={deleteSelected}
                disabled={deleting || checkedIds.size === 0}
                title="Xóa những hồ sơ đã chọn"
              >
                <Trash2 size={14} />
                {deleting ? 'Đang xóa...' : `Xóa đã chọn${checkedIds.size > 0 ? ` (${checkedIds.size})` : ''}`}
              </button>
              <button
                type="button"
                className={styles.deleteAllBtn}
                onClick={deleteAllVessels}
                disabled={deleting || total === 0}
                title="Xóa tất cả dữ liệu hiện tại"
              >
                <Trash2 size={14} />
                {deleting ? 'Đang xóa...' : `Xóa tất cả (${total})`}
              </button>
            </div>
          </div>
          <Button variant="secondary" icon={Download} onClick={downloadCsv} loading={exporting} disabled={total === 0}>
            Xuất CSV
          </Button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 40 }}>
                <input
                  type="checkbox"
                  className={styles.headerCheckbox}
                  checked={allPageChecked}
                  ref={(el) => { if (el) el.indeterminate = somePageChecked && !allPageChecked; }}
                  onChange={toggleAll}
                  title="Chọn tất cả trang này"
                />
              </TableHead>
              <TableHead>STT</TableHead>
              <TableHead>Số ĐK</TableHead>
              <TableHead>Chủ tàu</TableHead>
              <TableHead>Tỉnh</TableHead>
              <TableHead>Lmax (m)</TableHead>
              <TableHead>Vật liệu</TableHead>
              <TableHead>Hình thức KT</TableHead>
              <TableHead>Ngày KT</TableHead>
              <TableHead>Hạn ĐK</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} style={{ textAlign: 'center', padding: 20 }}>
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                  Không có tàu nào khớp điều kiện.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow
                  key={row.id}
                  onClick={() => setSelectedVessel(row)}
                  style={{ cursor: 'pointer', background: checkedIds.has(row.id) ? 'var(--info-bg)' : undefined }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className={styles.rowCheckbox}
                      checked={checkedIds.has(row.id)}
                      onChange={(e) => toggleRow(row.id, e)}
                    />
                  </TableCell>
                  <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'var(--primary)' }}>{displayValue(row.reg)}</TableCell>
                  <TableCell>{displayValue(row.owner)}</TableCell>
                  <TableCell>{displayValue(row.prov)}</TableCell>
                  <TableCell>{displayValue(row.lmax)}</TableCell>
                  <TableCell>
                    <Badge variant={materialBadgeVariant(row.material)}>{displayValue(row.material)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={inspectionBadgeVariant(row.type)}>{displayValue(row.type)}</Badge>
                  </TableCell>
                  <TableCell>{displayValue(row.date)}</TableCell>
                  <TableCell>{displayValue(row.expire)}</TableCell>
                  <TableCell>
                    <div className={styles.actionGroup}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Xem chi tiết"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedVessel(row);
                        }}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        title="Xóa hồ sơ"
                        onClick={(event) => deleteVessel(row.id, event)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className={styles.pagination}>
          <select className={styles.pageSizeSelect} value={pageSize} onChange={(event) => updatePageSize(event.target.value)}>
            <option value={20}>20 bản ghi/trang</option>
            <option value={50}>50 bản ghi/trang</option>
            <option value={100}>100 bản ghi/trang</option>
          </select>

          <div className={styles.pageControls}>
            <button
              type="button"
              className={styles.pageBtn}
              title="Trang trước"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={`${styles.pageBtn} ${pageNumber === page ? styles.pageBtnActive : ''}`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageBtn}
              title="Trang sau"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {selectedVessel && (
        <div className={styles.modalOverlay} onClick={() => setSelectedVessel(null)}>
          <div className={styles.drawer} onClick={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Chi tiết hồ sơ tàu cá</h3>
              <button type="button" className={styles.closeBtn} title="Đóng" onClick={() => setSelectedVessel(null)}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.drawerContent}>
              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>Thông tin chung</h4>
                <div className={styles.detailGrid}>
                  <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                    <span className={styles.detailLabel}>Số đăng ký</span>
                    <span className={`${styles.detailValue} ${styles.primaryValue}`}>{displayValue(selectedVessel.reg)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Chủ tàu</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.owner)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Tỉnh/TP</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.prov)}</span>
                  </div>

                  <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                    <span className={styles.detailLabel}>Địa chỉ</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.address)}</span>
                  </div>

                  <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                    <span className={styles.detailLabel}>Trạng thái kỹ thuật</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.technical_status)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>Kích thước & Trọng tải</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Chiều dài lớn nhất (Lmax)</span>
                    <span className={styles.detailValue}>{selectedVessel.lmax ? `${selectedVessel.lmax} m` : '-'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Chiều rộng lớn nhất (Bmax)</span>
                    <span className={styles.detailValue}>{selectedVessel.bmax ? `${selectedVessel.bmax} m` : '-'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Chiều cao mạn (D)</span>
                    <span className={styles.detailValue}>{selectedVessel.depth ? `${selectedVessel.depth} m` : '-'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nhóm Lmax</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.length_label)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Tổng dung tích</span>
                    <span className={styles.detailValue}>{selectedVessel.gross_tonnage ? `${selectedVessel.gross_tonnage} GT` : '-'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Số thuyền viên tối đa</span>
                    <span className={styles.detailValue}>{selectedVessel.crew_limit ? `${selectedVessel.crew_limit} người` : '-'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Vật liệu vỏ</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.material)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>Chế tạo & Máy chính</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Năm đóng</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.build_year)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nơi đóng</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.build_place)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Ký hiệu máy chính</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.engine_model)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Số máy chính</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.engine_serial)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nơi chế tạo máy</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.engine_build_info)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Công suất máy</span>
                    <span className={styles.detailValue}>{selectedVessel.power_kw ? `${selectedVessel.power_kw} kW` : '-'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>Kiểm tra & Hoạt động</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Hình thức kiểm tra</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.type)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nghề hoạt động</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.job)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Ngày kiểm tra</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.date)}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Hạn đăng kiểm</span>
                    <span className={`${styles.detailValue} ${styles.successValue}`}>
                      {displayValue(selectedVessel.expire)}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Cấp tàu</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.vessel_class_label || selectedVessel.vessel_class)}</span>
                  </div>

                  <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                    <span className={styles.detailLabel}>Vùng hoạt động được phép</span>
                    <span className={styles.detailValue}>{displayValue(selectedVessel.allowed_area)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <span><strong>Tệp nguồn:</strong> {displayValue(selectedVessel.source_filename)}</span>
              <span><strong>Ngày nhập hệ thống:</strong> {displayValue(selectedVessel.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vessels;
