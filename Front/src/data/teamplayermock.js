    export const mockData = {
        'QB': {
            title: 'QB 선수 스탯',
            columns: ['순위', '선수 이름', '패스 시도', '패스 성공률', '패싱 야드', '패싱 터치다운', '인터셉트', '러싱 터치다운'],
            data: [
                { rank: 1, name: '홍길동', stats: [50, '60%', 200, 5, 10, 60] },
                { rank: 2, name: 'Sam Brown', stats: [48, '58%', 190, 4, 8, 55] },
                { rank: 3, name: 'Jason Smith', stats: [52, '61%', 210, 6, 12, 65] },
                { rank: 4, name: 'Peter Jones', stats: [45, '55%', 180, 3, 7, 50] },
                { rank: 5, name: 'Alex Williams', stats: [55,'64%', 220, 7, 11, 70] },
            ]
        },
        'RB': {
            title: 'RB 선수 스탯',
            columns: ['순위', '선수 이름', '러싱 시도', '러싱 야드', '러싱 터치다운', '펌블', '리시빙 야드',  '리시빙 터치다운'],
            data: [
                { rank: 1, name: '홍길동', stats: [20, 150, 2, 45, 15, 20] },
                { rank: 2, name: 'Tom Davis', stats: [18, 130, 1, 35, 13,20] },
                { rank: 3, name: 'Chris Clark', stats: [22, 160, 3, 50, 16,20] },
                { rank: 4, name: 'Daniel Wilson', stats: [15, 110, 1, 30, 11,20] },
                { rank: 5, name: 'Ryan Taylor', stats: [25, 180, 2, 60, 18,20] },
            ]
        },
        'WR': {
            title: 'WR 선수 스탯',
            columns: ['순위', '선수 이름', '타겟', '캐치', '리시빙 야드', '캐치 당 리시빙 야드', '리시빙 터치다운', '리시빙 퍼스트 다운'],
            data: [
                { rank: 1, name: 'Ethan Miller', stats: [8, 120, 1, 40, 15, 1] },
                { rank: 2, name: 'Jack Brown', stats: [7, 100, 1, 30, 12.5, 1] },
                { rank: 3, name: 'Liam Wilson', stats: [10, 150, 2, 50, 18.75, 1] },
                { rank: 4, name: 'Noah Green', stats: [6, 80, 0, 25, 10, 1] },
                { rank: 5, name: 'Oliver White', stats: [9, 135, 1, 45, 16.875, 1] },
            ]
        },
        'TE': {
            title: 'TE 선수 스탯',
            columns: ['순위', '선수 이름', '타겟', '캐치', '리시빙 야드', '캐치 당 리시빙 야드', '리시빙 터치다운', '리시빙 퍼스트 다운'],
            data: [
                { rank: 1, name: '홍길동', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 2, name: 'Mason Johnson', stats: [4, 50, 0, 20, 14, 15] },
                { rank: 3, name: 'Noah Williams', stats: [6, 75, 1, 30, 14, 15] },
                { rank: 4, name: 'Owen Davis', stats: [3, 40, 0, 15, 14, 15] },
                { rank: 5, name: 'Paul Wilson', stats: [7, 80, 2, 35, 14, 15] },
            ]
        },
        'OL': {
            title: 'OL 선수 스탯',
            columns: ['순위', '선수 이름', '경기', '스냅 수', '반칙', '허용된 색'],
            data: [
                { rank: 1, name: 'Ben Thompson', stats: [5, 60, 1, 25] },
                { rank: 2, name: 'Jake Robinson', stats: [5, 60, 1, 25] },
                { rank: 3, name: 'Luke Green', stats: [5, 60, 1, 25] },
                { rank: 4, name: 'Sam Turner', stats: [5, 60, 1, 25] },
                { rank: 5, name: 'Will Harris', stats: [5, 60, 1, 25] },
            ]
        },
        'DL': {
            title: 'DL 선수 스탯',
            columns: ['순위', '선수 이름', '경기', '태클', '색', '펌블 유도', '펌블 리커버리', '수비 터치다운'],
            data: [
                { rank: 1, name: 'Ethan Jones', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 2, name: 'Jacob Moore', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 3, name: 'Kevin White', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 4, name: 'Leo Taylor', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 5, name: 'Ryan Clark', stats: [5, 60, 1, 25, 14, 15] },
            ]
        },
        'LB': {
            title: 'LB 선수 스탯',
            columns: ['순위', '선수 이름', '경기', '태클', '색', '펌블 유도', '패스 방어', '인터셉트'],
            data: [
                { rank: 1, name: 'Adam Brown', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 2, name: 'Billy Evans', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 3, name: 'Charlie Fisher', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 4, name: 'David Garcia', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 5, name: 'Edward Hall', stats: [5, 60, 1, 25, 14, 15] },
            ]
        },
        'DB': {
            title: 'DB 선수 스탯',
            columns: ['순위', '선수 이름', '경기', '태클', '펌블 유도', '패스 방어', '인터셉트', '수비 터치다운'],
            data: [
                { rank: 1, name: 'Frank Jackson', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 2, name: 'George King', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 3, name: 'Henry Lee', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 4, name: 'Ivan Miller', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 5, name: 'Jack Nelson', stats: [5, 60, 1, 25, 14, 15] },
            ]
        },
        'K': {
            title: 'K 선수 스탯',
            columns: ['순위', '선수 이름', 'FG 시도', 'FG 성공', 'FG 성공률', '가장 긴 FG', 'PAT 시도', 'PAT 성공'],
            data: [
                { rank: 1, name: 'Kevin Adams', stats: [3, 3, '100%', 50, 5, 5] },
                { rank: 2, name: 'Larry Baker', stats: [2, 2, '100%', 45, 4, 4] },
                { rank: 3, name: 'Mark Carter', stats: [4, 3, '75%', 55, 6, 6] },
                { rank: 4, name: 'Nick Davis', stats: [1, 1, '100%', 40, 3, 3] },
                { rank: 5, name: 'Oscar Evans', stats: [5, 4, '80%', 52, 7, 7] },
            ]
        },
        'P': {
            title: 'P 선수 스탯',
            columns: ['순위', '선수 이름', '펀트 횟수', '평균 펀트 야드', '최장 펀트 야드', '펀트 야드', '터치백', '인사이드 20'],
            data: [
                { rank: 1, name: 'Paul Foster', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 2, name: 'Quentin Green', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 3, name: 'Robert Hill', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 4, name: 'Steve Irving', stats: [5, 60, 1, 25, 14, 15] },
                { rank: 5, name: 'Tim Johnson', stats: [5, 60, 1, 25, 14, 15] },
            ]
        },
    };