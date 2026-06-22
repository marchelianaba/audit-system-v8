'use client';

/**
 * HeroPenugasan — header detail penugasan ala SIMWAS v2.
 *
 * Layout: 2 kolom
 *   Left (col-span-1, fixed width-ish): Info penugasan (logo unit, nomor ST,
 *     tanggal mulai/selesai, participants, days, jenis pengawasan, judul, progress)
 *   Right (col-span-2): StageGrid 7 tahapan
 */
import { StageGrid, StageInfo, StageStatus } from './StageGrid';
import { Penugasan } from '@/lib/api';

const SKILL_LABEL: Record<string, string> = {
  'reviu-rka-kl': 'Reviu RKA-K/L',
  'reviu-pengadaan': 'Reviu Pengadaan',
  'reviu-umum': 'Reviu Umum',
  'audit-pengadaan': 'Audit Pengadaan',
  'audit-kinerja': 'Audit Kinerja',
  'audit-umum': 'Audit Umum',
  'evaluasi-sakip': 'Evaluasi SAKIP',
  'evaluasi-spip': 'Evaluasi SPIP',
  'evaluasi-reformasi-birokrasi': 'Evaluasi Reformasi Birokrasi',
  'evaluasi-manajemen-risiko': 'Evaluasi Manajemen Risiko',
  'evaluasi-umum': 'Evaluasi Umum',
  'kepatuhan-saipi': 'Kepatuhan SAIPI (QA)',
  'konsultansi-umum': 'Konsultansi Umum',
  'konsultasi-pengadaan': 'Pendampingan Pengadaan',
  'pemantauan-pengadaan': 'Pemantauan Pengadaan',
  'pemantauan-tindak-lanjut': 'Pemantauan Tindak Lanjut',
  'pemantauan-umum': 'Pemantauan Umum',
};

const SKILL_GROUP: Record<string, 'audit' | 'reviu' | 'evaluasi' | 'pemantauan' | 'konsultasi'> = {
  'audit-pengadaan': 'audit',
  'audit-kinerja': 'audit',
  'audit-umum': 'audit',
  'reviu-rka-kl': 'reviu',
  'reviu-pengadaan': 'reviu',
  'reviu-umum': 'reviu',
  'evaluasi-sakip': 'evaluasi',
  'evaluasi-spip': 'evaluasi',
  'evaluasi-reformasi-birokrasi': 'evaluasi',
  'evaluasi-manajemen-risiko': 'evaluasi',
  'evaluasi-umum': 'evaluasi',
  'kepatuhan-saipi': 'evaluasi',
  'pemantauan-pengadaan': 'pemantauan',
  'pemantauan-tindak-lanjut': 'pemantauan',
  'pemantauan-umum': 'pemantauan',
  'konsultansi-umum': 'konsultasi',
  'konsultasi-pengadaan': 'konsultasi',
};

// Map status penugasan → status tahapan workflow 7-tahap INTEGRAL.
// Urutan ketat: KP → PKP → KKP → LRS KK → Konsep Laporan → LRS LHP → Laporan Hasil.
function deriveStageStatus(
  penugasan: Penugasan,
  stageNum: number,
  lhpReviewStatus?: 'APPROVED' | 'NEEDS_REVISION' | null,
): StageStatus {
  const status = penugasan.status as string;
  // idx = posisi dalam rantai status; semakin tinggi = tahap lebih lanjut.
  const statusOrder = [
    'DRAFT',           // 0
    'KP_DONE',         // 1 — PT simpan KP
    'PKP_KT_DONE',     // 2 — KT simpan sasaran
    'PKP_DONE',        // 3 — PT setujui PKP
    'INGESTING',       // 4 — dokumen sedang diproses
    'KKP_IN_PROGRESS', // 5 — AT mengerjakan KKP
    'KKP_QC',          // 6 — legacy
    'KKP_AT_DONE',     // 7 — AT submit semua temuan
    'KKP_DONE',        // 8 — KT setujui LRS KK
    'LHP_IN_PROGRESS', // 9 — Konsep Laporan sedang dibuat
    'LHP_QC',          // 10 — legacy
    'LHP_DONE',        // 11 — Konsep Laporan tersedia
  ];
  const idx = statusOrder.indexOf(status);

  // Stage 0 (Survey) — hanya audit-*
  if (stageNum === 0) {
    return SKILL_GROUP[penugasan.skill] === 'audit' ? 'pending' : 'locked';
  }

  // Stage 1 — Kartu Penugasan: in_progress saat DRAFT, done setelah PT simpan
  if (stageNum === 1) {
    return status === 'DRAFT' ? 'in_progress' : (idx >= 1 ? 'done' : 'in_progress');
  }

  // Stage 2 — PKP: locked sampai KP_DONE; in_progress saat KT sudah simpan; done saat PT setujui
  if (stageNum === 2) {
    if (idx < 1) return 'locked';     // KP belum disimpan
    if (idx >= 3) return 'done';      // PKP_DONE atau lebih tinggi
    if (status === 'PKP_KT_DONE') return 'in_progress'; // KT sudah isi, PT belum setujui
    return 'pending';
  }

  // Stage 3 — KKP: locked sampai PKP_DONE; done saat AT submit (KKP_AT_DONE) atau lebih tinggi
  if (stageNum === 3) {
    if (idx < 3) return 'locked';     // PKP belum disetujui
    if (idx >= 7) return 'done';      // KKP_AT_DONE (7) atau lebih tinggi
    if (idx >= 4) return 'in_progress'; // INGESTING / KKP_IN_PROGRESS / KKP_QC
    return 'pending';
  }

  // Stage 4 — LRS KK: locked sampai AT selesai (KKP_AT_DONE); in_progress menunggu KT; done saat KKP_DONE
  if (stageNum === 4) {
    if (idx < 3) return 'locked';     // PKP belum disetujui
    if (idx >= 8) return 'done';      // KKP_DONE (8) atau lebih tinggi
    if (status === 'KKP_AT_DONE') return 'in_progress'; // AT selesai, KT perlu menilai
    return 'locked';                   // AT belum selesai
  }

  // Stage 5 — Konsep Laporan: locked sampai KKP_DONE; reverts ke in_progress bila LRS LHP ditolak
  if (stageNum === 5) {
    if (idx < 8) return 'locked';     // KKP_DONE belum tercapai
    if (status === 'LHP_DONE') {
      return lhpReviewStatus === 'NEEDS_REVISION' ? 'in_progress' : 'done';
    }
    if (idx >= 9) return 'in_progress'; // LHP_IN_PROGRESS / LHP_QC
    return 'pending';
  }

  // Stage 6 — LRS LHP: PT/PM reviu konsep laporan
  if (stageNum === 6) {
    if (lhpReviewStatus === 'APPROVED') return 'done';
    if (lhpReviewStatus === 'NEEDS_REVISION') return 'in_progress';
    if (status === 'LHP_DONE') return 'in_progress'; // menunggu reviu PT
    return 'locked';
  }

  // Stage 7 — Laporan Hasil: terbuka setelah LRS LHP disetujui PT
  if (stageNum === 7) {
    return lhpReviewStatus === 'APPROVED' ? 'pending' : 'locked';
  }

  return 'pending';
}

export function HeroPenugasan({
  penugasan,
  lhpReviewStatus,
  onStageSelect,
  activeStage,
}: {
  penugasan: Penugasan;
  lhpReviewStatus?: 'APPROVED' | 'NEEDS_REVISION' | null;
  /** Kartu tahapan = navigasi (ala SIMWAS): klik → buka workspace tahapan tsb. */
  onStageSelect?: (stageNum: number) => void;
  /** Tahapan yang sedang dibuka — di-highlight di grid. */
  activeStage?: number;
}) {
  const skillGroup = SKILL_GROUP[penugasan.skill];
  const showSurvey = skillGroup === 'audit';
  const skillLabel = SKILL_LABEL[penugasan.skill] || penugasan.skill;
  const st = (n: number) => deriveStageStatus(penugasan, n, lhpReviewStatus);

  // Progress % berbasis tahapan done
  const totalStages = showSurvey ? 8 : 7;
  const stages: StageInfo[] = [
    { num: 0, label: 'Survey Pendahuluan', hint: 'Hanya audit-*', status: st(0) },
    { num: 1, label: 'Kartu Penugasan', hint: 'PT simpan → unlock PKP', status: st(1) },
    { num: 2, label: 'PKP', hint: 'KT isi + PT setujui', status: st(2) },
    { num: 3, label: 'KKP', hint: 'AT kerjakan + submit', status: st(3) },
    { num: 4, label: 'LRS KK', hint: 'KT nilai Sesuai/Tidak', status: st(4) },
    { num: 5, label: 'Konsep Laporan', hint: 'KT · LHP draft', status: st(5) },
    { num: 6, label: 'LRS LHP', hint: 'PT/PM review', status: st(6) },
    { num: 7, label: 'Laporan Hasil', hint: 'Inspektur', status: st(7) },
  ];

  const doneCount = stages.filter((s, i) => (i > 0 || showSurvey) && s.status === 'done').length;
  const progress = Math.round((doneCount / totalStages) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Left panel — info penugasan */}
      <div className="md:col-span-1 integral-card p-4">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-dark flex items-center justify-center text-lg">🏛</div>
          <div>
            <div className="font-semibold text-sm">Inspektorat II</div>
            <div className="text-xs text-gray-500 font-mono">{penugasan.nomor_st || '[Nomor ST belum diisi]'}</div>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-gray-400 uppercase text-[10px] mb-0.5">Tanggal ST</div>
            <div>{penugasan.tanggal_st || <span className="text-gray-400">—</span>}</div>
          </div>
          <div>
            <div className="text-gray-400 uppercase text-[10px] mb-0.5">Jenis Pengawasan</div>
            <div className="font-medium text-primary-dark">{skillLabel}</div>
          </div>
          <div>
            <div className="text-gray-400 uppercase text-[10px] mb-0.5">Obyek</div>
            <div>{penugasan.obyek}</div>
          </div>
          <div>
            <div className="text-gray-400 uppercase text-[10px] mb-0.5">Status</div>
            <div className="inline-block px-2 py-0.5 rounded-full bg-primary-50 text-primary text-[11px] font-semibold">
              {penugasan.status}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Progres Tahapan</span>
            <span className="font-semibold text-primary">{doneCount}/{totalStages} • {progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full integral-gradient rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Right panel — 7/8 tahapan grid */}
      <div className="md:col-span-2 integral-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-primary-dark">Detail Pelaksanaan Penugasan</h3>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            klik tahapan untuk membuka · {totalStages} tahap
          </span>
        </div>
        <StageGrid
          stages={stages}
          showSurvey={showSurvey}
          activeNum={activeStage}
          onSelect={onStageSelect ? (s) => onStageSelect(Number(s.num)) : undefined}
        />
      </div>
    </div>
  );
}
