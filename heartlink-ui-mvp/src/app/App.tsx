import { Analytics } from '@vercel/analytics/react'
import { useState } from "react";
import { CreatorFlow } from "./components/CreatorFlow";
import { ReceiverFlow } from "./components/ReceiverFlow";
import { getGiftTokenFromLocation } from "./lib";
import type { GiftOccasion } from "./types";

/* MARKER-MAKE-KIT-INVOKED */

type AppMode = "creator" | "receiver";

function getReceiverTokenFromPath() {
  return getGiftTokenFromLocation();
}

export default function App() {
  const [receiverToken, setReceiverToken] = useState<string | undefined>(() => getReceiverTokenFromPath());
  const [mode, setMode] = useState<AppMode>(() => getReceiverTokenFromPath() ? "receiver" : "creator");
  const [creatorInitialScene, setCreatorInitialScene] = useState<GiftOccasion | undefined>();
  const [startCreatorAtSceneSelection, setStartCreatorAtSceneSelection] = useState(false);

  const showReceiver = () => {
    setReceiverToken(getReceiverTokenFromPath());
    setMode("receiver");
  };

  const showCreator = (initialScene?: GiftOccasion) => {
    if (typeof window !== "undefined" && window.location.pathname.match(/^\/to\//)) {
      window.history.pushState(null, "", "/");
    }

    setReceiverToken(undefined);
    setCreatorInitialScene(initialScene);
    setStartCreatorAtSceneSelection(Boolean(initialScene));
    setMode("creator");
  };

  return (
      <>
    <div className="size-full">
      {mode === "creator" ? (
        <CreatorFlow
          initialScene={creatorInitialScene}
          onViewReceiver={showReceiver}
          startAtSceneSelection={startCreatorAtSceneSelection}
        />
      ) : (
        <ReceiverFlow token={receiverToken} onBack={() => showCreator()} onCreateGift={showCreator} />
      )}
    </div>

    <Analytics />
  </>
  );
}
