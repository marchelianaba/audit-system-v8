"""
Buat test fixtures minimal untuk semua skill (kecuali audit-umum & audit-pengadaan
yang sudah ada). Setiap skill butuh: context.md, _KKP/temuan.json, _PKP/sasaran-assignment.json.
"""
import json
from pathlib import Path

SKILLS = [
    "audit-kinerja",
    "evaluasi-manajemen-risiko",
    "evaluasi-reformasi-birokrasi",
    "evaluasi-sakip",
    "evaluasi-spip",
    "evaluasi-umum",
    "konsultansi-umum",
    "konsultasi-pengadaan",
    "pemantauan-pengadaan",
    "pemantauan-tindak-lanjut",
    "pemantauan-umum",
    "reviu-pengadaan",
    "reviu-rka-kl",
    "reviu-umum",
]

LABEL = {
    "audit-kinerja":              "Audit Kinerja",
    "evaluasi-manajemen-risiko":  "Evaluasi Manajemen Risiko",
    "evaluasi-reformasi-birokrasi": "Evaluasi Reformasi Birokrasi",
    "evaluasi-sakip":             "Evaluasi SAKIP/AKIP",
    "evaluasi-spip":              "Evaluasi SPIP",
    "evaluasi-umum":              "Evaluasi Umum",
    "konsultansi-umum":           "Konsultansi Umum",
    "konsultasi-pengadaan":       "Konsultasi/Pendampingan Pengadaan",
    "pemantauan-pengadaan":       "Pemantauan Pengadaan",
    "pemantauan-tindak-lanjut":   "Pemantauan Tindak Lanjut",
    "pemantauan-umum":            "Pemantauan Umum",
    "reviu-pengadaan":            "Reviu Pengadaan",
    "reviu-rka-kl":               "Reviu RKA-K/L",
    "reviu-umum":                 "Reviu Umum",
}

OBYEK = "Direktorat Layanan Digital Pemerintah (DLDP)"
NIP_PM = "197601012004011001"

for skill in SKILLS:
    base = Path(f"test-{skill}-render")
    (base / "_KKP").mkdir(parents=True, exist_ok=True)
    (base / "_PKP").mkdir(parents=True, exist_ok=True)
    (base / "_LHP").mkdir(parents=True, exist_ok=True)

    label = LABEL[skill]

    # context.md
    ctx = f"""# Context Penugasan

| Field | Value |
|---|---|
| Nomor ST | ST-TEST-{skill.upper()[:3]}/IJ.3/PW.06.01/01/2026 |
| Tanggal ST | 10 Januari 2026 |
| Obyek | {OBYEK} |
| Jenis Pengawasan | {skill} |
| Tahun Anggaran | 2025 |
| Periode Pelaksanaan | 10 Januari – 7 Februari 2026 |
| Penerima LHP | Direktur Jenderal Aplikasi Informatika |
| Dasar Penugasan | Program Kerja Pengawasan Tahunan (PKPT) Inspektorat Jenderal Tahun 2026 |

Tujuan: Menilai {label} pada {OBYEK} Tahun 2025.

Ruang Lingkup: {label} mencakup aspek perencanaan, pelaksanaan, dan pelaporan pada {OBYEK} TA 2025.

## Ringkasan Obyek
{OBYEK} merupakan unit eselon II di bawah Ditjen Aptika yang bertanggung jawab atas pengembangan dan pengelolaan layanan digital pemerintah. Pada TA 2025, DLDP melaksanakan berbagai program digitalisasi layanan publik dengan total anggaran Rp 45.000.000.000,00.

## Tim
| No | Nama | NIP | Jabatan | Jabfung |
|---|---|---|---|---|
| 1 | Ahmad Wijaya | {NIP_PM} | Pengendali Mutu | Auditor Madya |
| 2 | Dewi Rahayu | 198205152006012002 | Ketua Tim | Auditor Muda |
| 3 | Rizki Pratama | 199003122015031001 | Anggota Tim | Auditor Pertama |
"""
    (base / "context.md").write_text(ctx, encoding="utf-8")

    # temuan.json
    temuan = {
        "penugasan": {
            "penugasan_id": f"TEST-{skill.upper()[:6]}-001",
            "jenis_pengawasan": skill,
            "obyek": OBYEK,
            "nomor_st": f"ST-TEST-{skill.upper()[:3]}/IJ.3/PW.06.01/01/2026",
            "tanggal_st": "10 Januari 2026"
        },
        "temuan": [
            {
                "id_temuan": "T-01",
                "sasaran_id": "S01",
                "judul_temuan": f"Tata Kelola {label} Belum Sepenuhnya Sesuai Ketentuan",
                "kondisi": f"Berdasarkan penelaahan dokumen, pelaksanaan {label} pada {OBYEK} "
                           f"belum sepenuhnya memenuhi standar dan prosedur yang ditetapkan.",
                "kriteria": "Peraturan Pemerintah Nomor 60 Tahun 2008 tentang Sistem Pengendalian "
                            "Intern Pemerintah dan ketentuan perundang-undangan terkait.",
                "sebab": "Keterbatasan pemahaman petugas terhadap ketentuan yang berlaku.",
                "akibat": "Terdapat risiko tidak tercapainya tujuan program/kegiatan secara "
                          "efektif dan efisien.",
                "rekomendasi": f"Pimpinan {OBYEK} agar segera menyusun dan mengimplementasikan "
                               f"rencana tindak lanjut perbaikan atas temuan {label} yang "
                               f"ditemukan dalam periode pengawasan ini.",
                "level_risiko": "sedang",
                "nilai_rp": 0,
                "dokumen_sumber": [
                    {
                        "file": f"Dokumen-{label.replace(' ','-')}-2025.pdf",
                        "halaman": "1-10",
                        "ringkasan": f"Dokumen utama {label}"
                    }
                ]
            },
            {
                "id_temuan": "T-02",
                "sasaran_id": "S02",
                "judul_temuan": "Pelaporan Belum Memenuhi Standar yang Ditetapkan",
                "kondisi": f"Dokumen pelaporan {label} pada {OBYEK} belum memuat "
                           f"seluruh informasi yang dipersyaratkan dalam ketentuan.",
                "kriteria": "Standar Audit Intern Pemerintah Indonesia (SAIPI) AAIPI 2021 "
                            "dan pedoman teknis yang berlaku.",
                "sebab": "Belum tersedia SOP pelaporan yang komprehensif dan terstandar.",
                "akibat": "Kualitas laporan tidak optimal sehingga tidak dapat digunakan "
                          "sebagai dasar pengambilan keputusan yang memadai.",
                "rekomendasi": "Pimpinan agar menyusun SOP pelaporan yang memuat seluruh "
                               "komponen yang dipersyaratkan dan melaksanakan pelatihan bagi "
                               "pejabat penanggung jawab pelaporan.",
                "level_risiko": "rendah",
                "nilai_rp": 0,
                "dokumen_sumber": [
                    {
                        "file": f"Laporan-{label.replace(' ','-')}-2025.pdf",
                        "halaman": "5-15",
                        "ringkasan": "Dokumen laporan kegiatan"
                    }
                ]
            }
        ]
    }
    (base / "_KKP" / "temuan.json").write_text(
        json.dumps(temuan, indent=2, ensure_ascii=False), encoding="utf-8")

    # sasaran-assignment.json
    sa = {
        "penugasan_id": f"TEST-{skill.upper()[:6]}-001",
        "tujuan_penugasan": f"Menilai {label} pada {OBYEK} TA 2025.",
        "sasaran": [
            {
                "sasaran_id": "S01",
                "deskripsi": f"Menilai kesesuaian tata kelola {label} dengan ketentuan "
                             f"perundang-undangan yang berlaku pada {OBYEK} TA 2025",
                "assigned_to": ["Ahmad Wijaya", "Dewi Rahayu"],
                "status": "selesai"
            },
            {
                "sasaran_id": "S02",
                "deskripsi": f"Menilai kelengkapan dan kualitas pelaporan hasil {label} "
                             f"pada {OBYEK} TA 2025",
                "assigned_to": ["Rizki Pratama"],
                "status": "selesai"
            }
        ]
    }
    (base / "_PKP" / "sasaran-assignment.json").write_text(
        json.dumps(sa, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"OK {base}/")

print(f"\nTotal: {len(SKILLS)} skill test fixtures dibuat.")
