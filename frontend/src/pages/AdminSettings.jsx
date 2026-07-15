
import { useState, useEffect, useRef } from 'react';
import { Save, Building } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { reportApi } from '../api/reportApi';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgLogo, setOrgLogo] = useState('');

  const [reportYear, setReportYear] = useState(2026);
  const [defaultProvinces, setDefaultProvinces] = useState([]);
  const [provinceCodes, setProvinceCodes] = useState([]);

  // Popover state to add province
  const [showAddProvince, setShowAddProvince] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const data = await reportApi.getConfigs();
        setOrgName(data.org_name || '');
        setOrgAddress(data.org_address || '');
        setOrgPhone(data.org_phone || '');
        setOrgEmail(data.org_email || '');
        setOrgLogo(data.org_logo || '');
        setReportYear(data.report_year || 2026);
        setDefaultProvinces(data.default_provinces || []);
        
        // Convert {"QN": "Quảng Ninh"} to [{code: "QN", name: "Quảng Ninh"}]
        const codesArray = Object.entries(data.province_codes || {}).map(([code, name]) => ({
          code,
          name,
        }));
        setProvinceCodes(codesArray);
      } catch (err) {
        setNotification({ type: 'error', message: 'Không tải được cấu hình hệ thống.' });
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => {
        if (curr.message === message) {
          return { type: '', message: '' };
        }
        return curr;
      });
    }, 5000);
  };

  const handleLogoUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Vui lòng chọn file hình ảnh hợp lệ.');
        return;
      }
      if (file.size > 1.5 * 1024 * 1024) {
        showNotification('error', 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 1.5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    setOrgLogo('');
  };

  const handleRemoveDefaultProvince = (provName) => {
    setDefaultProvinces(defaultProvinces.filter((p) => p !== provName));
  };

  const handleAddDefaultProvince = (provName) => {
    if (provName && !defaultProvinces.includes(provName)) {
      setDefaultProvinces([...defaultProvinces, provName]);
    }
    setShowAddProvince(false);
  };

  const handleProvinceCodeChange = (index, value) => {
    const updated = [...provinceCodes];
    updated[index].code = value;
    setProvinceCodes(updated);
  };

  const handleProvinceNameChange = (index, value) => {
    const updated = [...provinceCodes];
    updated[index].name = value;
    setProvinceCodes(updated);
  };

  const handleAddProvinceRow = () => {
    setProvinceCodes([...provinceCodes, { code: '', name: '' }]);
  };

  const handleDeleteProvinceRow = (index) => {
    setProvinceCodes(provinceCodes.filter((_, i) => i !== index));
  };

  const handleSaveOrg = async () => {
    setSavingOrg(true);
    try {
      await reportApi.saveConfig({
        org_name: orgName,
        org_address: orgAddress,
        org_phone: orgPhone,
        org_email: orgEmail,
        org_logo: orgLogo,
      });
      showNotification('success', 'Đã lưu thông tin đơn vị thành công!');
    } catch (err) {
      showNotification('error', 'Lỗi khi lưu thông tin đơn vị.');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleSaveConfig = async () => {
    const cleanProvinceCodes = provinceCodes.filter((p) => p.code.trim() !== '' && p.name.trim() !== '');
    const provinceCodesObj = {};
    cleanProvinceCodes.forEach((p) => {
      provinceCodesObj[p.code.toUpperCase().trim()] = p.name.trim();
    });

    setSavingConfig(true);
    try {
      await reportApi.saveConfig({
        report_year: parseInt(reportYear) || 2026,
        default_provinces: defaultProvinces,
        province_codes: provinceCodesObj,
      });
      
      setProvinceCodes(cleanProvinceCodes.map(p => ({
        code: p.code.toUpperCase().trim(),
        name: p.name.trim()
      })));

      showNotification('success', 'Đã lưu cấu hình báo cáo thành công!');
    } catch (err) {
      showNotification('error', 'Lỗi khi lưu cấu hình báo cáo.');
    } finally {
      setSavingConfig(false);
    }
  };

  const availableToAdd = provinceCodes.filter(
    (p) => p.name && p.name.trim() !== '' && !defaultProvinces.includes(p.name)
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)' }}>Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
      {/* Alert Notification */}
      {notification.message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: notification.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${notification.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
          color: notification.type === 'success' ? 'var(--success)' : 'var(--error)',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification({ type: '', message: '' })} 
            style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Card 1: Thông tin đơn vị */}
      <Card>
        <CardHeader 
          title="Thông tin Đơn vị" 
          subtitle="Cấu hình thông tin hiển thị trên báo cáo và giao diện hệ thống" 
        />
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input 
                label="Tên đơn vị" 
                value={orgName} 
                onChange={(e) => setOrgName(e.target.value)} 
              />
              <Input 
                label="Địa chỉ" 
                value={orgAddress} 
                onChange={(e) => setOrgAddress(e.target.value)} 
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input 
                  label="Điện thoại" 
                  value={orgPhone} 
                  onChange={(e) => setOrgPhone(e.target.value)} 
                />
                <Input 
                  label="Email" 
                  value={orgEmail} 
                  onChange={(e) => setOrgEmail(e.target.value)} 
                />
              </div>
            </div>
            
            <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Logo Đơn vị</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <div 
                onClick={handleLogoUploadClick}
                style={{ 
                  width: 160, 
                  height: 160, 
                  border: '2px dashed var(--border)', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: 'var(--surface-hover)', 
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {orgLogo ? (
                  <>
                    <img 
                      src={orgLogo} 
                      alt="Logo Đơn vị" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} 
                    />
                    <button
                      onClick={handleRemoveLogo}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                      title="Xóa logo"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <Building size={32} color="var(--text-light)" style={{ marginBottom: 8 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tải logo lên</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button icon={Save} loading={savingOrg} onClick={handleSaveOrg}>Lưu thông tin</Button>
        </CardFooter>
      </Card>

      {/* Card 2: Cấu hình báo cáo */}
      <Card>
        <CardHeader 
          title="Cấu hình Báo cáo" 
          subtitle="Các thiết lập mặc định khi xuất báo cáo thống kê" 
        />
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ width: 200 }}>
            <Input 
              label="Năm hoạt động hiện tại" 
              type="number" 
              value={reportYear} 
              onChange={(e) => setReportYear(e.target.value)} 
            />
          </div>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Danh sách tỉnh mặc định</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)', alignItems: 'center' }}>
              {defaultProvinces.map(prov => (
                <span key={prov} style={{ padding: '4px 12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 20, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {prov} 
                  <span 
                    onClick={() => handleRemoveDefaultProvince(prov)} 
                    style={{ color: 'var(--error)', cursor: 'pointer', fontSize: 16, display: 'inline-block', lineHeight: 1 }}
                  >
                    ×
                  </span>
                </span>
              ))}
              
              {showAddProvince ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select 
                    onChange={(e) => handleAddDefaultProvince(e.target.value)}
                    defaultValue=""
                    style={{ 
                      height: 30, 
                      padding: '0 8px', 
                      borderRadius: 4, 
                      border: '1px solid var(--border)', 
                      fontSize: 13,
                      backgroundColor: 'white' 
                    }}
                  >
                    <option value="" disabled>-- Chọn tỉnh --</option>
                    {availableToAdd.map(p => (
                      <option key={p.code} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddProvince(false)}>Hủy</Button>
                </div>
              ) : (
                availableToAdd.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setShowAddProvince(true)}>+ Thêm tỉnh</Button>
                )
              )}
            </div>
          </div>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Mã tỉnh tùy chỉnh</label>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Mã Tỉnh (Ký hiệu)</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Tên Tỉnh / TP</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {provinceCodes.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <Input 
                        value={p.code} 
                        onChange={(e) => handleProvinceCodeChange(idx, e.target.value)} 
                        inputClassName="h-8 text-sm" 
                        placeholder="Mã (VD: QN)" 
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <Input 
                        value={p.name} 
                        onChange={(e) => handleProvinceNameChange(idx, e.target.value)} 
                        inputClassName="h-8 text-sm" 
                        placeholder="Tên tỉnh (VD: Quảng Ninh)" 
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteProvinceRow(idx)}
                        style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button size="sm" variant="secondary" style={{ marginTop: 12 }} onClick={handleAddProvinceRow}>
              + Thêm dòng mới
            </Button>
          </div>
        </CardContent>
        <CardFooter style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button icon={Save} loading={savingConfig} onClick={handleSaveConfig}>Lưu cấu hình</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminSettings;
