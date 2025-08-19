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

/**
 * 기존 클립 데이터 인터페이스 (호환용)
 * ClipKey가 선택사항인 기존 데이터와의 호환성을 위한 인터페이스
 */
export interface LegacyClipData {
  ClipKey?: string;
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