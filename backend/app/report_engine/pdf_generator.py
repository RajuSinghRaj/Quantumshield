import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(scan_record_data: dict, findings: list, migration_plan: list) -> bytes:
    """Generate professional PDF security report bytes using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#a855f7')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#94a3b8')
    )

    heading2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#38bdf8'),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e293b')
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a')
    )

    elements = []

    # 1. Header & Title Block
    elements.append(Paragraph("QUANTUMSHIELD", title_style))
    elements.append(Paragraph("Cryptographic Vulnerability & Quantum Readiness Report", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#a855f7'), spaceAfter=15))

    # Meta table
    project_name = scan_record_data.get("project_name", "QuantumShield Audit")
    scan_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    overall_risk = scan_record_data.get("overall_risk", "UNKNOWN")
    q_score = scan_record_data.get("quantum_score", 0)
    c_score = scan_record_data.get("classical_score", 0)
    pqc_score = scan_record_data.get("pqc_score", 0)

    meta_data = [
        [Paragraph("<b>Project Name:</b>", body_style), Paragraph(project_name, body_style),
         Paragraph("<b>Scan Date:</b>", body_style), Paragraph(scan_date, body_style)],
        [Paragraph("<b>Overall Risk:</b>", body_style), Paragraph(f"<b>{overall_risk}</b>", body_style),
         Paragraph("<b>Quantum Readiness:</b>", body_style), Paragraph(f"<b>{q_score}/100</b>", body_style)],
        [Paragraph("<b>Classical Score:</b>", body_style), Paragraph(f"{c_score}/100", body_style),
         Paragraph("<b>PQC Adoption:</b>", body_style), Paragraph(f"{pqc_score}%", body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[110, 150, 110, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))

    # 2. Executive Summary
    elements.append(Paragraph("Executive Summary", heading2_style))
    exec_summary_text = (
        f"This security audit evaluated cryptographic primitives across source code, certificates, "
        f"and configuration assets for <b>{project_name}</b>. "
        f"The application earned a <b>Quantum Readiness Score of {q_score}/100</b> with an overall risk classification of <b>{overall_risk}</b>. "
        f"A total of {len(findings)} cryptographic assets were analyzed for classical weakness and quantum threats (Shor's and Grover's algorithms)."
    )
    elements.append(Paragraph(exec_summary_text, body_style))
    elements.append(Spacer(1, 15))

    # 3. Cryptographic Asset Inventory Table
    elements.append(Paragraph("Cryptographic Asset Inventory", heading2_style))
    inventory_headers = ["Algorithm", "Usage", "Location", "Classical Risk", "Quantum Risk"]
    inv_rows = [[Paragraph(f"<b>{h}</b>", body_style) for h in inventory_headers]]

    for f in findings[:25]: # Cap at 25 in PDF
        loc = f"{f.get('file_path', '')}:{f.get('line_number', 1)}"
        if len(loc) > 30:
            loc = loc[:27] + "..."
        inv_rows.append([
            Paragraph(f.get("variant", "N/A"), body_style),
            Paragraph(f.get("usage", "N/A").replace("_", " ").title(), body_style),
            Paragraph(loc, code_style),
            Paragraph(f.get("classical_risk", "N/A"), body_style),
            Paragraph(f.get("quantum_risk", "N/A"), body_style),
        ])

    inv_table = Table(inv_rows, colWidths=[100, 90, 160, 85, 85])
    inv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(inv_table)
    elements.append(Spacer(1, 15))

    # 4. Detailed Findings & "WHY" Explanations
    elements.append(Paragraph("Detailed Security Findings & Quantum Threats", heading2_style))
    for idx, f in enumerate(findings[:10]):
        sev = f.get("severity", "LOW")
        title = f"{idx+1}. {f.get('variant')} — {f.get('usage', '').replace('_', ' ').title()} [{sev}]"
        
        elements.append(Paragraph(f"<b>{title}</b>", ParagraphStyle('FHead', parent=body_style, fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#0f172a'))))
        elements.append(Paragraph(f"<b>Location:</b> {f.get('file_path')}:{f.get('line_number', 1)}", code_style))
        elements.append(Paragraph(f"<b>Quantum Threat:</b> {f.get('quantum_threat')}", body_style))
        elements.append(Paragraph(f"<b>Why it is a problem:</b> {f.get('why_problem')}", body_style))
        elements.append(Paragraph(f"<b>Recommendation:</b> {f.get('recommendation')}", body_style))
        elements.append(Spacer(1, 8))

    # 5. PQC Migration Plan Table
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("Post-Quantum Cryptography (PQC) Migration Roadmap", heading2_style))
    plan_headers = ["Current Asset", "Usage", "Priority", "Recommended PQC Alternative"]
    plan_rows = [[Paragraph(f"<b>{h}</b>", body_style) for h in plan_headers]]

    for item in migration_plan:
        plan_rows.append([
            Paragraph(item.get("current_algorithm", ""), body_style),
            Paragraph(item.get("usage", ""), body_style),
            Paragraph(f"<b>{item.get('priority', '')}</b>", body_style),
            Paragraph(item.get("recommended_replacement", ""), body_style),
        ])

    plan_table = Table(plan_rows, colWidths=[120, 110, 80, 210])
    plan_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(plan_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
