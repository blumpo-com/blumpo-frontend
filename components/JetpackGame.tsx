"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isFlying: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rocket" | "shield";
}

interface Coin {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  rotation: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const LIFT = -8;
const MAX_VELOCITY = 12;
const SCROLL_SPEED = 4;

export function JetpackGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver">("menu");
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const gameLoopRef = useRef<number>();
  const gameStateRef = useRef(gameState);

  const playerRef = useRef<Player>({
    x: 150,
    y: CANVAS_HEIGHT / 2,
    width: 60,
    height: 70,
    velocityY: 0,
    isFlying: false,
  });

  const cloudsRef = useRef<Cloud[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const scrollOffsetRef = useRef(0);
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const clouds: Cloud[] = [];
    for (let i = 0; i < 15; i += 1) {
      clouds.push({
        x: Math.random() * CANVAS_WIDTH * 3,
        y: Math.random() * CANVAS_HEIGHT,
        width: 80 + Math.random() * 100,
        height: 40 + Math.random() * 40,
        speed: 0.3 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.4,
      });
    }
    cloudsRef.current = clouds;
  }, []);

  const drawCloud = (ctx: CanvasRenderingContext2D, cloud: Cloud) => {
    ctx.save();
    ctx.globalAlpha = cloud.opacity;
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - cloud.height * 0.2, cloud.width * 0.25, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.width * 0.35, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.3, cloud.y + cloud.height * 0.15, cloud.width * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawRabbit = (ctx: CanvasRenderingContext2D, player: Player) => {
    const x = player.x;
    const y = player.y;
    const tilt = player.isFlying ? -10 : 5;

    ctx.save();
    ctx.translate(x + player.width / 2, y + player.height / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-(x + player.width / 2), -(y + player.height / 2));

    if (player.isFlying) {
      const flameHeight = 15 + Math.random() * 10;
      ctx.fillStyle = "#FF6B35";
      ctx.beginPath();
      ctx.ellipse(x + 15, y + player.height - 10, 8, flameHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFA500";
      ctx.beginPath();
      ctx.ellipse(x + 15, y + player.height - 10, 5, flameHeight * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.ellipse(x + 15, y + player.height - 10, 3, flameHeight * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#4A90E2";
    ctx.fillRect(x + 5, y + 25, 20, 30);
    ctx.fillStyle = "#357ABD";
    ctx.fillRect(x + 7, y + 27, 16, 26);

    ctx.strokeStyle = "#2E5C8A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 25, y + 30);
    ctx.lineTo(x + 35, y + 25);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(x + 30, y + 35, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(x + 35, y + 15, 15, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(x + 30, y - 5, 5, 15, (-20 * Math.PI) / 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#E0E0E0";
    ctx.stroke();

    ctx.fillStyle = "#FFB6C1";
    ctx.beginPath();
    ctx.ellipse(x + 30, y - 3, 3, 10, (-20 * Math.PI) / 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(x + 40, y - 5, 5, 15, (20 * Math.PI) / 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#E0E0E0";
    ctx.stroke();

    ctx.fillStyle = "#FFB6C1";
    ctx.beginPath();
    ctx.ellipse(x + 40, y - 3, 3, 10, (20 * Math.PI) / 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2C3E50";
    ctx.beginPath();
    ctx.arc(x + 30, y + 13, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 40, y + 13, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x + 31, y + 12, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 41, y + 12, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFB6C1";
    ctx.beginPath();
    ctx.arc(x + 35, y + 20, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#2C3E50";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 35, y + 21, 4, 0, Math.PI);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(x + 22, y + 55, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#E0E0E0";
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x + 38, y + 55, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 30);
    ctx.lineTo(x + 15, y + 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 45, y + 30);
    ctx.lineTo(x + 52, y + 38);
    ctx.stroke();

    ctx.restore();
  };

  const drawRocket = (ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    const x = obstacle.x;
    const y = obstacle.y;

    ctx.fillStyle = "#E74C3C";
    ctx.beginPath();
    ctx.moveTo(x + obstacle.width, y + obstacle.height / 2);
    ctx.lineTo(x + obstacle.width * 0.7, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + obstacle.height);
    ctx.lineTo(x + obstacle.width * 0.7, y + obstacle.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#C0392B";
    ctx.fillRect(x + 10, y, 8, obstacle.height);
    ctx.fillRect(x + 25, y, 8, obstacle.height);

    ctx.fillStyle = "#3498DB";
    ctx.beginPath();
    ctx.arc(x + 40, y + obstacle.height / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5DADE2";
    ctx.beginPath();
    ctx.arc(x + 41, y + obstacle.height / 2 - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#95A5A6";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 10, y - 8);
    ctx.lineTo(x, y + 15);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y + obstacle.height);
    ctx.lineTo(x - 10, y + obstacle.height + 8);
    ctx.lineTo(x, y + obstacle.height - 15);
    ctx.closePath();
    ctx.fill();
  };

  const drawShield = (ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    const x = obstacle.x;
    const y = obstacle.y;
    const centerX = x + obstacle.width / 2;
    const centerY = y + obstacle.height / 2;

    ctx.strokeStyle = "#9B59B6";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, obstacle.width / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#8E44AD";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, obstacle.width / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#A569BD";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    const time = Date.now() / 100;
    ctx.strokeStyle = "#E8DAEF";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const angle = (i * Math.PI) / 2 + time;
      const innerRadius = 15;
      const outerRadius = obstacle.width / 2 - 5;

      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * innerRadius,
        centerY + Math.sin(angle) * innerRadius
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * outerRadius,
        centerY + Math.sin(angle) * outerRadius
      );
      ctx.stroke();
    }
  };

  const drawCoin = (ctx: CanvasRenderingContext2D, coin: Coin) => {
    if (coin.collected) return;

    ctx.save();
    ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
    ctx.rotate(coin.rotation);
    ctx.scale(Math.cos(coin.rotation), 1);

    ctx.fillStyle = "#F39C12";
    ctx.beginPath();
    ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F1C40F";
    ctx.beginPath();
    ctx.arc(0, 0, coin.width / 2 - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F39C12";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("*", 0, 0);

    ctx.fillStyle = "#FFF9E6";
    ctx.beginPath();
    ctx.arc(-5, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const generateObstacle = () => {
    const type = Math.random() > 0.5 ? "rocket" : "shield";
    const height = type === "rocket" ? 40 : 60;
    const width = type === "rocket" ? 60 : 60;

    obstaclesRef.current.push({
      x: CANVAS_WIDTH + scrollOffsetRef.current,
      y: Math.random() * (CANVAS_HEIGHT - height - 100) + 50,
      width,
      height,
      type,
    });
  };

  const generateCoin = () => {
    coinsRef.current.push({
      x: CANVAS_WIDTH + scrollOffsetRef.current + Math.random() * 200,
      y: Math.random() * (CANVAS_HEIGHT - 150) + 75,
      width: 25,
      height: 25,
      collected: false,
      rotation: 0,
    });
  };

  const checkCollision = (
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ) =>
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y;

  const gameLoop = () => {
    if (gameStateRef.current !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.5, "#B0D4F1");
    gradient.addColorStop(1, "#E6A8D7");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    cloudsRef.current.forEach((cloud) => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = CANVAS_WIDTH + Math.random() * 200;
        cloud.y = Math.random() * CANVAS_HEIGHT;
      }
      drawCloud(ctx, cloud);
    });

    const player = playerRef.current;

    if (player.isFlying) {
      player.velocityY += LIFT * 0.15;
    }
    player.velocityY += GRAVITY;
    player.velocityY = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, player.velocityY));
    player.y += player.velocityY;

    if (player.y < 0) {
      player.y = 0;
      player.velocityY = 0;
    }
    if (player.y + player.height > CANVAS_HEIGHT) {
      player.y = CANVAS_HEIGHT - player.height;
      player.velocityY = 0;
    }

    scrollOffsetRef.current += SCROLL_SPEED;
    const newDistance = Math.floor(scrollOffsetRef.current / 10);
    distanceRef.current = newDistance;
    setDistance(newDistance);

    if (Math.random() < 0.02) {
      generateObstacle();
    }

    if (Math.random() < 0.03) {
      generateCoin();
    }

    obstaclesRef.current = obstaclesRef.current.filter((obstacle) => {
      obstacle.x -= SCROLL_SPEED;

      if (obstacle.x + obstacle.width < 0) {
        return false;
      }

      if (checkCollision(player, obstacle)) {
        setGameState("gameOver");
      }

      if (obstacle.type === "rocket") {
        drawRocket(ctx, obstacle);
      } else {
        drawShield(ctx, obstacle);
      }

      return true;
    });

    coinsRef.current = coinsRef.current.filter((coin) => {
      coin.x -= SCROLL_SPEED;
      coin.rotation += 0.05;

      if (coin.x + coin.width < 0) {
        return false;
      }

      if (!coin.collected && checkCollision(player, coin)) {
        coin.collected = true;
        scoreRef.current += 10;
        setScore(scoreRef.current);
      }

      drawCoin(ctx, coin);

      return !coin.collected;
    });

    drawRabbit(ctx, playerRef.current);

    ctx.save();

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    const padding = 15;
    const gap = 10;
    const boxHeight = 60;
    const scoreBoxWidth = 120;
    const distanceBoxWidth = 120;

    ctx.beginPath();
    ctx.roundRect(padding, padding, scoreBoxWidth, boxHeight, 12);
    ctx.fill();

    const scoreGradient = ctx.createLinearGradient(padding, padding, padding, padding + boxHeight);
    scoreGradient.addColorStop(0, "#FBBF24");
    scoreGradient.addColorStop(1, "#F97316");
    ctx.fillStyle = scoreGradient;
    ctx.beginPath();
    ctx.roundRect(padding + 3, padding + 3, scoreBoxWidth - 6, boxHeight - 6, 10);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText("SCORE", padding + 10, padding + 20);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText(scoreRef.current.toString(), padding + 10, padding + 48);

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.roundRect(padding + scoreBoxWidth + gap, padding, distanceBoxWidth, boxHeight, 12);
    ctx.fill();

    const distanceGradient = ctx.createLinearGradient(
      padding + scoreBoxWidth + gap,
      padding,
      padding + scoreBoxWidth + gap,
      padding + boxHeight
    );
    distanceGradient.addColorStop(0, "#60A5FA");
    distanceGradient.addColorStop(1, "#A855F7");
    ctx.fillStyle = distanceGradient;
    ctx.beginPath();
    ctx.roundRect(padding + scoreBoxWidth + gap + 3, padding + 3, distanceBoxWidth - 6, boxHeight - 6, 10);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "bold 11px Arial";
    ctx.fillText("DISTANCE", padding + scoreBoxWidth + gap + 10, padding + 20);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`${distanceRef.current}m`, padding + scoreBoxWidth + gap + 10, padding + 48);

    ctx.restore();

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const handleStart = () => {
    if (gameState === "menu" || gameState === "gameOver") {
      playerRef.current = {
        x: 150,
        y: CANVAS_HEIGHT / 2,
        width: 60,
        height: 70,
        velocityY: 0,
        isFlying: false,
      };
      obstaclesRef.current = [];
      coinsRef.current = [];
      scrollOffsetRef.current = 0;
      scoreRef.current = 0;
      distanceRef.current = 0;
      setScore(0);
      setDistance(0);
    }
    setGameState("playing");
  };

  const handlePause = () => {
    setGameState("paused");
  };

  const handleResume = () => {
    setGameState("playing");
  };

  const handleMouseDown = () => {
    if (gameState === "playing") {
      playerRef.current.isFlying = true;
    }
  };

  const handleMouseUp = () => {
    if (gameState === "playing") {
      playerRef.current.isFlying = false;
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    event.preventDefault();
    handleMouseDown();
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    event.preventDefault();
    handleMouseUp();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="rounded-3xl shadow-2xl cursor-pointer border-4 border-white/50 max-w-full h-auto"
          style={{ touchAction: "none" }}
        />

        {gameState === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Jetpack Bunny
              </h1>
              <p className="text-gray-700 mb-6">
                Hold to fly. Release to glide.
                <br />
                Avoid obstacles and collect coins.
              </p>
              <button
                onClick={handleStart}
                type="button"
                className="bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 mx-auto mb-4"
              >
                <Play className="w-5 h-5" />
                Start
              </button>
              <div className="text-sm text-gray-500">Mouse or touch</div>
            </div>
          </div>
        )}

        {gameState === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Paused</h2>
              <p className="text-gray-600 mb-6">Click play to continue</p>
              <button
                onClick={handleResume}
                type="button"
                className="bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105 mx-auto flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Resume
              </button>
            </div>
          </div>
        )}

        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
              <h2 className="text-4xl font-bold text-red-600 mb-4">Game Over</h2>
              <div className="mb-6">
                <div className="text-gray-600">Score:</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">
                  {score}
                </div>
                <div className="text-gray-600 mt-2">Distance: {distance}m</div>
              </div>
              <button
                onClick={handleStart}
                type="button"
                className="bg-gradient-to-br from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center text-sm text-gray-600 max-w-2xl">
        <p className="font-medium">
          Controls: hold mouse or touch to activate jetpack and rise. Release to glide.
        </p>
        <div className="mt-2 flex items-center justify-center gap-3 text-sm">
          <button
            onClick={handleStart}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Play className="h-4 w-4" />
            Start
          </button>
          <button
            onClick={handlePause}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Pause className="h-4 w-4" />
            Pause
          </button>
        </div>
      </div>
    </div>
  );
}
