"use client";

import { useState, useSyncExternalStore } from "react";

import {
  applyRecommendationAction,
  createRecommendationExplorerState,
  createTripPlanSnapshot,
  createTripPlanStorage,
  getHiddenRecommendations,
  restoreRecommendationExplorerState,
  updateRecommendationTripSetup,
} from "@/domain";

import type {
  DifficultyLevel,
  PlaceCategory,
  RecommendationExplorerState,
  RecommendationTripSetup,
  SelectionType,
  TimeBlock,
  TripPlanStorage,
  TravelStyle,
} from "@/domain";

import { TripWorkspace } from "./trip-workspace";

const travelStyleOptions: readonly {
  value: TravelStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "first_time_free_travel",
    label: "첫 자유여행",
    description: "이동이 단순한 대표 코스",
  },
  {
    value: "food_focused",
    label: "먹거리 중심",
    description: "시장과 로컬 음식 우선",
  },
  {
    value: "classic_landmarks",
    label: "대표 명소",
    description: "처음 가면 놓치기 아쉬운 곳",
  },
  {
    value: "slow_paced",
    label: "여유롭게",
    description: "공원과 카페가 있는 낮은 강도",
  },
  {
    value: "day_trip",
    label: "근교 여행",
    description: "단수이·지우펀 같은 반나절 이상 코스",
  },
];

const categoryLabels: Record<PlaceCategory, string> = {
  landmark: "랜드마크",
  temple: "사원",
  market: "시장",
  neighborhood: "동네 산책",
  nature: "자연",
  day_trip: "근교 여행",
  food: "먹거리",
  museum: "박물관",
  shopping: "쇼핑",
  cafe: "카페",
};

const timeLabels: Record<TimeBlock, string> = {
  morning: "오전",
  lunch: "점심",
  afternoon: "오후",
  sunset: "노을",
  evening: "저녁",
};

const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: "가벼움",
  moderate: "보통",
  high: "도전적",
};

const actionLabels: Partial<Record<SelectionType, string>> = {
  must_go: "Keep",
  interested: "Maybe",
};

export function RecommendationExplorer() {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot,
  );
  const storage = hydrated
    ? createTripPlanStorage({ storage: window.localStorage })
    : null;
  const snapshot = storage?.load() ?? null;

  return (
    <RecommendationExplorerContent
      key={hydrated ? "hydrated" : "server"}
      initialState={
        snapshot
          ? restoreRecommendationExplorerState(snapshot)
          : createRecommendationExplorerState()
      }
      initiallyStarted={snapshot !== null}
      storage={storage}
    />
  );
}

function RecommendationExplorerContent({
  initialState,
  initiallyStarted,
  storage,
}: {
  readonly initialState: RecommendationExplorerState;
  readonly initiallyStarted: boolean;
  readonly storage: TripPlanStorage | null;
}) {
  const [state, setState] = useState(initialState);
  const [started, setStarted] = useState(initiallyStarted);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const updateState = (
    createNextState: (current: typeof state) => typeof state,
  ) => {
    const nextState = createNextState(state);

    setState(nextState);
    storage?.save(
      createTripPlanSnapshot(nextState, new Date().toISOString()),
    );
  };

  const saveState = () => {
    storage?.save(
      createTripPlanSnapshot(state, new Date().toISOString()),
    );
  };

  const updateSetup = (setup: Partial<RecommendationTripSetup>) => {
    updateState((current) =>
      updateRecommendationTripSetup(current, {
        durationDays: setup.durationDays ?? current.trip.durationDays,
        companionCount: setup.companionCount ?? current.trip.companionCount,
        travelStyles: setup.travelStyles ?? current.trip.travelStyles,
      }),
    );
  };

  const keptCount = state.selections.filter(
    (selection) => selection.selectionType === "must_go",
  ).length;
  const maybeCount = state.selections.filter(
    (selection) => selection.selectionType === "interested",
  ).length;
  const hiddenPlaces = getHiddenRecommendations(state);

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#1c1b18]">
      <header className="border-b border-[#ded8ca] bg-[#fffdf8]/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#8a4b38]">
              Taipei MVP
            </p>
            <p className="mt-1 text-xl font-semibold">Travelus</p>
          </div>
          <div className="rounded-full bg-[#1c1b18] px-4 py-2 text-sm font-semibold text-white">
            {state.trip.durationDays - 1}박 {state.trip.durationDays}일 · {state.trip.companionCount}명
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10 lg:py-10">
        <section className="self-start rounded-[1.75rem] border border-[#ded8ca] bg-[#fffdf8] p-5 shadow-[0_20px_60px_rgba(60,48,33,0.09)] sm:p-7 lg:sticky lg:top-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-[#f2ddd3] px-3 py-1 text-xs font-semibold text-[#8a4b38]">
              01 · 여행 조건
            </span>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              계획 부담은 줄이고,
              <br />갈 곳부터 골라보세요.
            </h1>
            <p className="text-sm leading-6 text-[#685f52] sm:text-base">
              타이베이 기본 여행 조건을 가볍게 조정하면 취향에 맞는 장소부터 보여드려요.
            </p>
          </div>

          <form
            className="mt-7 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              saveState();
              setStarted(true);
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold">목적지</span>
              <select
                className="w-full rounded-xl border border-[#d8cfbf] bg-white px-4 py-3 text-sm outline-none focus:border-[#8a4b38]"
                value="taipei"
                onChange={() => undefined}
              >
                <option value="taipei">Taipei, Taiwan</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold">여행 기간</span>
                <select
                  className="w-full rounded-xl border border-[#d8cfbf] bg-white px-4 py-3 text-sm outline-none focus:border-[#8a4b38]"
                  value={state.trip.durationDays}
                  onChange={(event) =>
                    updateSetup({ durationDays: Number(event.target.value) })
                  }
                >
                  <option value={3}>2박 3일</option>
                  <option value={4}>3박 4일</option>
                  <option value={5}>4박 5일</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold">동행 인원</span>
                <input
                  className="w-full rounded-xl border border-[#d8cfbf] bg-white px-4 py-3 text-sm outline-none focus:border-[#8a4b38]"
                  min={1}
                  max={6}
                  type="number"
                  value={state.trip.companionCount}
                  onChange={(event) =>
                    updateSetup({ companionCount: Number(event.target.value) })
                  }
                />
              </label>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">여행 스타일</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {travelStyleOptions.map((option) => {
                  const selected = state.trip.travelStyles.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      aria-pressed={selected}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-[#8a4b38] bg-[#f8e8df]"
                          : "border-[#ded8ca] bg-white hover:border-[#b8aa95]"
                      }`}
                      type="button"
                      onClick={() =>
                        updateSetup({
                          travelStyles: selected
                            ? state.trip.travelStyles.filter(
                                (style) => style !== option.value,
                              )
                            : [...state.trip.travelStyles, option.value],
                        })
                      }
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#746a5c]">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button
              className="w-full rounded-xl bg-[#1c1b18] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#35312b]"
              type="submit"
            >
              {started ? "추천 다시 보기" : "추천 시작하기"}
            </button>
          </form>
        </section>

        <section aria-live="polite" className="min-w-0">
          {started && workspaceOpen ? (
            <TripWorkspace
              state={state}
              onBack={() => setWorkspaceOpen(false)}
            />
          ) : started ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 border-b border-[#ded8ca] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4b38]">
                    02 · 추천 탐색
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">타이베이에서 무엇을 할까요?</h2>
                  <p className="mt-2 text-sm text-[#685f52]">
                    Keep은 루트 우선순위로, Maybe는 유연한 후보로 남습니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-[#1c1b18] px-3 py-2 text-white">Keep {keptCount}</span>
                  <span className="rounded-full border border-[#cfc5b5] bg-white px-3 py-2">Maybe {maybeCount}</span>
                  <button
                    className="rounded-full bg-[#8a4b38] px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={keptCount + maybeCount === 0}
                    type="button"
                    onClick={() => setWorkspaceOpen(true)}
                  >
                    작업공간 열기
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {state.recommendations.map((place, index) => {
                  const selection = state.selections.find(
                    (item) => item.placeId === place.placeId,
                  );

                  return (
                    <article
                      key={place.placeId}
                      className="overflow-hidden rounded-2xl border border-[#ded8ca] bg-[#fffdf8] shadow-[0_12px_35px_rgba(60,48,33,0.07)]"
                    >
                      <div className="grid sm:grid-cols-[8rem_1fr]">
                        <div className="flex min-h-28 flex-col justify-between bg-[#eadfce] p-4 text-[#5d4e3d]">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Pick {String(index + 1).padStart(2, "0")}</span>
                          <span className="text-3xl font-semibold">{place.area.slice(0, 2).toUpperCase()}</span>
                        </div>

                        <div className="p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold">{place.name}</h3>
                                <span className="rounded-full bg-[#f2ddd3] px-2.5 py-1 text-xs font-semibold text-[#8a4b38]">
                                  {categoryLabels[place.category]}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-[#746a5c]">{place.area}</p>
                            </div>
                            {selection ? (
                              <span className="self-start rounded-full bg-[#e5eadf] px-3 py-1 text-xs font-semibold text-[#536345]">
                                {actionLabels[selection.selectionType]}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[#5f5648]">
                            <span className="rounded-lg bg-[#f3eee5] px-2.5 py-1.5">
                              {place.recommendedTimeTags.map((tag) => timeLabels[tag]).join(" · ")}
                            </span>
                            <span className="rounded-lg bg-[#f3eee5] px-2.5 py-1.5">체류 {place.averageStayMinutes}분</span>
                            <span className="rounded-lg bg-[#f3eee5] px-2.5 py-1.5">난이도 {difficultyLabels[place.difficulty]}</span>
                          </div>

                          <p className="mt-4 text-sm leading-6 text-[#5f5648]">{place.recommendationReason}</p>

                          <div className="mt-5 grid grid-cols-3 gap-2">
                            {(["keep", "maybe", "hide"] as const).map((action) => {
                              const active =
                                (action === "keep" && selection?.selectionType === "must_go") ||
                                (action === "maybe" && selection?.selectionType === "interested");

                              return (
                                <button
                                  key={action}
                                  aria-pressed={active}
                                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    active || action === "keep"
                                      ? "bg-[#1c1b18] text-white"
                                      : action === "hide"
                                        ? "text-[#8a4b38] hover:bg-[#f8e8df]"
                                        : "border border-[#d8cfbf] bg-white hover:border-[#9d8f7a]"
                                  }`}
                                  type="button"
                                  onClick={() =>
                                    updateState((current) =>
                                      applyRecommendationAction(current, {
                                        placeId: place.placeId,
                                        action,
                                      }),
                                    )
                                  }
                                >
                                  {action === "keep" ? "Keep" : action === "maybe" ? "Maybe" : "Hide"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {hiddenPlaces.length > 0 ? (
                <details className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-4 sm:p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-[#685f52]">
                    숨긴 장소 {hiddenPlaces.length}
                  </summary>
                  <div className="mt-4 space-y-3">
                    {hiddenPlaces.map((place) => (
                      <article
                        key={place.placeId}
                        className="rounded-xl border border-[#e9e2d6] bg-[#f7f5f0] p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">{place.name}</p>
                          <p className="mt-1 text-xs text-[#746a5c]">
                            {place.area}
                          </p>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {(["restore", "keep", "maybe"] as const).map(
                            (action) => (
                              <button
                                key={action}
                                className="rounded-lg border border-[#d8cfbf] bg-white px-2 py-2 text-xs font-semibold hover:border-[#9d8f7a]"
                                type="button"
                                onClick={() =>
                                  updateState((current) =>
                                    applyRecommendationAction(current, {
                                      placeId: place.placeId,
                                      action,
                                    }),
                                  )
                                }
                              >
                                {action === "restore"
                                  ? "다시 보기"
                                  : action === "keep"
                                    ? "Keep"
                                    : "Maybe"}
                              </button>
                            ),
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[26rem] items-center justify-center rounded-[1.75rem] border border-dashed border-[#cfc5b5] bg-[#fffdf8]/60 p-8 text-center">
              <div className="max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4b38]">Ready when you are</p>
                <h2 className="mt-3 text-2xl font-semibold">왼쪽 조건을 확인하고 추천을 시작하세요.</h2>
                <p className="mt-3 text-sm leading-6 text-[#685f52]">검색어를 고민하지 않아도 타이베이 대표 장소와 취향별 후보를 한 번에 비교할 수 있어요.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function subscribeToHydration(): () => void {
  return () => undefined;
}

function getHydratedSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}
