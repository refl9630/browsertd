
//game screen data
const canvas = document.getElementById('game');
const ctx = canvas.getContext("2d");
//gui screen data
const canvasgui = document.getElementById('gui');
const gui = canvasgui.getContext("2d");

const gamebox = document.getElementById('wrapper'); //game canvas container
const tmenu = document.getElementById('towermenu');	//game controls container

canvas.width = 640;
canvas.height = 576;
canvasgui.width = 640;
canvasgui.height = 576;

const tileSize = 64;
const gridSize = (canvas.width / tileSize) * (canvas.height / tileSize);
const gridX = canvas.width / tileSize;
const gridY = canvas.height / tileSize;
let autoclose


class spriteSheet {
	constructor (src, spritesize, sheetgrid) {
		const ssheet = new Image ()
		ssheet.src = src
		this.image = ssheet
		this.spritesize = spritesize
		this.sheetgrid = sheetgrid
		this.spriteindex = sheetCoords(sheetgrid[0],sheetgrid[1], spritesize)
	}
	swapSheet (src) {
		const ssheet = new Image ()
		ssheet.src = src
		this.image = ssheet
	}
	getSpriteOrigin (number) {
		return this.spriteindex[number]
	}
/* 	animationFrame (delay, frame, framecount, animation) {
		
	} */
}
/* class animationSheet extends spriteSheet () {
	constructor (src, spritesize, sheetgrid, refreshrate, frames) {
		super (src, spritesize, sheetgrid) 												//new sheet
		this.rate = refreshrate															//delay between frames
		this.indexlist = frames															//index array of animation frames
	}

} */

function sheetCoords (gx, gy, sd) {
	const myindex = []
	const dimention = sd
	for (let i = 0; i < gy; i++) {
		let yoff = i*dimention 
		let xoff
		for (let j = 0; j< gx; j++) {
			xoff = j*dimention
			let spriteOffset = {
				"x" : (0 + xoff),
				"y" : (0 + yoff)
			}
			myindex.push(spriteOffset)
		}
	}
	return myindex
}

function active() {
	gamebox.addEventListener("mousemove", (e) => {
		hovering = tileNumber(e.offsetX, e.offsetY)
	})
	gamebox.addEventListener("touchend", (e) => {
		clearTimeout(autoclose)
		touchActive = false
		//		console.log(e);
		autoclose = setTimeout(function () {
			if (!touchActive) {
				closeMenu()
				hovering = undefined
			}
			else {
				touchActive = false
			}
		}, 3000)
	})
	gamebox.addEventListener("touchstart", () => {
		touchActive = true
	})
	gamebox.addEventListener("touchmove", () => {
		touchActive = true
	})
}

//canvas 
function drawCircle(x, y, d) {
	ctx.beginPath();
	ctx.arc(x, y, d, 0, 2 * Math.PI);
	ctx.stroke();
}
function drawStage() {
	for (let i = 0; i < tileObjects.length; i++) {
		drawSquare(findTilePosition(i), tileObjects[i].att)
	}
}
function drawSquare(position, type) {
	switch (type) {
		case 0:
			ctx.fillStyle = "green";
			break;
		case 1:
			ctx.fillStyle = "brown";
			break;
		case 2:
			ctx.fillStyle = "blue";
			break;
	}
	ctx.fillRect(position.x, position.y, tileSize, tileSize)
}
function drawProjectile(from, dist, sprite, width, facing) {
	const o = from
	const w = width
	const d = dist
	const r = facing * 128
	const s = sprite
	for (let i = 0; i < 10; i++) {
		let x = d.deltaX * (0.1 * i)
		let y = d.deltaY * (0.1 * i)
		//        drawSprite((from.x+(deltaX*i)), (from.y+(deltaY*i)), width, width)
		setTimeout(function () { dirSprite(s, r, (o.x + x), (o.y + y), w, w) }, (Tick.ms * i * .1))
	}
}

function drawSprite(x, y, w, h, char) {
	let sprite = char
	ctx.drawImage(sprite, x - (w * 0.5), y - (h * 0.5), w, h)
}
function dirSprite(char, r, x, y, w, h) {
	let sprite = char
	ctx.drawImage(sprite, r, 0, 128, 128, x - (w * 0.5), y - (h * 0.5), w, h)
}
function rotatedSprite(img, x, y, width, height, deg) {
	ctx.save()
	var rad = deg * Math.PI / 180;
	ctx.translate(x + width / 2, y + height / 2);
	ctx.rotate(rad);
	ctx.drawImage(img, width / 2 * (-1), height / 2 * (-1), width, height);
	ctx.restore();
}
function drawSheetSprite (sheet, x, y, w, h, spritenum) {
	let sprite = sheet.image 
	let originOffset = sheet.spriteindex[spritenum]
	let sx = originOffset.x
	let sy = originOffset.y
	let sd = sheet.spritesize
	ctx.drawImage(sprite, sx, sy, sd, sd, x, y, w, h)
}


let bsprite = new Image()
bsprite.src = "assets/img/blast.png"
let gsprite = new Image()
gsprite.src = "assets/img/ghostd.png"
function deathAnimation(position) {
	let x = position.x
	let y = position.y
	let sprite = gsprite
	for (let i = 0; i < 30; i++) {
		let timer = i * 20
		setTimeout(function () { drawSprite(x, y - i, 40, 40, sprite) }, timer)
	}
}
function drawBlast (x, y, r) {
	let bx = x 
	let by = y 
	let size = tileSize * r * 2
	let sprite = bsprite
	for (let i = 0; i < 30; i++) {
		let timer = i * 20
		setTimeout(function () { drawSprite(x, y - i, size, size, sprite) }, timer)
	}
}

//location data
function findTilePosition(coord) {
	let x;
	let y;
	let ygrid = Math.floor(coord / gridX);
	let xgrid = coord % gridX;
	x = xgrid * tileSize;
	y = ygrid * tileSize;
	return { x, y };
}
function findTileCenter(coord) {
	let x;
	let y;
	let pos = findTilePosition(coord);
	x = pos.x + (tileSize / 2);
	y = pos.y + (tileSize / 2)
	return { x, y }
}
function tileNumber(x, y) {
	let gx = Math.floor(x / tileSize)
	let gy = Math.floor(y / tileSize)
	let coo = (gy * gridX) + gx
	return coo
}
function findDelta(from, to) {
	const o = from
	const p = to
	let deltaX = (p.x - o.x)
	let deltaY = (p.y - o.y)
	return { deltaX, deltaY }
}
function inReach(x, y, reach) {
	let ax = Math.abs(x)
	let ay = Math.abs(y)
	if (ax > reach) {
		return false
	}
	else if (ay > reach) {
		return false
	}
	else {
		const cx = Math.ceil(ax)
		const cy = Math.ceil(ay)
		let d = Math.sqrt(cx*cx + cy*cy)
		if (d < reach) {
			return true
		}
		else {
			return false
		}
	}
}

async function confirmImportScreen() {
	return true
}