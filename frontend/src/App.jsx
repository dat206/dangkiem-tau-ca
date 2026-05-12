function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      padding: "40px",
      fontFamily: "Arial"
    }}>
      <h1>Hệ thống Đăng kiểm Tàu cá</h1>

      <p>Frontend React đã hoạt động 🎉</p>

      <div style={{
        marginTop: "20px",
        padding: "20px",
        background: "#1e293b",
        borderRadius: "10px"
      }}>
        <h2>Chức năng</h2>

        <ul>
          <li>Upload DOCX</li>
          <li>Parse dữ liệu</li>
          <li>Lưu database</li>
          <li>Xuất Excel</li>
        </ul>
      </div>
    </div>
  )
}

export default App