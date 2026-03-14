const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

ctx.imageSmoothingEnabled = true
ctx.imageSmoothingQuality = "high"

/* IMAGENS */

const playerImg = new Image()
playerImg.src = "player.png"

const noteImg = new Image()
noteImg.src = "nota.png"

/* CANVAS FULLSCREEN */

function resizeCanvas(){
canvas.width = window.innerWidth
canvas.height = window.innerHeight
}

resizeCanvas()
window.addEventListener("resize", resizeCanvas)

/* AUDIO */

const music = document.getElementById("music")

/* GAME STATE */

let score = 0
let combo = 0
let gameOver = false
let musicStarted = false
let frame = 0

document.getElementById("score").innerText = score
document.getElementById("combo").innerText = combo

/* PLAYER */

const player = {
x:150,
y:canvas.height - 100,
vy:0,
jump:false,
width:80,
height:80
}

const gravity = 0.8

/* OBSTÁCULOS */

let beats = []

function getGround(){
return canvas.height - 100
}

function getBeatHeight(){
return canvas.height - 80
}

function getRestartButton(){
return {
x: canvas.width/2 - 100,
y: canvas.height/2,
width:200,
height:50
}
}

/* RESET */

function restartGame(){

score = 0
combo = 0
gameOver = false

player.y = getGround()
player.vy = 0
player.jump = false

beats = []

document.getElementById("score").innerText = score
document.getElementById("combo").innerText = combo

}

/* SPAWN */

function spawnBeat(){

if(gameOver) return

beats.push({
x:canvas.width,
y:getBeatHeight(),
size:40
})

}

setInterval(spawnBeat,1200)

/* MUSIC */

function startMusic(){

if(!musicStarted){
music.play().catch(()=>{})
musicStarted = true
}

}

/* JUMP */

function jump(){

if(!player.jump && !gameOver){
player.vy = -17
player.jump = true
}

startMusic()

}

/* KEYBOARD */

document.addEventListener("keydown", e=>{
if(e.code==="Space"){
jump()
}
})

/* INPUT UNIVERSAL (PC + MOBILE) */

canvas.addEventListener("pointerdown", function(e){

const rect = canvas.getBoundingClientRect()

const scaleX = canvas.width / rect.width
const scaleY = canvas.height / rect.height

const x = (e.clientX - rect.left) * scaleX
const y = (e.clientY - rect.top) * scaleY

handleInput(x,y)

})

function handleInput(x,y){

const restartButton = getRestartButton()

if(gameOver){

if(
x > restartButton.x &&
x < restartButton.x + restartButton.width &&
y > restartButton.y &&
y < restartButton.y + restartButton.height
){
restartGame()
}

}else{

jump()

}

}

/* UPDATE */

function update(){

player.vy += gravity
player.y += player.vy

const ground = getGround()

if(player.y >= ground){
player.y = ground
player.jump = false
}

beats.forEach((beat,index)=>{

beat.x -= 7

if(
player.x < beat.x + beat.size &&
player.x + player.width > beat.x &&
player.y < beat.y + beat.size &&
player.y + player.height > beat.y
){
gameOver = true
}

if(beat.x < -40){

score += 10
combo++

document.getElementById("score").innerText = score
document.getElementById("combo").innerText = combo

beats.splice(index,1)

}

})

}

/* DRAW */

function drawBackground(){

ctx.fillStyle = "#050505"
ctx.fillRect(0,0,canvas.width,canvas.height)

ctx.strokeStyle = "#00ffff"
ctx.lineWidth = 3

ctx.beginPath()

const ground = canvas.height - 50

ctx.moveTo(0,ground)
ctx.lineTo(canvas.width,ground)
ctx.stroke()

}

function drawPlayer(){

frame++

let bounce = Math.sin(frame * 0.2) * 3

ctx.drawImage(
playerImg,
player.x - player.width/2,
player.y - player.height/2 + bounce,
player.width,
player.height
)

}

function drawBeats(){

beats.forEach(beat=>{

ctx.drawImage(
noteImg,
beat.x,
beat.y,
beat.size,
beat.size
)

})

}

function drawGameOver(){

const restartButton = getRestartButton()

ctx.fillStyle="red"
ctx.font="60px Arial"
ctx.textAlign="center"

ctx.fillText("GAME OVER",canvas.width/2,canvas.height/2 - 80)

ctx.fillStyle="#00ffff"

ctx.fillRect(
restartButton.x,
restartButton.y,
restartButton.width,
restartButton.height
)

ctx.fillStyle="black"
ctx.font="24px Arial"

ctx.fillText(
"REINICIAR",
canvas.width/2,
restartButton.y + 32
)

ctx.textAlign="left"

}

/* LOOP */

function gameLoop(){

ctx.clearRect(0,0,canvas.width,canvas.height)

drawBackground()
drawPlayer()
drawBeats()

if(!gameOver){
update()
}else{
drawGameOver()
}

requestAnimationFrame(gameLoop)

}

playerImg.onload = ()=>{
gameLoop()
}