
import { Save, Shield, Building } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const AdminSettings = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
      
      {/* Card 1: Thông tin đơn vị */}
      <Card>
        <CardHeader 
          title="Thông tin Đơn vị" 
          subtitle="Cấu hình thông tin hiển thị trên báo cáo và giao diện hệ thống" 
        />
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Tên đơn vị" defaultValue="Cục Đăng kiểm Việt Nam" />
              <Input label="Địa chỉ" defaultValue="18 Phạm Hùng, Mỹ Đình 2, Nam Từ Liêm, Hà Nội" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input label="Điện thoại" defaultValue="024 3768 4715" />
                <Input label="Email" defaultValue="contact@vr.org.vn" />
              </div>
            </div>
            
            <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Logo Đơn vị</label>
              <div style={{ width: 160, height: 160, border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-hover)', cursor: 'pointer' }}>
                <Building size={32} color="var(--text-light)" style={{ marginBottom: 8 }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tải logo lên</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button icon={Save}>Lưu thông tin</Button>
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
            <Input label="Năm hoạt động hiện tại" type="number" defaultValue={2026} />
          </div>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Danh sách tỉnh mặc định</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)' }}>
              {['Quảng Ninh', 'Thanh Hóa', 'Hà Tĩnh', 'Nghệ An', 'Quảng Bình'].map(prov => (
                <span key={prov} style={{ padding: '4px 12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 20, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {prov} <span style={{ color: 'var(--error)', cursor: 'pointer', fontSize: 16 }}>×</span>
                </span>
              ))}
              <Button size="sm" variant="ghost">+ Thêm tỉnh</Button>
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
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 12px' }}><Input defaultValue="QN" inputClassName="h-8 text-sm" /></td>
                  <td style={{ padding: '8px 12px' }}><Input defaultValue="Quảng Ninh" inputClassName="h-8 text-sm" /></td>
                  <td style={{ textAlign: 'center' }}><button style={{ color: 'var(--error)' }}>Xóa</button></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 12px' }}><Input defaultValue="TH" inputClassName="h-8 text-sm" /></td>
                  <td style={{ padding: '8px 12px' }}><Input defaultValue="Thanh Hóa" inputClassName="h-8 text-sm" /></td>
                  <td style={{ textAlign: 'center' }}><button style={{ color: 'var(--error)' }}>Xóa</button></td>
                </tr>
              </tbody>
            </table>
            <Button size="sm" variant="secondary" style={{ marginTop: 12 }}>+ Thêm dòng mới</Button>
          </div>
        </CardContent>
        <CardFooter style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button icon={Save}>Lưu cấu hình</Button>
        </CardFooter>
      </Card>

      {/* Card 3: Bảo mật */}
      <Card>
        <CardHeader 
          title="Bảo mật & Phiên làm việc" 
          subtitle="Thiết lập an toàn cho tài khoản người dùng" 
        />
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>Thời gian Timeout phiên đăng nhập</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tự động đăng xuất sau khi không có hoạt động</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input type="number" defaultValue={30} inputClassName="w-20 text-center" />
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>phút</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>Bắt buộc đổi mật khẩu</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Yêu cầu người dùng đổi mật khẩu định kỳ</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>sau mỗi</span>
                <Input type="number" defaultValue={90} inputClassName="w-20 text-center" />
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>ngày</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button icon={Shield}>Cập nhật bảo mật</Button>
        </CardFooter>
      </Card>

    </div>
  );
};

export default AdminSettings;
