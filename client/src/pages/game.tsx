"use client";

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { GameHeader } from "@/components/game/game-header";
import { GameSidebarButtons } from "@/components/game/game-sidebar-buttons";
import { AquariumTabs } from "@/components/game/aquarium-tabs";
import { TipsPopup } from "@/components/game/tips-popup";
import { FishDisplay } from "@/components/game/fish-display";
import { INITIAL_GAME_STATE } from "@/data/game-data";
import { useAquarium } from "@/hooks/use-aquarium";
import { useFishStats } from "@/hooks/use-fish-stats";
import { GameMenu } from "@/components/game/game-menu";
import { useBubbles } from "@/hooks/use-bubbles";
import { BubblesBackground } from "@/components/bubble-background";
import { motion } from "framer-motion";
import type { FishType } from "@/types/game";
import { useActiveAquarium } from "../store/active-aquarium";
import { initialAquariums } from "@/data/mock-aquarium";
import { useDirtSystemFixed as useDirtSystem } from "@/hooks/use-dirt-system-fixed"
import { DirtOverlay } from "@/components/game/dirt-overlay"
import { DirtDebugControls } from "@/components/game/dirt-debug-controls"

export default function GamePage() {
  const activeAquariumId = useActiveAquarium((s) => s.activeAquariumId);
  const aquarium = initialAquariums.find(a => a.id.toString() === activeAquariumId) || initialAquariums[0];
  const { happiness, food, energy } = useFishStats(INITIAL_GAME_STATE);
  const { selectedAquarium, handleAquariumChange, aquariums } = useAquarium();
  const [showMenu, setShowMenu] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const location = useLocation();

  const [showDirtDebug, setShowDirtDebug] = useState(false) // Debug controls visibility  // Initialize dirt system
  const dirtSystem = useDirtSystem({
    spawnInterval: 5000, // 5 seconds
    maxSpots: 5,
    aquariumBounds: {
      x: 0,
      y: 0,
      width: 2000,
      height: 1000,
    },
    spawnChance: 0.7, // 70% chance
  })

  const bubbles = useBubbles({
    initialCount: 10,
    maxBubbles: 20,
    minSize: 6,
    maxSize: 30,
    minDuration: 10,
    maxDuration: 18,
    interval: 400,
  });

  const handleTipsToggle = () => {
    setShowTips(!showTips);
  };

  // Parse fish species from URL param
  const searchParams = new URLSearchParams(location.search);
  const fishesParam = searchParams.get("fishes");
  const fishFromUrl = JSON.parse(
    decodeURIComponent(fishesParam || "[]")
  ) as string[];

  // Match species to mock data
  const speciesToFishData = {
    AngelFish: {
      image: "/fish/fish1.png",
      name: "Blue Striped Fish",
      rarity: "Rare",
      generation: 1,
    },
    GoldFish: {
      image: "/fish/fish2.png",
      name: "Tropical Coral Fish",
      rarity: "Uncommon",
      generation: 2,
    },
    Betta: {
      image: "/fish/fish3.png",
      name: "Orange Tropical Fish",
      rarity: "Epic",
      generation: 1,
    },
    NeonTetra: {
      image: "/fish/fish4.png",
      name: "Scarlet Fin",
      rarity: "Legendary",
      generation: 1,
    },
  };

  // Create fish objects from URL parameters
  const fishObjects: FishType[] = fishFromUrl.map((species, index) => {
    const data = speciesToFishData[
      species as keyof typeof speciesToFishData
    ] || {
      image: "/fish/fish1.png",
      name: "Unknown Fish",
      rarity: "Common",
      generation: 1,
    };

    return {
      id: index,
      name: data.name,
      image: data.image,
      rarity: data.rarity,
      generation: data.generation,
      position: { x: 0, y: 0 },
    };
  });

  // Use fish from URL if available, otherwise use selected aquarium fish
  const displayFish =
    fishObjects.length > 0 ? fishObjects : aquarium.fishes;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#005C99]">
      {/* Background */}
      <img
        src="/backgrounds/background2.png"
        alt="Underwater Background"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Bubbles */}
      <BubblesBackground
        bubbles={bubbles}
        className="absolute inset-0 z-10 pointer-events-none"
      />

      {/* Effects */}
      <div className="absolute inset-0 light-rays z-20"></div>
      <div className="absolute inset-0 animate-water-movement z-20"></div>

      {/* Fish */}
      <motion.div
        key={aquarium.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 1 }}
        className="relative z-20 w-full h-full"
      >
        <FishDisplay fish={displayFish} />
      </motion.div>

      <DirtOverlay 
        spots={dirtSystem.spots}
        onRemoveSpot={dirtSystem.removeDirtSpot}
        className="absolute inset-0 z-50"
      />

      {/* Header */}
      <GameHeader
        happiness={happiness}
        food={food}
        energy={energy}
        onMenuToggle={() => setShowMenu(!showMenu)}
      />

      {showMenu && <GameMenu show={showMenu} />}

      <GameSidebarButtons />    
      
      {/* Debug Controls */}
      {showDirtDebug && (
        <div className="absolute top-4 right-4 z-40">
          <DirtDebugControls
            isSpawnerActive={dirtSystem.isSpawnerActive}
            spotCount={dirtSystem.spots.length}
            maxSpots={dirtSystem.config.maxSpots}
            totalCreated={dirtSystem.totalSpotsCreated}
            totalRemoved={dirtSystem.totalSpotsRemoved}
            cleanlinessScore={dirtSystem.cleanlinessScore}
            onToggleSpawner={dirtSystem.toggleSpawner}
            onForceSpawn={dirtSystem.forceSpawnSpot}
            onClearAll={dirtSystem.clearAllSpots}
          />
          <button
            onClick={() => setShowDirtDebug(false)}
            className="mt-2 w-full text-xs text-gray-400 hover:text-white transition-colors"
          >
            Hide Debug
          </button>
        </div>
      )}

      {/* Show Debug Button (when hidden) */}
      {!showDirtDebug && (
        <button
          onClick={() => setShowDirtDebug(true)}
          className="absolute top-4 right-4 z-40 bg-black/50 text-white px-3 py-1 rounded text-xs hover:bg-black/70 transition-colors"
        >
          🧹 Debug
        </button>
      )}

      {/* Tips */}
      <div className="absolute bottom-0 right-4 mb-4 z-30">
        <TipsPopup
          show={showTips}
          onClose={() => setShowTips(false)}
          onToggle={handleTipsToggle}
        />
      </div>

      {/* Tabs */}
      <AquariumTabs
        aquariums={aquariums}
        selectedAquarium={aquarium}
        onAquariumSelect={handleAquariumChange}
      />
    </div>
  );
}
