import "expo-dev-client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  type DimensionValue,
  Easing,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from "react-native";

type Country = "AU" | "US";
type Screen =
  | "home"
  | "session"
  | "daily"
  | "tally"
  | "return"
  | "protection"
  | "room"
  | "settings"
  | "help";

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
};

type SupportResource = {
  title: string;
  body: string;
  action: string;
  href: string;
};

type UpdateState = (
  patch: Partial<HoldState> | ((current: HoldState) => Partial<HoldState>),
) => void;

const storageKey = "hold10-native-state";
const dayMs = 86400000;
const minuteMs = 60000;
const breathInMs = 4000;
const breathOutMs = 6000;
const manualReleaseMinMs = 3000;
const breathMinScale = 0.48;
const breathMaxScale = 1.12;

async function triggerCalmHaptic(inCalmZone: boolean) {
  try {
    const Haptics = await import("expo-haptics");
    await Haptics.impactAsync(
      inCalmZone
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light,
    );
  } catch {
    Vibration.vibrate();
  }
}

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
    "Save 1-800-MY-RESET",
    "Find your state self-exclusion option",
    "Install Gamban or BetBlocker",
    "Turn on bank/card gambling blocks if available",
    "Tell one trusted person",
    "Write a 10-minute emergency plan",
  ],
};

const supportResources: Record<Country, SupportResource[]> = {
  AU: [
    {
      title: "National Gambling Helpline",
      body: "Free, confidential gambling support in Australia, available 24/7.",
      action: "Call 1800 858 858",
      href: "tel:1800858858",
    },
    {
      title: "Gambling Help Online",
      body: "Online counselling, information, and support for gambling harm.",
      action: "Open website",
      href: "https://www.gamblinghelponline.org.au/",
    },
    {
      title: "BetStop",
      body: "Block yourself from licensed Australian online and phone betting providers.",
      action: "Open BetStop",
      href: "https://www.betstop.gov.au/",
    },
  ],
  US: [
    {
      title: "National Problem Gambling Helpline",
      body: "Connect with local support for gambling problems across the United States.",
      action: "Call 1-800-MY-RESET",
      href: "tel:+18006973738",
    },
    {
      title: "NCPG Help",
      body: "Online support and state-by-state problem gambling resources.",
      action: "Open NCPG",
      href: "https://www.ncpgambling.org/help-treatment/",
    },
    {
      title: "Help by State",
      body: "Find local gambling support options in your state or territory.",
      action: "Find help",
      href: "https://www.ncpgambling.org/help-treatment/help-by-state/",
    },
  ],
};

function createDefaultState(): HoldState {
  return {
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
  };
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

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
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

function Card({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <View style={[styles.card, dark && styles.darkCard]}>{children}</View>;
}

function Button({
  label,
  onPress,
  variant = "primary",
  full = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  full?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles[`${variant}Button`],
        full && styles.fullButton,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, styles[`${variant}ButtonText`]]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Stat({ icon, label, value }: { icon?: string; label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      {icon ? <Text style={styles.statIcon}>{icon}</Text> : null}
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerGrid}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((item) => (
          <Pressable
            key={item}
            style={[styles.pickerItem, value === item && styles.pickerItemActive]}
            onPress={() => setValue(item)}
          >
            <Text
              style={[
                styles.pickerText,
                value === item && styles.pickerTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  const [state, setState] = useState<HoldState>(createDefaultState);
  const [screen, setScreen] = useState<Screen>("home");
  const [now, setNow] = useState(Date.now());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((saved) => {
        if (saved) {
          setState({ ...createDefaultState(), ...JSON.parse(saved) });
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(state));
  }, [loaded, state]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const updateState: UpdateState = (patch) =>
    setState((current) => ({
      ...current,
      ...(typeof patch === "function" ? patch(current) : patch),
    }));

  const resetState = () => {
    Alert.alert("Reset local data?", "This clears Hold10 data on this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          setState(createDefaultState());
          setScreen("home");
        },
      },
    ]);
  };

  const protectedLive = liveProtected(state, now);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.page}>
        {screen !== "home" && (
          <Button label="Back home" variant="ghost" onPress={() => setScreen("home")} />
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
          <HoldSession updateState={updateState} setScreen={setScreen} />
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
        {screen === "settings" && (
          <Settings
            state={state}
            now={now}
            protectedLive={protectedLive}
            resetState={resetState}
            setScreen={setScreen}
          />
        )}
        {screen === "help" && <HelpNow state={state} setScreen={setScreen} />}

        <Text style={styles.footer}>
          Your Hold10 data stays on this device. Hold10 is a self-support pause
          tool, not a medical, mental health, legal, financial, emergency,
          crisis, gambling treatment, or monitoring service. It does not
          diagnose, treat, prevent, or cure any condition, does not monitor you,
          and cannot contact help for you. It cannot guarantee that gambling,
          self-harm, financial loss, debt, legal issues, or relapse will be
          prevented. In immediate danger, call local emergency services now. For
          gambling, addiction, mental health, legal, debt, or financial support,
          contact a qualified professional or official support service.
        </Text>
      </ScrollView>
    </SafeAreaView>
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
      <View style={styles.hero}>
        <Text style={styles.title}>Hold10</Text>
        <Text style={styles.subtitle}>Hold 10 minutes. Do not place the next bet.</Text>
      </View>

      <Button label="I feel the urge" full onPress={() => setScreen("session")} />

      <MoneyCounter state={state} now={now} updateState={updateState} />
      <RecoveryGarden state={state} />

      <View style={styles.statsGrid}>
        <Stat label="Clean time" value={cleanTimeLabel(state.cleanStart, now)} />
        <Stat label="Urges survived" value={state.urgesSurvived} />
        <Stat label="Money protected" value={formatMoney(protectedLive)} />
        <Stat label="Support taps sent" value={state.supportSent} />
      </View>

      <View style={styles.navGrid}>
        <View style={styles.navButtonCell}>
          <Button label="Daily Hold" variant="secondary" full onPress={() => setScreen("daily")} />
        </View>
        <View style={styles.navButtonCell}>
          <Button label="Recovery Tally" variant="secondary" full onPress={() => setScreen("tally")} />
        </View>
        <View style={styles.navButtonCell}>
          <Button label="Protection Wall" variant="secondary" full onPress={() => setScreen("protection")} />
        </View>
        <View style={styles.navButtonCell}>
          <Button label="Return Mode" variant="secondary" full onPress={() => setScreen("return")} />
        </View>
      </View>
      <Button label="Live Hold Room" variant="secondary" full onPress={() => setScreen("room")} />
      <Button label="Settings & Data" variant="secondary" full onPress={() => setScreen("settings")} />
      <Button label="Help Now" variant="danger" full onPress={() => setScreen("help")} />
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
  const progress: DimensionValue = `${Math.max(
    4,
    (secondsIntoMinute / 60) * 100,
  )}%`;

  return (
    <Card>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.greenLabel}>Live money protected</Text>
          <Text style={styles.money}>{formatMoney(liveProtected(state, now))}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cleanTimeLabel(state.cleanStart, now)}</Text>
        </View>
      </View>

      <Text style={styles.label}>Daily risk amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(state.dailyRiskAmount)}
        onChangeText={(value) =>
          updateState({ dailyRiskAmount: Number(value) || 0 })
        }
      />

      <View style={styles.countdown}>
        <View style={styles.rowBetween}>
          <Text style={styles.countdownText}>{secondsRemaining}s left this minute</Text>
          <Text style={styles.countdownText}>
            Next minute +{formatMoney(protectedPerMinute)}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progress }]} />
        </View>
      </View>

      <Text style={styles.note}>
        Estimate only. Set this to your normal daily risk or deposit amount.
      </Text>
    </Card>
  );
}

function HoldSession({
  updateState,
  setScreen,
}: {
  updateState: UpdateState;
  setScreen: (screen: Screen) => void;
}) {
  const [step, setStep] = useState<"setup" | "active" | "after" | "done">("setup");
  const [urgeBefore, setUrgeBefore] = useState(5);
  const [urgeAfter, setUrgeAfter] = useState(3);
  const [trigger, setTrigger] = useState(triggers[0]);
  const [moneyAtRisk, setMoneyAtRisk] = useState(25);
  const [minutes, setMinutes] = useState(10);
  const [startedAt, setStartedAt] = useState(0);
  const [duration, setDuration] = useState(60);
  const [now, setNow] = useState(Date.now());
  const [feedback, setFeedback] = useState("Stay with the calm rhythm.");
  const [breathPhase, setBreathPhase] = useState<"ready" | "inhale" | "exhale">("ready");
  const [saved, setSaved] = useState(false);
  const breathScale = useRef(new Animated.Value(breathMinScale)).current;
  const breathHoldStartedAt = useRef(0);
  const autoReleaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoReleaseTimer = () => {
    if (!autoReleaseTimer.current) return;
    clearTimeout(autoReleaseTimer.current);
    autoReleaseTimer.current = null;
  };

  useEffect(() => {
    if (step !== "active") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== "active") {
      clearAutoReleaseTimer();
      breathScale.stopAnimation();
      breathScale.setValue(breathMinScale);
      return;
    }

    clearAutoReleaseTimer();
    breathScale.setValue(breathMinScale);
    setBreathPhase("ready");
    setFeedback("Press and hold to inhale. The app will release after 4 seconds.");
    return () => {
      clearAutoReleaseTimer();
      breathScale.stopAnimation();
    };
  }, [breathScale, step]);

  useEffect(() => {
    if (step === "active" && startedAt && now - startedAt >= duration * 1000) {
      setUrgeAfter(Math.max(1, urgeBefore - 2));
      setStep("after");
    }
  }, [duration, now, startedAt, step, urgeBefore]);

  const secondsLeft = Math.max(
    0,
    Math.ceil((startedAt + duration * 1000 - now) / 1000),
  );
  const activeProgress: DimensionValue = startedAt
    ? `${Math.min(100, ((now - startedAt) / (duration * 1000)) * 100)}%`
    : "0%";

  const start = () => {
    setDuration(minutes * 60);
    setStartedAt(Date.now());
    setNow(Date.now());
    setStep("active");
  };

  const startInhale = () => {
    if (breathHoldStartedAt.current) return;
    breathHoldStartedAt.current = Date.now();
    clearAutoReleaseTimer();
    setBreathPhase("inhale");
    breathScale.stopAnimation();
    Animated.timing(breathScale, {
      duration: breathInMs,
      easing: Easing.inOut(Easing.ease),
      toValue: breathMaxScale,
      useNativeDriver: true,
    }).start();
    void triggerCalmHaptic(false);
    autoReleaseTimer.current = setTimeout(() => releaseExhale(true), breathInMs);
    setFeedback("Inhale slowly. Hold until the app releases into the exhale.");
  };

  const releaseExhale = (autoRelease = false) => {
    if (!breathHoldStartedAt.current) return;
    const heldMs = Date.now() - breathHoldStartedAt.current;
    breathHoldStartedAt.current = 0;
    clearAutoReleaseTimer();
    setBreathPhase("exhale");
    breathScale.stopAnimation();

    if (!autoRelease && heldMs < manualReleaseMinMs) {
      setBreathPhase("ready");
      Animated.timing(breathScale, {
        duration: 220,
        easing: Easing.out(Easing.ease),
        toValue: breathMinScale,
        useNativeDriver: true,
      }).start();
      setFeedback("Hold steady a little longer. Small finger movements are okay; stay with the inhale.");
      return;
    }

    Animated.timing(breathScale, {
      duration: breathOutMs,
      easing: Easing.inOut(Easing.ease),
      toValue: breathMinScale,
      useNativeDriver: true,
    }).start();
    void triggerCalmHaptic(autoRelease || heldMs >= breathInMs * 0.55);
    setFeedback(
      autoRelease
        ? "Exhale now. The app released for you; let the circle settle smaller."
        : heldMs >= breathInMs * 0.55
          ? "Release and exhale slowly. Let the urge pass with the shrinking circle."
        : "Try a longer inhale. Hold until the circle opens, then release.",
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
        <Text style={styles.screenTitle}>Hold10 Session</Text>
        <Text style={styles.bodyText}>
          Name the urge, set the hold, then breathe through the next few minutes.
        </Text>
        <Picker label="Current urge intensity" value={urgeBefore} setValue={setUrgeBefore} />
        <OptionList label="Trigger tag" options={triggers} value={trigger} setValue={setTrigger} />
        <Text style={styles.label}>Money at risk</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(moneyAtRisk)}
          onChangeText={(value) => setMoneyAtRisk(Number(value) || 0)}
        />
        <View style={styles.block}>
          <Text style={styles.label}>Session length</Text>
          <View style={styles.threeGrid}>
            {[3, 5, 10].map((item) => (
              <Pressable
                key={item}
                style={[styles.segment, minutes === item && styles.segmentActive]}
                onPress={() => setMinutes(item)}
              >
                <Text style={[styles.segmentText, minutes === item && styles.segmentTextActive]}>
                  {item} min
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Button label="Start Calm Tap" full onPress={start} />
      </Card>
    );
  }

  if (step === "active") {
    const phaseLabel =
      breathPhase === "inhale"
        ? "inhale"
        : breathPhase === "exhale"
          ? "exhale"
          : "hold 4s";
    const phaseHint =
      breathPhase === "inhale"
        ? "Keep holding"
        : breathPhase === "exhale"
          ? "Let go and breathe out"
          : "Press to begin";

    return (
      <Card>
        <Text style={styles.greenLabelCenter}>Calm Tap</Text>
        <Text style={styles.timer}>{secondsLeft}s</Text>
        <View style={[styles.progressTrack, styles.calmProgressTrack]}>
          <View style={[styles.calmProgressFill, { width: activeProgress }]} />
        </View>
        <Pressable
          style={styles.calmCircle}
          hitSlop={24}
          onPressIn={startInhale}
          onPressOut={() => releaseExhale(false)}
          pressRetentionOffset={{ bottom: 120, left: 120, right: 120, top: 120 }}
        >
          <View style={styles.calmBoundary} />
          <Animated.View
            style={[styles.calmBreath, { transform: [{ scale: breathScale }] }]}
          />
          <View style={styles.calmLabelPill}>
            <Text style={styles.calmPhaseHint}>{phaseHint}</Text>
            <Text style={styles.calmText}>{phaseLabel}</Text>
          </View>
        </Pressable>
        <Text style={[styles.breathPhaseCue, breathPhase === "exhale" && styles.breathPhaseCueExhale]}>
          {breathPhase === "exhale" ? "Exhale now" : "Hold until the inhale completes"}
        </Text>
        <Text style={styles.bodyText}>
          Hold to inhale for 4 seconds. The app releases into a 6 second exhale with a gentle vibration.
        </Text>
        <Text style={styles.feedback}>{feedback}</Text>
      </Card>
    );
  }

  if (step === "after") {
    return (
      <Card>
        <Text style={styles.screenTitle}>You held.</Text>
        <Text style={styles.bodyText}>
          This was a real win: no deposit, no chase, no next bet.
        </Text>
        <Picker label="Urge after" value={urgeAfter} setValue={setUrgeAfter} />
        <View style={styles.threeGrid}>
          <Stat label="Before" value={urgeBefore} />
          <Stat label="After" value={urgeAfter} />
          <Stat label="Protected" value={formatMoney(moneyAtRisk)} />
        </View>
        <Button label="Save Hold10 session" full onPress={saveSession} />
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.screenTitle}>You held.</Text>
      <Text style={styles.bodyText}>Watered your recovery. Pulled a {trigger} weed.</Text>
      <Button label="Return home" full onPress={() => setScreen("home")} />
    </Card>
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
      <Text style={styles.screenTitle}>Daily Hold</Text>
      <Text style={styles.bodyText}>A quick check-in only.</Text>
      <View style={styles.twoGrid}>
        <Button label="No" variant={gambled === "no" ? "primary" : "secondary"} onPress={() => setGambled("no")} />
        <Button label="Yes" variant={gambled === "yes" ? "primary" : "secondary"} onPress={() => setGambled("yes")} />
      </View>
      <Picker label="Strongest urge today" value={urge} setValue={setUrge} />
      <OptionList label="Main trigger" options={triggers} value={trigger} setValue={setTrigger} />
      <Text style={styles.label}>Estimated money protected today</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(protectedToday)}
        onChangeText={(value) => setProtectedToday(Number(value) || 0)}
      />
      <Button label="Save check-in" full onPress={submit} />
      {saved && <Text style={styles.feedback}>Daily Hold saved.</Text>}
    </Card>
  );
}

function OptionList({
  label,
  options,
  value,
  setValue,
}: {
  label: string;
  options: string[];
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[styles.option, value === option && styles.optionActive]}
            onPress={() => setValue(option)}
          >
            <Text style={[styles.optionText, value === option && styles.optionTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RecoveryGarden({ state }: { state: HoldState }) {
  const stage = gardenStage(state.urgesSurvived);
  const progress: DimensionValue = `${Math.min(
    100,
    (state.urgesSurvived / 20) * 100,
  )}%`;
  const fence = fenceBuilt(state);

  return (
    <Card>
      <View style={styles.gardenStageRow}>
        <Text style={styles.gardenStageIcon}>{stage.icon}</Text>
        <View style={styles.gardenStageCopy}>
          <Text style={styles.greenLabel}>Recovery Garden</Text>
          <Text style={styles.screenTitle}>{stage.name}</Text>
          <Text style={styles.bodyText}>Progress toward Forest: {state.urgesSurvived}/20</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progress }]} />
      </View>
      <Text style={styles.bodyText}>
        Every Hold10 session waters your recovery. Every trigger you name becomes a weed you pulled.
      </Text>
      <View style={styles.statsGrid}>
        <Stat icon="💧" label="Watered" value={state.urgesSurvived} />
        <Stat icon="🌾" label="Weeds pulled" value={state.clarityPoints} />
        <Stat icon="🧱" label="Fence built" value={fence} />
        <Stat icon={stage.icon} label="Stage" value={stage.name} />
      </View>
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
        <Text style={styles.screenTitle}>Recovery Tally</Text>
        <View style={styles.statsGrid}>
          <Stat label="Clean time" value={cleanTimeLabel(state.cleanStart, now)} />
          <Stat label="Urges survived" value={state.urgesSurvived} />
          <Stat label="Manual protected" value={formatMoney(state.manualMoneyProtected)} />
          <Stat label="Live protected" value={formatMoney(protectedLive)} />
          <Stat label="Support taps" value={state.supportSent} />
          <Stat label="Check-ins" value={state.checkins} />
          <Stat label="Slips recorded" value={state.slipsRecorded} />
          <Stat label="Clarity points" value={state.clarityPoints} />
        </View>
      </Card>
      <Card dark>
        <Text style={styles.darkLabel}>Hold10</Text>
        <Text style={styles.darkTitle}>I held today.</Text>
        <Text style={styles.darkBody}>Clean time: {cleanTimeLabel(state.cleanStart, now)}</Text>
        <Text style={styles.darkBody}>Urges survived: {state.urgesSurvived}</Text>
        <Text style={styles.darkBody}>Money protected: {formatMoney(protectedLive)}</Text>
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
      <Text style={styles.screenTitle}>Return Mode</Text>
      <Text style={styles.infoBox}>You came back. Recording this is a return.</Text>
      {!recorded ? (
        <>
          <OptionList label="What triggered it?" options={triggers} value={trigger} setValue={setTrigger} />
          <Button label="I slipped" full onPress={record} />
        </>
      ) : (
        <>
          <Text style={styles.bodyText}>Logged: {trigger}. Your lifetime tally is still here.</Text>
          <Button label="Open Protection Wall" full onPress={() => setScreen("protection")} />
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
      <Text style={styles.screenTitle}>Protection Wall</Text>
      <View style={styles.twoGrid}>
        <Button label="Australia" variant={state.country === "AU" ? "primary" : "secondary"} onPress={() => updateState({ country: "AU" })} />
        <Button label="United States" variant={state.country === "US" ? "primary" : "secondary"} onPress={() => updateState({ country: "US" })} />
      </View>
      <Text style={styles.bodyText}>{completion}% complete. {done}/{items.length} steps done.</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${completion}%` }]} />
      </View>
      <View style={styles.block}>
        {items.map((item) => {
          const checked = Boolean(state.protectionDone[protectionKey(state.country, item)]);
          return (
            <Pressable key={item} style={styles.checkItem} onPress={() => toggle(item)}>
              <Text style={styles.checkMark}>{checked ? "✓" : "○"}</Text>
              <Text style={styles.checkText}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
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
  const minutesProtected = Math.max(0, Math.floor((now - state.cleanStart) / minuteMs));

  return (
    <Card>
      <Text style={styles.screenTitle}>Live Hold Room</Text>
      <Text style={styles.bodyText}>MVP honesty mode: no fake live users.</Text>
      <View style={styles.threeGrid}>
        <Stat label="Minutes protected" value={minutesProtected} />
        <Stat label="Sessions" value={state.urgesSurvived} />
        <Stat label="Support taps" value={state.supportSent} />
      </View>
      <Button
        label="Send anonymous support"
        full
        onPress={() => updateState((current) => ({ supportSent: current.supportSent + 1 }))}
      />
      <Text style={styles.infoBox}>
        Later: real presence, anonymous support, and collective minutes protected.
      </Text>
    </Card>
  );
}

function ResourceCard({ resource }: { resource: SupportResource }) {
  return (
    <View style={styles.resource}>
      <Text style={styles.resourceTitle}>{resource.title}</Text>
      <Text style={styles.resourceBody}>{resource.body}</Text>
      <Button label={resource.action} full onPress={() => Linking.openURL(resource.href)} />
    </View>
  );
}

function HelpNow({
  state,
  setScreen,
}: {
  state: HoldState;
  setScreen: (screen: Screen) => void;
}) {
  return (
    <>
      <Card>
        <Text style={styles.redLabel}>Help Now</Text>
        <Text style={styles.screenTitle}>Get support before the next bet.</Text>
        <Text style={styles.bodyText}>
          Step away from the betting app, put the phone down if you can, and contact a real support service now.
        </Text>
        <Text style={styles.urgentDisclaimer}>
          Hold10 is not monitored and is not an emergency, crisis, medical,
          mental health, gambling treatment, legal, or financial service. If you
          may hurt yourself or someone else, cannot stay safe, or need urgent
          help, call local emergency services now.
        </Text>
        <Button label="Start a 10-minute hold" full onPress={() => setScreen("session")} />
      </Card>
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Support resources</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{state.country}</Text></View>
        </View>
        <Text style={styles.bodyText}>These links open official support services.</Text>
        <View style={styles.block}>
          {supportResources[state.country].map((resource) => (
            <ResourceCard key={resource.title} resource={resource} />
          ))}
        </View>
      </Card>
    </>
  );
}

function Settings({
  state,
  now,
  protectedLive,
  resetState,
  setScreen,
}: {
  state: HoldState;
  now: number;
  protectedLive: number;
  resetState: () => void;
  setScreen: (screen: Screen) => void;
}) {
  return (
    <>
      <Card>
        <Text style={styles.screenTitle}>Settings & Data</Text>
        <Text style={styles.bodyText}>
          Keep local control of your data. This native demo stores progress on this device.
        </Text>
        <View style={styles.twoGrid}>
          <Stat label="Clean time" value={cleanTimeLabel(state.cleanStart, now)} />
          <Stat label="Protected" value={formatMoney(protectedLive)} />
        </View>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Data</Text>
        <Text style={styles.bodyText}>
          No account, server sync, or cloud backup is included in this demo.
        </Text>
        <Button label="Reset local data" variant="danger" full onPress={resetState} />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Support</Text>
        <Text style={styles.bodyText}>
          Hold10 is a pause tool, not a replacement for qualified help.
        </Text>
        <Button label="Open Help Now" full onPress={() => setScreen("help")} />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ecfeff",
  },
  page: {
    gap: 14,
    padding: 16,
    paddingBottom: 36,
  },
  hero: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  title: {
    color: "#020617",
    fontSize: 38,
    fontWeight: "900",
  },
  subtitle: {
    color: "#475569",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: "#dbeafe",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  darkCard: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  button: {
    alignItems: "center",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fullButton: {
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#0f172a",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderColor: "#dbeafe",
    borderWidth: 1,
  },
  ghostButton: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    minHeight: 42,
  },
  dangerButton: {
    backgroundColor: "#ffffff",
    borderColor: "#fecaca",
    borderWidth: 1,
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  secondaryButtonText: {
    color: "#0f172a",
  },
  ghostButtonText: {
    color: "#334155",
  },
  dangerButtonText: {
    color: "#b91c1c",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  navButtonCell: {
    width: "48%",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  twoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  threeGrid: {
    flexDirection: "row",
    gap: 8,
  },
  stat: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minWidth: "47%",
    padding: 16,
  },
  statIcon: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 6,
  },
  statLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statValue: {
    color: "#020617",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 8,
  },
  gardenStageRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  gardenStageIcon: {
    fontSize: 56,
    lineHeight: 64,
    textAlign: "center",
    width: 68,
  },
  gardenStageCopy: {
    flex: 1,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  greenLabel: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "800",
  },
  greenLabelCenter: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  redLabel: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "800",
  },
  urgentDisclaimer: {
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    color: "#991b1b",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    padding: 14,
  },
  money: {
    color: "#020617",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 6,
  },
  badge: {
    backgroundColor: "#bbf7d0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "900",
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#dbeafe",
    borderRadius: 18,
    borderWidth: 1,
    color: "#020617",
    fontSize: 18,
    fontWeight: "800",
    minHeight: 56,
    paddingHorizontal: 16,
  },
  countdown: {
    backgroundColor: "#ecfdf5",
    borderRadius: 18,
    gap: 12,
    padding: 16,
  },
  countdownText: {
    color: "#064e3b",
    fontSize: 13,
    fontWeight: "800",
  },
  progressTrack: {
    backgroundColor: "#dbeafe",
    borderRadius: 999,
    height: 12,
    overflow: "hidden",
  },
  calmProgressTrack: {
    backgroundColor: "#dcfce7",
  },
  progressFill: {
    backgroundColor: "#34d399",
    borderRadius: 999,
    height: "100%",
  },
  calmProgressFill: {
    backgroundColor: "#22c55e",
    borderRadius: 999,
    height: "100%",
  },
  note: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  screenTitle: {
    color: "#020617",
    fontSize: 26,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#020617",
    fontSize: 20,
    fontWeight: "900",
  },
  bodyText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  block: {
    gap: 10,
  },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  pickerItem: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dbeafe",
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: "18%",
  },
  pickerItemActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  pickerText: {
    color: "#0f172a",
    fontWeight: "800",
  },
  pickerTextActive: {
    color: "#ffffff",
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    backgroundColor: "#ffffff",
    borderColor: "#dbeafe",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  optionText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800",
  },
  optionTextActive: {
    color: "#ffffff",
  },
  segment: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dbeafe",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  segmentActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  segmentText: {
    color: "#0f172a",
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#ffffff",
  },
  timer: {
    color: "#020617",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },
  calmCircle: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#ecfdf5",
    borderRadius: 140,
    height: 260,
    justifyContent: "center",
    width: 260,
  },
  calmBoundary: {
    borderColor: "#6ee7b7",
    borderRadius: 82,
    borderWidth: 4,
    height: 164,
    position: "absolute",
    width: 164,
  },
  calmBreath: {
    backgroundColor: "#bbf7d0",
    borderColor: "#86efac",
    borderRadius: 98,
    borderWidth: 1,
    height: 196,
    opacity: 0.9,
    position: "absolute",
    shadowColor: "#0f766e",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    width: 196,
  },
  calmLabelPill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: 18,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  calmPhaseHint: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  calmText: {
    color: "#334155",
    fontSize: 18,
    fontWeight: "900",
  },
  breathPhaseCue: {
    color: "#047857",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  breathPhaseCueExhale: {
    color: "#166534",
    fontSize: 18,
  },
  feedback: {
    backgroundColor: "#ecfdf5",
    borderRadius: 16,
    color: "#047857",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    padding: 14,
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    color: "#1e3a8a",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    padding: 14,
  },
  checkItem: {
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: "#dbeafe",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  checkMark: {
    color: "#047857",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  checkText: {
    color: "#334155",
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
  },
  resource: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  resourceTitle: {
    color: "#064e3b",
    fontSize: 16,
    fontWeight: "900",
  },
  resourceBody: {
    color: "#065f46",
    fontSize: 14,
    lineHeight: 21,
  },
  darkLabel: {
    color: "#a7f3d0",
    fontSize: 14,
    fontWeight: "800",
  },
  darkTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
  },
  darkBody: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 22,
  },
});
