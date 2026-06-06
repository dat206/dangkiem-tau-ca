import { Fragment } from 'react';
import { NAV_MAIN, NAV_ADMIN } from './data';

// ─── SVG icon set (1.5px stroke, currentColor, 20px viewBox) ─────────────────
export const Icon = ({ name, size = 18, ...rest }) => {
  const paths = {
    home:    "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z",
    upload:  "M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
    db:      "M4 6c0-1.5 3.5-3 8-3s8 1.5 8 3-3.5 3-8 3-8-1.5-8-3Zm0 0v12c0 1.5 3.5 3 8 3s8-1.5 8-3V6M4 12c0 1.5 3.5 3 8 3s8-1.5 8-3",
    chart:   "M4 20V4m0 16h16M8 16V11m4 5V7m4 9V13",
    history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2",
    users:   "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0H2Zm15-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-1 9h6a5 5 0 0 0-7-4.6",
    cog:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8.5-3a8.5 8.5 0 0 0-.2-1.9l2-1.5-2-3.4-2.4.8a8.5 8.5 0 0 0-3.3-1.9L14 1.5h-4l-.6 2.6a8.5 8.5 0 0 0-3.3 1.9L3.7 5.2l-2 3.4 2 1.5a8.5 8.5 0 0 0 0 3.8l-2 1.5 2 3.4 2.4-.8a8.5 8.5 0 0 0 3.3 1.9L10 22.5h4l.6-2.6a8.5 8.5 0 0 0 3.3-1.9l2.4.8 2-3.4-2-1.5c.1-.6.2-1.2.2-1.9Z",
    search:  "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 5 5",
    bell:    "M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Zm4 3a2 2 0 0 0 4 0",
    chevron: "m6 9 6 6 6-6",
    plus:    "M12 5v14M5 12h14",
    close:   "m6 6 12 12M6 18 18 6",
    eye:     "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    eyeoff:  "m3 3 18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9 5.5A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 3-.5",
    download:"M12 4v12m0 0-4-4m4 4 4-4M4 20h16",
    check:   "m4 12 5 5L20 6",
    alert:   "M12 9v4m0 4h0M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z",
    cloud:   "M7 18a5 5 0 0 1-1-9.9A6 6 0 0 1 18 9.3 4.5 4.5 0 0 1 17.5 18H7Zm5-7v6m0-6-3 3m3-3 3 3",
    file:    "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Zm0 0v5h5",
    refresh: "M3 12a9 9 0 0 1 15-6.7L21 8m0-5v5h-5M21 12a9 9 0 0 1-15 6.7L3 16m0 5v-5h5",
    trash:   "M4 7h16M9 7V4h6v3m-7 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7M10 11v6m4-6v6",
    edit:    "M4 20h4l10-10-4-4L4 16v4Zm10-14 4 4",
    lock:    "M6 11V8a6 6 0 1 1 12 0v3m-9 0h6a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z",
    anchor:  "M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 6v12m0 0a8 8 0 0 1-8-8h3m5 8a8 8 0 0 0 8-8h-3M9 12h6",
    folder:  "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
    calendar:"M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3-3v5m8-5v5M4 11h16",
    arrowUp: "M12 19V5m0 0-6 6m6-6 6 6",
    arrowDn: "M12 5v14m0 0 6-6m-6 6-6-6",
  };
  const d = paths[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d={d}></path>
    </svg>
  );
};

const NAV_ICON = {
  "dashboard": "home",
  "upload": "upload",
  "vessels": "db",
  "reports/generate": "chart",
  "reports/history": "history",
  "admin/users": "users",
  "admin/settings": "cog",
};

export const BrandMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect x="0" y="0" width="40" height="40" rx="10" fill="var(--brand-primary)" />
    <path d="M6 26c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3 3-3 4-3" stroke="var(--brand-on-primary)" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
    <path d="M20 10a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Zm0 4.4v9m0 0a5.6 5.6 0 0 1-5.6-5.6h2.4m3.2 5.6a5.6 5.6 0 0 0 5.6-5.6h-2.4m-4.4 1h3.2" stroke="var(--brand-on-primary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WaveBg = ({ opacity = 0.06 }) => (
  <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity,pointerEvents:"none"}} aria-hidden="true">
    <defs>
      <pattern id="chartGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke="var(--brand-primary)" strokeWidth="0.5" />
      </pattern>
      <pattern id="waves" width="120" height="40" patternUnits="userSpaceOnUse">
        <path d="M0 20 Q15 10 30 20 T60 20 T90 20 T120 20" fill="none" stroke="var(--brand-primary)" strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#chartGrid)" />
    <rect width="100%" height="100%" fill="url(#waves)" />
  </svg>
);

export const Badge = ({ tone = "blue", soft = true, children, dot = false, size = "md" }) => {
  const tones = {
    blue:   { bg:"#dbeafe", fg:"#1d4ed8", solid:"#2563eb" },
    teal:   { bg:"#ccfbf1", fg:"#0f766e", solid:"#0d9488" },
    green:  { bg:"#dcfce7", fg:"#15803d", solid:"#16a34a" },
    amber:  { bg:"#fef3c7", fg:"#a16207", solid:"#d97706" },
    red:    { bg:"#fee2e2", fg:"#b91c1c", solid:"#dc2626" },
    purple: { bg:"#ede9fe", fg:"#6d28d9", solid:"#7c3aed" },
    brown:  { bg:"#fde9d4", fg:"#92400e", solid:"#a16207" },
    gray:   { bg:"#e2e8f0", fg:"#475569", solid:"#64748b" },
    slate:  { bg:"#f1f5f9", fg:"#334155", solid:"#475569" },
  };
  const t = tones[tone] || tones.blue;
  const px = size === "sm" ? "2px 7px" : "3px 9px";
  const fs = size === "sm" ? 11 : 11.5;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6, padding:px, borderRadius:999,
      background: soft ? t.bg : t.solid, color: soft ? t.fg : "#fff",
      fontSize: fs, fontWeight: 600, lineHeight: 1.4, letterSpacing: ".01em",
    }}>
      {dot && <span style={{width:6,height:6,borderRadius:99,background:soft?t.solid:"#fff"}}/>}
      {children}
    </span>
  );
};



export const Card = ({ children, style, pad = 20, ...rest }) => (
  <div style={{
    background:"var(--surface-card)", border:"1px solid var(--border-soft)",
    borderRadius:12, boxShadow:"0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.04)",
    padding: pad, ...style,
  }} {...rest}>{children}</div>
);

export const Button = ({ variant = "primary", icon, size = "md", children, style, disabled, ...rest }) => {
  const sz = size === "sm" ? { h:30, fs:13, px:12 } : size === "lg" ? { h:44, fs:15, px:18 } : { h:36, fs:14, px:14 };
  const variants = {
    primary:   { bg:"var(--brand-primary)", fg:"var(--brand-on-primary)", bd:"transparent" },
    secondary: { bg:"var(--surface-card)",  fg:"var(--text-strong)",       bd:"var(--border-strong)" },
    ghost:     { bg:"transparent",          fg:"var(--text-strong)",       bd:"transparent" },
    danger:    { bg:"#dc2626",              fg:"#fff",                     bd:"transparent" },
    success:   { bg:"#15803d",              fg:"#fff",                     bd:"transparent" },
  };
  const v = variants[variant];
  return (
    <button disabled={disabled} style={{
      height: sz.h, padding:`0 ${sz.px}px`, fontSize: sz.fs, fontWeight:600,
      background: v.bg, color: v.fg, border:`1px solid ${v.bd}`,
      borderRadius: 8, cursor: disabled? "not-allowed":"pointer",
      display:"inline-flex", alignItems:"center", gap: 8, lineHeight:1,
      opacity: disabled? 0.5: 1, whiteSpace:"nowrap", ...style,
    }} {...rest}>
      {icon && <Icon name={icon} size={sz.fs+2} />} {children}
    </button>
  );
};

export const IconBtn = ({ icon, title, tone = "slate", size = 30, onClick }) => {
  const colors = { slate:"#475569", red:"#dc2626", brand:"var(--brand-primary)" };
  return (
    <button title={title} onClick={onClick} style={{
      width:size, height:size, border:"1px solid var(--border-soft)", borderRadius:8,
      background:"var(--surface-card)", color: colors[tone]||tone,
      display:"inline-flex", alignItems:"center", justifyContent:"center", cursor:"pointer"
    }}>
      <Icon name={icon} size={16}/>
    </button>
  );
};

export const Sidebar = ({ active, onNav, onLogout, role, iconStyle, currentUser }) => {
  const renderItem = (n) => {
    const isActive = active === n.id;
    return (
      <button key={n.id} onClick={()=>onNav(n.id)} className={"nav-item " + (isActive ? "active" : "")}>
        <span className="nav-ic" aria-hidden="true">
          {iconStyle === "emoji" ? n.emoji : <Icon name={NAV_ICON[n.id]} size={17} />}
        </span>
        <span className="nav-lb">{n.label}</span>
      </button>
    );
  };
  return (
    <aside className="sidebar">
      <div className="side-brand">
        <BrandMark size={36}/>
        <div>
          <div style={{fontSize:13, fontWeight:700, color:"#fff", lineHeight:1.2}}>Đăng kiểm Tàu cá</div>
          <div style={{fontSize:11, color:"rgba(255,255,255,.6)"}}>Cục Đăng kiểm Việt Nam</div>
        </div>
      </div>
      <div className="side-section">{NAV_MAIN.map(renderItem)}</div>
      {role === "admin" && (
        <>
          <div className="side-divider">QUẢN TRỊ</div>
          <div className="side-section">{NAV_ADMIN.map(renderItem)}</div>
        </>
      )}
      <div style={{flex:1}}/>
      <div className="side-user">
        <div className="avatar">{currentUser.initials}</div>
        <div style={{minWidth:0, flex:1}}>
          <div style={{fontSize:12.5, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{currentUser.name}</div>
          <Badge tone={role==="admin"?"purple":"blue"} size="sm">{role==="admin"?"Admin":"Nhân viên"}</Badge>
        </div>
        <button title="Đăng xuất" onClick={onLogout} style={{
          border:"none", background:"transparent", color:"var(--text-soft)", cursor:"pointer",
          padding:6, borderRadius:6,
        }}>
          <Icon name="lock" size={16}/>
        </button>
      </div>
    </aside>
  );
};

export const Header = ({ title, subtitle, breadcrumb, actions, lastUpdated }) => (
  <header className="topbar">
    <div style={{display:"flex", flexDirection:"column", gap:4, minWidth:0}}>
      {breadcrumb && (
        <div style={{fontSize:12, color:"var(--text-soft)", display:"flex", gap:6}}>
          {breadcrumb.map((b,i)=>(
            <Fragment key={i}>
              {i>0 && <span>›</span>}
              <span style={{color: i===breadcrumb.length-1 ? "var(--text-body)" : "var(--text-soft)"}}>{b}</span>
            </Fragment>
          ))}
        </div>
      )}
      <div style={{fontSize:22, fontWeight:700, color:"var(--text-strong)", letterSpacing:"-.01em"}}>{title}</div>
      {subtitle && <div style={{fontSize:13, color:"var(--text-soft)"}}>{subtitle}</div>}
    </div>
    <div style={{flex:1}}/>
    <div style={{display:"flex", alignItems:"center", gap:10}}>
      {lastUpdated && (
        <div style={{display:"flex",alignItems:"center", gap:6, fontSize:12, color:"var(--text-soft)"}}>
          <Icon name="refresh" size={13}/> Cập nhật {lastUpdated}
        </div>
      )}
      {actions}
      <button className="iconbtn-soft" title="Thông báo">
        <Icon name="bell" size={18}/>
        <span style={{position:"absolute", top:6, right:6, width:7, height:7, borderRadius:99, background:"#dc2626"}}></span>
      </button>
    </div>
  </header>
);

export const EmptyState = ({ icon = "folder", title, hint, action }) => (
  <div style={{textAlign:"center", padding:"48px 24px"}}>
    <div style={{
      width:64, height:64, borderRadius:16, margin:"0 auto 16px",
      background:"var(--brand-tint)", color:"var(--brand-primary)",
      display:"inline-flex", alignItems:"center", justifyContent:"center"
    }}>
      <Icon name={icon} size={28}/>
    </div>
    <div style={{fontSize:15, fontWeight:600, color:"var(--text-strong)", marginBottom:6}}>{title}</div>
    {hint && <div style={{fontSize:13, color:"var(--text-soft)", maxWidth:380, margin:"0 auto 16px"}}>{hint}</div>}
    {action}
  </div>
);
