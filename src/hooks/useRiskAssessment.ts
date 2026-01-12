import { useState, useEffect, useMemo } from 'react';
import type { StrategyMetadata, RiskLevel } from '@/types';
import { riskCalculationService, type RiskAssessment } from '@/services/riskCalculationService';

/**
 * React hook for dynamic risk calculation
 */
export function useRiskAssessment(strategy: StrategyMetadata | null) {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!strategy) {
      setAssessment(null);
      return;
    }

    setLoading(true);
    
    try {
      const riskAssessment = riskCalculationService.calculateRisk(strategy);
      setAssessment(riskAssessment);
    } catch (error) {
      console.error('Risk assessment failed:', error);
      setAssessment(null);
    } finally {
      setLoading(false);
    }
  }, [strategy?.id, strategy?.apy]); // Recalculate when strategy ID or APY changes

  return {
    assessment,
    loading,
    riskLevel: assessment?.level || strategy?.risk || 'medium',
    riskScore: assessment?.score || 0.5,
    confidence: assessment?.confidence || 'low',
    reasoning: assessment?.reasoning || [],
    isCalculated: assessment?.source === 'calculated'
  };
}

/**
 * React hook for multiple strategies risk assessment
 */
export function useMultipleRiskAssessments(strategies: StrategyMetadata[]) {
  const [assessments, setAssessments] = useState<Map<string, RiskAssessment>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (strategies.length === 0) {
      setAssessments(new Map());
      return;
    }

    setLoading(true);

    try {
      const riskAssessments = riskCalculationService.calculateMultipleRisks(strategies);
      setAssessments(riskAssessments);
    } catch (error) {
      console.error('Multiple risk assessments failed:', error);
      setAssessments(new Map());
    } finally {
      setLoading(false);
    }
  }, [strategies.length, strategies.map(s => `${s.id}-${s.apy}`).join(',')]);

  const distribution = useMemo(() => {
    if (strategies.length === 0) return null;
    return riskCalculationService.getRiskDistribution(strategies);
  }, [assessments, strategies.length]);

  return {
    assessments,
    loading,
    distribution,
    getRiskAssessment: (strategyId: string) => assessments.get(strategyId),
    hasCalculatedRisks: Array.from(assessments.values()).some(a => a.source === 'calculated')
  };
}

/**
 * Utility hook for risk-based filtering and sorting
 */
export function useRiskFiltering(strategies: StrategyMetadata[]) {
  const { assessments } = useMultipleRiskAssessments(strategies);

  const filterByRisk = useMemo(() => {
    return (riskLevels: string[]) => {
      return strategies.filter(strategy => {
        const assessment = assessments.get(strategy.id);
        const riskLevel = assessment?.level || strategy.risk;
        return riskLevels.includes(riskLevel);
      });
    };
  }, [strategies, assessments]);

  const sortByRisk = useMemo(() => {
    return (ascending = true) => {
      // ✅ Fix: Properly type the riskOrder object
      const riskOrder: Record<RiskLevel, number> = { 
        low: 1, 
        medium: 2, 
        high: 3 
      };
      
      return [...strategies].sort((a, b) => {
        const aAssessment = assessments.get(a.id);
        const bAssessment = assessments.get(b.id);
        
        const aRisk = aAssessment?.level || a.risk;
        const bRisk = bAssessment?.level || b.risk;
        
        // ✅ Fix: TypeScript now knows these are valid keys
        const aScore = riskOrder[aRisk];
        const bScore = riskOrder[bRisk];
        
        return ascending ? aScore - bScore : bScore - aScore;
      });
    };
  }, [strategies, assessments]);

  const sortByRiskScore = useMemo(() => {
    return (ascending = true) => {
      return [...strategies].sort((a, b) => {
        const aAssessment = assessments.get(a.id);
        const bAssessment = assessments.get(b.id);
        
        const aScore = aAssessment?.score || 0.5;
        const bScore = bAssessment?.score || 0.5;
        
        return ascending ? aScore - bScore : bScore - aScore;
      });
    };
  }, [strategies, assessments]);

  return {
    filterByRisk,
    sortByRisk,
    sortByRiskScore,
    assessments
  };
}
