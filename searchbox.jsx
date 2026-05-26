const { useState: useStateSearch, useEffect: useEffectSearch, useRef: useRefSearch } = React;

function AutocompleteSearchBox({ data, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useStateSearch(false);
  const [query, setQuery] = useStateSearch("");
  const wrapperRef = useRefSearch(null);

  // Khởi tạo query từ value nếu có
  useEffectSearch(() => {
    if (value === "all" || !value) {
      setQuery("");
    } else {
      const selectedItem = data.find(item => item.value === value);
      if (selectedItem) setQuery(selectedItem.label);
    }
  }, [value, data]);

  useEffectSearch(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = data.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%", display: "flex" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <input
          className="input"
          style={{ width: "100%", height: 36, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
          placeholder={placeholder || "Tìm kiếm..."}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            // Nếu người dùng xóa hết, reset về tất cả
            if (e.target.value === "") onChange("all");
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && filtered.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "var(--surface-card)", border: "1px solid var(--border-soft)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100,
            maxHeight: 250, overflowY: "auto", borderRadius: "0 0 6px 6px"
          }}>
            {filtered.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px 14px", cursor: "pointer",
                  borderBottom: idx < filtered.length - 1 ? "1px solid var(--border-soft)" : "none",
                  fontSize: 13.5, color: "var(--text-strong)"
                }}
                onClick={() => {
                  setQuery(item.label);
                  onChange(item.value);
                  setIsOpen(false);
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--brand-tint)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "#fff", color: "var(--text-strong, #333)", border: "1px solid var(--border-soft, #ccc)", borderLeft: "none",
          padding: "0 16px", cursor: "pointer",
          borderTopRightRadius: 6, borderBottomRightRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </div>
  );
}

window.AutocompleteSearchBox = AutocompleteSearchBox;
