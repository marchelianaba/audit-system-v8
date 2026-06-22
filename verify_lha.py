from docx import Document
doc = Document("test-audit-umum-render/_LHP/LHA-TEST.docx")
print("=== KONTEN LAPORAN (paragraf berisi teks) ===")
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt:
        print(f"{i:3}: {txt[:110]}")
