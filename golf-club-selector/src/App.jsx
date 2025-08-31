import React, { useMemo, useState } from "react";

// Netlify-ready single-file React component.
// Drop this into a Vite/CRA project (e.g., src/App.jsx) and deploy to Netlify.
// Tailwind is optional but styles assume it's available.

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

// Wind directions relative to target line.
// Convention for UI: You are hitting TOWARD THE TOP of the screen.
// The arrow shows the direction the wind is BLOWING.
// ↓ = headwind (from target to you); ↑ = tailwind (from you toward target).
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
  // "Committed" values used for the calculation (update when you press Recalculate)
  const [distance, setDistance] = useState(150);
  const [elevation, setElevation] = useState(0);
  const [windSpeed, setWindSpeed] = useState(0);
  const [windDir, setWindDir] = useState("N");

  // Staged inputs bound to the UI controls (edit freely)
  const [distanceInput, setDistanceInput] = useState(150);
  const [elevationInput, setElevationInput] = useState(0);
  const [windSpeedInput, setWindSpeedInput] = useState(0);
  const [windDirInput, setWindDirInput] = useState("N");

  const [bag, setBag] = useState(DEFAULT_BAG);
  const [showEditor, setShowEditor] = useState(false);

  // Tuning knobs (simple-but-reasonable rules of thumb)
  const HEADWIND_PCT_PER_MPS = 0.008; // +0.8% effective distance per 1 m/s headwind
  const TAILWIND_PCT_PER_MPS = -0.005; // -0.5% per 1 m/s tailwind
  const UPHILL_M_PER_M = 1.25; // each 1 m uphill plays +1.25 m
  const DOWNHILL_M_PER_M = 1.0; // each 1 m downhill plays -1.0 m

  const windTheta = useMemo(() => {
    const d = WIND_DIRECTIONS.find((w) => w.code === windDir) || WIND_DIRECTIONS[0];
    return d.thetaDeg;
  }, [windDir]);

  const { effectiveDistance, windAdjust, elevationAdjust } = useMemo(() => {
    // Project wind into/against the line using cos(theta)
    const along = windSpeed * Math.cos(toRadians(windTheta)); // + headwind, - tailwind
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
    // Sort shortest → longest to pick the first club that covers the effective distance
    const sorted = [...bag].sort((a, b) => a.carry - b.carry);

    // Primary pick: first club whose baseline carry ≥ effectiveDistance
    let primary = sorted.find((c) => c.carry >= effectiveDistance);

    // If no club can reach, choose the longest (last)
    if (!primary) primary = sorted[sorted.length - 1];

    const swingPct = clamp((effectiveDistance / primary.carry) * 100, 50, 115);

    // Alternatives: one shorter, one longer around the primary
    const idx = sorted.findIndex((c) => c.key === primary.key);
    const altDown = sorted[idx - 1]; // shorter club
    const altUp = sorted[idx + 1]; // longer club

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
          <h1 className="text-2xl md:text-3xl font-bold">Golf Club Selector</h1>
          <button
            className="px-3 py-2 rounded-xl bg-white shadow hover:shadow-md border text-sm"
            onClick={() => setShowEditor((s) => !s)}
          >
            {showEditor ? "Close Bag Editor" : "Edit My Bag Distances"}
          </button>
        </header>

        {/* Inputs */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow p-4 space-y-4">
            <h2 className="font-semibold text-lg">Shot</h2>
            <label className="block text-sm">Target distance (m)</label>
            <input
              type="number"
              className="w-full border rounded-xl px-3 py-2"
              min={0}
              max={400}
              value={distanceInput}
              onChange={(e) => setDistanceInput(e.target.value)}
            />

            <label className="block text-sm mt-2">Elevation change (m)</label>
            <input
              type="range"
              className="w-full"
              min={-30}
              max={30}
              step={1}
              value={elevationInput}
              onChange={(e) => setElevationInput(Number(e.target.value))}
            />
            <div className="text-sm text-gray-600">{elevationInput} m ({elevationInput >= 0 ? "+ uphill" : "- downhill"})</div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-4">
            <h2 className="font-semibold text-lg">Wind</h2>
            <p className="text-xs text-gray-500 -mt-2">Arrows show the way the wind is blowing. You are hitting toward the TOP of the screen.</p>
            <label className="block text-sm">Direction</label>
            <div className="grid grid-cols-4 gap-2">
              {WIND_DIRECTIONS.map((d) => (
                <button
                  key={d.code}
                  onClick={() => setWindDirInput(d.code)}
                  className={`text-sm px-2 py-2 rounded-lg border flex items-center justify-center ${
                    windDirInput === d.code ? "bg-black text-white" : "bg-white"
                  }`}
                  title={`${d.arrow} ${d.label}`}
                >
                  <span className="text-lg leading-none">{d.arrow}</span>
                </button>
              ))}
            </div>

            <label className="block text-sm mt-2">Speed (m/s)</label>
            <input
              type="range"
              className="w-full"
              min={0}
              max={20}
              step={1}
              value={windSpeedInput}
              onChange={(e) => setWindSpeedInput(Number(e.target.value))}
            />
            <div className="text-sm text-gray-600">{windSpeedInput} m/s</div>
          </div>
        </section>

        {/* Summary of committed values */}
        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="font-semibold text-lg">Effective Yardage</h2>
            <button onClick={applyInputs} className="px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:shadow-md">
              Recalculate
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-gray-50">
              <div className="text-gray-500">Raw distance</div>
              <div className="text-xl font-semibold">{formatMeters(distance)}</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50">
              <div className="text-gray-500">Wind adjustment</div>
              <div className="text-xl font-semibold">{windAdjust >= 0 ? "+" : ""}{formatMeters(windAdjust)}</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50">
              <div className="text-gray-500">Elevation adjustment</div>
              <div className="text-xl font-semibold">{elevationAdjust >= 0 ? "+" : ""}{formatMeters(elevationAdjust)}</div>
            </div>
          </div>
          <div className="mt-4 text-base">
            Plays as <span className="font-semibold">{formatMeters(effectiveDistance)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Tip: change the inputs, then press <span className="font-semibold">Recalculate</span> to update the recommendation.</p>
        </section>

        {/* Recommendation based on committed values */}
        <section className="bg-white rounded-2xl shadow p-4 space-y-4">
          <h2 className="font-semibold text-lg">Recommendation</h2>

          {recommendation.needsMoreThanDriver ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              This shot plays longer than your longest club. Consider laying up or a different strategy.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 items-start">
              <div className="md:col-span-2">
                <div className="p-4 rounded-2xl bg-gray-50 border">
                  <div className="text-gray-500 text-sm">Primary</div>
                  <div className="text-2xl font-bold">{recommendation.primary.label}</div>
                  <div className="text-sm mt-1 text-gray-600">
                    Target swing: <span className="font-semibold">{Math.round(recommendation.primary.swingPct)}%</span> ({recommendation.primary.forceLabel})
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Baseline carry {formatMeters(recommendation.primary.carry)}</div>
                </div>
              </div>
              <div className="space-y-3">
                {recommendation.alternatives.map((alt) => (
                  <div key={alt.key} className="p-3 rounded-xl bg-white border shadow-sm">
                    <div className="text-gray-500 text-xs">Alternative</div>
                    <div className="font-semibold">{alt.label}</div>
                    <div className="text-sm">{Math.round(alt.swingPct)}% ({alt.forceLabel})</div>
                    <div className="text-xs text-gray-500">Carry {formatMeters(alt.carry)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Notes: Headwind increases effective distance by ~0.8% per m/s; tailwind reduces by ~0.5% per m/s. Elevation adds ~1.25 m per 1 m uphill and subtracts ~1.0 m per 1 m downhill. These are tunable heuristics.
          </p>
        </section>

        {/* Bag editor */}
        {showEditor && (
          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">My Bag Distances (carry in meters)</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {bag.map((c) => (
                <label key={c.key} className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-xl">
                  <span className="text-sm w-1/2">{c.label}</span>
                  <input
                    type="number"
                    className="w-1/2 border rounded-xl px-3 py-1"
                    value={c.carry}
                    min={30}
                    max={350}
                    step={1}
                    onChange={(e) => updateBagCarry(c.key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-gray-500 pt-2">
          Built for Reynir · Deploy to Netlify by connecting your repo and setting a React build (e.g., Vite).
        </footer>
      </div>
    </div>
  );
}
