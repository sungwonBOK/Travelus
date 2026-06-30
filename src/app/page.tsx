const recommendationCards = [
  {
    title: "용산사와 보피랴오",
    area: "Wanhua",
    tag: "오전 산책",
    reason: "타이베이 첫날에 부담 없이 도시의 오래된 결을 익히기 좋습니다.",
  },
  {
    title: "단수이 선셋 코스",
    area: "Tamsui",
    tag: "노을",
    reason: "오후 이동 후 강변, 노을, 간단한 저녁까지 자연스럽게 이어집니다.",
  },
  {
    title: "스린 야시장",
    area: "Shilin",
    tag: "저녁",
    reason: "첫 자유여행자도 선택지가 많고 늦은 시간 동선이 단순합니다.",
  },
];

const flowSteps = ["여행 조건 입력", "추천 장소 분류", "느슨한 루트 생성"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#1c1b18]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-[#ded8ca] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b6f5e]">
              Taipei MVP
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Travelus</h1>
          </div>
          <span className="rounded-full bg-[#1c1b18] px-4 py-2 text-sm font-medium text-white">
            3박 4일
          </span>
        </header>

        <div className="grid flex-1 gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <section className="flex flex-col gap-7">
            <div className="space-y-5">
              <p className="inline-flex rounded-full border border-[#cfc5b5] px-3 py-1 text-sm font-medium text-[#5f5648]">
                자유여행은 그대로, 계획 부담만 줄이기
              </p>
              <div className="space-y-4">
                <h2 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                  타이베이에서 갈 곳을 고르고, 하루 흐름만 가볍게 잡으세요.
                </h2>
                <p className="max-w-xl text-base leading-7 text-[#5f5648] sm:text-lg">
                  Travelus는 빡빡한 시간표 대신 must-go, 관심 장소, 제외 장소를
                  나누고 지도 후보를 남겨두는 여행 큐레이션 작업공간입니다.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {flowSteps.map((step, index) => (
                <div
                  key={step}
                  className="border border-[#ded8ca] bg-white/70 p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-[#8a4b38]">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#ded8ca] bg-[#fffdf8] p-4 shadow-[0_24px_80px_rgba(60,48,33,0.12)] sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#7b6f5e]">
                    추천 탐색
                  </p>
                  <h3 className="text-xl font-semibold">오늘 고를 후보</h3>
                </div>
                <span className="rounded-full bg-[#eee7db] px-3 py-1 text-sm font-medium text-[#5f5648]">
                  12 places
                </span>
              </div>

              <div className="space-y-3">
                {recommendationCards.map((card) => (
                  <article
                    key={card.title}
                    className="grid gap-3 border border-[#e6dece] bg-white p-4 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{card.title}</h4>
                        <span className="rounded-full bg-[#f2ddd3] px-2 py-1 text-xs font-medium text-[#8a4b38]">
                          {card.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#7b6f5e]">{card.area}</p>
                      <p className="mt-3 text-sm leading-6 text-[#5f5648]">
                        {card.reason}
                      </p>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <button className="min-w-16 bg-[#1c1b18] px-3 py-2 text-sm font-medium text-white">
                        Keep
                      </button>
                      <button className="min-w-16 border border-[#ded8ca] px-3 py-2 text-sm font-medium">
                        Maybe
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="grid gap-3 border border-[#ded8ca] bg-[#f7f5f0] p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase text-[#7b6f5e]">
                    Plan
                  </p>
                  <p className="mt-1 font-semibold">느슨한 루트</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-[#7b6f5e]">
                    Map
                  </p>
                  <p className="mt-1 font-semibold">후보 핀 유지</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-[#7b6f5e]">
                    Saved
                  </p>
                  <p className="mt-1 font-semibold">must-go 정리</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
