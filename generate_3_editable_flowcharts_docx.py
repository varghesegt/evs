import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex="FFFFFF"):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=40, bottom=40, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}>'
                      f'<w:top w:w="{top}" w:type="dxa"/>'
                      f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
                      f'<w:left w:w="{left}" w:type="dxa"/>'
                      f'<w:right w:w="{right}" w:type="dxa"/>'
                      f'</w:tcMar>')
    tcPr.append(tcMar)

def set_cell_borders(cell, border_style="single", sz=10, color="000000"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}>'
                          f'<w:top w:val="{border_style}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
                          f'<w:left w:val="{border_style}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
                          f'<w:bottom w:val="{border_style}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
                          f'<w:right w:val="{border_style}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
                          f'</w:tcBorders>')
    tcPr.append(tcBorders)

def add_clean_paragraph(cell, text, font_size=9.0, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=1, color_rgb=(0,0,0)):
    p = cell.add_paragraph() if len(cell.paragraphs[0].text) > 0 else cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(text)
    run.font.name = "Cambria"
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = RGBColor(*color_rgb)
    return p

def create_arrow_row(table, row_idx, arrow_text="▼"):
    cell = table.cell(row_idx, 0)
    cell.merge(table.cell(row_idx, 1))
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}>'
                          f'<w:top w:val="none"/>'
                          f'<w:left w:val="none"/>'
                          f'<w:bottom w:val="none"/>'
                          f'<w:right w:val="none"/>'
                          f'</w:tcBorders>')
    tcPr.append(tcBorders)
    set_cell_background(cell, "FFFFFF")
    set_cell_margins(cell, top=0, bottom=0, left=0, right=0)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    r = p.add_run(arrow_text)
    r.font.name = "Cambria"
    r.font.size = Pt(8.5)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)

# Build the 3-page document
def generate_calibrated_editable_docx(docx_path):
    doc = Document()
    
    for section in doc.sections:
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        section.top_margin = Inches(0.40)
        section.bottom_margin = Inches(0.40)
        section.left_margin = Inches(0.60)
        section.right_margin = Inches(0.60)
        
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("ECOSHARE AI: MASTER ARCHITECTURE SPECIFICATION DRAWINGS • 100% EDITABLE WORD FORMAT")
        hrun.font.name = "Cambria"
        hrun.font.size = Pt(8.5)
        hrun.font.bold = True
        hrun.font.color.rgb = RGBColor(70, 70, 70)

    # -------------------------------------------------------------
    # SHEET 1 OF 3: FIG. 1
    # -------------------------------------------------------------
    p_s1 = doc.add_paragraph()
    p_s1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_s1.paragraph_format.space_before = Pt(0)
    p_s1.paragraph_format.space_after = Pt(1)
    r_s1 = p_s1.add_run("SHEET 1 OF 3")
    r_s1.font.name = "Cambria"
    r_s1.font.size = Pt(9.0)
    r_s1.font.bold = True

    p_t1 = doc.add_paragraph()
    p_t1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t1.paragraph_format.space_before = Pt(0)
    p_t1.paragraph_format.space_after = Pt(1)
    r_t1 = p_t1.add_run("FIG. 1: VOLUMETRIC MASS ESTIMATION, PERISHABILITY KINETICS & SAFETY SHUTOFF")
    r_t1.font.name = "Cambria"
    r_t1.font.size = Pt(11.0)
    r_t1.font.bold = True

    p_f1 = doc.add_paragraph()
    p_f1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_f1.paragraph_format.space_before = Pt(0)
    p_f1.paragraph_format.space_after = Pt(5)
    r_f1 = p_f1.add_run("Technical Field: Computer vision container volumetrics, 12-category bulk density tensors, room-temperature shelf-life kinetics, and automated biohazard safety shutoff circuits.")
    r_f1.font.name = "Cambria"
    r_f1.font.size = Pt(8.0)
    r_f1.font.italic = True

    # FIG 1 Table (16 rows)
    t1 = doc.add_table(rows=16, cols=2)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t1.columns[0].width = Inches(3.65)
    t1.columns[1].width = Inches(3.65)

    # Row 0: Start
    c = t1.cell(0, 0)
    c.merge(t1.cell(0, 1))
    set_cell_borders(c, "double", 12)
    set_cell_background(c, "F2F2F2")
    set_cell_margins(c, top=30, bottom=30, left=80, right=80)
    add_clean_paragraph(c, "[START] Food Donor Initiates Redistribution Telemetry", 9.0, True, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_clean_paragraph(c, "Web/Mobile Client Session Initialized; Donor Coordinates Ingested via GPS Geocoding", 7.5, True, align=WD_ALIGN_PARAGRAPH.CENTER)

    create_arrow_row(t1, 1, "▼")

    # Row 2: Step 1 & Decision D1
    c = t1.cell(2, 0)
    c.merge(t1.cell(2, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "1. Ingest Batch Telemetry & Dual-Perspective Photography", 9.0, True)
    add_clean_paragraph(c, "• Ingests 12 Food Categories, Prepared Timestamp, Geolocation (Lat/Lng), Packaging Type, and Orthogonal Top/Side Photos", 8.0)
    add_clean_paragraph(c, "◆ DECISION D1: Is Donor Profile Authenticated?  ├── YES: Proceed to Volumetric Vision | └── NO: Issue 24h HMAC-SHA512 JWT Bearer Token", 8.0, True, color_rgb=(40,40,40))

    create_arrow_row(t1, 3, "▼  [Authenticated Context Established]")

    # Row 4: Step 2 Header
    c = t1.cell(4, 0)
    c.merge(t1.cell(4, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "2. Volumetric Computer Vision & Orthogonal Surface Geometry Extraction", 9.0, True)
    add_clean_paragraph(c, "• Top-surface perimeter analysis extracts container cross-sectional area (A_surf); side-profile computes fluid fill level (F_eff %)", 8.0)

    create_arrow_row(t1, 5, "▼")

    # Row 6: Decision D2 Split Paths (Side-by-Side!)
    c_left = t1.cell(6, 0)
    set_cell_borders(c_left, "single", 10)
    set_cell_background(c_left, "FAFAFA")
    set_cell_margins(c_left, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_left, "◆ D2: [YES] Standard Calibrated Receptacle", 8.5, True)
    add_clean_paragraph(c_left, "• Reference Standard Matrix (5L, 10L, 20L, 50L)\n• Effective Volume: V_eff = V_box × (Fill% / 100)\n• Repeatability: +5% Boost (89%), Margin: ±8%", 8.0)

    c_right = t1.cell(6, 1)
    set_cell_borders(c_right, "single", 10)
    set_cell_background(c_right, "FAFAFA")
    set_cell_margins(c_right, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_right, "◆ D2: [NO] Custom / Irregular Receptacle", 8.5, True)
    add_clean_paragraph(c_right, "• Monocular Depth & Fill-Level Bounding Volume\n• Effective Volume: V_eff = V_custom × (Fill% / 100)\n• Baseline Model Confidence: 82%, Margin: ±12%", 8.0)

    create_arrow_row(t1, 7, "▼  [Both Branches Converge to Bulk Density Physics Transformation]")

    # Row 8: Step 3 Density Physics
    c = t1.cell(8, 0)
    c.merge(t1.cell(8, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "3. 12-Category Food Bulk Density Physics Transformation", 9.0, True)
    add_clean_paragraph(c, "• Physical Mass: M = V_eff × ρ (kg) | Density Tensor ρ: Rice (0.80), Curry (0.95), Dairy (1.03), Bakery (0.35), Produce (0.60)\n• Portion Count Calculation: Servings S = M / (Grams_per_serving / 1000) (100g - 250g per nutritional portion)", 8.0)

    create_arrow_row(t1, 9, "▼")

    # Row 10: Step 4 Freshness Kinetics
    c = t1.cell(10, 0)
    c.merge(t1.cell(10, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "4. Dynamic Perishability Kinetics & Safe Shelf-Life Query", 9.0, True)
    add_clean_paragraph(c, "• Query Category Room-Temperature Shelf-Life T_shelf (Dairy 4h, Cooked 5-6h, Bakery 24h, Packaged 168h)\n• Elapsed Transit Duration: Δt = now() - t_prepared  |  Remaining Safe Window: t_rem = max(0, T_shelf - Δt)", 8.0)

    create_arrow_row(t1, 11, "▼")

    # Row 12: Decision D3 Safety Check Split (Safe vs Biohazard)
    c_safe = t1.cell(12, 0)
    set_cell_borders(c_safe, "single", 10)
    set_cell_background(c_safe, "FFFFFF")
    set_cell_margins(c_safe, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_safe, "◆ D3: [YES] Food Safe (t_rem > 0)", 8.5, True)
    add_clean_paragraph(c_safe, "• Organoleptically Sound & Safe for Human Consumption\n• Batch approved for redistribution pipeline\n• Calculate Urgency: P = 0.30·Qty + 0.50·Fresh + 0.20·Time", 8.0)

    c_hazard = t1.cell(12, 1)
    set_cell_borders(c_hazard, "double", 12)
    set_cell_background(c_hazard, "F4F4F4")
    set_cell_margins(c_hazard, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_hazard, "◆ D3: [NO] Bio-Hazard Safety Shutoff", 8.5, True)
    add_clean_paragraph(c_hazard, "• Status locked to BIO_DIVERTED; human embargo\n• Divert to anaerobic composting / bio-digestion depot\n• Credit Methane Avoidance (IPCC AR6 GWP 28×)", 8.0)

    create_arrow_row(t1, 13, "▼  [Safe Consignments Evaluated for Priority Classification]")

    # Row 14: Decision D4 Priority Dispatch Split
    c_emg = t1.cell(14, 0)
    set_cell_borders(c_emg, "single", 10)
    set_cell_background(c_emg, "FAFAFA")
    set_cell_margins(c_emg, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_emg, "◆ D4: [YES] Emergency Dispatch (P >= 75 | t_rem <= 2h)", 8.5, True)
    add_clean_paragraph(c_emg, "• High-priority WebPush/SMS broadcast to nearby shelters\n• Elevated response SLA: 10-minute acceptance requirement\n• Pre-emptively reserve nearest capable volunteer vehicle", 8.0)

    c_std = t1.cell(14, 1)
    set_cell_borders(c_std, "single", 10)
    set_cell_background(c_std, "FAFAFA")
    set_cell_margins(c_std, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_std, "◆ D4: [NO] Standard Redistribution Queue", 8.5, True)
    add_clean_paragraph(c_std, "• Enqueued into regional redistribution cluster pool\n• Standard 15-minute response SLA window\n• Scheduled batch clustering for multi-stop route solver", 8.0)

    # Row 15: Sheet 1 Handoff Terminal
    c = t1.cell(15, 0)
    c.merge(t1.cell(15, 1))
    set_cell_borders(c, "double", 12)
    set_cell_background(c, "F2F2F2")
    set_cell_margins(c, top=25, bottom=25, left=80, right=80)
    add_clean_paragraph(c, "[HANDOFF TERMINAL] Validated Consignment Dispatched to Shelter Allocation Engine (FIG. 2)", 8.5, True, align=WD_ALIGN_PARAGRAPH.CENTER)

    # Page Break to Sheet 2
    doc.add_page_break()

    # -------------------------------------------------------------
    # SHEET 2 OF 3: FIG. 2
    # -------------------------------------------------------------
    p_s2 = doc.add_paragraph()
    p_s2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_s2.paragraph_format.space_before = Pt(0)
    p_s2.paragraph_format.space_after = Pt(1)
    r_s2 = p_s2.add_run("SHEET 2 OF 3")
    r_s2.font.name = "Cambria"
    r_s2.font.size = Pt(9.0)
    r_s2.font.bold = True

    p_t2 = doc.add_paragraph()
    p_t2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t2.paragraph_format.space_before = Pt(0)
    p_t2.paragraph_format.space_after = Pt(1)
    r_t2 = p_t2.add_run("FIG. 2: PROACTIVE SHELTER DEFICIT FORECASTING & MULTI-CRITERIA NGO ALLOCATION")
    r_t2.font.name = "Cambria"
    r_t2.font.size = Pt(11.0)
    r_t2.font.bold = True

    p_f2 = doc.add_paragraph()
    p_f2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_f2.paragraph_format.space_before = Pt(0)
    p_f2.paragraph_format.space_after = Pt(5)
    r_f2 = p_f2.add_run("Technical Field: Time-series statistical demand forecasting, all-pairs Haversine geospatial proximity matrices, multi-objective shelter ranking, and automated SLA cascade escalations.")
    r_f2.font.name = "Cambria"
    r_f2.font.size = Pt(8.0)
    r_f2.font.italic = True

    # FIG 2 Table (14 rows)
    t2 = doc.add_table(rows=14, cols=2)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t2.columns[0].width = Inches(3.65)
    t2.columns[1].width = Inches(3.65)

    # Row 0: Start
    c = t2.cell(0, 0)
    c.merge(t2.cell(0, 1))
    set_cell_borders(c, "double", 12)
    set_cell_background(c, "F2F2F2")
    set_cell_margins(c, top=30, bottom=30, left=80, right=80)
    add_clean_paragraph(c, "[START] Ingestion of Validated Food Surplus Consignment from FIG. 1", 9.0, True, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_clean_paragraph(c, "Consignment Parameters: Mass M (kg), Food Category, Urgency Priority P, Donor Coordinates", 7.5, True, align=WD_ALIGN_PARAGRAPH.CENTER)

    create_arrow_row(t2, 1, "▼")

    # Row 2: Step 6 Demand Horizon
    c = t2.cell(2, 0)
    c.merge(t2.cell(2, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "6. 24-Hour Regional Forecast Cycle & Recipient Telemetry Ingestion", 9.0, True)
    add_clean_paragraph(c, "• Ingests Recipient Shelter Inventory, Bed Capacity, and Dietary Preferences across Target Urban Region\n• Ingests Day-of-Week Trend Multipliers (Weekday 1.00× vs. Weekend 1.15×) and Local Festival Multipliers", 8.0)

    create_arrow_row(t2, 3, "▼")

    # Row 4: Step 7 Deficit Calculation
    c = t2.cell(4, 0)
    c.merge(t2.cell(4, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "7. Time-Series Meal Deficit Calculation & Feeding Corridor Demarcation", 9.0, True)
    add_clean_paragraph(c, "• Projected Deficit Formula: Deficit = Bed_Capacity × 2.20 × Day_of_Week_Trend × Festival_Multiplier\n• Geospatial clustering demarcates high-deficit feeding corridors hours before commercial surplus generation occurs", 8.0)

    create_arrow_row(t2, 5, "▼")

    # Row 6: Step 8 Haversine Distance
    c = t2.cell(6, 0)
    c.merge(t2.cell(6, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "8. All-Pairs Haversine Geospatial Distance Matrix Computation", 9.0, True)
    add_clean_paragraph(c, "• Compute great-circle arc distance between Donor Node and all candidate Recipient Shelter Nodes:\n• D = 2R · arcsin( sqrt( sin^2(Δlat / 2) + cos(lat_donor) · cos(lat_ngo) · sin^2(Δlng / 2) ) )", 8.0)

    create_arrow_row(t2, 7, "▼")

    # Row 8: Step 9 Multi-criteria Ranking
    c = t2.cell(8, 0)
    c.merge(t2.cell(8, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "9. Multi-Criteria NGO Allocation & Compatibility Ranking", 9.0, True)
    add_clean_paragraph(c, "• Objective Scoring Function: S_ngo = (0.40 / D) + (0.35 × Capacity_Fit) + (0.25 × Historical_Acceptance_Speed)\n• Rank candidate shelters in descending compatibility order; transmit automated invitation to Rank-1 NGO", 8.0)

    create_arrow_row(t2, 9, "▼")

    # Row 10: Decision D5 NGO Acceptance Split
    c_acc = t2.cell(10, 0)
    set_cell_borders(c_acc, "single", 10)
    set_cell_background(c_acc, "FFFFFF")
    set_cell_margins(c_acc, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_acc, "◆ D5: [YES] Primary NGO Accepts in SLA (15 min)", 8.5, True)
    add_clean_paragraph(c_acc, "• Lock reservation allocation; Status = ACCEPTED\n• Assign target destination: Designated_NGO_Id\n• Lock inventory allocation to prevent duplicate claiming", 8.0)

    c_cas = t2.cell(10, 1)
    set_cell_borders(c_cas, "single", 10)
    set_cell_background(c_cas, "FAFAFA")
    set_cell_margins(c_cas, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_cas, "◆ D5: [NO] SLA Expired / Declined", 8.5, True)
    add_clean_paragraph(c_cas, "• Dynamic Auto-Escalation Cascade Circuit\n• Release lock; pop primary NGO from candidate queue\n• Re-dispatch consignment to Rank-2 shelter (Loop Step 9)", 8.0)

    create_arrow_row(t2, 11, "▼  [Consignment Accepted: Query & Bind Volunteer Fleet]")

    # Row 12: Step 10 & 11 Volunteer Assignment
    c = t2.cell(12, 0)
    c.merge(t2.cell(12, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "10. Query Active Volunteer Fleet & Bind Transport Assignment", 9.0, True)
    add_clean_paragraph(c, "• Filter on-duty volunteers by spatial transit corridor; verify gross payload capacity (C_max >= Consignment Mass M)\n• Update State: Pickup Status = ASSIGNED, Transport Driver = Volunteer_Id; transmit automated dispatch notification", 8.0)

    # Row 13: Sheet 2 Handoff Terminal
    c = t2.cell(13, 0)
    c.merge(t2.cell(13, 1))
    set_cell_borders(c, "double", 12)
    set_cell_background(c, "F2F2F2")
    set_cell_margins(c, top=25, bottom=25, left=80, right=80)
    add_clean_paragraph(c, "[HANDOFF TERMINAL] Consignment Dispatched to CVRP Vehicle Logistics Engine (FIG. 3)", 8.5, True, align=WD_ALIGN_PARAGRAPH.CENTER)

    # Page Break to Sheet 3
    doc.add_page_break()

    # -------------------------------------------------------------
    # SHEET 3 OF 3: FIG. 3
    # -------------------------------------------------------------
    p_s3 = doc.add_paragraph()
    p_s3.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_s3.paragraph_format.space_before = Pt(0)
    p_s3.paragraph_format.space_after = Pt(1)
    r_s3 = p_s3.add_run("SHEET 3 OF 3")
    r_s3.font.name = "Cambria"
    r_s3.font.size = Pt(9.0)
    r_s3.font.bold = True

    p_t3 = doc.add_paragraph()
    p_t3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t3.paragraph_format.space_before = Pt(0)
    p_t3.paragraph_format.space_after = Pt(1)
    r_t3 = p_t3.add_run("FIG. 3: PERISHABILITY-CONSTRAINED CVRP ROUTING, ZERO-TRUST CUSTODY & SHA-256 AUDIT LEDGER")
    r_t3.font.name = "Cambria"
    r_t3.font.size = Pt(11.0)
    r_t3.font.bold = True

    p_f3 = doc.add_paragraph()
    p_f3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_f3.paragraph_format.space_before = Pt(0)
    p_f3.paragraph_format.space_after = Pt(5)
    r_f3 = p_f3.add_run("Technical Field: Operations research Capacitated Vehicle Routing Problem (CVRP), non-deterministic cryptographic optical tokens, digital scale validation, and immutable SHA-256 ledgers.")
    r_f3.font.name = "Cambria"
    r_f3.font.size = Pt(8.0)
    r_f3.font.italic = True

    # FIG 3 Table (16 rows)
    t3 = doc.add_table(rows=16, cols=2)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    t3.columns[0].width = Inches(3.65)
    t3.columns[1].width = Inches(3.65)

    # Row 0: Start
    c = t3.cell(0, 0)
    c.merge(t3.cell(0, 1))
    set_cell_borders(c, "double", 12)
    set_cell_background(c, "F2F2F2")
    set_cell_margins(c, top=30, bottom=30, left=80, right=80)
    add_clean_paragraph(c, "[START] Multi-Stop Dispatch Request & Volunteer Location Ingestion", 9.0, True, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_clean_paragraph(c, "Ingestion of Volunteer Location, Active Donor Pickup Nodes, and Destination Shelter Depots", 7.5, True, align=WD_ALIGN_PARAGRAPH.CENTER)

    create_arrow_row(t3, 1, "▼")

    # Row 2: Step 11 CVRP Routing
    c = t3.cell(2, 0)
    c.merge(t3.cell(2, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "11. Perishability-Constrained Capacitated Vehicle Routing (CVRP) Optimization", 9.0, True)
    add_clean_paragraph(c, "• Assemble candidate pickup and delivery nodes; solve route trajectory using Nearest-Neighbor heuristic solver\n• Enforce strict chronological topological precedence (every pickup must precede its respective delivery dropoff)", 8.0)

    create_arrow_row(t3, 3, "▼")

    # Row 4: Decision D6 Payload Feasibility Split
    c_spl = t3.cell(4, 0)
    set_cell_borders(c_spl, "single", 10)
    set_cell_background(c_spl, "FAFAFA")
    set_cell_margins(c_spl, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_spl, "◆ D6: [YES] Payload Exceeds C_max", 8.5, True)
    add_clean_paragraph(c_spl, "• Capacity Overflow Split Resolution\n• Schedule mandatory intermediate shelter dropoff\n• Bifurcate tour: Leg 1 (Dropoff) -> Leg 2 (Pickup)", 8.0)

    c_con = t3.cell(4, 1)
    set_cell_borders(c_con, "single", 10)
    set_cell_background(c_con, "FAFAFA")
    set_cell_margins(c_con, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_con, "◆ D6: [NO] Payload Within Limit", 8.5, True)
    add_clean_paragraph(c_con, "• Consolidated Continuous Logistics Route\n• Combine multi-stop pickups into single tour\n• 28.5% distance reduction, saves fuel (0.12 L/km)", 8.0)

    create_arrow_row(t3, 5, "▼  [Both Branches Converge into Navigation Manifest & Security Token Generation]")

    # Row 6: Step 12 Manifest & QR Token
    c = t3.cell(6, 0)
    c.merge(t3.cell(6, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "12. Dispatch Manifest & Generate Non-Deterministic QR Handshake Token", 9.0, True)
    add_clean_paragraph(c, "• Transmit optimized turn-by-turn waypoint route manifest to volunteer mobile navigation client\n• Generate cryptographically secure single-use token: τ = randomUUID().substring(0,8); render 2D QR code on donor app", 8.0)

    create_arrow_row(t3, 7, "▼")

    # Row 8: Step 13 Origin Handover
    c = t3.cell(8, 0)
    c.merge(t3.cell(8, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "13. Volunteer Origin Physical Custody Transfer & Optical Token Handshake", 9.0, True)
    add_clean_paragraph(c, "• Volunteer performs visual inspection & scans donor's optical QR token -> State: PICKED_UP; GPS transit tracking active", 8.0)

    create_arrow_row(t3, 9, "▼")

    # Row 10: Step 14 Destination Arrival & Scale Check-in
    c = t3.cell(10, 0)
    c.merge(t3.cell(10, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "14. Destination Shelter Arrival & Digital Scale Mass Check-in", 9.0, True)
    add_clean_paragraph(c, "• Measure actual physical mass on shelter digital scale: M_actual (kg); scan optical QR token on container: τ_scan", 8.0)

    create_arrow_row(t3, 11, "▼")

    # Row 12: Decision D7 Zero-Trust Token Verification Split
    c_ver = t3.cell(12, 0)
    set_cell_borders(c_ver, "single", 10)
    set_cell_background(c_ver, "FFFFFF")
    set_cell_margins(c_ver, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_ver, "◆ D7: [YES] Token Matches (τ_scan == τ_stored)", 8.5, True)
    add_clean_paragraph(c_ver, "• Zero-Trust Handshake Authentication Verified\n• State Transition: Status = DELIVERED, Pickup COMPLETED\n• Closed-loop error: ε = (|M_actual - M_est| / M_actual) × 100", 8.0)

    c_frd = t3.cell(12, 1)
    set_cell_borders(c_frd, "double", 12)
    set_cell_background(c_frd, "F4F4F4")
    set_cell_margins(c_frd, top=35, bottom=35, left=70, right=70)
    add_clean_paragraph(c_frd, "◆ D7: [NO] Zero-Trust Fraud Lockout Gate", 8.5, True)
    add_clean_paragraph(c_frd, "• Reject handover; freeze delivery transition; lock session\n• Transmit automated fraud alert & GPS trail to admin\n• TERMINAL: Custody Breach Incident Logged", 8.0)

    create_arrow_row(t3, 13, "▼  [Validated Delivery: Recalibrate AI & Commit Cryptographic Ledger]")

    # Row 14: Step 15 Environmental Nexus & SHA-256 Ledger
    c = t3.cell(14, 0)
    c.merge(t3.cell(14, 1))
    set_cell_borders(c, "single", 10)
    set_cell_background(c, "FFFFFF")
    set_cell_margins(c, top=35, bottom=35, left=80, right=80)
    add_clean_paragraph(c, "15. Closed-Loop AI Recalibration & Immutable SHA-256 Ledger Commitment", 9.0, True)
    add_clean_paragraph(c, "• Recalibrate Volumetric Model with Scale Ground-Truth (Historical MAPE = 3.8%)\n• IPCC Nexus: CO2e (1.9 kg/kg), Water (1400 L/kg), Meals (M / 0.5 kg) | Canonical Digest: SHA-256('EVS-LEDGER-V1|...')", 8.0)

    # Row 15: Sheet 3 Final Terminal
    c = t3.cell(15, 0)
    c.merge(t3.cell(15, 1))
    set_cell_borders(c, "double", 12)
    set_cell_background(c, "F2F2F2")
    set_cell_margins(c, top=25, bottom=25, left=80, right=80)
    add_clean_paragraph(c, "[TERMINAL] Food Redistribution Completed, Cryptographically Audited & Public ESG Certificate Issued", 8.5, True, align=WD_ALIGN_PARAGRAPH.CENTER)

    doc.save(docx_path)
    print(f"Calibrated 3-Flowchart Editable Document saved at: {docx_path}")

if __name__ == "__main__":
    out_path = "c:/Users/Asus/Downloads/evs/EcoShare_AI_Master_Architecture_Editable_Flowcharts.docx"
    generate_calibrated_editable_docx(out_path)
