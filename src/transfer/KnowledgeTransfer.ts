/**
 * Knowledge Transfer System
 * システム間での知識共有を管理
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import { 
  KnowledgeTransferPackage,
  SystemChallenge,
  Solution,
  Learning,
  Pattern 
} from '../types';

export class KnowledgeTransfer {
  private transferHistory: Map<string, KnowledgeTransferPackage[]> = new Map();
  private knowledgeEndpoints: Map<string, string> = new Map();
  private compatibilityVersion: string = '1.0.0';

  constructor() {
    this.initializeEndpoints();
  }

  /**
   * 既知のエンドポイントを初期化
   */
  private initializeEndpoints(): void {
    // Example system endpoints
    this.knowledgeEndpoints.set('example-video-system', 'http://localhost:5000/api/self-evolution');
    
    // 他のシステムのエンドポイント（将来の拡張用）
    this.knowledgeEndpoints.set('example-system', 'http://localhost:3001/api/self-evolution');
  }

  /**
   * 知識パッケージの作成
   */
  public async createPackage(params: {
    sourceSystem: string;
    targetSystem: string;
    challenges: SystemChallenge[];
    solutions: Solution[];
    learnings: Learning[];
  }): Promise<KnowledgeTransferPackage> {
    const patterns = await this.extractTransferablePatterns(params.learnings);

    const transferPackage: KnowledgeTransferPackage = {
      sourceSystem: params.sourceSystem,
      targetSystem: params.targetSystem,
      challenges: this.filterRelevantChallenges(params.challenges, params.targetSystem),
      solutions: this.filterRelevantSolutions(params.solutions, params.targetSystem),
      learnings: this.filterRelevantLearnings(params.learnings, params.targetSystem),
      patterns: patterns,
      createdAt: new Date(),
      version: this.compatibilityVersion
    };

    // 転送履歴に記録
    if (!this.transferHistory.has(params.targetSystem)) {
      this.transferHistory.set(params.targetSystem, []);
    }
    this.transferHistory.get(params.targetSystem)!.push(transferPackage);

    return transferPackage;
  }

  /**
   * 転送可能なパターンの抽出
   */
  private async extractTransferablePatterns(learnings: Learning[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];
    const patternMap = new Map<string, Pattern>();

    // 学習結果からパターンを抽出
    for (const learning of learnings) {
      if (learning.outcome !== 'success') continue;

      const patternKey = this.generatePatternKey(learning);
      
      if (!patternMap.has(patternKey)) {
        const pattern = this.createPatternFromLearning(learning);
        if (pattern) {
          patternMap.set(patternKey, pattern);
        }
      } else {
        // 既存パターンの強化
        const existing = patternMap.get(patternKey)!;
        existing.usageCount++;
        existing.successRate = this.updateSuccessRate(existing, learning);
      }
    }

    // 成功率の高いパターンのみを選択
    for (const [_, pattern] of patternMap) {
      if (pattern.successRate > 0.7 && pattern.usageCount >= 2) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * 学習からパターンを作成
   */
  private createPatternFromLearning(learning: Learning): Pattern | null {
    // メトリクスの改善が見られる場合のみパターン化
    const improvements = Object.entries(learning.metrics)
      .filter(([_, value]) => value > 10);

    if (improvements.length === 0) return null;

    return {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: `改善パターン: ${improvements[0][0]}`,
      description: `${improvements[0][0]}を${improvements[0][1]}%改善`,
      trigger: {
        metrics: improvements.map(([metric, _]) => ({
          metric,
          operator: 'gt' as const,
          value: 50, // デフォルトの閾値
          duration: 300
        })),
        logs: [],
        events: [],
        combinator: 'OR' as const
      },
      solution: {
        name: '自動改善ソリューション',
        steps: learning.lessons,
        parameters: {},
        expectedOutcome: `${improvements[0][0]}の改善`
      },
      successRate: 1.0, // 初期値
      usageCount: 1
    };
  }

  /**
   * 関連する課題のフィルタリング
   */
  private filterRelevantChallenges(
    challenges: SystemChallenge[],
    targetSystem: string
  ): SystemChallenge[] {
    // ターゲットシステムに関連する課題のみを選択
    return challenges.filter(challenge => {
      // 汎用的な課題は常に含める
      if (['performance', 'error', 'security'].includes(challenge.type)) {
        return true;
      }

      // ビデオ関連の課題は、ビデオシステム間でのみ共有
      if (challenge.type === 'video-processing' && 
          (targetSystem.includes('video') || targetSystem.includes('example'))) {
        return true;
      }

      return false;
    });
  }

  /**
   * 関連する解決策のフィルタリング
   */
  private filterRelevantSolutions(
    solutions: Solution[],
    targetSystem: string
  ): Solution[] {
    return solutions.filter(solution => {
      // 高い信頼度の解決策のみ
      if (solution.confidence < 0.7) return false;

      // インフラ依存の解決策は除外
      if (solution.implementation.type === 'infrastructure' && 
          !this.isInfrastructureCompatible(targetSystem)) {
        return false;
      }

      return true;
    });
  }

  /**
   * 関連する学習のフィルタリング
   */
  private filterRelevantLearnings(
    learnings: Learning[],
    targetSystem: string
  ): Learning[] {
    return learnings.filter(learning => {
      // 成功した学習のみ
      if (learning.outcome !== 'success') return false;

      // 大幅な改善が見られた学習
      const significantImprovements = Object.values(learning.metrics)
        .filter(value => value > 20);

      return significantImprovements.length > 0;
    });
  }

  /**
   * 知識パッケージの送信
   */
  public async sendPackage(
    targetSystem: string,
    knowledgePackage: KnowledgeTransferPackage
  ): Promise<void> {
    const endpoint = this.knowledgeEndpoints.get(targetSystem);
    
    if (!endpoint) {
      // エンドポイントが設定されていない場合はファイルに保存
      await this.savePackageToFile(targetSystem, knowledgePackage);
      return;
    }

    try {
      // APIエンドポイントに送信
      const response = await axios.post(
        `${endpoint}/knowledge/import`,
        knowledgePackage,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Knowledge-Version': this.compatibilityVersion
          },
          timeout: 30000
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to transfer knowledge: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to send knowledge package to ${targetSystem}:`, error);
      // フォールバック: ファイルに保存
      await this.savePackageToFile(targetSystem, knowledgePackage);
    }
  }

  /**
   * 知識パッケージをファイルに保存
   */
  private async savePackageToFile(
    targetSystem: string,
    knowledgePackage: KnowledgeTransferPackage
  ): Promise<void> {
    const transferDir = path.join('./knowledge-transfer', targetSystem);
    await fs.mkdir(transferDir, { recursive: true });

    const filename = `transfer_${Date.now()}.json`;
    const filepath = path.join(transferDir, filename);

    await fs.writeFile(
      filepath,
      JSON.stringify(knowledgePackage, null, 2),
      'utf-8'
    );
  }

  /**
   * 知識パッケージの受信と統合
   */
  public async receivePackage(
    knowledgePackage: KnowledgeTransferPackage
  ): Promise<void> {
    // バージョン互換性チェック
    if (!this.isVersionCompatible(knowledgePackage.version)) {
      throw new Error(`Incompatible knowledge version: ${knowledgePackage.version}`);
    }

    // 知識の統合
    await this.integrateKnowledge(knowledgePackage);
  }

  /**
   * 知識の統合
   */
  private async integrateKnowledge(
    knowledgePackage: KnowledgeTransferPackage
  ): Promise<void> {
    // パターンの統合
    await this.integratePatterns(knowledgePackage.patterns);

    // 解決策の適応
    await this.adaptSolutions(knowledgePackage.solutions);

    // 学習結果の記録
    await this.recordTransferredLearnings(knowledgePackage.learnings);
  }

  /**
   * パターンの統合
   */
  public async integratePatterns(patterns: Pattern[]): Promise<void> {
    for (const pattern of patterns) {
      // 既存パターンとの重複チェック
      const existingPattern = this.findSimilarPattern(pattern);

      if (existingPattern) {
        // 既存パターンを強化
        existingPattern.successRate = 
          (existingPattern.successRate * existingPattern.usageCount + 
           pattern.successRate * pattern.usageCount) /
          (existingPattern.usageCount + pattern.usageCount);
        existingPattern.usageCount += pattern.usageCount;
      } else {
        // 新規パターンとして追加
        await this.savePattern(pattern);
      }
    }
  }

  /**
   * 解決策の適応
   */
  private async adaptSolutions(solutions: Solution[]): Promise<void> {
    for (const solution of solutions) {
      // ローカル環境に合わせて解決策を調整
      const adaptedSolution = this.adaptSolutionToLocal(solution);
      
      // 適応した解決策を保存
      await this.saveSolution(adaptedSolution);
    }
  }

  /**
   * 転送された学習の記録
   */
  private async recordTransferredLearnings(learnings: Learning[]): Promise<void> {
    for (const learning of learnings) {
      // メタデータを追加
      const transferredLearning = {
        ...learning,
        metadata: {
          transferred: true,
          transferDate: new Date(),
          originalSystem: learning.id.split('_')[0]
        }
      };

      await this.saveLearning(transferredLearning);
    }
  }

  /**
   * システム間の知識差分を計算
   */
  public async calculateKnowledgeDiff(
    systemA: string,
    systemB: string
  ): Promise<{
    uniqueToA: Pattern[];
    uniqueToB: Pattern[];
    common: Pattern[];
  }> {
    const patternsA = await this.getSystemPatterns(systemA);
    const patternsB = await this.getSystemPatterns(systemB);

    const uniqueToA: Pattern[] = [];
    const uniqueToB: Pattern[] = [];
    const common: Pattern[] = [];

    // A固有のパターン
    for (const patternA of patternsA) {
      const similar = patternsB.find(p => this.areSimilarPatterns(patternA, p));
      if (similar) {
        common.push(patternA);
      } else {
        uniqueToA.push(patternA);
      }
    }

    // B固有のパターン
    for (const patternB of patternsB) {
      const similar = patternsA.find(p => this.areSimilarPatterns(patternB, p));
      if (!similar) {
        uniqueToB.push(patternB);
      }
    }

    return { uniqueToA, uniqueToB, common };
  }

  /**
   * ヘルパーメソッド
   */
  private generatePatternKey(learning: Learning): string {
    const metrics = Object.keys(learning.metrics).sort().join('_');
    const outcome = learning.outcome;
    return `${metrics}_${outcome}`;
  }

  private updateSuccessRate(pattern: Pattern, learning: Learning): number {
    const currentTotal = pattern.successRate * pattern.usageCount;
    const newValue = learning.outcome === 'success' ? 1 : 0;
    return (currentTotal + newValue) / (pattern.usageCount + 1);
  }

  private isInfrastructureCompatible(targetSystem: string): boolean {
    // システムのインフラ互換性をチェック
    const cloudSystems = ['example-system-1', 'example-system-2'];
    return cloudSystems.includes(targetSystem);
  }

  private isVersionCompatible(version: string): boolean {
    const [major] = version.split('.');
    const [currentMajor] = this.compatibilityVersion.split('.');
    return major === currentMajor;
  }

  private findSimilarPattern(pattern: Pattern): Pattern | null {
    // 実装では既存パターンから類似のものを検索
    return null;
  }

  private adaptSolutionToLocal(solution: Solution): Solution {
    // ローカル環境に合わせて調整
    return {
      ...solution,
      id: `adapted_${solution.id}`,
      confidence: solution.confidence * 0.9 // 適応による信頼度の調整
    };
  }

  private areSimilarPatterns(patternA: Pattern, patternB: Pattern): boolean {
    // トリガー条件の類似性をチェック
    const metricsA = patternA.trigger.metrics.map(m => m.metric).sort();
    const metricsB = patternB.trigger.metrics.map(m => m.metric).sort();
    
    const commonMetrics = metricsA.filter(m => metricsB.includes(m));
    const similarity = commonMetrics.length / Math.max(metricsA.length, metricsB.length);
    
    return similarity > 0.7;
  }

  private async getSystemPatterns(system: string): Promise<Pattern[]> {
    // 実装では各システムからパターンを取得
    return [];
  }

  private async savePattern(pattern: Pattern): Promise<void> {
    const filepath = path.join('./knowledge-base/patterns', `${pattern.id}.json`);
    await fs.writeFile(filepath, JSON.stringify(pattern, null, 2));
  }

  private async saveSolution(solution: Solution): Promise<void> {
    const filepath = path.join('./knowledge-base/solutions', `${solution.id}.json`);
    await fs.writeFile(filepath, JSON.stringify(solution, null, 2));
  }

  private async saveLearning(learning: any): Promise<void> {
    const filepath = path.join('./knowledge-base/learnings', `${learning.id}.json`);
    await fs.writeFile(filepath, JSON.stringify(learning, null, 2));
  }
}