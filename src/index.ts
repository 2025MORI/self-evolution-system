/**
 * Self-Evolution System
 * 動画マニュアルシステム用自己発展型プログラム
 */

export { SelfEvolutionSystem } from './core/SelfEvolutionSystem';
export { VideoSystemMonitor } from './monitors/VideoSystemMonitor';
export { SolutionGenerator } from './generators/SolutionGenerator';
export { LearningEngine } from './learning/LearningEngine';
export { KnowledgeTransfer } from './transfer/KnowledgeTransfer';

// Export types
export * from './types';

// Export default instance
import { SelfEvolutionSystem } from './core/SelfEvolutionSystem';
export default new SelfEvolutionSystem();