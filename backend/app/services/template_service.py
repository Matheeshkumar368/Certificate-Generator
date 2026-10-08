import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from backend.app.db.models import Template
from backend.app.schemas.template import TemplateCreate, TemplateUpdate


def get_default_sample_templates() -> List[Dict[str, Any]]:
    """Defines 6 distinctly designed professional sample templates."""
    return [
        {
            "id": "tpl-classic-gold-01",
            "name": "Classic Gold",
            "description": "Timeless traditional certificate with double navy and gold ornamental borders and official seal.",
            "category": "Classic",
            "orientation": "landscape",
            "canvas_width": 800,
            "canvas_height": 566,
            "is_system_template": True,
            "configuration": {
                "background": "#FCFBF9",
                "borderStyle": "classic_gold",
                "elements": [
                    {
                        "id": "el-org",
                        "type": "text",
                        "text": "{{organization}}",
                        "x": 100,
                        "y": 55,
                        "width": 600,
                        "height": 28,
                        "fontFamily": "Helvetica",
                        "fontSize": 15,
                        "fontWeight": "bold",
                        "color": "#1E293B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-title",
                        "type": "text",
                        "text": "CERTIFICATE OF PARTICIPATION",
                        "x": 80,
                        "y": 100,
                        "width": 640,
                        "height": 38,
                        "fontFamily": "Helvetica",
                        "fontSize": 24,
                        "fontWeight": "bold",
                        "color": "#0F172A",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-intro",
                        "type": "text",
                        "text": "This is proudly presented to certify that",
                        "x": 100,
                        "y": 145,
                        "width": 600,
                        "height": 24,
                        "fontFamily": "Times-Roman",
                        "fontSize": 14,
                        "fontStyle": "italic",
                        "color": "#475569",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-recipient",
                        "type": "text",
                        "text": "{{recipient_name}}",
                        "x": 80,
                        "y": 190,
                        "width": 640,
                        "height": 45,
                        "fontFamily": "Helvetica",
                        "fontSize": 30,
                        "fontWeight": "bold",
                        "color": "#1E1B4B",
                        "alignment": "center",
                        "zIndex": 3
                    },
                    {
                        "id": "el-line-rec",
                        "type": "shape",
                        "shapeType": "line",
                        "x": 220,
                        "y": 240,
                        "width": 360,
                        "height": 2,
                        "fillColor": "#D97706",
                        "strokeColor": "#D97706",
                        "strokeWidth": 2,
                        "zIndex": 1
                    },
                    {
                        "id": "el-stmt",
                        "type": "text",
                        "text": "has successfully participated in the program",
                        "x": 100,
                        "y": 260,
                        "width": 600,
                        "height": 24,
                        "fontFamily": "Times-Roman",
                        "fontSize": 13,
                        "fontStyle": "italic",
                        "color": "#475569",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-event",
                        "type": "text",
                        "text": "{{event_name}}",
                        "x": 80,
                        "y": 295,
                        "width": 640,
                        "height": 34,
                        "fontFamily": "Helvetica",
                        "fontSize": 20,
                        "fontWeight": "bold",
                        "color": "#0F172A",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-date-conduct",
                        "type": "text",
                        "text": "conducted on {{event_date}}",
                        "x": 100,
                        "y": 335,
                        "width": 600,
                        "height": 22,
                        "fontFamily": "Helvetica",
                        "fontSize": 12,
                        "color": "#64748B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-cid",
                        "type": "text",
                        "text": "Certificate ID: {{certificate_id}}",
                        "x": 55,
                        "y": 485,
                        "width": 260,
                        "height": 20,
                        "fontFamily": "Courier",
                        "fontSize": 9,
                        "color": "#64748B",
                        "alignment": "left",
                        "zIndex": 2
                    },
                    {
                        "id": "el-issue",
                        "type": "text",
                        "text": "Issue Date: {{issue_date}}",
                        "x": 55,
                        "y": 505,
                        "width": 260,
                        "height": 20,
                        "fontFamily": "Helvetica",
                        "fontSize": 9,
                        "color": "#64748B",
                        "alignment": "left",
                        "zIndex": 2
                    },
                    {
                        "id": "el-sig",
                        "type": "text",
                        "text": "Authorized Signatory\n{{organization}}",
                        "x": 520,
                        "y": 485,
                        "width": 230,
                        "height": 35,
                        "fontFamily": "Helvetica",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "color": "#0F172A",
                        "alignment": "center",
                        "zIndex": 2
                    }
                ]
            }
        },
        {
            "id": "tpl-modern-minimal-02",
            "name": "Modern Minimal",
            "description": "Sleek contemporary design with emerald accent line, airy typography, and high legibility.",
            "category": "Modern",
            "orientation": "landscape",
            "canvas_width": 800,
            "canvas_height": 566,
            "is_system_template": True,
            "configuration": {
                "background": "#FFFFFF",
                "borderStyle": "modern_minimal",
                "elements": [
                    {
                        "id": "el-bar",
                        "type": "shape",
                        "shapeType": "rectangle",
                        "x": 0,
                        "y": 0,
                        "width": 24,
                        "height": 566,
                        "fillColor": "#0D9488",
                        "strokeColor": "#0F766E",
                        "strokeWidth": 0,
                        "zIndex": 1
                    },
                    {
                        "id": "el-org-m",
                        "type": "text",
                        "text": "{{organization}}",
                        "x": 70,
                        "y": 60,
                        "width": 400,
                        "height": 24,
                        "fontFamily": "Helvetica",
                        "fontSize": 13,
                        "fontWeight": "bold",
                        "color": "#0D9488",
                        "alignment": "left",
                        "zIndex": 2
                    },
                    {
                        "id": "el-title-m",
                        "type": "text",
                        "text": "CERTIFICATE OF COMPLETION",
                        "x": 70,
                        "y": 105,
                        "width": 650,
                        "height": 40,
                        "fontFamily": "Helvetica",
                        "fontSize": 28,
                        "fontWeight": "bold",
                        "color": "#0F172A",
                        "alignment": "left",
                        "zIndex": 2
                    },
                    {
                        "id": "el-intro-m",
                        "type": "text",
                        "text": "This certificate is officially presented to",
                        "x": 70,
                        "y": 165,
                        "width": 500,
                        "height": 24,
                        "fontFamily": "Helvetica",
                        "fontSize": 13,
                        "color": "#64748B",
                        "alignment": "left",
                        "zIndex": 2
                    },
                    {
                        "id": "el-rec-m",
                        "type": "text",
                        "text": "{{recipient_name}}",
                        "x": 70,
                        "y": 205,
                        "width": 660,
                        "height": 50,
                        "fontFamily": "Helvetica",
                        "fontSize": 34,
                        "fontWeight": "bold",
                        "color": "#0F766E",
                        "alignment": "left",
                        "zIndex": 2
                    },
                    {
                        "id": "el-desc-m",
                        "type": "text",
                        "text": "in recognition of successful completion and mastery of {{event_name}}, conducted on {{event_date}}.",
                        "x": 70,
                        "y": 280,
                        "width": 620,
                        "height": 45,
                        "fontFamily": "Helvetica",
                        "fontSize": 14,
                        "color": "#334155",
                        "alignment": "left",
                        "lineHeight": 1.4,
                        "zIndex": 2
                    },
                    {
                        "id": "el-meta-m",
                        "type": "text",
                        "text": "Credential ID: {{certificate_id}}  •  Issued: {{issue_date}}",
                        "x": 70,
                        "y": 485,
                        "width": 450,
                        "height": 22,
                        "fontFamily": "Courier",
                        "fontSize": 10,
                        "color": "#94A3B8",
                        "alignment": "left",
                        "zIndex": 2
                    },
                    {
                        "id": "el-sig-m",
                        "type": "text",
                        "text": "Verified Program Director\n{{organization}}",
                        "x": 540,
                        "y": 475,
                        "width": 210,
                        "height": 35,
                        "fontFamily": "Helvetica",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "color": "#0F172A",
                        "alignment": "right",
                        "zIndex": 2
                    }
                ]
            }
        },
        {
            "id": "tpl-corporate-blue-03",
            "name": "Corporate Blue",
            "description": "High-authority enterprise design with deep cobalt headers, crisp geometric dividers, and dual verification lines.",
            "category": "Corporate",
            "orientation": "landscape",
            "canvas_width": 800,
            "canvas_height": 566,
            "is_system_template": True,
            "configuration": {
                "background": "#F8FAFC",
                "borderStyle": "corporate_blue",
                "elements": [
                    {
                        "id": "el-header-box",
                        "type": "shape",
                        "shapeType": "rectangle",
                        "x": 30,
                        "y": 30,
                        "width": 740,
                        "height": 85,
                        "fillColor": "#1E3A8A",
                        "strokeColor": "#172554",
                        "strokeWidth": 1,
                        "zIndex": 1
                    },
                    {
                        "id": "el-org-c",
                        "type": "text",
                        "text": "{{organization}}",
                        "x": 50,
                        "y": 45,
                        "width": 700,
                        "height": 20,
                        "fontFamily": "Helvetica",
                        "fontSize": 12,
                        "fontWeight": "bold",
                        "color": "#93C5FD",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-title-c",
                        "type": "text",
                        "text": "CERTIFICATE OF PROFESSIONAL EXCELLENCE",
                        "x": 50,
                        "y": 72,
                        "width": 700,
                        "height": 30,
                        "fontFamily": "Helvetica",
                        "fontSize": 20,
                        "fontWeight": "bold",
                        "color": "#FFFFFF",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-certify-c",
                        "type": "text",
                        "text": "This credential certifies that",
                        "x": 100,
                        "y": 150,
                        "width": 600,
                        "height": 22,
                        "fontFamily": "Helvetica",
                        "fontSize": 13,
                        "color": "#64748B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-rec-c",
                        "type": "text",
                        "text": "{{recipient_name}}",
                        "x": 60,
                        "y": 185,
                        "width": 680,
                        "height": 45,
                        "fontFamily": "Helvetica",
                        "fontSize": 32,
                        "fontWeight": "bold",
                        "color": "#1E3A8A",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-for-c",
                        "type": "text",
                        "text": "has demonstrated competence and achieved distinction in",
                        "x": 100,
                        "y": 250,
                        "width": 600,
                        "height": 22,
                        "fontFamily": "Helvetica",
                        "fontSize": 13,
                        "color": "#64748B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-event-c",
                        "type": "text",
                        "text": "{{event_name}}",
                        "x": 60,
                        "y": 285,
                        "width": 680,
                        "height": 35,
                        "fontFamily": "Helvetica",
                        "fontSize": 22,
                        "fontWeight": "bold",
                        "color": "#0F172A",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-date-c",
                        "type": "text",
                        "text": "Date of Certification: {{event_date}}  •  ID: {{certificate_id}}",
                        "x": 100,
                        "y": 335,
                        "width": 600,
                        "height": 22,
                        "fontFamily": "Helvetica",
                        "fontSize": 11,
                        "color": "#475569",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-sig1-c",
                        "type": "text",
                        "text": "Program Director\n{{organization}}",
                        "x": 120,
                        "y": 470,
                        "width": 200,
                        "height": 35,
                        "fontFamily": "Helvetica",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "color": "#1E293B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-sig2-c",
                        "type": "text",
                        "text": "Board of Evaluators\nCertification Committee",
                        "x": 480,
                        "y": 470,
                        "width": 200,
                        "height": 35,
                        "fontFamily": "Helvetica",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "color": "#1E293B",
                        "alignment": "center",
                        "zIndex": 2
                    }
                ]
            }
        },
        {
            "id": "tpl-elegant-black-04",
            "name": "Elegant Black",
            "description": "Luxurious monochrome theme with obsidian borders, platinum accents, and refined serif typography.",
            "category": "Classic",
            "orientation": "landscape",
            "canvas_width": 800,
            "canvas_height": 566,
            "is_system_template": True,
            "configuration": {
                "background": "#FAF9F6",
                "borderStyle": "elegant_black",
                "elements": [
                    {
                        "id": "el-org-eb",
                        "type": "text",
                        "text": "{{organization}}",
                        "x": 80,
                        "y": 60,
                        "width": 640,
                        "height": 24,
                        "fontFamily": "Times-Roman",
                        "fontSize": 14,
                        "fontWeight": "bold",
                        "color": "#020617",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-title-eb",
                        "type": "text",
                        "text": "CERTIFICATE OF MERIT",
                        "x": 80,
                        "y": 105,
                        "width": 640,
                        "height": 36,
                        "fontFamily": "Times-Roman",
                        "fontSize": 26,
                        "fontWeight": "bold",
                        "color": "#020617",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-intro-eb",
                        "type": "text",
                        "text": "Conferred with highest commendations upon",
                        "x": 80,
                        "y": 155,
                        "width": 640,
                        "height": 22,
                        "fontFamily": "Times-Roman",
                        "fontSize": 13,
                        "fontStyle": "italic",
                        "color": "#52525B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-rec-eb",
                        "type": "text",
                        "text": "{{recipient_name}}",
                        "x": 60,
                        "y": 195,
                        "width": 680,
                        "height": 48,
                        "fontFamily": "Times-Roman",
                        "fontSize": 34,
                        "fontWeight": "bold",
                        "color": "#09090B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-stmt-eb",
                        "type": "text",
                        "text": "for exemplary completion of the professional curriculum in",
                        "x": 80,
                        "y": 265,
                        "width": 640,
                        "height": 22,
                        "fontFamily": "Times-Roman",
                        "fontSize": 13,
                        "fontStyle": "italic",
                        "color": "#52525B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-event-eb",
                        "type": "text",
                        "text": "{{event_name}}",
                        "x": 80,
                        "y": 300,
                        "width": 640,
                        "height": 34,
                        "fontFamily": "Times-Roman",
                        "fontSize": 22,
                        "fontWeight": "bold",
                        "color": "#18181B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-date-eb",
                        "type": "text",
                        "text": "Conferred on {{event_date}}  •  Credential ID: {{certificate_id}}",
                        "x": 80,
                        "y": 350,
                        "width": 640,
                        "height": 20,
                        "fontFamily": "Courier",
                        "fontSize": 10,
                        "color": "#71717A",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-sig-eb",
                        "type": "text",
                        "text": "Chief Executive Officer\n{{organization}}",
                        "x": 520,
                        "y": 475,
                        "width": 220,
                        "height": 35,
                        "fontFamily": "Times-Roman",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "color": "#09090B",
                        "alignment": "center",
                        "zIndex": 2
                    }
                ]
            }
        },
        {
            "id": "tpl-academic-05",
            "name": "Academic",
            "description": "Traditional collegiate diploma aesthetic with decree prose, laurel emblems, and vintage warmth.",
            "category": "Academic",
            "orientation": "landscape",
            "canvas_width": 800,
            "canvas_height": 566,
            "is_system_template": True,
            "configuration": {
                "background": "#FDF8EE",
                "borderStyle": "academic",
                "elements": [
                    {
                        "id": "el-org-ac",
                        "type": "text",
                        "text": "{{organization}}",
                        "x": 70,
                        "y": 55,
                        "width": 660,
                        "height": 26,
                        "fontFamily": "Times-Roman",
                        "fontSize": 16,
                        "fontWeight": "bold",
                        "color": "#78350F",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-title-ac",
                        "type": "text",
                        "text": "DIPLOMA OF ACADEMIC ACHIEVEMENT",
                        "x": 60,
                        "y": 95,
                        "width": 680,
                        "height": 36,
                        "fontFamily": "Times-Roman",
                        "fontSize": 24,
                        "fontWeight": "bold",
                        "color": "#451A03",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-be-it",
                        "type": "text",
                        "text": "Be it known that by authority of the academic faculty,",
                        "x": 80,
                        "y": 145,
                        "width": 640,
                        "height": 22,
                        "fontFamily": "Times-Roman",
                        "fontSize": 13,
                        "fontStyle": "italic",
                        "color": "#78350F",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-rec-ac",
                        "type": "text",
                        "text": "{{recipient_name}}",
                        "x": 60,
                        "y": 185,
                        "width": 680,
                        "height": 45,
                        "fontFamily": "Times-Roman",
                        "fontSize": 32,
                        "fontWeight": "bold",
                        "color": "#1C1917",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-has-comp",
                        "type": "text",
                        "text": "has satisfactorily completed all requisite coursework, examinations and standards in",
                        "x": 80,
                        "y": 250,
                        "width": 640,
                        "height": 24,
                        "fontFamily": "Times-Roman",
                        "fontSize": 13,
                        "fontStyle": "italic",
                        "color": "#78350F",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-event-ac",
                        "type": "text",
                        "text": "{{event_name}}",
                        "x": 60,
                        "y": 285,
                        "width": 680,
                        "height": 34,
                        "fontFamily": "Times-Roman",
                        "fontSize": 22,
                        "fontWeight": "bold",
                        "color": "#451A03",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-date-ac",
                        "type": "text",
                        "text": "Conferred on this {{event_date}} under seal.",
                        "x": 80,
                        "y": 330,
                        "width": 640,
                        "height": 22,
                        "fontFamily": "Times-Roman",
                        "fontSize": 12,
                        "fontStyle": "italic",
                        "color": "#78350F",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-meta-ac",
                        "type": "text",
                        "text": "Registry Record: {{certificate_id}}",
                        "x": 60,
                        "y": 490,
                        "width": 300,
                        "height": 20,
                        "fontFamily": "Courier",
                        "fontSize": 9,
                        "color": "#92400E",
                        "alignment": "left",
                        "zIndex": 2
                    },
                    {
                        "id": "el-sig-dean",
                        "type": "text",
                        "text": "Dean of Academic Affairs\n{{organization}}",
                        "x": 510,
                        "y": 480,
                        "width": 230,
                        "height": 35,
                        "fontFamily": "Times-Roman",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "color": "#451A03",
                        "alignment": "center",
                        "zIndex": 2
                    }
                ]
            }
        },
        {
            "id": "tpl-creative-gradient-06",
            "name": "Creative Gradient",
            "description": "Vibrant design with energetic violet-fuchsia accents, modern badge geometry, and dynamic layout.",
            "category": "Creative",
            "orientation": "landscape",
            "canvas_width": 800,
            "canvas_height": 566,
            "is_system_template": True,
            "configuration": {
                "background": "#FAFAFA",
                "borderStyle": "creative_gradient",
                "elements": [
                    {
                        "id": "el-org-cr",
                        "type": "text",
                        "text": "{{organization}}",
                        "x": 80,
                        "y": 55,
                        "width": 640,
                        "height": 24,
                        "fontFamily": "Helvetica",
                        "fontSize": 14,
                        "fontWeight": "bold",
                        "color": "#9333EA",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-title-cr",
                        "type": "text",
                        "text": "CERTIFICATE OF INNOVATION",
                        "x": 60,
                        "y": 95,
                        "width": 680,
                        "height": 38,
                        "fontFamily": "Helvetica",
                        "fontSize": 26,
                        "fontWeight": "bold",
                        "color": "#18181B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-intro-cr",
                        "type": "text",
                        "text": "Presented for creative vision and accomplishment to",
                        "x": 80,
                        "y": 150,
                        "width": 640,
                        "height": 22,
                        "fontFamily": "Helvetica",
                        "fontSize": 13,
                        "color": "#71717A",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-rec-cr",
                        "type": "text",
                        "text": "{{recipient_name}}",
                        "x": 60,
                        "y": 190,
                        "width": 680,
                        "height": 48,
                        "fontFamily": "Helvetica",
                        "fontSize": 34,
                        "fontWeight": "bold",
                        "color": "#7C3AED",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-stmt-cr",
                        "type": "text",
                        "text": "for breakthrough participation and collaborative impact in",
                        "x": 80,
                        "y": 255,
                        "width": 640,
                        "height": 22,
                        "fontFamily": "Helvetica",
                        "fontSize": 13,
                        "color": "#71717A",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-event-cr",
                        "type": "text",
                        "text": "{{event_name}}",
                        "x": 60,
                        "y": 290,
                        "width": 680,
                        "height": 34,
                        "fontFamily": "Helvetica",
                        "fontSize": 22,
                        "fontWeight": "bold",
                        "color": "#09090B",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-date-cr",
                        "type": "text",
                        "text": "Completed on {{event_date}}  |  Verification: {{certificate_id}}",
                        "x": 80,
                        "y": 340,
                        "width": 640,
                        "height": 20,
                        "fontFamily": "Courier",
                        "fontSize": 10,
                        "color": "#A1A1AA",
                        "alignment": "center",
                        "zIndex": 2
                    },
                    {
                        "id": "el-sig-cr",
                        "type": "text",
                        "text": "Creative Director\n{{organization}}",
                        "x": 520,
                        "y": 480,
                        "width": 220,
                        "height": 35,
                        "fontFamily": "Helvetica",
                        "fontSize": 10,
                        "fontWeight": "bold",
                        "color": "#18181B",
                        "alignment": "center",
                        "zIndex": 2
                    }
                ]
            }
        }
    ]


def seed_templates_if_empty(db: Session):
    """Populates the database with the 6 default system templates if not present."""
    sample_templates = get_default_sample_templates()
    for tpl_data in sample_templates:
        existing = db.query(Template).filter(Template.id == tpl_data["id"]).first()
        if not existing:
            tpl = Template(
                id=tpl_data["id"],
                name=tpl_data["name"],
                description=tpl_data["description"],
                category=tpl_data["category"],
                orientation=tpl_data["orientation"],
                canvas_width=tpl_data["canvas_width"],
                canvas_height=tpl_data["canvas_height"],
                configuration=json.dumps(tpl_data["configuration"]),
                is_system_template=tpl_data["is_system_template"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(tpl)
    db.commit()


def get_templates(db: Session, category: Optional[str] = None) -> List[Template]:
    query = db.query(Template)
    if category and category != "All":
        query = query.filter(Template.category == category)
    return query.order_by(Template.is_system_template.desc(), Template.created_at.desc()).all()


def get_template(db: Session, template_id: str) -> Optional[Template]:
    return db.query(Template).filter(Template.id == template_id).first()


def create_template(db: Session, tpl_in: TemplateCreate) -> Template:
    new_id = f"tpl-{uuid.uuid4()}"
    tpl = Template(
        id=new_id,
        name=tpl_in.name.strip(),
        description=tpl_in.description.strip() if tpl_in.description else None,
        category=tpl_in.category.strip() or "Corporate",
        orientation=tpl_in.orientation or "landscape",
        canvas_width=tpl_in.canvas_width or 800,
        canvas_height=tpl_in.canvas_height or 566,
        configuration=json.dumps(tpl_in.configuration),
        is_system_template=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


def update_template(db: Session, template_id: str, tpl_in: TemplateUpdate) -> Optional[Template]:
    tpl = get_template(db, template_id)
    if not tpl:
        return None

    if tpl_in.name is not None:
        tpl.name = tpl_in.name.strip()
    if tpl_in.description is not None:
        tpl.description = tpl_in.description.strip()
    if tpl_in.category is not None:
        tpl.category = tpl_in.category.strip()
    if tpl_in.orientation is not None:
        tpl.orientation = tpl_in.orientation
    if tpl_in.configuration is not None:
        tpl.configuration = json.dumps(tpl_in.configuration)

    tpl.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tpl)
    return tpl


def duplicate_template(db: Session, template_id: str) -> Optional[Template]:
    orig = get_template(db, template_id)
    if not orig:
        return None

    new_id = f"tpl-{uuid.uuid4()}"
    new_name = f"{orig.name} Copy"
    dup = Template(
        id=new_id,
        name=new_name,
        description=f"Duplicate of {orig.name}",
        category=orig.category,
        orientation=orig.orientation,
        canvas_width=orig.canvas_width,
        canvas_height=orig.canvas_height,
        configuration=orig.configuration,
        is_system_template=False,  # Duplicates are always user-editable and deletable
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(dup)
    db.commit()
    db.refresh(dup)
    return dup


def delete_template(db: Session, template_id: str) -> bool:
    tpl = get_template(db, template_id)
    if not tpl:
        return False
    if tpl.is_system_template:
        return False  # System templates cannot be deleted directly
    db.delete(tpl)
    db.commit()
    return True
