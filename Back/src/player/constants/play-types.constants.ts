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
    TOUCHDOWN: 'Touchdown',
    TWOPTCONV: {
        GOOD: '2pt Conversion(Good)',
        NOGOOD: '2pt Conversion(No Good)',
    },
    PAT: {
        GOOD: 'PAT(Good)',
        NOGOOD: 'PAT(No Good)',
    },
    FIELDGOAL: {
        GOOD: 'Field Goal(Good)',
        NOGOOD: 'Field Goal(No Good)',
    },
    PENALTY: {
        TEAM: 'OFF',
        YARD: '0',
    },
    SACK: 'Sack',
    TFL: 'TFL',
    FUMBLE: 'Fumble Situation',
    FUMBLERECOFF: 'Fumble recovered by off',
    FUMBLERECDEF: 'Fumble recovered by def',
    INTERCEPT: 'Intercept',
    TURNOVER: 'Turn Over',
    SAFETY: 'safety',
} as const;

/**
 * 필드 위치 계산 헬퍼 함수
 */
export class PlayAnalysisHelper {
    static calculateFieldGoalDistance(side: string, yard: number): number {
        if (side === 'OPP') {
            return yard + 17;
        } else if (side === 'OWN') {
            return (50 - yard) + 50 + 17;
        }
        return 0;
    }

    static hasSignificantPlay(significantPlays: (string | null)[], target: string): boolean {
        return significantPlays.some(play => play === target);
    }
}