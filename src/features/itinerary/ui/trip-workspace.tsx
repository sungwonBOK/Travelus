"use client";

import { useState } from "react";

import { createTripWorkspaceView } from "@/features/itinerary/model/trip-workspace";

import { MockMapPanel } from "@/features/map/ui/mock-map-panel";

import type { RecommendationExplorerState } from "@/features/recommendations/model/recommendation-explorer";
import type { TimeBlock } from "@/entities/trip/model/types";

type WorkspaceTab = "plan" | "map" | "saved";

const tabLabels: Record<WorkspaceTab, string> = {
  plan: "Plan",
  map: "Map",
  saved: "Saved",
};

const timeLabels: Record<TimeBlock, string> = {
  morning: "오전",
  lunch: "점심",
  afternoon: "오후",
  sunset: "노을",
  evening: "저녁",
};

export function TripWorkspace({
  state,
  onBack,
}: {
  readonly state: RecommendationExplorerState;
  readonly onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("plan");
  const workspace = createTripWorkspaceView(state);

  return (
    <section aria-label="편집 가능한 여행 작업공간" className="space-y-5">
      <div className="rounded-[1.75rem] border border-[#ded8ca] bg-[#1c1b18] p-5 text-white sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d9b6a6]">
              03 · My workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              고정된 시간표가 아닌,
              <br />계속 바꿀 수 있는 여행판이에요.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d7d0c6]">
              추천으로 돌아가 Keep과 Maybe를 바꾸면 Plan, Map, Saved가 바로 다시 정리됩니다.
            </p>
          </div>
          <button
            className="self-start rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 sm:self-auto"
            type="button"
            onClick={onBack}
          >
            추천 계속 고르기
          </button>
        </div>
      </div>

      <nav
        aria-label="여행 작업공간 탭"
        className="grid grid-cols-3 gap-2 rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-2"
      >
        {(["plan", "map", "saved"] as const).map((tab) => (
          <button
            key={tab}
            aria-pressed={activeTab === tab}
            className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-[#1c1b18] text-white"
                : "text-[#685f52] hover:bg-[#f3eee5]"
            }`}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>

      {activeTab === "plan" ? (
        <div aria-label="일자별 느슨한 루트" className="grid gap-4">
          {workspace.planDays.map((day) => (
            <article
              key={day.day}
              className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between border-b border-[#e9e2d6] pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a4b38]">
                    Day {day.day}
                  </p>
                  <h3 className="mt-1 font-semibold">
                    {day.items.length > 0 ? "오늘의 중심 흐름" : "비워둔 자유 시간"}
                  </h3>
                </div>
                <span className="rounded-full bg-[#f3eee5] px-3 py-1 text-xs font-semibold text-[#685f52]">
                  {day.items.length} picks
                </span>
              </div>

              {day.items.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {day.items.map((item) => (
                    <div
                      key={item.routeId}
                      className="flex gap-3 rounded-xl bg-[#f7f5f0] p-3"
                    >
                      <span className="min-w-14 text-xs font-semibold text-[#8a4b38]">
                        {timeLabels[item.timeBlock]}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#746a5c]">
                          {item.recommendedReason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#746a5c]">
                  아직 넣지 않은 시간이에요. 추천을 더 고르거나 현지에서 즉흥적으로 채워도 됩니다.
                </p>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === "map" ? (
        <MockMapPanel pins={workspace.mapPins} />
      ) : null}

      {activeTab === "saved" ? (
        <div aria-label="저장한 장소" className="grid gap-4 sm:grid-cols-2">
          {([
            ["꼭 가고 싶은 곳", workspace.saved.mustGo],
            ["관심 후보", workspace.saved.interested],
          ] as const).map(([title, places]) => (
            <section
              key={title}
              className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{title}</h3>
                <span className="rounded-full bg-[#f3eee5] px-2.5 py-1 text-xs font-semibold text-[#685f52]">
                  {places.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {places.length > 0 ? (
                  places.map((place) => (
                    <article key={place.placeId} className="rounded-xl bg-[#f7f5f0] p-3">
                      <p className="text-sm font-semibold">{place.name}</p>
                      <p className="mt-1 text-xs text-[#746a5c]">{place.area}</p>
                      <p className="mt-2 text-xs leading-5 text-[#685f52]">
                        {place.recommendationReason}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[#746a5c]">
                    추천에서 장소를 골라 이 목록을 채워보세요.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}
