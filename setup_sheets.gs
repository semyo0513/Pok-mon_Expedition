/**
 * 🎮 포켓 필드 어드벤처 (Pocket Field Adventure)
 * 구글 시트 7개 DB 자동 생성 및 초기 데이터 생성 스크립트 (setup_sheets.gs)
 * 
 * [사용법]
 * 1. 연결된 Google Sheets 문서의 [확장 프로그램] -> [Apps Script]에서 실행합니다.
 * 2. `initDatabase()` 함수를 실행하면 7개 시트가 자동 생성/초기화됩니다.
 */

function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Members (명단)
  var sheetMembers = getOrCreateSheet(ss, 'Members');
  setHeaders(sheetMembers, ['member_id', 'name', 'class_info', 'role', 'team_id', 'pw_hash', 'pw_set', 'created_at']);
  if (sheetMembers.getLastRow() === 1) {
    var now = new Date().toISOString();
    sheetMembers.appendRow(['M001', '김피카', '1학년 1반', 'member', '', '', false, now]);
    sheetMembers.appendRow(['M002', '이파이리', '1학년 1반', 'member', '', '', false, now]);
    sheetMembers.appendRow(['M003', '박꼬북', '1학년 1반', 'member', '', '', false, now]);
    sheetMembers.appendRow(['M004', '최이상해', '1학년 1반', 'member', '', '', false, now]);
    sheetMembers.appendRow(['M005', '정버터플', '1학년 2반', 'member', '', '', false, now]);
    sheetMembers.appendRow(['M006', '강잠만보', '1학년 2반', 'member', '', '', false, now]);
    sheetMembers.appendRow(['M007', '윤뮤츠', '1학년 2반', 'member', '', '', false, now]);
    sheetMembers.appendRow(['M008', '임이브이', '1학년 2반', 'member', '', '', false, now]);
  }

  // 2. Teams (팀)
  var sheetTeams = getOrCreateSheet(ss, 'Teams');
  setHeaders(sheetTeams, ['team_id', 'team_name', 'leader_id', 'emblem', 'total_points', 'created_at', 'status']);

  // 3. Missions (미션)
  var sheetMissions = getOrCreateSheet(ss, 'Missions');
  setHeaders(sheetMissions, ['mission_id', 'title', 'description', 'points', 'slot_count', 'slots_json', 'acquire_type', 'ball_type', 'open_at', 'close_at', 'status']);
  if (sheetMissions.getLastRow() === 1) {
    sheetMissions.appendRow([
      'Q001',
      '드레스코드 미션 (뽑기)',
      '포켓볼을 뽑아 나온 팀 미션을 수행하세요!',
      20,
      4,
      JSON.stringify(['레트로 교복 룩 단체사진', '빨간색 포인트 단체 아이템 포즈', '포켓몬 트레이너 포즈 사진', '팀 엠블럼 바디 랭귀지 인증']),
      'gacha',
      'normal',
      '', '',
      'open'
    ]);
    sheetMissions.appendRow([
      'Q002',
      '야생의 룰렛 미션',
      '룰렛을 돌려 획득한 미션 장소로 이동하세요!',
      30,
      4,
      JSON.stringify(['중앙 광장에서 단체 댄스 인증', '박물관 지정 유물 앞 단체 퀴즈', '공원 벤치에서 레트로 포즈', '연못 앞에서 팀원 모두 V자 포즈']),
      'roulette',
      'great',
      '', '',
      'open'
    ]);
    sheetMissions.appendRow([
      'Q003',
      '점심 보너스 스피드 미션 (선착순)',
      '가장 빠르게 터치하는 팀에 원하는 미션 선택권 부여!',
      50,
      3,
      JSON.stringify(['오박사님과 단체 하트 셀카', '체험학습 장소 최고 인상깊은 장소 스케치', '팀 슬로건 3행시 창작']),
      'first_come',
      'master',
      '', '',
      'open'
    ]);
  }

  // 4. MissionLog (미션 획득/수행 기록)
  var sheetLog = getOrCreateSheet(ss, 'MissionLog');
  setHeaders(sheetLog, ['log_id', 'mission_id', 'team_id', 'slot_index', 'slot_content', 'acquired_at', 'result', 'judged_by', 'judged_at']);

  // 5. Points (포인트 원장)
  var sheetPoints = getOrCreateSheet(ss, 'Points');
  setHeaders(sheetPoints, ['point_id', 'team_id', 'delta', 'reason', 'ref_log_id', 'created_by', 'created_at']);

  // 6. Sessions (로그인 세션)
  var sheetSessions = getOrCreateSheet(ss, 'Sessions');
  setHeaders(sheetSessions, ['token', 'member_id', 'role', 'expires_at']);

  // 7. Config (행사 설정)
  var sheetConfig = getOrCreateSheet(ss, 'Config');
  setHeaders(sheetConfig, ['key', 'value', 'description']);
  if (sheetConfig.getLastRow() === 1) {
    sheetConfig.appendRow(['event_name', '2026 현장체험학습 포켓 탐험대', '행사명']);
    sheetConfig.appendRow(['leader_code', 'GOLD-2026', '팀장 입장 코드']);
    sheetConfig.appendRow(['member_code', 'SILVER-2026', '팀원 입장 코드']);
    sheetConfig.appendRow(['admin_code', 'OAK-MASTER', '관리자(오박사) 코드']);
    sheetConfig.appendRow(['team_size_min', '2', '팀 최소 인원']);
    sheetConfig.appendRow(['team_size_max', '6', '팀 최대 인원']);
    sheetConfig.appendRow(['ranking_visible', 'TRUE', '랭킹 공개 여부 (TRUE/FALSE)']);
    sheetConfig.appendRow(['event_phase', 'building', '행사 단계 (building / mission / closed)']);
  }

  SpreadsheetApp.getUi().alert('🎮 포켓 필드 어드벤처 7개 시트 초기화가 정상 완료되었습니다!');
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function setHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setBackground('#1F1F1F');
    range.setFontColor('#F5F3DE');
    range.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}
