"""Jalankan semua build_* scripts untuk rebuild template DOCX."""
import subprocess, sys
from pathlib import Path

ROOT = Path(__file__).parent
scripts = [
    "build_audit_umum_template.py",
    "build_audit_kinerja_template.py",
    "build_audit_pengadaan_template.py",
    "build_evaluasi_sakip_template.py",
    "build_evaluasi_spip_template.py",
    "build_evaluasi_mr_template.py",
    "build_evaluasi_rb_template.py",
    "build_evaluasi_umum_template.py",
    "build_pemantauan_templates.py",
    "build_reviu_templates.py",
    "build_konsultansi_umum_template.py",
    "build_konsultasi_pengadaan_template.py",
]
ok = err = 0
for s in scripts:
    r = subprocess.run([sys.executable, s], capture_output=True, text=True, cwd=str(ROOT))
    if r.returncode == 0:
        print(f"OK  {s}\n    {r.stdout.strip()}")
        ok += 1
    else:
        print(f"ERR {s}\n    {r.stderr.strip()[-500:]}")
        err += 1
print(f"\n{ok} OK, {err} ERR")
