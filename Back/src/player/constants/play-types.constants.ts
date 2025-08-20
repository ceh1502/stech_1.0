/**
 * 플레이 타입 상수 정의
 */
export const PLAY_TYPE = {
    RUN: 'Run',
    PASS: 'PassComplete',
    NOPASS: 'PassIncomplete',
    KICKOFF: 'Kickoff',
    PUNT: 'Punt',
    PAT: 'PAT',
    TPT: '2pt',
    FG: 'FieldGoal',
    SACK: 'Sack',    
    NONE: 'none',
} as const;

/**
 * 특수 상황 플레이 상수 정의
 */
export const SIGNIFICANT_PLAY = {
    TOUCHDOWN: 'Touchdown', // 6점 올라감 (오펜스 팀)
    TWOPTCONV: {
        GOOD: '2pt Conversion(Good)', // 2점 올라감 (오펜스 팀)
        NOGOOD: '2pt Conversion(No Good)',
    },
    PAT: {
        GOOD: 'PAT(Good)', // 1점 올라감 (오펜스 팀)
        NOGOOD: 'PAT(No Good)',
    },
    FIELDGOAL: {
        GOOD: 'Field Goal(Good)', // 3점 올라감 (오펜스 팀)
        NOGOOD: 'Field Goal(No Good)',
    },
    PENALTY: {
        TEAM: 'OFF', // PENALTY가 발생한 팀
        YARD: '0', // 패널티 야드
    },
    SACK: 'Sack',
    TFL: 'TFL',
    FUMBLE: 'Fumble Situation',
    FUMBLERECOFF: 'Fumble recovered by off', // → Run Yard
    FUMBLERECDEF: 'Fumble recovered by def', // → Return Yard
    INTERCEPT: 'Intercept',
    TURNOVER: 'Turn Over',
    SAFETY: 'safety', // 2점 올라감 (디펜스 팀)
} as const;

/**
 * 필드 골 거리 범위
 */
export const FIELD_GOAL_RANGES = {
    RANGE_1_19: '1-19',
    RANGE_20_29: '20-29', 
    RANGE_30_39: '30-39',
    RANGE_40_49: '40-49',
    RANGE_50_PLUS: '50+',
} as const;

/**
 * 필드 위치 계산 헬퍼 함수
 */
export class PlayAnalysisHelper {
    /**
     * 필드 골 거리 계산
     */
    static calculateFieldGoalDistance(side: string, yard: number): number {
        if (side === 'OPP') {
            return yard + 17; // 엔드존 10야드 + 스냅 위치 7야드
        } else if (side === 'OWN') {
            return (50 - yard) + 50 + 17; // 중앙선까지 + 상대편 + 17야드
        }
        return 0;
    }

    /**
     * 펀트가 20야드 이내에 착지했는지 확인
     */
    static isPuntInside20(endSide: string, endYard: number): boolean {
        return endSide === 'OPP' && endYard <= 20;
    }

    /**
     * 펀트가 터치백인지 확인 (엔드존에 착지)
     */
    static isPuntTouchback(endSide: string, endYard: number): boolean {
        return endSide === 'OPP' && endYard <= 0;
    }

    /**
     * TFL(Tackle for Loss) 여부 확인
     */
    static isTFL(gainYard: number): boolean {
        return gainYard < 0;
    }

    /**
     * 특정 significant play가 포함되어 있는지 확인
     */
    static hasSignificantPlay(significantPlays: (string | null)[], target: string): boolean {
        return significantPlays.some(play => play === target);
    }

    /**
     * 필드 골 거리 범위 계산
     */
    static getFieldGoalRange(distance: number): string {
        if (distance >= 1 && distance <= 19) return FIELD_GOAL_RANGES.RANGE_1_19;
        if (distance >= 20 && distance <= 29) return FIELD_GOAL_RANGES.RANGE_20_29;
        if (distance >= 30 && distance <= 39) return FIELD_GOAL_RANGES.RANGE_30_39;
        if (distance >= 40 && distance <= 49) return FIELD_GOAL_RANGES.RANGE_40_49;
        if (distance >= 50) return FIELD_GOAL_RANGES.RANGE_50_PLUS;
        return '';
    }
}