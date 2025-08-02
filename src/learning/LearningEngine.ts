/**
 * Learning Engine
 * 実行結果から学習し、パターンを抽出
 */

import { 
  Learning, 
  SystemChallenge, 
  Solution, 
  Pattern,
  TriggerCondition,
  SolutionTemplate 
} from '../types';

export class LearningEngine {
  private patterns: Map<string, Pattern> = new Map();
  private learningHistory: Learning[] = [];
  private successThreshold: number = 0.7;

  constructor() {
    this.initializeBasePatterns();
  }

  /**
   * 基本パターンの初期化
   */
  private initializeBasePatterns(): void {
    // 基本的な成功パターンを登録
    this.patterns.set('high-cpu-scale', {
      id: 'high-cpu-scale',
      name: 'CPU高負荷時のスケーリング',
      description: 'CPU使用率が高い時に水平スケーリングを実行',
      trigger: {
        metrics: [
          { metric: 'cpu', operator: 'gt', value: 80, duration: 300 }
        ],
        logs: [],
        events: [],
        combinator: 'AND'
      },
      solution: {
        name: '自動水平スケーリング',
        steps: [
          'メトリクスの確認',
          'インスタンスの追加',
          'ロードバランサーの更新',
          'ヘルスチェック'
        ],
        parameters: {
          scaleUpCount: 2,
          cooldownPeriod: 300
        },
        expectedOutcome: 'CPU使用率が70%以下に低下'
      },
      successRate: 0.85,
      usageCount: 0
    });

    this.patterns.set('memory-leak-restart', {
      id: 'memory-leak-restart',
      name: 'メモリリーク対応',
      description: 'メモリ使用率が継続的に上昇した場合の再起動',
      trigger: {
        metrics: [
          { metric: 'memory', operator: 'gt', value: 85, duration: 600 }
        ],
        logs: [],
        events: [],
        combinator: 'AND'
      },
      solution: {
        name: 'グレースフル再起動',
        steps: [
          'メモリダンプの取得',
          'トラフィックの切り離し',
          'アプリケーションの再起動',
          'ヘルスチェック',
          'トラフィックの復帰'
        ],
        parameters: {
          gracePeriod: 30,
          healthCheckRetries: 5
        },
        expectedOutcome: 'メモリ使用率が正常範囲に復帰'
      },
      successRate: 0.9,
      usageCount: 0
    });

    this.patterns.set('video-queue-optimization', {
      id: 'video-queue-optimization',
      name: '動画処理キューの最適化',
      description: 'キューが詰まった場合の処理最適化',
      trigger: {
        metrics: [
          { metric: 'videoProcessingQueue', operator: 'gt', value: 100 }
        ],
        logs: [],
        events: [],
        combinator: 'AND'
      },
      solution: {
        name: '動画処理の並列化',
        steps: [
          'ワーカー数の増加',
          '処理優先度の調整',
          'バッチサイズの最適化'
        ],
        parameters: {
          workerCount: 5,
          batchSize: 10,
          priorityAlgorithm: 'fifo'
        },
        expectedOutcome: 'キュー長が50以下に減少'
      },
      successRate: 0.75,
      usageCount: 0
    });
  }

  /**
   * 関連する解決策を検索
   */
  public async findRelevantSolutions(
    challenge: SystemChallenge,
    learnings: Learning[]
  ): Promise<Solution[]> {
    const relevantLearnings = this.filterRelevantLearnings(challenge, learnings);
    const successfulSolutions = this.extractSuccessfulSolutions(relevantLearnings);
    
    // 成功率でソート
    return successfulSolutions.sort((a, b) => {
      const aSuccess = this.calculateSolutionSuccessRate(a, relevantLearnings);
      const bSuccess = this.calculateSolutionSuccessRate(b, relevantLearnings);
      return bSuccess - aSuccess;
    });
  }

  /**
   * 関連する学習をフィルタリング
   */
  private filterRelevantLearnings(
    challenge: SystemChallenge,
    learnings: Learning[]
  ): Learning[] {
    return learnings.filter(learning => {
      // チャレンジタイプが一致
      const relatedChallenge = this.findChallengeById(learning.challengeId);
      if (!relatedChallenge || relatedChallenge.type !== challenge.type) {
        return false;
      }

      // コンテキストの類似性
      const similarity = this.calculateContextSimilarity(
        challenge.context,
        relatedChallenge.context
      );

      return similarity > 0.6;
    });
  }

  /**
   * 成功した解決策を抽出
   */
  private extractSuccessfulSolutions(learnings: Learning[]): Solution[] {
    const solutions: Map<string, Solution> = new Map();

    for (const learning of learnings) {
      if (learning.outcome === 'success' || 
          (learning.outcome === 'partial' && this.isPartialSuccessAcceptable(learning))) {
        const solution = this.findSolutionById(learning.solutionId);
        if (solution) {
          solutions.set(solution.id, solution);
        }
      }
    }

    return Array.from(solutions.values());
  }

  /**
   * 成功率の計算
   */
  public async calculateSuccessRate(
    solution: Solution,
    learnings: Learning[]
  ): Promise<number> {
    const relevantLearnings = learnings.filter(l => 
      this.isSimilarSolution(l.solutionId, solution)
    );

    if (relevantLearnings.length === 0) {
      // 過去の実績がない場合は、類似パターンから推定
      return this.estimateSuccessRateFromPatterns(solution);
    }

    const successCount = relevantLearnings.filter(l => 
      l.outcome === 'success'
    ).length;

    const partialSuccessCount = relevantLearnings.filter(l => 
      l.outcome === 'partial'
    ).length;

    const totalCount = relevantLearnings.length;
    
    return (successCount + partialSuccessCount * 0.5) / totalCount;
  }

  /**
   * パターンの抽出
   */
  public async extractPatterns(learnings: Learning[]): Promise<Pattern[]> {
    const newPatterns: Pattern[] = [];
    
    // 成功した学習をグループ化
    const successGroups = this.groupSuccessfulLearnings(learnings);
    
    for (const [key, group] of successGroups) {
      if (group.length >= 3) { // 3回以上成功したパターンのみ
        const pattern = this.createPatternFromGroup(key, group);
        if (pattern && pattern.successRate >= this.successThreshold) {
          newPatterns.push(pattern);
          this.patterns.set(pattern.id, pattern);
        }
      }
    }

    // 既存パターンの更新
    this.updateExistingPatterns(learnings);

    return newPatterns;
  }

  /**
   * 成功した学習のグループ化
   */
  private groupSuccessfulLearnings(
    learnings: Learning[]
  ): Map<string, Learning[]> {
    const groups = new Map<string, Learning[]>();

    for (const learning of learnings) {
      if (learning.outcome !== 'success') continue;

      const challenge = this.findChallengeById(learning.challengeId);
      if (!challenge) continue;

      const key = this.generateGroupKey(challenge, learning);
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(learning);
    }

    return groups;
  }

  /**
   * グループからパターンを作成
   */
  private createPatternFromGroup(
    key: string,
    group: Learning[]
  ): Pattern | null {
    if (group.length === 0) return null;

    const firstLearning = group[0];
    const challenge = this.findChallengeById(firstLearning.challengeId);
    const solution = this.findSolutionById(firstLearning.solutionId);

    if (!challenge || !solution) return null;

    // 共通のトリガー条件を抽出
    const trigger = this.extractCommonTrigger(group);
    
    // 成功率の計算
    const successRate = this.calculateGroupSuccessRate(group);

    return {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: `${challenge.type}の自動解決パターン`,
      description: solution.description,
      trigger,
      solution: {
        name: solution.title,
        steps: solution.implementation.steps.map(s => s.action),
        parameters: this.extractCommonParameters(group),
        expectedOutcome: this.extractExpectedOutcome(group)
      },
      successRate,
      usageCount: group.length
    };
  }

  /**
   * 共通のトリガー条件を抽出
   */
  private extractCommonTrigger(group: Learning[]): TriggerCondition {
    const metrics: any[] = [];
    
    // メトリクスベースのトリガーを分析
    for (const learning of group) {
      const challenge = this.findChallengeById(learning.challengeId);
      if (challenge && challenge.context.metrics) {
        Object.entries(challenge.context.metrics).forEach(([key, value]) => {
          if (typeof value === 'number' && value > 0) {
            metrics.push({
              metric: key,
              operator: 'gt',
              value: value * 0.8, // 80%の閾値
              duration: 300
            });
          }
        });
      }
    }

    return {
      metrics: this.deduplicateMetrics(metrics),
      logs: [],
      events: [],
      combinator: 'AND'
    };
  }

  /**
   * 共通パラメータの抽出
   */
  private extractCommonParameters(group: Learning[]): Record<string, any> {
    const params: Record<string, any> = {};
    
    // 最も成功した設定を採用
    const bestLearning = group.reduce((best, current) => {
      const currentScore = this.calculateLearningScore(current);
      const bestScore = this.calculateLearningScore(best);
      return currentScore > bestScore ? current : best;
    });

    const solution = this.findSolutionById(bestLearning.solutionId);
    if (solution) {
      solution.implementation.steps.forEach(step => {
        Object.assign(params, step.parameters);
      });
    }

    return params;
  }

  /**
   * 期待される結果の抽出
   */
  private extractExpectedOutcome(group: Learning[]): string {
    // 最も一般的な改善項目を特定
    const improvements: Record<string, number> = {};
    
    for (const learning of group) {
      Object.entries(learning.metrics).forEach(([key, value]) => {
        if (value > 0) {
          improvements[key] = (improvements[key] || 0) + 1;
        }
      });
    }

    const topImprovement = Object.entries(improvements)
      .sort(([, a], [, b]) => b - a)[0];

    if (topImprovement) {
      return `${topImprovement[0]}の改善`;
    }

    return '問題の解決';
  }

  /**
   * 知識の更新
   */
  public async updateKnowledge(learning: Learning): Promise<void> {
    this.learningHistory.push(learning);
    
    // 関連パターンの更新
    const relatedPatterns = this.findRelatedPatterns(learning);
    
    for (const pattern of relatedPatterns) {
      if (learning.outcome === 'success') {
        pattern.successRate = 
          (pattern.successRate * pattern.usageCount + 1) / 
          (pattern.usageCount + 1);
      } else if (learning.outcome === 'failure') {
        pattern.successRate = 
          (pattern.successRate * pattern.usageCount) / 
          (pattern.usageCount + 1);
      }
      pattern.usageCount++;
    }

    // 新しいパターンの可能性を検討
    if (this.learningHistory.length % 10 === 0) {
      await this.extractPatterns(this.learningHistory.slice(-50));
    }
  }

  /**
   * ヘルパーメソッド
   */
  private findChallengeById(id: string): SystemChallenge | null {
    // 実際の実装では適切なストレージから取得
    return null;
  }

  private findSolutionById(id: string): Solution | null {
    // 実際の実装では適切なストレージから取得
    return null;
  }

  private calculateContextSimilarity(
    context1: Record<string, any>,
    context2: Record<string, any>
  ): number {
    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    const commonKeys = keys1.filter(k => keys2.includes(k));
    
    if (commonKeys.length === 0) return 0;

    let similarity = 0;
    for (const key of commonKeys) {
      if (context1[key] === context2[key]) {
        similarity += 1;
      } else if (
        typeof context1[key] === 'number' && 
        typeof context2[key] === 'number'
      ) {
        const ratio = Math.min(context1[key], context2[key]) / 
                     Math.max(context1[key], context2[key]);
        similarity += ratio;
      }
    }

    return similarity / Math.max(keys1.length, keys2.length);
  }

  private isSimilarSolution(solutionId: string, solution: Solution): boolean {
    // 実際の実装では詳細な比較
    return solutionId === solution.id;
  }

  private isPartialSuccessAcceptable(learning: Learning): boolean {
    // 部分的成功が受け入れ可能かどうかの判定
    const positiveMetrics = Object.values(learning.metrics)
      .filter(v => v > 0).length;
    const totalMetrics = Object.keys(learning.metrics).length;
    
    return positiveMetrics / totalMetrics > 0.5;
  }

  private estimateSuccessRateFromPatterns(solution: Solution): number {
    // パターンから成功率を推定
    let totalRate = 0;
    let count = 0;

    for (const [_, pattern] of this.patterns) {
      if (this.isSolutionRelatedToPattern(solution, pattern)) {
        totalRate += pattern.successRate;
        count++;
      }
    }

    return count > 0 ? totalRate / count : 0.5; // デフォルト50%
  }

  private isSolutionRelatedToPattern(
    solution: Solution,
    pattern: Pattern
  ): boolean {
    // 解決策とパターンの関連性を判定
    const solutionSteps = solution.implementation.steps.map(s => s.action);
    const patternSteps = pattern.solution.steps;
    
    const commonSteps = solutionSteps.filter(s => 
      patternSteps.some(ps => ps.includes(s) || s.includes(ps))
    );

    return commonSteps.length / Math.max(solutionSteps.length, patternSteps.length) > 0.5;
  }

  private calculateSolutionSuccessRate(
    solution: Solution,
    learnings: Learning[]
  ): number {
    const relevantLearnings = learnings.filter(l => l.solutionId === solution.id);
    if (relevantLearnings.length === 0) return solution.confidence;

    const successCount = relevantLearnings.filter(l => l.outcome === 'success').length;
    return successCount / relevantLearnings.length;
  }

  private generateGroupKey(challenge: SystemChallenge, learning: Learning): string {
    return `${challenge.type}_${challenge.severity}_${learning.outcome}`;
  }

  private deduplicateMetrics(metrics: any[]): any[] {
    const unique = new Map();
    
    for (const metric of metrics) {
      const key = `${metric.metric}_${metric.operator}`;
      if (!unique.has(key) || metric.value > unique.get(key).value) {
        unique.set(key, metric);
      }
    }

    return Array.from(unique.values());
  }

  private calculateGroupSuccessRate(group: Learning[]): number {
    const totalImprovement = group.reduce((sum, learning) => {
      const improvements = Object.values(learning.metrics)
        .filter(v => v > 0)
        .reduce((a, b) => a + b, 0);
      return sum + improvements;
    }, 0);

    return Math.min(totalImprovement / (group.length * 100), 1);
  }

  private calculateLearningScore(learning: Learning): number {
    const metricScore = Object.values(learning.metrics)
      .filter(v => v > 0)
      .reduce((a, b) => a + b, 0);
    
    const outcomeScore = 
      learning.outcome === 'success' ? 100 : 
      learning.outcome === 'partial' ? 50 : 0;

    return metricScore + outcomeScore;
  }

  private findRelatedPatterns(learning: Learning): Pattern[] {
    const related: Pattern[] = [];
    const challenge = this.findChallengeById(learning.challengeId);
    
    if (!challenge) return related;

    for (const [_, pattern] of this.patterns) {
      if (this.matchesPatternTrigger(challenge, pattern.trigger)) {
        related.push(pattern);
      }
    }

    return related;
  }

  private matchesPatternTrigger(
    challenge: SystemChallenge,
    trigger: TriggerCondition
  ): boolean {
    // トリガー条件のマッチング
    if (trigger.metrics.length > 0) {
      for (const metric of trigger.metrics) {
        const value = challenge.context[metric.metric];
        if (typeof value !== 'number') return false;
        
        switch (metric.operator) {
          case 'gt': if (value <= metric.value) return false; break;
          case 'lt': if (value >= metric.value) return false; break;
          case 'eq': if (value !== metric.value) return false; break;
          case 'gte': if (value < metric.value) return false; break;
          case 'lte': if (value > metric.value) return false; break;
        }
      }
    }

    return true;
  }

  private updateExistingPatterns(learnings: Learning[]): void {
    // 既存パターンの成功率を更新
    for (const learning of learnings) {
      const relatedPatterns = this.findRelatedPatterns(learning);
      
      for (const pattern of relatedPatterns) {
        const weight = 0.1; // 学習の重み
        const newSuccessValue = learning.outcome === 'success' ? 1 : 0;
        
        pattern.successRate = 
          pattern.successRate * (1 - weight) + newSuccessValue * weight;
      }
    }
  }
}