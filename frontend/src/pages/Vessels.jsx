import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, X } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import styles from './Vessels.module.css';

const Vessels = () => {
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [prov, setProv] = useState('');
  const [type, setType] = useState('');
  const [length, setLength] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (prov) params.append('province_code', prov);
      if (type) params.append('inspection_type', type);
      if (length) params.append('length_group', length);

      const res = await fetch(`http://localhost:8000/api/vessels/?${params.toString()}`);
      const json = await res.json();
      setData(json.items || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className={styles.vesselsPage}>
      
      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <Input 
              label="Tìm kiếm" 
              placeholder="Tìm theo số ĐK, chủ tàu..." 
              iconLeft={Search}
            />
          </div>
          <div className={styles.filterItem}>
            <label className="text-[13px] font-semibold text-slate-800 mb-1 block">Tỉnh</label>
            <select 
              className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm outline-none focus:border-[#0b3d6b]"
              value={prov}
              onChange={(e) => setProv(e.target.value)}
            >
              <option value="">Tất cả tỉnh</option>
              <option value="QN">Quảng Ninh</option>
              <option value="TH">Thanh Hóa</option>
              <option value="HT">Hà Tĩnh</option>
              <option value="NA">Nghệ An</option>
            </select>
          </div>
          <div className={styles.filterItem}>
            <label className="text-[13px] font-semibold text-slate-800 mb-1 block">Hình thức KT</label>
            <select 
              className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm outline-none focus:border-[#0b3d6b]"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="HN">Hàng năm (HN)</option>
              <option value="TĐ">Trên đà (TĐ)</option>
              <option value="ĐK">Định kỳ (ĐK)</option>
              <option value="GS">Giám sát (GS)</option>
            </select>
          </div>
          <div className={styles.filterItem}>
            <label className="text-[13px] font-semibold text-slate-800 mb-1 block">Nhóm Lmax</label>
            <select 
              className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm outline-none focus:border-[#0b3d6b]"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="12-15">12-15m</option>
              <option value="15-20">15-20m</option>
              <option value="20-24">20-24m</option>
              <option value="24-30">24-30m</option>
              <option value=">30">≥30m</option>
            </select>
          </div>
        </div>
        
        <div className={styles.filterRow} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={styles.filterActions}>
            <Button icon={Filter} onClick={fetchData}>Lọc dữ liệu</Button>
            <span className={styles.clearBtn} onClick={() => { setProv(''); setType(''); setLength(''); }}>
              Xóa bộ lọc
            </span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div>
        <div className={styles.tableHeader}>
          <span className={styles.recordCount}>Hiển thị {total} kết quả</span>
          <Button variant="secondary" icon={Download}>Xuất CSV</Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
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
                 <TableCell colSpan={10} style={{ textAlign: 'center', padding: 20 }}>Đang tải...</TableCell>
               </TableRow>
            ) : data.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={10} style={{ textAlign: 'center', padding: 20 }}>Chưa có tàu nào trong DB.</TableCell>
               </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow key={row.id} onClick={() => setSelectedVessel(row)} style={{ cursor: 'pointer' }}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.reg}</TableCell>
                  <TableCell>{row.owner}</TableCell>
                  <TableCell>{row.prov}</TableCell>
                  <TableCell>{row.lmax}</TableCell>
                  <TableCell>
                    <Badge variant={row.material === 'Gỗ' ? 'brown' : row.material === 'Thép' ? 'gray' : 'teal'}>
                      {row.material}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.type === 'HN' ? 'info' : row.type === 'TĐ' ? 'purple' : row.type === 'ĐK' ? 'success' : 'warning'}>
                      {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.expire}</TableCell>
                  <TableCell>
                    <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setSelectedVessel(row); }}>
                      <Eye size={18} />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className={styles.pagination}>
          <select className={styles.pageSizeSelect}>
            <option>20 bản ghi/trang</option>
            <option>50 bản ghi/trang</option>
            <option>100 bản ghi/trang</option>
          </select>
          
          <div className={styles.pageControls}>
            <button className={styles.pageBtn}>←</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>→</button>
          </div>
        </div>
      </div>

      {/* Row Detail Modal (Drawer) */}
      {selectedVessel && (
        <div className={styles.modalOverlay} onClick={() => setSelectedVessel(null)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Chi tiết Hồ sơ Tàu cá</h3>
              <button className={styles.closeBtn} onClick={() => setSelectedVessel(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.drawerContent}>
              <div className={styles.detailGrid}>
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                  <span className={styles.detailLabel}>Số đăng ký</span>
                  <span className={styles.detailValue} style={{ fontSize: 20, color: 'var(--primary)' }}>
                    {selectedVessel.reg}
                  </span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Chủ tàu</span>
                  <span className={styles.detailValue}>{selectedVessel.owner}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tỉnh/TP</span>
                  <span className={styles.detailValue}>{selectedVessel.prov}</span>
                </div>

                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                  <span className={styles.detailLabel}>Địa chỉ</span>
                  <span className={styles.detailValue}>{selectedVessel.address}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Chiều dài lớn nhất (Lmax)</span>
                  <span className={styles.detailValue}>{selectedVessel.lmax} m</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Vật liệu vỏ</span>
                  <span className={styles.detailValue}>{selectedVessel.material}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Hình thức kiểm tra</span>
                  <span className={styles.detailValue}>{selectedVessel.type}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Nghề hoạt động</span>
                  <span className={styles.detailValue}>{selectedVessel.job}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Ngày kiểm tra</span>
                  <span className={styles.detailValue}>{selectedVessel.date}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Hạn đăng kiểm</span>
                  <span className={styles.detailValue} style={{ color: 'var(--success)' }}>
                    {selectedVessel.expire}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <span><strong>Tệp nguồn:</strong> {selectedVessel.source_filename}</span>
              <span><strong>Ngày nhập hệ thống:</strong> {selectedVessel.created_at}</span>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Vessels;
