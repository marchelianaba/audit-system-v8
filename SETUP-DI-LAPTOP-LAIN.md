# Panduan Setup Audit System di Laptop Lain

Dokumen ini menjelaskan **apa saja yang harus disiapkan & dilakukan** seseorang
yang ingin menjalankan Audit System ini dari nol di laptop/komputer baru,
beserta **daftar API/layanan eksternal** yang diperlukan.

> Repo: https://github.com/marchelianaba/audit-system-v8
> Catatan: folder `data/` (penugasan riil) dan file `.env` (kredensial) **tidak
> ikut di repo** — keduanya dibuat sendiri di laptop tujuan.

---

## A. Prasyarat (software yang harus terpasang dulu)

| Software | Versi | Untuk |
|----------|-------|-------|
| **Git** | 2.x | clone repo |
| **Python** | 3.12+ | backend (FastAPI) |
| **Node.js** | 18+ / 20+ | frontend (Next.js) |
| **PostgreSQL** | 14+ | database (bisa via Docker) |
| **Docker + Docker Compose** | terbaru | menjalankan PostgreSQL praktis (opsional bila PostgreSQL sudah ada) |
| **Claude CLI** (`claude`) | terbaru | **hanya** bila pakai mode auth `subscription` (testing dev). Mode `api` tidak butuh ini. |

---

## B. Langkah Setup (urut)

### 1. Clone repo
```bash
git clone https://github.com/marchelianaba/audit-system-v8.git
cd audit-system-v8
```

### 2. Siapkan file `.env` (WAJIB — tidak ada di repo)
```bash
cp .env.example .env                 # backend (root)
cp frontend/.env.example frontend/.env
```
Lalu **edit `.env`** dan isi minimal:
- `ANTHROPIC_API_KEY=sk-ant-...` ← **wajib** (lihat Bagian C)
- `DATABASE_URL=...` ← sesuaikan dengan PostgreSQL Anda
- `APP_SECRET_KEY=...` ← ganti dengan string acak ≥32 karakter
- **Path lokal** (penting untuk dev — default `.env.example` masih path Docker `/v6`,`/skills`,dst.):
  ```
  APP_DATA_DIR=./data
  APP_V6_PATH=./backend/v6
  APP_SKILLS_PATH=./knowledge/skills
  APP_TEMPLATES_PATH=./knowledge/templates
  APP_WIKI_PATH=./knowledge/wiki
  APP_VAULT_PATH=                     # kosongkan = fitur baca vault non-aktif
  ```

### 3. Jalankan PostgreSQL
```bash
docker-compose up -d                 # otomatis sesuai docker-compose.yml
# (atau pakai PostgreSQL yang sudah ada, sesuaikan DATABASE_URL)
```

### 4. Backend (FastAPI)
```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate   # Windows Git Bash
#  Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
python -m app.init_db                # buat tabel + user awal
uvicorn app.main:app --reload --port 8000
```
Backend jalan di http://localhost:8000

### 5. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev                          # http://localhost:3000
```

### 6. Verifikasi
- Buka http://localhost:3000 → halaman login muncul.
- Login pakai user awal yang dibuat `init_db` (cek `backend/app/init_db.py` /
  `HANDOVER.md` untuk kredensial default).

---

## C. Daftar API / Layanan Eksternal yang Diperlukan

| # | API / Layanan | Status | Untuk apa | Variabel `.env` |
|---|---------------|--------|-----------|-----------------|
| 1 | **Anthropic Claude API** | **WAJIB** | Otak sistem: agen Anggota Tim & Ketua Tim (analisis, susun KKP/LHP), fallback ekstraksi digest dokumen (Haiku), eval-judge. | `ANTHROPIC_API_KEY` |
| 2 | **PostgreSQL** | **WAJIB** | Database (user, penugasan, temuan, sesi login). Bukan API publik — layanan lokal/server. | `DATABASE_URL` |
| 3 | **CACM / EWS SIRUP agent** | Opsional (default OFF) | Integrasi early-warning pengadaan (SIRUP/LKPP) → auto-usulan penugasan. Kosongkan untuk nonaktif. | `CACM_AGENT_BASE_URL`, `CACM_AGENT_API_KEY`, `CACM_WEBHOOK_SECRET` |
| 4 | **SIMWAS Komdigi** | Opsional / manual | Impor sasaran-PKP dari SIMWAS. Saat ini lewat unggah/paste payload JSON (`sync-from-simwas`); API live belum disambung. | — (belum perlu key) |

### Detail Anthropic (API #1) — yang terpenting

- **Wajib** punya akun Anthropic + API key berbayar: https://console.anthropic.com
- Mode autentikasi agen (`AGENT_AUTH_MODE` di `.env`):
  - `api` (default, **untuk produksi**) → pakai `ANTHROPIC_API_KEY`, ditagih per token.
  - `subscription` (**hanya testing dev sendiri**) → tidak set API key untuk agen;
    pakai login langganan Claude (jalankan `claude setup-token`). ⚠ Melanggar ToS
    bila dipakai melayani banyak user.
- Model dipakai:
  - Agen AT/KT: `claude-sonnet-4-6` (default; bisa diturunkan ke Haiku saat hemat token via `AGENT_MODEL`).
  - Fallback digest dokumen: `claude-haiku-4-5` (`DIGEST_LLM_FALLBACK`, default ON — butuh API key).
- **Tanpa internet / tanpa API key:** ingestion deterministik tetap jalan
  (parser regex), tapi **agen analisis tidak bisa** dan fallback digest mati.
  Set `DIGEST_LLM_FALLBACK=false` untuk operasi offline parser-only.

---

## D. Yang TIDAK ikut di repo (dibuat/disiapkan sendiri)

| Item | Cara penuhi |
|------|-------------|
| `.env`, `backend/.env` | Salin dari `.env.example`, isi kredensial asli. |
| `data/` (penugasan riil) | Dibuat otomatis saat runtime; kosong di awal = normal. |
| `node_modules/` | `npm install`. |
| Database terisi | `python -m app.init_db`. |
| Vault pengetahuan eksternal (opsional) | Set `APP_VAULT_PATH` bila punya; kosong = nonaktif. |

---

## E. Ringkas — checklist cepat

- [ ] Install Git, Python 3.12+, Node 18+, PostgreSQL/Docker
- [ ] `git clone` repo
- [ ] Buat `.env` + `frontend/.env` dari `.example`, isi `ANTHROPIC_API_KEY` + `DATABASE_URL` + path lokal
- [ ] `docker-compose up -d` (PostgreSQL)
- [ ] Backend: venv → `pip install -r requirements.txt` → `python -m app.init_db` → `uvicorn app.main:app --reload`
- [ ] Frontend: `npm install` → `npm run dev`
- [ ] Buka http://localhost:3000, login

> **Satu-satunya API berbayar yang wajib: Anthropic Claude API.** Sisanya
> (PostgreSQL lokal, CACM, SIMWAS) gratis/opsional/internal.
