export interface Barrier {
  name: string;
  status: "active" | "failed" | "weak";
  description: string;
}

export interface BarrierAnalysis {
  preventative: Barrier[];
  mitigation: Barrier[];
}

export interface FishboneCategories {
  people: string[];
  equipment: string[];
  materials: string[];
  methods: string[];
  environment: string[];
  management: string[];
}

export interface SwissCheeseLayer {
  layerName: string;
  holeDescription: string;
  status: "breached" | "intact";
}

export interface HumanFactorItem {
  factor: string;
  level: "low" | "medium" | "high";
  description: string;
  recommendation: string;
}

export interface RootCauses {
  immediateCause: string;
  underlyingCause: string;
  rootCause: string;
  organizationalCause: string;
  confidenceScore: number;
  supportingEvidence: string;
  alternativeHypotheses: string[];
  evidenceGaps: string[];
}

export interface CAPAAction {
  id: string;
  action: string;
  type: "Immediate" | "Corrective" | "Preventive";
  ownerRole: string;
  priority: "Low" | "Medium" | "High";
  timeDays: number;
  status: "Open" | "Closed";
}

export interface QualityAssurance {
  qualityScore: number;
  missingEvidence: string[];
  contradictions: string[];
  biasCheck: string;
  recommendation: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
  category: "Pre-incident" | "Incident" | "Emergency Response" | "Recovery";
}

export interface QuestionEngineItem {
  id: string;
  question: string;
  category: string;
  evidenceTarget: string;
  answer?: string;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  incidentTitle: string;
  date: string;
  time: string;
  location: string;
  project: string;
  businessUnit: string;
  department: string;
  contractor: string;
  reporter: string;
  investigator: string;
  incidentClassification: string;
  severity: string;
  potentialSeverity: string;
  eventType: string;
  peopleInvolved: string;
  equipmentAssets: string;
  environmentalConditions: string;
  permitNumber?: string;
  jsaNumber?: string;
  loto?: string;
  simops?: string;
  shift?: string;
  weather?: string;
  workActivity?: string;
  processUnit?: string;
  energySource?: string;
  immediateControls?: string;
  witnessStatements?: string;
  status: "Draft" | "Investigating" | "Approved";
  riskRating: "Low" | "Medium" | "High";
  
  // AI Analyzed details
  fiveWhys?: string[];
  fishbone?: FishboneCategories;
  barrierAnalysis?: BarrierAnalysis;
  swissCheese?: SwissCheeseLayer[];
  humanFactors?: HumanFactorItem[];
  rootCauses?: RootCauses;
  capa?: CAPAAction[];
  qualityAssurance?: QualityAssurance;
  timeline?: TimelineEvent[];
  aiQuestions?: QuestionEngineItem[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalInvestigations: number;
  approvedRate: number;
  criticalIncidents: number;
  averageQAIndex: number;
}

