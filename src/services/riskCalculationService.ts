import type { StrategyMetadata, RiskLevel } from '@/types';

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-1 scale
  confidence: 'low' | 'medium' | 'high';
  reasoning: string[];
  source: 'hardcoded' | 'calculated';
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  total: number;
}

class RiskCalculationService {
  /**
   * Calculate risk assessment for a single strategy
   */
  calculateRisk(strategy: StrategyMetadata): RiskAssessment {
    // For now, use the hardcoded risk level but enhance with calculated scoring
    const baseRisk = strategy.risk;
    
    // Calculate a more nuanced risk score based on multiple factors
    let score = this.getRiskScore(baseRisk);
    const reasoning: string[] = [];
    
    // APY-based adjustments
    if (strategy.apy > 15) {
      score += 0.2;
      reasoning.push(`High APY (${strategy.apy}%) increases risk`);
    } else if (strategy.apy < 3) {
      score -= 0.1;
      reasoning.push(`Conservative APY (${strategy.apy}%) reduces risk`);
    }
    
    // Protocol-based adjustments
    const protocolName = strategy.protocol.name.toLowerCase();
    if (protocolName.includes('aave')) {
      score -= 0.1;
      reasoning.push('Established protocol (AAVE) reduces risk');
    } else if (protocolName.includes('morpho')) {
      reasoning.push('Institutional-grade Morpho vault');
    }
    
    // Strategy-specific risk adjustments
    if (strategy.id === 'AaveV3SupplyLeveraged') {
      score += 0.3;
      reasoning.push('Leveraged position increases risk');
    }
    
    if (strategy.id === 'Re7Strategy') {
      score -= 0.05;
      reasoning.push('Institutional-grade Re7 Labs management');
    }
    
    if (strategy.id === 'MultiStrategy') {
      score -= 0.1;
      reasoning.push('Diversified multi-strategy approach reduces risk');
    }
    
    // Cross-chain strategies have additional risk
    if (strategy.chainId !== 8453) { // Base chain ID
      score += 0.1;
      reasoning.push('Cross-chain strategy adds bridge risk');
    }
    
    // Ensure score stays within bounds
    score = Math.max(0, Math.min(1, score));
    
    // Determine final risk level based on score
    const finalLevel = this.scoreToRiskLevel(score);
    
    return {
      level: finalLevel,
      score,
      confidence: reasoning.length > 2 ? 'high' : reasoning.length > 0 ? 'medium' : 'low',
      reasoning,
      source: reasoning.length > 0 ? 'calculated' : 'hardcoded'
    };
  }

  /**
   * Calculate risk assessments for multiple strategies
   */
  calculateMultipleRisks(strategies: StrategyMetadata[]): Map<string, RiskAssessment> {
    const assessments = new Map<string, RiskAssessment>();
    
    strategies.forEach(strategy => {
      const assessment = this.calculateRisk(strategy);
      assessments.set(strategy.id, assessment);
    });
    
    return assessments;
  }

  /**
   * Get risk distribution across multiple strategies
   */
  getRiskDistribution(strategies: StrategyMetadata[]): RiskDistribution {
    const distribution = { low: 0, medium: 0, high: 0, total: strategies.length };
    
    strategies.forEach(strategy => {
      const assessment = this.calculateRisk(strategy);
      distribution[assessment.level]++;
    });
    
    return distribution;
  }

  /**
   * Convert risk level to numerical score
   */
  private getRiskScore(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case 'low': return 0.2;
      case 'medium': return 0.5;
      case 'high': return 0.8;
      default: return 0.5;
    }
  }

  /**
   * Convert numerical score to risk level
   */
  private scoreToRiskLevel(score: number): RiskLevel {
    if (score <= 0.35) return 'low';
    if (score <= 0.65) return 'medium';
    return 'high';
  }
}

export const riskCalculationService = new RiskCalculationService();
