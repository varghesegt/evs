import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=70, bottom=70, left=110, right=110):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}>'
                      f'<w:top w:w="{top}" w:type="dxa"/>'
                      f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
                      f'<w:left w:w="{left}" w:type="dxa"/>'
                      f'<w:right w:w="{right}" w:type="dxa"/>'
                      f'</w:tcMar>')
    tcPr.append(tcMar)

def set_cell_borders(cell, top_c="000000", bottom_c="000000", left_c="000000", right_c="000000", sz=6, border_style="single"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}>'
                          f'<w:top w:val="{"none" if not top_c else border_style}" w:sz="{sz}" w:space="0" w:color="{top_c or "auto"}"/>'
                          f'<w:left w:val="{"none" if not left_c else border_style}" w:sz="{sz}" w:space="0" w:color="{left_c or "auto"}"/>'
                          f'<w:bottom w:val="{"none" if not bottom_c else border_style}" w:sz="{sz}" w:space="0" w:color="{bottom_c or "auto"}"/>'
                          f'<w:right w:val="{"none" if not right_c else border_style}" w:sz="{sz}" w:space="0" w:color="{right_c or "auto"}"/>'
                          f'</w:tcBorders>')
    tcPr.append(tcBorders)

def add_styled_paragraph(container, text, font_name="Cambria", font_size=10, bold=False, italic=False, color_rgb=(0, 0, 0), align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=2, line_spacing=1.05):
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

def create_bw_flow_box(table, row_idx, col_idx, title, description="", is_decision=False, is_terminal=False):
    cell = table.cell(row_idx, col_idx)
    set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
    
    # Strictly Black and White Styling
    if is_terminal:
        # Terminal Start/End: clean solid black border, light gray or white fill
        set_cell_background(cell, "F2F2F2")
        set_cell_borders(cell, top_c="000000", bottom_c="000000", left_c="000000", right_c="000000", sz=12, border_style="single")
    elif is_decision:
        # Decision Diamond Representation: double black border
        set_cell_background(cell, "FFFFFF")
        set_cell_borders(cell, top_c="000000", bottom_c="000000", left_c="000000", right_c="000000", sz=10, border_style="double")
    else:
        # Standard Processing Step: crisp single black border
        set_cell_background(cell, "FFFFFF")
        set_cell_borders(cell, top_c="000000", bottom_c="000000", left_c="000000", right_c="000000", sz=6, border_style="single")
    
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.line_spacing = 1.05
    
    # Title run
    run_t = p.add_run(title)
    run_t.font.name = "Cambria"
    run_t.font.size = Pt(9.0)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(0, 0, 0)
    
    if description:
        p2 = cell.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p2.paragraph_format.space_before = Pt(1)
        p2.paragraph_format.space_after = Pt(0)
        p2.paragraph_format.line_spacing = 1.05
        run_d = p2.add_run(description)
        run_d.font.name = "Cambria"
        run_d.font.size = Pt(8.0)
        run_d.font.italic = False
        run_d.font.color.rgb = RGBColor(0, 0, 0)

def add_arrow_row(table, row_idx, arrow_text="▼"):
    cell = table.cell(row_idx, 0)
    set_cell_borders(cell, top_c=None, bottom_c=None, left_c=None, right_c=None)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(arrow_text)
    run.font.name = "Cambria"
    run.font.size = Pt(8.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)

def build_patent_document():
    doc = Document()
    
    # Page Setup (Monochrome Patent Specifications: 0.65 inch margins)
    for section in doc.sections:
        section.top_margin = Inches(0.60)
        section.bottom_margin = Inches(0.60)
        section.left_margin = Inches(0.70)
        section.right_margin = Inches(0.70)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        
        # Monochrome Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hr = hp.add_run("PATENT APPLICATION SPECIFICATION DRAWINGS")
        hr.font.name = "Cambria"
        hr.font.size = Pt(8.5)
        hr.font.bold = True
        hr.font.color.rgb = RGBColor(0, 0, 0)
    
    # ==========================================
    # PAGE 1: FIG. 1 - OVERALL ARCHITECTURE
    # ==========================================
    add_styled_paragraph(doc, "SHEET 1 OF 6", font_size=9, bold=True, color_rgb=(0, 0, 0), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=1)
    add_styled_paragraph(doc, "FIG. 1: DISTRIBUTED CYBER-PHYSICAL SYSTEM ARCHITECTURE & NETWORK TOPOLOGY", font_size=12.5, bold=True, color_rgb=(0, 0, 0), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Distributed multi-tier cloud computing architecture integrating non-contact volumetric vision, dynamic perishability kinetics, combinatorial logistics, and cryptographic environmental ledgers.", font_size=9.0, italic=True, color_rgb=(0, 0, 0), space_after=5)
    
    # Arch Diagram Table (Tier 1: Client Terminals)
    t1 = doc.add_table(rows=1, cols=3)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col, width in zip(t1.columns, [Inches(2.3), Inches(2.3), Inches(2.3)]):
        col.width = width
    create_bw_flow_box(t1, 0, 0, "DONOR CLIENT TERMINAL", "• Optical Camera Subsystem\n• Interactive GPS Geocoding\n• Mobile Client GUI Interface", is_terminal=True)
    create_bw_flow_box(t1, 0, 1, "VOLUNTEER MOBILE TERMINAL", "• Real-Time GPS Tracking\n• Optical QR Handover Scanner\n• CVRP Route Navigation Client", is_terminal=True)
    create_bw_flow_box(t1, 0, 2, "NGO SHELTER PORTAL", "• Shelter Capacity Telemetry\n• Demand Logger & Check-in Scale\n• Local Redistribution Registry", is_terminal=True)
    
    # Network Connector
    p_conn = doc.add_paragraph()
    p_conn.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_conn.paragraph_format.space_before = Pt(2)
    p_conn.paragraph_format.space_after = Pt(2)
    r_conn = p_conn.add_run("▼  Encrypted Mutual TLS / HTTPS REST & WebSocket Protocol Bus  ▼")
    r_conn.font.name = "Cambria"
    r_conn.font.size = Pt(8.5)
    r_conn.font.bold = True
    r_conn.font.color.rgb = RGBColor(0, 0, 0)
    
    # Tier 2: Core Platform Services (2x2 Grid)
    t2 = doc.add_table(rows=2, cols=2)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col, width in zip(t2.columns, [Inches(3.45), Inches(3.45)]):
        col.width = width
    create_bw_flow_box(t2, 0, 0, "AI VOLUMETRIC ESTIMATION SUBSYSTEM", "• Dual-Perspective Vision Module (Top/Lateral)\n• Calibrated Container Geometry Matrix\n• 12-Category Food Density Physics Tensor\n• Closed-Loop Continuous MAPE Engine")
    create_bw_flow_box(t2, 0, 1, "TRI-FACTOR DECAY & PRIORITY ENGINE", "• Dynamic Shelf-Life Decay Estimator\n• Biological Moisture & Water Activity Curves\n• Weighted Urgency Priority Scoring Function\n• Room-Temperature Threshold Watchdog")
    create_bw_flow_box(t2, 1, 0, "LOGISTICAL CVRP DISPATCH SUBSYSTEM", "• Proactive Shelter Deficit Forecaster\n• Haversine Spatial Clustered Graph\n• Capacitated Vehicle Routing Solver (CVRP)\n• Transport CO2e & Diesel Minimization")
    create_bw_flow_box(t2, 1, 1, "CRYPTOGRAPHIC AUDIT SUBSYSTEM", "• IPCC AR6 Multi-Gas Carbon Calculator\n• Landfill Methane Mitigation Engine (GWP 28x)\n• Zero-Trust Single-Use Handover Token Gate\n• Immutable SHA-256 Distributed Ledger")
    
    # Connector to DB
    p_conn2 = doc.add_paragraph()
    p_conn2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_conn2.paragraph_format.space_before = Pt(2)
    p_conn2.paragraph_format.space_after = Pt(2)
    r_conn2 = p_conn2.add_run("▼  High-Throughput ACID Transaction Layer  ▼")
    r_conn2.font.name = "Cambria"
    r_conn2.font.size = Pt(8.5)
    r_conn2.font.bold = True
    r_conn2.font.color.rgb = RGBColor(0, 0, 0)
    
    # Tier 3: Data Layer
    t3 = doc.add_table(rows=1, cols=3)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col, width in zip(t3.columns, [Inches(2.3), Inches(2.3), Inches(2.3)]):
        col.width = width
    create_bw_flow_box(t3, 0, 0, "RELATIONAL DATA STORE", "• User, NGO & Donor Schemas\n• Donation Entity Lifecycle State\n• Historical MAPE Training Baselines")
    create_bw_flow_box(t3, 0, 1, "GEOSPATIAL RADAR REGISTRY", "• OpenStreetMap Spatial Coordinates\n• Live Donor / Shelter Pin Registry\n• Network Transit Distance Matrices")
    create_bw_flow_box(t3, 0, 2, "CRYPTOGRAPHIC AUDIT LOG", "• Immutable SHA-256 Ledger Hashes\n• Single-Use Optical Token State\n• Verified CSR Carbon Certificates")
    
    add_styled_paragraph(doc, "Technical Description of FIG. 1:", font_size=9.5, bold=True, color_rgb=(0, 0, 0), space_before=4, space_after=1)
    add_styled_paragraph(doc, "FIG. 1 illustrates the overall cyber-physical system architecture. Client endpoints capture non-contact image data and GPS telemetry, transmitting structured requests across an encrypted TLS protocol bus to the enterprise application server. The application server coordinates volumetric estimation, microbiological shelf-life prioritization, capacitated vehicle routing, and cryptographic ledger hashing, persistently synchronizing transactions across the persistent data layer to automate surplus food redistribution without physical scale hardware.", font_size=8.5, color_rgb=(0, 0, 0), line_spacing=1.05)
    
    # ==========================================
    # PAGE 2: FIG. 2 - VOLUMETRIC ESTIMATION
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "SHEET 2 OF 6", font_size=9, bold=True, color_rgb=(0, 0, 0), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=1)
    add_styled_paragraph(doc, "FIG. 2: NON-CONTACT VOLUMETRIC FOOD MASS ESTIMATION & ERROR-BOUNDING SUBSYSTEM", font_size=12.5, bold=True, color_rgb=(0, 0, 0), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Computer vision, container geometry modeling, bulk density physics tensors, and closed-loop statistical uncertainty bounding.", font_size=9.0, italic=True, color_rgb=(0, 0, 0), space_after=5)
    
    f2_rows = [
        ("START: NON-CONTACT SURPLUS REGISTRATION", "Donor triggers non-contact surplus food registration routine on mobile terminal.", False, True),
        ("INGEST IMAGE DATASET & RECEPTACLE ATTRIBUTES", "Receive Top-View Image (I_top), Optional Side-View Image (I_side), Container Receptacle Identifier, and Culinary Category Identifier.", False, False),
        ("QUERY CALIBRATED RECEPTACLE REFERENCE MATRIX", "Retrieve calibrated reference volume: 5L Buffet Chafing Dish (5.0L), 10L Catering Pot (10.0L), 20L Feast Drum (20.0L), 50L Banquet Pot (50.0L), or Custom Volume (V_custom).", False, False),
        ("CALCULATE EFFECTIVE RECEPTACLE FLUID VOLUME", "Execute volumetric transformation: Effective Volume = Calibrated Reference Volume * (Fill Percentage / 100.0).", False, False),
        ("RETRIEVE 12-CATEGORY BULK DENSITY PHYSICS COEFFICIENT", "Map culinary category to bulk density tensor (kg/L): Cooked Rice (0.80), Cooked Curry (0.95), Mixed Biryani (0.85), Vegetables (0.70), Bread/Bakery (0.35), Dairy (1.03), Sweets (0.90).", False, False),
        ("COMPUTE MIDPOINT PHYSICAL MASS & SERVING EQUIVALENTS", "Calculate deterministic midpoint mass = Effective Volume * Category Bulk Density. Calculate serving count = round(Midpoint Mass / Portion Mass), where portion mass is category-specific (100g to 250g).", False, False),
        ("DECISION: EVALUATE IMAGE PERSPECTIVE COUNT (DUAL VS. MONOCULAR)", "Assess whether both orthogonal Top-View and Side-View images exist in input payload.", True, False),
        ("APPLY DYNAMIC STATISTICAL UNCERTAINTY ERROR BOUNDARY", "Dual-View Branch: Assign tight uncertainty margin of +/- 8% (Base Confidence: 89%).\nMonocular Top-View Branch: Assign baseline uncertainty margin of +/- 12% (Base Confidence: 82%).", False, False),
        ("CALCULATE CONTAINER REPEATABILITY BONUS", "Standard Calibrated Vessel: Add +5% repeatability confidence bonus.\nCustom Receptacle: Retain baseline confidence score.", False, False),
        ("SYNTHESIZE BOUNDED MASS & MEAL TUPLE", "Generate statistical bound tuple: [Minimum Mass, Maximum Mass] = [Midpoint Mass * (1 - Margin), Midpoint Mass * (1 + Margin)], and bounded serving range [Minimum Servings, Maximum Servings].", False, False),
        ("CLOSED-LOOP SELF-LEARNING MAPE MODEL RECALIBRATION", "Step A: Log verified physical scale weight upon recipient shelter check-in.\nStep B: Continuously compute rolling Mean Absolute Percentage Error: MAPE = (1/N) * SUM( |Estimated Mass - Actual Mass| / Actual Mass ) * 100.", False, False),
        ("OUTPUT VALIDATED RECORD TO REDISTRIBUTION RADAR", "Bind estimated mass tuple, confidence score, and error margin into validated donation record.", False, True)
    ]
    
    t_f2 = doc.add_table(rows=len(f2_rows)*2 - 1, cols=1)
    t_f2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f2.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (title, desc, is_dec, is_term) in enumerate(f2_rows):
        create_bw_flow_box(t_f2, r_idx, 0, title, desc, is_decision=is_dec, is_terminal=is_term)
        r_idx += 1
        if i < len(f2_rows) - 1:
            add_arrow_row(t_f2, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Description of FIG. 2:", font_size=9.5, bold=True, color_rgb=(0, 0, 0), space_before=3, space_after=1)
    add_styled_paragraph(doc, "FIG. 2 discloses the non-contact mass estimation process. Grounding visual fill percentages in standardized catering geometry and category-specific density coefficients eliminates scale ambiguity. Dual-perspective capture bounds statistical uncertainty to +/- 8%, while the closed-loop MAPE feedback mechanism dynamically recalibrates historical error rates using verified check-in data.", font_size=8.5, color_rgb=(0, 0, 0), line_spacing=1.05)

    # ==========================================
    # PAGE 3: FIG. 3 - TRI-FACTOR DECAY & PRIORITY
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "SHEET 3 OF 6", font_size=9, bold=True, color_rgb=(0, 0, 0), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=1)
    add_styled_paragraph(doc, "FIG. 3: TRI-FACTOR MICROBIOLOGICAL DECAY & PRIORITY URGENCY SCORING SUBSYSTEM", font_size=12.5, bold=True, color_rgb=(0, 0, 0), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Food microbiology kinetics, room-temperature shelf-life curves, and multi-objective priority optimization.", font_size=9.0, italic=True, color_rgb=(0, 0, 0), space_after=5)
    
    f3_rows = [
        ("START: DONATION TIMESTAMP VALIDATION", "System initializes perishability assessment upon receipt of confirmed food creation record.", False, True),
        ("INGEST PERISHABLE INPUT PARAMETERS", "Extract confirmed food mass (kg), culinary category classification, preparation timestamp, and current system timestamp.", False, False),
        ("RETRIEVE MICROBIAL SHELF-LIFE MATRIX", "Query empirical room-temperature bacterial safety thresholds:\nCooked Rice (6.0h), Cooked Gravy/Curry (5.0h), Dairy/Milk (4.0h), Mixed Feasts (4.0h), Bakery (24.0h), Produce (48.0h).", False, False),
        ("COMPUTE REMAINING SAFE DISTRIBUTION TIME", "Calculate remaining safe hours = max(0, Category Shelf-Life - (Current Time - Preparation Time) / 60.0). Calculate predicted expiry timestamp = Preparation Time + Category Shelf-Life.", False, False),
        ("COMPUTE NORMALIZED MULTI-OBJECTIVE SUB-SCORE VECTORS", "Calculate sub-scores:\n1. Mass Impact Vector: S_qty = min(100, (Mass / 100.0) * 100)\n2. Freshness Urgency Vector: S_fresh derived from step-function mapping of remaining safe hours\n3. Elapsed Time Vector: S_time derived from elapsed duration since food preparation.", False, False),
        ("EVALUATE COMPOSITE PRIORITY SCORING EQUATION", "Compute scalar priority score P in range [0, 100]:\nPriority Score = clamp(0, 100, [0.30 * S_qty] + [0.50 * S_fresh] + [0.20 * S_time]).", False, False),
        ("DECISION: IS FOOD FRESHNESS REMAINING (SAFE HOURS > 0)?", "Verify whether food remains within safe microbiological consumption limits prior to logistical dispatch.", True, False),
        ("BRANCH: VALIDATED FOR RAPID REDISTRIBUTION", "If safe hours > 0: Assign priority classification (Critical: P>=85, High: P>=70, Medium: P>=50). Broadcast real-time dispatch alerts to nearest NGO shelters.", False, False),
        ("BRANCH: EXPIRED / CRITICAL BIO-HAZARD DETECTED", "If safe hours <= 0: Block human consumption redistribution state. Automatically re-route batch to municipal anaerobic biogas or composting stream.", False, False),
        ("COMMIT PRIORITY METRICS TO RECORD", "Persist priority score, safe hours remaining, and expiry timestamp to database registry.", False, True)
    ]
    
    t_f3 = doc.add_table(rows=len(f3_rows)*2 - 1, cols=1)
    t_f3.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f3.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (title, desc, is_dec, is_term) in enumerate(f3_rows):
        create_bw_flow_box(t_f3, r_idx, 0, title, desc, is_decision=is_dec, is_terminal=is_term)
        r_idx += 1
        if i < len(f3_rows) - 1:
            add_arrow_row(t_f3, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Description of FIG. 3:", font_size=9.5, bold=True, color_rgb=(0, 0, 0), space_before=3, space_after=1)
    add_styled_paragraph(doc, "FIG. 3 details the microbiological decay logic. The priority engine dynamically couples category-specific bacterial growth kinetics with batch mass and chronological transit deadlines, preventing the redistribution of spoiled food while guaranteeing that high-volume perishable batches are matched to nearby NGOs within minimum latency windows.", font_size=8.5, color_rgb=(0, 0, 0), line_spacing=1.05)

    # ==========================================
    # PAGE 4: FIG. 4 - CVRP ROUTE LOGISTICS
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "SHEET 4 OF 6", font_size=9, bold=True, color_rgb=(0, 0, 0), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=1)
    add_styled_paragraph(doc, "FIG. 4: PERISHABILITY-CONSTRAINED MULTI-STOP CVRP LOGISTICS ROUTING SUBSYSTEM", font_size=12.5, bold=True, color_rgb=(0, 0, 0), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Operations research, Capacitated Vehicle Routing Problem (CVRP), payload capacity boundaries, and transport emission minimization.", font_size=9.0, italic=True, color_rgb=(0, 0, 0), space_after=5)
    
    f4_rows = [
        ("START: VOLUNTEER MULTI-STOP DISPATCH REQUEST", "Volunteer client requests optimal routing for multi-batch collection mission.", False, True),
        ("INGEST MISSION GEOMETRY & VEHICLE BOUNDARIES", "Receive Volunteer Origin Coordinates, Vehicle Payload Capacity Limit (kg), Candidate Pickup Set P, and Candidate Delivery Shelter Set D.", False, False),
        ("COMPUTE ALL-PAIRS HAVERSINE SPATIAL DISTANCE MATRIX", "Calculate spherical distance matrix for all candidate node pairs using Haversine formula based on Earth radius R = 6,371 km.", False, False),
        ("INITIALIZE VEHICLE TRAJECTORY & PAYLOAD REGISTERS", "Set Current Location = Origin, Current Payload = 0 kg, Total Distance = 0 km, Trajectory Array = [Depot Start].", False, False),
        ("DECISION: ARE UNVISITED PICKUP NODES REMAINING?", "Check if surplus food donors require collection along the active corridor.", True, False),
        ("LOCATE NEAREST CANDIDATE PICKUP NODE", "Identify unvisited pickup node in candidate set that minimizes spatial distance from current vehicle location.", False, False),
        ("DECISION: DOES PAYLOAD SATISFY CAPACITY (PAYLOAD + MASS <= CAPACITY)?", "Verify that adding candidate donor batch does not breach vehicle gross payload limit.", True, False),
        ("APPEND PICKUP STOP & UPDATE VEHICLE PAYLOAD", "Capacity Satisfied: Append pickup node to trajectory. Update current payload. Accumulate optimized distance. Remove node from candidate set.", False, False),
        ("FORCE INTERMEDIATE DELIVERY DROPOFF IF CAPACITY EXCEEDED", "Capacity Exceeded: Trigger mandatory intermediate delivery dropoff to nearest shelter before collecting further surplus.", False, False),
        ("EXECUTE TOPOLOGICALLY PRECEDENT DELIVERY DROPOFFS", "Enforce topological precedence dependency (Donor pickup must precede shelter delivery). Append nearest candidate shelter to trajectory. Decrement vehicle payload. Accumulate optimized distance.", False, False),
        ("COMPUTE TRANSPORT EMISSION & FUEL SAVINGS", "Calculate conserved metrics relative to unoptimized radial transit:\n• Baseline Radial Distance = Optimized Distance * 1.40\n• Distance Saved = Baseline Distance - Optimized Distance\n• Diesel Conserved = Distance Saved * 0.12 L/km\n• Transport CO2e Avoided = Diesel Conserved * 2.31 kg CO2/L.", False, False),
        ("TRANSMIT ORDERED MULTI-STOP MANIFEST TO CLIENT", "Stream structured waypoint array with live turn-by-turn navigation instructions to volunteer terminal.", False, True)
    ]
    
    t_f4 = doc.add_table(rows=len(f4_rows)*2 - 1, cols=1)
    t_f4.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f4.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (title, desc, is_dec, is_term) in enumerate(f4_rows):
        create_bw_flow_box(t_f4, r_idx, 0, title, desc, is_decision=is_dec, is_terminal=is_term)
        r_idx += 1
        if i < len(f4_rows) - 1:
            add_arrow_row(t_f4, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Description of FIG. 4:", font_size=9.5, bold=True, color_rgb=(0, 0, 0), space_before=3, space_after=1)
    add_styled_paragraph(doc, "FIG. 4 illustrates the CVRP routing solver. The algorithm resolves multi-stop vehicle trajectories subject to gross payload weight limits and strict chronological pickup-before-delivery dependencies. In doing so, it consolidates disparate donor batches into fuel-minimized routes and directly quantifies transport greenhouse gas emission reductions.", font_size=8.5, color_rgb=(0, 0, 0), line_spacing=1.05)

    # ==========================================
    # PAGE 5: FIG. 5 - DEMAND FORECASTING
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "SHEET 5 OF 6", font_size=9, bold=True, color_rgb=(0, 0, 0), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=1)
    add_styled_paragraph(doc, "FIG. 5: PROACTIVE SHELTER DEFICIT & TIME-SERIES DEMAND FORECASTING SUBSYSTEM", font_size=12.5, bold=True, color_rgb=(0, 0, 0), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Time-series statistical forecasting, recipient inventory telemetry, and proactive commercial surplus solicitation.", font_size=9.0, italic=True, color_rgb=(0, 0, 0), space_after=5)
    
    f5_rows = [
        ("START: 24-HOUR RECURRENT FORECAST CYCLE", "Engine triggers automated regional forecasting routine across urban ecosystem.", False, True),
        ("INGEST RECIPIENT SHELTER INVENTORY & CAPACITY TELEMETRY", "Query registered NGO shelter network. Retrieve certified meal capacities, cold-storage availability flags, and on-hand inventory reserves.", False, False),
        ("APPLY TIME-SERIES MEAL CONSUMPTION HEURISTIC", "Apply multi-factor consumption coefficients:\n• Day-of-Week Trend Multiplier\n• Regional Holiday / Festival Calendar Multiplier\nCompute estimated meals needed = round(Capacity * 2.20 * Multipliers).\nCompute physical mass deficit (kg) = Estimated Meals Needed / 6.25 meals/kg.", False, False),
        ("CLUSTER GEOSPATIAL DEFICIT CORRIDORS & HIGH-DEMAND ZONES", "Aggregate shelter requirements into spatial clusters across urban transit corridors.", False, False),
        ("DECISION: CLASSIFY DEFICIT CRITICALITY & PEAK TIMING WINDOWS", "Categorize urgency levels:\n• Capacity > 300 kg: CRITICAL (Peak Deficit Window: 12:30 PM - 02:00 PM Lunch Peak)\n• Capacity > 150 kg: HIGH (Peak Deficit Window: 07:00 PM - 08:30 PM Dinner Peak)\n• Capacity <= 150 kg: MODERATE (Breakfast Window).", True, False),
        ("AGGREGATE EXPECTED ACTIVE COMMERCIAL SURPLUS INVENTORY", "Query scheduled commercial kitchen buffets, banquet bookings, and institutional canteen schedules. Calculate Deficit Coverage Percentage = (Expected Surplus / Total Deficit) * 100.", False, False),
        ("GENERATE PROACTIVE INVENTORY DISPATCH & SOLICITATION NOTICES", "Synthesize proactive surplus request alerts transmitted to commercial hotels and banquet halls 6 hours prior to predicted peak deficit windows.", False, False),
        ("OUTPUT FORECAST MATRIX TO ADMINISTRATIVE OBSERVATORY", "Render demand predictions, high-risk zones, and proactive dispatch recommendations on central dashboard.", False, True)
    ]
    
    t_f5 = doc.add_table(rows=len(f5_rows)*2 - 1, cols=1)
    t_f5.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f5.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (title, desc, is_dec, is_term) in enumerate(f5_rows):
        create_bw_flow_box(t_f5, r_idx, 0, title, desc, is_decision=is_dec, is_terminal=is_term)
        r_idx += 1
        if i < len(f5_rows) - 1:
            add_arrow_row(t_f5, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Description of FIG. 5:", font_size=9.5, bold=True, color_rgb=(0, 0, 0), space_before=3, space_after=1)
    add_styled_paragraph(doc, "FIG. 5 demonstrates the proactive demand forecasting architecture. By converting historical day-of-week consumption patterns and shelter storage capacities into forward-looking deficit horizons, the system solicits commercial surplus hours before waste occurs, mitigating supply shortages in critical urban feeding corridors.", font_size=8.5, color_rgb=(0, 0, 0), line_spacing=1.05)

    # ==========================================
    # PAGE 6: FIG. 6 - ZERO-TRUST & SHA-256 LEDGER
    # ==========================================
    doc.add_page_break()
    add_styled_paragraph(doc, "SHEET 6 OF 6", font_size=9, bold=True, color_rgb=(0, 0, 0), align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=1)
    add_styled_paragraph(doc, "FIG. 6: ZERO-TRUST CHAIN OF CUSTODY & CRYPTOGRAPHIC SHA-256 ENVIRONMENTAL LEDGER", font_size=12.5, bold=True, color_rgb=(0, 0, 0), space_after=1)
    add_styled_paragraph(doc, "Technical Field: Cryptographic authentication, zero-trust token handshakes, IPCC AR6 multi-gas environmental accounting, and immutable SHA-256 ledgers.", font_size=9.0, italic=True, color_rgb=(0, 0, 0), space_after=5)
    
    f6_rows = [
        ("START: DONATION VALIDATION CONFIRMATION", "Donation entity validated and assigned to logistical transit pipeline.", False, True),
        ("GENERATE NON-DETERMINISTIC SINGLE-USE HANDOVER TOKEN", "Execute cryptographic entropy generation to synthesize unique 8-character single-use token from UUID_v4 entropy source. Token is hashed and registered in database.", False, False),
        ("RENDER & AFFIX 2D OPTICAL MACHINE-READABLE CODE", "Generate high-density 2D optical barcode (QR code) encoding handover token. Affix physical label directly to food container package.", False, False),
        ("VOLUNTEER ARRIVAL AT PHYSICAL RECIPIENT SHELTER", "Volunteer transports sealed container to destination NGO receiving depot.", False, False),
        ("OPTICAL SCAN & HANDOVER TOKEN INGESTION", "Volunteer scans container optical code or enters alphanumeric string via mobile terminal.", False, False),
        ("DECISION: ZERO-TRUST CRYPTOGRAPHIC STRING MATCH?", "Evaluate exact string match between captured handover token and secured database token.", True, False),
        ("EXECUTE ZERO-TRUST VERIFICATION BARRIER", "Token Mismatch: Deny status transition. Lock delivery state. Log security exception in audit log.\nToken Match Verified: Authorize state transition to DELIVERED status. Commit immutable delivery timestamp.", False, False),
        ("COMPUTE IPCC AR6 MULTI-GAS ENVIRONMENTAL NEXUS", "Compute audited environmental offsets based on confirmed physical mass:\n1. Avoided CO2e Emissions = Confirmed Mass * 2.50 kg CO2e/kg\n2. Conserved Virtual Water = Confirmed Mass * 1800 Liters/kg\n3. Landfill Methane Mitigation = Confirmed Mass * 0.06 kg CH4/kg * 28 (IPCC AR6 100-yr GWP factor)\n4. Physical Equivalencies: Cars Negated (CO2e*4.1 km), Trees Planted (CO2e/22), Clean Energy (CO2e*12h).", False, False),
        ("CONSTRUCT CANONICAL LEDGER TRANSACTION STRING", "Synthesize unalterable byte array payload:\nPayload = 'EVS-LEDGER-V1|' + Donor_ID + '|' + Cert_Code + '|' + CO2e_Avoided + '|' + Water_Saved + '|' + Timestamp.", False, False),
        ("GENERATE 256-BIT CRYPTOGRAPHIC MESSAGE DIGEST", "Execute FIPS 180-4 Secure Hash Algorithm 256 over canonical byte payload to produce deterministic, collision-resistant 64-character hexadecimal digest.", False, False),
        ("PERSIST IMMUTABLE LEDGER RECORD & ISSUE CERTIFICATE", "Persist cryptographic hash to audit table. Issue verified CSR Environmental Certificate with embedded hash. Expose public REST verification endpoint (/verify-hash/{Hash}). Update Corporate ESG Leaderboard ranking.", False, False),
        ("END: TRANSACTION VERIFICATION COMPLETE", "Cryptographically sealed environmental offset transaction finalized.", False, True)
    ]
    
    t_f6 = doc.add_table(rows=len(f6_rows)*2 - 1, cols=1)
    t_f6.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_f6.columns[0].width = Inches(7.1)
    
    r_idx = 0
    for i, (title, desc, is_dec, is_term) in enumerate(f6_rows):
        create_bw_flow_box(t_f6, r_idx, 0, title, desc, is_decision=is_dec, is_terminal=is_term)
        r_idx += 1
        if i < len(f6_rows) - 1:
            add_arrow_row(t_f6, r_idx, arrow_text="▼")
            r_idx += 1
            
    add_styled_paragraph(doc, "Technical Description of FIG. 6:", font_size=9.5, bold=True, color_rgb=(0, 0, 0), space_before=3, space_after=1)
    add_styled_paragraph(doc, "FIG. 6 depicts the cryptographic verification subsystem. Requiring physical scanning of a single-use non-deterministic token establishes a zero-trust custody gate, eliminating phantom deliveries. Committing the multi-gas environmental nexus to a SHA-256 hash digest guarantees data immutability, preventing carbon offset double-counting and greenwashing.", font_size=8.5, color_rgb=(0, 0, 0), line_spacing=1.05)

    # Save document
    output_filename = "EcoShare_AI_Patent_Architecture_Flowcharts.docx"
    output_path = os.path.join("c:/Users/Asus/Downloads/evs", output_filename)
    doc.save(output_path)
    print(f"Monochrome Black-and-White Patent document successfully created: {output_path}")

if __name__ == "__main__":
    build_patent_document()
