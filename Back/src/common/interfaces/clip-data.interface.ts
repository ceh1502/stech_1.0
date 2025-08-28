/**
 * 공용 클립 데이터 인터페이스
 * 모든 분석기에서 사용하는 통합 인터페이스
 */
export interface ClipData {
  ClipKey: string;
  Gamekey?: string; // 호환성을 위해 추가
  ClipUrl?: string;
  Quarter?: string;
  OffensiveTeam?: string;
  PlayType: string;
  SpecialTeam?: boolean;
  Down?: number;
  RemainYard?: number;
  StartYard?: {
    side: string;
    yard: number;
  };
  EndYard?: {
    side: string;
    yard: number;
  };
  Carrier?: Array<{
    playercode: string | number;
    backnumber?: number;
    team?: string;
    position: string;
    action: string;
  }>;
  SignificantPlays?: Array<{
    key: string;
    label?: string;
  }>;
  StartScore?: {
    Home: number;
    Away: number;
  };
}
