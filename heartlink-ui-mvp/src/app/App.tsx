import { useState } from "react";
import { CreatorFlow } from "./components/CreatorFlow";
import { ReceiverFlow } from "./components/ReceiverFlow";

/* MARKER-MAKE-KIT-INVOKED */

type AppMode = "creator" | "receiver";

function getReceiverTokenFromPath() {
  if (typeof window === "undefined") return undefined;

  const match = window.location.pathname.match(/^\/to\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export default function App() {
  const [receiverToken, setReceiverToken] = useState<string | undefined>(() => getReceiverTokenFromPath());
  const [mode, setMode] = useState<AppMode>(() => getReceiverTokenFromPath() ? "receiver" : "creator");

  const showReceiver = () => {
    setReceiverToken(getReceiverTokenFromPath());
    setMode("receiver");
  };

  const showCreator = () => {
    if (typeof window !== "undefined" && window.location.pathname.match(/^\/to\//)) {
      window.history.pushState(null, "", "/");
    }

    setReceiverToken(undefined);
    setMode("creator");
  };

  return (
    <div className="size-full">
      {mode === "creator" ? (
        <CreatorFlow onViewReceiver={showReceiver} />
      ) : (
        <ReceiverFlow token={receiverToken} onBack={showCreator} />
      )}
    </div>
  );
}
