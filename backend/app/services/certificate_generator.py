import os
import re
import math
import base64
import io
from datetime import datetime
from typing import Optional, Dict, Any

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from backend.app.db.database import CERTIFICATES_DIR


def replace_dynamic_variables(text: str, context: Dict[str, str]) -> str:
    """Replaces {{placeholder}} tokens with values from context."""
    if not text:
        return ""
    result = text
    for key, value in context.items():
        pattern = re.compile(rf"\{{\{{\s*{key}\s*\}}\}}", re.IGNORECASE)
        result = pattern.sub(str(value), result)
    return result


def draw_styled_border(c: canvas.Canvas, border_style: str, page_width: float, page_height: float):
    """Draws distinctive decorative border frames matching the chosen style."""
    if border_style == "classic_gold":
        margin_outer = 22
        margin_gold = 26
        margin_inner = 30

        c.setStrokeColor(colors.HexColor("#0F172A"))
        c.setLineWidth(3)
        c.rect(margin_outer, margin_outer, page_width - (margin_outer * 2), page_height - (margin_outer * 2), fill=0, stroke=1)

        c.setStrokeColor(colors.HexColor("#D97706"))
        c.setLineWidth(1.2)
        c.rect(margin_gold, margin_gold, page_width - (margin_gold * 2), page_height - (margin_gold * 2), fill=0, stroke=1)

        c.setStrokeColor(colors.HexColor("#1E293B"))
        c.setLineWidth(0.6)
        c.rect(margin_inner, margin_inner, page_width - (margin_inner * 2), page_height - (margin_inner * 2), fill=0, stroke=1)

        # Corner Diamonds
        corners = [
            (margin_inner, margin_inner),
            (page_width - margin_inner, margin_inner),
            (margin_inner, page_height - margin_inner),
            (page_width - margin_inner, page_height - margin_inner),
        ]
        for cx, cy in corners:
            c.setFillColor(colors.HexColor("#B45309"))
            p = c.beginPath()
            p.moveTo(cx, cy - 6)
            p.lineTo(cx + 6, cy)
            p.lineTo(cx, cy + 6)
            p.lineTo(cx - 6, cy)
            p.close()
            c.drawPath(p, fill=1, stroke=0)

    elif border_style == "modern_minimal":
        # Ultra-clean thin slate border
        margin = 25
        c.setStrokeColor(colors.HexColor("#E2E8F0"))
        c.setLineWidth(1)
        c.rect(margin, margin, page_width - (margin * 2), page_height - (margin * 2), fill=0, stroke=1)

        # Left modern emerald accent bar
        c.setFillColor(colors.HexColor("#0D9488"))
        c.rect(margin, margin, 10, page_height - (margin * 2), fill=1, stroke=0)

    elif border_style == "corporate_blue":
        margin = 24
        c.setStrokeColor(colors.HexColor("#1E3A8A"))
        c.setLineWidth(3)
        c.rect(margin, margin, page_width - (margin * 2), page_height - (margin * 2), fill=0, stroke=1)

        c.setStrokeColor(colors.HexColor("#93C5FD"))
        c.setLineWidth(1)
        c.rect(margin + 4, margin + 4, page_width - ((margin + 4) * 2), page_height - ((margin + 4) * 2), fill=0, stroke=1)

    elif border_style == "elegant_black":
        margin = 24
        c.setStrokeColor(colors.HexColor("#09090B"))
        c.setLineWidth(2.5)
        c.rect(margin, margin, page_width - (margin * 2), page_height - (margin * 2), fill=0, stroke=1)

        c.setStrokeColor(colors.HexColor("#71717A"))
        c.setLineWidth(0.75)
        c.rect(margin + 6, margin + 6, page_width - ((margin + 6) * 2), page_height - ((margin + 6) * 2), fill=0, stroke=1)

    elif border_style == "academic":
        margin = 24
        c.setStrokeColor(colors.HexColor("#78350F"))
        c.setLineWidth(3)
        c.rect(margin, margin, page_width - (margin * 2), page_height - (margin * 2), fill=0, stroke=1)

        c.setStrokeColor(colors.HexColor("#D97706"))
        c.setLineWidth(1)
        c.rect(margin + 5, margin + 5, page_width - ((margin + 5) * 2), page_height - ((margin + 5) * 2), fill=0, stroke=1)

    elif border_style == "creative_gradient":
        margin = 22
        c.setStrokeColor(colors.HexColor("#8B5CF6"))
        c.setLineWidth(2.5)
        c.rect(margin, margin, page_width - (margin * 2), page_height - (margin * 2), fill=0, stroke=1)

        c.setStrokeColor(colors.HexColor("#EC4899"))
        c.setLineWidth(1)
        c.rect(margin + 5, margin + 5, page_width - ((margin + 5) * 2), page_height - ((margin + 5) * 2), fill=0, stroke=1)


def generate_certificate_pdf(
    certificate_id: str,
    recipient_name: str,
    event_name: str,
    event_date: str,
    organization: str = "Aereo Learning",
    recipient_email: str = "",
    issue_date: str = None,
    template_config: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Generates a high-quality landscape certificate PDF using ReportLab.
    If template_config is provided, generates the PDF based on the custom template elements.
    """
    if issue_date is None:
        issue_date = datetime.now().strftime("%d %B %Y")

    filename = f"certificate_{certificate_id}.pdf"
    file_path = os.path.join(CERTIFICATES_DIR, filename)

    page_width, page_height = landscape(letter)  # 792 x 612 pt
    c = canvas.Canvas(file_path, pagesize=(page_width, page_height))
    c.setTitle(f"Certificate of Participation - {recipient_name}")
    c.setAuthor(organization)
    c.setSubject(f"{event_name} Certificate")

    context = {
        "recipient_name": recipient_name.strip(),
        "recipient_email": recipient_email.strip(),
        "event_name": event_name.strip(),
        "event_date": event_date.strip(),
        "organization": organization.strip(),
        "certificate_id": certificate_id.strip(),
        "issue_date": issue_date.strip(),
    }

    # If no custom template configuration provided, use fallback classic design
    if not template_config or not template_config.get("elements"):
        # Default Classic Gold rendering
        c.setFillColor(colors.HexColor("#FCFBF9"))
        c.rect(0, 0, page_width, page_height, fill=1, stroke=0)
        draw_styled_border(c, "classic_gold", page_width, page_height)

        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(colors.HexColor("#1E293B"))
        c.drawCentredString(page_width / 2.0, 520, organization.upper())

        c.setStrokeColor(colors.HexColor("#CBD5E1"))
        c.setLineWidth(0.75)
        c.line(page_width / 2.0 - 140, 508, page_width / 2.0 + 140, 508)
        c.setFillColor(colors.HexColor("#D97706"))
        c.circle(page_width / 2.0, 508, 2.5, fill=1, stroke=0)

        c.setFont("Helvetica-Bold", 26)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawCentredString(page_width / 2.0, 470, "CERTIFICATE OF PARTICIPATION")

        c.setFont("Times-Italic", 14)
        c.setFillColor(colors.HexColor("#475569"))
        c.drawCentredString(page_width / 2.0, 435, "This is proudly presented to certify that")

        c.setFont("Helvetica-Bold", 30)
        c.setFillColor(colors.HexColor("#1E1B4B"))
        c.drawCentredString(page_width / 2.0, 385, recipient_name.strip())

        c.setStrokeColor(colors.HexColor("#D97706"))
        c.setLineWidth(1.5)
        c.line(page_width / 2.0 - 140, 372, page_width / 2.0 + 140, 372)

        c.setFont("Times-Italic", 14)
        c.setFillColor(colors.HexColor("#475569"))
        c.drawCentredString(page_width / 2.0, 342, "has successfully participated in the program")

        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawCentredString(page_width / 2.0, 310, event_name.strip())

        c.setFont("Helvetica", 12)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawCentredString(page_width / 2.0, 282, f"conducted on {event_date}")

        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawString(75, 142, "CERTIFICATE ID")
        c.setFont("Courier-Bold", 10)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawString(75, 127, certificate_id)

        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawString(75, 105, "ISSUE DATE")
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawString(75, 90, issue_date)

        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawCentredString(page_width - 150, 100, "Authorized Signatory")
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawCentredString(page_width - 150, 87, organization)

        c.showPage()
        c.save()
        return file_path

    # --- RENDER FROM DYNAMIC TEMPLATE CONFIGURATION ---
    canvas_w = float(template_config.get("canvas_width", 800))
    canvas_h = float(template_config.get("canvas_height", 566))
    scale_x = page_width / canvas_w
    scale_y = page_height / canvas_h

    # 1. Background Fill
    bg_color = template_config.get("background", "#FFFFFF")
    try:
        c.setFillColor(colors.HexColor(bg_color))
    except Exception:
        c.setFillColor(colors.white)
    c.rect(0, 0, page_width, page_height, fill=1, stroke=0)

    # 2. Border Style
    border_style = template_config.get("borderStyle", "classic_gold")
    draw_styled_border(c, border_style, page_width, page_height)

    # 3. Render Elements sorted by zIndex
    elements = template_config.get("elements", [])
    sorted_elements = sorted(elements, key=lambda el: el.get("zIndex", 1))

    for el in sorted_elements:
        el_type = el.get("type", "text")
        raw_x = float(el.get("x", 0))
        raw_y = float(el.get("y", 0))
        raw_w = float(el.get("width", 100))
        raw_h = float(el.get("height", 30))

        # Convert web coordinate system (top-left 0,0) to ReportLab (bottom-left 0,0)
        x = raw_x * scale_x
        w = raw_w * scale_x
        h = raw_h * scale_y
        y = page_height - ((raw_y + raw_h) * scale_y)

        if el_type == "text":
            raw_text = el.get("text", "")
            rendered_text = replace_dynamic_variables(raw_text, context)
            if not rendered_text.strip():
                continue

            font_family = el.get("fontFamily", "Helvetica")
            font_weight = el.get("fontWeight", "normal")
            font_style = el.get("fontStyle", "normal")
            font_size = float(el.get("fontSize", 16)) * scale_y
            text_color = el.get("color", "#000000")
            alignment = el.get("alignment", "center")

            # Determine ReportLab font name
            base_font = "Helvetica"
            if "times" in font_family.lower() or "serif" in font_family.lower():
                base_font = "Times"
            elif "courier" in font_family.lower() or "mono" in font_family.lower():
                base_font = "Courier"

            if base_font == "Times":
                if font_weight == "bold" and font_style == "italic":
                    rl_font = "Times-BoldItalic"
                elif font_weight == "bold":
                    rl_font = "Times-Bold"
                elif font_style == "italic":
                    rl_font = "Times-Italic"
                else:
                    rl_font = "Times-Roman"
            elif base_font == "Courier":
                if font_weight == "bold" and font_style == "italic":
                    rl_font = "Courier-BoldOblique"
                elif font_weight == "bold":
                    rl_font = "Courier-Bold"
                elif font_style == "italic":
                    rl_font = "Courier-Oblique"
                else:
                    rl_font = "Courier"
            else:
                if font_weight == "bold" and font_style == "italic":
                    rl_font = "Helvetica-BoldOblique"
                elif font_weight == "bold":
                    rl_font = "Helvetica-Bold"
                elif font_style == "italic":
                    rl_font = "Helvetica-Oblique"
                else:
                    rl_font = "Helvetica"

            c.setFont(rl_font, font_size)
            try:
                c.setFillColor(colors.HexColor(text_color))
            except Exception:
                c.setFillColor(colors.black)

            lines = rendered_text.split("\n")
            line_spacing = font_size * 1.2
            total_text_h = len(lines) * line_spacing

            # Vertical center within bounding box
            baseline_y = y + (h / 2.0) + (total_text_h / 2.0) - font_size

            for idx, line in enumerate(lines):
                cur_y = baseline_y - (idx * line_spacing)
                if alignment == "center":
                    c.drawCentredString(x + (w / 2.0), cur_y, line)
                elif alignment == "right":
                    c.drawRightString(x + w, cur_y, line)
                else:
                    c.drawString(x, cur_y, line)

        elif el_type == "shape":
            shape_type = el.get("shapeType", "rectangle")
            fill_color = el.get("fillColor", "#D97706")
            stroke_color = el.get("strokeColor", "#B45309")
            stroke_width = float(el.get("strokeWidth", 1.0)) * scale_x

            try:
                c.setFillColor(colors.HexColor(fill_color))
            except Exception:
                c.setFillColor(colors.transparent)

            try:
                c.setStrokeColor(colors.HexColor(stroke_color))
            except Exception:
                c.setStrokeColor(colors.black)
            c.setLineWidth(stroke_width)

            if shape_type == "line":
                line_y = y + (h / 2.0)
                c.line(x, line_y, x + w, line_y)
            elif shape_type == "circle":
                radius = min(w, h) / 2.0
                c.circle(x + (w / 2.0), y + (h / 2.0), radius, fill=1, stroke=int(stroke_width > 0))
            else:  # rectangle
                c.rect(x, y, w, h, fill=1, stroke=int(stroke_width > 0))

        elif el_type in ("image", "logo", "signature"):
            src = el.get("src")
            if src and src.startswith("data:image/"):
                try:
                    header, encoded = src.split(",", 1)
                    img_data = base64.b64decode(encoded)
                    img_stream = io.BytesIO(img_data)
                    reader = ImageReader(img_stream)
                    c.drawImage(reader, x, y, width=w, height=h, preserveAspectRatio=True, mask="auto")
                except Exception as img_err:
                    print(f"Failed to draw image on PDF: {img_err}")

    c.showPage()
    c.save()
    return file_path
