# Perubahan Fitur LKE (Evaluasi SPIP & SAKIP)

Dokumen ini merangkum **semua perubahan terkait output LKE** (Lembar Kerja
Evaluasi Excel) untuk skill **evaluasi-spip** dan **evaluasi-sakip**, agar bisa
disinkronkan ke codebase **integral** (hasil integrasi).

## Latar Belakang Masalah

Ada **2 masalah** yang diperbaiki:

1. **LKE Excel kadang TIDAK dibuat.** Agen AI bisa melewati langkah `fill_lke`
   (yang menghasilkan Excel) karena SKILL.md hanya mencantumkan
   `write_penilaian_lke` (rekap **JSON**, bukan Excel) di alur intinya. Akibat:
   output evaluasi selesai tanpa file Excel LKE.
2. **LKE Excel tidak TERLIHAT.** Walau ter-generate, file `_KKP/LKE-terisi-*.xlsx`
   hanya tampil di tab "Output & Laporan QC" (stage 7), tidak muncul di panel
   **Kertas Kerja** (AT) maupun **Draf Laporan** (KT).

Catatan: tool `fill_lke` + `LKEWriter` + template SPIP **sudah ada dan berfungsi**
— tidak ada perubahan pada mesin pengisi LKE. Perubahan hanya: **mewajibkan**
pemanggilannya + **menampilkan** hasilnya.

---

## Ringkasan File yang Diubah

| File | Jenis | Inti perubahan |
|------|-------|----------------|
| `backend/app/tools/kkp_tools.py` | Backend (gate) | Tolak `render_kkp_docx` bila LKE Excel belum dibuat (SPIP/SAKIP) |
| `knowledge/skills/evaluasi-spip/SKILL.md` | Panduan skill | `fill_lke` jadi langkah WAJIB; baris stale diperbaiki |
| `knowledge/skills/evaluasi-sakip/SKILL.md` | Panduan skill | sama dengan SPIP |
| `frontend/app/penugasan/[id]/page.tsx` | Frontend | Tampilkan LKE Excel di panel Kertas Kerja & Draf Laporan |

**TIDAK diubah:** template `.docx`/`.xlsx`, endpoint backend, tool `fill_lke`,
`LKEWriter`, schema database.

---

## 1. Backend — Gate "LKE wajib" (`backend/app/tools/kkp_tools.py`)

Tujuan: `render_kkp_docx` **menolak** menyelesaikan KKP bila skill ber-LKE
(SPIP/SAKIP) belum punya file `_KKP/LKE-terisi-<skill>.xlsx`.

### a. Tambah helper + konstanta (TEPAT SEBELUM decorator `@tool("render_kkp_docx", ...)`)

> ⚠ Penting: letakkan SEBELUM baris `@tool(...)`, JANGAN di antara `@tool(...)`
> dan `async def render_kkp_docx` (decorator akan salah membungkus fungsi).

```python
def _skill_from_assignment(folder: Path) -> str | None:
    """Baca skill penugasan dari `_PKP/sasaran-assignment.json` (sumber terstruktur,
    sinkron, selalu ada sejak setup). Lebih andal dari parse nama folder."""
    p = folder / "_PKP" / "sasaran-assignment.json"
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    s = d.get("skill") if isinstance(d, dict) else None
    return s.strip().lower() if isinstance(s, str) else None


# Skill evaluasi ber-LKE Excel: output LKE-terisi WAJIB (deliverable utama).
_LKE_EXCEL_SKILLS = {"evaluasi-spip", "evaluasi-sakip"}
```

### b. Tambah gate di AWAL `render_kkp_docx` (setelah `folder = Path(...)`)

```python
async def render_kkp_docx(args: dict) -> dict:
    folder = Path(args["penugasan_folder"])
    # GATE LKE: untuk SPIP/SAKIP, file LKE Excel WAJIB sudah dibuat (via fill_lke)
    # sebelum render KKP. Mencegah KKP/laporan selesai tanpa output LKE.
    _lke_skill = _skill_from_assignment(folder)
    if _lke_skill in _LKE_EXCEL_SKILLS:
        _lke_xlsx = folder / "_KKP" / f"LKE-terisi-{_lke_skill}.xlsx"
        if not _lke_xlsx.is_file():
            return {
                "content": [{"type": "text", "text": (
                    f"FAILED|LKE Excel WAJIB untuk {_lke_skill} tapi belum dibuat "
                    f"(_KKP/LKE-terisi-{_lke_skill}.xlsx tidak ada). Jalankan tool "
                    f"`fill_lke` (isi kolom APIP per unsur/kriteria) LEBIH DULU, baru "
                    f"`render_kkp_docx`. Output LKE Excel adalah deliverable wajib "
                    f"evaluasi ber-LKE — `write_penilaian_lke` (JSON rekap) TIDAK "
                    f"menggantikan LKE Excel."
                )}],
                "is_error": True,
            }
    backup, stats = await _filter_temuan_by_review(folder)
    # ... sisa fungsi tidak berubah ...
```

**Prasyarat:** `import json` dan `from pathlib import Path` (sudah ada di file).
**Sumber skill:** field `skill` di `_PKP/sasaran-assignment.json` (mis. `"evaluasi-sakip"`).

---

## 2. Panduan Skill — `fill_lke` jadi WAJIB

Di **`knowledge/skills/evaluasi-spip/SKILL.md`** dan
**`knowledge/skills/evaluasi-sakip/SKILL.md`**, 3 perubahan teks:

1. **Baris "Pipeline E3"** (stale) — semula: *"tidak ada tool v7 — LKE diisi manual"*
   → diganti ke alur tool v7: `read_lke` → `fill_lke` (isi kolom APIP ke LKE Excel)
   → `write_penilaian_lke` (rekap JSON).
2. **Baris "Tool inti"** — sisipkan `read_lke` di awal dan **`fill_lke` (WAJIB)**
   sebelum `write_penilaian_lke`; tambah catatan: `render_kkp_docx` ditolak bila
   LKE Excel belum dibuat.
3. **Baris tabel "E3 — Pelaksanaan & KKP"** — tambah `fill_lke` sebagai langkah
   wajib + catatan output `_KKP/LKE-terisi-<skill>.xlsx` adalah output WAJIB.

Inti pesan yang harus ada: **`write_penilaian_lke` (JSON) TIDAK menggantikan
`fill_lke` (Excel); keduanya wajib.**

---

## 3. Frontend — Tampilkan LKE Excel (`frontend/app/penugasan/[id]/page.tsx`)

LKE Excel ada di folder `_KKP` (nama diawali `LKE-terisi-`). Komponen
`LhpFilesPanel` di-parameter dengan `variant` agar dipakai di 2 tempat.

### a. Ubah `LhpFilesPanel` — tambah prop `variant` + sertakan LKE

```tsx
function LhpFilesPanel({ penugasanId, variant = 'lhp' }: { penugasanId: number; variant?: 'lhp' | 'kkp' }) {
  // ... state sama ...
  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await api.listFiles(penugasanId);
      const kkpFiles = res.categories.find(c => c.key === '_KKP')?.files ?? [];
      // LKE Excel (output evaluasi ber-LKE SPIP/SAKIP) tersimpan di _KKP.
      const lke = kkpFiles.filter(f => f.name.toLowerCase().startsWith('lke-terisi'));
      if (variant === 'kkp') {
        const kkpDocx = kkpFiles.filter(f => f.ext === '.docx');
        setFiles([...kkpDocx, ...lke]);          // Kertas Kerja: KKP + LKE
      } else {
        const lhp = res.categories.find(c => c.key === '_LHP')?.files ?? [];
        setFiles([...lhp, ...lke]);              // Draf Laporan: LHP + LKE
      }
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [penugasanId]);

  const panelTitle = variant === 'kkp' ? 'Berkas Kertas Kerja (KKP & LKE)' : 'File Laporan (LHP & LKE)';
  const emptyHint = variant === 'kkp'
    ? 'Belum ada KKP/LKE. Jalankan Analisis AI terlebih dahulu.'
    : 'Belum ada file laporan. Generate laporan terlebih dahulu via chat.';
  // judul panel & pesan kosong di JSX pakai {panelTitle} / {emptyHint}
```

(Semula: panel hanya mengambil kategori `_LHP`. Judul hardcoded "File Laporan (LHP)"
diganti `{panelTitle}`, pesan kosong diganti `{emptyHint}`.)

### b. Tambah panel di Tahap 3 (Kertas Kerja — AT), setelah `<ChatTab .../>`

```tsx
<LhpFilesPanel penugasanId={id} variant="kkp" key={`kkp-files-at-${id}`} />
```

Pemanggilan lama di Tahap 5 (Draf Laporan KT) & Tahap 6 (LRS LHP PT/PM) **tidak
berubah** (`<LhpFilesPanel penugasanId={id} />`) — kini otomatis ikut menampilkan LKE.

---

## Yang Perlu Dilakukan di `integral`

1. **Wajib:** terapkan perubahan #1 (gate `kkp_tools.py`) dan #2 (SKILL.md x2) —
   ini yang membuat LKE **pasti dibuat**.
2. **Wajib (UI):** terapkan #3 (frontend) — agar LKE **terlihat**. Sesuaikan bila
   struktur komponen file panel di integral berbeda; intinya: ambil file dari
   kategori `_KKP` yang namanya diawali `lke-terisi` dan tampilkan di panel Kertas
   Kerja & Draf Laporan.
3. **Cek prasyarat:** pastikan `fill_lke`, `LKEWriter`, dan template SPIP
   (`knowledge/skills/evaluasi-spip/references/templates/lke-spip-kementerian.xlsx`
   + `cell-map-formulas.json`) ada di `integral`. SAKIP **upload-based** (auditor
   upload LKE auditee `.xlsx`) — tidak perlu template bawaan.
4. **Endpoint `listFiles`:** pastikan kategori `_KKP` mengembalikan file `.xlsx`
   (bukan disembunyikan). Ekstensi yang admin-only hanya `.json`/`.jsonl`.

## Cara Verifikasi Cepat

- Jalankan evaluasi SPIP/SAKIP → pastikan `_KKP/LKE-terisi-<skill>.xlsx` muncul.
- Hapus file LKE lalu panggil `render_kkp_docx` → harus balas `FAILED|LKE Excel WAJIB...`.
- Buka tahap Kertas Kerja & Draf Laporan → file LKE tampil + bisa di-unduh.
