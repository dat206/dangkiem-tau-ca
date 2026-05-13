export default function FileUpload() {
  return (
    <div className="rounded-lg bg-white p-6 text-slate-900">
      <h2 className="mb-3 text-xl font-semibold">Tải file DOCX</h2>
      <input
        type="file"
        accept=".docx"
        multiple
        className="block w-full rounded border border-slate-300 p-3"
      />
    </div>
  );
}
