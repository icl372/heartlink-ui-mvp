import { useState } from "react";
import { CreatorFlow } from "./components/CreatorFlow";
import { ReceiverFlow } from "./components/ReceiverFlow";
import { getGiftTokenFromLocation } from "./lib";

/* MARKER-MAKE-KIT-INVOKED */

type AppMode = "creator" | "receiver";

function getReceiverTokenFromPath() {
  return getGiftTokenFromLocation();
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
