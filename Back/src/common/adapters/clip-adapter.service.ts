import { Injectable } from '@nestjs/common';
import { NewClipDto } from '../dto/new-clip.dto';
import { LegacyClipData, ClipData } from '../interfaces/clip-data.interface';

@Injectable()
export class ClipAdapterService {

  /**
   * 새로운 클립 구조를 기존 클립 구조로 변환
   * 기존 분석기들과 호환성 유지를 위함
   */
  convertNewClipToLegacy(newClip: NewClipDto): LegacyClipData[] {
    const legacyClips: LegacyClipData[] = [];

    // 기본 변환
    const baseClip: LegacyClipData = {
      ClipKey: newClip.clipKey || 'UNKNOWN',
      ClipUrl: '', // 새 구조에는 없음
      Quarter: newClip.quarter?.toString() || '1',
      OffensiveTeam: newClip.offensiveTeam || 'Unknown',
      PlayType: this.convertPlayType(newClip.playType),
      SpecialTeam: newClip.specialTeam || false,
      Down: parseInt(newClip.down || '1'),
      RemainYard: newClip.toGoYard || 0,
      StartYard: {
        side: this.convertSide(newClip.start.side),
        yard: newClip.start.yard
      },
      EndYard: {
        side: this.convertSide(newClip.end.side),
        yard: newClip.end.yard
      },
      SignificantPlays: this.convertSignificantPlays(newClip.significantPlays),
      StartScore: {
        Home: 0, // 새 구조에는 시작 점수가 없음
        Away: 0
      }
    };

    // 첫 번째 선수 (car)가 있는 경우
    if (newClip.car?.num && newClip.car?.pos) {
      const clipForCar = { ...baseClip };
      clipForCar.Carrier = [{
        playercode: newClip.car.num.toString(),
        backnumber: newClip.car.num,
        position: newClip.car.pos,
        action: this.determineAction(newClip.playType, 'car', newClip.significantPlays),
        team: newClip.offensiveTeam || 'Unknown'
      }];
      legacyClips.push(clipForCar);
    }

    // 두 번째 선수 (car2)가 있는 경우
    if (newClip.car2?.num && newClip.car2?.pos) {
      const clipForCar2 = { ...baseClip };
      clipForCar2.Carrier = [{
        playercode: newClip.car2.num.toString(),
        backnumber: newClip.car2.num,
        position: newClip.car2.pos,
        action: this.determineAction(newClip.playType, 'car2', newClip.significantPlays),
        team: newClip.offensiveTeam || 'Unknown'
      }];
      legacyClips.push(clipForCar2);
    }

    // 첫 번째 태클러 (tkl)가 있는 경우
    if (newClip.tkl?.num && newClip.tkl?.pos) {
      const clipForTkl = { ...baseClip };
      clipForTkl.Carrier = [{
        playercode: newClip.tkl.num.toString(),
        backnumber: newClip.tkl.num,
        position: newClip.tkl.pos,
        action: 'tackle',
        team: newClip.offensiveTeam === 'Home' ? 'Away' : 'Home' // 상대팀
      }];
      legacyClips.push(clipForTkl);
    }

    // 두 번째 태클러 (tkl2)가 있는 경우
    if (newClip.tkl2?.num && newClip.tkl2?.pos) {
      const clipForTkl2 = { ...baseClip };
      clipForTkl2.Carrier = [{
        playercode: newClip.tkl2.num.toString(),
        backnumber: newClip.tkl2.num,
        position: newClip.tkl2.pos,
        action: 'tackle',
        team: newClip.offensiveTeam === 'Home' ? 'Away' : 'Home' // 상대팀
      }];
      legacyClips.push(clipForTkl2);
    }

    return legacyClips;
  }

  /**
   * 새로운 클립 배열을 기존 클립 배열로 변환
   */
  convertNewClipsToLegacy(newClips: NewClipDto[]): LegacyClipData[] {
    const allLegacyClips: LegacyClipData[] = [];
    
    newClips.forEach(newClip => {
      const convertedClips = this.convertNewClipToLegacy(newClip);
      allLegacyClips.push(...convertedClips);
    });

    return allLegacyClips;
  }

  /**
   * LegacyClipData를 ClipData로 변환
   * ClipKey를 필수로 만들고 기본값 제공
   */
  convertLegacyToClipData(legacyClip: LegacyClipData): ClipData {
    return {
      ...legacyClip,
      ClipKey: legacyClip.ClipKey || 'UNKNOWN_' + Date.now()
    };
  }

  /**
   * LegacyClipData 배열을 ClipData 배열로 변환
   */
  convertLegacyArrayToClipData(legacyClips: LegacyClipData[]): ClipData[] {
    return legacyClips.map(clip => this.convertLegacyToClipData(clip));
  }

  /**
   * PlayType 변환
   */
  private convertPlayType(playType?: string | null): string {
    if (!playType) return 'Run';
    
    // 새 구조의 playType을 기존 구조에 맞게 매핑
    const typeMap: { [key: string]: string } = {
      'Pass': 'Pass',
      'Run': 'Run', 
      'Kickoff': 'Kickoff',
      'Punt': 'Punt',
      'Field Goal': 'FieldGoal',
      'PAT': 'PAT',
      'Sack': 'Sack'
    };

    return typeMap[playType] || playType;
  }

  /**
   * Side 변환 (OWN/OPP → own/opp)
   */
  private convertSide(side: string): string {
    return side.toLowerCase();
  }

  /**
   * SignificantPlays 변환
   */
  private convertSignificantPlays(plays: (string | null)[]): Array<{key: string, label?: string}> {
    const result: Array<{key: string, label?: string}> = [];
    
    plays.forEach(play => {
      if (play && play.trim() !== '') {
        result.push({
          key: play,
          label: play
        });
      }
    });

    return result;
  }

  /**
   * 선수 역할과 플레이 타입에 따른 액션 결정
   */
  private determineAction(
    playType: string | null | undefined, 
    role: 'car' | 'car2' | 'tkl' | 'tkl2', 
    significantPlays: (string | null)[] | undefined
  ): string {
    
    // 태클러는 항상 tackle
    if (role === 'tkl' || role === 'tkl2') {
      return 'tackle';
    }

    // 펌블 체크
    const hasFumble = significantPlays?.includes('FUMBLE');
    if (hasFumble) {
      return 'fumble';
    }

    // 플레이 타입별 액션 결정
    switch (playType) {
      case 'Pass':
        return role === 'car' ? 'throw' : 'catch';
      case 'Run':
        return 'rush';
      case 'Kickoff':
        return role === 'car' ? 'kick' : 'return';
      case 'Punt':
        return role === 'car' ? 'punt' : 'return';
      case 'Field Goal':
      case 'PAT':
        return 'kick';
      case 'Sack':
        return role === 'car' ? 'sack' : 'rush';
      default:
        return 'play';
    }
  }

  /**
   * 등번호로 선수 찾기 (새로운 구조에서)
   */
  findPlayerByNumber(clip: NewClipDto, playerNumber: number): {role: string, position: string} | null {
    if (clip.car?.num === playerNumber && clip.car?.pos) {
      return { role: 'car', position: clip.car.pos };
    }
    if (clip.car2?.num === playerNumber && clip.car2?.pos) {
      return { role: 'car2', position: clip.car2.pos };
    }
    if (clip.tkl?.num === playerNumber && clip.tkl?.pos) {
      return { role: 'tkl', position: clip.tkl.pos };
    }
    if (clip.tkl2?.num === playerNumber && clip.tkl2?.pos) {
      return { role: 'tkl2', position: clip.tkl2.pos };
    }
    return null;
  }

  /**
   * 새로운 구조에서 직접 스탯 추출 (미리 계산된 gainYard 사용)
   */
  extractStatsFromNewClip(clip: NewClipDto, playerNumber: number): {
    yards: number;
    isOffensive: boolean;
    isDefensive: boolean;
    position: string;
    playType: string;
    significantPlays: string[];
  } | null {
    
    const playerInfo = this.findPlayerByNumber(clip, playerNumber);
    if (!playerInfo) return null;

    const yards = clip.gainYard || 0;
    const isOffensive = playerInfo.role === 'car' || playerInfo.role === 'car2';
    const isDefensive = playerInfo.role === 'tkl' || playerInfo.role === 'tkl2';
    const significantPlays = clip.significantPlays.filter(play => play !== null) as string[];

    return {
      yards,
      isOffensive,
      isDefensive,
      position: playerInfo.position,
      playType: clip.playType || 'Unknown',
      significantPlays
    };
  }
}