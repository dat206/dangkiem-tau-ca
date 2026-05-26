// screens-data.jsx — Upload, Vessels, Reports/Generate, Reports/History

const { useState: useState2, useMemo: useMemo2, useEffect: useEffect2 } = React;

// ─── UPLOAD ──────────────────────────────────────────────────────────────────
function UploadScreen({ density }) {
  const [files, setFiles] = useState2([
    { name: "417_90599_ĐK_QN.docx", size: 142, status: "ok",   parsed: { reg:"QN-90599-TS", owner:"Nguyễn Văn An",    prov:"Quảng Ninh",  lmax:18.5, insp:"ĐK" } },
    { name: "418_90523_HN_QN.docx", size: 138, status: "dup",  msg:"Đã tồn tại trong CSDL, bỏ qua", existingId: 2 },
    { name: "419_12048_TĐ_HP.docx", size: 156, status: "ok",   parsed: { reg:"HP-12048-TS", owner:"Lê Quang Cường",   prov:"Hải Phòng",   lmax:22.0, insp:"TĐ" } },
    { name: "420_12110_ĐK_HP.docx", size: 149, status: "ok",   parsed: { reg:"HP-12110-TS", owner:"Phạm Minh Dũng",   prov:"Hải Phòng",   lmax:19.8, insp:"ĐK" } },
    { name: "bad_unknown.docx",      size: 88,  status: "err",  msg:"Không tìm thấy Số đăng ký trong tài liệu" },
    { name: "422_77512_HN_TH.docx", size: 144, status: "queue" },
    { name: "423_77840_GS_TH.docx", size: 151, status: "queue" },
  ]);
  const [expanded, setExpanded] = useState2(0);
  const [drag, setDrag] = useState2(false);
  const [processing, setProcessing] = useState2(false);

  const okCount  = files.filter(f=>f.status==="ok").length;
  const dupCount = files.filter(f=>f.status==="dup").length;
  const errCount = files.filter(f=>f.status==="err").length;

  const reset = () => setFiles([]);

  return (
    <div className="page-pad">
      <Header
        title="Upload hồ sơ DOCX"
        subtitle="Tải file Giấy Chứng nhận An toàn Kỹ thuật Tàu cá — hệ thống tự bóc tách và lưu vào CSDL."
        breadcrumb={["Trang chủ", "Upload hồ sơ"]}
        actions={<Button variant="ghost" icon="trash" onClick={reset}>Xóa danh sách</Button>}
      />

      <div style={{display:"grid", gridTemplateColumns:"minmax(360px, 0.7fr) 1fr", gap:16}}>
        {/* LEFT */}
        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <Card>
            <div
              onDragEnter={()=>setDrag(true)} onDragLeave={()=>setDrag(false)}
              onDragOver={(e)=>{e.preventDefault();}} onDrop={(e)=>{e.preventDefault(); setDrag(false);}}
              style={{
                border:`2px dashed ${drag ? "var(--brand-primary)" : "var(--border-strong)"}`,
                borderRadius:12, padding:"32px 20px", textAlign:"center",
                background: drag ? "var(--brand-tint)" : "var(--surface-page)",
                transition: "all .15s ease", cursor:"pointer",
              }}
            >
              <div style={{
                width:56, height:56, borderRadius:14, background:"var(--brand-tint)",
                color:"var(--brand-primary)", display:"inline-flex", alignItems:"center", justifyContent:"center",
                marginBottom:14,
              }}>
                <Icon name="cloud" size={28}/>
              </div>
              <div style={{fontSize:15, fontWeight:600, color:"var(--text-strong)", marginBottom:4}}>Kéo thả file .docx vào đây</div>
              <div style={{fontSize:12.5, color:"var(--text-soft)", marginBottom:14}}>hoặc bấm để chọn từ máy tính · tối đa 50 file</div>
              <Button variant="secondary" icon="folder">Chọn file</Button>
              <div style={{fontSize:11, color:"var(--text-soft)", marginTop:14}}>
                Chỉ chấp nhận định dạng <code style={{fontFamily:"var(--font-mono)", color:"var(--text-body)"}}>.docx</code>
              </div>
            </div>
          </Card>

          <Card pad={0}>
            <div style={{padding:"14px 16px", borderBottom:"1px solid var(--border-soft)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div style={{fontSize:13, fontWeight:600, color:"var(--text-strong)"}}>{files.length} file đã chọn</div>
              {files.length>0 && <button onClick={reset} style={{border:"none", background:"transparent", color:"var(--text-soft)", fontSize:12, cursor:"pointer"}}>Xóa hết</button>}
            </div>
            <div style={{maxHeight:280, overflowY:"auto"}}>
              {files.length===0 && (
                <div style={{padding:"24px 16px", textAlign:"center", color:"var(--text-soft)", fontSize:13}}>
                  Chưa có file nào được tải lên hôm nay
                </div>
              )}
              {files.map((f,i)=>(
                <div key={i} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom: i<files.length-1 ? "1px solid var(--border-soft)" : "none"}}>
                  <Icon name="file" size={16}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:12.5, fontFamily:"var(--font-mono)", color:"var(--text-body)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{f.name}</div>
                    <div style={{fontSize:11, color:"var(--text-soft)"}}>{f.size} KB</div>
                  </div>
                  {f.status==="ok"    && <Badge tone="green" size="sm" dot>OK</Badge>}
                  {f.status==="dup"   && <Badge tone="amber" size="sm" dot>Trùng</Badge>}
                  {f.status==="err"   && <Badge tone="red"   size="sm" dot>Lỗi</Badge>}
                  {f.status==="queue" && <Badge tone="slate" size="sm">Chờ</Badge>}
                  <button style={{border:"none", background:"transparent", color:"var(--text-soft)", cursor:"pointer", padding:4}}>
                    <Icon name="close" size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Button variant="primary" size="lg" icon="upload"
            disabled={files.length===0 || processing}
            onClick={()=>{ setProcessing(true); setTimeout(()=>setProcessing(false), 1500); }}>
            {processing ? `Đang xử lý 5/${files.length} file...` : "Xử lý & Lưu vào CSDL"}
          </Button>

          {processing && (
            <div style={{height:6, background:"var(--surface-page)", borderRadius:99, overflow:"hidden"}}>
              <div style={{width:"60%", height:"100%", background:"linear-gradient(90deg, var(--brand-primary), var(--brand-accent))", borderRadius:99}}/>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <Card pad={0} style={{display:"flex", flexDirection:"column"}}>
          <div style={{padding:"16px 20px", borderBottom:"1px solid var(--border-soft)"}}>
            <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Kết quả xử lý</div>
            <div style={{display:"flex", gap:10, marginTop:10, fontSize:13}}>
              <span style={{display:"inline-flex", alignItems:"center", gap:6, color:"#15803d", fontWeight:600}}>
                <span style={{width:8, height:8, borderRadius:99, background:"#16a34a"}}/>{okCount} thành công
              </span>
              <span style={{color:"var(--text-soft)"}}>·</span>
              <span style={{display:"inline-flex", alignItems:"center", gap:6, color:"#a16207", fontWeight:600}}>
                <span style={{width:8, height:8, borderRadius:99, background:"#d97706"}}/>{dupCount} trùng lặp
              </span>
              <span style={{color:"var(--text-soft)"}}>·</span>
              <span style={{display:"inline-flex", alignItems:"center", gap:6, color:"#b91c1c", fontWeight:600}}>
                <span style={{width:8, height:8, borderRadius:99, background:"#dc2626"}}/>{errCount} lỗi
              </span>
            </div>
          </div>
          <div style={{padding:"4px 0", maxHeight:560, overflowY:"auto"}}>
            {files.map((f,i)=>{
              const isOpen = expanded === i;
              const dot = f.status==="ok" ? "#16a34a" : f.status==="dup" ? "#d97706" : f.status==="err" ? "#dc2626" : "#94a3b8";
              return (
                <div key={i} style={{borderBottom: i<files.length-1?"1px solid var(--border-soft)":"none"}}>
                  <button onClick={()=>setExpanded(isOpen ? -1 : i)} style={{
                    width:"100%", padding:"12px 20px", display:"flex", alignItems:"center", gap:12,
                    background:"transparent", border:"none", cursor:"pointer", textAlign:"left",
                  }}>
                    <span style={{width:10, height:10, borderRadius:99, background:dot, flexShrink:0}}/>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:12.5, fontFamily:"var(--font-mono)", color:"var(--text-body)"}}>{f.name}</div>
                      <div style={{fontSize:12, color:"var(--text-soft)", marginTop:2}}>
                        {f.status==="ok"  && <>→ {f.parsed.reg} · {f.parsed.owner} · {f.parsed.prov} · Lmax {f.parsed.lmax}m · <Badge tone={inspTone(f.parsed.insp)} size="sm">{f.parsed.insp}</Badge></>}
                        {f.status==="dup" && <>→ {f.msg} · <a href="#" onClick={e=>e.preventDefault()} style={{color:"var(--brand-primary)", fontWeight:600}}>Xem bản ghi</a></>}
                        {f.status==="err" && <span style={{color:"#b91c1c"}}>Lỗi: {f.msg}</span>}
                        {f.status==="queue" && <span>Đang chờ xử lý...</span>}
                      </div>
                    </div>
                    <Icon name="chevron" size={16} style={{transform: isOpen?"rotate(180deg)":"none", transition:"transform .15s"}}/>
                  </button>
                  {isOpen && f.status==="ok" && (
                    <div style={{padding:"4px 20px 16px 42px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 24px", fontSize:12.5}}>
                      {[
                        ["Số đăng ký", f.parsed.reg],
                        ["Chủ tàu", f.parsed.owner],
                        ["Tỉnh", f.parsed.prov],
                        ["Lmax", `${f.parsed.lmax} m`],
                        ["Hình thức KT", f.parsed.insp],
                        ["File nguồn", f.name],
                      ].map(([k,v])=>(
                        <div key={k} style={{display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px dashed var(--border-soft)"}}>
                          <span style={{color:"var(--text-soft)"}}>{k}</span>
                          <span style={{color:"var(--text-strong)", fontWeight:500}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── VESSELS ─────────────────────────────────────────────────────────────────
function VesselsScreen({ density, role }) {
  const { VESSELS, PROVINCES, provName } = window.AppData;
  const [search, setSearch] = useState2("");
  const [prov, setProv] = useState2("all");
  const [insp, setInsp] = useState2("all");
  const [lmaxGroup, setLmaxGroup] = useState2("all");
  const [page, setPage] = useState2(1);
  const [drawer, setDrawer] = useState2(null);

  const filtered = useMemo2(()=>VESSELS.filter(v=>{
    if (search && !(`${v.reg} ${v.owner}`.toLowerCase().includes(search.toLowerCase()))) return false;
    if (prov !== "all" && v.prov !== prov) return false;
    if (insp !== "all" && v.insp !== insp) return false;
    if (lmaxGroup !== "all") {
      const g = window.AppData.lmaxGroup(v.lmax);
      if (g !== lmaxGroup) return false;
    }
    return true;
  }), [search, prov, insp, lmaxGroup]);

  const clearFilters = () => { setSearch(""); setProv("all"); setInsp("all"); setLmaxGroup("all"); };

  return (
    <div className="page-pad">
      <Header
        title="Dữ liệu Tàu cá"
        subtitle="Tra cứu toàn bộ bản ghi đăng kiểm trong CSDL."
        breadcrumb={["Trang chủ", "Dữ liệu tàu"]}
        actions={<><Button variant="secondary" icon="download">Xuất CSV</Button></>}
      />

      <Card pad={16} style={{marginBottom:16}}>
        <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr 1fr 1fr auto", gap:10, alignItems:"end"}}>
          <div className="form-row">
            <label className="form-lbl">Tìm kiếm</label>
            <div className="input-wrap">
              <Icon name="search" size={15}/>
              <input className="input" placeholder="Tìm theo số ĐK, chủ tàu..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          <div className="form-row" style={{ position: "relative", zIndex: 50 }}>
            <label className="form-lbl">Tỉnh</label>
            <window.AutocompleteSearchBox
              data={[
                { value: "all", label: `Tất cả (${PROVINCES.length})` },
                ...PROVINCES.map(p => ({ value: p.code, label: p.name }))
              ]}
              value={prov}
              onChange={setProv}
              placeholder="Tìm tỉnh..."
            />
          </div>
          <div className="form-row">
            <label className="form-lbl">Hình thức KT</label>
            <select className="input select" value={insp} onChange={e=>setInsp(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="HN">HN · Hàng năm</option>
              <option value="TĐ">TĐ · Trên đà</option>
              <option value="ĐK">ĐK · Định kỳ</option>
              <option value="GS">GS · Giám sát</option>
            </select>
          </div>
          <div className="form-row">
            <label className="form-lbl">Nhóm Lmax</label>
            <select className="input select" value={lmaxGroup} onChange={e=>setLmaxGroup(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="12–15m">12–15m</option>
              <option value="15–20m">15–20m</option>
              <option value="20–24m">20–24m</option>
              <option value="24–30m">24–30m</option>
              <option value="≥30m">≥30m</option>
            </select>
          </div>
          <button onClick={clearFilters} style={{
            height:36, padding:"0 14px", borderRadius:8, border:"1px solid var(--border-soft)",
            background:"var(--surface-card)", color:"var(--text-body)", fontSize:13, cursor:"pointer", fontWeight:500,
          }}>Xóa bộ lọc</button>
        </div>
      </Card>

      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, fontSize:13, color:"var(--text-soft)"}}>
        <div>Hiển thị <b style={{color:"var(--text-strong)"}}>{filtered.length}</b> / {VESSELS.length} kết quả</div>
        <div>20 bản ghi / trang</div>
      </div>

      <Card pad={0}>
        <div style={{overflow:"auto"}}>
        <table className={"data-table " + (density==="compact"?"dense":"")}>
          <thead>
            <tr>
              <th style={{width:42}}>STT</th>
              <th>Số ĐK</th>
              <th>Chủ tàu</th>
              <th>Địa chỉ</th>
              <th>Tỉnh</th>
              <th style={{textAlign:"right"}}>Lmax (m)</th>
              <th>Vật liệu</th>
              <th>HT KT</th>
              <th>Ngày KT</th>
              <th>Hạn ĐK</th>
              <th>Nghề</th>
              <th style={{width:90}}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0,20).map(v=>(
              <tr key={v.reg} onClick={()=>setDrawer(v)} style={{cursor:"pointer"}}>
                <td style={{color:"var(--text-soft)"}}>{v.stt}</td>
                <td style={{fontWeight:600, fontFamily:"var(--font-mono)", fontSize:12.5}}>{v.reg}</td>
                <td>{v.owner}</td>
                <td style={{color:"var(--text-soft)"}}>{v.address}</td>
                <td>{provName(v.prov)}</td>
                <td style={{textAlign:"right", fontVariantNumeric:"tabular-nums"}}>{v.lmax.toFixed(1)}</td>
                <td><Badge tone={hullTone(v.hull)} size="sm">{v.hull}</Badge></td>
                <td><Badge tone={inspTone(v.insp)} size="sm">{v.insp}</Badge></td>
                <td style={{fontVariantNumeric:"tabular-nums"}}>{v.inspDate}</td>
                <td style={{fontVariantNumeric:"tabular-nums", color:"var(--text-soft)"}}>{v.expireDate}</td>
                <td style={{color:"var(--text-soft)"}}>{v.gear}</td>
                <td>
                  <div style={{display:"flex", gap:6}}>
                    <IconBtn icon="eye"   title="Xem chi tiết" />
                    {role==="admin" && <IconBtn icon="trash" tone="red" title="Xóa bản ghi"/>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {filtered.length===0 && (
          <EmptyState
            icon="search"
            title="Không tìm thấy bản ghi nào"
            hint="Hãy thử thay đổi điều kiện lọc hoặc xóa bộ lọc để xem toàn bộ dữ liệu."
            action={<Button variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button>}
          />
        )}

        {filtered.length>0 && (
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderTop:"1px solid var(--border-soft)"}}>
            <div style={{fontSize:13, color:"var(--text-soft)"}}>Trang {page} / {Math.max(1, Math.ceil(filtered.length/20))}</div>
            <div style={{display:"flex", gap:4}}>
              <button className="pag-btn" disabled>← Trước</button>
              {[1,2,3].map(n=>(
                <button key={n} className={"pag-btn " + (page===n?"active":"")} onClick={()=>setPage(n)}>{n}</button>
              ))}
              <span style={{padding:"0 4px", color:"var(--text-soft)"}}>...</span>
              <button className="pag-btn">12</button>
              <button className="pag-btn">Sau →</button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail drawer */}
      {drawer && (
        <>
          <div onClick={()=>setDrawer(null)} style={{position:"fixed", inset:0, background:"rgba(15,23,42,.4)", zIndex:60}}/>
          <div style={{
            position:"fixed", top:0, right:0, width:440, height:"100vh", background:"var(--surface-card)",
            boxShadow:"-12px 0 30px rgba(0,0,0,.12)", zIndex:61, overflowY:"auto", display:"flex", flexDirection:"column"
          }}>
            <div style={{padding:"20px 24px", borderBottom:"1px solid var(--border-soft)", display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:11, color:"var(--text-soft)", fontWeight:600, letterSpacing:".06em"}}>SỐ ĐĂNG KÝ</div>
                <div style={{fontSize:20, fontWeight:700, color:"var(--text-strong)", fontFamily:"var(--font-mono)", marginTop:2}}>{drawer.reg}</div>
                <div style={{display:"flex", gap:6, marginTop:8}}>
                  <Badge tone={inspTone(drawer.insp)}>{drawer.insp} · {window.AppData.inspLabel(drawer.insp)}</Badge>
                  <Badge tone={hullTone(drawer.hull)}>{drawer.hull}</Badge>
                  <Badge tone="slate">{window.AppData.lmaxGroup(drawer.lmax)}</Badge>
                </div>
              </div>
              <IconBtn icon="close" onClick={()=>setDrawer(null)}/>
            </div>
            <div style={{padding:"20px 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px 20px", fontSize:13}}>
              {[
                ["Chủ tàu",    drawer.owner],
                ["Tỉnh",       provName(drawer.prov)],
                ["Địa chỉ",    drawer.address],
                ["Lmax",       `${drawer.lmax.toFixed(1)} m`],
                ["Vật liệu",   drawer.hull],
                ["Nghề",       drawer.gear],
                ["Ngày KT",    drawer.inspDate],
                ["Hạn đăng kiểm", drawer.expireDate],
              ].map(([k,v])=>(
                <div key={k} style={{gridColumn: k==="Địa chỉ"?"1/-1":"auto"}}>
                  <div style={{fontSize:11.5, color:"var(--text-soft)", marginBottom:2}}>{k}</div>
                  <div style={{color:"var(--text-strong)", fontWeight:500}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"16px 24px", margin:"0 24px", background:"var(--surface-page)", borderRadius:8, fontSize:12.5}}>
              <div style={{color:"var(--text-soft)", marginBottom:6, fontWeight:600}}>Nguồn dữ liệu</div>
              <div style={{display:"flex", justifyContent:"space-between", padding:"3px 0"}}>
                <span style={{color:"var(--text-soft)"}}>Tệp nguồn</span>
                <span style={{fontFamily:"var(--font-mono)", color:"var(--text-body)"}}>{drawer.source}</span>
              </div>
              <div style={{display:"flex", justifyContent:"space-between", padding:"3px 0"}}>
                <span style={{color:"var(--text-soft)"}}>Ngày nhập</span>
                <span style={{color:"var(--text-body)"}}>{drawer.createdAt}</span>
              </div>
            </div>
            <div style={{flex:1}}/>
            <div style={{padding:"16px 24px", borderTop:"1px solid var(--border-soft)", display:"flex", gap:8, justifyContent:"flex-end"}}>
              <Button variant="ghost" icon="download">Tải file gốc</Button>
              {role==="admin" && <Button variant="danger" icon="trash">Xóa</Button>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── REPORTS / GENERATE ──────────────────────────────────────────────────────
function ReportsGenerateScreen() {
  const { PROVINCES, QUARTERS } = window.AppData;
  const [quarter, setQuarter] = useState2("II");
  const [year, setYear] = useState2(2026);
  const [selected, setSelected] = useState2(["QN","HP","TH"]);
  const [fmt1, setFmt1] = useState2(true);
  const [fmt2, setFmt2] = useState2(true);
  const [phase, setPhase] = useState2("ready"); // ready | loading | done

  const recordsInQuarter = 411;
  const recordCount = selected.reduce((s,c)=>{
    const p = PROVINCES.find(x=>x.code===c);
    return s + (p ? Math.round(p.count * 0.35) : 0);
  }, 0);
  const toggle = (c) => setSelected(s => s.includes(c) ? s.filter(x=>x!==c) : [...s, c]);
  const all  = () => setSelected(PROVINCES.map(p=>p.code));
  const none = () => setSelected([]);

  const generate = () => {
    setPhase("loading");
    setTimeout(()=>setPhase("done"), 1800);
  };

  return (
    <div className="page-pad">
      <Header
        title="Xuất báo cáo"
        subtitle="Tổng hợp dữ liệu trong CSDL theo kỳ và xuất ra file Excel."
        breadcrumb={["Trang chủ", "Xuất báo cáo"]}
      />

      <div style={{maxWidth:780, margin:"0 auto"}}>
        {/* Section A */}
        <Card style={{marginBottom:16}}>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
            <div className="step-num">A</div>
            <div>
              <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Chọn kỳ báo cáo</div>
              <div style={{fontSize:12.5, color:"var(--text-soft)"}}>Quý và năm áp dụng cho toàn bộ dữ liệu được tổng hợp.</div>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:16, alignItems:"end"}}>
            <div className="form-row">
              <label className="form-lbl">Quý</label>
              <div style={{display:"flex", gap:8}}>
                {QUARTERS.map(q=>(
                  <button key={q} onClick={()=>setQuarter(q)} style={{
                    flex:1, height:42, borderRadius:8, fontSize:14, fontWeight:600,
                    border:`1px solid ${quarter===q?"var(--brand-primary)":"var(--border-soft)"}`,
                    background: quarter===q ? "var(--brand-primary)" : "var(--surface-card)",
                    color: quarter===q ? "#fff" : "var(--text-body)",
                    cursor:"pointer",
                  }}>Quý {q}</button>
                ))}
              </div>
            </div>
            <div className="form-row" style={{width:140}}>
              <label className="form-lbl">Năm</label>
              <input className="input" type="number" value={year} onChange={e=>setYear(+e.target.value)} />
            </div>
          </div>
          <div style={{marginTop:14, padding:"12px 14px", background:"var(--brand-tint)", borderRadius:8, display:"flex", gap:10, alignItems:"center"}}>
            <Icon name="chart" size={18} style={{color:"var(--brand-primary)"}}/>
            <div style={{fontSize:13, color:"var(--text-body)"}}>
              <b>Quý {quarter}/{year}</b>: 01/{quarter==="I"?"01":quarter==="II"?"04":quarter==="III"?"07":"10"}/{year} – {quarter==="I"?"31/03":quarter==="II"?"30/06":quarter==="III"?"30/09":"31/12"}/{year}
              {" "}· <b style={{color:"var(--brand-primary)"}}>{recordsInQuarter} bản ghi</b> trong CSDL cho kỳ này
            </div>
          </div>
        </Card>

        {/* Section B */}
        <Card style={{marginBottom:16}}>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
            <div className="step-num">B</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Chọn tỉnh cần đưa vào báo cáo</div>
              <div style={{fontSize:12.5, color:"var(--text-soft)"}}>Có thể chọn nhiều tỉnh. Số trong ngoặc = số bản ghi trong kỳ.</div>
            </div>
            <div style={{display:"flex", gap:10, fontSize:13}}>
              <button onClick={all}  style={{border:"none", background:"transparent", color:"var(--brand-primary)", fontWeight:600, cursor:"pointer"}}>Chọn tất cả</button>
              <span style={{color:"var(--border-strong)"}}>|</span>
              <button onClick={none} style={{border:"none", background:"transparent", color:"var(--text-soft)", cursor:"pointer"}}>Bỏ chọn tất cả</button>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8}}>
            {PROVINCES.map(p=>{
              const on = selected.includes(p.code);
              const recs = Math.round(p.count * 0.35);
              return (
                <label key={p.code} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8,
                  border:`1px solid ${on?"var(--brand-primary)":"var(--border-soft)"}`,
                  background: on ? "var(--brand-tint)" : "var(--surface-card)",
                  cursor:"pointer",
                }}>
                  <input type="checkbox" checked={on} onChange={()=>toggle(p.code)} className="checkbox"/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:500, color:"var(--text-strong)"}}>{p.name}</div>
                  </div>
                  <Badge tone={on?"blue":"slate"} size="sm">{recs}</Badge>
                </label>
              );
            })}
          </div>
          <div style={{marginTop:14, padding:"10px 14px", background:"var(--surface-page)", borderRadius:8, fontSize:13, color:"var(--text-body)"}}>
            <b style={{color:"var(--text-strong)"}}>Đã chọn {selected.length} tỉnh</b> · <b style={{color:"var(--brand-primary)"}}>{recordCount} bản ghi</b> sẽ được tổng hợp
          </div>
        </Card>

        {/* Section C — output */}
        <Card>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
            <div className="step-num">C</div>
            <div>
              <div style={{fontSize:15, fontWeight:700, color:"var(--text-strong)"}}>Định dạng đầu ra</div>
              <div style={{fontSize:12.5, color:"var(--text-soft)"}}>Chọn loại báo cáo cần tạo. Có thể chọn cả hai.</div>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18}}>
            {[
              { key:"fmt1", state: fmt1, set: setFmt1, icon:"file",  title:"Bảng kê tổng hợp",      desc:"Danh sách chi tiết từng tàu theo thứ tự thời gian (1 dòng / 1 tàu)" },
              { key:"fmt2", state: fmt2, set: setFmt2, icon:"chart", title:"Báo cáo quý theo tỉnh", desc:"Thống kê phân loại theo tỉnh, nhóm Lmax và vật liệu (pivot)" },
            ].map(o=>(
              <label key={o.key} style={{
                display:"flex", gap:12, padding:14, borderRadius:10, cursor:"pointer",
                border:`1px solid ${o.state?"var(--brand-primary)":"var(--border-soft)"}`,
                background: o.state?"var(--brand-tint)":"var(--surface-card)",
              }}>
                <input type="checkbox" checked={o.state} onChange={()=>o.set(!o.state)} className="checkbox" style={{marginTop:2}}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
                    <Icon name={o.icon} size={16} style={{color:"var(--brand-primary)"}}/>
                    <div style={{fontSize:14, fontWeight:600, color:"var(--text-strong)"}}>{o.title}</div>
                  </div>
                  <div style={{fontSize:12, color:"var(--text-soft)", lineHeight:1.45}}>{o.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {phase==="ready" && (
            <button onClick={generate} disabled={selected.length===0 || (!fmt1 && !fmt2)} style={{
              width:"100%", height:48, fontSize:15, fontWeight:700, color:"#fff",
              background: selected.length===0||(!fmt1&&!fmt2) ? "#94a3b8" : "var(--brand-primary)",
              border:"none", borderRadius:10, cursor: selected.length===0||(!fmt1&&!fmt2)?"not-allowed":"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            }}>
              <Icon name="refresh" size={18}/> Tạo báo cáo & Tải xuống
            </button>
          )}

          {phase==="loading" && (
            <div style={{padding:18, border:"1px solid var(--border-soft)", borderRadius:10}}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
                <span className="spinner" style={{borderColor:"var(--brand-primary)", borderTopColor:"transparent", width:18, height:18}}/>
                <div style={{fontSize:14, fontWeight:600, color:"var(--text-strong)"}}>Đang tổng hợp {recordCount} bản ghi từ CSDL...</div>
              </div>
              <div style={{height:6, background:"var(--surface-page)", borderRadius:99, overflow:"hidden"}}>
                <div style={{width:"65%", height:"100%", background:"linear-gradient(90deg, var(--brand-primary), var(--brand-accent))", borderRadius:99}}/>
              </div>
              <div style={{marginTop:10, display:"flex", gap:14, fontSize:12, color:"var(--text-soft)"}}>
                <span>✓ Truy vấn dữ liệu</span>
                <span>✓ Tổng hợp pivot</span>
                <span style={{color:"var(--brand-primary)", fontWeight:600}}>↻ Tạo file Excel</span>
                <span>· Đang nén file</span>
              </div>
            </div>
          )}

          {phase==="done" && (
            <div style={{padding:18, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10}}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
                <div style={{width:32, height:32, borderRadius:99, background:"#16a34a", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center"}}>
                  <Icon name="check" size={18}/>
                </div>
                <div>
                  <div style={{fontSize:14, fontWeight:700, color:"#15803d"}}>Báo cáo tạo thành công</div>
                  <div style={{fontSize:12.5, color:"#166534"}}>Đã tổng hợp {recordCount} tàu · {selected.length} tỉnh · Quý {quarter}/{year}</div>
                </div>
              </div>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                {fmt1 && <Button variant="success" icon="download">Bảng kê tổng hợp .xlsx</Button>}
                {fmt2 && <Button variant="success" icon="download">Báo cáo quý .xlsx</Button>}
                <Button variant="ghost" icon="download">Tải tất cả .zip</Button>
                <div style={{flex:1}}/>
                <button onClick={()=>setPhase("ready")} style={{border:"none", background:"transparent", color:"#15803d", fontWeight:600, fontSize:13, cursor:"pointer"}}>Xem trong Lịch sử báo cáo →</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── REPORTS / HISTORY ───────────────────────────────────────────────────────
function ReportsHistoryScreen({ density, role }) {
  const { REPORT_HISTORY, provName } = window.AppData;
  const [year, setYear] = useState2("all");
  const [quarter, setQuarter] = useState2("all");

  return (
    <div className="page-pad">
      <Header
        title="Lịch sử báo cáo"
        subtitle="Toàn bộ báo cáo đã tạo. Có thể tải lại file đã tạo trong vòng 30 ngày."
        breadcrumb={["Trang chủ", "Lịch sử báo cáo"]}
      />

      <Card pad={16} style={{marginBottom:16}}>
        <div style={{display:"grid", gridTemplateColumns:"160px 160px 200px auto 1fr", gap:10, alignItems:"end"}}>
          <div className="form-row">
            <label className="form-lbl">Năm</label>
            <select className="input select" value={year} onChange={e=>setYear(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <div className="form-row">
            <label className="form-lbl">Quý</label>
            <select className="input select" value={quarter} onChange={e=>setQuarter(e.target.value)}>
              <option value="all">Tất cả</option>
              {["I","II","III","IV"].map(q=>(<option key={q} value={q}>Quý {q}</option>))}
            </select>
          </div>
          {role==="admin" && (
            <div className="form-row">
              <label className="form-lbl">Người tạo</label>
              <select className="input select"><option>Tất cả nhân viên</option></select>
            </div>
          )}
          <Button variant="secondary" icon="search">Lọc</Button>
        </div>
      </Card>

      <Card pad={0}>
        <table className={"data-table " + (density==="compact"?"dense":"")}>
          <thead>
            <tr>
              <th style={{width:36}}>#</th>
              <th>Kỳ báo cáo</th>
              <th>Ngày tạo</th>
              <th>Người tạo</th>
              <th>Tỉnh</th>
              <th style={{textAlign:"right"}}>Số bản ghi</th>
              <th>Loại file</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {REPORT_HISTORY.map(r=>(
              <tr key={r.id}>
                <td style={{color:"var(--text-soft)"}}>{r.id}</td>
                <td>
                  <div style={{fontWeight:600, color:"var(--text-strong)"}}>Quý {r.quarter} / {r.year}</div>
                </td>
                <td style={{color:"var(--text-soft)", fontVariantNumeric:"tabular-nums"}}>{r.createdAt}</td>
                <td>{r.author}</td>
                <td>
                  <div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
                    {r.provs.slice(0,3).map(c=>(<Badge key={c} tone="slate" size="sm">{provName(c)}</Badge>))}
                    {r.provs.length>3 && <Badge tone="slate" size="sm">+{r.provs.length-3}</Badge>}
                  </div>
                </td>
                <td style={{textAlign:"right", fontWeight:600, fontVariantNumeric:"tabular-nums"}}>{r.recs}</td>
                <td><Badge tone="teal" size="sm">{r.files} file Excel</Badge></td>
                <td>
                  <div style={{display:"flex", gap:6}}>
                    <Button variant="secondary" size="sm" icon="download">Tải lại</Button>
                    {role==="admin" && <IconBtn icon="trash" tone="red" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { UploadScreen, VesselsScreen, ReportsGenerateScreen, ReportsHistoryScreen });
