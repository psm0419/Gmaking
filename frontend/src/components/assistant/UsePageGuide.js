import { useLocation } from "react-router-dom";
import { matchRoutes } from "react-router";
import { useMemo } from "react";

/**
 * 항상 { text: string, cta?: {label, action, key} } 형태로 반환합니다.
 * action: "openGuide" | (필요시 확장)
 */
const GUIDE_RULES = [
  {
    pattern: "/",
    guide: {
      text:
        `여기는 메인 페이지야. 메인 페이지는 웹사이트의 얼굴이라고 할 수 있지. 그 사이트의 첫인상을 좌우하는 곳이 메인 페이지야.
        우리 메인 페이지 어때? 예쁘지?
        헤더를 통해서 우리 주요 컨텐츠로 이동 할 수 있고 메인 하단 중앙에는 네 대표 캐릭터의 정보를 띄워줘.
        대표 캐릭터가 없다면 캐릭터를 만들거나 마이 페이지에서 대표 캐릭터를 설정해봐!`,
    },
  },
  {
    pattern: "/chat-entry",
    guide: {
      text:
        "이곳은 채팅 입장 페이지에요. 캐릭터를 고르고 입장해보세요. 더 자세히는 아래 버튼을 눌러 확인하세요!",
      cta: { label: "채팅 AI 알아보기", action: "openGuide", key: "chat" },
    },
  },
  {
    pattern: "/pvp/match",
    guide: {
      text: "PVP 전투 로비예요. 매칭을 시작하고 전투 하이라이트 해설을 들어보세요.",
    },
  },
  {
    pattern: "/pvp/:battleId",
    guide: ({ params }) => ({
      text: `전투 로그 화면이에요. 배틀 #${params.battleId}의 턴별 기록을 볼 수 있어요.`,
    }),
  },
  {
    pattern: "/shop",
    guide: { text: `여긴 상점 페이지야! 우리 사이트는 지금 광고 제거 패스권과 부화기 패키지를 살 수 있어.
    광고 제거 패스는 **30일**동안 광고가 제거 돼. 게임을 진행할때 나타나는 광고가 신경쓰인다면 고려해볼만 하지! 광고는 겜만중이 운영되게 해주는 고마운 존재거든. 그래서 내가 무단으로 네 광고를 제거해줄 수는 없어. 광고 제거 패스를 구매해서 줘. 그럼 광고가 제거 되게 해줄게.
    부화기는 중요한 캐릭터를 부화시키는데 1개씩 사용 돼. 부화기는 매일 1개씩 무료로 지급되지만, 하루에 1개로 만족하지 못하겠다면 유료 부화기를 구매하는 것을 고려해봐!` },
  },
  {
    pattern: "/my-page",
    guide: { text: `여기는 마이 페이지야! … 더보기 아이콘을 클릭하면 회원정보를 수정할 수 있어! 우리 사이트에서 너를 상징할 프로필 이미지와 닉네임을 자유롭게 등록하고 수정해봐!
    보유하고 있는 아이템과 캐릭터들도 마이페이지에서 볼 수 있어. 캐릭터를 선택해서 내 캐릭터의 스텟을 확인하고 성장시켜봐. 참 성장은 PVE 게임을 일정 횟수 클리어해야 가능해` },
  },

  {
      pattern: "/ranking",
      guide: {
        text:
          `여기는 랭킹 페이지야. 우리 사이트에 존재하는 모든 캐릭터의 순위를 확인할 수 있지. 자신의 캐릭터 순위를 확인해봐! 만족스럽지 않다면, 다시 캐릭터를 부화시키거나 성장시켜봐.`,
      },
  },

  {
    pattern: "/community",
    guide: {
      text:
        `여기는 커뮤니티 페이지야. 여기서 유저들과 소통하고 내 캐릭터를 자랑할 수 있어! 글쓰기 버튼을 눌러 글을 쓰고 다른 사람들의 글에 댓글을 달아 봐.
        커뮤니티가 활성화 될수록 복작복작해질거야. 네가 글과 댓글로 우리 커뮤니티에 활기를 불어 넣어줄래?`,
    },
  },

  {
    pattern: "/create-charactor",
    guide: {
      text:
        `이곳은 캐릭터 생성 페이지야. 이 페이지에서는 무려 두 개의 AI 모델이 작동해.
        첫번째 AI 모델은 곰, 독수리, 펭귄, 거북이 이미지를 사용자가 입력하면 분류해주는 학습 모델이야. 우리가 직접 학습시킨 하나 뿐인 모델이라구!
        두번째 AI 모델은 쳇지피티야. 첫번째 AI가 분류해낸 결과에 따라 캐릭터 이미지를 생성해줘. 두가지 AI가 협력해서 하나의 캐릭터를 탄생시키는 거지!
        시간이 다소 걸리더라도 기대할만한 가치가 있는 캐릭터가 너에게 찾아올거야! 부화권으로 너만의 캐릭터를 만들어봐!`,
    },
  },
];

export default function usePageGuide() {
  const location = useLocation();

  return useMemo(() => {
    const matches = matchRoutes(
      GUIDE_RULES.map((r) => ({ path: r.pattern })),
      location
    );
    if (!matches?.length)
      return { text: "이 페이지에 대한 설명을 아직 준비하지 못했어요." };

    const match = matches[matches.length - 1];
    const rule = GUIDE_RULES.find((r) => r.pattern === match.route.path);
    if (!rule) return { text: "이 페이지에 대한 설명을 아직 준비하지 못했어요." };

    const g =
      typeof rule.guide === "function"
        ? rule.guide({ params: match.params, location })
        : rule.guide;

    // 항상 {text, cta?} 형태 보장
    return typeof g === "string" ? { text: g } : g;
  }, [location]);
}
