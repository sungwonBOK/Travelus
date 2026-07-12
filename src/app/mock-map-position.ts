import type { MapPin } from "@/domain";

export interface PositionedMapPin {
  readonly pin: MapPin;
  readonly x: number;
  readonly y: number;
}

export function positionMapPins(
  pins: readonly MapPin[],
): readonly PositionedMapPin[] {
  if (pins.length === 0) {
    return [];
  }

  const latitudes = pins.map((pin) => pin.coordinates.lat);
  const longitudes = pins.map((pin) => pin.coordinates.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;
  const pinsByCoordinates = new Map<string, MapPin[]>();

  for (const pin of pins) {
    const key = `${pin.coordinates.lat}:${pin.coordinates.lng}`;
    const group = pinsByCoordinates.get(key) ?? [];
    group.push(pin);
    pinsByCoordinates.set(key, group);
  }

  return pins.map((pin) => {
    const baseX =
      lngRange === 0
        ? 50
        : 8 + ((pin.coordinates.lng - minLng) / lngRange) * 84;
    const baseY =
      latRange === 0
        ? 50
        : 92 - ((pin.coordinates.lat - minLat) / latRange) * 84;
    const group =
      pinsByCoordinates.get(`${pin.coordinates.lat}:${pin.coordinates.lng}`) ??
      [pin];

    if (group.length === 1) {
      return { pin, x: baseX, y: baseY };
    }

    const angle = -Math.PI / 2 + (group.indexOf(pin) * Math.PI * 2) / group.length;
    const offset = 4;

    return {
      pin,
      x: clamp(baseX + Math.cos(angle) * offset, 4, 96),
      y: clamp(baseY + Math.sin(angle) * offset, 4, 96),
    };
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
