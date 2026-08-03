import type { MapPin, MapPinKind } from "@/features/map/model/map-projection";

import { positionMapPins } from "./mock-map-position";

const kindLabels: Record<MapPinKind, string> = {
  route: "주요 루트",
  interest: "관심 후보",
  nearby: "근처 후보",
  rainy_day: "비 오는 날",
};

const pinClasses: Record<MapPinKind, string> = {
  route: "bg-[#1c1b18] text-white",
  interest: "bg-[#fff3dc] text-[#8a4b38] ring-1 ring-[#c47a52]",
  nearby: "bg-[#e2f2ed] text-[#236353] ring-1 ring-[#5b9b8a]",
  rainy_day: "bg-[#e7eef8] text-[#315a86] ring-1 ring-[#6f91b5]",
};

export function MockMapPanel({ pins }: { readonly pins: readonly MapPin[] }) {
  const positionedPins = positionMapPins(pins);
  const routePins = pins.filter((pin) => pin.kind === "route");
  const candidatePins = pins.filter((pin) => pin.kind !== "route");

  return (
    <div aria-label="루트와 후보 핀 지도" className="space-y-4">
      <div className="relative min-h-[26rem] overflow-hidden rounded-[1.75rem] border border-[#cfc5b5] bg-[#e8e1d5] p-5">
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(#c9bca8_1px,transparent_1px),linear-gradient(90deg,#c9bca8_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#685f52]">
            Mock map · Taipei coordinates
          </p>
          <h3 className="mt-2 text-xl font-semibold">중심 루트와 유연한 후보</h3>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {(Object.keys(kindLabels) as MapPinKind[]).map((kind) => (
              <span
                key={kind}
                className={`rounded-full px-2.5 py-1.5 ${pinClasses[kind]}`}
              >
                {kindLabels[kind]} {pins.filter((pin) => pin.kind === kind).length}
              </span>
            ))}
          </div>
        </div>

        {positionedPins.length > 0 ? (
          <div className="absolute inset-x-5 bottom-5 top-32">
            {positionedPins.map(({ pin, x, y }) => (
              <div
                key={pin.pinId}
                aria-label={`${kindLabels[pin.kind]}: ${pin.label}`}
                className={`absolute -translate-y-1/2 ${
                  x < 20
                    ? ""
                    : x > 80
                      ? "-translate-x-full"
                      : "-translate-x-1/2"
                }`}
                style={{ left: `${x}%`, top: `${y}%` }}
                title={`${pin.label} (${pin.coordinates.lat}, ${pin.coordinates.lng})`}
              >
                <span
                  className={`flex max-w-40 items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold shadow-lg ${pinClasses[pin.kind]}`}
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/90 text-[10px] text-[#1c1b18]">
                    {pin.kind === "route" ? pin.routeOrder : "•"}
                  </span>
                  <span className="truncate">{pin.label}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="relative z-10 mt-10 max-w-sm text-sm leading-6 text-[#685f52]">
            추천에서 장소를 고르면 좌표를 가진 루트와 후보 핀이 여기에 표시됩니다.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-4">
          <p className="text-xs font-semibold uppercase text-[#685f52]">Route pins</p>
          <p className="mt-2 text-2xl font-semibold">{routePins.length}</p>
          <p className="mt-1 text-sm text-[#746a5c]">Keep으로 고른 중심 동선</p>
        </div>
        <div className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-4">
          <p className="text-xs font-semibold uppercase text-[#685f52]">Candidate pins</p>
          <p className="mt-2 text-2xl font-semibold">{candidatePins.length}</p>
          <p className="mt-1 text-sm text-[#746a5c]">관심·근처·날씨 대안 후보</p>
        </div>
      </div>

      {candidatePins.length > 0 ? (
        <div className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-4">
          <h3 className="font-semibold">후보 메모</h3>
          <div className="mt-3 space-y-2">
            {candidatePins.map((pin) => (
              <div
                key={pin.pinId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>
                  {pin.label}
                  <span className="mt-0.5 block text-xs text-[#746a5c]">
                    {pin.description}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${pinClasses[pin.kind]}`}>
                  {kindLabels[pin.kind]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
