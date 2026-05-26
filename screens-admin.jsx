// screens-admin.jsx — Admin/Users, Admin/Settings

const { useState: useState3 } = React;

// ─── ADMIN / USERS ───────────────────────────────────────────────────────────
function AdminUsersScreen({ density }) {
  const { USERS } = window.AppData;
  const [modal, setModal] = useState3(null); // null | "add" | {user, mode:"edit"}
  const [confirm, setConfirm] = useState3(null);

  return (
    <div className="page-pad">
      <Header
        title="Quản lý người dùng"
        subtitle="Tạo, sửa, khóa và xóa tài khoản truy cập hệ thống."
        breadcrumb={["Trang chủ", "Quản trị", "Người dùng"]}
        actions={<Button variant="primary" icon="plus" onClick={()=>setModal("add")}>Thêm người dùng</Button>}
      />

      <Card pad={0}>
        <div style={{padding:"14px 20px", borderBottom:"1px solid var(--border-soft)", display:"flex", gap:12, alignItems:"center"}}>
          <div className="input-wrap" style={{flex:1, maxWidth:360}}>
            <Icon name="search" size={15}/>
            <input className="input" placeholder="Tìm theo tên, email..." />
          </div>
          <select className="input select" style={{width:160}}>
            <option>Tất cả vai trò</option>
            <option>Admin</option>
            <option>Nhân viên</option>
          </select>
          <select className="input select" style={{width:160}}>
            <option>Tất cả trạng thái</option>
            <option>Hoạt động</option>
            <option>Bị khóa</option>
          </select>
          <div style={{flex:1}}/>
          <div style={{fontSize:13, color:"var(--text-soft)"}}>{USERS.length} người dùng</div>
        </div>
        <table className={"data-table " + (density==="compact"?"dense":"")}>
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Lần đăng nhập cuối</th>
              <th>Trạng thái</th>
              <th style={{width:140}}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((u,i)=>{
              const initials = u.name.split(" ").slice(-2).map(s=>s[0]).join("");
              return (
                <tr key={i}>
                  <td>
                    <div style={{display:"flex", alignItems:"center", gap:10}}>
                      <div className="avatar" style={{width:32, height:32, fontSize:12}}>{initials}</div>
                      <div style={{fontWeight:600, color:"var(--text-strong)"}}>{u.name}</div>
                    </div>
                  </td>
                  <td style={{fontFamily:"var(--font-mono)", fontSize:12.5, color:"var(--text-soft)"}}>{u.email}</td>
                  <td><Badge tone={u.role==="admin"?"purple":"blue"}>{u.role==="admin"?"Admin":"Nhân viên"}</Badge></td>
                  <td style={{color:"var(--text-soft)", fontVariantNumeric:"tabular-nums"}}>{u.lastLogin}</td>
                  <td>
                    {u.status==="active"
                      ? <Badge tone="green" dot>Hoạt động</Badge>
                      : <Badge tone="red"   dot>Bị khóa</Badge>}
                  </td>
                  <td>
                    <div style={{display:"flex", gap:6}}>
                      <IconBtn icon="edit"   title="Chỉnh sửa" onClick={()=>setModal({user:u, mode:"edit"})}/>
                      <IconBtn icon="lock"   title={u.status==="active"?"Khóa":"Mở khóa"} />
                      <IconBtn icon="trash"  title="Xóa" tone="red" onClick={()=>setConfirm(u)}/>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Add/Edit modal */}
      {modal && (
        <>
          <div onClick={()=>setModal(null)} style={{position:"fixed", inset:0, background:"rgba(15,23,42,.45)", zIndex:60}}/>
          <div style={{
            position:"fixed", top:"50%", left:"50%", transform:"translate(-50%, -50%)",
            width:520, background:"var(--surface-card)", borderRadius:14, zIndex:61,
            boxShadow:"0 24px 48px rgba(0,0,0,.18)",
          }}>
            <div style={{padding:"20px 24px", borderBottom:"1px solid var(--border-soft)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div style={{fontSize:16, fontWeight:700, color:"var(--text-strong)"}}>
                {modal==="add" ? "Thêm người dùng mới" : `Chỉnh sửa: ${modal.user.name}`}
              </div>
              <IconBtn icon="close" onClick={()=>setModal(null)}/>
            </div>
            <div style={{padding:"20px 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
              <div className="form-row" style={{gridColumn:"1/-1"}}>
                <label className="form-lbl">Họ và tên</label>
                <input className="input" defaultValue={modal!=="add" ? modal.user.name : ""} placeholder="Nguyễn Văn A"/>
              </div>
              <div className="form-row" style={{gridColumn:"1/-1"}}>
                <label className="form-lbl">Email công vụ</label>
                <input className="input" defaultValue={modal!=="add" ? modal.user.email : ""} placeholder="ten@danhgiem.gov.vn"/>
              </div>
              <div className="form-row">
                <label className="form-lbl">Mật khẩu {modal!=="add" && <span style={{color:"var(--text-soft)", fontWeight:400}}>(để trống nếu giữ nguyên)</span>}</label>
                <input className="input" type="password" placeholder="••••••••"/>
              </div>
              <div className="form-row">
                <label className="form-lbl">Vai trò</label>
                <select className="input select" defaultValue={modal!=="add" ? modal.user.role : "staff"}>
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-row" style={{gridColumn:"1/-1"}}>
                <label className="form-lbl">Trạng thái</label>
                <label style={{display:"flex", alignItems:"center", gap:10, padding:"10px 12px", border:"1px solid var(--border-soft)", borderRadius:8}}>
                  <span className="toggle">
                    <input type="checkbox" defaultChecked={modal==="add" || modal.user.status==="active"}/>
                    <span className="toggle-thumb"/>
                  </span>
                  <span style={{fontSize:13}}>Tài khoản đang hoạt động</span>
                </label>
              </div>
            </div>
            <div style={{padding:"16px 24px", borderTop:"1px solid var(--border-soft)", display:"flex", justifyContent:"flex-end", gap:8}}>
              <Button variant="ghost" onClick={()=>setModal(null)}>Hủy</Button>
              <Button variant="primary" icon="check" onClick={()=>setModal(null)}>{modal==="add"?"Tạo tài khoản":"Lưu thay đổi"}</Button>
            </div>
          </div>
        </>
      )}

      {/* Confirm delete modal */}
      {confirm && (
        <>
          <div onClick={()=>setConfirm(null)} style={{position:"fixed", inset:0, background:"rgba(15,23,42,.45)", zIndex:60}}/>
          <div style={{
            position:"fixed", top:"50%", left:"50%", transform:"translate(-50%, -50%)",
            width:440, background:"var(--surface-card)", borderRadius:14, padding:24, zIndex:61,
            boxShadow:"0 24px 48px rgba(0,0,0,.18)",
          }}>
            <div style={{display:"flex", gap:14}}>
              <div style={{width:42, height:42, borderRadius:99, background:"#fee2e2", color:"#dc2626", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                <Icon name="alert" size={22}/>
              </div>
              <div>
                <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Xóa tài khoản người dùng?</div>
                <div style={{fontSize:13, color:"var(--text-soft)", marginTop:6, lineHeight:1.5}}>
                  Tài khoản <b>{confirm.name}</b> sẽ bị xóa vĩnh viễn khỏi hệ thống. Lịch sử báo cáo do người này tạo sẽ vẫn được giữ lại.
                </div>
              </div>
            </div>
            <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:20}}>
              <Button variant="ghost" onClick={()=>setConfirm(null)}>Hủy</Button>
              <Button variant="danger" icon="trash" onClick={()=>setConfirm(null)}>Xóa vĩnh viễn</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADMIN / SETTINGS ────────────────────────────────────────────────────────
function AdminSettingsScreen() {
  const [provs, setProvs] = useState3([
    { code:"QN", name:"Quảng Ninh" },
    { code:"HP", name:"Hải Phòng" },
    { code:"TH", name:"Thanh Hóa" },
    { code:"NA", name:"Nghệ An" },
    { code:"HT", name:"Hà Tĩnh" },
  ]);
  const [sessionTimeout, setSessionTimeout] = useState3(30);
  const [forceChange, setForceChange] = useState3(true);
  const [changeDays, setChangeDays] = useState3(90);

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

Object.assign(window, { AdminUsersScreen, AdminSettingsScreen });
