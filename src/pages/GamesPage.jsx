// /games — the 12-game Axo Games arcade (self-contained static HTML in an iframe).
import GameFrame from "../learn/GameFrame";

export default function GamesPage() {
  return (
    <GameFrame
      title="Axo Games"
      src="/games/axo-arcade/index.html"
      exitMessage="axo-games-exit"
      hint="12 tiny games · tap to play"
      activeNav="games"
    />
  );
}
