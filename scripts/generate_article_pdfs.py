from __future__ import annotations

import json
import textwrap
from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS_DIR = ROOT / 'public' / 'downloads'


SECTION_ORDER = [
    ('abstract', 'Abstract'),
    ('introduction', 'Introduction'),
    ('methods', 'Methods'),
    ('results', 'Results'),
    ('discussion', 'Discussion'),
    ('references', 'References'),
    ('key_results_summary', 'Key Results Summary'),
]


def normalize_to_lines(value: object) -> list[str]:
    if value is None:
        return []

    if isinstance(value, str):
        chunks = [part.strip() for part in value.split('\n\n') if part.strip()]
        return chunks or [value.strip()]

    if isinstance(value, list):
        lines: list[str] = []
        for item in value:
            if isinstance(item, (str, int, float)):
                lines.append(str(item))
            elif isinstance(item, dict):
                lines.append(json.dumps(item, ensure_ascii=False))
        return [line for line in lines if line.strip()]

    if isinstance(value, dict):
        return [json.dumps(value, ensure_ascii=False, indent=2)]

    return [str(value)]


def draw_wrapped_line(c: canvas.Canvas, text: str, x: float, y: float, width: int, font: str = 'Helvetica', size: int = 10) -> float:
    c.setFont(font, size)
    wrapped = textwrap.wrap(text, width=width) or ['']
    for line in wrapped:
        c.drawString(x, y, line)
        y -= size + 3
    return y


def ensure_space(c: canvas.Canvas, y: float, required: float) -> float:
    if y > required:
        return y
    c.showPage()
    c.setFont('Helvetica', 10)
    return LETTER[1] - 54


def write_pdf(article_json_path: Path, output_pdf_path: Path) -> None:
    article = json.loads(article_json_path.read_text(encoding='utf-8'))

    c = canvas.Canvas(str(output_pdf_path), pagesize=LETTER)
    y = LETTER[1] - 54

    title = article.get('title', article_json_path.stem)
    authors = article.get('authors', 'Unknown authors')

    c.setFont('Helvetica-Bold', 14)
    for line in textwrap.wrap(title, width=85):
        c.drawString(45, y, line)
        y -= 19

    y -= 4
    c.setFont('Helvetica', 11)
    y = draw_wrapped_line(c, f'Authors: {authors}', 45, y, width=100, size=11)
    y -= 8

    for key, label in SECTION_ORDER:
        lines = normalize_to_lines(article.get(key))
        if not lines:
            continue

        y = ensure_space(c, y, 120)
        c.setFont('Helvetica-Bold', 12)
        c.drawString(45, y, label)
        y -= 16
        for paragraph in lines:
            y = ensure_space(c, y, 100)
            y = draw_wrapped_line(c, paragraph, 52, y, width=110)
            y -= 5

    tables = article.get('tables', [])
    if tables:
        y = ensure_space(c, y, 130)
        c.setFont('Helvetica-Bold', 12)
        c.drawString(45, y, 'Tables')
        y -= 16

        for idx, table in enumerate(tables, start=1):
            y = ensure_space(c, y, 120)
            c.setFont('Helvetica-Bold', 11)
            c.drawString(52, y, f"{idx}. {table.get('table_name', 'Table')}")
            y -= 14
            headers = ' | '.join([str(h) for h in table.get('headers', [])])
            y = draw_wrapped_line(c, f'Headers: {headers}', 60, y, width=105, size=9)
            for row in table.get('rows', []):
                row_text = ' | '.join(str(cell) for cell in row)
                y = ensure_space(c, y, 90)
                y = draw_wrapped_line(c, f'- {row_text}', 60, y, width=105, size=9)
            y -= 8

    figures = article.get('figures', [])
    if figures:
        y = ensure_space(c, y, 120)
        c.setFont('Helvetica-Bold', 12)
        c.drawString(45, y, 'Figures')
        y -= 16
        for fig in figures:
            y = ensure_space(c, y, 90)
            y = draw_wrapped_line(
                c,
                f"{fig.get('figure_name', 'Figure')}: {fig.get('description', '')}",
                52,
                y,
                width=108,
            )
            y -= 4

    c.save()


def main() -> None:
    tasks = [
        ('article_a_extracted.json', 'article_a_pathology_encoding.pdf'),
        ('article_b_extracted.json', 'article_b_cdss_multiagent.pdf'),
    ]

    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

    for source_name, target_name in tasks:
        source = ROOT / source_name
        target = DOWNLOADS_DIR / target_name
        write_pdf(source, target)
        print(f'Generated: {target}')


if __name__ == '__main__':
    main()
