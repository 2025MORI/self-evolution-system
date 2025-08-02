/**
 * Core Self-Evolution System
 * 動画マニュアルシステムの自己発展を管理するコアシステム
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import * as cron from 'node-cron';
import { VideoSystemMonitor } from '../monitors/VideoSystemMonitor';
import { SolutionGenerator } from '../generators/SolutionGenerator';
import { LearningEngine } from '../learning/LearningEngine';
import { KnowledgeTransfer } from '../transfer/KnowledgeTransfer';
import { 
  SystemChallenge, 
  Solution, 
  Learning, 
  SystemMetrics,
  ChallengeStatus,
  MonitoringConfig 
} from '../types';

export class SelfEvolutionSystem extends EventEmitter {
  private challenges: Map<string, SystemChallenge> = new Map();
  private solutions: Map<string, Solution[]> = new Map();
  private learnings: Learning[] = [];
  private knowledgeBasePath: string;
  private monitor: VideoSystemMonitor;
  private solutionGenerator: SolutionGenerator;
  private learningEngine: LearningEngine;
  private knowledgeTransfer: KnowledgeTransfer;
  private isRunning: boolean = false;
  private executionQueue: string[] = [];
  private cronJobs: cron.ScheduledTask[] = [];

  constructor(knowledgeBasePath: string = './knowledge-base') {
    super();
    this.knowledgeBasePath = knowledgeBasePath;
    this.monitor = new VideoSystemMonitor();
    this.solutionGenerator = new SolutionGenerator();
    this.learningEngine = new LearningEngine();
    this.knowledgeTransfer = new KnowledgeTransfer();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // ナレッジベースディレクトリの作成
    await this.ensureKnowledgeBase();
    
    // 既存の知識を読み込む
    await this.loadKnowledgeBase();
    
    // モニターのセットアップ
    this.setupMonitoring();
    
    // 定期的な自己診断のスケジューリング
    this.scheduleSelfDiagnosis();
    
    // 学習サイクルの開始
    this.startLearningCycle();
    
    this.isRunning = true;
    this.emit('system:initialized');
  }

  private async ensureKnowledgeBase(): Promise<void> {
    try {
      await fs.mkdir(this.knowledgeBasePath, { recursive: true });
      await fs.mkdir(path.join(this.knowledgeBasePath, 'challenges'), { recursive: true });
      await fs.mkdir(path.join(this.knowledgeBasePath, 'solutions'), { recursive: true });
      await fs.mkdir(path.join(this.knowledgeBasePath, 'learnings'), { recursive: true });
      await fs.mkdir(path.join(this.knowledgeBasePath, 'patterns'), { recursive: true });
    } catch (error) {
      console.error('Failed to create knowledge base directories:', error);
    }
  }

  private async loadKnowledgeBase(): Promise<void> {
    try {
      // Load challenges
      const challengesDir = path.join(this.knowledgeBasePath, 'challenges');
      const challengeFiles = await fs.readdir(challengesDir);
      
      for (const file of challengeFiles) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(challengesDir, file), 'utf-8');
          const challenge = JSON.parse(content) as SystemChallenge;
          this.challenges.set(challenge.id, challenge);
        }
      }

      // Load learnings
      const learningsDir = path.join(this.knowledgeBasePath, 'learnings');
      const learningFiles = await fs.readdir(learningsDir);
      
      for (const file of learningFiles) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(learningsDir, file), 'utf-8');
          const learning = JSON.parse(content) as Learning;
          this.learnings.push(learning);
        }
      }

      this.emit('knowledge:loaded', {
        challenges: this.challenges.size,
        learnings: this.learnings.length
      });
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  }

  private setupMonitoring(): void {
    // システムメトリクスの監視
    this.monitor.on('metrics:collected', (metrics: SystemMetrics) => {
      this.analyzeMetrics(metrics);
    });

    // エラーログの監視
    this.monitor.on('error:detected', (error: any) => {
      this.recordChallenge({
        type: 'error',
        severity: 'high',
        description: error.message || 'Unknown error detected',
        context: { error, stack: error.stack }
      });
    });

    // パフォーマンス問題の検出
    this.monitor.on('performance:degraded', (data: any) => {
      this.recordChallenge({
        type: 'performance',
        severity: data.severity || 'medium',
        description: `Performance degradation detected: ${data.metric}`,
        context: data
      });
    });

    // 動画処理の問題
    this.monitor.on('video:processing:failed', (data: any) => {
      this.recordChallenge({
        type: 'video-processing',
        severity: 'high',
        description: `Video processing failed: ${data.videoId}`,
        context: data
      });
    });

    this.monitor.start();
  }

  private analyzeMetrics(metrics: SystemMetrics): void {
    // CPU使用率が高い
    if (metrics.cpu > 80) {
      this.recordChallenge({
        type: 'performance',
        severity: metrics.cpu > 90 ? 'critical' : 'high',
        description: `High CPU usage detected: ${metrics.cpu}%`,
        context: { metrics, component: 'system' }
      });
    }

    // メモリ使用率が高い
    if (metrics.memory > 85) {
      this.recordChallenge({
        type: 'performance',
        severity: metrics.memory > 95 ? 'critical' : 'high',
        description: `High memory usage detected: ${metrics.memory}%`,
        context: { metrics, component: 'system' }
      });
    }

    // エラー率が高い
    if (metrics.errorRate > 5) {
      this.recordChallenge({
        type: 'error',
        severity: metrics.errorRate > 10 ? 'critical' : 'high',
        description: `High error rate detected: ${metrics.errorRate}%`,
        context: { metrics, component: 'application' }
      });
    }

    // レスポンスタイムが遅い
    if (metrics.responseTime > 1000) {
      this.recordChallenge({
        type: 'performance',
        severity: metrics.responseTime > 3000 ? 'high' : 'medium',
        description: `Slow response time detected: ${metrics.responseTime}ms`,
        context: { metrics, component: 'api' }
      });
    }

    // 動画処理キューが詰まっている
    if (metrics.videoProcessingQueue > 50) {
      this.recordChallenge({
        type: 'video-processing',
        severity: metrics.videoProcessingQueue > 100 ? 'high' : 'medium',
        description: `Video processing queue backlog: ${metrics.videoProcessingQueue} items`,
        context: { metrics, component: 'video-processor' }
      });
    }
  }

  /**
   * 課題を記録
   */
  public recordChallenge(challenge: Partial<SystemChallenge>): string {
    const id = this.generateChallengeId(challenge.description || '');
    
    // 既存の類似課題をチェック
    const existingChallenge = this.findSimilarChallenge(challenge);
    if (existingChallenge) {
      // 既存の課題を更新
      existingChallenge.context.occurrences = (existingChallenge.context.occurrences || 1) + 1;
      existingChallenge.context.lastOccurred = new Date();
      return existingChallenge.id;
    }

    const fullChallenge: SystemChallenge = {
      id,
      type: challenge.type || 'error',
      severity: challenge.severity || 'medium',
      description: challenge.description || '',
      detectedAt: new Date(),
      context: challenge.context || {},
      proposedSolutions: [],
      status: 'pending',
      learnings: [],
      source: challenge.source || 'auto',
      ...challenge
    };

    this.challenges.set(id, fullChallenge);
    this.emit('challenge:recorded', fullChallenge);
    
    // 自動的に分析を開始
    this.analyzeChallenge(id);
    
    // 知識ベースに保存
    this.saveChallenge(fullChallenge);
    
    return id;
  }

  private findSimilarChallenge(challenge: Partial<SystemChallenge>): SystemChallenge | null {
    for (const [_, existing] of this.challenges) {
      if (existing.type === challenge.type && 
          existing.status !== 'resolved' &&
          this.calculateSimilarity(existing.description, challenge.description || '') > 0.8) {
        return existing;
      }
    }
    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  /**
   * 課題を分析し、解決策を生成
   */
  private async analyzeChallenge(challengeId: string): Promise<void> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return;

    challenge.status = 'analyzing';
    this.emit('challenge:analyzing', challenge);

    try {
      // 過去の学習から関連する解決策を検索
      const historicalSolutions = await this.learningEngine.findRelevantSolutions(
        challenge,
        this.learnings
      );

      // 新しい解決策を生成
      const generatedSolutions = await this.solutionGenerator.generate(
        challenge,
        historicalSolutions
      );

      // 解決策を評価・ランク付け
      const rankedSolutions = await this.evaluateSolutions(
        challenge,
        generatedSolutions
      );

      challenge.proposedSolutions = rankedSolutions;
      this.solutions.set(challengeId, rankedSolutions);
      
      challenge.status = 'ready';
      this.emit('challenge:ready', { challenge, solutions: rankedSolutions });

      // 自動実行が可能な場合
      if (this.shouldAutoExecute(challenge, rankedSolutions[0])) {
        this.executionQueue.push(challengeId);
        this.processExecutionQueue();
      }
    } catch (error) {
      challenge.status = 'failed';
      this.emit('challenge:failed', { challenge, error });
    }
  }

  private async evaluateSolutions(
    challenge: SystemChallenge,
    solutions: Solution[]
  ): Promise<Solution[]> {
    const evaluated = await Promise.all(
      solutions.map(async (solution) => {
        // 過去の実行結果から信頼度を計算
        const historicalSuccess = await this.learningEngine.calculateSuccessRate(
          solution,
          this.learnings
        );

        // リスク評価
        const riskScore = this.calculateRiskScore(solution);

        // 最終的な信頼度
        solution.confidence = (historicalSuccess * 0.7 + (1 - riskScore) * 0.3);

        return solution;
      })
    );

    // 信頼度でソート
    return evaluated.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateRiskScore(solution: Solution): number {
    let riskScore = 0;
    
    for (const risk of solution.risks) {
      const probabilityWeight = risk.probability;
      const impactWeight = risk.impact === 'high' ? 1 : risk.impact === 'medium' ? 0.5 : 0.2;
      riskScore += probabilityWeight * impactWeight;
    }

    return Math.min(riskScore / solution.risks.length, 1);
  }

  private shouldAutoExecute(challenge: SystemChallenge, solution: Solution): boolean {
    // 自動実行の条件
    return (
      solution.confidence > 0.8 &&
      challenge.severity !== 'critical' &&
      solution.risks.every(r => r.impact !== 'high') &&
      this.isRunning
    );
  }

  private async processExecutionQueue(): Promise<void> {
    if (this.executionQueue.length === 0) return;

    const challengeId = this.executionQueue.shift();
    if (!challengeId) return;

    const challenge = this.challenges.get(challengeId);
    const solutions = this.solutions.get(challengeId);
    
    if (!challenge || !solutions || solutions.length === 0) return;

    await this.executeSolution(challengeId, solutions[0].id);

    // 次のタスクを処理
    if (this.executionQueue.length > 0) {
      setTimeout(() => this.processExecutionQueue(), 5000);
    }
  }

  /**
   * 解決策を実行
   */
  public async executeSolution(challengeId: string, solutionId: string): Promise<void> {
    const challenge = this.challenges.get(challengeId);
    const solutions = this.solutions.get(challengeId);
    const solution = solutions?.find(s => s.id === solutionId);

    if (!challenge || !solution) {
      throw new Error('Challenge or solution not found');
    }

    challenge.status = 'executing';
    this.emit('solution:executing', { challenge, solution });

    const startTime = Date.now();
    const learning: Learning = {
      id: this.generateLearningId(),
      challengeId,
      solutionId,
      outcome: 'failure',
      metrics: {},
      lessons: [],
      timestamp: new Date(),
      affectedComponents: []
    };

    try {
      // 実行前のメトリクスを記録
      const beforeMetrics = await this.monitor.getCurrentMetrics();

      // 解決策の実行
      for (const step of solution.implementation.steps) {
        await this.executeStep(step, learning);
      }

      // 実行後のメトリクスを記録
      const afterMetrics = await this.monitor.getCurrentMetrics();

      // 改善を測定
      learning.metrics = this.calculateImprovement(beforeMetrics, afterMetrics);
      
      // 成功判定
      if (this.isSuccessful(learning.metrics, solution.estimatedImpact)) {
        learning.outcome = 'success';
        challenge.status = 'resolved';
        learning.lessons.push(`Successfully resolved: ${challenge.description}`);
      } else {
        learning.outcome = 'partial';
        learning.lessons.push('Solution partially effective, further optimization needed');
      }

    } catch (error: any) {
      learning.outcome = 'failure';
      learning.lessons.push(`Execution failed: ${error.message}`);
      
      // ロールバック
      try {
        for (const step of solution.implementation.rollbackPlan) {
          await this.executeStep(step, learning);
        }
      } catch (rollbackError) {
        learning.lessons.push('Rollback also failed');
      }

      challenge.status = 'failed';
    }

    solution.executionTime = Date.now() - startTime;
    
    // 学習を記録
    this.learnings.push(learning);
    challenge.learnings.push(learning);
    
    // 学習を保存
    await this.saveLearning(learning);
    
    // イベントを発行
    this.emit('solution:completed', { challenge, solution, learning });
    
    // 学習エンジンを更新
    await this.learningEngine.updateKnowledge(learning);
  }

  private async executeStep(step: ExecutionStep, learning: Learning): Promise<void> {
    // ステップの実行（実際の実装は各ターゲットに応じて）
    learning.affectedComponents.push(step.target);
    
    // バリデーション
    for (const validation of step.validation) {
      // バリデーションロジック
    }
  }

  private calculateImprovement(before: SystemMetrics, after: SystemMetrics): Record<string, number> {
    return {
      cpuImprovement: ((before.cpu - after.cpu) / before.cpu) * 100,
      memoryImprovement: ((before.memory - after.memory) / before.memory) * 100,
      responseTimeImprovement: ((before.responseTime - after.responseTime) / before.responseTime) * 100,
      errorRateImprovement: ((before.errorRate - after.errorRate) / Math.max(before.errorRate, 0.1)) * 100
    };
  }

  private isSuccessful(metrics: Record<string, number>, expectedImpact: Impact): boolean {
    const improvements = Object.values(metrics).filter(v => v > 0);
    return improvements.length > 0 && improvements.some(v => v > 10);
  }

  /**
   * 定期的な自己診断
   */
  private scheduleSelfDiagnosis(): void {
    // 毎時間実行
    const job = cron.schedule('0 * * * *', async () => {
      await this.performSelfDiagnosis();
    });
    
    this.cronJobs.push(job);
  }

  private async performSelfDiagnosis(): Promise<void> {
    this.emit('diagnosis:started');

    // システムヘルスチェック
    const health = await this.getSystemHealth();
    
    // 潜在的な問題を検出
    if (health.successRate < 0.7) {
      this.recordChallenge({
        type: 'performance',
        severity: 'medium',
        description: 'Low solution success rate detected',
        context: { health }
      });
    }

    if (health.pendingChallenges > 10) {
      this.recordChallenge({
        type: 'scalability',
        severity: 'medium',
        description: 'High number of pending challenges',
        context: { health }
      });
    }

    this.emit('diagnosis:completed', health);
  }

  /**
   * 学習サイクル
   */
  private startLearningCycle(): void {
    // 30分ごとに学習を実行
    const job = cron.schedule('*/30 * * * *', async () => {
      await this.performLearning();
    });
    
    this.cronJobs.push(job);
  }

  private async performLearning(): Promise<void> {
    this.emit('learning:started');

    // パターンの抽出
    const patterns = await this.learningEngine.extractPatterns(this.learnings);
    
    // 知識の統合
    await this.knowledgeTransfer.integratePatterns(patterns);
    
    // 解決策ジェネレーターの更新
    await this.solutionGenerator.updatePatterns(patterns);

    this.emit('learning:completed', { patternsExtracted: patterns.length });
  }

  /**
   * システムヘルスの取得
   */
  public async getSystemHealth(): Promise<any> {
    const totalChallenges = this.challenges.size;
    const resolvedChallenges = Array.from(this.challenges.values())
      .filter(c => c.status === 'resolved').length;
    const pendingChallenges = Array.from(this.challenges.values())
      .filter(c => c.status === 'pending').length;
    
    const successfulLearnings = this.learnings.filter(l => l.outcome === 'success').length;
    const totalLearnings = this.learnings.length;

    return {
      totalChallenges,
      resolvedChallenges,
      pendingChallenges,
      successRate: totalLearnings > 0 ? successfulLearnings / totalLearnings : 0,
      isRunning: this.isRunning,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      knowledgeBaseSize: {
        challenges: this.challenges.size,
        learnings: this.learnings.length
      }
    };
  }

  /**
   * 知識の共有
   */
  public async shareKnowledge(targetSystem: string): Promise<void> {
    const knowledgePackage = await this.knowledgeTransfer.createPackage({
      sourceSystem: 'self-evolution-system',
      targetSystem,
      challenges: Array.from(this.challenges.values()),
      solutions: Array.from(this.solutions.values()).flat(),
      learnings: this.learnings
    });

    await this.knowledgeTransfer.sendPackage(targetSystem, knowledgePackage);
    this.emit('knowledge:shared', { targetSystem, packageSize: knowledgePackage.challenges.length });
  }

  /**
   * ヘルパーメソッド
   */
  private generateChallengeId(description: string): string {
    const timestamp = Date.now();
    const hash = createHash('md5').update(`${description}${timestamp}`).digest('hex');
    return `challenge_${hash.substring(0, 8)}`;
  }

  private generateLearningId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `learning_${timestamp}_${random}`;
  }

  private async saveChallenge(challenge: SystemChallenge): Promise<void> {
    const filePath = path.join(this.knowledgeBasePath, 'challenges', `${challenge.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(challenge, null, 2));
  }

  private async saveLearning(learning: Learning): Promise<void> {
    const filePath = path.join(this.knowledgeBasePath, 'learnings', `${learning.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(learning, null, 2));
  }

  /**
   * システムの停止
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    
    // cronジョブの停止
    for (const job of this.cronJobs) {
      job.stop();
    }
    
    // モニターの停止
    await this.monitor.stop();
    
    this.emit('system:stopped');
  }
}