import { Card, Header, Badge, Icon } from './chrome';
import { RECENT_UPLOADS, PROVINCE_TOTALS, INSP_TOTALS, provName, inspTone } from './data';

// ─── Stat card variants ──────────────────────────────────────────────────────
function StatCard({ label, value, icon, trend, sub, layout = "stacked", color = "primary" }) {
  const colors = {
    primary: "var(--brand-primary)",
    teal:    "var(--brand-accent)",
    purple:  "#7c3aed",
    amber:   "#d97706",
  };
  const c = colors[color] || colors.primary;

  const IconBlock = (
    <div style={{
      width:42, height:42, borderRadius:10,
      background: "color-mix(in oklab, " + c + " 12%, transparent)",
      color: c, display:"inline-flex", alignItems:"center", justifyContent:"center"
    }}>
      <Icon name={icon} size={22}/>
    </div>
  );

  if (layout === "side") {
    return (
      <Card style={{display:"flex", gap:14, alignItems:"center"}}>
        {IconBlock}
        <div style={{minWidth:0}}>
          <div style={{fontSize:12.5, color:"var(--text-soft)", marginBottom:2}}>{label}</div>
          <div style={{fontSize:26, fontWeight:700, color:"var(--text-strong)", lineHeight:1.1, letterSpacing:"-.01em"}}>{value}</div>
          <div style={{display:"flex", gap:6, alignItems:"center", marginTop:4, fontSize:12, color:"var(--text-soft)"}}>
            {trend && <span style={{color: trend.dir==="up" ? "#15803d" : "#dc2626", fontWeight:600, display:"inline-flex", alignItems:"center", gap:2}}>
              <Icon name={trend.dir==="up"?"arrowUp":"arrowDn"} size={11}/>{trend.label}
            </span>}
            {sub && <span>{sub}</span>}
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card style={{display:"flex", flexDirection:"column", gap:14}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
        <div style={{fontSize:12.5, color:"var(--text-soft)"}}>{label}</div>
        {IconBlock}
      </div>
      <div style={{fontSize:34, fontWeight:700, color:"var(--text-strong)", lineHeight:1, letterSpacing:"-.02em"}}>{value}</div>
      <div style={{display:"flex", gap:8, alignItems:"center", fontSize:12, color:"var(--text-soft)"}}>
        {trend && <span style={{color: trend.dir==="up" ? "#15803d" : "#dc2626", fontWeight:600, display:"inline-flex", alignItems:"center", gap:3}}>
          <Icon name={trend.dir==="up"?"arrowUp":"arrowDn"} size={12}/>{trend.label}
        </span>}
        {sub && <span>{sub}</span>}
      </div>
    </Card>
  );
}

// ─── Charts (SVG, hand-built) ────────────────────────────────────────────────
function BarChartProvince({ data }) {
  const max = Math.max(...data.map(d=>d.count));
  return (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>
      {data.map(d => {
        const pct = (d.count / max) * 100;
        return (
          <div key={d.code} style={{display:"grid", gridTemplateColumns:"100px 1fr 36px", alignItems:"center", gap:12}}>
            <div style={{fontSize:12.5, color:"var(--text-body)", fontWeight:500}}>{d.name}</div>
            <div style={{height:14, borderRadius:6, background:"var(--surface-page)", overflow:"hidden", position:"relative"}}>
              <div style={{
                width:`${pct}%`, height:"100%",
                background:`linear-gradient(90deg, var(--brand-primary), var(--brand-accent))`,
                borderRadius:6,
              }}/>
            </div>
            <div style={{fontSize:12.5, color:"var(--text-strong)", fontWeight:600, fontVariantNumeric:"tabular-nums", textAlign:"right"}}>{d.count}</div>
          </div>
        );
      })}
    </div>
  );
}

function DonutInsp({ data }) {
  const total = data.reduce((s,d)=>s+d.value, 0);
  const r = 64, c = 2 * Math.PI * r;
  return (
    <div style={{display:"flex", gap:24, alignItems:"center"}}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--surface-page)" strokeWidth="22"/>
        {data.map((d,i) => {
          const len = (d.value / total) * c;
          const currentOffset = data.slice(0, i).reduce((sum, item) => sum + (item.value / total) * c, 0);
          return (
            <circle key={i} cx="90" cy="90" r={r} fill="none"
              stroke={d.color} strokeWidth="22" strokeLinecap="butt"
              strokeDasharray={`${len} ${c-len}`}
              strokeDashoffset={-currentOffset}
              transform="rotate(-90 90 90)"
            />
          );
        })}
        <text x="90" y="88" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text-strong)">{total}</text>
        <text x="90" y="106" textAnchor="middle" fontSize="11" fill="var(--text-soft)">tổng</text>
      </svg>
      <div style={{display:"flex", flexDirection:"column", gap:10, flex:1}}>
        {data.map(d=>(
          <div key={d.key} style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10}}>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <span style={{width:10,height:10,borderRadius:3,background:d.color}}/>
              <span style={{fontSize:13, color:"var(--text-body)"}}>{d.key} · {d.label}</span>
            </div>
            <div style={{fontSize:13, fontWeight:600, color:"var(--text-strong)", fontVariantNumeric:"tabular-nums"}}>{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function DashboardScreen({ onNav, statLayout, density }) {
  return (
    <div className="page-pad">
      <Header
        title="Tổng quan"
        subtitle="Theo dõi tình hình upload hồ sơ và phát sinh báo cáo."
        breadcrumb={["Trang chủ", "Tổng quan"]}
        lastUpdated="2 phút trước"
      />
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginBottom:20}}>
        <StatCard layout={statLayout} color="primary" icon="anchor"   label="Tổng tàu trong CSDL"     value="1.247"  sub="Toàn bộ dữ liệu"/>
        <StatCard layout={statLayout} color="teal"    icon="upload"   label="Upload tháng này"        value="186"    trend={{dir:"up",label:"+24% so kỳ trước"}}/>
        <StatCard layout={statLayout} color="purple"  icon="calendar" label="Quý hiện tại · Q.II/2026" value="411"    sub="bản ghi đã nhập"/>
        <StatCard layout={statLayout} color="amber"   icon="download" label="Báo cáo đã xuất"          value="7"      sub="trong quý này"/>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1.1fr 1fr", gap:16, marginBottom:20}}>
        <Card>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:18}}>
            <div>
              <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Số tàu theo tỉnh</div>
              <div style={{fontSize:12, color:"var(--text-soft)", marginTop:2}}>Top 6 tỉnh có số bản ghi cao nhất</div>
            </div>
            <Badge tone="slate" soft>Năm 2026</Badge>
          </div>
          <BarChartProvince data={PROVINCE_TOTALS}/>
        </Card>
        <Card>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:18}}>
            <div>
              <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Phân loại theo hình thức KT</div>
              <div style={{fontSize:12, color:"var(--text-soft)", marginTop:2}}>Trên toàn bộ CSDL hiện tại</div>
            </div>
            <Badge tone="slate" soft>Tất cả</Badge>
          </div>
          <DonutInsp data={INSP_TOTALS}/>
        </Card>
      </div>

      <Card pad={0}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px"}}>
          <div>
            <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Upload gần đây</div>
            <div style={{fontSize:12, color:"var(--text-soft)", marginTop:2}}>8 hồ sơ mới nhất được xử lý vào CSDL</div>
          </div>
          <button onClick={()=>onNav("upload")} style={{border:"none", background:"transparent", color:"var(--brand-primary)", fontSize:13, fontWeight:600, cursor:"pointer"}}>
            Xem tất cả →
          </button>
        </div>
        <table className={"data-table " + (density==="compact"?"dense":"")}>
          <thead>
            <tr>
              <th style={{width:48}}>STT</th>
              <th>Tên file</th>
              <th>Số ĐK</th>
              <th>Chủ tàu</th>
              <th>Tỉnh</th>
              <th>Hình thức KT</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_UPLOADS.map((u,i)=>(
              <tr key={i}>
                <td style={{color:"var(--text-soft)"}}>{i+1}</td>
                <td style={{fontFamily:"var(--font-mono)", fontSize:12.5}}>{u.file}</td>
                <td style={{fontWeight:600}}>{u.reg}</td>
                <td>{u.owner}</td>
                <td>{provName(u.prov)}</td>
                <td>{u.insp !== "—" ? <Badge tone={inspTone(u.insp)}>{u.insp}</Badge> : <span style={{color:"var(--text-soft)"}}>—</span>}</td>
                <td style={{color:"var(--text-soft)"}}>{u.time}</td>
                <td>
                  {u.status==="ok"  && <Badge tone="green" dot>Thành công</Badge>}
                  {u.status==="dup" && <Badge tone="amber" dot>Trùng lặp</Badge>}
                  {u.status==="err" && <Badge tone="red"   dot>Lỗi parse</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
