import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}>'
                      f'<w:top w:w="{top}" w:type="dxa"/>'
                      f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
                      f'<w:left w:w="{left}" w:type="dxa"/>'
                      f'<w:right w:w="{right}" w:type="dxa"/>'
                      f'</w:tcMar>')
    tcPr.append(tcMar)

def set_cell_borders(cell, top_c="CCCCCC", bottom_c="CCCCCC", left_c="CCCCCC", right_c="CCCCCC", sz=4):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}>'
                          f'<w:top w:val="{"single" if top_c else "none"}" w:sz="{sz}" w:space="0" w:color="{top_c or "auto"}"/>'
                          f'<w:left w:val="{"single" if left_c else "none"}" w:sz="{sz}" w:space="0" w:color="{left_c or "auto"}"/>'
                          f'<w:bottom w:val="{"single" if bottom_c else "none"}" w:sz="{sz}" w:space="0" w:color="{bottom_c or "auto"}"/>'
                          f'<w:right w:val="{"single" if right_c else "none"}" w:sz="{sz}" w:space="0" w:color="{right_c or "auto"}"/>'
                          f'</w:tcBorders>')
    tcPr.append(tcBorders)

def add_styled_paragraph(container, text, font_name="Cambria", font_size=10, bold=False, italic=False, color_rgb=(15, 23, 42), align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=2, line_spacing=1.1):
    p = container.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    run = p.add_run(text)
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = RGBColor(*color_rgb)
    return p

def create_flow_box(table, row_idx, col_idx, num, title, description="", fill_color="F8FAFC", border_color="0D9668", text_color=(15,23,42)):
    cell = table.cell(row_idx, col_idx)
    set_cell_background(cell, fill_color)
    set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
    set_cell_borders(cell, top_c=border_color, bottom_c=border_color, left_c=border_color, right_c=border_color, sz=6)
    
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.line_spacing = 1.05
    
    # Numeral run
    run_num = p.add_run(f"[{num}] ")
    run_num.font.name = "Cambria"
    run_num.font.size = Pt(9.5)
    run_num.font.bold = True
    run_num.font.color.rgb = RGBColor(13, 150, 104) if border_color=="0D9668" else RGBColor(2, 132, 199)
    
    # Title run
    run_t = p.add_run(title)
    run_t.font.name = "Cambria"
    run_t.font.size = Pt(9.5)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(*text_color)
    
    if description:
        p2 = cell.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p2.paragraph_format.space_before = Pt(1)
        p2.paragraph_format.space_after = Pt(0)
        p2.paragraph_format.line_spacing = 1.05
        run_d = p2.add_run(description)
        run_d.font.name = "Cambria"
        run_d.font.size = Pt(8.5)
        run_d.font.italic = False
        run_d.font.color.rgb = RGBColor(71, 85, 105)

def add_arrow_row(table, row_idx, arrow_text="▼"):
    cell = table.cell(row_idx, 0)
    set_cell_borders(cell, top_c=None, bottom_c=None, left_c=None, right_c=None)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(arrow_text)
    run.font.name = "Cambria"
    run.font.size = Pt(9)
    run.font.bold = True
    run.font.color.rgb = RGBColor(148, 163, 184)

def build_patent_document():
    doc = Document()
    
    # Page Setup (Standard Patent Specifications: 0.7 inch margins)
    for section in doc.sections:
        section.top_margin = Inches(0.65)
        section.bottom_margin = Inches(0.65)
        section.left_margin = Inches(0.7)
        section.right_margin = Inches(0.7)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        
        # Header / Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hr = hp.add_run("PATENT APPLICATION SPECIFICATION DRAWINGS • ECOSHARE AI")
        hr.font.name = "Cambria"
        hr.font.size = Pt(8.5)
        hr.font.color.rgb = RGBColor(148, 163, 184)
    
    # ==========================================
    # PAGE 1: FIG. 1 - OVERALL ARCHITECTURE
    # ==========================================
    add_styled_paragraph(doc, "PATENT DRAWINGS • SHEET 1 OF 6", font_size=9, bold=True, color_rgb=(100, 116, 139), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=2)
    add_styled_paragraph(doc, "FIG. 1: DISTRIBUTED CYBER-PHYSICAL SYSTEM ARCHITECTURE & NETWORK TOPOLOGY", font_size=13, bold=True, color_rgb=(15, 23, 42), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Distributed multi-tier cloud computing architecture with computer vision, logistics optimization, and cryptographic verification modules [System Reference 100].", font_size=9.5, italic=True, color_rgb=(71, 85, 105), space_after=6)
    
    # Arch Diagram Table (Tier 1: Client Terminals)
    t1 = doc.add_table(rows=1, cols=3)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t1.autofit = False
    for col, width in zip(t1.columns, [Inches(2.2), Inches(2.3), Inches(2.4)]):
        col.width = width
    create_flow_box(t1, 0, 0, "102", "DONOR CLIENT TERMINAL", "• Optical Camera Subsystem [108]\n• Interactive GPS Geocoding [110]\n• Mobile Client GUI Interface", fill_color="F0FDF4", border_color="0D9668")
    create_flow_box(t1, 0, 1, "104", "VOLUNTEER TERMINAL", "• Real-Time GPS Tracking [114]\n• Optical QR Handover Scanner [116]\n• CVRP Route Navigation Client", fill_color="F0F9FF", border_color="0284C7")
    create_flow_box(t1, 0, 2, "106", "NGO SHELTER PORTAL", "• Shelter Capacity Telemetry [118]\n• Demand Logger & Verification\n• Local Redistribution Registry", fill_color="FFFBEB", border_color="D97706")
    
    # Network Connector
    p_conn = doc.add_paragraph()
    p_conn.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_conn.paragraph_format.space_before = Pt(2)
    p_conn.paragraph_format.space_after = Pt(2)
    r_conn = p_conn.add_run("▼  Encrypted Mutual TLS / HTTPS REST & WebSocket Protocol Bus [112]  ▼")
    r_conn.font.name = "Cambria"
    r_conn.font.size = Pt(8.5)
    r_conn.font.bold = True
    r_conn.font.color.rgb = RGBColor(100, 116, 139)
    
    # Tier 2: Core Platform Services (2x2 Grid)
    t2 = doc.add_table(rows=2, cols=2)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col, width in zip(t2.columns, [Inches(3.45), Inches(3.45)]):
        col.width = width
    create_flow_box(t2, 0, 0, "124", "AI VOLUMETRIC ESTIMATION SUBSYSTEM", "• Dual-Perspective Vision Module [126]\n• Calibrated Container Geometry Matrix [128]\n• 12-Category Food Density Physics Tensor [130]\n• Closed-Loop Continuous MAPE Engine [132]", fill_color="F8FAFC", border_color="0D9668")
    create_flow_box(t2, 0, 1, "134", "TRI-FACTOR DECAY & PRIORITY ENGINE", "• Dynamic Shelf-Life Decay Estimator [136]\n• Biological Moisture & Water Activity Curves\n• Weighted Urgency Priority Function [138]\n• Room-Temperature Threshold Watchdog", fill_color="F8FAFC", border_color="0284C7")
    create_flow_box(t2, 1, 0, "140", "LOGISTICAL CVRP DISPATCH SUBSYSTEM", "• Proactive Shelter Deficit Forecaster [142]\n• Haversine Spatial Clustered Graph [144]\n• Capacitated Vehicle Routing Solver [146]\n• Transport CO2e & Diesel Minimization", fill_color="F8FAFC", border_color="D97706")
    create_flow_box(t2, 1, 1, "148", "CRYPTOGRAPHIC AUDIT SUBSYSTEM", "• IPCC AR6 Multi-Gas Calculator [150]\n• Landfill Methane Mitigation Engine (GWP 28x) [152]\n• Zero-Trust Single-Use Token Gate (tau) [156]\n• Immutable SHA-256 Distributed Ledger [158]", fill_color="F8FAFC", border_color="7C3AED")
    
    # Connector to DB
    p_conn2 = doc.add_paragraph()
    p_conn2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_conn2.paragraph_format.space_before = Pt(2)
    p_conn2.paragraph_format.space_after = Pt(2)
    r_conn2 = p_conn2.add_run("▼  High-Throughput ACID Transaction Layer [159]  ▼")
    r_conn2.font.name = "Cambria"
    r_conn2.font.size = Pt(8.5)
    r_conn2.font.bold = True
    r_conn2.font.color.rgb = RGBColor(100, 116, 139)
    
    # Tier 3: Data Layer
    t3 = doc.add_table(rows=1, cols=3)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col, width in zip(t3.columns, [Inches(2.2), Inches(2.3), Inches(2.4)]):
        col.width = width
    create_flow_box(t3, 0, 0, "162", "RELATIONAL STORE", "• User, NGO & Donor Schemas\n• Donation Entity Lifecycle State\n• Historical MAPE Training Baselines", fill_color="F8FAFC", border_color="64748B")
    create_flow_box(t3, 0, 1, "164", "GEOSPATIAL REGISTRY", "• OpenStreetMap Spatial Coordinates\n• 28 Live Node Pins (Trichy Radar)\n• Network Transit Distance Matrices", fill_color="F8FAFC", border_color="64748B")
    create_flow_box(t3, 0, 2, "166", "CRYPTOGRAPHIC AUDIT LOG", "• Immutable SHA-256 Ledger Hashes\n• Single-Use Optical Token State (tau)\n• Verified CSR Carbon Certificates", fill_color="F8FAFC", border_color="64748B")
    
    # Reference Index
    add_styled_paragraph(doc, "Reference Numeral Key & Technical Operation:", font_size=10, bold=True, color_rgb=(15, 23, 42), space_before=4, space_after=1)
    add_styled_paragraph(doc, "100: Overall cyber-physical platform; 102: Donor client device executing non-contact capture; 104: Volunteer mobile terminal; 106: NGO shelter node; 108: Optical camera; 110: GPS geocoder; 112: TLS communications bus; 120: Backend enterprise application server; 124: Volumetric AI estimator; 134: Dynamic shelf-life priority engine; 140: CVRP logistics solver; 148: SHA-256 cryptographic environmental ledger; 160: Persistent storage layer. The system eliminates physical scale hardware, minimizes fuel consumption, and prevents offset double-counting.", font_size=8.5, color_rgb=(51, 65, 85), line_spacing=1.05)
    
    # ==========================================
    # PAGE 2: FIG. 2 - VOLUMETRIC ESTIMATION
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "PATENT DRAWINGS • SHEET 2 OF 6", font_size=9, bold=True, color_rgb=(100, 116, 139), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=2)
    add_styled_paragraph(doc, "FIG. 2: NON-CONTACT VOLUMETRIC FOOD MASS ESTIMATION & ERROR-BOUNDING SUBSYSTEM", font_size=13, bold=True, color_rgb=(15, 23, 42), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Computer vision, container geometry modeling, bulk density physics tensors, and closed-loop statistical uncertainty bounding [Method Reference 200].", font_size=9.5, italic=True, color_rgb=(71, 85, 105), space_after=6)
    
    # Flowchart FIG 2 Table
    f2_rows = [
        ("202", "START: FOOD DONATION INITIATION", "Donor triggers non-contact surplus food registration routine on mobile terminal."),
        ("204", "INGEST IMAGE DATASET & RECEPTACLE ATTRIBUTES", "Receive Top-View Image (I_top), Optional Side-View Image (I_side), Container Receptacle Identifier (C_id), and Culinary Category Identifier (Cat_id)."),
        ("206", "QUERY CALIBRATED RECEPTACLE REFERENCE MATRIX", "Retrieve reference volume (V_calibrated): 5L Buffet Chafing Dish (5.0L), 10L Catering Pot (10.0L), 20L Feast Drum (20.0L), 50L Feast Pot (50.0L), or Custom Liters (V_custom)."),
        ("208", "CALCULATE EFFECTIVE RECEPTACLE FLUID VOLUME", "Execute volumetric transformation: V_eff = V_calibrated * (Fill_Percentage / 100.0)."),
        ("210", "RETRIEVE 12-CATEGORY BULK DENSITY PHYSICS COEFFICIENT", "Map Cat_id to bulk density tensor (rho_c, kg/L): Cooked Rice (0.80), Cooked Curry (0.95), Mixed Biryani (0.85), Vegetables (0.70), Bread/Bakery (0.35), Dairy (1.03), Sweets (0.90)."),
        ("212", "COMPUTE MIDPOINT PHYSICAL MASS & SERVING EQUIVALENTS", "Calculate deterministic midpoint mass: M_mid = V_eff * rho_c. Calculate serving count: Servings_mid = round(M_mid / Portion_kg), where Portion_kg is category-specific (100g-250g)."),
        ("214", "DECISION: EVALUATE IMAGE PERSPECTIVE COUNT (DUAL VS. MONOCULAR)", "Assess whether both orthogonal Top-View (I_top) and Side-View (I_side) images exist in payload."),
        ("216/218", "APPLY DYNAMIC STATISTICAL UNCERTAINTY ERROR BOUNDARY", "Branch 218 (Dual-View): Assign tight uncertainty margin of +/- 8% (Base Confidence: 89%).\nBranch 216 (Monocular Top-View): Assign baseline uncertainty margin of +/- 12% (Base Confidence: 82%)."),
        ("220/222", "CALCULATE CONTAINER REPEATABILITY BONUS", "Branch 222: If C_id corresponds to a Standard Calibrated Vessel, add +5% repeatability confidence bonus.\nBranch 224: If custom receptacle, retain base confidence score."),
        ("226", "SYNTHESIZE BOUNDED MASS & MEAL TUPLE", "Generate statistical bound tuple: [M_min, M_max] = [M_mid * (1 - Margin), M_mid * (1 + Margin)], and serving span [Servings_min, Servings_max]."),
        ("228/230", "CLOSED-LOOP SELF-LEARNING MAPE MODEL RECALIBRATION", "Step 228: Log verified physical scale weight (M_actual) upon recipient check-in.\nStep 230: Continuously compute rolling Mean Absolute Percentage Error: MAPE = (1/N) * SUM( |M_mid - M_actual| / M_actual ) * 100."),
        ("232", "OUTPUT VALIDATED RECORD TO REDISTRIBUTION RADAR", "Bind estimated mass tuple, confidence score, and error margin into donation entity.")
    ]
    
    t_f2 = doc.add_table(rows=len(f2_rows)*2 - 1, cols=1)
    t_f2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f2.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (num, title, desc) in enumerate(f2_rows):
        is_decision = "DECISION" in title
        border_col = "0284C7" if is_decision else "0D9668"
        bg_col = "F0F9FF" if is_decision else "F0FDF4" if i==0 or i==len(f2_rows)-1 else "F8FAFC"
        create_flow_box(t_f2, r_idx, 0, num, title, desc, fill_color=bg_col, border_color=border_col)
        r_idx += 1
        if i < len(f2_rows) - 1:
            add_arrow_row(t_f2, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Significance of FIG. 2:", font_size=10, bold=True, color_rgb=(15, 23, 42), space_before=4, space_after=1)
    add_styled_paragraph(doc, "The method overcomes monocular scale ambiguity by grounding computer vision in standardized catering receptacle geometry, dynamic density transformation tensors, and multi-perspective statistical bounding. The closed-loop MAPE feedback mechanism dynamically improves accuracy without requiring manual model retraining.", font_size=8.5, color_rgb=(51, 65, 85), line_spacing=1.05)

    # ==========================================
    # PAGE 3: FIG. 3 - TRI-FACTOR DECAY & PRIORITY
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "PATENT DRAWINGS • SHEET 3 OF 6", font_size=9, bold=True, color_rgb=(100, 116, 139), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=2)
    add_styled_paragraph(doc, "FIG. 3: TRI-FACTOR MICROBIOLOGICAL DECAY & PRIORITY URGENCY SCORING SUBSYSTEM", font_size=13, bold=True, color_rgb=(15, 23, 42), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Food microbiology kinetics, room-temperature shelf-life curves, and multi-objective priority optimization [Method Reference 300].", font_size=9.5, italic=True, color_rgb=(71, 85, 105), space_after=6)
    
    f3_rows = [
        ("302", "START: DONATION TIMESTAMP VALIDATION", "System initializes perishability assessment upon receipt of confirmed food creation record."),
        ("304", "INGEST PERISHABLE INPUT PARAMETERS", "Extract food mass M (kg), culinary category classification Cat, preparation timestamp T_prep, and current system timestamp T_now."),
        ("306", "RETRIEVE MICROBIAL SHELF-LIFE ARRAY T_shelf(Cat)", "Query empirical room-temperature bacterial safety thresholds:\n• Cooked Rice (6.0h), Cooked Gravy/Curry (5.0h), Dairy/Milk (4.0h), Mixed Feasts (4.0h), Bakery (24.0h), Produce (48.0h)."),
        ("308", "COMPUTE REMAINING SAFE DISTRIBUTION TIME (t_rem)", "Calculate remaining safe hours: t_rem = max(0, T_shelf(Cat) - (T_now - T_prep)/60.0). Calculate predicted expiry timestamp: T_exp = T_prep + T_shelf(Cat)."),
        ("310", "COMPUTE NORMALIZED MULTI-OBJECTIVE SUB-SCORE VECTORS", "Calculate sub-scores:\n1. Mass Impact Vector: S_qty = min(100, (M / 100.0) * 100)\n2. Freshness Urgency Vector: S_fresh derived from step-function mapping of t_rem (t_rem<=0h -> 100, <=1h -> 95, <=2h -> 80, <=4h -> 60, <=8h -> 40)\n3. Elapsed Time Vector: S_time derived from elapsed preparation time."),
        ("312", "EVALUATE COMPOSITE PRIORITY SCORING EQUATION", "Compute scalar priority score P in range [0, 100]:\nP = clamp(0, 100, [0.30 * S_qty] + [0.50 * S_fresh] + [0.20 * S_time])."),
        ("314", "DECISION: IS FOOD FRESHNESS REMAINING (t_rem > 0)?", "Verify whether food remains within safe microbiological consumption limits prior to dispatch."),
        ("316", "BRANCH: VALIDATED FOR RAPID REDISTRIBUTION", "If t_rem > 0: Assign priority classification (Critical: P>=85, High: P>=70, Medium: P>=50). Broadcast real-time dispatch alerts to nearest NGO shelters."),
        ("318", "BRANCH: EXPIRED / CRITICAL BIO-HAZARD DETECTED", "If t_rem <= 0: Block human consumption redistribution state. Automatically re-route batch to municipal anaerobic biogas or composting stream."),
        ("320", "COMMIT PRIORITY METRICS TO RECORD", "Persist priority score, safe hours remaining, and expiry timestamp to database registry.")
    ]
    
    t_f3 = doc.add_table(rows=len(f3_rows)*2 - 1, cols=1)
    t_f3.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f3.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (num, title, desc) in enumerate(f3_rows):
        is_decision = "DECISION" in title
        border_col = "D97706" if is_decision else "0D9668"
        bg_col = "FFFBEB" if is_decision else "F0FDF4" if i==0 or i==len(f3_rows)-1 else "F8FAFC"
        create_flow_box(t_f3, r_idx, 0, num, title, desc, fill_color=bg_col, border_color=border_col)
        r_idx += 1
        if i < len(f3_rows) - 1:
            add_arrow_row(t_f3, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Significance of FIG. 3:", font_size=10, bold=True, color_rgb=(15, 23, 42), space_before=4, space_after=1)
    add_styled_paragraph(doc, "The priority engine dynamically couples category-specific bacterial growth kinetics with batch mass and chronological transit deadlines, preventing the redistribution of spoiled food while guaranteeing that high-volume perishable batches are matched to nearby NGOs within minimum latency windows.", font_size=8.5, color_rgb=(51, 65, 85), line_spacing=1.05)

    # ==========================================
    # PAGE 4: FIG. 4 - CVRP ROUTE LOGISTICS
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "PATENT DRAWINGS • SHEET 4 OF 6", font_size=9, bold=True, color_rgb=(100, 116, 139), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=2)
    add_styled_paragraph(doc, "FIG. 4: PERISHABILITY-CONSTRAINED MULTI-STOP CVRP LOGISTICS ROUTING SUBSYSTEM", font_size=13, bold=True, color_rgb=(15, 23, 42), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Operations research, Capacitated Vehicle Routing Problem (CVRP), payload capacity boundaries, and transport emission minimization [Method Reference 400].", font_size=9.5, italic=True, color_rgb=(71, 85, 105), space_after=6)
    
    f4_rows = [
        ("402", "START: VOLUNTEER MULTI-STOP DISPATCH REQUEST", "Volunteer client requests optimal routing for multi-batch collection mission."),
        ("404", "INGEST MISSION GEOMETRY & VEHICLE BOUNDARIES", "Receive Volunteer Origin (lat_0, lng_0), Vehicle Payload Capacity Limit C_max (kg), Candidate Pickup Set P = {P_1...P_n}, Candidate Delivery Set D = {D_1...D_m}."),
        ("406", "COMPUTE ALL-PAIRS HAVERSINE SPATIAL DISTANCE MATRIX", "Calculate spherical distance matrix d(i, j) for all candidate node pairs:\nd(i, j) = 2 * R * arcsin( sqrt( sin^2(dlat/2) + cos(lat_i)*cos(lat_j)*sin^2(dlng/2) ) )."),
        ("408", "INITIALIZE VEHICLE TRAJECTORY & PAYLOAD REGISTERS", "Set Current_Location = Origin, Current_Payload L = 0 kg, Total_Distance d_opt = 0 km, Trajectory Array = [Stop_0 (Depot)]."),
        ("410", "DECISION: ARE UNVISITED PICKUP NODES REMAINING IN SET P?", "Check if surplus food donors require collection along the active corridor."),
        ("412", "LOCATE NEAREST CANDIDATE PICKUP NODE P_k", "Identify node P_k in P that minimizes spatial distance: min( d(Current_Location, P_k) )."),
        ("414", "DECISION: DOES PAYLOAD SATISFY CAPACITY (L + M_k <= C_max)?", "Verify that adding donor batch M_k does not breach vehicle gross payload limit C_max."),
        ("416/418", "APPEND PICKUP STOP & UPDATE VEHICLE PAYLOAD", "Branch 416 (Capacity OK): Append P_k to Trajectory. Update L += M_k. Accumulate d_opt. Remove P_k from P.\nBranch 418 (Capacity Exceeded): Trigger mandatory intermediate delivery dropoff to nearest shelter before collecting further surplus."),
        ("420/422", "EXECUTE TOPOLOGICALLY PRECEDENT DELIVERY DROPOFFS", "Step 420: Evaluate remaining candidate shelters in Set D.\nStep 422: Enforce topological dependency (Pickup P_i must precede Delivery D_i). Append nearest shelter D_j to Trajectory. Update L -= M_j. Accumulate d_opt."),
        ("424", "COMPUTE TRANSPORT EMISSION & FUEL SAVINGS", "Calculate conserved metrics relative to unoptimized radial transit:\n• Baseline Radial Distance: d_unopt = d_opt * 1.40\n• Distance Saved: Delta_d = d_unopt - d_opt\n• Diesel Conserved: Delta_Fuel = Delta_d * 0.12 L/km\n• Transport CO2e Avoided: Delta_CO2 = Delta_Fuel * 2.31 kg/L."),
        ("426", "TRANSMIT ORDERED MULTI-STOP MANIFEST TO CLIENT", "Stream structured waypoint array with live turn-by-turn navigation instructions to volunteer terminal."),
        ("428", "END: ROUTE SYNTHESIS TERMINATION", "Route manifest executed and locked.")
    ]
    
    t_f4 = doc.add_table(rows=len(f4_rows)*2 - 1, cols=1)
    t_f4.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f4.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (num, title, desc) in enumerate(f4_rows):
        is_decision = "DECISION" in title
        border_col = "0284C7" if is_decision else "0D9668"
        bg_col = "F0F9FF" if is_decision else "F0FDF4" if i==0 or i==len(f4_rows)-1 else "F8FAFC"
        create_flow_box(t_f4, r_idx, 0, num, title, desc, fill_color=bg_col, border_color=border_col)
        r_idx += 1
        if i < len(f4_rows) - 1:
            add_arrow_row(t_f4, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Significance of FIG. 4:", font_size=10, bold=True, color_rgb=(15, 23, 42), space_before=4, space_after=1)
    add_styled_paragraph(doc, "The CVRP routine solves the NP-hard vehicle routing problem under simultaneous payload weight constraints, chronological pickup-before-delivery ordering, and perishability time windows, directly quantifying transport carbon mitigation achieved through multi-stop route consolidation.", font_size=8.5, color_rgb=(51, 65, 85), line_spacing=1.05)

    # ==========================================
    # PAGE 5: FIG. 5 - DEMAND FORECASTING
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "PATENT DRAWINGS • SHEET 5 OF 6", font_size=9, bold=True, color_rgb=(100, 116, 139), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=2)
    add_styled_paragraph(doc, "FIG. 5: PROACTIVE SHELTER DEFICIT & TIME-SERIES DEMAND FORECASTING SUBSYSTEM", font_size=13, bold=True, color_rgb=(15, 23, 42), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Time-series statistical forecasting, recipient inventory telemetry, and proactive commercial surplus solicitation [Method Reference 500].", font_size=9.5, italic=True, color_rgb=(71, 85, 105), space_after=6)
    
    f5_rows = [
        ("502", "START: 24-HOUR RECURRENT FORECAST CYCLE", "Engine triggers automated regional forecasting routine across urban ecosystem."),
        ("504", "INGEST RECIPIENT SHELTER INVENTORY & CAPACITY TELEMETRY", "Query registered NGO shelter network (k = 1...N). Retrieve certified meal capacities Cap_k, cold-storage flags Stor_k, and on-hand inventory reserves R_k."),
        ("506", "APPLY TIME-SERIES MEAL CONSUMPTION HEURISTIC", "Apply multi-factor consumption coefficients:\n• Day-of-Week Trend Factor (gamma_dow)\n• Holiday / Festival Calendar Multiplier (gamma_fest)\nCompute estimated meals needed: Meals_k = round(Cap_k * 2.20 * gamma_dow * gamma_fest).\nCompute physical mass deficit: Deficit_kg = Meals_k / 6.25 meals/kg."),
        ("508", "CLUSTER GEOSPATIAL DEFICIT CORRIDORS & HIGH-DEMAND ZONES", "Aggregate shelter requirements into spatial clusters (e.g., Chathiram Corridor, Thillai Nagar Hub, TVS Tollgate District)."),
        ("510", "CLASSIFY DEFICIT CRITICALITY & PEAK TIMING WINDOWS", "Categorize urgency levels:\n• Capacity > 300 kg -> CRITICAL (Peak Deficit Window: 12:30 PM - 02:00 PM Lunch Peak)\n• Capacity > 150 kg -> HIGH (Peak Deficit Window: 07:00 PM - 08:30 PM Dinner Peak)\n• Capacity <= 150 kg -> MODERATE (Breakfast Window)."),
        ("512", "AGGREGATE EXPECTED ACTIVE COMMERCIAL SURPLUS INVENTORY", "Query scheduled commercial kitchen buffets, banquet bookings, and institutional canteen schedules. Calculate Deficit Coverage Percentage: Coverage_% = (Expected_Surplus / Total_Deficit) * 100."),
        ("514", "GENERATE PROACTIVE INVENTORY DISPATCH & SOLICITATION NOTICES", "Synthesize proactive surplus request alerts transmitted to commercial hotels and marriage halls 6 hours prior to predicted peak deficit windows."),
        ("516", "OUTPUT FORECAST MATRIX TO ADMINISTRATIVE OBSERVATORY", "Render demand predictions, high-risk zones, and proactive dispatch recommendations on central dashboard.")
    ]
    
    t_f5 = doc.add_table(rows=len(f5_rows)*2 - 1, cols=1)
    t_f5.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f5.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (num, title, desc) in enumerate(f5_rows):
        is_decision = "DECISION" in title
        border_col = "7C3AED" if is_decision else "0284C7"
        bg_col = "EDE9FE" if is_decision else "F0F9FF" if i==0 or i==len(f5_rows)-1 else "F8FAFC"
        create_flow_box(t_f5, r_idx, 0, num, title, desc, fill_color=bg_col, border_color=border_col)
        r_idx += 1
        if i < len(f5_rows) - 1:
            add_arrow_row(t_f5, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Significance of FIG. 5:", font_size=10, bold=True, color_rgb=(15, 23, 42), space_before=4, space_after=1)
    add_styled_paragraph(doc, "This subsystem transforms surplus food distribution from a reactive model into a proactive, predictive allocation architecture. By anticipating shelter meal deficits hours before commercial food waste occurs, the system eliminates food shortages in high-density recipient zones.", font_size=8.5, color_rgb=(51, 65, 85), line_spacing=1.05)

    # ==========================================
    # PAGE 6: FIG. 6 - ZERO-TRUST & SHA-256 LEDGER
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "PATENT DRAWINGS • SHEET 6 OF 6", font_size=9, bold=True, color_rgb=(100, 116, 139), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=2)
    add_styled_paragraph(doc, "FIG. 6: ZERO-TRUST CHAIN OF CUSTODY & CRYPTOGRAPHIC SHA-256 ENVIRONMENTAL LEDGER", font_size=13, bold=True, color_rgb=(15, 23, 42), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Cryptographic authentication, zero-trust token handshakes, IPCC AR6 multi-gas environmental accounting, and immutable SHA-256 ledgers [Method Reference 600].", font_size=9.5, italic=True, color_rgb=(71, 85, 105), space_after=6)
    
    f6_rows = [
        ("602", "START: DONATION VALIDATION CONFIRMATION", "Donation entity validated and assigned to logistical transit pipeline."),
        ("604", "GENERATE NON-DETERMINISTIC SINGLE-USE HANDOVER TOKEN (tau)", "Execute cryptographic entropy generation to synthesize unique 8-character single-use token: tau = Substring(UUID_v4(), 0, 8). Token is hashed and stored in database."),
        ("606", "RENDER & AFFIX 2D OPTICAL MACHINE-READABLE CODE", "Generate high-density 2D optical code (QR code) encoding tau. Affix physical label directly to food container package."),
        ("608", "VOLUNTEER ARRIVAL AT PHYSICAL RECIPIENT SHELTER", "Volunteer transports sealed container to destination NGO receiving depot."),
        ("610", "OPTICAL SCAN & HANDOVER TOKEN INGESTION", "Volunteer scans container optical code or enters alphanumeric string tau_input via mobile terminal."),
        ("612", "DECISION: ZERO-TRUST CRYPTOGRAPHIC MATCH (tau_input == tau)?", "Evaluate exact string match between captured handover token and secured database token."),
        ("614/616", "BRANCH: ZERO-TRUST VERIFICATION BARRIER", "Branch 614 (Mismatch): Deny status transition. Lock delivery state. Log security exception in audit log.\nBranch 616 (Match Verified): Authorize state transition to DELIVERED. Commit delivery timestamp."),
        ("620", "COMPUTE IPCC AR6 MULTI-GAS ENVIRONMENTAL NEXUS", "Compute audited environmental offsets based on confirmed physical mass M_actual:\n1. Avoided CO2e Emissions = M_actual * 2.50 kg CO2e/kg\n2. Conserved Virtual Water = M_actual * 1800 Liters/kg\n3. Landfill Methane Mitigation = M_actual * 0.06 kg CH4/kg * 28 (IPCC AR6 100-yr GWP factor)\n4. Physical Equivalencies: Cars Negated (CO2e*4.1 km), Trees Planted (CO2e/22), Clean Energy (CO2e*12h)."),
        ("622", "CONSTRUCT CANONICAL LEDGER TRANSACTION STRING", "Synthesize unalterable byte array payload:\nPayload = 'EVS-LEDGER-V1|' + Donor_ID + '|' + Cert_Code + '|' + CO2e_Avoided + '|' + Water_Saved + '|' + Timestamp."),
        ("624", "GENERATE 256-BIT CRYPTOGRAPHIC MESSAGE DIGEST", "Execute FIPS 180-4 Secure Hash Algorithm 256 over canonical byte payload: Hash_SHA256 = SHA-256( ASCII_Bytes( Payload ) )."),
        ("626", "PERSIST IMMUTABLE LEDGER RECORD & ISSUE CERTIFICATE", "Persist cryptographic hash to audit table. Issue verified CSR Environmental Certificate with embedded hash. Expose public REST verification endpoint (/verify-hash/{Hash}). Update Corporate ESG Leaderboard ranking."),
        ("628", "END: TRANSACTION VERIFICATION COMPLETE", "Cryptographically sealed environmental offset transaction finalized.")
    ]
    
    t_f6 = doc.add_table(rows=len(f6_rows)*2 - 1, cols=1)
    t_f6.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f6.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (num, title, desc) in enumerate(f6_rows):
        is_decision = "DECISION" in title
        border_col = "D97706" if is_decision else "7C3AED" if "SHA-256" in title or "CRYPTOGRAPHIC" in title else "0D9668"
        bg_col = "FFFBEB" if is_decision else "EDE9FE" if "SHA-256" in title else "F0FDF4" if i==0 or i==len(f6_rows)-1 else "F8FAFC"
        create_flow_box(t_f6, r_idx, 0, num, title, desc, fill_color=bg_col, border_color=border_col)
        r_idx += 1
        if i < len(f6_rows) - 1:
            add_arrow_row(t_f6, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Significance of FIG. 6:", font_size=10, bold=True, color_rgb=(15, 23, 42), space_before=4, space_after=1)
    add_styled_paragraph(doc, "The zero-trust handover protocol guarantees physical custody transfer prior to database state transitions. The immutable SHA-256 cryptographic ledger binds delivered mass directly to peer-reviewed IPCC AR6 methane and water metrics, eliminating offset double-counting and providing mathematically verifiable evidence for corporate ESG tax and compliance audits.", font_size=8.5, color_rgb=(51, 65, 85), line_spacing=1.05)

    # Save document
    output_filename = "EcoShare_AI_Patent_Architecture_Flowcharts.docx"
    output_path = os.path.join("c:/Users/Asus/Downloads/evs", output_filename)
    doc.save(output_path)
    print(f"Patent document successfully created: {output_path}")

if __name__ == "__main__":
    build_patent_document()
