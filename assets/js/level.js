//#region GAMESTATE CONSTRUCTORS

/* class state {
	constructor(){
		let tileArray = tileObjects;
		let towersArray = myTowers;
		let wavesCleared = waveCount;
		let time = tickCount;
		this.tiles = tileArray;
		this.towers = towersArray;
		this.initialStage = activeStage;
		this.gold = myGold;
		this.lives = myLives;
		this.cleared = wavesCleared;
		this.bgm = bgm;
		this.time = time;
		this.stageId = selectedStage;
		this.difficultyModifier = hardMode;
	}
	getState() {
		return JSON.stringify(this)
	}
	loadState() {
		hardMode = this.difficultyModifier;
		startLvl();
		selectedStage = this.stageId;
		activeStage = this.initialStage;
		myLives = this.lives;
		activeStage.initiate();
		tileObjects.splice(0, (tileObjects.length));
		tileObjects.push(this.tiles);
		myTowers.splice(0, (myTowers.length));
		myTowers.push(this.towers);
		myGold = 0;
		tickCount = this.time;
		updateGold (this.gold);

	}
} */
class stage {
	constructor(tiles, path, from, to, waves, gold, bg, short, lbgm) {
		this.tiles = tiles;
		this.path = path;
		this.waves = waves;
		this.len = path.length;
		this.from = from
		this.to = to
		this.bg = bg
		this.gold = gold
		this.short = short
		this.pathd = getDirections(path, from, to)
		this.shortd = getDirections(short, from, to)
		this.bgm = lbgm
	}

	createWave() {
		wave = []
		let currentWave = this.waves[waveCount]
		for (let i = 0; i < currentWave.length; i++) {
			wave.push(currentWave[i]);
		}
	}
	initiate() {
		canvas.style.backgroundImage = this.bg

		let sc = new gamescreen(this.tiles, this.path, this.short);
		let tileMap = sc.createTiles();
		if (hardMode == false) {
			bgm = this.bgm
		}
		else if (hardMode == true) {
			bgm = music.lvl4
		}
		do {
			tickCount = 0;
		}
		while (!bgmReady())
		updateGold(this.gold)
		updateLives(0)
		active()
		fadeInMusic()
		gameLoop()
	}
}
class gamescreen {
	constructor(attributes, paths, short) {
		this.attributes = attributes;
		this.states = attributes;
		this.paths = paths;
		this.shortpath = short;
	}
	createTiles() {
		for (let i = 0; i < this.attributes.length; i++) {
			let type = this.attributes[i]
			let mytile = new tile(i, this.attributes[i], this.states[i]);
			tileObjects[i] = mytile
			if (mytile.att == 3) {
				blocked.push(i)
			}
		}
		for (let i = 0; i < this.paths.length; i++) {
			let pathcoor = this.paths[i]
			let mypath = new pathtile(pathcoor, 1, 0, activeStage.pathd[i])
			tileObjects[pathcoor] = mypath
		}
		for (let i = 0; i < this.shortpath.length; i++) {
			let pathcoor = this.shortpath[i]
			let type = this.attributes[pathcoor]
			if (type == 2) {
				let mypath = new pathtile(pathcoor, 2, 0, activeStage.shortd[i])
				tileObjects[pathcoor] = mypath
			}
		}
		if (blocked.length > 0) {
			rubbleSprite = new Image()
			rubbleSprite.src = "assets/img/rubble.png"
		}
		return tileObjects;
	}
}

//#endregion

//#region TILE CLASSES
//att 0 tower(state 0 = free; 1 = occupied); att 1 path; att 2 shortcut; att 3 forsale;
class tile {
	constructor(coord, attribute, state) {
		this.att = attribute;
		this.state = state;
		this.coord = coord;
	};
	position() {
		return findTilePosition(this.coord)
	}
	center() {
		return findTileCenter(this.coord)
	}
	contour() {
		gui.clearRect(0, 0, canvasgui.width, canvasgui.height)
		gui.beginPath();
		gui.rect(this.position().x, this.position().y, tileSize, tileSize);
		gui.stroke();
	}
	showMenu() {
		if (tileObjects[this.coord].att == 3) {
			const cost = 300 / blocked.length
			let unlbtn = document.createElement('button')
			unlbtn.setAttribute('onClick', "unlockMenu(" + this.coord + "," + cost + ")")
			unlbtn.innerText = "REMOVE $" + cost
			tmenu.appendChild(unlbtn)
			tmenu.style.visibility = "visible"
			tmenu.style.transform = "translate(" + (findTilePosition(hovering).x + 64) + "px, " + findTilePosition(hovering).y + "px)"
		}
	}
	bTile() {
		/*         ctx.fillStyle = "rgb(83, 0, 8)"
				ctx.fillRect(this.position().x, this.position().y, tileSize, tileSize); */
		ctx.drawImage(rubbleSprite, this.position().x, this.position().y, tileSize, tileSize)
	}

};
class pathtile extends tile {
	constructor(coord, attribute, state, direction) {
		super(coord, attribute, state)
		let center = findTileCenter(this.coord)
		this.center = center
		this.direction = direction
	}

}
class towertile extends tile {
	constructor(coord, towerclass) {
		super(coord, 0, 1)
		this.tower = towerConstructors(towerclass, coord)
	}
	addTower() {
		tileObjects[this.coord] = this
		myTowers.push(this.tower)
		playSFX("build", 0)
	}
}
//#endregion

async function getLevel(path) {
	const xmlhttp = new XMLHttpRequest();
	const lvfile = path;
	xmlhttp.onload = function () {
		const myObj = JSON.parse(this.responseText);
		//	  console.log(myObj);
		loadLevel(myObj)
	};
	xmlhttp.open("GET", lvfile);
	xmlhttp.send();
}

function loadLevel(lvdata) {
	const myLevel = lvdata;
	//	console.log(lvdata);
	let myStage = new stage(myLevel.lvmap, myLevel.lvpath, myLevel.lvdirection[0], myLevel.lvdirection[1], myLevel.lvwaves, myLevel.lvgold, myLevel.lvbg, myLevel.lvshort, music[myLevel.lvbgm]);
	selectedStage = myLevel.lvindex
	activeStage = myStage
	activeStage.initiate()
}


function getDirections(path, from, to) {
	let directions = [];
	directions[0] = from;
	for (let i = 1; i < path.length; i++) {
		switch (path[i]) {
			case (path[i - 1] + 1):					//right
				directions[i] = 0;
				break;
			case (path[i - 1] - 1):					//left
				directions[i] = 2;
				break
			case (path[i - 1] - gridX):				//up	
				directions[i] = 3;
				break
			case (path[i - 1] + gridX):				//down
				directions[i] = 1;
				break
			default:
				directions[i] = to;
				break;
		}
	}
	return directions
}

async function confirmImportLevel() {
	return true
}