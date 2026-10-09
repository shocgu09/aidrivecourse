// AI 드라이브 코스 추천 — Cloudflare Pages Function
//
// 코스 생성(OpenAI)은 dt 사이트의 /api/drivecourse 가 한다 (2026-10-09).
// 거기서 DT Club 회원인지와 하루 횟수를 확인하고 프롬프트도 만든다. 이 함수는 회원의 ID 토큰과 고른 조건만 넘긴다.
// 예전엔 여기서 화면이 보낸 프롬프트를 그대로 OpenAI 에 넘겨 로그인 없이 아무 용도로나 쓸 수 있었다.
const DT_API = 'https://dt-1js.pages.dev';

export async function onRequestPost(context) {
  const authorization = context.request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    return json({ error: 'DT Club 회원 로그인이 필요합니다.' }, 401);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: '요청 형식이 올바르지 않습니다.' }, 400);
  }

  const { departure, people, duration, vibes, season, timeOfDay } = body || {};
  try {
    const res = await fetch(`${context.env.DT_API || DT_API}/api/drivecourse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify({ departure, people, duration, vibes, season, timeOfDay }),
    });
    const data = await res.json().catch(() => ({}));
    // 401·403·429 는 회원에게 그대로 알린다 (로그인 필요 · 회원 아님 · 오늘 한도)
    if (!res.ok || data.error) return json({ error: data.error || '추천에 실패했습니다.' }, res.ok ? 502 : res.status);
    return json({ text: data.text || '' });
  } catch {
    return json({ error: '추천에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
