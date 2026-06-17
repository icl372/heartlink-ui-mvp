import { useState } from "react";
import { CreatorFlow } from "./components/CreatorFlow";
import { ReceiverFlow } from "./components/ReceiverFlow";

/* MARKER-MAKE-KIT-INVOKED */

type AppMode = "creator" | "receiver";

export default function App() {
  const [mode, setMode] = useState<AppMode>("creator");

  return (
    <div className="size-full">
      {mode === "creator" ? (
        <CreatorFlow onViewReceiver={() => setMode("receiver")} />
      ) : (
        <ReceiverFlow onBack={() => setMode("creator")} />
      )}
    </div>
  );
}
