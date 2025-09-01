import React, { useMemo, useState } from "react";

const DEFAULT_BAG = [
  { key: "driver", label: "Driver", carry: 250 },
  { key: "5w", label: "5 Wood", carry: 220 },
  { key: "4i", label: "4 Iron", carry: 200 },
  { key: "5i", label: "5 Iron", carry: 180 },
  { key: "6i", label: "6 Iron", carry: 170 },
  { key: "7i", label: "7 Iron", carry: 150 },
  { key: "8i", label: "8 Iron", carry: 140 },
  { key: "9i", label: "9 Iron", carry: 130 },
  { key: "p", label: "Pitching Wedge (P)", carry: 120 },
  { key: "48", label: "48° Wedge", carry: 100 },
  { key: "56", label: "56° Wedge", carry: 80 },
];

const WIND_DIRECTIONS = [
  { code: "N", label: "Headwind", thetaDeg: 0, arrow: "↓", rotate: 0 },
  { code: "NE", label: "Headwind / L→R", thetaDeg: 45, arrow: "↘", rotate: 45 },
  { code: "E", label: "Left → Right", thetaDeg: 90, arrow: "→", rotate: 90 },
  { code: "SE", label: "Tailwind / L→R", thetaDeg: 135, arrow: "↗", rotate: 135 },
  { code: "S", label: "Tailwind", thetaDeg: 180, arrow: "↑", rotate: 180 },
  { code: "SW", label: "Tailwind / R→L", thetaDeg: 225, arrow: "↖", rotate: 225 },
  { code: "W", label: "Right → Left", thetaDeg: 270, arrow: "←", rotate: 270 },
  { code: "NW", label: "Headwind / R→L", thetaDeg: 315, arrow: "↙", rotate: 315 },
];

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatMeters(n) {
  return `${Math.round(n)} m`;
}

export default function GolfClubSelector() {
  const [distance, setDistance] = useState(150);
  const [elevation, setElevation] = useState(0);
  const [windSpeed, setWindSpeed] = useState(0);
  const [windDir, setWindDir] = useState("N");

  const [distanceInput, setDistanceInput] = useState(150);
  const [elevationInput, setElevationInput] = useState(0);
  const [windSpeedInput, setWindSpeedInput] = useState(0);
  const [windDirInput, setWindDirInput] = useState("N");

  const [bag, setBag] = useState(DEFAULT_BAG);
  const [showEditor, setShowEditor] = useState(false);

  const HEADWIND_PCT_PER_MPS = 0.008;
  const TAILWIND_PCT_PER_MPS = -0.005;
  const UPHILL_M_PER_M = 1.25;
  const DOWNHILL_M_PER_M = 1.0;

  const windTheta = useMemo(() => {
    const d = WIND_DIRECTIONS.find((w) => w.code === windDir) || WIND_DIRECTIONS[0];
    return d.thetaDeg;
  }, [windDir]);

  const { effectiveDistance, windAdjust, elevationAdjust } = useMemo(() => {
    const along = windSpeed * Math.cos(toRadians(windTheta));
    const windPct = along >= 0 ? along * HEADWIND_PCT_PER_MPS : along * TAILWIND_PCT_PER_MPS;
    const windAdj = distance * windPct;

    const elevAdj = elevation >= 0 ? elevation * UPHILL_M_PER_M : elevation * DOWNHILL_M_PER_M;

    return {
      effectiveDistance: Math.max(0, distance + windAdj + elevAdj),
      windAdjust: windAdj,
      elevationAdjust: elevAdj,
    };
  }, [distance, elevation, windSpeed, windTheta]);

  const recommendation = useMemo(() => {
    const sorted = [...bag].sort((a, b) => a.carry - b.carry);
    let primary = sorted.find((c) => c.carry >= effectiveDistance);
    if (!primary) primary = sorted[sorted.length - 1];

    const swingPct = clamp((effectiveDistance / primary.carry) * 100, 50, 115);

    const idx = sorted.findIndex((c) => c.key === primary.key);
    const altDown = sorted[idx - 1];
    const altUp = sorted[idx + 1];

    const alts = [];
    if (altDown) alts.push({ ...altDown, swingPct: clamp((effectiveDistance / altDown.carry) * 100, 50, 115) });
    if (altUp) alts.push({ ...altUp, swingPct: clamp((effectiveDistance / altUp.carry) * 100, 50, 115) });

    return {
      primary: { ...primary, swingPct, forceLabel: forceLabel(swingPct) },
      alternatives: alts.map((c) => ({ ...c, forceLabel: forceLabel(c.swingPct) })),
      needsMoreThanDriver: effectiveDistance > sorted[sorted.length - 1].carry,
    };
  }, [bag, effectiveDistance]);

  function forceLabel(pct) {
    if (pct < 65) return "very smooth";
    if (pct < 80) return "smooth";
    if (pct < 95) return "normal";
    if (pct < 105) return "firm";
    return "all out";
  }

  function updateBagCarry(key, carry) {
    setBag((prev) => prev.map((c) => (c.key === key ? { ...c, carry: Number(carry) || 0 } : c)));
  }

  function applyInputs() {
    setDistance(Number(distanceInput) || 0);
    setElevation(Number(elevationInput) || 0);
    setWindSpeed(Number(windSpeedInput) || 0);
    setWindDir(windDirInput);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold">Golf Club Selector</h1>
          </div>
        </header>
        {/* Inputs, summary, recommendation, bag editor ... (full content same as in canvas) */}
      </div>
    </div>
  );
}
