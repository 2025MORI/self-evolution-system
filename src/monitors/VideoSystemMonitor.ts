/**
 * Video System Monitor
 * 動画マニュアルシステムの状態を監視
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SystemMetrics } from '../types';

export class VideoSystemMonitor extends EventEmitter {
  private interval: NodeJS.Timer | null = null;
  private metricsInterval: number = 30000; // 30秒
  private logWatchers: Map<string, fs.FileHandle> = new Map();
  private isMonitoring: boolean = false;

  constructor() {
    super();
  }

  /**
   * モニタリングを開始
   */
  public async start(): Promise<void> {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // メトリクス収集の開始
    this.startMetricsCollection();
    
    // ログ監視の開始
    await this.startLogWatching();
    
    // API監視の開始
    this.startAPIMonitoring();
    
    this.emit('monitor:started');
  }

  /**
   * メトリクス収集
   */
  private startMetricsCollection(): void {
    this.interval = setInterval(async () => {
      const metrics = await this.collectMetrics();
      this.emit('metrics:collected', metrics);
      
      // 異常検知
      this.detectAnomalies(metrics);
    }, this.metricsInterval);
  }

  /**
   * システムメトリクスの収集
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    const cpuUsage = this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const diskUsage = await this.getDiskUsage();
    const processMetrics = await this.getProcessMetrics();
    const apiMetrics = await this.getAPIMetrics();
    const videoMetrics = await this.getVideoProcessingMetrics();

    return {
      cpu: cpuUsage,
      memory: memoryUsage,
      diskUsage: diskUsage,
      networkLatency: apiMetrics.avgLatency,
      errorRate: apiMetrics.errorRate,
      responseTime: apiMetrics.avgResponseTime,
      activeUsers: processMetrics.activeConnections,
      videoProcessingQueue: videoMetrics.queueLength
    };
  }

  /**
   * CPU使用率の取得
   */
  private getCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  /**
   * メモリ使用率の取得
   */
  private getMemoryUsage(): number {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return Math.round((usedMemory / totalMemory) * 100);
  }

  /**
   * ディスク使用率の取得
   */
  private async getDiskUsage(): Promise<number> {
    try {
      // 簡易的な実装（実際の環境に応じて調整が必要）
      const stats = await fs.stat('/');
      return 50; // デフォルト値
    } catch {
      return 50;
    }
  }

  /**
   * プロセスメトリクスの取得
   */
  private async getProcessMetrics(): Promise<any> {
    return {
      activeConnections: Math.floor(Math.random() * 100), // 実際の実装では実データを取得
      processMemory: process.memoryUsage().heapUsed / 1024 / 1024,
      uptime: process.uptime()
    };
  }

  /**
   * APIメトリクスの取得
   */
  private async getAPIMetrics(): Promise<any> {
    // 実際の実装ではAPIログやメトリクスストアから取得
    return {
      avgLatency: Math.random() * 100,
      errorRate: Math.random() * 5,
      avgResponseTime: 200 + Math.random() * 300,
      requestsPerMinute: Math.floor(Math.random() * 1000)
    };
  }

  /**
   * 動画処理メトリクスの取得
   */
  private async getVideoProcessingMetrics(): Promise<any> {
    // 実際の実装では動画処理キューから取得
    return {
      queueLength: Math.floor(Math.random() * 20),
      processingRate: Math.random() * 10,
      failureRate: Math.random() * 2
    };
  }

  /**
   * 異常検知
   */
  private detectAnomalies(metrics: SystemMetrics): void {
    // CPU異常
    if (metrics.cpu > 90) {
      this.emit('performance:degraded', {
        metric: 'cpu',
        value: metrics.cpu,
        severity: 'critical',
        threshold: 90
      });
    }

    // メモリ異常
    if (metrics.memory > 90) {
      this.emit('performance:degraded', {
        metric: 'memory',
        value: metrics.memory,
        severity: 'critical',
        threshold: 90
      });
    }

    // レスポンスタイム異常
    if (metrics.responseTime > 2000) {
      this.emit('performance:degraded', {
        metric: 'responseTime',
        value: metrics.responseTime,
        severity: 'high',
        threshold: 2000
      });
    }

    // エラー率異常
    if (metrics.errorRate > 10) {
      this.emit('error:high-rate', {
        rate: metrics.errorRate,
        severity: 'critical'
      });
    }

    // 動画処理キューの詰まり
    if (metrics.videoProcessingQueue > 100) {
      this.emit('video:queue:congested', {
        queueLength: metrics.videoProcessingQueue,
        severity: 'high'
      });
    }
  }

  /**
   * ログ監視
   */
  private async startLogWatching(): Promise<void> {
    const logPaths = [
      './logs/error.log',
      './logs/access.log',
      './logs/processing.log'
    ];

    for (const logPath of logPaths) {
      try {
        await this.watchLogFile(logPath);
      } catch (error) {
        console.error(`Failed to watch log file ${logPath}:`, error);
      }
    }
  }

  /**
   * ログファイルの監視
   */
  private async watchLogFile(filePath: string): Promise<void> {
    try {
      const fileHandle = await fs.open(filePath, 'r');
      this.logWatchers.set(filePath, fileHandle);

      // ファイルの変更を監視（簡易実装）
      const watcher = fs.watch(filePath);
      
      watcher.on('change', async () => {
        await this.processLogChanges(filePath);
      });
    } catch (error) {
      // ファイルが存在しない場合は無視
    }
  }

  /**
   * ログの変更を処理
   */
  private async processLogChanges(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const recentLines = lines.slice(-100); // 最新100行を処理

      for (const line of recentLines) {
        this.processLogLine(line, filePath);
      }
    } catch (error) {
      console.error(`Error processing log file ${filePath}:`, error);
    }
  }

  /**
   * ログ行の処理
   */
  private processLogLine(line: string, source: string): void {
    // エラーログの検出
    if (line.toLowerCase().includes('error')) {
      const errorMatch = line.match(/error:?\s*(.+)/i);
      if (errorMatch) {
        this.emit('error:detected', {
          message: errorMatch[1],
          source,
          timestamp: new Date(),
          raw: line
        });
      }
    }

    // 動画処理エラー
    if (line.includes('video') && line.includes('failed')) {
      const videoIdMatch = line.match(/video[_-]?id:?\s*([^\s]+)/i);
      this.emit('video:processing:failed', {
        videoId: videoIdMatch ? videoIdMatch[1] : 'unknown',
        error: line,
        source
      });
    }

    // メモリリーク検出
    if (line.includes('memory leak') || line.includes('out of memory')) {
      this.emit('performance:memory-leak', {
        message: line,
        source
      });
    }

    // データベースエラー
    if (line.includes('database') && (line.includes('error') || line.includes('timeout'))) {
      this.emit('database:error', {
        message: line,
        source
      });
    }
  }

  /**
   * API監視
   */
  private startAPIMonitoring(): void {
    // 定期的にAPIヘルスチェック
    setInterval(async () => {
      await this.checkAPIHealth();
    }, 60000); // 1分ごと
  }

  /**
   * APIヘルスチェック
   */
  private async checkAPIHealth(): Promise<void> {
    const endpoints = [
      'http://localhost:3001/api/health',
      'http://localhost:3002/api/health',
      'http://localhost:3003/api/health'
    ];

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(endpoint);
        const duration = Date.now() - start;

        if (!response.ok) {
          this.emit('api:unhealthy', {
            endpoint,
            status: response.status,
            duration
          });
        } else if (duration > 1000) {
          this.emit('api:slow', {
            endpoint,
            duration
          });
        }
      } catch (error) {
        this.emit('api:unreachable', {
          endpoint,
          error: error
        });
      }
    }
  }

  /**
   * 現在のメトリクスを取得
   */
  public async getCurrentMetrics(): Promise<SystemMetrics> {
    return await this.collectMetrics();
  }

  /**
   * モニタリングを停止
   */
  public async stop(): Promise<void> {
    this.isMonitoring = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // ログウォッチャーのクリーンアップ
    for (const [_, fileHandle] of this.logWatchers) {
      await fileHandle.close();
    }
    this.logWatchers.clear();

    this.emit('monitor:stopped');
  }
}