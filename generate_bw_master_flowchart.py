import os
import math
from PIL import Image, ImageDraw, ImageFont
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

# ----------------------------------------------------------------------
# 1. CANVAS CONFIGURATION (Strictly Black & White Patent Style)
# ----------------------------------------------------------------------
WIDTH = 2600
HEIGHT = 2460
BG_COLOR = (255, 255, 255) # Pure White

FONT_REGULAR_PATH = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/segoeuib.ttf"
FONT_SEMIBOLD_PATH = "C:/Windows/Fonts/seguisb.ttf"
FONT_ITALIC_PATH = "C:/Windows/Fonts/segoeuii.ttf"

font_sheet_hdr = ImageFont.truetype(FONT_BOLD_PATH, 32)
font_title = ImageFont.truetype(FONT_BOLD_PATH, 36)
font_subtitle = ImageFont.truetype(FONT_ITALIC_PATH, 20)
font_col_hdr = ImageFont.truetype(FONT_BOLD_PATH, 22)
font_box_title = ImageFont.truetype(FONT_BOLD_PATH, 19)
font_box_text = ImageFont.truetype(FONT_REGULAR_PATH, 15)
font_badge = ImageFont.truetype(FONT_BOLD_PATH, 16)
font_decision_text = ImageFont.truetype(FONT_BOLD_PATH, 17)
font_terminal = ImageFont.truetype(FONT_BOLD_PATH, 18)

C_BLACK = (0, 0, 0)
C_WHITE = (255, 255, 255)
C_GRAY_LIGHT = (242, 242, 242)
C_GRAY_BORDER = (180, 180, 180)

# ----------------------------------------------------------------------
# 2. DRAWING PRIMITIVES (High Contrast Patent Grade)
# ----------------------------------------------------------------------
def draw_process_box(draw, cx, cy, w, h, title, lines):
    x0 = cx - w // 2
    y0 = cy - h // 2
    x1 = cx + w // 2
    y1 = cy + h // 2
    
    # White fill, solid black 3px border
    draw.rectangle([x0, y0, x1, y1], fill=C_WHITE, outline=C_BLACK, width=3)
    
    content_y = y0 + 10
    bbox_t = draw.textbbox((0, 0), title, font=font_box_title)
    tw = bbox_t[2] - bbox_t[0]
    draw.text((cx - tw // 2, content_y), title, font=font_box_title, fill=C_BLACK)
    content_y += (bbox_t[3] - bbox_t[1]) + 6
    
    # Thin divider line
    draw.line([(x0 + 15, content_y), (x1 - 15, content_y)], fill=C_BLACK, width=1)
    content_y += 6
    
    for line in lines:
        bbox_l = draw.textbbox((0, 0), line, font=font_box_text)
        lw = bbox_l[2] - bbox_l[0]
        draw.text((cx - lw // 2, content_y), line, font=font_box_text, fill=C_BLACK)
        content_y += (bbox_l[3] - bbox_l[1]) + 3

def draw_decision_diamond(draw, cx, cy, w, h, question_lines):
    pts = [
        (cx, cy - h // 2),
        (cx + w // 2, cy),
        (cx, cy + h // 2),
        (cx - w // 2, cy)
    ]
    draw.polygon(pts, fill=C_WHITE, outline=C_BLACK)
    for i in range(len(pts)):
        draw.line([pts[i], pts[(i + 1) % len(pts)]], fill=C_BLACK, width=4)
        
    total_h = 0
    line_bboxes = []
    for l in question_lines:
        bbox = draw.textbbox((0, 0), l, font=font_decision_text)
        line_bboxes.append((bbox[2] - bbox[0], bbox[3] - bbox[1]))
        total_h += (bbox[3] - bbox[1]) + 3
    total_h -= 3
    
    sy = cy - total_h // 2
    for idx, l in enumerate(question_lines):
        lw, lh = line_bboxes[idx]
        draw.text((cx - lw // 2, sy), l, font=font_decision_text, fill=C_BLACK)
        sy += lh + 3

def draw_terminal_pill(draw, cx, cy, w, h, title, is_double=False):
    x0 = cx - w // 2
    y0 = cy - h // 2
    x1 = cx + w // 2
    y1 = cy + h // 2
    r = h // 2
    draw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=C_GRAY_LIGHT, outline=C_BLACK, width=4)
    if is_double:
        draw.rounded_rectangle([x0+4, y0+4, x1-4, y1-4], radius=r-4, fill=C_GRAY_LIGHT, outline=C_BLACK, width=2)
    
    bbox_t = draw.textbbox((0, 0), title, font=font_terminal)
    tw = bbox_t[2] - bbox_t[0]
    th = bbox_t[3] - bbox_t[1]
    draw.text((cx - tw // 2, cy - th // 2 - 1), title, font=font_terminal, fill=C_BLACK)

def draw_arrow(draw, start, end, width=3, arrow_len=14):
    x0, y0 = start
    x1, y1 = end
    draw.line([(x0, y0), (x1, y1)], fill=C_BLACK, width=width)
    dx = x1 - x0
    dy = y1 - y0
    angle = math.atan2(dy, dx)
    p1 = (x1 - arrow_len * math.cos(angle - math.pi / 6),
          y1 - arrow_len * math.sin(angle - math.pi / 6))
    p2 = (x1 - arrow_len * math.cos(angle + math.pi / 6),
          y1 - arrow_len * math.sin(angle + math.pi / 6))
    draw.polygon([(x1, y1), p1, p2], fill=C_BLACK)

def draw_polyline_arrow(draw, pts, width=3, arrow_len=14):
    for i in range(len(pts) - 1):
        if i == len(pts) - 2:
            draw_arrow(draw, pts[i], pts[i + 1], width=width, arrow_len=arrow_len)
        else:
            draw.line([pts[i], pts[i + 1]], fill=C_BLACK, width=width)

def draw_badge(draw, cx, cy, text):
    bbox = draw.textbbox((0, 0), text, font=font_badge)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    bw = tw + 14
    bh = th + 8
    draw.rectangle([cx - bw // 2, cy - bh // 2, cx + bw // 2, cy + bh // 2], fill=C_WHITE, outline=C_BLACK, width=2)
    draw.text((cx - tw // 2, cy - th // 2 - 1), text, font=font_badge, fill=C_BLACK)

# ----------------------------------------------------------------------
# 3. GENERATE B&W MASTER IMAGE
# ----------------------------------------------------------------------
def generate_bw_master_image(output_path):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # ------------------ TOP PATENT HEADER ------------------
    # Outer formal drawing frame
    draw.rectangle([20, 20, WIDTH - 20, HEIGHT - 20], outline=C_BLACK, width=3)
    draw.line([(20, 115), (WIDTH - 20, 115)], fill=C_BLACK, width=2)

    # Sheet numbers & Figure title
    draw.text((45, 38), "FIG. 1", font=font_sheet_hdr, fill=C_BLACK)
    draw.text((WIDTH - 240, 38), "SHEET 1 OF 1", font=font_sheet_hdr, fill=C_BLACK)
    
    t_text = "ECOSHARE AI: UNIFIED CYBER-PHYSICAL MASTER DECISION ARCHITECTURE"
    bbox_t = draw.textbbox((0, 0), t_text, font=font_title)
    draw.text(((WIDTH - (bbox_t[2] - bbox_t[0])) // 2, 35), t_text, font=font_title, fill=C_BLACK)
    
    s_text = "Complete End-to-End Decision Framework: Volumetric CV Estimation, Freshness Decay Kinetics, CVRP Fleet Logistics, and Cryptographic SHA-256 Ledger"
    bbox_s = draw.textbbox((0, 0), s_text, font=font_subtitle)
    draw.text(((WIDTH - (bbox_s[2] - bbox_s[0])) // 2, 80), s_text, font=font_subtitle, fill=C_BLACK)

    # Column Centers and Dimensions
    COL1_X = 660
    COL2_X = 1940
    COL_W = 1140

    # Center Divider (Dashed / Thin)
    for y in range(125, HEIGHT - 40, 20):
        draw.line([(WIDTH // 2, y), (WIDTH // 2, y + 10)], fill=(160, 160, 160), width=2)

    # ==================================================================
    # COLUMN 1 (LEFT): INTAKE, VOLUMETRIC CV & FRESHNESS KINETICS
    # ==================================================================
    # Column 1 Header Banner
    draw.rectangle([90, 135, 1230, 175], fill=C_BLACK)
    c1_title = "PHASE I & II: DONOR INTAKE, VOLUMETRIC CV & FRESHNESS KINETICS"
    bbox_c1 = draw.textbbox((0, 0), c1_title, font=font_col_hdr)
    draw.text((COL1_X - (bbox_c1[2] - bbox_c1[0]) // 2, 143), c1_title, font=font_col_hdr, fill=C_WHITE)

    # Node 0: START
    draw_terminal_pill(draw, COL1_X, 220, 680, 50, "START: Food Donor Initiates Redistribution Telemetry")
    draw_arrow(draw, (COL1_X, 245), (COL1_X, 275))

    # Node 1: Ingest
    draw_process_box(draw, COL1_X, 330, COL_W, 85,
                     "1. Ingest Food Batch Telemetry & Multi-View Photography",
                     ["• Ingests Food Category (12 Types), Timestamp of Preparation, Geolocation Coordinates (Lat/Lng), Packaging Type",
                      "• Ingests Dual Orthogonal Digital Images (Top Surface View & Side Profile Fill Perspective)"])
    draw_arrow(draw, (COL1_X, 373), (COL1_X, 405))

    # Decision D1: Auth
    draw_decision_diamond(draw, COL1_X, 465, 720, 95, [
        "Decision D1: Is Donor Profile Registered",
        "& JWT Session Authenticated?"
    ])
    # D1 -> NO
    draw_polyline_arrow(draw, [(COL1_X + 360, 465), (1140, 465)])
    draw_badge(draw, 1070, 445, "NO")
    draw_process_box(draw, 1150, 465, 140, 65, "1B. Issue JWT", ["• Issue 24h HMAC", "• Context: DONOR"])
    draw_polyline_arrow(draw, [(1150, 432), (1150, 330), (COL1_X + 570, 330)])

    # D1 -> YES
    draw_arrow(draw, (COL1_X, 513), (COL1_X, 555))
    draw_badge(draw, COL1_X + 45, 532, "YES")

    # Node 2: Computer Vision
    draw_process_box(draw, COL1_X, 610, COL_W, 85,
                     "2. Volumetric Computer Vision & Orthogonal Surface Geometry Extraction",
                     ["• Analyze top surface boundary perimeter to calculate effective horizontal container area",
                      "• Analyze side-view profile to compute fluid / food fill percentage height (F_eff %)"])
    draw_arrow(draw, (COL1_X, 653), (COL1_X, 685))

    # Decision D2: Container Calibration
    draw_decision_diamond(draw, COL1_X, 745, 740, 95, [
        "Decision D2: Standard Calibrated Catering",
        "Receptacle Identified? (5L, 10L, 20L, 50L)"
    ])
    # D2 -> YES
    draw_polyline_arrow(draw, [(COL1_X - 370, 745), (400, 745), (400, 805)])
    draw_badge(draw, 400, 725, "YES (CALIBRATED)")
    draw_process_box(draw, 400, 850, 520, 75,
                     "2A. Standard Volume Matrix Lookup",
                     ["• V_eff = V_container × (Fill% / 100) (5L-50L)",
                      "• +5% Confidence (89%), Uncertainty: ±8%"])

    # D2 -> NO
    draw_polyline_arrow(draw, [(COL1_X + 370, 745), (920, 745), (920, 805)])
    draw_badge(draw, 920, 725, "NO (CUSTOM / HEURISTIC)")
    draw_process_box(draw, 920, 850, 520, 75,
                     "2B. Custom Geometry Approximation",
                     ["• Monocular Depth & Fill-Level Bounding Volume",
                      "• Baseline 82% Confidence, Uncertainty: ±12%"])

    # Converge into Node 3
    draw_polyline_arrow(draw, [(400, 888), (400, 920), (COL1_X - 150, 920), (COL1_X - 150, 945)])
    draw_polyline_arrow(draw, [(920, 888), (920, 920), (COL1_X + 150, 920), (COL1_X + 150, 945)])

    # Node 3: Density Physics
    draw_process_box(draw, COL1_X, 995, COL_W, 85,
                     "3. 12-Category Food Bulk Density Physics Transformation",
                     ["• Physical Mass: M = V_eff × ρ (kg) | Bulk Density ρ: Rice (0.80), Curry (0.95), Dairy (1.03), Bakery (0.35)",
                      "• Portion Yield Calculation: Servings S = M / (Grams_per_serving / 1000) (100g - 250g/portion)"])
    draw_arrow(draw, (COL1_X, 1038), (COL1_X, 1070))

    # Node 4: Freshness Decay
    draw_process_box(draw, COL1_X, 1120, COL_W, 80,
                     "4. Dynamic Perishability Modeling & Safe Shelf-Life Decay Query",
                     ["• Safe Shelf-Life Window: T_shelf (4h Dairy/Mixed -> 168h Packaged) | Elapsed Time: Δt = now() - t_prepared",
                      "• Safe Distribution Horizon: t_rem = max(0, T_shelf - Δt)"])
    draw_arrow(draw, (COL1_X, 1160), (COL1_X, 1195))

    # Decision D3: Freshness Safety Check
    draw_decision_diamond(draw, COL1_X, 1255, 760, 95, [
        "Decision D3: Critical Freshness Safety Check:",
        "Is Food Safe for Human Consumption? (t_rem > 0)"
    ])
    # D3 -> NO (Biohazard diversion)
    draw_polyline_arrow(draw, [(COL1_X - 380, 1255), (380, 1255), (380, 1315)])
    draw_badge(draw, 380, 1235, "NO (SPOILED / HAZARD)")
    draw_process_box(draw, 380, 1360, 520, 75,
                     "4B. BIO-HAZARD SAFETY SHUTOFF",
                     ["• Quarantine batch: Lock status to BIO_DIVERTED",
                      "• Permanent human consumption embargo"])
    draw_arrow(draw, (380, 1398), (380, 1435))
    draw_process_box(draw, 380, 1480, 520, 75,
                     "4C. Municipal Composting / Biogas Depot",
                     ["• Divert to authorized anaerobic bio-digester",
                      "• Credit Methane Avoidance: IPCC AR6 GWP 28×"])
    draw_arrow(draw, (380, 1518), (380, 1555))
    draw_terminal_pill(draw, 380, 1580, 500, 45, "TERMINAL: Safe Ecological Diversion Complete", is_double=True)

    # D3 -> YES (Fresh & Safe)
    draw_polyline_arrow(draw, [(COL1_X, 1303), (COL1_X, 1640), (COL1_X, 1685)])
    draw_badge(draw, COL1_X + 75, 1340, "YES (SAFE)")

    # Node 5: Priority Urgency
    draw_process_box(draw, COL1_X, 1740, COL_W, 85,
                     "5. Tri-Factor Priority Urgency Scoring Optimization",
                     ["• Quantity Factor (30%): S_qty | Freshness Urgency (50%): S_fresh | Elapsed Time Factor (20%): S_time",
                      "• Composite Urgency Score: P = (0.30·S_qty) + (0.50·S_fresh) + (0.20·S_time)  [Range: 0 - 100]"])
    draw_arrow(draw, (COL1_X, 1783), (COL1_X, 1815))

    # Decision D4: Urgency Tier
    draw_decision_diamond(draw, COL1_X, 1875, 760, 95, [
        "Decision D4: High-Priority Dispatch Classification:",
        "Score P >= 75 OR Remaining Safe Window t_rem <= 2h?"
    ])
    # D4 -> YES
    draw_polyline_arrow(draw, [(COL1_X - 380, 1875), (400, 1875), (400, 1935)])
    draw_badge(draw, 400, 1855, "YES (CRITICAL)")
    draw_process_box(draw, 400, 1980, 520, 75,
                     "5A. EMERGENCY PRIORITY DISPATCH",
                     ["• Real-time WebPush / SMS broadcast to shelters",
                      "• Strict 10-minute acceptance SLA window"])

    # D4 -> NO
    draw_polyline_arrow(draw, [(COL1_X + 380, 1875), (920, 1875), (920, 1935)])
    draw_badge(draw, 920, 1855, "NO (STANDARD)")
    draw_process_box(draw, 920, 1980, 520, 75,
                     "5B. STANDARD REGIONAL DISPATCH QUEUE",
                     ["• Enqueued in local cluster redistribution pool",
                      "• Standard pickup route consolidation scheduling"])

    # Merge D4 branches into Inter-Stage Collector
    draw_polyline_arrow(draw, [(400, 2018), (400, 2060), (COL1_X - 150, 2060), (COL1_X - 150, 2085)])
    draw_polyline_arrow(draw, [(920, 2018), (920, 2060), (COL1_X + 150, 2060), (COL1_X + 150, 2085)])

    # Inter-Stage Transfer Box
    draw_process_box(draw, COL1_X, 2135, COL_W, 70,
                     "SURPLUS ALLOCATION TRANSFER: Validated Batch Ready for Logistics & Delivery",
                     ["• Donation Status: VALIDATED | Batch Registered with Dynamic Urgency Priority & Geolocation Coordinates"])

    # Cross-Column Connector Arrow (Bridge across central gutter)
    draw_polyline_arrow(draw, [(COL1_X + 570, 2135), (WIDTH // 2, 2135), (WIDTH // 2, 220), (COL2_X - 570, 220)], width=4)
    draw_badge(draw, WIDTH // 2, 1150, "TRANSFER TO LOGISTICS CORE")

    # ==================================================================
    # COLUMN 2 (RIGHT): DEMAND MATCHING, CVRP LOGISTICS & LEDGER
    # ==================================================================
    # Column 2 Header Banner
    draw.rectangle([1370, 135, 2510, 175], fill=C_BLACK)
    c2_title = "PHASE III, IV & V: DEMAND MATCHING, CVRP LOGISTICS & CRYPTOGRAPHIC LEDGER"
    bbox_c2 = draw.textbbox((0, 0), c2_title, font=font_col_hdr)
    draw.text((COL2_X - (bbox_c2[2] - bbox_c2[0]) // 2, 143), c2_title, font=font_col_hdr, fill=C_WHITE)

    # Node 6: Demand Forecasting
    draw_process_box(draw, COL2_X, 225, COL_W, 80,
                     "6. Proactive Time-Series Shelter Deficit & Demand Forecasting",
                     ["• Projected Deficit = Bed_Capacity × 2.20 × Day_of_Week_Trend × Festival_Multiplier",
                      "• Cluster urban feeding corridors & pre-empt supply shortages hours before commercial waste occurs"])
    draw_arrow(draw, (COL2_X, 265), (COL2_X, 295))

    # Node 7: NGO Ranking
    draw_process_box(draw, COL2_X, 345, COL_W, 80,
                     "7. Multi-Criteria NGO Allocation & Haversine Proximity Ranking",
                     ["• All-Pairs Haversine Distance: D = 2R·arcsin(sqrt(...)) | Compatibility Score: S_ngo = 0.40/Dist + 0.35·Cap + 0.25·Speed",
                      "• Transmit automated targeted donation invitation to Top-Ranked Candidate Shelter Depot"])
    draw_arrow(draw, (COL2_X, 385), (COL2_X, 415))

    # Decision D5: NGO Acceptance
    draw_decision_diamond(draw, COL2_X, 475, 740, 95, [
        "Decision D5: Does Primary Candidate NGO Accept",
        "Within Prescribed Response SLA Window? (15 min)"
    ])
    # D5 -> NO
    draw_polyline_arrow(draw, [(COL2_X + 370, 475), (2410, 475)])
    draw_badge(draw, 2350, 455, "NO (SLA EXPIRED)")
    draw_process_box(draw, 2420, 475, 140, 65, "7B. Cascade", ["• Pop Rank-1 NGO", "• Cascade Rank-2"])
    draw_polyline_arrow(draw, [(2420, 442), (2420, 345), (COL2_X + 570, 345)])

    # D5 -> YES
    draw_arrow(draw, (COL2_X, 523), (COL2_X, 560))
    draw_badge(draw, COL2_X + 45, 542, "YES")

    # Node 8: Lock Reservation
    draw_process_box(draw, COL2_X, 605, COL_W, 75,
                     "8. Lock NGO Reservation (ACCEPTED) & Assign Capable Volunteer Fleet",
                     ["• Update Donation Status: ACCEPTED | Query available volunteers matching vehicle payload capacity & proximity",
                      "• Update Pickup Record: Status = ASSIGNED | Designate Volunteer_Id"])
    draw_arrow(draw, (COL2_X, 643), (COL2_X, 675))

    # Node 9: CVRP Solver
    draw_process_box(draw, COL2_X, 725, COL_W, 80,
                     "9. Multi-Stop CVRP Logistics Optimization (Nearest-Neighbor Heuristic)",
                     ["• Assemble candidate pickup and dropoff nodes | Compute all-pairs distance matrix",
                      "• Solve vehicle route trajectory subject to strict topological precedence (pickup before dropoff)"])
    draw_arrow(draw, (COL2_X, 765), (COL2_X, 800))

    # Decision D6: Payload Feasibility
    draw_decision_diamond(draw, COL2_X, 860, 750, 95, [
        "Decision D6: Gross Vehicle Payload Limit Exceeded?",
        "(Vehicle Current Load + Batch Mass > C_max?)"
    ])
    # D6 -> YES
    draw_polyline_arrow(draw, [(COL2_X - 375, 860), (1670, 860), (1670, 920)])
    draw_badge(draw, 1670, 840, "YES (OVERFLOW)")
    draw_process_box(draw, 1670, 965, 520, 75,
                     "9A. CAPACITY OVERFLOW SPLIT RESOLUTION",
                     ["• Insert mandatory intermediate shelter depot dropoff",
                      "• Bifurcate tour: Leg 1 (Dropoff) -> Leg 2 (Pickup)"])

    # D6 -> NO
    draw_polyline_arrow(draw, [(COL2_X + 375, 860), (2210, 860), (2210, 920)])
    draw_badge(draw, 2210, 840, "NO (CAPACITY SATISFIED)")
    draw_process_box(draw, 2210, 965, 520, 75,
                     "9B. CONSOLIDATED CONTINUOUS LOGISTICS ROUTE",
                     ["• Consolidate multi-batch pickups into single tour",
                      "• Saves 28.5% travel distance, fuel & CO2e emissions"])

    # Merge D6 into Node 10
    draw_polyline_arrow(draw, [(1670, 1003), (1670, 1040), (COL2_X - 150, 1040), (COL2_X - 150, 1065)])
    draw_polyline_arrow(draw, [(2210, 1003), (2210, 1040), (COL2_X + 150, 1040), (COL2_X + 150, 1065)])

    # Node 10: Manifest & QR Token
    draw_process_box(draw, COL2_X, 1115, COL_W, 85,
                     "10. Dispatch Turn-by-Turn Manifest & Generate Non-Deterministic QR Handshake Token",
                     ["• Transmit optimized route waypoints to volunteer navigation client | Model fuel savings (0.12 L/km)",
                      "• Generate single-use cryptographic token: τ = randomUUID().substring(0,8) | Render 2D QR Code on Donor App"])
    draw_arrow(draw, (COL2_X, 1158), (COL2_X, 1195))

    # Node 11: Origin Handover
    draw_process_box(draw, COL2_X, 1245, COL_W, 80,
                     "11. Origin Physical Custody Transfer & Optical Token Scan",
                     ["• Volunteer performs visual food inspection & scans donor's optical QR token",
                      "• Transition State: Donation Status = PICKED_UP | Real-time GPS transit tracking active"])
    draw_arrow(draw, (COL2_X, 1285), (COL2_X, 1320))

    # Node 12: Destination Check-in
    draw_process_box(draw, COL2_X, 1370, COL_W, 80,
                     "12. Destination Shelter Depot Arrival & Physical Scale Check-in",
                     ["• Consignment placed on calibrated digital scale to record physical mass: M_actual (kg)",
                      "• Receiving shelter staff scans physical container QR token to ingest proof: τ_scan"])
    draw_arrow(draw, (COL2_X, 1410), (COL2_X, 1445))

    # Decision D7: Zero-Trust Token Verification
    draw_decision_diamond(draw, COL2_X, 1510, 760, 100, [
        "Decision D7: Zero-Trust Handshake Authentication:",
        "Does Scanned Token Match Database? (τ_scan == τ_stored)"
    ])
    # D7 -> NO
    draw_polyline_arrow(draw, [(COL2_X + 380, 1510), (2240, 1510), (2240, 1575)])
    draw_badge(draw, 2240, 1490, "NO (MISMATCH / TAMPER)")
    draw_process_box(draw, 2240, 1620, 440, 75,
                     "12B. ZERO-TRUST FRAUD LOCKOUT",
                     ["• Reject handover; freeze state transition",
                      "• Flag security audit breach incident to admin"])
    draw_arrow(draw, (2240, 1658), (2240, 1695))
    draw_terminal_pill(draw, 2240, 1720, 420, 45, "TERMINAL: Custody Breach Incident Logged", is_double=True)

    # D7 -> YES
    draw_polyline_arrow(draw, [(COL2_X, 1560), (COL2_X, 1775), (COL2_X, 1815)])
    draw_badge(draw, COL2_X + 75, 1600, "YES (AUTHENTICATED)")

    # Node 13: Delivery & Closed-Loop MAPE
    draw_process_box(draw, COL2_X, 1865, COL_W, 85,
                     "13. Authorized Custody State DELIVERED & Closed-Loop AI Recalibration",
                     ["• Transition State: Donation Status = DELIVERED | Pickup Status = COMPLETED",
                      "• Compute Scale Estimation Error: ε = (|M_actual - M_est| / M_actual) × 100",
                      "• Feedback Loop: Dynamically update historical Mean Absolute Percentage Error (MAPE = 3.8%) for continuous AI learning"])
    draw_arrow(draw, (COL2_X, 1908), (COL2_X, 1940))

    # Node 14: IPCC Nexus & SHA-256 Ledger
    draw_process_box(draw, COL2_X, 1995, COL_W, 90,
                     "14. IPCC AR6 Multi-Gas Environmental Nexus & Immutable SHA-256 Ledger Commitment",
                     ["• Quantify Nexus: CO2e Avoided (1.9 kg/kg) | Water Saved (1400 L/kg) | Landfill Diverted (kg) | Meals (M / 0.5 kg)",
                      "• Canonical Serialization: \"EVS-LEDGER-V1|donationId|timestamp|donorId|ngoId|mass|co2e|water\"",
                      "• Compute 256-bit SHA-256 Hash Digest -> Persist Immutable Ledger Entry -> Expose Public REST Audit API"])
    draw_arrow(draw, (COL2_X, 2040), (COL2_X, 2085))

    # Final Terminal: SUCCESS
    draw_terminal_pill(draw, COL2_X, 2125, 960, 60,
                       "TERMINAL: Food Redistribution Completed, Verified & Ledger Committed", is_double=True)

    # Save Black and White Image
    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"B&W Master Flowchart generated successfully at {output_path}")

# ----------------------------------------------------------------------
# 4. GENERATE STRICTLY SINGLE-PAGE WORD DOCUMENT (.DOCX)
# ----------------------------------------------------------------------
def generate_single_page_docx(image_path, docx_path):
    doc = Document()
    
    # Strictly configure page margins and dimensions for exactly ONE page
    section = doc.sections[0]
    section.page_width = Inches(8.5)   # Standard Letter
    section.page_height = Inches(11.0)
    
    # Tight margins (0.28 inches) to maximize drawing clarity and guarantee 1 page
    section.top_margin = Inches(0.25)
    section.bottom_margin = Inches(0.25)
    section.left_margin = Inches(0.28)
    section.right_margin = Inches(0.28)
    
    # Remove header & footer spacing
    section.header.is_linked_to_previous = False
    section.footer.is_linked_to_previous = False
    
    # 1. Title Paragraph (Single compact line)
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    p_title.paragraph_format.line_spacing = 1.0
    r_title = p_title.add_run("FIG. 1: ECOSHARE AI — UNIFIED CYBER-PHYSICAL MASTER ARCHITECTURE FLOWCHART")
    r_title.font.name = "Segoe UI"
    r_title.font.size = Pt(9.5)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0, 0, 0)
    
    # 2. Flowchart Image (Precisely calculated to fit remaining printable area)
    # Available width: 8.5 - (2 * 0.28) = 7.94 inches
    # Available height: 11.0 - (2 * 0.25) - 0.5 (title & caption) = 10.0 inches
    # Image aspect ratio: 2460 / 2600 = 0.946
    # Width = 7.85 in -> Height = 7.85 * 0.946 = 7.43 inches
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(0)
    p_img.paragraph_format.space_after = Pt(2)
    p_img.paragraph_format.line_spacing = 1.0
    run_img = p_img.add_run()
    run_img.add_picture(image_path, width=Inches(7.88))
    
    # 3. Caption Paragraph (Single compact line at bottom)
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(1)
    p_cap.paragraph_format.space_after = Pt(0)
    p_cap.paragraph_format.line_spacing = 1.0
    r_cap = p_cap.add_run("SHEET 1 OF 1  |  PATENT DRAWING SPECIFICATION  |  ECOSHARE AI AUTONOMOUS REDISTRIBUTION PLATFORM")
    r_cap.font.name = "Segoe UI"
    r_cap.font.size = Pt(8.0)
    r_cap.font.bold = True
    r_cap.font.color.rgb = RGBColor(70, 70, 70)
    
    doc.save(docx_path)
    print(f"Strictly Single-Page Word Document generated successfully at {docx_path}")

if __name__ == "__main__":
    out_img = "c:/Users/Asus/Downloads/evs/ecoshare_master_flowchart_bw.png"
    out_docx = "c:/Users/Asus/Downloads/evs/EcoShare_AI_Master_Flowchart_SinglePage_BW.docx"
    generate_bw_master_image(out_img)
    generate_single_page_docx(out_img, out_docx)
