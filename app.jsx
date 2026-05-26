// app.jsx — Main App: routing, tweaks, palette CSS variables

const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "role": "admin",
  "iconStyle": "svg",
  "statLayout": "stacked",
  "density": "regular",
  "brand": "ocean"
}/*EDITMODE-END*/;

// Palette presets — each provides primary, accent, tint, on-primary
const BRAND_PRESETS = {
  ocean: {
    name: "Deep ocean",
    primary:    "#0b3d6b",
    accent:     "#0d7377",
    tint:       "#e6eef6",
    onPrimary:  "#ffffff",
    sidebarBg:  "#0a2e52",
    sidebarFg:  "#cfd9e6",
    sidebarHov: "rgba(255,255,255,.08)",
    sidebarAct: "rgba(255,255,255,.14)",
  },
  teal: {
    name: "Teal deep",
    primary:    "#0d5c63",
    accent:     "#1a8a8f",
    tint:       "#dff1f1",
    onPrimary:  "#ffffff",
    sidebarBg:  "#0a4147",
    sidebarFg:  "#cfe6e7",
    sidebarHov: "rgba(255,255,255,.08)",
    sidebarAct: "rgba(255,255,255,.14)",
  },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useStateApp("login");
  const [logged, setLogged] = useStateApp(false);

  // Apply CSS variables based on brand
  useEffectApp(() => {
    const p = BRAND_PRESETS[t.brand] || BRAND_PRESETS.ocean;
    const root = document.documentElement;
    root.style.setProperty("--brand-primary",     p.primary);
    root.style.setProperty("--brand-accent",      p.accent);
    root.style.setProperty("--brand-tint",        p.tint);
    root.style.setProperty("--brand-on-primary",  p.onPrimary);
    root.style.setProperty("--sidebar-bg",        p.sidebarBg);
    root.style.setProperty("--sidebar-fg",        p.sidebarFg);
    root.style.setProperty("--sidebar-hov",       p.sidebarHov);
    root.style.setProperty("--sidebar-act",       p.sidebarAct);
  }, [t.brand]);

  const currentUser = t.role === "admin"
    ? { name: "Nguyễn Thị Bình", initials: "NB" }
    : { name: "Trần Văn Hải",    initials: "TH" };

  const onLogin = () => { setLogged(true); setRoute("dashboard"); };
  const onNav   = (id) => {
    if (id === "login") { setLogged(false); setRoute("login"); }
    else                { setRoute(id); }
  };

  // If logged out -> Login screen
  if (!logged || route === "login") {
    return (
      <>
        <LoginScreen onLogin={onLogin} role={t.role} setRole={(r)=>setTweak("role", r)}/>
        <TweaksPanel>
          <TweaksControls t={t} setTweak={setTweak}/>
        </TweaksPanel>
      </>
    );
  }

  const screenComponent = () => {
    const common = { role: t.role, density: t.density, statLayout: t.statLayout, onNav };
    switch (route) {
      case "dashboard":         return <DashboardScreen {...common}/>;
      case "upload":            return <UploadScreen {...common}/>;
      case "vessels":           return <VesselsScreen {...common}/>;
      case "reports/generate":  return <ReportsGenerateScreen {...common}/>;
      case "reports/history":   return <ReportsHistoryScreen {...common}/>;
      case "admin/users":       return <AdminUsersScreen {...common}/>;
      case "admin/settings":    return <AdminSettingsScreen {...common}/>;
      default:                  return <DashboardScreen {...common}/>;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={route}
        onNav={onNav}
        role={t.role}
        iconStyle={t.iconStyle}
        currentUser={currentUser}
      />
      <main className="main">
        {screenComponent()}
      </main>
      <TweaksPanel>
        <TweaksControls t={t} setTweak={setTweak}/>
      </TweaksPanel>
    </div>
  );
}

function TweaksControls({ t, setTweak }) {
  return (
    <>
      <TweakSection label="Vai trò người dùng"/>
      <TweakRadio
        label="Role"
        value={t.role}
        options={[
          { value:"admin", label:"Admin" },
          { value:"staff", label:"Nhân viên" },
        ]}
        onChange={(v)=>setTweak("role", v)}
      />

      <TweakSection label="Thương hiệu"/>
      <TweakColor
        label="Bộ màu"
        value={[BRAND_PRESETS[t.brand].primary, BRAND_PRESETS[t.brand].accent, BRAND_PRESETS[t.brand].tint]}
        options={[
          [BRAND_PRESETS.ocean.primary, BRAND_PRESETS.ocean.accent, BRAND_PRESETS.ocean.tint],
          [BRAND_PRESETS.teal.primary,  BRAND_PRESETS.teal.accent,  BRAND_PRESETS.teal.tint],
        ]}
        onChange={(v)=>{
          const match = Object.entries(BRAND_PRESETS).find(([k,p]) => p.primary === v[0]);
          if (match) setTweak("brand", match[0]);
        }}
      />

      <TweakSection label="Sidebar"/>
      <TweakRadio
        label="Style icon"
        value={t.iconStyle}
        options={[
          { value:"svg",   label:"SVG line" },
          { value:"emoji", label:"Emoji" },
        ]}
        onChange={(v)=>setTweak("iconStyle", v)}
      />

      <TweakSection label="Stat card"/>
      <TweakRadio
        label="Layout"
        value={t.statLayout}
        options={[
          { value:"stacked", label:"Số to" },
          { value:"side",    label:"Số bên icon" },
        ]}
        onChange={(v)=>setTweak("statLayout", v)}
      />

      <TweakSection label="Bảng dữ liệu"/>
      <TweakRadio
        label="Mật độ"
        value={t.density}
        options={[
          { value:"regular", label:"Thoáng" },
          { value:"compact", label:"Gọn" },
        ]}
        onChange={(v)=>setTweak("density", v)}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
