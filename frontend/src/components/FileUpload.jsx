import FileUpload from "./components/FileUpload"

function App() {
  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px",
      background: "#0f172a",
      color: "white"
    }}>
      <h1>Fishing Vessel Report</h1>

      <FileUpload />
    </div>
  )
}

export default App