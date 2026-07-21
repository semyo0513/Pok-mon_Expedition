/**
 * 🎮 포켓 필드 어드벤처 (Pocket Field Adventure) - GAS 백엔드 API (Code.gs)
 * 구글 앱스 스크립트에는 이 Code.gs 파일만 넣어서 배포합니다.
 * 깃허브 저장소: https://github.com/semyo0513/Pok-mon_Expedition
 */

var GITHUB_RAW_BASE = "https://raw.githubusercontent.com/semyo0513/Pok-mon_Expedition/main"; 

// ==========================================
// 시트 스키마 정의 (자동 생성용)
// ==========================================
var SHEET_SCHEMA = {
  'Members':    ['member_id', 'name', 'class_info', 'role', 'team_id', 'pw_hash', 'pw_set', 'created_at'],
  'Teams':      ['team_id', 'team_name', 'leader_id', 'emblem', 'total_points', 'created_at', 'status'],
  'Missions':   ['mission_id', 'title', 'description', 'points', 'slot_count', 'slots_json', 'acquire_type', 'ball_type', 'open_at', 'close_at', 'status'],
  'MissionLog': ['log_id', 'mission_id', 'team_id', 'slot_index', 'slot_content', 'acquired_at', 'result', 'judged_by', 'judged_at'],
  'Points':     ['point_id', 'team_id', 'delta', 'reason', 'ref_log_id', 'created_by', 'created_at'],
  'Sessions':   ['token', 'member_id', 'role', 'expires_at'],
  'Config':     ['key', 'value', 'description']
};

/**
 * 웹앱 최초 실행 시 필요한 모든 시트와 컬럼 헤더를 자동 생성합니다.
 * 이미 존재하는 시트는 건너뛰고, Config 시트에 기본값이 없으면 초기 설정을 삽입합니다.
 */
function ensureDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var created = false;

  // 각 시트 존재 여부 확인 후 없으면 생성
  for (var sheetName in SHEET_SCHEMA) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      created = true;
    }
    // 헤더가 비어있으면 헤더 삽입
    if (sheet.getLastRow() === 0) {
      var headers = SHEET_SCHEMA[sheetName];
      sheet.appendRow(headers);
      // 헤더 스타일링
      var range = sheet.getRange(1, 1, 1, headers.length);
      range.setBackground('#1F1F1F');
      range.setFontColor('#F5F3DE');
      range.setFontWeight('bold');
      sheet.setFrozenRows(1);
      created = true;
    }
  }

  // Config 시트에 기본 설정값이 없으면 삽입
  var configSheet = ss.getSheetByName('Config');
  if (configSheet && configSheet.getLastRow() <= 1) {
    configSheet.appendRow(['event_name', '2026 현장체험학습 포켓 탐험대', '행사명']);
    configSheet.appendRow(['leader_code', 'GOLD-2026', '팀장 입장 코드']);
    configSheet.appendRow(['member_code', 'SILVER-2026', '팀원 입장 코드']);
    configSheet.appendRow(['admin_code', 'OAK-MASTER', '관리자(오박사) 코드']);
    configSheet.appendRow(['team_size_min', '2', '팀 최소 인원']);
    configSheet.appendRow(['team_size_max', '6', '팀 최대 인원']);
    configSheet.appendRow(['ranking_visible', 'TRUE', '랭킹 공개 여부 (TRUE/FALSE)']);
    configSheet.appendRow(['event_phase', 'building', '행사 단계 (building / mission / closed)']);
  }

  // Missions 시트에 샘플 미션이 없으면 삽입
  var missionsSheet = ss.getSheetByName('Missions');
  if (missionsSheet && missionsSheet.getLastRow() <= 1) {
    missionsSheet.appendRow([
      'Q001', '드레스코드 미션 (뽑기)', '포켓볼을 뽑아 나온 팀 미션을 수행하세요!',
      20, 4,
      JSON.stringify(['레트로 교복 룩 단체사진', '빨간색 포인트 단체 아이템 포즈', '포켓몬 트레이너 포즈 사진', '팀 엠블럼 바디 랭귀지 인증']),
      'gacha', 'normal', '', '', 'open'
    ]);
    missionsSheet.appendRow([
      'Q002', '야생의 룰렛 미션', '룰렛을 돌려 획득한 미션 장소로 이동하세요!',
      30, 4,
      JSON.stringify(['중앙 광장에서 단체 댄스 인증', '박물관 지정 유물 앞 단체 퀴즈', '공원 벤치에서 레트로 포즈', '연못 앞에서 팀원 모두 V자 포즈']),
      'roulette', 'great', '', '', 'open'
    ]);
    missionsSheet.appendRow([
      'Q003', '점심 보너스 스피드 미션 (선착순)', '가장 빠르게 터치하는 팀에 원하는 미션 선택권 부여!',
      50, 3,
      JSON.stringify(['오박사님과 단체 하트 셀카', '체험학습 장소 최고 인상깊은 장소 스케치', '팀 슬로건 3행시 창작']),
      'first_come', 'master', '', '', 'open'
    ]);
  }

  // 기본 시트(Sheet1) 정리 — 빈 기본시트가 남아있으면 삭제 시도
  if (created) {
    try {
      var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
      if (defaultSheet && ss.getSheets().length > 1) {
        ss.deleteSheet(defaultSheet);
      }
    } catch (e) { /* 무시 */ }
  }
}

function doGet(e) {
  e = e || { parameter: {} };
  
  // 최초 실행 시 자동으로 DB 시트 생성
  ensureDatabase();
  
  if (e.parameter && e.parameter.action) {
    var result = routeAction(e.parameter.action, e.parameter.token, e.parameter);
    return createJsonResponse(result);
  }

  // GAS 웹앱 렌더링
  try {
    var template = HtmlService.createTemplateFromFile('index');
    return template.evaluate()
      .setTitle('포켓 필드 어드벤처 - POCKET FIELD ADVENTURE')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    if (GITHUB_RAW_BASE) {
      try {
        var htmlContent = UrlFetchApp.fetch(GITHUB_RAW_BASE + '/index.html').getContentText();
        return HtmlService.createHtmlOutput(htmlContent)
          .setTitle('포켓 필드 어드벤처 - POCKET FIELD ADVENTURE')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      } catch (fetchErr) {
        return HtmlService.createHtmlOutput('<h3>깃허브 소스 서빙 오류</h3><p>' + fetchErr.toString() + '</p>');
      }
    }
    return HtmlService.createHtmlOutput('<h3>포켓 필드 어드벤처 API 서버 🔴</h3>');
  }
}

function doPost(e) {
  try {
    // 최초 실행 시 자동으로 DB 시트 생성
    ensureDatabase();

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var action = data.action || '';
    var token = data.token || '';
    var payload = data.payload || data;

    var result = routeAction(action, token, payload);
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ ok: false, error: { message: err.toString() } });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (e) {
    return '';
  }
}

function routeAction(action, token, payload) {
  switch (action) {
    case 'login': return login(payload);
    case 'setInitialPassword': return setInitialPassword(payload);
    case 'getMemberList': return getMemberList(token);
    case 'createTeam': return createTeam(token, payload);
    case 'getMissions': return getMissions(token);
    case 'acquireMission': return acquireMission(token, payload);
    case 'getMyBag': return getMyBag(token);
    case 'getRanking': return getRanking(token);
    case 'adminGetDashboard': return adminGetDashboard(token);
    case 'adminJudge': return adminJudge(token, payload);
    case 'adminUpsertMission': return adminUpsertMission(token, payload);
    case 'adminUpsertMembers': return adminUpsertMembers(token, payload);
    case 'adminRandomAssign': return adminRandomAssign(token, payload);
    case 'adminAdjustPoints': return adminAdjustPoints(token, payload);
    case 'adminUpdateConfig': return adminUpdateConfig(token, payload);
    case 'adminPurgeData': return adminPurgeData(token);
    default:
      return { ok: false, error: { message: '알 수 없는 요청 액션입니다: ' + action } };
  }
}

function getDb() { return SpreadsheetApp.getActiveSpreadsheet(); }
function getSheet(sheetName) {
  var ss = getDb();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    // 시트가 없으면 스키마에 따라 자동 생성
    sheet = ss.insertSheet(sheetName);
    var headers = SHEET_SCHEMA[sheetName];
    if (headers) {
      sheet.appendRow(headers);
      var range = sheet.getRange(1, 1, 1, headers.length);
      range.setBackground('#1F1F1F');
      range.setFontColor('#F5F3DE');
      range.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function getSheetObjects(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = row[j];
    obj._rowIndex = i + 1;
    result.push(obj);
  }
  return result;
}

function getConfigMap() {
  var sheet = getSheet('Config');
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) config[data[i][0]] = data[i][1];
  }
  return config;
}

function hashPassword(password) {
  var salt = 'POCKET_FIELD_SALT_2026';
  var rawBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password);
  var txtHash = '';
  for (var i = 0; i < rawBytes.length; i++) {
    var byteVal = rawBytes[i];
    if (byteVal < 0) byteVal += 256;
    var byteStr = byteVal.toString(16);
    if (byteStr.length == 1) byteStr = '0' + byteStr;
    txtHash += byteStr;
  }
  return txtHash;
}

function createSession(memberId, role) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  var sheet = getSheet('Sessions');
  var now = new Date();
  var expires = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  sheet.appendRow([token, memberId, role, expires.toISOString()]);
  return token;
}

function verifyToken(token) {
  if (!token) return { valid: false, message: '토큰이 제공되지 않았습니다.' };
  if (token.indexOf('MEMBER_GUEST_') === 0) {
    return { valid: true, memberId: 'GUEST', role: 'member', teamId: '' };
  }

  var sessions = getSheetObjects('Sessions');
  var now = new Date();
  var session = null;
  for (var i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].token === token) { session = sessions[i]; break; }
  }
  if (!session) return { valid: false, message: '유효하지 않은 세션입니다.' };
  var expDate = new Date(session.expires_at);
  if (now > expDate) return { valid: false, message: '세션이 만료되었습니다.' };
  
  var member = null;
  var teamId = '';
  if (session.member_id !== 'ADMIN') {
    var members = getSheetObjects('Members');
    for (var j = 0; j < members.length; j++) {
      if (members[j].member_id === session.member_id) {
        member = members[j];
        teamId = member.team_id || '';
        break;
      }
    }
  }

  return { valid: true, memberId: session.member_id, role: session.role, teamId: teamId, member: member };
}

function login(payload) {
  try {
    var role = payload.role;
    var config = getConfigMap();

    if (role === 'admin') {
      if (payload.adminCode !== config.admin_code) return { ok: false, error: { message: '관리자 코드가 일치하지 않습니다.' } };
      var token = createSession('ADMIN', 'admin');
      return { ok: true, data: { token: token, role: 'admin', memberName: '오박사(운영자)' } };
    }

    if (role === 'member') {
      if (payload.memberCode !== config.member_code) return { ok: false, error: { message: '팀원 입장 코드가 일치하지 않습니다.' } };
      var guestToken = 'MEMBER_GUEST_' + Utilities.getUuid();
      return { ok: true, data: { token: guestToken, role: 'member', memberName: '파트너 트레이너' } };
    }

    if (role === 'leader') {
      if (payload.leaderCode !== config.leader_code) return { ok: false, error: { message: '팀장 입장 코드가 일치하지 않습니다.' } };
      var members = getSheetObjects('Members');
      var targetMember = null;
      for (var i = 0; i < members.length; i++) {
        if (members[i].member_id === payload.memberId || members[i].name === payload.memberName) {
          targetMember = members[i]; break;
        }
      }
      if (!targetMember) return { ok: false, error: { message: '명단에서 찾을 수 없는 사용자입니다.' } };

      if (targetMember.pw_set === false || targetMember.pw_set === 'FALSE' || !targetMember.pw_hash) {
        return { ok: true, requireSetPassword: true, memberId: targetMember.member_id, memberName: targetMember.name };
      }

      var inputHash = hashPassword(payload.password);
      if (inputHash !== targetMember.pw_hash) return { ok: false, error: { message: '비밀번호가 일치하지 않습니다.' } };

      var leaderToken = createSession(targetMember.member_id, 'leader');
      return {
        ok: true,
        data: { token: leaderToken, role: 'leader', memberId: targetMember.member_id, memberName: targetMember.name, teamId: targetMember.team_id || '' }
      };
    }
    return { ok: false, error: { message: '잘못된 로그인 요청입니다.' } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
}

function setInitialPassword(payload) {
  try {
    var config = getConfigMap();
    if (payload.leaderCode !== config.leader_code) return { ok: false, error: { message: '팀장 입장 코드가 올바르지 않습니다.' } };
    var sheet = getSheet('Members');
    var members = getSheetObjects('Members');
    var target = null;
    for (var i = 0; i < members.length; i++) {
      if (members[i].member_id === payload.memberId) { target = members[i]; break; }
    }
    if (!target) return { ok: false, error: { message: '사용자를 찾을 수 없습니다.' } };
    var hashed = hashPassword(payload.password);
    sheet.getRange(target._rowIndex, 6).setValue(hashed);
    sheet.getRange(target._rowIndex, 7).setValue(true);
    var token = createSession(target.member_id, 'leader');
    return { ok: true, data: { token: token, role: 'leader', memberId: target.member_id, memberName: target.name, teamId: target.team_id || '' } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
}

function getMemberList(token) {
  try {
    var auth = verifyToken(token);
    if (!auth.valid) return { ok: false, error: { message: auth.message } };
    var members = getSheetObjects('Members');
    var unassigned = [], allMembers = [];
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      if (m.role !== 'admin') {
        var item = { member_id: m.member_id, name: m.name, class_info: m.class_info, team_id: m.team_id || '' };
        allMembers.push(item);
        if (!m.team_id) unassigned.push(item);
      }
    }
    return { ok: true, data: { unassigned: unassigned, all: allMembers } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
}

function createTeam(token, payload) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.waitLock(10000)) return { ok: false, error: { message: '동시 팀 생성 요청 대기 초과' } };
    var auth = verifyToken(token);
    if (!auth.valid || (auth.role !== 'leader' && auth.role !== 'admin')) return { ok: false, error: { message: '권한 없음' } };
    var config = getConfigMap();
    var minSize = parseInt(config.team_size_min || '2', 10);
    var maxSize = parseInt(config.team_size_max || '6', 10);
    var teamName = (payload.teamName || '').trim();
    var emblem = payload.emblem || 'ball_normal';
    var selectedMemberIds = payload.memberIds || [];
    if (!teamName) return { ok: false, error: { message: '팀 이름 입력 필요' } };
    if (selectedMemberIds.indexOf(auth.memberId) === -1) selectedMemberIds.push(auth.memberId);

    var membersSheet = getSheet('Members');
    var members = getSheetObjects('Members');
    var teams = getSheetObjects('Teams');

    for (var i = 0; i < teams.length; i++) {
      if (teams[i].team_name === teamName) return { ok: false, error: { message: '이미 존재' } };
    }
    for (var j = 0; j < members.length; j++) {
      if (selectedMemberIds.indexOf(members[j].member_id) !== -1 && members[j].team_id) {
        return { ok: false, error: { message: members[j].name + ' 학생은 이미 소속팀이 있습니다.' } };
      }
    }
    var newTeamId = 'T' + ('0' + (teams.length + 1)).slice(-2);
    var teamsSheet = getSheet('Teams');
    var now = new Date().toISOString();
    teamsSheet.appendRow([newTeamId, teamName, auth.memberId, emblem, 0, now, 'active']);

    for (var k = 0; k < members.length; k++) {
      if (selectedMemberIds.indexOf(members[k].member_id) !== -1) {
        var mRole = (members[k].member_id === auth.memberId) ? 'leader' : 'member';
        membersSheet.getRange(members[k]._rowIndex, 4).setValue(mRole);
        membersSheet.getRange(members[k]._rowIndex, 5).setValue(newTeamId);
      }
    }
    return { ok: true, data: { teamId: newTeamId, teamName: teamName, emblem: emblem, message: '팀 [' + teamName + '] 결성 완료!' } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
  finally { lock.releaseLock(); }
}

function getMissions(token) {
  try {
    var auth = verifyToken(token);
    if (!auth.valid) return { ok: false, error: { message: auth.message } };
    var missions = getSheetObjects('Missions');
    var logs = getSheetObjects('MissionLog');
    var config = getConfigMap();
    var myTeamAcquiredMap = {};
    for (var i = 0; i < logs.length; i++) {
      if (logs[i].team_id === auth.teamId) myTeamAcquiredMap[logs[i].mission_id] = logs[i];
    }
    var resultList = [];
    for (var j = 0; j < missions.length; j++) {
      var m = missions[j];
      if (m.status === 'draft' && auth.role !== 'admin') continue;
      var slots = [];
      try { slots = JSON.parse(m.slots_json || '[]'); } catch (e) {}
      var usedSlotIndices = [];
      for (var k = 0; k < logs.length; k++) {
        if (logs[k].mission_id === m.mission_id) usedSlotIndices.push(parseInt(logs[k].slot_index, 10));
      }
      var acquiredLog = myTeamAcquiredMap[m.mission_id] || null;
      resultList.push({
        mission_id: m.mission_id, title: m.title, description: m.description,
        points: parseInt(m.points || '0', 10), slot_count: parseInt(m.slot_count || '0', 10),
        slots: slots, used_slots: usedSlotIndices, acquire_type: m.acquire_type,
        ball_type: m.ball_type || 'normal', open_at: m.open_at, close_at: m.close_at,
        status: m.status, my_acquired: acquiredLog
      });
    }
    return { ok: true, data: { missions: resultList, teamId: auth.teamId, eventPhase: config.event_phase || 'building' } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
}

function acquireMission(token, payload) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.waitLock(10000)) return { ok: false, error: { message: '요청 대기 초과' } };
    var auth = verifyToken(token);
    if (!auth.valid || auth.role !== 'leader') return { ok: false, error: { message: '팀장만 가능' } };
    if (!auth.teamId) return { ok: false, error: { message: '팀 결성 필요' } };

    var missionId = payload.missionId;
    var missions = getSheetObjects('Missions');
    var targetMission = null;
    for (var i = 0; i < missions.length; i++) {
      if (missions[i].mission_id === missionId) { targetMission = missions[i]; break; }
    }
    if (!targetMission || targetMission.status !== 'open') return { ok: false, error: { message: '진행중 아님' } };

    var logsSheet = getSheet('MissionLog');
    var logs = getSheetObjects('MissionLog');
    for (var j = 0; j < logs.length; j++) {
      if (logs[j].mission_id === missionId && logs[j].team_id === auth.teamId) {
        return { ok: false, error: { message: '이미 획득함' } };
      }
    }

    var slots = [];
    try { slots = JSON.parse(targetMission.slots_json || '[]'); } catch (e) {}
    var usedIndices = [];
    for (var k = 0; k < logs.length; k++) {
      if (logs[k].mission_id === missionId) usedIndices.push(parseInt(logs[k].slot_index, 10));
    }
    var availableIndices = [];
    for (var s = 0; s < slots.length; s++) {
      if (usedIndices.indexOf(s) === -1) availableIndices.push(s);
    }
    if (availableIndices.length === 0) return { ok: false, error: { message: '마감되었습니다.' } };

    var selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    var slotContent = slots[selectedIndex] || '특별 야생 미션';
    var logId = 'LOG_' + Utilities.getUuid().substring(0, 8);
    var nowIso = new Date().toISOString();

    logsSheet.appendRow([logId, missionId, auth.teamId, selectedIndex, slotContent, nowIso, 'pending', '', '']);
    return { ok: true, data: { logId: logId, missionId: missionId, slotIndex: selectedIndex, slotContent: slotContent, ballType: targetMission.ball_type || 'normal', points: parseInt(targetMission.points || '0', 10), acquiredAt: nowIso } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
  finally { lock.releaseLock(); }
}

function getMyBag(token) {
  try {
    var auth = verifyToken(token);
    if (!auth.valid) return { ok: false, error: { message: auth.message } };
    if (!auth.teamId) return { ok: true, data: { items: [], teamName: '미배정' } };
    var logs = getSheetObjects('MissionLog');
    var missions = getSheetObjects('Missions');
    var teams = getSheetObjects('Teams');

    var teamName = auth.teamId;
    for (var t = 0; t < teams.length; t++) {
      if (teams[t].team_id === auth.teamId) { teamName = teams[t].team_name; break; }
    }

    var missionMap = {};
    for (var m = 0; m < missions.length; m++) missionMap[missions[m].mission_id] = missions[m];
    var myItems = [];
    for (var i = 0; i < logs.length; i++) {
      if (logs[i].team_id === auth.teamId) {
        var mis = missionMap[logs[i].mission_id] || {};
        myItems.push({
          log_id: logs[i].log_id, mission_id: logs[i].mission_id, title: mis.title || '미션',
          points: parseInt(mis.points || '0', 10), slot_index: logs[i].slot_index,
          slot_content: logs[i].slot_content, acquired_at: logs[i].acquired_at,
          result: logs[i].result, judged_at: logs[i].judged_at
        });
      }
    }
    return { ok: true, data: { items: myItems, teamId: auth.teamId, teamName: teamName } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
}

function getRanking(token) {
  try {
    var cache = CacheService.getScriptCache();
    var cachedData = cache.get('RANKING_DATA');
    var config = getConfigMap();

    if (config.ranking_visible === 'FALSE' || config.ranking_visible === false) {
      var authCheck = token ? verifyToken(token) : { role: 'guest' };
      if (authCheck.role !== 'admin') {
        return { ok: true, data: { hidden: true, message: '현재 랭킹보드가 비공개 모드입니다. 🏆' } };
      }
    }

    if (cachedData) return { ok: true, data: JSON.parse(cachedData) };

    var teams = getSheetObjects('Teams');
    var logs = getSheetObjects('MissionLog');
    var members = getSheetObjects('Members');

    var teamMembersMap = {};
    for (var m = 0; m < members.length; m++) {
      if (members[m].team_id) {
        if (!teamMembersMap[members[m].team_id]) teamMembersMap[members[m].team_id] = [];
        teamMembersMap[members[m].team_id].push(members[m].name);
      }
    }

    var teamClearedMap = {};
    for (var l = 0; l < logs.length; l++) {
      if (logs[l].result === 'success') teamClearedMap[logs[l].team_id] = (teamClearedMap[logs[l].team_id] || 0) + 1;
    }

    var rankingList = [];
    for (var i = 0; i < teams.length; i++) {
      var t = teams[i];
      if (t.status === 'disbanded') continue;
      rankingList.push({
        team_id: t.team_id, team_name: t.team_name, emblem: t.emblem || 'ball_normal',
        total_points: parseInt(t.total_points || '0', 10), cleared_count: teamClearedMap[t.team_id] || 0,
        members: teamMembersMap[t.team_id] || []
      });
    }

    rankingList.sort(function(a, b) {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return b.cleared_count - a.cleared_count;
    });

    for (var r = 0; r < rankingList.length; r++) rankingList[r].rank = r + 1;

    var payload = { ranking: rankingList, updatedAt: new Date().toISOString() };
    cache.put('RANKING_DATA', JSON.stringify(payload), 15);
    return { ok: true, data: payload };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
}

function adminGetDashboard(token) {
  try {
    var auth = verifyToken(token);
    if (!auth.valid || auth.role !== 'admin') return { ok: false, error: { message: '관리자 권한 필요' } };

    var members = getSheetObjects('Members');
    var teams = getSheetObjects('Teams');
    var missions = getSheetObjects('Missions');
    var logs = getSheetObjects('MissionLog');
    var config = getConfigMap();

    var pendingLogs = [];
    var teamMap = {};
    for (var t = 0; t < teams.length; t++) teamMap[teams[t].team_id] = teams[t];
    var misMap = {};
    for (var m = 0; m < missions.length; m++) misMap[missions[m].mission_id] = missions[m];

    for (var l = 0; l < logs.length; l++) {
      if (logs[l].result === 'pending') {
        var tm = teamMap[logs[l].team_id] || {};
        var ms = misMap[logs[l].mission_id] || {};
        pendingLogs.push({
          log_id: logs[l].log_id, team_id: logs[l].team_id, team_name: tm.team_name || logs[l].team_id,
          mission_title: ms.title || logs[l].mission_id, slot_content: logs[l].slot_content,
          points: parseInt(ms.points || '0', 10), acquired_at: logs[l].acquired_at
        });
      }
    }
    return { ok: true, data: { members: members, teams: teams, missions: missions, pendingLogs: pendingLogs, config: config } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
}

function adminJudge(token, payload) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.waitLock(10000)) return { ok: false, error: { message: '잠시 후 다시 시도' } };
    var auth = verifyToken(token);
    if (!auth.valid || auth.role !== 'admin') return { ok: false, error: { message: '관리자 권한 필요' } };

    var logId = payload.logId;
    var result = payload.result;
    var logsSheet = getSheet('MissionLog');
    var logs = getSheetObjects('MissionLog');
    var targetLog = null;
    for (var i = 0; i < logs.length; i++) {
      if (logs[i].log_id === logId) { targetLog = logs[i]; break; }
    }
    if (!targetLog) return { ok: false, error: { message: '기록을 찾을 수 없음' } };

    var nowIso = new Date().toISOString();
    logsSheet.getRange(targetLog._rowIndex, 7).setValue(result);
    logsSheet.getRange(targetLog._rowIndex, 8).setValue(auth.memberId);
    logsSheet.getRange(targetLog._rowIndex, 9).setValue(nowIso);

    if (result === 'success') {
      var missions = getSheetObjects('Missions');
      var pointsToGive = 10;
      for (var m = 0; m < missions.length; m++) {
        if (missions[m].mission_id === targetLog.mission_id) {
          pointsToGive = parseInt(missions[m].points || '10', 10); break;
        }
      }
      var pointsSheet = getSheet('Points');
      pointsSheet.appendRow(['P_' + Utilities.getUuid().substring(0, 8), targetLog.team_id, pointsToGive, '미션 성공: ' + targetLog.slot_content, logId, auth.memberId, nowIso]);
      recalculateTeamPoints(targetLog.team_id);
    }

    CacheService.getScriptCache().remove('RANKING_DATA');
    return { ok: true, data: { message: '판정 저장 완료' } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
  finally { lock.releaseLock(); }
}

function recalculateTeamPoints(teamId) {
  var points = getSheetObjects('Points');
  var total = 0;
  for (var i = 0; i < points.length; i++) {
    if (points[i].team_id === teamId) total += parseInt(points[i].delta || '0', 10);
  }
  var teamsSheet = getSheet('Teams');
  var teams = getSheetObjects('Teams');
  for (var t = 0; t < teams.length; t++) {
    if (teams[t].team_id === teamId) {
      teamsSheet.getRange(teams[t]._rowIndex, 5).setValue(total); break;
    }
  }
}

function adminUpsertMembers(token, memberList) {
  try {
    var auth = verifyToken(token);
    if (!auth.valid || auth.role !== 'admin') return { ok: false, error: { message: '관리자 권한 필요' } };
    var membersSheet = getSheet('Members');
    var existing = getSheetObjects('Members');
    for (var i = 0; i < memberList.length; i++) {
      var item = memberList[i];
      if (!item.name) continue;
      var newId = 'M' + ('00' + (existing.length + i + 1)).slice(-3);
      membersSheet.appendRow([newId, item.name, item.class_info || '', 'member', '', '', false, new Date().toISOString()]);
    }
    return { ok: true, data: { message: memberList.length + '명 추가 완료' } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
}

function adminUpdateConfig(token, payload) {
  try {
    var auth = verifyToken(token);
    if (!auth.valid || auth.role !== 'admin') return { ok: false, error: { message: '관리자 권한 필요' } };
    var configSheet = getSheet('Config');
    var data = configSheet.getDataRange().getValues();
    for (var key in payload) {
      var found = false;
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === key) { configSheet.getRange(i + 1, 2).setValue(payload[key]); found = true; break; }
      }
      if (!found) configSheet.appendRow([key, payload[key], '']);
    }
    return { ok: true, data: { message: '설정 저장 완료' } };
  } catch (err) { return { ok: false, error: { message: err.toString() } }; }
}
