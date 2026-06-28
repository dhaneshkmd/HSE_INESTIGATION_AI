import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will fallback to high-quality simulated engine.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Global sample incidents database (stored in memory for persistent interactions during current run)
let incidents: any[] = [
  {
    id: "INC-2026-001",
    incidentNumber: "INC-2026-001",
    incidentTitle: "Refinery Gas Plant Electrical Flashover during MCC Panel Maintenance",
    date: "2026-06-15",
    time: "10:45 AM",
    location: "Process Area 3, MCC Room A",
    project: "Gas Train Expansion Project",
    businessUnit: "Downstream Operations",
    department: "Electrical Maintenance",
    contractor: "Petrofac EPC Team",
    reporter: "Sami Al-Husseini (HSE Lead)",
    investigator: "Marcus Vance (Lead Incident Investigator)",
    incidentClassification: "Lost Time Injury (LTI)",
    severity: "4",
    potentialSeverity: "5",
    eventType: "Electrical Incident",
    peopleInvolved: "2 Technicians injured, 1 Operator witness",
    equipmentAssets: "MCC Panel 3B-V01, Siemens 11kV Air Circuit Breaker",
    environmentalConditions: "Indoor air-conditioned MCC room, High humidity outside (84%), Temp 23C",
    permitNumber: "PTW-EL-2026-8902",
    jsaNumber: "JSA-EL-0921-A",
    loto: "Implemented but LOTO locks were placed on secondary breaker instead of primary isolation point.",
    simops: "Simultaneous piping testing ongoing in adjacent battery limit.",
    shift: "Day Shift (B Shift)",
    weather: "Clear / Sunny",
    workActivity: "Annual preventive cleaning and contact resistance check on 11kV ACB.",
    processUnit: "Sulphur Recovery Unit (SRU)",
    energySource: "11,000V AC Electrical Power, Residual Stored Spring Energy",
    immediateControls: "MCC Room evacuated, Emergency stop activated, Technical rescue summoned.",
    witnessStatements: "Technician A stated that he was told the circuit was isolated and tested dead by the operator. Operator stated he isolated Breaker 3A, not realizing Technicians were working on 3B. No verification test-before-touch was performed at the workspace.",
    status: "Investigating",
    riskRating: "High",
    
    // Analyzed outputs (pre-populated, can be regenerated via AI)
    fiveWhys: [
      "Technician suffered electrical flashover burns while testing contacts on MCC Panel 3B-V01.",
      "The MCC panel was live and energized at 11kV when the technician inserted the testing probe.",
      "LOTO was applied to Breaker 3A (secondary transformer) instead of Breaker 3B (active feed cabinet).",
      "The electrical isolation list had a nomenclature discrepancy, listing 'MCC-3B-Feed' as 'MCC-3A-Auxiliary'.",
      "No physical validation of 'Test-Before-Touch' was performed by the maintenance supervisor, and electrical drawings were out of date."
    ],
    fishbone: {
      people: [
        "Technician failed to verify isolation status independently before inserting probes.",
        "Supervisor signed off isolation permit without visiting the MCC panel personally.",
        "Operator was fatigued after working a double shift (14 hours) and misidentified breaker labels."
      ],
      equipment: [
        "Circuit breakers lacked standardized high-visibility physical labeling (labels were hand-written with felt pen).",
        "No interlock mechanism was functional to prevent panel opening when breaker was racked in."
      ],
      materials: [
        "Testing multi-meter used was not rated for 11kV CAT-IV, leading to terminal breakdown and short circuit.",
        "ARC flash suit worn was only Category 2 (8 cal/cm2) while incident zone required Category 4 (40 cal/cm2)."
      ],
      methods: [
        "Nomenclature confusion in the Single Line Diagrams (SLD) updated 3 years ago but not registered.",
        "The LOTO protocol did not mandate dual verification by an independent electrical authority."
      ],
      environment: [
        "MCC room noise level was high (82dB) from adjacent ventilation fan, hindering clear vocal confirmation during isolation.",
        "Dim lighting inside the rear cabinet of MCC Panel 3B made breaker isolation tags difficult to read."
      ],
      management: [
        "HSE audit 6 months ago flagged outdated SLDs, but correction action was delayed due to budget cycle.",
        "Contractor onboarding program did not include site-specific electrical safety layouts."
      ]
    },
    barrierAnalysis: {
      preventative: [
        { name: "Lockout Tagout (LOTO) Permit", status: "failed", description: "Breaker locked out was 3A instead of 3B due to schematic nomenclature error." },
        { name: "Live Electrical Verification (Test-Before-Touch)", status: "failed", description: "Not performed by crew; proceeded on verbal assurance." },
        { name: "Out-of-Service Isolation Tags", status: "weak", description: "Tags were attached but hung on the wrong rack handle, causing visual confusion." }
      ],
      mitigation: [
        { name: "Personal Protective Equipment (ARC Flash Suit)", status: "weak", description: "Technician wore Category 2 instead of Category 4; mitigated some burns but failed to prevent severe injuries." },
        { name: "Emergency Shutdown Buttons (ESD)", status: "active", description: "Co-worker triggered ESD within 4 seconds, cutting upstream power and preventing total panel ignition." },
        { name: "First Aid & Quick Emergency Response", status: "active", description: "On-site paramedics arrived with ARC burn kits in 6 minutes, administering crucial early treatment." }
      ]
    },
    swissCheese: [
      { layerName: "Engineering Interlocks", holeDescription: "Cabinet door door safety microswitch bypassed during previous troubleshooting.", status: "breached" },
      { layerName: "Permit to Work (PTW)", holeDescription: "PTW approved with outdated single-line diagram schematic attached.", status: "breached" },
      { layerName: "Physical LOTO Isolation", holeDescription: "Lock applied to the wrong breaker handle due to nomenclature mix-up.", status: "breached" },
      { layerName: "Test-Before-Touch (Verification)", holeDescription: "Technicians skipped meter verification because MCC room was hot and noisy.", status: "breached" },
      { layerName: "Arc Flash PPE Barrier", holeDescription: "Inadequate cal/cm2 rating, allowing thermal transfer to skin.", status: "breached" }
    ],
    humanFactors: [
      { factor: "Fatigue", level: "high", description: "Operator had slept only 4 hours due to overtime coverage, impacting visual focus.", recommendation: "Implement automated digital shift schedule controls to block consecutive double shifts." },
      { factor: "Situational Awareness", level: "high", description: "Team relied heavily on verbal assurance without looking at actual panel labels.", recommendation: "Mandate the 'Point-Shut-Lock-Check' visual inspection routine." },
      { factor: "Communication", level: "medium", description: "Contractor EPC team spoke English while Operator spoke Arabic, causing minor miscommunication during handovers.", recommendation: "Ensure bilingual supervisors are physically present during critical isolations." }
    ],
    rootCauses: {
      immediateCause: "Technician contacted high-voltage energized copper contacts with a testing probe, creating an electrical arc-flash bypass.",
      underlyingCause: "Inadequate isolation verification and failure to implement the mandatory test-before-touch protocol due to schedule pressure.",
      rootCause: "Outdated engineering drawings (Single Line Diagrams) and inconsistent electrical nomenclature management across active assets.",
      organizationalCause: "Inadequate audit closure follow-up and failure to align contractor safety standards with ADNOC/Aramco electrical safety procedures.",
      confidenceScore: 92,
      supportingEvidence: "Discrepancy in SLD found on technician's clipboard; LOTO locks physically found on Breaker 3A; Operator statement confirming confusion in the tag labels.",
      alternativeHypotheses: [
        "Transient overvoltage from the main grid occurred at the exact maintenance moment (Ruled out: grid logs show absolute stability).",
        "Insulation failure inside the ACB occurred spontaneously (Ruled out: carbon tracking starts exactly at the testing probe entrance point)."
      ],
      evidenceGaps: [
        "Calibration record for the testing multi-meter used is missing (believed destroyed in the flashover thermal blast).",
        "CCTV footage of MCC Room A has a 12-minute blind spot due to server backup schedule."
      ]
    },
    capa: [
      { id: "C-1", action: "Conduct full physical nomenclature audit of all MCC cabinets in Process Area 3 and label with high-visibility phenolic tags.", type: "Corrective", ownerRole: "Electrical Maintenance Manager", priority: "High", timeDays: 14, status: "Open" },
      { id: "C-2", action: "Update all digital and paper Single Line Diagrams (SLDs) for Gas Train Expansion, obtain certified engineering stamp.", type: "Corrective", ownerRole: "Lead Electrical Engineer", priority: "High", timeDays: 30, status: "Open" },
      { id: "C-3", action: "Retrain all electrical operators and contractors on 'Verification of Isolation' standards and mandatory multi-meter testing protocols.", type: "Preventive", ownerRole: "HSE Training Specialist", priority: "Medium", timeDays: 7, status: "Open" },
      { id: "C-4", action: "Replace current MCC cabinet doors with safety interlocked doors that physically prevent racking in breakers while panel is open.", type: "Preventive", ownerRole: "Engineering Project Manager", priority: "High", timeDays: 90, status: "Open" }
    ],
    qualityAssurance: {
      qualityScore: 88,
      missingEvidence: [
        "Multi-meter calibration log from the contractor asset registry.",
        "Signed toolbox talk sheet for the shift of June 15."
      ],
      contradictions: [
        "Operator claimed he was accompanied during isolation verification, but badge logs show he entered the MCC room alone."
      ],
      biasCheck: "High trust in supervisor's verbal log; recommended auditing physical entry logs to eliminate bias.",
      recommendation: "Acquire the contractor's internal safety logs and compare key times with process control computer sequences to solidify timing."
    }
  },
  {
    id: "INC-2026-002",
    incidentNumber: "INC-2026-002",
    incidentTitle: "Auxiliary Crane Boom Collapse during Marine Cargo Lifting Operations",
    date: "2026-06-20",
    time: "03:15 PM",
    location: "Offshore Platform Supply Vessel (PSV) Jetty A",
    project: "Offshore Gas Field Maintenance",
    businessUnit: "Marine Logistics",
    department: "Lifting Operations",
    contractor: "Chevron Crane Contractors",
    reporter: "Aris Thorne (Marine HSE Advisor)",
    investigator: "Marcus Vance (Lead Incident Investigator)",
    incidentClassification: "Property Damage",
    severity: "3",
    potentialSeverity: "4",
    eventType: "Lifting Operations Incident",
    peopleInvolved: "No injuries, Crane cabin damaged, Supply Vessel deck dented.",
    equipmentAssets: "Favelle Favco Offshore Crane, Rigging Slings",
    environmentalConditions: "Wind 24 knots, Sea State 3 (Moderate swells), Temp 34C",
    permitNumber: "PTW-MH-2026-119",
    jsaNumber: "JSA-LIFT-221",
    loto: "N/A",
    simops: "Marine bunkering (fueling) taking place simultaneously.",
    shift: "Day Shift",
    weather: "Gusty Winds, Sunny",
    workActivity: "Transferring a 14-tonne compressor skid from Supply Vessel to the Platform Jetty.",
    processUnit: "Offshore Platform Deck East",
    energySource: "Gravitational Potential, Hydraulic High Pressure",
    immediateControls: "Operations suspended, Jetty cordoned off, Hydraulic lines isolated.",
    witnessStatements: "Crane operator stated that he heard a sudden 'clack' sound before the boom began descending rapidly out of control. Rigger noted the vessel rolled unexpectedly due to a wave, causing the load to swing violently.",
    status: "Investigating",
    riskRating: "Medium",
    
    // Pre-analyzed outputs
    fiveWhys: [
      "Offshore Crane boom collapsed while lifting compressor skid.",
      "The primary hydraulic luffing cylinder suffered a catastrophic mechanical seal rupture.",
      "An unexpected heavy shock load was introduced when the supply vessel dropped in a wave trough while lifting.",
      "The dynamic amplification factor (DAF) exceeded the crane's derated sea-state limits.",
      "The lift was conducted during winds of 24 knots, exceeding the offshore platform's lift limit of 20 knots, and the sea-state calculations were not updated."
    ],
    fishbone: {
      people: [
        "Rigging supervisor ignored sea state visual alert on Jetty bulletin board.",
        "Operator failed to engage the emergency lock brake when the boom began drifting.",
        "Vessel captain did not stabilize thrusters against the incoming tide swells."
      ],
      equipment: [
        "Hydraulic seal was aged (14 months, recommended replacement is 12 months).",
        "Load Moment Indicator (LMI) was flashing calibration error warning but not disabled."
      ],
      materials: [
        "Hydraulic oil viscosity was low due to high ambient temperature (34C) and constant operation."
      ],
      methods: [
        "The lift checklist did not account for wave frequency matching crane natural resonance.",
        "No continuous sea state logging tool was integrated into the lift planning."
      ],
      environment: [
        "Violent sudden wind gust (29 knots recorded) during the critical mid-air lift phase.",
        "Jetty high tides caused high pitch and roll on the loading vessel."
      ],
      management: [
        "Platform superintendent pressured logistics to unload the cargo to avoid vessel charter demurrage ($45,000/day delay fee).",
        "Inspection frequency for marine cranes was delayed by 2 weeks due to resource constraints."
      ]
    },
    barrierAnalysis: {
      preventative: [
        { name: "Dynamic Lift Plan (DLP)", status: "failed", description: "DLP calculations based on onshore static load, neglected sea swells." },
        { name: "Wind-Speed Anemometer Alarms", status: "weak", description: "Alarm sounded but was muted by operator who deemed it a 'spurious warning'." },
        { name: "Hydraulic Cylinder Lock-Valves", status: "failed", description: "Lock valve failed due to high particulate contamination in hydraulic fluid." }
      ],
      mitigation: [
        { name: "Safety Cordon / Exclusion Zone", status: "active", description: "No personnel were allowed inside the drop zone; prevented casualties." },
        { name: "Crane Cab Protective Structure (FOPS)", status: "active", description: "FOPS protected the operator cabin when the lattice boom struck the control deck." },
        { name: "Supply Vessel Reinforced Decking", status: "active", description: "Vessel wood-sheathed steel deck absorbed crane tip impact, preventing hull breach." }
      ]
    },
    swissCheese: [
      { layerName: "Wind Limit Policies", holeDescription: "Operation continued despite sustained winds exceeding 20-knot safety threshold.", status: "breached" },
      { layerName: "Load Moment Indicator (LMI)", holeDescription: "System alert bypassed by operator using key-switch override.", status: "breached" },
      { layerName: "Hydraulic Seal Inspection", holeDescription: "Preventive maintenance overdue by 2 months.", status: "breached" },
      { layerName: "Exclusion Zone Enforcement", holeDescription: "Successfully kept personnel out of high-risk swing sector.", status: "intact" }
    ],
    humanFactors: [
      { factor: "Workload Pressure", level: "high", description: "Commercial pressure to release vessel quickly led to hasty lift decisions.", recommendation: "Implement a commercial safety firewall where HSE managers have absolute authority to stop work without penalty." },
      { factor: "Distraction", level: "medium", description: "Operator was handling multiple radio channels during cargo handover.", recommendation: "Standardize dedicated single-channel radio communication protocols during active lifting." }
    ],
    rootCauses: {
      immediateCause: "Catastrophic mechanical failure of the hydraulic luffing system caused by dynamic shock load overload.",
      underlyingCause: "Lifting operations performed during environmental sea state conditions exceeding platform and crane design envelopes.",
      rootCause: "Operational schedule pressure prioritized over HSE risk thresholds, combined with systemic hydraulic maintenance backlog.",
      organizationalCause: "Inadequate enforcement of the STOP WORK authority policy and crane safety system bypass authorizations.",
      confidenceScore: 85,
      supportingEvidence: "Hydraulic fluid analysis showing heavy metallic shaving contamination; Operator log showing LMI bypass; Demurrage warnings found in email communications.",
      alternativeHypotheses: [
        "Sabotage or structural rigging cuts (Ruled out: slings remained fully intact).",
        "Inherent structural steel crack in crane boom (Ruled out: failure occurred in cylinder, not the steel lattice structure)."
      ],
      evidenceGaps: [
        "Vessel pitch/roll digital logs were not recorded because the telemetry box battery was dead."
      ]
    },
    capa: [
      { id: "C-11", action: "Perform complete overhaul of marine crane hydraulic systems and replace luffing cylinder safety valves.", type: "Corrective", ownerRole: "Maintenance Engineer", priority: "High", timeDays: 14, status: "Open" },
      { id: "C-12", action: "Establish a mandatory digital marine weather and tide clearance procedure before permitting complex offshore crane transfers.", type: "Preventive", ownerRole: "Port Captain / Logistics Lead", priority: "Medium", timeDays: 7, status: "Open" },
      { id: "C-13", action: "Update lift planner certifications to include specific Offshore Dynamic Lift criteria and Sea-State factors.", type: "Preventive", ownerRole: "HSE Training Specialist", priority: "Medium", timeDays: 30, status: "Open" }
    ],
    qualityAssurance: {
      qualityScore: 92,
      missingEvidence: [
        "Vessel roll telemetry log.",
        "Hydraulic fluid laboratory reports."
      ],
      contradictions: [
        "Rigging supervisor claimed sea state was safe, while vessel log notes heavy swells exceeding 2.2m."
      ],
      biasCheck: "HSE supervisor is contractor-employed and may have downplayed pressure from Logistics Manager.",
      recommendation: "Ensure an independent platform marine specialist audits the crane load calculation model."
    }
  }
];

// NVIDIA Nemotron AI API Proxy and 5 HSE Intelligent Features Configuration
const MASTER_SYSTEM_PROMPT = `You are a Senior HSE Investigator and Subject Matter Expert with 20+ years of experience in Oil & Gas, EPC construction, shutdown operations, and petrochemical industries across the GCC region. 
You are certified in NEBOSH, ISO 45001 Lead Auditor, and trained in ICAM (Incident Cause Analysis Method), TapRoot, Bow-Tie Analysis, Loss Causation Model, and Fault Tree Analysis. 
You follow ADNOC HSEMS, ARAMCO General Instructions, Shell HSSE standards, and international best practices. 
Your responses are professional, structured, factual, and legally defensible. Always use clear headings, bullet points, and numbered lists for easy reading.`;

// In-memory rate limiting store: Map<IP, timestamp[]>
const rateLimits = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  
  let requests = rateLimits.get(ip) || [];
  // Filter out requests older than 1 hour
  requests = requests.filter(ts => ts > oneHourAgo);
  
  if (requests.length >= 20) {
    return false;
  }
  
  requests.push(now);
  rateLimits.set(ip, requests);
  return true;
}

// Simple input sanitization function
function sanitizeInput(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
}

// HIGH-QUALITY SIMULATION FALLBACK ENGINE FOR NVIDIA API
function getSimulatedOutput(feature: string, promptText: string, extraData?: any): string {
  const lowercasePrompt = promptText.toLowerCase();
  
  if (feature === "parser") {
    return `### 1. 📋 INCIDENT SUMMARY
- **What happened**: High-pressure air coupling separated catastrophically during pipe cleaning, causing a hose to whip and strike a scaffolding assembly.
- **Incident type**: Near Miss / Property Damage
- **Date and time**: 2026-06-27 at 09:15 AM
- **Location / work area**: Gas Train Substation 4, East Battery Limits
- **Project / facility name**: Gulf Petrochemicals Expansion Phase II

### 2. 👷 PERSONS INVOLVED
- **Names, designations, employer**: Ahmed Al-Mansoori (Blasting Technician, Al-Masaood Contracting), Rajesh Kumar (Site Supervisor, Petrofac)
- **Injured person details**: No severe injuries. Ahmed Al-Mansoori received a minor abrasion on his left hand.
- **Witnesses identified**: Rajesh Kumar (Supervisor) and Chen Wei (Lead Rigger)

### 3. ⚠️ CAUSES IDENTIFIED IN DOCUMENT
- **Immediate causes**: Separation of air-hose coupling under pressure. Missing whipcheck safety cable and lack of universal lock pin.
- **Underlying causes**: Inadequate pre-use physical equipment inspection by subcontractors; no locking-pin verification protocol before system charging.
- **Root causes**: Contractor safety oversight failure; procurement using cheap uncertified quick-connect fittings without structural certification.

### 4. 🔧 EQUIPMENT AND MATERIALS
- **Equipment involved**: 250 PSI Industrial Air Compressor, 2-inch Reinforced Hose and Claw Coupling.
- **Materials / substances**: Pressurized nitrogen/air (110 PSI).
- **Work permit details**: Cold Work Permit #PTW-CW-2026-904, JSA-AIR-09.

### 5. 🚑 INJURIES AND MEDICAL
- **Nature of injury**: Superficial abrasion/scratch.
- **Body part affected**: Left forearm / hand.
- **Medical treatment given**: Cleaning and bandaging by on-site first-aider. Returned to duty within 30 minutes.
- **Hospital / clinic details**: Substation Camp Clinic.

### 6. ✅ ACTIONS ALREADY TAKEN
- **Immediate response actions**: Upstream compressor safety valve vented; air line isolated; work area barricaded.
- **Controls implemented**: Sandblasting operations suspended; crew re-instructed on hose safety pins.
- **Notifications made**: Safety coordinator notified in writing within 30 minutes of event.

### 7. ❓ INFORMATION GAPS (CRITICAL)
- **List exactly what is MISSING from this document**: 
  - Calibration certificate for compressor regulator is missing.
  - Verification on whether a physical Toolbox Talk was signed in the morning.
  - Detail on who inspected and signed off the permit-to-work (PTW) checklist.

### 8. 📝 RECOMMENDED NEXT INVESTIGATION STEPS
1. Audit the signed toolbox talk attendance sheets for B-Shift.
2. Recover and physically photograph the ruptured hose coupling and teeth.
3. Conduct a formal interview with Chen Wei (Lead Rigger) regarding crane SIMOPS.
4. Retrieve procurement records for claw hose fittings.

### 9. 📊 DOCUMENT QUALITY ASSESSMENT
- **Rate completeness**: Good. Essential details on date, location, and immediate actions are present.
- **Flag inconsistencies**: Witness statement notes the safety pin was broken, whereas the safety supervisor notes no pin was found in the area.
- **Legally sensitive statements**: Statement "the supervisor ordered us to bypass the whipcheck because we were late" is highly sensitive under regional regulations.

### 10. 📋 AUTO-FILL DATA (JSON FORMAT)
\`\`\`json
{
  "incident_title": "Pressurized Air Line Coupling Catastrophic Separation at Gulf Plant Expansion",
  "incident_type": "Near Miss",
  "date_time": "2026-06-27T09:15",
  "location": "Gas Train Substation 4, East Battery Limits",
  "description": "While cleaning piping with pressurized air at 110 PSI, a 2-inch claw coupling parted. The unsecured hose whipped violently, striking adjacent scaffolding. No severe injuries occurred.",
  "persons_involved": "Ahmed Al-Mansoori (Blasting Tech, Al-Masaood Contracting)",
  "equipment": "Industrial Air Compressor, 2-inch Claw Coupling",
  "immediate_actions": "Vented compressor, isolated air line, barricaded area.",
  "witnesses": "Rajesh Kumar (Supervisor), Chen Wei (Lead Rigger)",
  "permit_details": "PTW-CW-2026-904"
}
\`\`\`
`;
  }
  
  if (feature === "rca") {
    return `### 🔴 IMMEDIATE CAUSES
- **Unsafe Acts**:
  - Operating high-pressure air supply line without installing a Whipcheck safety cable.
  - Positioning workers directly in the pressurized line-of-fire.
- **Unsafe Conditions**:
  - Catastrophic wear on coupling claw interlocking fingers.
  - Absence of secondary physical locking pin on the joint fitting.

### 🟠 UNDERLYING CAUSES (ICAM METHODOLOGY)
- **Task / Environmental Factors**:
  - High ambient temperature (43°C) and dusty wind accelerated gasket degradation.
  - Noise levels (85 dB) from the nearby generator, leading to shouting and hasty setups.
- **Individual / Team Factors**:
  - Technician fatigue due to consecutive 12-hour shifts.
  - Lack of training in the specific brand of dynamic high-pressure lock fittings.
- **Workplace / Organization Factors**:
  - Poor contractor monitoring of subcontractor equipment checklists.
  - Lack of replacement safety pins in the field tool locker.

### 🔵 ROOT CAUSES
- **Management System Failures**:
  - Lack of a rigorous mechanical integrity auditing program for contractor temporary equipment.
  - Weak subcontractor pre-qualification processes, letting uncertified equipment bypass central audits.
- **Policy / Procedure Gaps**:
  - Sandblasting Standard Operating Procedure (SOP) did not explicitly require secondary lock pin inspections.
- **Cultural / Leadership Factors**:
  - Rushing to finish sandblasting before scheduled shutdown startup, leading to a culture of shortcutting checklists.

### 🟡 CONTRIBUTING FACTORS
- **SIMOPS (Simultaneous Operations)**: Scaffolding work ongoing adjacent to sandblasting, increasing hazard exposure.
- **Material Degradation**: Intense Middle East humidity rusted the metal latch components, rendering them brittle.

### ⚖️ BARRIER ANALYSIS
- **Barriers that failed**:
  - *SOP pre-start checks*: Signed off without confirming physical whipcheck installation.
  - *Claw coupling locking pin*: Absent or failed under pressurized flow.
- **Barriers that worked**:
  - *Emergency Stop (ESD)*: Operator successfully activated ESD in 5 seconds to depressurize line.
- **Missing barriers**:
  - *Whipcheck Safety Cable*: Completely absent. If installed, it would have fully arrested the hose motion.

### 📊 LOSS CAUSATION MODEL
- **Lack of Control**: Contractor did not audit subcontractor temporary fittings.
- **Basic Causes**: Outdated inspections, schedule pressure, budget constraints on spares.
- **Immediate Causes**: pressuring system with missing whipcheck and coupling pin.
- **Incident**: separated coupling whipped.
- **Loss**: Minor abrasion (near miss to catastrophic injury).

### 🎯 KEY FINDINGS SUMMARY
1. **The coupling separated due to a missing safety lock pin and absent whipcheck safety cable.**
2. **Subcontractor pre-start checklists were signed off as complete without physical inspections.**
3. **On-site tool rooms had zero whipcheck inventory, indicating a supply planning failure.**
4. **Active SIMOPS created spatial congestion, contributing to rushed contractor activities.**
5. **The operator lacked NEBOSH-certified hazard identification training regarding pressurized line-of-fire hazards.**
`;
  }

  if (feature === "report") {
    return `# HSE ACCIDENT INVESTIGATION REPORT
## REPORT NO: INV-2026-NEM-0089 | DATE: JUNE 28, 2026
**CLASSIFICATION: HIGH-POTENTIAL NEAR MISS / PROPERTY DAMAGE**

---

### SECTION 1: COVER PAGE
- **Incident Title**: Pressurized Air Line Coupling Catastrophic Separation at Gulf Plant Expansion
- **Date / Time**: June 27, 2026 at 09:15 AM
- **Location**: Gas Train Substation 4, East Battery Limits
- **Lead Investigator**: Senior HSE Director (NVIDIA Nemotron AI Certified)
- **Audit Status**: Draft Submitted for Executive Review

### SECTION 2: EXECUTIVE SUMMARY
On June 27, 2026, during high-pressure sandblasting operations at Substation 4, a 2-inch air hose coupling separated under 110 PSI pressure. The hose whipped violently, striking adjacent scaffolding. No personnel were seriously injured, but a scaffolding joint was damaged. The investigation shows that the coupling lacked a safety lock pin and whipcheck, and contractor pre-start checklists were bypass-signed.

### SECTION 3: INVESTIGATION TEAM DETAILS
- **Lead Investigator**: MARCUS VANCE (Senior HSE Specialist, TapRoot Certified)
- **Technical Auditor**: SAMI AL-HUSSEINI (Electrical & Mechanical Integrity Lead)
- **Subcontractor Rep**: CHEN WEI (Al-Masaood Construction Safety Rep)

### SECTION 4: INCIDENT DESCRIPTION & TIMELINE
- **08:30 AM**: Permit-to-Work (PTW) approved and issued to Al-Masaood sandblasting crew.
- **08:45 AM**: Toolbox Talk conducted by supervisor; however, pressurized lines were not specifically discussed.
- **09:00 AM**: Sandblasting compressor turned on and stabilized at 110 PSI.
- **09:15 AM**: Catastrophic separation of claw coupling occurs; hose whips for 5 seconds before emergency shutdown is hit.

### SECTION 5: EVIDENCE COLLECTED
- **Physical Evidence**: Damaged claw coupling showing heavily worn interlocking teeth and absence of a locking pin.
- **Document Evidence**: Signed daily checklist showing all equipment marked "safe", despite missing whipcheck.
- **Witness Testimony**: Operator states: "We had no locking pins left in our toolkit, so we proceeded as instructed."

### SECTION 6: ROOT CAUSE ANALYSIS FINDINGS
The root cause of the incident is a systemic failure in subcontractor equipment auditing and mechanical integrity verification. Contracted safety personnel signed checklists as complete without verifying physical compliance. Commercial pressure to meet the pre-shutdown deadline led to rushing and bypassing basic safety barriers.

### SECTION 7: CONTRIBUTING FACTORS
1. Absence of whipcheck safety cables in on-site stores.
2. Concurrent scaffolding work creating worker crowding.
3. Coastal high-humidity environment accelerating gear degradation.

### SECTION 8: BARRIER ANALYSIS
- **Preventative Barrier (LOTO & Permit Check)**: Failed. Permit signed without checking physical coupling integrity.
- **Mitigation Barrier (Whipcheck Cable)**: Failed (Absent).
- **Mitigation Barrier (Compressor ESD)**: Successful. Compressor shut down in 5 seconds.

### SECTION 9: CONCLUSIONS
The incident was fully preventable. The failure of administrative and procedural barriers allowed a known hazard (unsecured high-pressure coupling) to be operated. Systemic procurement gaps and commercial rushing were the key drivers.

### SECTION 10: CAPA REGISTER (CORRECTIVE & PREVENTIVE ACTIONS)
1. **Critical (24h)**: Suspend all sandblasting operations until 100% of couplings are audited and verified. (Owner: HSE Director)
2. **High (7d)**: Order and stock 50 certified whipcheck cables and universal safety pins in Area 4 store. (Owner: Logistics Lead)
3. **Medium (30d)**: Deliver a 4-hour safety stand-down training on pressurized line safety to all contractors. (Owner: Training Specialist)

### SECTION 11: LESSONS LEARNED
- Written checklists are useless without physical walkdowns and supervisor verification.
- A pressurized air hose without a whipcheck is a potential fatal hazard. Never authorize work without it.

### SECTION 12: RECOMMENDATIONS TO MANAGEMENT
- Implement a rigid subcontractor audit penalty clause for safety bypasses.
- Mandate digital photographic proof of critical safety devices (like whipchecks) before permit activation in the HSE software.

### SECTION 13: SIGN-OFF PAGE
- **Lead Investigator**: ________________________ Date: ___________
- **Corporate HSE Director**: __________________ Date: ___________
`;
  }

  if (feature === "capa") {
    return `No. | Action Description | Control Level | Responsible Person | Due Date | Priority | Verification Method | Status
1 | Audit all pressurized hose couplings in Substation 4 and fit universal safety lock pins | Engineering Control | Maintenance Supervisor | 2026-06-29 | 🔴 CRITICAL | Physical walkdown audit sheet | Open
2 | Procure and inventory 50 double-clamp whipcheck safety cables in the central tool locker | Administrative Control | Logistics Manager | 2026-07-05 | 🟠 HIGH | Invoice and physical stock check | Open
3 | Revise pre-start equipment checklists to require photographic attachment of whipchecks in PTW app | Administrative Control | HSE Systems Engineer | 2026-07-28 | 🟡 MEDIUM | Software system test & release log | Open
4 | Deliver mandatory safety stand-down and retraining on 'Line of Fire' safety for pressurized air systems | Administrative Control | Lead HSE Trainer | 2026-07-15 | 🟡 MEDIUM | Signed training attendance roster | Open
5 | Design and install physical steel mesh cage guards around high-pressure compressor junction manifolds | Engineering Control | Piping Engineer | 2026-08-30 | 🟢 LOW | Physical installation check & sign-off | Open
`;
  }

  if (lowercasePrompt.includes("icam")) {
    return `### 🛡️ Understanding the ICAM Methodology (NVIDIA Expert)

The **Incident Cause Analysis Method (ICAM)** is an industrial safety standard for accident investigation. It organizes causes into four main categories based on James Reason's Swiss Cheese model:

1. **Absent or Failed Defenses**: These are the physical, administrative, or protective barriers that failed to prevent the incident (e.g., missing whipcheck, failed interlock).
2. **Individual or Team Actions**: The direct errors, omissions, or violations made by people on the front line (e.g., technician skipping live-testing).
3. **Task or Environmental Conditions**: The immediate operational context (e.g., extreme heat, high noise levels, 14-hour shift fatigue) that influenced human behavior.
4. **Organizational Factors**: The latent systemic failures in the management system, policy, training budgets, or contractor pre-qualification that created the hazard.

By structure-drilling down through these four levels, an investigator moves away from blaming individuals and towards fixing systemic weaknesses.

*Cite Reference: ADNOC HSEMS Standard, Part 4 - Incident Notification & Investigation.*`;
  }

  if (lowercasePrompt.includes("hierarchy") || lowercasePrompt.includes("controls")) {
    return `### 📊 The Hierarchy of Controls (ISO 45001 Compliance)

Under **ISO 45001 (Section 8.1.2)**, organizations must reduce risks using this prioritized hierarchy:

1. **Elimination**: Physically remove the hazard.
2. **Substitution**: Replace the hazard with a safer alternative.
3. **Engineering Controls**: Isolate people from the hazard (e.g., installing whipchecks, interlocks).
4. **Administrative Controls**: Change how people work (e.g., LOTO, permits, checklists).
5. **Personal Protective Equipment (PPE)**: Last line of defense.

*Note: Administrative controls and PPE rely entirely on human compliance, whereas Engineering controls physically block the hazard.*`;
  }

  return `### 🛡️ HSE Specialist Response (Powered by NVIDIA Nemotron)

As a Senior HSE Investigator, I can provide expert guidance on the following:

- **ICAM / Root Cause Methodologies**: Applying TapRoot, Swiss Cheese, or 5-Whys to investigate high-potential near misses.
- **Regulatory Compliance**: ADNOC HSEMS, ARAMCO General Instructions (GIs), and ISO 45001 audit compliance.
- **Barrier Analysis**: Assessing preventive vs. mitigating safety barriers in Oil & Gas and petrochemical projects.
- **CAPA Development**: Generating SMART (Specific, Measurable, Actionable, Realistic, Time-bound) corrective and preventive actions.

Please feel free to ask a specific question, or upload an investigation report inside our **Document Parser** to auto-fill the **RCA Engine**!`;
}

// 0. NVIDIA NEMOTRON BACKEND PROXY ENDPOINT
app.post("/api/analyze", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "global";
  
  // Check rate limit (Max 20 requests per hour)
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: "Rate limit exceeded. You can make a maximum of 20 requests per hour. Please try again later."
    });
  }

  const { prompt, systemPrompt, feature, extraData } = req.body;

  // Sanitize prompt and system prompt
  const sanitizedPrompt = sanitizeInput(prompt || "");
  const sanitizedSystem = systemPrompt ? sanitizeInput(systemPrompt) : MASTER_SYSTEM_PROMPT;

  if (!sanitizedPrompt) {
    return res.status(400).json({ error: "Empty prompt or input data." });
  }

  const apiKey = process.env.NVIDIA_API_KEY;

  if (apiKey) {
    try {
      console.log(`Sending prompt to NVIDIA Nemotron. Feature: ${feature}`);
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b",
          messages: [
            { role: "system", content: sanitizedSystem },
            { role: "user", content: sanitizedPrompt }
          ],
          temperature: 0.65,
          top_p: 0.95,
          max_tokens: 4096,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return res.json({ content });
      } else {
        const errText = await response.text();
        console.error("NVIDIA API error response:", errText);
      }
    } catch (error: any) {
      console.error("NVIDIA API fetch failed, trying Gemini fallback.", error);
    }
  }

  // Fallback to Gemini if available
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(`Using Gemini API to process feature: ${feature}`);
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: sanitizedPrompt,
        config: {
          systemInstruction: `${sanitizedSystem}\n\n[Context: You are simulating the NVIDIA Nemotron HSE Cognitive Core. Provide exceptionally high-quality, professional, and detailed compliance, investigation, and root cause analysis responses based on Saudi Aramco GI standards, ADNOC HSEMS, and ISO 45001. Ensure answers are well-structured in Markdown.]`,
          temperature: 0.65,
        }
      });
      const content = response.text || "";
      return res.json({ content });
    } catch (geminiError: any) {
      console.error("Gemini API fallback failed, using simulated output:", geminiError);
    }
  }

  // Ultimate static simulated fallback
  console.log(`No API keys or API calls succeeded. Generating simulated response for feature: ${feature}`);
  const simulatedResponse = getSimulatedOutput(feature, sanitizedPrompt, extraData);
  return res.json({ content: simulatedResponse, warning: "Running local simulated engine fallback." });
});

// 1. AI INCIDENT INVESTIGATION ENGINE: Performs full multi-methodology analysis on incident data
app.post("/api/investigate/analyze", async (req, res) => {
  const incidentData = req.body;
  const prompt = `
    You are an expert Chief HSE Investigator for premier multinational energy and EPC companies (like Saudi Aramco, ADNOC, Shell, and Chevron).
    You conduct rigorous, evidence-based, professional incident investigations following ISO 45001, TapRooT, and ICAM methodologies.

    Analyze the following incident registration information and generate a complete, professional, comprehensive investigation intelligence report.

    Incident Information:
    - Title: ${incidentData.incidentTitle || "Untitled Incident"}
    - Classification: ${incidentData.incidentClassification || "Unknown"}
    - Event Type: ${incidentData.eventType || "General HSE"}
    - Date & Time: ${incidentData.date} at ${incidentData.time}
    - Location: ${incidentData.location}
    - Project / BU / Department: ${incidentData.project} / ${incidentData.businessUnit} / ${incidentData.department}
    - Contractor: ${incidentData.contractor}
    - Reporter / Investigator: ${incidentData.reporter} / ${incidentData.investigator}
    - Severity (1-5) / Potential Severity (1-5): ${incidentData.severity} / ${incidentData.potentialSeverity}
    - Work Activity & Process Unit: ${incidentData.workActivity} / ${incidentData.processUnit}
    - Energy Source Involved: ${incidentData.energySource}
    - Equipment & Assets: ${incidentData.equipmentAssets}
    - Environmental Conditions: ${incidentData.environmentalConditions}
    - LOTO / PTW / JSA / SIMOPS: LOTO: ${incidentData.loto || "N/A"}, PTW: ${incidentData.permitNumber || "N/A"}, JSA: ${incidentData.jsaNumber || "N/A"}, SIMOPS: ${incidentData.simops || "N/A"}
    - Witness Statements: ${incidentData.witnessStatements}
    - Immediate Controls Applied: ${incidentData.immediateControls}

    Provide the output strictly in JSON format as defined below. Do not include any extra text, markdown commentary (like \`\`\`json \`\`\`), or preambles. Output raw JSON only.

    JSON Schema to follow:
    {
      "fiveWhys": [
        "Step 1: The immediate physical event or injury",
        "Step 2: Why it occurred",
        "Step 3: Why that condition existed",
        "Step 4: Why the management control failed",
        "Step 5: The deep underlying root cause related to safety management systems, culture, or design"
      ],
      "fishbone": {
        "people": ["Human behaviors, fatigue, situational awareness, competency, decision-making factors (at least 2-3 detailed bullets)"],
        "equipment": ["Machine failures, wear, calibration, bypasses, labeling (at least 2-3 detailed bullets)"],
        "materials": ["Chemicals, PPE suitability, tools, lubricants, viscosity, barrier integrity (at least 2-3 detailed bullets)"],
        "methods": ["Procedures, single-line diagrams, nomenclatures, permits, JSAs, checklist quality (at least 2-3 detailed bullets)"],
        "environment": ["Lighting, noise, wind, swells, temperatures, housekeeping, toxicity (at least 2-3 detailed bullets)"],
        "management": ["Safety culture, audits, training budgets, commercial pressure, supervisor presence, contractor audits (at least 2-3 detailed bullets)"]
      },
      "barrierAnalysis": {
        "preventative": [
          { "name": "Barrier Name (e.g. LOTO)", "status": "active" | "failed" | "weak", "description": "How the barrier performed or why it failed in this context" }
        ],
        "mitigation": [
          { "name": "Barrier Name (e.g. PPE, ESD)", "status": "active" | "failed" | "weak", "description": "How the mitigation barrier performed or why it succeeded/failed" }
        ]
      },
      "swissCheese": [
        { "layerName": "Layer (e.g., Engineering Controls, Procedures, Supervision)", "holeDescription": "Specific gap or failure in this layer", "status": "breached" | "intact" }
      ],
      "humanFactors": [
        { "factor": "Factor (e.g., Fatigue, Distraction, Experience, Stress)", "level": "low" | "medium" | "high", "description": "Explanation of this human factor's contribution", "recommendation": "Specific remediation" }
      ],
      "rootCauses": {
        "immediateCause": "Detailed immediate physical trigger",
        "underlyingCause": "Procedures, supervisor failure, calibration, or training deficiencies",
        "rootCause": "The systemic, design, or cultural failure at the organizational level",
        "organizationalCause": "Safety culture, corporate follow-up, budget allocation, contractor management gap",
        "confidenceScore": 85, // (0-100 integer)
        "supportingEvidence": "The physical, document, or witness evidence supporting this conclusion",
        "alternativeHypotheses": ["Alternate explanation 1", "Alternate explanation 2"],
        "evidenceGaps": ["Critical missing pieces of evidence or unverified assertions"]
      },
      "capa": [
        { "action": "Specific, actionable, measurable CAPA task", "type": "Immediate" | "Corrective" | "Preventive", "ownerRole": "Owner job title", "priority": "Low" | "Medium" | "High", "timeDays": 14 }
      ],
      "qualityAssurance": {
        "qualityScore": 90, // Out of 100
        "missingEvidence": ["What evidence is still missing (e.g., training records, maintenance logs)"],
        "contradictions": ["Any conflict between witness statements or logs"],
        "biasCheck": "Identification of any investigation bias (e.g., blame culture, contractor vs. company worker discrepancy)",
        "recommendation": "Steps to improve the quality index of this report before executive submission"
      }
    }
  `;

  try {
    const ai = getGeminiClient();
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const analysisResult = JSON.parse(cleanedJson);
      
      // Update our database
      const foundIdx = incidents.findIndex(i => i.id === incidentData.id || i.incidentNumber === incidentData.incidentNumber);
      const updatedIncident = {
        ...incidentData,
        id: incidentData.id || `INC-${Date.now().toString().slice(-4)}`,
        status: "Investigating",
        riskRating: parseInt(incidentData.severity) * parseInt(incidentData.potentialSeverity) >= 15 ? "High" : (parseInt(incidentData.severity) * parseInt(incidentData.potentialSeverity) >= 8 ? "Medium" : "Low"),
        ...analysisResult
      };

      if (foundIdx !== -1) {
        incidents[foundIdx] = updatedIncident;
      } else {
        incidents.push(updatedIncident);
      }

      res.json(updatedIncident);
    } else {
      // Return high-quality mock data if API key is not present
      console.log("No GEMINI_API_KEY found, fallback to premium mock engine.");
      const updatedIncident = generateHighQualityMock(incidentData);
      
      const foundIdx = incidents.findIndex(i => i.id === incidentData.id || i.incidentNumber === incidentData.incidentNumber);
      if (foundIdx !== -1) {
        incidents[foundIdx] = updatedIncident;
      } else {
        incidents.push(updatedIncident);
      }
      res.json(updatedIncident);
    }
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: "Failed to perform AI analysis. " + error.message });
  }
});

// 2. INTELLIGENT QUESTION ENGINE: Generates custom investigation inquiries dynamically
app.post("/api/investigate/questions", async (req, res) => {
  const { eventType, incidentTitle, currentDetails, alreadyAsked } = req.body;
  const prompt = `
    You are an expert HSE Incident Investigator. Based on the following incident details, formulate 5 deep-dive, highly specific evidence-gathering questions that investigators must ask witnesses, supervisors, or inspect in physical evidence.

    Incident Title: ${incidentTitle}
    Event Category: ${eventType}
    Current Details: ${currentDetails}
    Already Answered/Asked Questions: ${alreadyAsked ? JSON.stringify(alreadyAsked) : "None"}

    Focus on critical industrial concepts:
    - Electrical: LOTO, Spring discharge, Permit competency, Multi-meter cat-rating, Isolation test.
    - Lifting: Dynamic load factor, Marine swells, Rigging certificate, Crane LMI bypass, sea state limits.
    - Fall from Height: Anchor points, safety harness inspection tags, rescue plans, wind speeds, scaffolds tags.
    - Chemical/Gas: Gas testing frequency, LEL alarm thresholds, breathing apparatus, SIMOPS, pipeline metallurgy, chemical MSDS.
    - General/Slips: Housekeeping, lighting, floor coefficients, supervisor safety walks.

    Provide the output strictly in JSON format matching this schema:
    {
      "questions": [
        { "id": "Q-1", "question": "The specific question text?", "category": "LOTO / PPE / Maintenance / Design etc.", "evidenceTarget": "What physical or document proof is needed to verify this answer?" }
      ]
    }
    Output raw JSON only. No markdown formatting.
  `;

  try {
    const ai = getGeminiClient();
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      const responseText = response.text || "";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(cleanedJson));
    } else {
      // Fallback Questions
      const questions = getFallbackQuestions(eventType);
      res.json({ questions });
    }
  } catch (error: any) {
    console.error("Failed to generate dynamic questions:", error);
    res.status(500).json({ error: "Failed to generate dynamic questions." });
  }
});

// 3. AI CHAT ASSISTANT: Conversational helper for root cause analyses & toolbox talks
app.post("/api/assistant/chat", async (req, res) => {
  const { messages, incidentContext } = req.body;
  
  const systemPrompt = `
    You are the HSE IntelliInvestigate AI assistant, designed to serve Lead HSE Directors and Principal Investigators at elite industrial enterprises (Aramco, Shell, ADNOC).
    You speak with objective, expert engineering authority. You understand every major root cause methodology (TapRooT, 5-Whys, Barrier Analysis, BowTie, Tripod Beta, Fishbone, HFACS).
    
    If the user asks for:
    - "Generate a Toolbox Talk" / "Prepare safety alert": format it perfectly in Markdown with Clear hazard, immediate action, key lessons, and a sign-off checklist.
    - "Why did this occur": provide a concise multi-cause analysis highlighting latent conditions.
    - "What evidence is missing": list critical documentation, physical evidence, and technical logs.
    - "Compare similar cases": synthesize general patterns of safety culture, outdated standards, and bypass thresholds.

    Current Incident context available:
    ${JSON.stringify(incidentContext || "No active incident loaded yet.")}
  `;

  try {
    const ai = getGeminiClient();
    if (process.env.GEMINI_API_KEY) {
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: systemPrompt,
        },
      });

      // Send the last message in the conversation
      const lastUserMessage = messages[messages.length - 1]?.content || "Hello";
      const response = await chat.sendMessage({ message: lastUserMessage });
      res.json({ content: response.text });
    } else {
      // Return highly structured intelligent offline chat response
      const responseText = generateMockChatResponse(messages[messages.length - 1]?.content, incidentContext);
      res.json({ content: responseText });
    }
  } catch (error: any) {
    console.error("AI assistant chat error:", error);
    res.status(500).json({ error: "AI Chat error: " + error.message });
  }
});

// 4. LESSONS LEARNED / SAFETY BULLETIN GENERATOR
app.post("/api/lessons-learned/generate", async (req, res) => {
  const { incident } = req.body;
  const prompt = `
    Create a highly professional, enterprise-grade HSE Safety Alert Bulletin / Toolbox Talk sheet based on this incident.
    The output must be formatted in elegant Markdown. It should look like a professional document from ExxonMobil or Shell.

    Incident details:
    - Title: ${incident.incidentTitle}
    - Classification: ${incident.incidentClassification}
    - Event Type: ${incident.eventType}
    - Location & Date: ${incident.location} on ${incident.date}
    - Root Cause Found: ${incident.rootCauses?.rootCause || "Under Investigation"}
    - Immediate Cause: ${incident.rootCauses?.immediateCause || "Under Investigation"}
    - CAPA Actions: ${JSON.stringify(incident.capa || [])}

    Structure of the safety bulletin:
    1. HEADER: Corporate Safety Alert (Title, ID, Date, Classification)
    2. WHAT HAPPENED: Clear, descriptive narrative of the physical chain of events.
    3. CONSEQUENCES: Real and potential impacts.
    4. WHY IT HAPPENED (ROOT CAUSES): Categorized into Technical, Procedural, and Behavioral factors.
    5. KEY LESSONS LEARNED: Standard guidelines to prevent recurrence.
    6. MANDATORY STAND-DOWN ACTIONS FOR SITES: Standard checklist for supervisors before restarting SIMOPS or similar tasks.
    
    Provide the output in standard Markdown format.
  `;

  try {
    const ai = getGeminiClient();
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      res.json({ bulletin: response.text });
    } else {
      res.json({ bulletin: generateMockSafetyBulletin(incident) });
    }
  } catch (error: any) {
    console.error("Failed to generate bulletin:", error);
    res.status(500).json({ error: "Failed to generate safety bulletin." });
  }
});

// GET endpoints for fetching incidents
app.get("/api/incidents", (req, res) => {
  res.json(incidents);
});

app.get("/api/incidents/:id", (req, res) => {
  const incident = incidents.find(i => i.id === req.params.id);
  if (incident) {
    res.json(incident);
  } else {
    res.status(404).json({ error: "Incident not found" });
  }
});

// Route for adding a new raw incident manually or via API
app.post("/api/incidents", (req, res) => {
  const newIncident = {
    id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
    status: "Draft",
    ...req.body
  };
  incidents.push(newIncident);
  res.json(newIncident);
});

// Update specific incident
app.put("/api/incidents/:id", (req, res) => {
  const foundIdx = incidents.findIndex(i => i.id === req.params.id);
  if (foundIdx !== -1) {
    incidents[foundIdx] = { ...incidents[foundIdx], ...req.body };
    res.json(incidents[foundIdx]);
  } else {
    res.status(404).json({ error: "Incident not found" });
  }
});

// Delete incident
app.delete("/api/incidents/:id", (req, res) => {
  const foundIdx = incidents.findIndex(i => i.id === req.params.id);
  if (foundIdx !== -1) {
    incidents.splice(foundIdx, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Incident not found" });
  }
});

// Start serving Vite assets in production, or mount Vite middleware in development
const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development fullstack server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production fullstack server running on port ${PORT}`);
  });
}

// ======================== FALLBACK HELPERS ========================
function generateHighQualityMock(data: any): any {
  const id = data.id || `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
  const event = data.eventType || "General HSE Incident";
  
  const mockAnalysis: any = {
    "Electrical Incident": {
      fiveWhys: [
        `Operator received a shock when operating the electrical breaker on ${data.location || "Process Area"}.`,
        "Moisture seeped inside the breaker terminal block during previous overnight rains.",
        "The cabinet door seal was severely worn out and had lost its sealing capacity.",
        "The seal was noted as degraded during a preventive maintenance check 3 months ago but was not ordered.",
        "HSE budget priority deferred spare rubber seals in favor of secondary instrumentation components."
      ],
      fishbone: {
        people: ["Operator operated switch with moist safety gloves.", "Maintenance inspector signed off on cabinet condition without testing water tightness."],
        equipment: ["Gasket was dry-rotted and cracked.", "Grounding strap was corroded, raising path resistance."],
        materials: ["Industrial rubber seal material used did not match heat/UV classification of Middle East ambient weather."],
        methods: ["Cabinet checks were visual-only without moisture index screening.", "No LOTO applied during manual switch exercise."],
        environment: ["Overnight 22mm tropical squall line raised humidity to saturation level.", "Corrosive saline coastal air degraded copper contacts."],
        management: ["Supply chain delayed rubber spare parts delivery due to warehouse vendor consolidation."]
      },
      barrierAnalysis: {
        preventative: [
          { name: "IP65 Weatherproof Enclosure Gasket", status: "failed", description: "IP65 seal breached due to dry rot and extreme UV exposure." },
          { name: "Daily Morning Inspections", status: "weak", description: "Completed as 'all clear' despite visual signs of rain pooling near cabinet floor." }
        ],
        mitigation: [
          { name: "Residual Current Ground Fault Relay (GFCI)", status: "active", description: "Tripped within 18ms, preventing severe fibrillation of cardiac muscle." },
          { name: "Standard Insulated Operator Boots", status: "active", description: "Offered critical electrical isolation to ground, mitigating power transfer." }
        ]
      },
      swissCheese: [
        { layerName: "Weather Enclosure IP Rating", holeDescription: "Dry rotted sealing strip allowed water ingress.", status: "breached" },
        { layerName: "Ground Fault Interrupter (GFI)", holeDescription: "Tripped instantly as designed, saving the worker's life.", status: "intact" },
        { layerName: "Weekly Maintenance Walkthrough", holeDescription: "Superficial checklists completed without opening external casings.", status: "breached" }
      ],
      humanFactors: [
        { factor: "Decision Making", level: "high", description: "Team decided to cycle breakers without dry-out procedures following high rainfall.", recommendation: "Mandate water-ingress checks on high-risk nodes after any rain event." }
      ],
      rootCauses: {
        immediateCause: "High moisture content inside electrical junction board created a conductive pathway to the breaker housing, generating high touch voltage.",
        underlyingCause: "Failure to replace critical environmental gaskets despite documented deterioration records.",
        rootCause: "Inadequate material specifications for extreme weather assets and supply chain delays for minor safety spare parts.",
        organizationalCause: "HSE compliance audit gaps in monitoring high-potential backlog items.",
        confidenceScore: 82,
        supportingEvidence: "Corroded gasket fragment retrieved; GFCI digital trip log; supply chain delay emails dated April 2nd.",
        alternativeHypotheses: [
          "Deliberate bypass of safety interlocks (ruled out by panel structural seal checks).",
          "Grid-level electrical voltage surge (ruled out by main station telemetry)."
        ],
        evidenceGaps: ["Unsigned shift transition log from the previous crew."]
      },
      capa: [
        { id: "C-101", action: "Replace all MCC weather gaskets in Area 3 with specialized high-temperature silicon composites.", type: "Corrective", ownerRole: "Electrical Supervisor", priority: "High", timeDays: 5, status: "Open" },
        { id: "C-102", action: "Revise LOTO safety standard to mandate humidity testing inside cabinets prior to energizing.", type: "Preventive", ownerRole: "Electrical Engineer Specialist", priority: "Medium", timeDays: 14, status: "Open" }
      ],
      qualityAssurance: {
        qualityScore: 85,
        missingEvidence: ["Moisture level reader calibration sheet."],
        contradictions: ["None"],
        biasCheck: "Low bias detected. The electrical supervisor agreed with physical findings.",
        recommendation: "Verify previous training dates for all electrical technicians involved."
      }
    },
    "Lifting Operations Incident": {
      fiveWhys: [
        "A heavy cargo container slipped from rigging during boat-to-dock crane hoist.",
        "The nylon sling rigging snapped under high-frequency load tension.",
        "The cargo was hoisted during moderate swell tides, creating deep vertical shock load.",
        "The dynamic offshore sea-state coefficient was neglected during lift permit signing.",
        "Rigging teams lacked digital marine telemetry support and relied on subjective weather estimates."
      ],
      fishbone: {
        people: ["Rigger failed to check the wet-bulb index for lifting ropes.", "Superintendent approved lift despite wind gauge alarms sounding."],
        equipment: ["Crane overload sensors bypassed using auxiliary bypass keys.", "Sling was stored on open deck, exposed to UV deterioration."],
        materials: ["Nylon hoisting sling suffered heavy UV degradation, cutting load capacity by 45%."],
        methods: ["Standard Lift Plan was designed for onshore operations, neglecting marine dynamic amplification factors."],
        environment: ["Jetty wind gusted to 28 knots, pushing cargo vessel into rapid pitch oscillations."],
        management: ["Supervisors pressured to clear cargo within the maritime tidal window."]
      },
      barrierAnalysis: {
        preventative: [
          { name: "Dynamic Lift Plan Verification", status: "failed", description: "Lift planning was conducted using static values, missing vessel oscillation coefficients." },
          { name: "Rigging Inspection Logs", status: "failed", description: "Sling had visual micro-fraying but was approved for use due to lack of a clean backup sling." }
        ],
        mitigation: [
          { name: "Drop Zone Exclusion Area", status: "active", description: "Personnel were kept 30m away from the hook center, preventing any casualties." },
          { name: "Hydraulic Load Limiter", status: "weak", description: "Triggered alert but did not automatically stop lift due to bypass key override." }
        ]
      },
      swissCheese: [
        { layerName: "Exclusion Zone", holeDescription: "Kept completely intact, saving lives.", status: "intact" },
        { layerName: "Sling Load Capacity Check", holeDescription: "Degraded sling used with false loading calculations.", status: "breached" },
        { layerName: "Dynamic Swell Monitoring", holeDescription: "Skipped calculations, assuming onshore limits applied.", status: "breached" }
      ],
      humanFactors: [
        { factor: "Situational Awareness", level: "high", description: "Rigger failed to spot severe fraying on the rope crown.", recommendation: "Implement tactile-audit procedures for lifting straps." }
      ],
      rootCauses: {
        immediateCause: "Hoisting sling catastrophic break under rapid dynamic tension load caused by sea-swell vessel plunge.",
        underlyingCause: "Usage of UV-degraded rigging gear and failure to adjust lifting parameters for dynamic sea-states.",
        rootCause: "Lacking offshore-specific lifting procedures and insufficient mechanical integrity tracking for temporary rigging gear.",
        organizationalCause: "Absence of automated wind/sea monitoring locks in site operations software.",
        confidenceScore: 89,
        supportingEvidence: "Snapped nylon fibers showing extensive heat-fusing and micro-cracking indicative of UV rot; Vessel rolling graphs.",
        alternativeHypotheses: [
          "Vessel struck jetty causing collision load (ruled out by crane GPS logs)."
        ],
        evidenceGaps: ["Rigging locker daily sign-out sheet is missing for this crane."]
      },
      capa: [
        { id: "C-201", action: "Perform physical load testing and certification on 100% of rigging materials on Platform Jetty.", type: "Corrective", ownerRole: "Rigging Inspector", priority: "High", timeDays: 7, status: "Open" },
        { id: "C-202", action: "Update lift manuals to include mandatory derating factors for offshore vessel swells.", type: "Preventive", ownerRole: "Marine Logistics Superintendent", priority: "High", timeDays: 15, status: "Open" }
      ],
      qualityAssurance: {
        qualityScore: 90,
        missingEvidence: ["Sling manufacturer certificate."],
        contradictions: ["Vessel deckhands stated swells were mild, but automatic marine GPS telemetry registered 1.8m swells."],
        biasCheck: "Deck crew may downplay wave height to avoid offshore penalty fees.",
        recommendation: "Deploy dynamic wind gauges linked to automatic permit locks."
      }
    }
  };

  const template = mockAnalysis[event] || {
    fiveWhys: [
      `An incident occurred in the ${data.location || "Process area"} during standard operations.`,
      "Equipment/controls failed to operate as expected during high-stress moments.",
      "The routine check failed to identify micro-fractures and system discrepancies.",
      "Maintenance intervals were extended due to administrative backlog.",
      "Budget priorities restricted secondary diagnostic tooling across the plant."
    ],
    fishbone: {
      people: ["Crew proceeded with tasks without active supervisor supervision.", "Inadequate communication during shift handovers."],
      equipment: ["Safety locks were disengaged or bypassed to expedite turnaround times.", "Calibration certificates had expired."],
      materials: ["Gaskets or minor parts were worn and not replaced due to inventory shortages."],
      methods: ["The Standard Operating Procedure (SOP) was outdated by 24 months.", "JSA did not detail the specific dynamic risks of this SIMOPS scenario."],
      environment: ["Ambient heat or lighting created difficult ergonomics.", "Housekeeping standards had deteriorated in Area 3."],
      management: ["HSE site safety audits were focused on administrative records rather than live site safety walks."]
    },
    barrierAnalysis: {
      preventative: [
        { name: "Standard Procedure (SOP)", status: "failed", description: "SOP lacked steps detailing specific SIMOPS hazard controls." },
        { name: "Safety Signs & Warnings", status: "weak", description: "Placed too far from the active work cabinet to alert crew." }
      ],
      mitigation: [
        { name: "PPE & Shielding", status: "active", description: "Helped contain impact energy, limiting injury severity." },
        { name: "Emergency Team", status: "active", description: "Responded in under 10 minutes, securing the perimeter." }
      ]
    },
    swissCheese: [
      { layerName: "SOP Guideline", holeDescription: "Failed to cover SIMOPS coordinate controls.", status: "breached" },
      { layerName: "Physical Isolation", holeDescription: "Verification step was skipped.", status: "breached" },
      { layerName: "PPE Shielding", holeDescription: "Absorbed force as designed, preventing secondary fracture.", status: "intact" }
    ],
    humanFactors: [
      { factor: "Situational Awareness", level: "high", description: "Referred to outdated site diagrams during active work.", recommendation: "Implement digital tablet drawings updated live from central CAD systems." }
    ],
    rootCauses: {
      immediateCause: "Uncontrolled energy release striking worker during maintenance routine.",
      underlyingCause: "Skipping physical safety checks due to schedule pressure and outdated site manuals.",
      rootCause: "Safety compliance enforcement prioritizing quick turnarounds over physical site audits and maintenance compliance.",
      organizationalCause: "HSE budget cuts reducing physical site presence of safety engineers.",
      confidenceScore: 78,
      supportingEvidence: "Unsigned permit sheets; worn seal valves found at trash bay; email records confirming rush.",
      alternativeHypotheses: [
        "Inherent steel defect inside valve (ruled out by metallurgical microscope analysis)."
      ],
      evidenceGaps: ["Unchecked training records for temporary hire hands."]
    },
    capa: [
      { id: "C-301", action: "Complete safety stand-down for all Area 3 personnel to review permit-to-work requirements.", type: "Immediate", ownerRole: "HSE Director", priority: "High", timeDays: 2, status: "Open" },
      { id: "C-302", action: "Update and digitize all site-specific piping layouts in the central HSE register.", type: "Corrective", ownerRole: "CAD Team Leader", priority: "Medium", timeDays: 30, status: "Open" }
    ],
    qualityAssurance: {
      qualityScore: 80,
      missingEvidence: ["Training logs for Contractor Shift Crew B."],
      contradictions: ["None"],
      biasCheck: "Potential blame on third-party contractors; recommended auditing central site supervision records.",
      recommendation: "Incorporate digital badge tracking to verify active supervisor attendance during the isolation phase."
    }
  };

  return {
    ...data,
    id,
    status: "Investigating",
    riskRating: parseInt(data.severity || "3") * parseInt(data.potentialSeverity || "3") >= 15 ? "High" : (parseInt(data.severity || "3") * parseInt(data.potentialSeverity || "3") >= 8 ? "Medium" : "Low"),
    ...template
  };
}

function getFallbackQuestions(eventType: string): any[] {
  if (eventType === "Electrical Incident") {
    return [
      { id: "Q-1", question: "Was Lockout Tagout (LOTO) verified physically at the exact breakers and documented?", category: "LOTO Protocol", evidenceTarget: "Physical LOTO lock numbers vs. permit sheet logs." },
      { id: "Q-2", question: "What multi-meter was used, and was it rated (CAT-III or IV) for the circuit potential?", category: "Equipment Calibration", evidenceTarget: "Multi-meter device serial number and safety catalog page." },
      { id: "Q-3", question: "Did the technician perform a 'Test-Before-Touch' using a verified live-dead-live method?", category: "Human Behavior", evidenceTarget: "Witness logs and supervisor's manual validation entry." },
      { id: "Q-4", question: "When were the Single Line Diagrams (SLD) last reviewed, stamped, and updated in this MCC room?", category: "Site Procedures", evidenceTarget: "Revision history on the cabinet door blueprint folder." },
      { id: "Q-5", question: "Were the active technician's electrical safety qualifications and offshore onboarding valid?", category: "Competency Registry", evidenceTarget: "HR Training certificate database printout." }
    ];
  } else if (eventType === "Lifting Operations Incident") {
    return [
      { id: "Q-11", question: "What was the dynamic sea state and tide frequency during the lift, and was the wind monitored?", category: "Environmental", evidenceTarget: "Vessel anemometer graphs and marine harbor tide log." },
      { id: "Q-12", question: "Was the crane's Load Moment Indicator (LMI) fully operational, or had any bypass key been engaged?", category: "Safety Interlocks", evidenceTarget: "Crane digital log files download." },
      { id: "Q-13", question: "When was the snapped rigging sling last inspected, and what was its dynamic weight rating?", category: "Rigging Gear", evidenceTarget: "Tag number and inspection database log." },
      { id: "Q-14", question: "Did the rigging coordinator verify exclusion zone clearances prior to the hoist?", category: "Exclusion Zone", evidenceTarget: "CCTV jetty camera record." }
    ];
  } else {
    return [
      { id: "Q-51", question: "Was there a specific permit-to-work (PTW) signed, and were all immediate controls active?", category: "Compliance", evidenceTarget: "Signed PTW physical document scan." },
      { id: "Q-52", question: "What specific safety briefing or toolbox talk was conducted for the team prior to this shift?", category: "Communication", evidenceTarget: "Toolbox sign-in sheet scan." },
      { id: "Q-53", question: "Had the workers involved experienced any fatigue, overtime shifts, or roster changes?", category: "Human Factors", evidenceTarget: "Roster database hours report." },
      { id: "Q-54", question: "Was an active, qualified site supervisor physically present in the area during this activity?", category: "Supervision", evidenceTarget: "Supervisor badge log entries." }
    ];
  }
}

function generateMockChatResponse(msg: string, context: any): string {
  const text = msg.toLowerCase();
  const title = context?.incidentTitle || "unspecified incident";
  
  if (text.includes("toolbox") || text.includes("bulletin") || text.includes("talk")) {
    return `### ⚡ TOOLBOX TALK: WORKPLACE SAFETY LESSONS (REF: ${context?.id || "INC-ACTIVE"})
Based on our deep analysis of the **${title}**, here is a standard site safety briefing template:

#### 🚨 THE HAZARD WE FACED:
- **Uncontrolled Energy Exposure**: An event occurred because isolation verification was skipped.
- **Outdated Site Schematic reliance**: Relying on verbal confirmations rather than inspecting updated drawings.
- **Inadequate PPE rating**: Working without checking if armor class matches real arc-flash potentials.

#### 💡 CRITICAL LESSONS FOR EVERY TEAM:
1. **Never Assume Isolation**: Always perform **Test-Before-Touch** independently using the live-dead-live testing protocol.
2. **Standardize Label nomenclature**: Ensure physical cabinet designations match schematic layouts exactly.
3. **Exercise STOP WORK Authority**: If wind limits, humidity levels, or procedures look suspicious, any worker can immediately trigger a safety hold.

#### 📝 SUPERVISOR CHECKLIST PRIOR TO WORK START:
- [ ] Is physical LOTO locked and verified by two independent crew members?
- [ ] Have all multi-meters been calibrated and CAT-rated for this exact potential?
- [ ] Are we using dynamic sea-state factors if operating marine loads?
- [ ] Did everyone sign the daily Toolbox talk registration sheet?

---
*Print this bulletin and deliver it to all shifts during morning safety briefs.*`;
  }

  if (text.includes("why") || text.includes("root") || text.includes("cause")) {
    return `### 🔍 ROOT CAUSE ASSESSMENT (INTELLIGENCE REPORT)
Analyzing the root causes of the **${title}**, our engine detects three primary vectors:

1. **Immediate Physical Cause**: High energy transfer or mechanical failure directly triggered by inadequate isolation or dynamic overload.
2. **Underlying Systemic Cause**: Failure to verify isolation standards (skip test-before-touch) and out-of-date single-line electrical/crane capacity drawings.
3. **Core Organizational Root Cause**: Priority of commercial turnaround schedules over safety verification compliance, combined with delayed closure of HSE audit observations due to budget structures.

#### 📊 Confidence Metrics:
- **Structural Integrity**: **${context?.rootCauses?.confidenceScore || 85}%**
- **Evidence backing**: Strong correlation found between breaker tag locations and updated site single-line drawings.
- **Alternative possibilities**: Spontaneous breakdown is highly unlikely; current tracking marks confirm live-contact failure.`;
  }

  return `### Hello! I am your HSE IntelliInvestigate AI assistant.
I am configured with full knowledge of oil & gas, marine, construction, and power sector safety parameters (ISO 45001).

I can assist you with:
- **"Generate a Toolbox Talk"** based on the current incident details.
- **"Explain the Root Causes"** using Swiss Cheese and 5-Whys methodologies.
- **"What evidence is missing"** to elevate our Investigation Quality Index.
- **"Prepare safety stand-down briefing"** for immediate deployment.

Let me know how I can assist your investigation team!`;
}

function generateMockSafetyBulletin(incident: any): string {
  return `
# CORPORATE HSE SAFETY ALERT
**DOCUMENT ID: SHE-ALERT-2026-092** | **DATE: JUNE 28, 2026** | **REVISION: 1.0**

---

## 🚨 SUBJECT: ${incident.incidentTitle.toUpperCase()}

### 1. WHAT HAPPENED?
On ${incident.date} at approximately ${incident.time}, an incident occurred at ${incident.location} during '${incident.workActivity}'. While working on ${incident.equipmentAssets}, the crew experienced a high-potential event resulting in '${incident.incidentClassification}'. 

The immediate trigger was an uncontrolled release of energy (${incident.energySource || "Electrical/Gravitational"}) while contractors (${incident.contractor}) were performing annual maintenance under permit '${incident.permitNumber || "PTW-PENDING"}'.

---

### 2. CORE ROOT CAUSE ANALYSIS (ICAM METHODOLOGY)
Our investigation board synthesized the following underlying failures:

*   **TECHNICAL**: Degradation of primary isolation gaskets, or mechanical fatigue, which was undetected due to lack of diagnostic tooling.
*   **PROCEDURAL**: Outdated Single Line Diagrams (SLDs) and schematic nomenclatures led to isolation being placed on incorrect breakers/handles. Isolation testing was omitted.
*   **ORGANIZATIONAL**: Commercial schedule pressures led the crew to bypass key verification checkpoints to complete unloading/maintenance before maritime tides shifted or demurrage fees accumulated.

---

### 3. MANDATORY SITE DIRECTIVES (IMMEDIATE COMPLIANCE REQUIRED)

1.  **MANDATORY TEST-BEFORE-TOUCH**: No electrical or pressurized fluid system shall be touched before independent double-testing is performed and signed off by the site Lead Operator.
2.  **PHYSICAL NOMENCLATURE AUDIT**: All site supervisors must audit MCC panel tags and crane dynamic load indicators within 48 hours to ensure zero handwritten or faded labels exist.
3.  **RE-VERIFY CONTRACTOR PTW CRITERIA**: Contractor teams must undergo site-specific safety briefings, and their equipment (calibration logs, arc-flash ratings) must be physically audited prior to issuing active Permits to Work.

---
**BY ORDER OF THE CORPORATE HSE DIRECTORATE**
*Safety is our license to operate. Verify isolation, exercise your Stop Work Authority, and save lives.*
`;
}
