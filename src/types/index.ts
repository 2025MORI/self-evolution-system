/**
 * Type definitions for Self-Evolution System
 */

export interface SystemChallenge {
  id: string;
  type: ChallengeType;
  severity: Severity;
  description: string;
  detectedAt: Date;
  context: Record<string, any>;
  proposedSolutions: Solution[];
  status: ChallengeStatus;
  learnings: Learning[];
  source: 'auto' | 'manual' | 'monitor';
}

export type ChallengeType = 
  | 'performance'
  | 'error'
  | 'security'
  | 'scalability'
  | 'usability'
  | 'integration'
  | 'data-quality'
  | 'video-processing';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ChallengeStatus = 
  | 'pending'
  | 'analyzing' 
  | 'ready'
  | 'executing'
  | 'resolved'
  | 'failed';

export interface Solution {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  implementation: Implementation;
  confidence: number; // 0-1
  estimatedImpact: Impact;
  prerequisites: string[];
  risks: Risk[];
  createdAt: Date;
  executionTime?: number;
}

export interface Implementation {
  type: 'code' | 'config' | 'process' | 'infrastructure';
  steps: ExecutionStep[];
  rollbackPlan: ExecutionStep[];
  estimatedDuration: number; // minutes
}

export interface ExecutionStep {
  order: number;
  action: string;
  target: string;
  parameters: Record<string, any>;
  validation: ValidationRule[];
}

export interface ValidationRule {
  type: 'metric' | 'log' | 'test' | 'health-check';
  expected: any;
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'matches';
}

export interface Impact {
  performance: number; // -100 to +100
  reliability: number;
  userExperience: number;
  cost: number;
  security: number;
}

export interface Risk {
  description: string;
  probability: number; // 0-1
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface Learning {
  id: string;
  challengeId: string;
  solutionId: string;
  outcome: 'success' | 'failure' | 'partial';
  metrics: Record<string, number>;
  lessons: string[];
  timestamp: Date;
  affectedComponents: string[];
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  diskUsage: number;
  networkLatency: number;
  errorRate: number;
  responseTime: number;
  activeUsers: number;
  videoProcessingQueue: number;
}

export interface MonitoringConfig {
  interval: number; // seconds
  thresholds: {
    cpu: number;
    memory: number;
    errorRate: number;
    responseTime: number;
  };
  alertChannels: AlertChannel[];
}

export interface AlertChannel {
  type: 'console' | 'file' | 'email' | 'webhook';
  config: Record<string, any>;
}

export interface KnowledgeTransferPackage {
  sourceSystem: string;
  targetSystem: string;
  challenges: SystemChallenge[];
  solutions: Solution[];
  learnings: Learning[];
  patterns: Pattern[];
  createdAt: Date;
  version: string;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  trigger: TriggerCondition;
  solution: SolutionTemplate;
  successRate: number;
  usageCount: number;
}

export interface TriggerCondition {
  metrics?: MetricCondition[];
  logs?: LogCondition[];
  events?: EventCondition[];
  combinator: 'AND' | 'OR';
}

export interface MetricCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration?: number; // seconds
}

export interface LogCondition {
  pattern: string;
  level: 'error' | 'warn' | 'info';
  frequency: number;
  timeWindow: number; // seconds
}

export interface EventCondition {
  event: string;
  properties?: Record<string, any>;
}

export interface SolutionTemplate {
  name: string;
  steps: string[];
  parameters: Record<string, any>;
  expectedOutcome: string;
}