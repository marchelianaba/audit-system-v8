$skills = @(
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
    "reviu-umum"
)

$ok = 0; $fail = 0
foreach ($skill in $skills) {
    $pen = "test-$skill-render"
    $out = "$pen/_LHP/LH-TEST.docx"
    $tpl = "knowledge/templates/_skeleton-lhp/template-lhp-$skill.docx"
    $result = python backend/v6/scripts/render_lhp.py --penugasan $pen --template $tpl --out $out 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK  $skill : $result"
        $ok++
    } else {
        Write-Host "ERR $skill : $result"
        $fail++
    }
}
Write-Host ""
Write-Host "Selesai: $ok OK, $fail ERROR"
