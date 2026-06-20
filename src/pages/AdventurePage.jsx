// /adventure — the Axo Adventure ninja-run platformer (static canvas game in an iframe).
import GameFrame from "../learn/GameFrame";

export default function AdventurePage() {
  return (
    <GameFrame
      title="Axo Adventure"
      src="/games/axo-ninja/index.html"
      exitMessage="axo-adventure-exit"
      hint="4 worlds · arrow keys + space"
      activeNav="adventure"
    />
  );
}
