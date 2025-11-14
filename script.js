// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive canvas size
function setCanvas(){
  canvas.width = Math.min(window.innerWidth - 20, 420);
  canvas.height = Math.min(window.innerHeight - 20, 760);
}
setCanvas();
window.addEventListener("resize", setCanvas);

// UI
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartText = document.getElementById("restartText");

const scoreBox = document.createElement("div");
scoreBox.id = "scoreBox";
scoreBox.innerText = "Score: 0";
document.body.appendChild(scoreBox);

// Sounds
const bgMusic = new Audio("music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

const flapSound = new Audio("flap.mp3");
const gameoverSound = new Audio("gameover.mp3");

// Images
const birdImg = new Image();
birdImg.src = "bird.png";

// Game values
let started = false;
let over = false;
let canRestart = false;
let score = 0;

// Bird
const bird = {
  x: 60,
  y: canvas.height * 0.45,
  w: 100,
  h: 100,
  vy: null,     // NULL = NO GRAVITY UNTIL FIRST TAP
  gravity: 0.28,
  jump: -5
};

// Pipes
let pipes = [];
let pipeGap = 260;
let pipeSpeed = 2.6;
let pipeWidth = 80;
let pipeInterval = 2000;
let lastPipeTime = 0;

// Background (no clouds)
function drawBG(){
  let g = ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0,"#ffb37b");
  g.addColorStop(0.5,"#ff7e5f");
  g.addColorStop(1,"#7b2cbf");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

// Spawn pipes
function spawnPipe(){
  let top = Math.random() * (canvas.height - pipeGap - 150) + 60;
  pipes.push({
    x: canvas.width + 20,
    top: top,
    bottom: top + pipeGap,
    passed: false
  });
}

// Draw pipes
function drawPipes(){
  ctx.fillStyle = "#0b6623";
  pipes.forEach(p=>{
    ctx.fillRect(p.x,0,pipeWidth,p.top);
    ctx.fillRect(p.x,p.bottom,pipeWidth,canvas.height - p.bottom);
  });
}

// Collision check
function collide(){
  if (bird.y < 0 || bird.y + bird.h > canvas.height) return true;
  for (let p of pipes){
    if (bird.x < p.x + pipeWidth &&
        bird.x + bird.w > p.x &&
        (bird.y < p.top || bird.y + bird.h > p.bottom)){
      return true;
    }
  }
  return false;
}

// Game over
function triggerGameOver(){
  over = true;
  bgMusic.pause();
  gameoverSound.play();

  gameOverScreen.style.display = "block";
  restartText.style.display = "none";
  canRestart = false;

  setTimeout(()=>{
    restartText.style.display = "block";
    canRestart = true;
  },3000);
}

// Reset
function reset(){
  gameOverScreen.style.display = "none";
  over = false;
  started = false;
  canRestart = false;

  bird.y = canvas.height * 0.45;
  bird.vy = null;

  pipes = [];
  score = 0;
  scoreBox.innerText = "Score: 0";

  startScreen.style.display = "block";
  canvas.style.display = "none";
}

// Main loop
let last = performance.now();
function loop(now){
  let dt = now - last;
  last = now;

  drawBG();   // Clouds removed

  if (started && !over){
    if (now - lastPipeTime > pipeInterval){
      spawnPipe();
      lastPipeTime = now;
    }

    pipes.forEach(p=>{
      p.x -= pipeSpeed;
      if (!p.passed && p.x + pipeWidth < bird.x){
        p.passed = true;
        score++;
        scoreBox.innerText = "Score: " + score;
      }
    });

    pipes = pipes.filter(p => p.x + pipeWidth > -20);

    if (bird.vy !== null){
      bird.vy += bird.gravity;
      bird.y += bird.vy;
    }
  }

  drawPipes();
  ctx.drawImage(birdImg,bird.x,bird.y,bird.w,bird.h);

  if (started && !over && collide()){
    triggerGameOver();
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Input
function flap(){
  if (!started) return;
  if (over){
    if (canRestart) reset();
    return;
  }
  if (bird.vy === null) bird.vy = 0;
  flapSound.currentTime = 0;
  flapSound.play();
  bird.vy = bird.jump;
}

startBtn.onclick = ()=>{
  started = true;
  bird.vy = null;
  bird.y = canvas.height * 0.45;

  startScreen.style.display = "none";
  canvas.style.display = "block";

  bgMusic.currentTime = 0;
  bgMusic.play();

  lastPipeTime = performance.now();
};

// Phone input
window.addEventListener("touchstart",(e)=>{
  e.preventDefault();
  flap();
},{passive:false});

// PC input
window.addEventListener("click",()=>flap());
window.addEventListener("keydown",(e)=>{
  if (e.code === "Space"){
    e.preventDefault();
    if (!started){
      startBtn.onclick();
    } else {
      flap();
    }
  }
});
