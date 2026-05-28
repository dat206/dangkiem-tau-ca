import React, { useEffect, useMemo, useState } from 'react';
import { Card, Header, Badge, Icon, Button, IconBtn, BrandMark } from './chrome';
import { getUsers, createUser, updateUser, deleteUser } from '../api/userApi';

// ─── ADMIN / USERS ───────────────────────────────────────────────────────────
export function AdminUsersScreen({ density }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | { mode: "add" | "edit", user? }
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'staff', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = search.trim().toLowerCase();
      if (query && !(`${u.full_name} ${u.email}`.toLowerCase().includes(query))) {
        return false;
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) {
        return false;
      }
      if (statusFilter !== 'all') {
        const active = statusFilter === 'active';
        if (u.is_active !== active) {
          return false;
        }
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const openAddModal = () => {
    setError('');
    setForm({ full_name: '', email: '', password: '', role: 'staff', is_active: true });
    setModal({ mode: 'add' });
  };

  const openEditModal = (user) => {
    setError('');
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active,
    });
    setModal({ mode: 'edit', user });
  };

  const closeModal = () => {
    setModal(null);
    setError('');
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email) {
      setError('Vui lòng nhập đầy đủ họ tên và email.');
      return;
    }
    if (modal?.mode === 'add' && !form.password) {
      setError('Vui lòng nhập mật khẩu cho tài khoản mới.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (modal?.mode === 'add') {
        await createUser({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
      } else if (modal?.mode === 'edit') {
        const payload = {
          full_name: form.full_name,
          email: form.email,
          role: form.role,
          is_active: form.is_active,
        };
        if (form.password) {
          payload.password = form.password;
        }
        await updateUser(modal.user.id, payload);
      }
      await loadUsers();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Không thể lưu thay đổi.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    setSaving(true);
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      await loadUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setSaving(true);
    try {
      await deleteUser(confirm.id);
      setConfirm(null);
      await loadUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
      });
    } catch {
      return value;
    }
  };

  return (
    <div className="page-pad">
      <Header
        title="Quản lý người dùng"
        subtitle="Tạo, sửa, khóa và xóa tài khoản truy cập hệ thống."
        breadcrumb={["Trang chủ", "Quản trị", "Người dùng"]}
        actions={<Button variant="primary" icon="plus" onClick={openAddModal}>Thêm người dùng</Button>}
      />

      <Card pad={0}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="input-wrap" style={{ flex: 1, maxWidth: 360 }}>
            <Icon name="search" size={15} />
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email..."
            />
          </div>
          <select className="input select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 160 }}>
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="staff">Nhân viên</option>
          </select>
          <select className="input select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 160 }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Bị khóa</option>
          </select>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{users.length} người dùng</div>
        </div>
        <table className={"data-table " + (density === "compact" ? "dense" : "")}> 
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Lần đăng nhập cuối</th>
              <th>Trạng thái</th>
              <th style={{ width: 140 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-soft)' }}>
                  Đang tải danh sách người dùng...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-soft)' }}>
                  Không tìm thấy người dùng.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const initials = (u.full_name || '').split(' ').slice(-2).map((s) => s[0]).join('');
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{u.full_name}</div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-soft)' }}>{u.email}</td>
                    <td><Badge tone={u.role === 'admin' ? 'purple' : 'blue'}>{u.role === 'admin' ? 'Admin' : 'Nhân viên'}</Badge></td>
                    <td style={{ color: 'var(--text-soft)', fontVariantNumeric: 'tabular-nums' }}>{formatDateTime(u.last_login)}</td>
                    <td>
                      {u.is_active ? (
                        <Badge tone="green" dot>Hoạt động</Badge>
                      ) : (
                        <Badge tone="red" dot>Bị khóa</Badge>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <IconBtn icon="edit" title="Chỉnh sửa" onClick={() => openEditModal(u)} />
                        <IconBtn
                          icon="lock"
                          title={u.is_active ? 'Khóa' : 'Mở khóa'}
                          onClick={() => handleToggleActive(u)}
                        />
                        <IconBtn icon="trash" title="Xóa" tone="red" onClick={() => setConfirm(u)} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Add/Edit modal */}
      {modal && (
        <>
          <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 60 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 520, background: 'var(--surface-card)', borderRadius: 14, zIndex: 61,
            boxShadow: '0 24px 48px rgba(0,0,0,.18)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
                {modal.mode === 'add' ? 'Thêm người dùng mới' : `Chỉnh sửa: ${modal.user.full_name}`}
              </div>
              <IconBtn icon="close" onClick={closeModal} />
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-row" style={{ gridColumn: '1/-1' }}>
                <label className="form-lbl">Họ và tên</label>
                <input
                  className="input"
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="form-row" style={{ gridColumn: '1/-1' }}>
                <label className="form-lbl">Email công vụ</label>
                <input
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="ten@danhgiem.gov.vn"
                />
              </div>
              <div className="form-row">
                <label className="form-lbl">
                  Mật khẩu {modal.mode !== 'add' && <span style={{ color: 'var(--text-soft)', fontWeight: 400 }}>(để trống nếu giữ nguyên)</span>}
                </label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-row">
                <label className="form-lbl">Vai trò</label>
                <select
                  className="input select"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-row" style={{ gridColumn: '1/-1' }}>
                <label className="form-lbl">Trạng thái</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border-soft)', borderRadius: 8 }}>
                  <span className="toggle">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    />
                    <span className="toggle-thumb" />
                  </span>
                  <span style={{ fontSize: 13 }}>Tài khoản đang hoạt động</span>
                </label>
              </div>
            </div>
            {error && (
              <div style={{ padding: '0 24px', color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={closeModal}>Hủy</Button>
              <Button variant="primary" icon="check" onClick={handleSave} disabled={saving}>
                {modal.mode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Confirm delete modal */}
      {confirm && (
        <>
          <div onClick={() => setConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 60 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 440, background: 'var(--surface-card)', borderRadius: 14, padding: 24, zIndex: 61,
            boxShadow: '0 24px 48px rgba(0,0,0,.18)',
          }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 99, background: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="alert" size={22} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>Xóa tài khoản người dùng?</div>
                <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 6, lineHeight: 1.5 }}>
                  Tài khoản <b>{confirm.full_name}</b> sẽ bị xóa vĩnh viễn khỏi hệ thống. Lịch sử báo cáo do người này tạo sẽ vẫn được giữ lại.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <Button variant="ghost" onClick={() => setConfirm(null)}>Hủy</Button>
              <Button variant="danger" icon="trash" onClick={handleDelete} disabled={saving}>
                Xóa vĩnh viễn
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADMIN / SETTINGS ────────────────────────────────────────────────────────
export function AdminSettingsScreen() {
  const [provs, setProvs] = useState([
    { code:"QN", name:"Quảng Ninh" },
    { code:"HP", name:"Hải Phòng" },
    { code:"TH", name:"Thanh Hóa" },
    { code:"NA", name:"Nghệ An" },
    { code:"HT", name:"Hà Tĩnh" },
  ]);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [forceChange, setForceChange] = useState(true);
  const [changeDays, setChangeDays] = useState(90);

  return (
    <div className="page-pad">
      <Header
        title="Cài đặt hệ thống"
        subtitle="Thông tin đơn vị, cấu hình báo cáo và bảo mật."
        breadcrumb={["Trang chủ", "Quản trị", "Cài đặt"]}
      />

      <div style={{maxWidth:880, margin:"0 auto", display:"flex", flexDirection:"column", gap:16}}>
        {/* Card 1: Đơn vị */}
        <Card>
          <div style={{display:"flex", gap:14, marginBottom:18}}>
            <div style={{width:36, height:36, borderRadius:10, background:"var(--brand-tint)", color:"var(--brand-primary)", display:"inline-flex", alignItems:"center", justifyContent:"center"}}>
              <Icon name="anchor" size={18}/>
            </div>
            <div>
              <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Thông tin đơn vị</div>
              <div style={{fontSize:12.5, color:"var(--text-soft)"}}>Hiển thị trên các báo cáo xuất ra.</div>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"180px 1fr", gap:24, alignItems:"start"}}>
            <div>
              <div style={{
                width:160, height:160, borderRadius:12, border:"2px dashed var(--border-strong)",
                background:"var(--surface-page)", display:"flex", alignItems:"center", justifyContent:"center",
                flexDirection:"column", gap:8, color:"var(--text-soft)",
              }}>
                <BrandMark size={56}/>
                <div style={{fontSize:11}}>Logo đơn vị</div>
              </div>
              <button style={{marginTop:8, width:160, height:30, borderRadius:6, border:"1px solid var(--border-soft)", background:"var(--surface-card)", fontSize:12, fontWeight:500, cursor:"pointer"}}>
                Tải logo mới
              </button>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <div className="form-row" style={{gridColumn:"1/-1"}}>
                <label className="form-lbl">Tên đơn vị</label>
                <input className="input" defaultValue="Chi cục Đăng kiểm Tàu cá Hà Nội"/>
              </div>
              <div className="form-row" style={{gridColumn:"1/-1"}}>
                <label className="form-lbl">Địa chỉ</label>
                <input className="input" defaultValue="Số 12, Phố Lê Đại Hành, Quận Hai Bà Trưng, Hà Nội"/>
              </div>
              <div className="form-row">
                <label className="form-lbl">Điện thoại</label>
                <input className="input" defaultValue="(024) 3978 6543"/>
              </div>
              <div className="form-row">
                <label className="form-lbl">Email</label>
                <input className="input" defaultValue="dangkiem.hn@danhgiem.gov.vn"/>
              </div>
            </div>
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:18, paddingTop:14, borderTop:"1px solid var(--border-soft)"}}>
            <Button variant="ghost">Hủy</Button>
            <Button variant="primary" icon="check">Lưu thay đổi</Button>
          </div>
        </Card>

        {/* Card 2: Cấu hình báo cáo */}
        <Card>
          <div style={{display:"flex", gap:14, marginBottom:18}}>
            <div style={{width:36, height:36, borderRadius:10, background:"color-mix(in oklab, #d97706 14%, transparent)", color:"#d97706", display:"inline-flex", alignItems:"center", justifyContent:"center"}}>
              <Icon name="chart" size={18}/>
            </div>
            <div>
              <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Cấu hình báo cáo</div>
              <div style={{fontSize:12.5, color:"var(--text-soft)"}}>Năm hoạt động và danh sách tỉnh mặc định khi xuất báo cáo.</div>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18}}>
            <div className="form-row">
              <label className="form-lbl">Năm hoạt động hiện tại</label>
              <input className="input" type="number" defaultValue={2026}/>
            </div>
            <div className="form-row">
              <label className="form-lbl">Quý mặc định khi xuất</label>
              <select className="input select" defaultValue="auto">
                <option value="auto">Tự động xác định</option>
                <option value="I">Quý I</option>
                <option value="II">Quý II</option>
                <option value="III">Quý III</option>
                <option value="IV">Quý IV</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="form-lbl">Mã tỉnh tùy chỉnh (kéo để sắp xếp)</label>
            <div style={{border:"1px solid var(--border-soft)", borderRadius:8, overflow:"hidden"}}>
              <div style={{display:"grid", gridTemplateColumns:"40px 100px 1fr auto", padding:"8px 12px", borderBottom:"1px solid var(--border-soft)", background:"var(--surface-page)", fontSize:11.5, fontWeight:600, color:"var(--text-soft)", letterSpacing:".04em", textTransform:"uppercase"}}>
                <div></div><div>Mã</div><div>Tên tỉnh</div><div></div>
              </div>
              {provs.map((p, i)=>(
                <div key={p.code} style={{display:"grid", gridTemplateColumns:"40px 100px 1fr auto", padding:"10px 12px", alignItems:"center", borderBottom: i<provs.length-1?"1px solid var(--border-soft)":"none"}}>
                  <div style={{color:"var(--text-soft)", cursor:"grab"}}>⋮⋮</div>
                  <div style={{fontFamily:"var(--font-mono)", fontSize:13, fontWeight:600}}>{p.code}</div>
                  <div style={{fontSize:13}}>{p.name}</div>
                  <button style={{border:"none", background:"transparent", color:"var(--text-soft)", cursor:"pointer", padding:4}}>
                    <Icon name="close" size={14}/>
                  </button>
                </div>
              ))}
              <button style={{
                width:"100%", padding:"10px 12px", border:"none", background:"transparent",
                color:"var(--brand-primary)", fontSize:13, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", gap:6, justifyContent:"center",
                borderTop:"1px solid var(--border-soft)",
              }}>
                <Icon name="plus" size={14}/> Thêm mã tỉnh
              </button>
            </div>
          </div>

          <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:18, paddingTop:14, borderTop:"1px solid var(--border-soft)"}}>
            <Button variant="ghost">Hủy</Button>
            <Button variant="primary" icon="check">Lưu thay đổi</Button>
          </div>
        </Card>

        {/* Card 3: Bảo mật */}
        <Card>
          <div style={{display:"flex", gap:14, marginBottom:18}}>
            <div style={{width:36, height:36, borderRadius:10, background:"color-mix(in oklab, #dc2626 14%, transparent)", color:"#dc2626", display:"inline-flex", alignItems:"center", justifyContent:"center"}}>
              <Icon name="lock" size={18}/>
            </div>
            <div>
              <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Bảo mật</div>
              <div style={{fontSize:12.5, color:"var(--text-soft)"}}>Quy định phiên đăng nhập và chính sách mật khẩu.</div>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18}}>
            <div className="form-row">
              <label className="form-lbl">Thời gian phiên đăng nhập (phút)</label>
              <input className="input" type="number" value={sessionTimeout} onChange={e=>setSessionTimeout(+e.target.value)}/>
            </div>
            <div className="form-row">
              <label className="form-lbl">Số lần đăng nhập sai cho phép</label>
              <input className="input" type="number" defaultValue={5}/>
            </div>
          </div>
          <div style={{padding:14, border:"1px solid var(--border-soft)", borderRadius:8}}>
            <label style={{display:"flex", alignItems:"center", gap:10, cursor:"pointer"}}>
              <span className="toggle">
                <input type="checkbox" checked={forceChange} onChange={e=>setForceChange(e.target.checked)}/>
                <span className="toggle-thumb"/>
              </span>
              <div style={{flex:1}}>
                <div style={{fontSize:13.5, fontWeight:600, color:"var(--text-strong)"}}>Bắt buộc đổi mật khẩu định kỳ</div>
                <div style={{fontSize:12, color:"var(--text-soft)"}}>Nhắc người dùng đổi mật khẩu sau mỗi {changeDays} ngày.</div>
              </div>
              <input className="input" type="number" value={changeDays} onChange={e=>setChangeDays(+e.target.value)}
                style={{width:80}} disabled={!forceChange}/>
            </label>
          </div>

          <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:18, paddingTop:14, borderTop:"1px solid var(--border-soft)"}}>
            <Button variant="ghost">Hủy</Button>
            <Button variant="primary" icon="check">Lưu thay đổi</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
