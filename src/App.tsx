import { useEffect, useState } from "react";

type Country = "AU" | "US";
type Screen =
  | "home"
  | "session"
  | "daily"
  | "tally"
  | "return"
  | "protection"
  | "room";

type HoldState = {
  cleanStart: number;
  urgesSurvived: number;
  manualMoneyProtected: number;
  dailyRiskAmount: number;
  supportSent: number;
  checkins: number;
  slipsRecorded: number;
  clarityPoints: number;
  protectionDone: Record<string, boolean>;
  country: Country;
  fastMode: boolean;
};

type UpdateState = (
  patch: Partial<HoldState> | ((current: HoldState) => Partial<HoldState>),
) => void;

const STORAGE_KEY = "hold10-state";
const dayMs = 86400000;
const minuteMs = 60000;
const triggers = [
  "Boredom",
  "Stress",
  "Loss chasing",
  "Sports",
  "Crypto",
  "Casino ads",
  "Late night",
  "Alcohol",
  "Loneliness",
];

const protectionLists: Record<Country, string[]> = {
  AU: [
    "Register BetStop",
    "Save Gambling Help Online / 1800 858 858",
    "Install Gamban or BetBlocker",
    "Turn on bank gambling block",
    "Tell one trusted person",
    "Write a 10-minute emergency plan",
  ],
  US: [
    "Save 1-800-GAMBLER / 1-800-MY-RESET",
    "Find your state self-exclusion option",
    "Install Gamban or BetBlocker",
    "Turn on bank/card gambling blocks if available",
    "Tell one trusted person",
    "Write a 10-minute emergency plan",
  ],
};

const defaultState: HoldState = {
  cleanStart: Date.now(),
  urgesSurvived: 0,
  manualMoneyProtected: 0,
  dailyRiskAmount: 100,
  supportSent: 0,
  checkins: 0,
  slipsRecorded: 0,
  clarityPoints: 0,
  protectionDone: {},
  country: "AU",
  fastMode: true,
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function loadState(): HoldState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  } catch {
    return defaultState;
  }
}

function cleanTimeLabel(start: number, now: number) {
  const totalMinutes = Math.max(0, Math.floor((now - start) / minuteMs));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function liveProtected(state: HoldState, now: number) {
  const elapsedCleanDays = Math.max(0, (now - state.cleanStart) / dayMs);
  return state.manualMoneyProtected + elapsedCleanDays * state.dailyRiskAmount;
}

function protectionKey(country: Country, item: string) {
  return `${country}:${item}`;
}

function fenceBuilt(state: HoldState) {
  return protectionLists[state.country].filter(
    (item) => state.protectionDone[protectionKey(state.country, item)],
  ).length;
}

function gardenStage(urges: number) {
  if (urges >= 20) return { icon: "🌲", name: "Forest" };
  if (urges >= 7) return { icon: "🌼", name: "Garden" };
  if (urges >= 3) return { icon: "🌳", name: "Sapling" };
  if (urges >= 1) return { icon: "🌿", name: "Sprout" };
  return { icon: "🌱", name: "Seed" };
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary: "bg-slate-900 text-white shadow-sm hover:bg-slate-800",
    secondary:
      "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  };
  return (
    <button
      className={`min-w-0 whitespace-normal rounded-2xl px-4 py-3 text-center text-sm font-semibold transition active:scale-[0.99] ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase leading-tight tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<HoldState>(loadState);
  const [screen, setScreen] = useState<Screen>("home");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const updateState: UpdateState = (patch) =>
    setState((current) => ({
      ...current,
      ...(typeof patch === "function" ? patch(current) : patch),
    }));

  const protectedLive = liveProtected(state, now);

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-sky-50 to-slate-50 px-4 py-5">
      <div className="mx-auto flex w-full max-w-md min-w-0 flex-col gap-4">
        {screen !== "home" && (
          <Button variant="ghost" className="self-start" onClick={() => setScreen("home")}>
            ← Home
          </Button>
        )}

        {screen === "home" && (
          <Home
            state={state}
            now={now}
            protectedLive={protectedLive}
            setScreen={setScreen}
            updateState={updateState}
          />
        )}
        {screen === "session" && (
          <HoldSession
            state={state}
            updateState={updateState}
            setScreen={setScreen}
          />
        )}
        {screen === "daily" && (
          <DailyHold updateState={updateState} setScreen={setScreen} />
        )}
        {screen === "tally" && (
          <RecoveryTally state={state} now={now} protectedLive={protectedLive} />
        )}
        {screen === "return" && (
          <ReturnMode updateState={updateState} setScreen={setScreen} />
        )}
        {screen === "protection" && (
          <ProtectionWall state={state} updateState={updateState} />
        )}
        {screen === "room" && (
          <LiveHoldRoom state={state} now={now} updateState={updateState} />
        )}

        <p className="px-2 pb-2 text-center text-xs leading-relaxed text-slate-500">
          Your Hold10 data stays in this browser on this device.{" "}
          Hold10 is not medical, legal, or financial advice. In crisis, contact
          local emergency services or a qualified support service.
        </p>
      </div>
    </main>
  );
}

function Home({
  state,
  now,
  protectedLive,
  setScreen,
  updateState,
}: {
  state: HoldState;
  now: number;
  protectedLive: number;
  setScreen: (screen: Screen) => void;
  updateState: UpdateState;
}) {
  return (
    <>
      <header className="pt-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Hold10
        </p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Hold10</h1>
        <p className="mt-2 text-base text-slate-600">
          Hold 10 minutes. Don't place the next bet.
        </p>
      </header>

      <Button className="py-4 text-base" onClick={() => setScreen("session")}>
        I feel the urge
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setScreen("daily")}>
          Daily Hold
        </Button>
        <Button variant="secondary" onClick={() => setScreen("tally")}>
          Recovery Tally
        </Button>
        <Button variant="secondary" onClick={() => setScreen("protection")}>
          Protection Wall
        </Button>
        <Button variant="secondary" onClick={() => setScreen("return")}>
          Return Mode
        </Button>
        <Button
          variant="secondary"
          className="col-span-2"
          onClick={() => setScreen("room")}
        >
          Live Hold Room
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Clean time" value={cleanTimeLabel(state.cleanStart, now)} />
        <Stat label="Urges survived" value={state.urgesSurvived} />
        <Stat label="Money protected" value={money.format(protectedLive)} />
        <Stat label="Support taps sent" value={state.supportSent} />
      </div>

      <MoneyCounter state={state} now={now} updateState={updateState} />
      <RecoveryGarden state={state} />
    </>
  );
}

function MoneyCounter({
  state,
  now,
  updateState,
}: {
  state: HoldState;
  now: number;
  updateState: UpdateState;
}) {
  const secondsIntoMinute = Math.floor((now / 1000) % 60);
  const secondsRemaining = 60 - secondsIntoMinute;
  const protectedPerMinute = state.dailyRiskAmount / 1440;
  const progress = (secondsIntoMinute / 60) * 100;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Live money protected
          </p>
          <p className="mt-1 text-4xl font-black text-slate-950">
            {money.format(liveProtected(state, now))}
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          {cleanTimeLabel(state.cleanStart, now)}
        </span>
      </div>

      <label className="mt-5 block text-sm font-semibold text-slate-700">
        Daily risk amount
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:border-emerald-400"
          type="number"
          min="0"
          step="1"
          value={state.dailyRiskAmount}
          onChange={(event) =>
            updateState({ dailyRiskAmount: Number(event.target.value) || 0 })
          }
        />
      </label>

      <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-slate-700">
            {secondsRemaining}s left this minute
          </span>
          <span className="font-bold text-emerald-700">
            Next minute +{money.format(protectedPerMinute)}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-500">
        Estimate only. Set this to your normal daily risk or deposit amount.
      </p>
    </Card>
  );
}

function HoldSession({
  state,
  updateState,
  setScreen,
}: {
  state: HoldState;
  updateState: UpdateState;
  setScreen: (screen: Screen) => void;
}) {
  const [step, setStep] = useState<"setup" | "active" | "after" | "done">(
    "setup",
  );
  const [urgeBefore, setUrgeBefore] = useState(5);
  const [urgeAfter, setUrgeAfter] = useState(3);
  const [trigger, setTrigger] = useState(triggers[0]);
  const [moneyAtRisk, setMoneyAtRisk] = useState(25);
  const [minutes, setMinutes] = useState(10);
  const [startedAt, setStartedAt] = useState(0);
  const [duration, setDuration] = useState(60);
  const [now, setNow] = useState(Date.now());
  const [feedback, setFeedback] = useState("Stay with the calm rhythm.");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (step !== "active") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step === "active" && startedAt && now - startedAt >= duration * 1000) {
      setUrgeAfter(Math.max(1, urgeBefore - 2));
      setStep("after");
    }
  }, [duration, now, startedAt, step, urgeBefore]);

  const secondsLeft = Math.max(0, Math.ceil((startedAt + duration * 1000 - now) / 1000));
  const activeProgress = startedAt
    ? Math.min(100, ((now - startedAt) / (duration * 1000)) * 100)
    : 0;

  const start = () => {
    const capped = state.fastMode ? Math.min(minutes * 60, 60) : minutes * 60;
    setDuration(capped);
    setStartedAt(Date.now());
    setNow(Date.now());
    setStep("active");
  };

  const tapCalm = () => {
    const phase = ((Date.now() - startedAt) % 10000) / 10000;
    const inCalmZone = phase > 0.42 && phase < 0.58;
    const calmLines = [
      "Good. One controlled click, not a bet.",
      "You are training the pause.",
      "That click protected you.",
      "Stay with the calm rhythm.",
    ];
    setFeedback(
      inCalmZone
        ? calmLines[Math.floor(Date.now() / 1000) % calmLines.length]
        : "Slow down. Wait for the calm zone.",
    );
  };

  const saveSession = () => {
    if (saved) return;
    updateState((current) => ({
      urgesSurvived: current.urgesSurvived + 1,
      manualMoneyProtected: current.manualMoneyProtected + moneyAtRisk,
      clarityPoints: current.clarityPoints + 1,
    }));
    setSaved(true);
    setStep("done");
  };

  if (step === "setup") {
    return (
      <Card>
        <h2 className="text-2xl font-black text-slate-950">Hold10 Session</h2>
        <p className="mt-2 text-sm text-slate-600">
          Name the urge, set the hold, then breathe through the next few
          minutes.
        </p>

        <Picker label="Current urge intensity" value={urgeBefore} setValue={setUrgeBefore} />

        <label className="mt-5 block text-sm font-semibold text-slate-700">
          Trigger tag
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
            value={trigger}
            onChange={(event) => setTrigger(event.target.value)}
          >
            {triggers.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="mt-5 block text-sm font-semibold text-slate-700">
          Money at risk
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
            type="number"
            min="0"
            value={moneyAtRisk}
            onChange={(event) => setMoneyAtRisk(Number(event.target.value) || 0)}
          />
        </label>

        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-700">Session length</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[3, 5, 10].map((item) => (
              <Button
                key={item}
                variant={minutes === item ? "primary" : "secondary"}
                onClick={() => setMinutes(item)}
              >
                {item} min
              </Button>
            ))}
          </div>
        </div>

        <label className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          Prototype fast mode
          <input
            type="checkbox"
            className="h-5 w-5 accent-emerald-600"
            checked={state.fastMode}
            onChange={(event) => updateState({ fastMode: event.target.checked })}
          />
        </label>

        <Button className="mt-5 w-full py-4" onClick={start}>
          Start Calm Tap
        </Button>
      </Card>
    );
  }

  if (step === "active") {
    return (
      <Card className="text-center">
        <p className="text-sm font-semibold text-emerald-700">Calm Tap</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">
          {secondsLeft}s
        </h2>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-sky-400 transition-all"
            style={{ width: `${activeProgress}%` }}
          />
        </div>

        <button
          className="relative mx-auto mt-8 flex h-64 w-64 max-w-full items-center justify-center rounded-full bg-sky-50"
          onClick={tapCalm}
          aria-label="Tap inside the calm zone"
        >
          <span className="absolute h-40 w-40 rounded-full border-4 border-emerald-300" />
          <span className="calm-breath absolute h-48 w-48 rounded-full bg-gradient-to-br from-emerald-200 to-sky-200 shadow-inner" />
          <span className="relative rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700">
            calm zone
          </span>
        </button>

        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          Slow deep breath: inhale as the circle expands, exhale as it
          contracts. Tap only inside the calm zone.
        </p>
        <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {feedback}
        </p>
      </Card>
    );
  }

  if (step === "after") {
    return (
      <Card>
        <h2 className="text-3xl font-black text-slate-950">You held.</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          This was a real win: no deposit, no chase, no next bet. You watered
          your recovery.
        </p>
        <Picker label="Urge after" value={urgeAfter} setValue={setUrgeAfter} />
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Before" value={urgeBefore} />
          <Stat label="After" value={urgeAfter} />
          <Stat label="Protected" value={money.format(moneyAtRisk)} />
        </div>
        <Button className="mt-5 w-full" onClick={saveSession}>
          Save Hold10 session
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-3xl font-black text-slate-950">You held.</h2>
      <div className="mt-5 space-y-3 text-base font-semibold text-slate-700">
        <p>💧 Watered your recovery</p>
        <p>🌾 Pulled a {trigger} weed</p>
      </div>
      <Button className="mt-6 w-full" onClick={() => setScreen("home")}>
        Return home
      </Button>
    </Card>
  );
}

function Picker({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <div className="mt-5">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((item) => (
          <Button
            key={item}
            variant={value === item ? "primary" : "secondary"}
            className="px-0"
            onClick={() => setValue(item)}
          >
            {item}
          </Button>
        ))}
      </div>
    </div>
  );
}

function RecoveryGarden({ state }: { state: HoldState }) {
  const stage = gardenStage(state.urgesSurvived);
  const progress = Math.min(100, (state.urgesSurvived / 20) * 100);
  const fence = fenceBuilt(state);

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="text-6xl">{stage.icon}</div>
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Recovery Garden
          </p>
          <h2 className="text-2xl font-black text-slate-950">{stage.name}</h2>
          <p className="text-sm text-slate-500">
            Progress toward Forest: {state.urgesSurvived}/20
          </p>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Every Hold10 session waters your recovery. Every trigger you name
        becomes a weed you pulled. Every protection step strengthens the fence.
      </p>

      <div className="mt-5 grid gap-3">
        <GardenMetric
          icon="💧"
          title="Watered"
          count={state.urgesSurvived}
          label="Hold10 sessions completed"
        />
        <GardenMetric
          icon="🌾"
          title="Weeds pulled"
          count={state.clarityPoints}
          label="Triggers named without shame"
        />
        <GardenMetric
          icon="🧱"
          title="Fence built"
          count={fence}
          label="Protection steps completed"
        />
      </div>
    </Card>
  );
}

function GardenMetric({
  icon,
  title,
  count,
  label,
}: {
  icon: string;
  title: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-bold text-slate-900">
          {title}: {count}
        </p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function DailyHold({
  updateState,
  setScreen,
}: {
  updateState: UpdateState;
  setScreen: (screen: Screen) => void;
}) {
  const [gambled, setGambled] = useState<"no" | "yes">("no");
  const [urge, setUrge] = useState(4);
  const [trigger, setTrigger] = useState(triggers[0]);
  const [protectedToday, setProtectedToday] = useState(20);
  const [saved, setSaved] = useState(false);

  const submit = () => {
    if (gambled === "yes") {
      setScreen("return");
      return;
    }
    updateState((current) => ({
      checkins: current.checkins + 1,
      clarityPoints: current.clarityPoints + 1,
      manualMoneyProtected: current.manualMoneyProtected + protectedToday,
    }));
    setSaved(true);
  };

  return (
    <Card>
      <h2 className="text-2xl font-black text-slate-950">Daily Hold</h2>
      <p className="mt-2 text-sm text-slate-600">A quick check-in only.</p>

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-700">
          Did you gamble today?
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant={gambled === "no" ? "primary" : "secondary"}
            onClick={() => setGambled("no")}
          >
            No
          </Button>
          <Button
            variant={gambled === "yes" ? "primary" : "secondary"}
            onClick={() => setGambled("yes")}
          >
            Yes
          </Button>
        </div>
      </div>

      <Picker label="Strongest urge today" value={urge} setValue={setUrge} />

      <label className="mt-5 block text-sm font-semibold text-slate-700">
        Main trigger
        <select
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
          value={trigger}
          onChange={(event) => setTrigger(event.target.value)}
        >
          {triggers.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>

      <label className="mt-5 block text-sm font-semibold text-slate-700">
        Estimated money protected today
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
          type="number"
          min="0"
          value={protectedToday}
          onChange={(event) => setProtectedToday(Number(event.target.value) || 0)}
        />
      </label>

      <Button className="mt-5 w-full" onClick={submit}>
        Save check-in
      </Button>
      {saved && (
        <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Daily Hold saved.
        </p>
      )}
    </Card>
  );
}

function RecoveryTally({
  state,
  now,
  protectedLive,
}: {
  state: HoldState;
  now: number;
  protectedLive: number;
}) {
  return (
    <>
      <Card>
        <h2 className="text-2xl font-black text-slate-950">Recovery Tally</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="Clean time" value={cleanTimeLabel(state.cleanStart, now)} />
          <Stat label="Urges survived" value={state.urgesSurvived} />
          <Stat
            label="Manual protected"
            value={money.format(state.manualMoneyProtected)}
          />
          <Stat label="Live protected" value={money.format(protectedLive)} />
          <Stat label="Support taps" value={state.supportSent} />
          <Stat label="Check-ins" value={state.checkins} />
          <Stat label="Slips recorded" value={state.slipsRecorded} />
          <Stat label="Clarity points" value={state.clarityPoints} />
        </div>
      </Card>

      <Card className="bg-slate-900 text-white">
        <p className="text-sm font-semibold text-emerald-200">Hold10</p>
        <h2 className="mt-2 text-3xl font-black">I held today.</h2>
        <div className="mt-5 space-y-2 text-sm text-slate-200">
          <p>Clean time: {cleanTimeLabel(state.cleanStart, now)}</p>
          <p>Urges survived: {state.urgesSurvived}</p>
          <p>Money protected: {money.format(protectedLive)}</p>
        </div>
      </Card>
    </>
  );
}

function ReturnMode({
  updateState,
  setScreen,
}: {
  updateState: UpdateState;
  setScreen: (screen: Screen) => void;
}) {
  const [trigger, setTrigger] = useState(triggers[0]);
  const [place, setPlace] = useState("Sportsbook / casino app");
  const [recorded, setRecorded] = useState(false);

  const record = () => {
    updateState((current) => ({
      cleanStart: Date.now(),
      slipsRecorded: current.slipsRecorded + 1,
      clarityPoints: current.clarityPoints + 1,
    }));
    setRecorded(true);
  };

  return (
    <Card>
      <h2 className="text-2xl font-black text-slate-950">Return Mode</h2>
      <p className="mt-3 rounded-2xl bg-sky-50 p-4 text-sm font-semibold text-sky-900">
        You came back. Recording this is a return.
      </p>

      {!recorded ? (
        <>
          <Button className="mt-5 w-full" onClick={record}>
            I slipped.
          </Button>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            What triggered it?
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
              value={trigger}
              onChange={(event) => setTrigger(event.target.value)}
            >
              {triggers.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Where did it happen?
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
              value={place}
              onChange={(event) => setPlace(event.target.value)}
            >
              {[
                "Sportsbook / casino app",
                "Pokie venue",
                "Crypto casino",
                "Offshore site",
                "Friend / private bet",
                "Other",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <>
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            Logged: {trigger} at {place}. Your lifetime tally is still here.
          </p>
          <Button className="mt-5 w-full" onClick={() => setScreen("protection")}>
            Open Protection Wall
          </Button>
        </>
      )}
    </Card>
  );
}

function ProtectionWall({
  state,
  updateState,
}: {
  state: HoldState;
  updateState: UpdateState;
}) {
  const items = protectionLists[state.country];
  const done = items.filter(
    (item) => state.protectionDone[protectionKey(state.country, item)],
  ).length;
  const completion = Math.round((done / items.length) * 100);

  const toggle = (item: string) => {
    const key = protectionKey(state.country, item);
    updateState((current) => ({
      protectionDone: {
        ...current.protectionDone,
        [key]: !current.protectionDone[key],
      },
    }));
  };

  return (
    <Card>
      <h2 className="text-2xl font-black text-slate-950">Protection Wall</h2>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          variant={state.country === "AU" ? "primary" : "secondary"}
          onClick={() => updateState({ country: "AU" })}
        >
          Australia
        </Button>
        <Button
          variant={state.country === "US" ? "primary" : "secondary"}
          onClick={() => updateState({ country: "US" })}
        >
          United States
        </Button>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="flex justify-between text-sm font-semibold text-slate-700">
          <span>{completion}% complete</span>
          <span>{done}/{items.length}</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-400"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const checked = state.protectionDone[protectionKey(state.country, item)];
          return (
            <label
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700"
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-emerald-600"
                checked={Boolean(checked)}
                onChange={() => toggle(item)}
              />
              <span>{item}</span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}

function LiveHoldRoom({
  state,
  now,
  updateState,
}: {
  state: HoldState;
  now: number;
  updateState: UpdateState;
}) {
  const minutesProtected = Math.max(
    0,
    Math.floor((now - state.cleanStart) / minuteMs),
  );

  return (
    <Card>
      <h2 className="text-2xl font-black text-slate-950">Live Hold Room</h2>
      <p className="mt-3 text-sm font-semibold text-slate-700">
        Live Hold Room coming after real users exist.
      </p>
      <p className="mt-1 text-sm text-slate-500">
        MVP honesty mode: no fake live users.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat label="Minutes protected" value={minutesProtected} />
        <Stat label="Sessions" value={state.urgesSurvived} />
        <Stat label="Support taps" value={state.supportSent} />
      </div>

      <Button
        className="mt-5 w-full"
        onClick={() =>
          updateState((current) => ({ supportSent: current.supportSent + 1 }))
        }
      >
        Send anonymous support
      </Button>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
        <p>
          Later: real Supabase presence, anonymous support, collective minutes
          protected.
        </p>
        <div className="mt-4 space-y-2 font-semibold text-slate-700">
          <p>Team AU vs Team US: collective minutes protected</p>
          <p>Most support sent, not longest streak</p>
          <p>Day 0 newcomers supported</p>
        </div>
      </div>
    </Card>
  );
}
