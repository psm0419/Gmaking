export const GUIDE_CONTENT = {
  pvp: {
    title: "PVP: AI 해설 기반 실시간 전투",
    pages: [
      {
        type: "text",
        body: [
          "겜만중의 PVP는 유저들과의 전투를 할 수 있는 게임이에요",
          "매치된 상대의 실제 데이터와 캐릭터를 가지고와 AI가 대신해서 전투에 임합니다",
          "백엔드에서 전투 알고리즘이 진행되고, 이 결과를 AI가 받아 해설해주어 실시간 전투를 체험할 수 있어요",
          "가위바위보와 같은 커맨드의 매커니즘을 파악하고 전략적으로 전투를 임해보세요. 상대가 강하더라도 선택에 따라 승리자가 될 수 있습니다!",
          "화면에서 상대방이 고른 선택지도 바로 확인할 수 있으며, 실제 대전 중계를 보고 있는듯한 몰입감을 줍니다",
          "PVP 대결이 종료되면 실시간 알림이 가서 상대방도 전투 결과와 내용을 받아 볼 수 있어요",
          "알림을 통해 재대결도 가능해서 로그 게임을 PVP로 즐기는 재미를 극대화 했습니다!",
        ],
        note: "모델: 대사/요약 gpt-4o-mini, 전투 규칙은 백엔드 처리",
      },
      { type: "media", imageUrl: "/images/guides/pvp1.png", caption: "상대방 찾기를 누르면 PVP를 진행할 상대방을 백엔드가 찾아옵니다." },
      { type: "media", imageUrl: "/images/guides/pvp2.png", caption: "전투에 나갈 내 캐릭터와 상대 캐릭터를 고르고 전투 시작을 누르세요!" },
      {
        type: "media",
        imageUrl: "/images/guides/pvp3.png",
        caption: `커맨드를 고르세요! 커맨드는 각자 상성이 있어요.
        상성을 생각하고 전략적으로 접근해서 선택해야해야 승리할 가능성이 높아져요.`,
      },
      {
        type: "media",
        imageUrl: "/images/guides/pvp6.png",
        caption: `선택의 결과를 확인하세요! 당신이 고른 커맨드와 AI가 고른 커맨드의 상성을 백엔드가 확인하고
        AI가 결과를 생동감 있는 전투 해설로 제공합니다! 로그 전투의 재미에 빠져보세요!`,
      },
      { type: "media", imageUrl: "/images/guides/pvp4.png", caption: "전투가 끝나면 상대방과 자신에게 전투 결과가 알림으로 옵니다. 마이페이지에서 알림을 확인하세요!" },
      {
        type: "media",
        imageUrl: "/images/guides/pvp5.png",
        caption: `재대결 버튼을 통해 다시 한 번 같은 상대와 싸울 수 있어요! 수련을 해서 재도전하거나 복수하세요!
        TIP) 로그 보러가기를 클릭하면 전투 결과를 자세하게 확인할 수 있어요.`,
      },
      { type: "media", imageUrl: "/images/guides/pvp7.png", caption: `로그를 확인해세요. 자신이 왜 졌는지, 뭐가 필요한지, 다음에는 어떻게 싸울 지 알 수 있습니다.` },
    ],
  },

  pve: {
    title: "PVE: 스토리텔러 AI",
    pages: [
      {
        type: "text",
        body: [
          "혼자 던전을 탐험하며, AI가 진행을 **서사로 묘사**해요.",
          "전투 규칙은 백엔드에서, AI는 상황 해설/대사 생성에 집중합니다.",
          "매 턴마다 AI가 전투 상황을 해석하여 실제 RPG처럼 실시간 전투 로그를 생성합니다.",
          "단순한 수치 로그가 아닌, 전투의 긴장감이나 캐릭터의 개성을 살린 서술형 전투대사까지 만들어내요.",
          "전투 시작 전 AI가 확률 로직을 이용해 일반 몬스터 또는 보스 몬스터를 결정합니다.",
          "단순한 시뮬레이션을 넘어 AI가 해설자 역할을 맡는 스토리형 자동 전투를 구현한 것이 PVE 시스템의 핵심이에요.",
        ],
        note: "사용 모델: GPT-4o-mini, TTS",
      },
      { type: "media", imageUrl: "/images/guides/pve1.png", caption: "PVE 캐릭터 선택 창이에요! 캐릭터와 맵을 선택해보세요!" },
      { type: "media", imageUrl: "/images/guides/pve2.png", caption: `선택한 해설 스타일이 GPT에 들어가는 프롬프트에 적용돼요.\n프롬프트는 지시문이라 생각하면 돼요. AI에게 원하는 해설을 지시해보세요.` },
      { type: "media", imageUrl: "/images/guides/pve3.png", caption: `전투를 시작해보세요! 전투를 시작하면 AI가 DB에 저장된 확률대로 일반몹이나 보스몹을 배정해줘요!\n음성으로 로그를 읽어주는 TTS 기능도 있답니다.` },
      { type: "media", imageUrl: "/images/guides/pve4.png", caption: `백조가 우아하게 떠다니지만 아래에서는 바쁘게 움직이듯, 백엔드에서 전투 알고리즘이 진행돼요.\n그 결과를 전해받은 AI가 상황에 맞게 해설을 해줍니다. 스테이지 클리어 횟수에 따라 나중에 캐릭터를 성장할 수 있어요!` },
      { type: "media", imageUrl: "/images/guides/pve5.png", caption: `상단 헤더의 로그를 클릭하면 로그 페이지로 이동해요. 전투 내용을 보고 싶다면 언제든지 로그 페이지로 이동하세요!` },
      { type: "media", imageUrl: "/images/guides/pve6.png", caption: `전투 내용을 상세하게 볼 수 있어요. 짜릿했던 전투의 기억을 다시 한 번 확인하세요.` },
    ],
  },

  debate: {
    title: "AI 토론: 다중 AI 심판 시스템 체험",
    pages: [
      {
        type: "text",
        body: [
          "토론을 할 캐릭터와 주제를 선택하고 나면 두 캐릭터는 주제에대해 번갈아 발언합니다",
          "모든 발언은 OpenAI의 GPT 모델이 생성하며, 사용자는 이를 실시간으로 감상할 수 있습니다",
          "세종류의 AI 모델이 전체적인 대화를 분석하여 각각의 기준을 가지고 판단을 내립니다.",
          "Gemini : 직관적 감성과 흐름 중심의 판단을 내립니다.",
          "GPT-4o : 논리와 설득력 중심의 분석을 합니다.",
          "GPT-o1 : 간결하고 객관적인 요약형 판정을 내립니다",
          "AI가 토론을 하고 AI가 판단하는 AI로 이루어진 끝장 토론을 확인해보세요",
        ],
        note: "모델: GPT-4o-mini, GPT-o1-mini, Gemini-2.0-flash",
      },
      { type: "media", imageUrl: "/images/guides/debate1.png", caption: "AI 토론 배틀 메인 화면입니다." },
      { type: "media", imageUrl: "/images/guides/debate2.png", caption: "토론에 참여할 캐릭터를 선택하고 주제를 입력해주세요. AI의 성격과 주제를 담은 프롬프트가 AI에게 전달됩니다." },
      { type: "media", imageUrl: "/images/guides/debate3.png", caption: "프롬프트로 전달받은 성격을 바탕으로 양 캐릭터의 토론이 진행되요. 토론이 끝나면 AI가 자신의 기준대로 평가를 진행해요!" },
    ],
  },

  chat: {
    title: "채팅: 기억하고 성장하는 관계형 AI",
    pages: [
      {
        type: "text",
        body: [
          "겜만중의 채팅은 AI가 캐릭터로서 직접 대화를 생성해요",
          "캐릭터마다 페르소나가 만들어져요. 당신이 채팅방에 입장할때, 벡엔드에서 성격과 캐릭터의 배경을 합쳐주고 그게 페르소나가 돼요.",
          "페르소나는 캐릭터의 말투와 성격이 꾸준히 유지되게 하는 캐릭터성을 부여합니다.",
          "대화가 길어지면 모든 내용을 저장하지 앟고, 롱메모리 파이프라인을 통해 중요한 부분을 요약해 기억에 남겨요.",
          "대화 중에 중요 정보들을 추출해서 영구 저장해요. 원하는 호칭을 말해보세요! AI가 호칭을 추출하고 벡엔드가 이를 받아 영구적으로 기억합니다!",
          "요약과 장기기억을 가지고 있기때문에, 매 대화는 점점 더 자연스럽고 개인화된 경험으로 발전합니다!",
        ],
        note: "모델: gemini-2.0-flash(요약/맥락/대사), gpt-4o-mini(보조 모델), 백엔드 파이프라인으로 조립",
      },
      { type: "media", imageUrl: "/images/guides/chat1.png", caption: "대화하고 싶은 캐릭터를 마이페이지에서 선택하세요!" },
      { type: "media", imageUrl: "/images/guides/chat2.png", caption: "캐릭터를 선택했다면 대화하기를 누르세요. 대기방으로 입장합니다!" },
      {
        type: "media",
        imageUrl: "/images/guides/chat3.png",
        caption: `모든 대화는 00:00 시에 초기화되요. 하지만 캐릭터가 당신을 잊어버릴까 걱정하지 마세요!
          삭제 전에 AI가 당신과의 대화를 요약해서 저장해둔답니다.`,
      },
      {
        type: "media",
        imageUrl: "/images/guides/chat4.png",
        caption: `프롬프트는 AI에 제공하는 지시문이라고 할 수 있어요. 앞서 말했던 페르소나 + 롱메모리 + 당신의 메세지가
          프롬프트가 되어서 AI에게 전달되요! 백엔드가 모든 걸 처리하니까 당신은 캐릭터에게 가볍게 말을 걸어보세요!`,
      },
      {
        type: "media",
        imageUrl: "/images/guides/chat5.png",
        caption: `우리 겜만중은 단순한 응답이 아닌, 당신과의 대화를 기억하고 캐릭터에 맞춘 응답을 하는 관계형 AI입니다.
          대화를 나눠보세요! 캐릭터는 점점 더 똑똑해지고 당신을 친근하게 대할거에요!`,
      },
    ],
  },

  characterCreate: {
      title: "캐릭터 생성 : 이미지 분류 AI와 이미지 생성 AI의 협력",
      pages: [
        {
          type: "text",
          body: [
            "겜만중의 채팅은 AI가 캐릭터로서 직접 대화를 생성해요",
            "캐릭터마다 페르소나가 만들어져요. 당신이 채팅방에 입장할때, 벡엔드에서 성격과 캐릭터의 배경을 합쳐주고 그게 페르소나가 돼요.",
            "페르소나는 캐릭터의 말투와 성격이 꾸준히 유지되게 하는 캐릭터성을 부여합니다.",
            "대화가 길어지면 모든 내용을 저장하지 앟고, 롱메모리 파이프라인을 통해 중요한 부분을 요약해 기억에 남겨요.",
            "대화 중에 중요 정보들을 추출해서 영구 저장해요. 원하는 호칭을 말해보세요! AI가 호칭을 추출하고 벡엔드가 이를 받아 영구적으로 기억합니다!",
            "요약과 장기기억을 가지고 있기때문에, 매 대화는 점점 더 자연스럽고 개인화된 경험으로 발전합니다!",
          ],
          note: "모델: YOLOv8 학습 모델 (이미지 분류), GPT-DALL-E-3",
        },
        { type: "media", imageUrl: "/images/guides/imgcreate0.png", caption: "헤더의 캐릭터 뽑기나 하단 중앙의 새캐릭터 뽑기(추가 캐릭터 뽑기)를 클릭해서 캐릭터 생성페이지로 이동하세요!" },
        { type: "media", imageUrl: "/images/guides/imgcreate1.png",
            caption: `곰, 독수리, 펭귄, 거북이 중 하나의 사진을 업로드하고 이름을 부여한 후에 생성 버튼을 눌러 캐릭터를 만들어보세요!
                추가 프롬프트를 입력하면 좀 더 당신이 원하는 캐릭터가 탄생할거에요.` },
        { type: "media", imageUrl: "/images/guides/imgcreate2.png",
            caption: `AI 캐릭터가 생성중이에요.이미지 분류 모델이 어떤 동물인지 분류해내고 이미지 생성 모델이 결과를 받아 유저가 입력한
                프롬프트 맞춤으로 당신만의 캐릭터를 생성해요!
                당신이 기다리는 동안 두 AI가 협업을 하고 있어요. 시간이 조금 걸리더라도 이해해주세요.` },
        {
          type: "media",
          imageUrl: "/images/guides/imgcreate3.png",
          caption: `캐릭터가 만들어졌어요! 캐릭터가 마음에 안든다면 재생성을 시도해보세요. 재생성은 2번 밖에 시도할 수 없고 재생성을
          누른다면 이전의 친구는 떠나버리니 신중하게 선택하세요.
          만약 마음에 든다면 최종 확정 버튼을 누르세요. 그럼 캐릭터가 당신에게 완전히 귀속됩니다!`,
        },
        {
          type: "media",
          imageUrl: "/images/guides/imgcreate4.png",
          caption: `나만의 캐릭터가 완전히 생성되었어요! 생성된 캐릭터로 겜만중의 다양한 컨텐츠를 즐겨보세요!`,
        },
        {
          type: "media",
          imageUrl: "/images/guides/imgcreate5.png",
          caption: `생성한 캐릭터의 자세한 스텟은 마이페이지에서 확인할 수 있어요. 새로 만든 캐릭터를 클릭하고 스텟을 확인해보세요!`,
        },
      ],
    },
};

export default GUIDE_CONTENT;
