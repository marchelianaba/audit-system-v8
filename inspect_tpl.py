from docx import Document
from pathlib import Path

doc = Document("knowledge/templates/_skeleton-lhp/template-lhp-audit-umum.docx")
print("=== SEMUA PARAGRAF (dengan teks) ===")
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt:
        print(f"{i:3}: {txt[:100]}")
