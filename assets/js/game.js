//global variables
const tileObjects = []
const deployed = []
const myTowers = []
const blocked = []
const Tick = {
	ms: 40,
	currentSpeed: 0,
	TPS: 1000 / this.ms,
	duration() {
		return this.ms
	},
	changeSpeed() {
		const speeds = [40, 20, 10]
		const nxt = (this.currentSpeed+1) % 3
		playSFX('click', 0);
		this.ms = speeds[nxt]
		this.currentSpeed = nxt
		this.ffButton() 
	},
	ffButton () {
		const ff = document.getElementById('fast')
		const c = this.currentSpeed
		let styles = ['fastn','fastf','fastff']
		let TXT = ['>>','>>','>>>']
		ff.setAttribute('class', styles[c])

		ff.innerText = TXT[c]
	},


}


let paused = true
let wave = []
let myLives = 10
let myGold = 0
let deployingtower = false
let hovering;
let tickCount = 0
let allDeployed = false
let activeWave = false
let deployCount = 0
let deployCooldown = 0
let waveCount = 0
let selectedStage;
let hardMode = false;
let orderCooldown = 0;
let enableTouch = false;
function getRandom(min, max) {
	let randomfloat = Math.random() * (max - min) + min;
	let randomint = Math.round(randomfloat);
	return randomint;
}
let score = 0

let rubbleSprite;



//#region GAME UPDATE

//game update logic
function gameLoop() {
	let td = 0
	if (!paused) {
		const t1 = new Date()
		updateStage()
		if (activeWave == true) {
			updateEnemies()
			targetEnemies()
		}
		const t2 = new Date()
		td = t2 - t1
		if (td > 10) {
			console.log(td);
		}
	}
	setTimeout(gameLoop, (Tick.duration()-td))
}
function updateStage() {
//	ctx.clearRect(0, 0, canvas.width, canvas.height)
	render()
	gui.clearRect(0, 0, canvas.width, canvas.height)
	let h;
// draw towers
	for (let i = 0; i < myTowers.length; i++) {
		const to = myTowers[i];
		to.draw()
	}
// draw blocked tiles
	if (blocked.length > 0) {
		for (let i = 0; i < blocked.length; i++) {
			const bl = tileObjects[blocked[i]];
			bl.bTile()
		}
	}
// handle cursor
	if ((hovering >= 0) && (hovering < gridSize)) {
		h = tileObjects[hovering]
	// cursor on tower
		if (h.tower != undefined) {
			h.tower.circlerange()
			gamebox.addEventListener('click', towerMenu)
		}
		else {
			gamebox.removeEventListener('click', towerMenu)
		}
	// cursor on unlockable
		if ((h.att == 3)) {
			h.contour()
			gamebox.addEventListener("click", unlockPlot)
		}
		else {
			gamebox.removeEventListener("click", unlockPlot)
		}
	}
// cleared all enemies
	if ((allDeployed == true) && (activeWave == true) && (deployed.length == 0) && (summonQueue.length == 0)) {
		waveCount++
		activeWave = false
	// clear towers cooldown
		for (let i = 0; i < myTowers.length; i++) {
			const objt = myTowers[i];
			objt.resetCooldown()
		}
		//		let st = new state()
		//		console.log(st.getState())
	// allow next or end if last wave
		fadeInMusic()
		document.getElementById('next').setAttribute('class', 'nexta')
		if (waveCount == activeStage.waves.length) {
			gameOver(myLives)
		}
	}
	let next = deployCount
// enemy deployment
	if (next >= wave.length) {
		allDeployed = true
	}
	else if (allDeployed == false) {
		deployCooldown--
		let nextdeploy = wave[next]
		if (deployCooldown == 0) {
			deploy(nextdeploy)
			deployCooldown = 15
			deployCount++
		}
	}
//tick clock
	tickCount++
}

function updateEnemies() {
	if (summonQueue.length > 0) {
		let nextSummon = summonQueue[0]
		if (tickCount >= nextSummon.when) {
			summon(nextSummon.type, nextSummon.ptile, nextSummon.pwalk)
			summonQueue.splice(0, 1)
		}
	}
	if (orderCooldown <= 0) {
		deployed.sort(function (a, b) { return b.pathswalked - a.pathswalked })
		orderCooldown = 10
	}
	else {
		orderCooldown--
	}
	for (let i = 0; i < deployed.length; i++) {
		deployed[i].movement()
		if (deployed[i].pathswalked > deployed[i].path.length) {
			updateLives(deployed[i].basedmg)
			deployed.splice(i, 1)
		}
	}
}
function targetEnemies() {
	for (let i = 0; i < myTowers.length; i++) {
		myTowers[i].target()
	}
}
function updateGold(num) {
	let goldel = document.getElementById('gold');
	myGold += num
	goldel.innerHTML = "$" + myGold.toString()
	updateStore()
}
function updateLives(num) {
	let lifeel = document.getElementById('lives');
	myLives -= num
	if (myLives < 1) {
		gameOver(0)
	}
	lifeel.innerHTML = "LIVES: " + myLives.toString()
}
function updateStore() {
	const types = [
		{ box: document.getElementById('arrow').firstElementChild, cost: towerStats["shooter"].price[0], type: "shooter" },
		{ box: document.getElementById('ice').firstElementChild, cost: towerStats["freezer"].price[0], type: "freezer" },
		{ box: document.getElementById('fire').firstElementChild, cost: towerStats["scorcher"].price[0], type: "scorcher" },
		{ box: document.getElementById('super').firstElementChild, cost: towerStats["shredder"].price[0], type: "shredder" }
	]
	for (let i = 0; i < types.length; i++) {
		const element = types[i].box;
		const cost = types[i].cost;
		const type = types[i].type;
		if (placingTower == type) {
			element.setAttribute('class', 'selected');
		}
		switch (canAfford(cost)) {
			case true:
				if (placingTower != type) {
					element.setAttribute('class', 'tower');
				}
				break;
			case false:
				element.setAttribute('class', 'towerun');
				break;
		};
	}

}
function canAfford(price) {
	if (myGold >= price) {
		return true
	}
	else {
		return false
	}
}
function updateScore (plus) {
	score += plus 
//	console.log(score);
}
function startNext() {
	if (activeWave == false) {
		if (myTowers.length == 0) {
			alert("Selecione uma torre abaixo e a posicione antes de iniciar a rodada.")
			return;
		}
		if (SFXenabled == true) {
		music.horn.play()
		}
		fadeOutMusic()
		deployCooldown = 15
		deployCount = 0
		allDeployed = false
		activeWave = true
		activeStage.createWave()
		let waveel = document.getElementById('wave');
		document.getElementById('next').setAttribute('class', 'nextb')
		waveel.innerHTML = "WAVE: " + (waveCount + 1).toString() + " / " + activeStage.waves.length.toString()
	}
}

//#endregion

//#region WAVE DEPLOY
//enemy unit deploying
function enemyConstructors(type) {
	switch (type) {
		case 1:
			return new footsoldier();
		case 2:
			return new knight();
		case 3:
			return new heavy();
		case 4:
			return new scout();
		case 5:
			return new goliath();
		case 6:
			return new paladin();
		case 7:
			return new acrobat();
		case 8:
			return new rider();
		case 9:
			return new juggernaut();
		case 10:
			return new trojan();
		case 11:
			return new transport();
		case 12:
			return new bomber();
		case 0:
			return;
		default:
			return;
	}
}
function deploy(type) {
	if (type != 0) {
		const unit = enemyConstructors(type)
		deployed.push(unit)
		//		console.log("enemy ", unit);
	}
}
function summon(type, progress, partial) {
	if (type != 0) {
		const unit = enemyConstructors(type)
		unit.setProgress(progress, partial)
		deployed.push(unit)
		//		console.log("enemy ", unit);
	}
}
let summonQueue = [];
function queueSummon(type, progress, partial, delay) {
	let cue = (tickCount + delay)
	const qItem = {
		"type": type,
		"ptile": progress,
		"pwalk": partial,
		"when": cue
	}
	summonQueue.push(qItem)
}
//#endregion

//#region GAME INTERACTIONS
//tower placing, upgrading, and selling
let placingTower = ""
function shootTower() {
	deployingtower = true
	placingTower = "shooter"
	playSFX('click', 0);
	updateStore()
	gamebox.addEventListener('click', newTower)
	gamebox.addEventListener('mousemove', highlight)
}
function iceTower() {
	deployingtower = true
	placingTower = "freezer"
	playSFX('click', 0);
	updateStore()
	gamebox.addEventListener('click', newTower)
	gamebox.addEventListener('mousemove', highlight)
}
function flameTower() {
	deployingtower = true
	placingTower = "scorcher"
	playSFX('click', 0);
	updateStore()
	gamebox.addEventListener('click', newTower)
	gamebox.addEventListener('mousemove', highlight)
}
function superTower() {
	deployingtower = true
	placingTower = "shredder"
	playSFX('click', 0);
	updateStore()
	gamebox.addEventListener('click', newTower)
	gamebox.addEventListener('mousemove', highlight)
}
function verifyPurchase(type, level) {
	let price = 0
	price += towerStats[type].price[level]
	if (canAfford(price) == true) {
		updateGold((price * (-1)))
		return true
	}
	else {
		return false
	}
}
function newTower() {

	let ti = tileObjects[hovering]
	
	if (ti.att == 0 && ti.state == 0) {
		createTower(placingTower, hovering)
	}
	gamebox.removeEventListener("click", newTower)
	gamebox.removeEventListener("mousemove", highlight)
	gui.clearRect(0, 0, canvasgui.width, canvasgui.height)
	deployingtower = false
	placingTower = ""
}
function highlight() {
	if (hovering >= 0 && hovering < tileObjects.length) {
		let ti = tileObjects[hovering]
		if (ti.att == 0 && ti.state == 0) {
			ti.contour()
		}
		else {
			gui.clearRect(0, 0, canvasgui.width, canvasgui.height)
		}
	}
}
function createTower(tclass, coord) {
	if (verifyPurchase(tclass, 0) == true) {
		let t = new towertile(coord, tclass)
		t.addTower()
	}
}
function towerConstructors(type, coord) {
	switch (type) {
		case "shooter":
			return new shooter(coord);
		case "freezer":
			return new freezer(coord);
		case "scorcher":
			return new scorcher(coord);
		case "shredder":
			return new shredder(coord);
		case 0:
			return;
		default:
			return;
	}
}
function towerMenu() {
	const coord = hovering
	closeMenu()
	gamebox.removeEventListener('click', towerMenu)
	for (let i = 0; i < myTowers.length; i++) {
		if (myTowers[i].coord == coord) {
			myTowers[i].showMenu()
		}
	}
	tmenu.addEventListener("mouseleave", closeMenu)
}
function closeMenu() {
	tmenu.style.visibility = "hidden"
	tmenu.replaceChildren()
	tmenu.removeEventListener("mouseleave", closeMenu)
}
function upgradeMenu(coord) {
	for (let i = 0; i < myTowers.length; i++) {
		if (myTowers[i].coord == coord) {
			myTowers[i].levelUp()
		}
	}
}
function sellMenu(coord) {
	for (let i = 0; i < myTowers.length; i++) {
		if (myTowers[i].coord == coord) {
			myTowers[i].sell()
			myTowers.splice(i, 1)
		}
	}
}
function unlockPlot() {

	const coord = hovering
	closeMenu()
	gamebox.removeEventListener('click', unlockPlot)
	gamebox.removeEventListener('click', towerMenu)

	tileObjects[coord].showMenu()
	tmenu.addEventListener("mouseleave", closeMenu)
}
function unlockMenu(coord, price) {
	closeMenu()
	if (canAfford(price) == true) {
		updateGold((price * (-1)))
		playSFX("demolish", 0)
		tileObjects[coord] = new tile(coord, 0, 0)
		for (let i = 0; i < blocked.length; i++) {
			if (blocked[i] == coord) {
				blocked.splice(i, 1)
			}
		}
	}

}
//#endregion


//#region MENUS AND STARTUP 
//stageselect
let activeStage;
let bgm;
function startlv1() {
	startLvl()
	getLevel("assets/levels/lv1.json")
	//	activeStage.initiate()
}
function startlv2() {
	startLvl()
	getLevel("assets/levels/lv2.json")
	//	activeStage.initiate()
}
function startlv3() {
	startLvl()
	getLevel("assets/levels/lv3.json")
	//	activeStage.initiate()
}
function startlv4() {
	startLvl()
	getLevel("assets/levels/lv4.json")
	//	activeStage.initiate()
}
function startlv5() {
	startLvl()
	getLevel("assets/levels/lv5.json")
	//	activeStage.initiate()
}
function startlv6() {
	startLvl()
	getLevel("assets/levels/lv6.json")
	//	activeStage.initiate()
}
function startlv1h() {
	startLvl()
	getLevel("assets/levels/lv1h.json")
	//	activeStage.initiate()
}
function startlv2h() {
	startLvl()
	getLevel("assets/levels/lv2h.json")
	//	activeStage.initiate()
}
function startlv3h() {
	startLvl()
	getLevel("assets/levels/lv3h.json")
	//	activeStage.initiate()
}
function startlv4h() {
	startLvl()
	getLevel("assets/levels/lv4h.json")
	//	activeStage.initiate()
}
function startlv5h() {
	startLvl()
	getLevel("assets/levels/lv5h.json")
	//	activeStage.initiate()
}
function startlv6h() {
	startLvl()
	getLevel("assets/levels/lv6h.json")
	//	activeStage.initiate()
}
function startLvl() {
	mainUI()
	const lvs = document.getElementById('levelselect');
	lvs.style.display = "none"
	const btn = document.getElementById('btn')
	btn.style.display = "flex"
	stopLevelSelectMenu()
}


const lvl1rate = localStorage.getItem('stars1')
const lvl2rate = localStorage.getItem('stars2')
const lvl3rate = localStorage.getItem('stars3')
const lvl4rate = localStorage.getItem('stars4')
const lvl5rate = localStorage.getItem('stars5')
const lvl6rate = localStorage.getItem('stars6')
const lvl1hrate = localStorage.getItem('stars1h')
const lvl2hrate = localStorage.getItem('stars2h')
const lvl3hrate = localStorage.getItem('stars3h')
const lvl4hrate = localStorage.getItem('stars4h')
const lvl5hrate = localStorage.getItem('stars5h')
const lvl6hrate = localStorage.getItem('stars6h')
const lvl1high = localStorage.getItem('high1')
const lvl2high = localStorage.getItem('high2')
const lvl3high = localStorage.getItem('high3')
const lvl4high = localStorage.getItem('high4')
const lvl5high = localStorage.getItem('high5')
const lvl6high = localStorage.getItem('high6')
const lvl1hhigh = localStorage.getItem('high1h')
const lvl2hhigh = localStorage.getItem('high2h')
const lvl3hhigh = localStorage.getItem('high3h')
const lvl4hhigh = localStorage.getItem('high4h')
const lvl5hhigh = localStorage.getItem('high5h')
const lvl6hhigh = localStorage.getItem('high6h')

function mainMenu() {
	//menu
	document.getElementById('sfx').addEventListener('click', disableSFX);
	document.getElementById('music').addEventListener('click', disableBGM);
	document.getElementById('clear').addEventListener('click', eraseProgress);
	document.getElementById('exit').addEventListener('click', restart);
	const l1txt = document.getElementById('lvl1').firstChild;
	const l2txt = document.getElementById('lvl2').firstChild;
	const l3txt = document.getElementById('lvl3').firstChild;
	const l4txt = document.getElementById('lvl4').firstChild;
	const l5txt = document.getElementById('lvl5').firstChild;
	const l6txt = document.getElementById('lvl6').firstChild;
	const l1htxt = document.getElementById('lvl1h').firstChild;
	const l2htxt = document.getElementById('lvl2h').firstChild;
	const l3htxt = document.getElementById('lvl3h').firstChild;
	const l4htxt = document.getElementById('lvl4h').firstChild;
	const l5htxt = document.getElementById('lvl5h').firstChild;
	const l6htxt = document.getElementById('lvl6h').firstChild;
	l1txt.innerHTML = (showRate(1, lvl1rate))
	l2txt.innerHTML = (showRate(2, lvl2rate))
	l3txt.innerHTML = (showRate(3, lvl3rate))
	l4txt.innerHTML = (showRate(4, lvl4rate))
	l5txt.innerHTML = (showRate(5, lvl5rate))
	l6txt.innerHTML = (showRate(6, lvl6rate))
	l1htxt.innerHTML = (showRate(1, lvl1hrate))
	l2htxt.innerHTML = (showRate(2, lvl2hrate))
	l3htxt.innerHTML = (showRate(3, lvl3hrate))
	l4htxt.innerHTML = (showRate(4, lvl4hrate))
	l5htxt.innerHTML = (showRate(5, lvl5hrate))
	l6htxt.innerHTML = (showRate(6, lvl6hrate))
	selectHard()
	zoom();
	displayHighScore()
	startLevelSelectMenu()

}

function startLevelSelectMenu() {
	document.getElementById('lvl1').addEventListener('click', startlv1);
	document.getElementById('lvl2').addEventListener('click', startlv2);
	document.getElementById('lvl3').addEventListener('click', startlv3);
	document.getElementById('lvl4').addEventListener('click', startlv4);
	document.getElementById('lvl5').addEventListener('click', startlv5);
	document.getElementById('lvl6').addEventListener('click', startlv6);
	document.getElementById('lvl1h').addEventListener('click', startlv1h);
	document.getElementById('lvl2h').addEventListener('click', startlv2h);
	document.getElementById('lvl3h').addEventListener('click', startlv3h);
	document.getElementById('lvl4h').addEventListener('click', startlv4h);
	document.getElementById('lvl5h').addEventListener('click', startlv5h);
	document.getElementById('lvl6h').addEventListener('click', startlv6h);
	document.getElementById('selectpage').addEventListener('click', levelPage)
};

function stopLevelSelectMenu() {
	document.getElementById('lvl1').removeEventListener('click', startlv1);
	document.getElementById('lvl2').removeEventListener('click', startlv2);
	document.getElementById('lvl3').removeEventListener('click', startlv3);
	document.getElementById('lvl4').removeEventListener('click', startlv4);
	document.getElementById('lvl5').removeEventListener('click', startlv5);
	document.getElementById('lvl6').removeEventListener('click', startlv6);
	document.getElementById('lvl1h').removeEventListener('click', startlv1h);
	document.getElementById('lvl2h').removeEventListener('click', startlv2h);
	document.getElementById('lvl3h').removeEventListener('click', startlv3h);
	document.getElementById('lvl4h').removeEventListener('click', startlv4h);
	document.getElementById('lvl5h').removeEventListener('click', startlv5h);
	document.getElementById('lvl6h').removeEventListener('click', startlv6h);
	document.getElementById('selectpage').removeEventListener('click', levelPage)
};

let levelMenuPage = 1
function levelPage() {
	if (levelMenuPage == 1) {
		document.getElementById('levelpagecontainer').style.alignContent = "flex-end"
		document.getElementById('levelpagecontainer').style.animationName = "toLeft"
		levelMenuPage = 2;
		document.getElementById('selectpage').firstChild.style.backgroundColor = "rgb(67, 82, 0)"
		document.getElementById('selectpage').firstChild.innerText = "< NORMAL"
	}
	else if (levelMenuPage == 2) {
		document.getElementById('levelpagecontainer').style.alignContent = "flex-start"
		document.getElementById('levelpagecontainer').style.animationName = "toRight"
		levelMenuPage = 1;
		document.getElementById('selectpage').firstChild.style.backgroundColor = "red"
		document.getElementById('selectpage').firstChild.innerText = "HARD >"
	}
}


function selectHard() {
	const rates = [lvl1rate, lvl2rate, lvl3rate, lvl4rate, lvl5rate, lvl6rate]
	const l1hb = document.getElementById('lvl1h');
	const l2hb = document.getElementById('lvl2h');
	const l3hb = document.getElementById('lvl3h');
	const l4hb = document.getElementById('lvl4h');
	const l5hb = document.getElementById('lvl5h');
	const l6hb = document.getElementById('lvl6h');
	let unl = false
	const buttons = [l1hb, l2hb, l3hb, l4hb, l5hb, l6hb]
	for (let i = 0; i < rates.length; i++) {
		if (rates[i] == 3) {
			buttons[i].style.visibility = "visible"
			unl = true
		}
	}
	if (unl) {
		document.getElementById('selectpage').style.visibility = "visible"
	}
}
function displayHighScore () {
	const scores = [lvl1high, lvl2high, lvl3high, lvl4high, lvl5high, lvl6high, lvl1hhigh, lvl2hhigh, lvl3hhigh, lvl4hhigh, lvl5hhigh, lvl6hhigh]
	const l1hstxt = document.getElementById('lv1hs');
	const l2hstxt = document.getElementById('lv2hs');
	const l3hstxt = document.getElementById('lv3hs');
	const l4hstxt = document.getElementById('lv4hs');
	const l5hstxt = document.getElementById('lv5hs');
	const l6hstxt = document.getElementById('lv6hs');
	const l1hhstxt = document.getElementById('lv1hhs');
	const l2hhstxt = document.getElementById('lv2hhs');
	const l3hhstxt = document.getElementById('lv3hhs');
	const l4hhstxt = document.getElementById('lv4hhs');
	const l5hhstxt = document.getElementById('lv5hhs');
	const l6hhstxt = document.getElementById('lv6hhs');
	const besttx = [l1hstxt, l2hstxt, l3hstxt, l4hstxt, l5hstxt, l6hstxt, l1hhstxt, l2hhstxt, l3hhstxt, l4hhstxt, l5hhstxt, l6hhstxt]
	for (let i = 0; i < scores.length; i++) {
		const lhsc = scores[i]
		if (lhsc > 0) {
			besttx[i].style.display = "flex"
			besttx[i].innerText = "BEST:" + lhsc
		}
	}
}
function gameOver(lives) {
	let st = selectedStage
	let currentrate
	let highscore
	let rateid;
	let scoreid
	updateScore(myGold) 
	let endmsg = ""
	let hsmsg =""
	switch (st) {
		case 1:
			currentrate = lvl1rate
			highscore = lvl1high
			rateid = 'stars1'
			scoreid = 'high1'
			break;
		case 2:
			currentrate = lvl2rate
			highscore = lvl2high
			rateid = 'stars2'
			scoreid = 'high2'
			break;
		case 3:
			currentrate = lvl3rate
			highscore = lvl3high
			rateid = 'stars3'
			scoreid = 'high3'
			break;
		case 4:
			currentrate = lvl1hrate
			highscore = lvl1hhigh
			rateid = 'stars1h'
			scoreid = 'high1h'
			break;
		case 5:
			currentrate = lvl2hrate
			highscore = lvl2hhigh
			rateid = 'stars2h'
			scoreid = 'high2h'
			break;
		case 6:
			currentrate = lvl3hrate
			highscore = lvl3hhigh
			rateid = 'stars3h'
			scoreid = 'high3h'
			break;
		case 7:
			currentrate = lvl4rate
			highscore = lvl4high
			rateid = 'stars4'
			scoreid = 'high4'
			break;
		case 8:
			currentrate = lvl5rate
			highscore = lvl5high
			rateid = 'stars5'
			scoreid = 'high5'
			break;
		case 9:
			currentrate = lvl6rate
			highscore = lvl6high
			rateid = 'stars6'
			scoreid = 'high6'
			break;
		case 10:
			currentrate = lvl4hrate
			highscore = lvl4hhigh
			rateid = 'stars4h'
			scoreid = 'high4h'
			break;
		case 11:
			currentrate = lvl5hrate
			highscore = lvl5hhigh
			rateid = 'stars5h'
			scoreid = 'high5h'
			break;
		case 12:
			currentrate = lvl6hrate
			highscore = lvl6hhigh
			rateid = 'stars6h'
			scoreid = 'high6h'
			break;

		default:
			break;
	}
	let rt;
	if (highscore == null) {
		highscore = 0
	}

	switch (lives) {
		case 10:
		case 9:
			rt = 3
			score = score * 2 * 10
			endmsg += '★★★'
			hsmsg += "<br>" + score + "<p class=\"endhigh\">BEST: " + highscore + "</p>"
			break;
		case 8:
		case 7:
		case 6:
			rt = 2
			score = score * 1.5 * 10
			endmsg += '★★☆'
			hsmsg += "<br>" + score + "<p class=\"endhigh\">BEST: " + highscore + "</p>"
			break;
		case 0:
			rt = 0
			score = 0
			endmsg += 'YOU LOSE'
			break;
		default:
			rt = 1
			score = score * 10
			endmsg += '★☆☆'
			hsmsg += "<br>" + score + "<p class=\"endhigh\">BEST: " + highscore + "</p>"
			break;
	}
	if (currentrate < rt) {
		localStorage.setItem(rateid, rt)
	}
	if (highscore < score) {
		//		alert('HIGH SCORE')
				hsmsg = "<br><p class=\"endhigh\">" + score + "<br>HIGH SCORE!</p>"
				localStorage.setItem(scoreid, score)
			}
	endmsg += hsmsg
	endmenu(endmsg)
//	document.getElementById('back').addEventListener('click', function () {
//		window.location.reload()
//	})
}
function showRate(stage, rate) {
	let text = ""
	switch (stage) {
		case 1:
			text += "Level 1 "
			break;
		case 2:
			text += "Level 2 "
			break;
		case 3:
			text += "Level 3 "
			break;
		case 4:
			text += "Level 4 "
			break;
		case 5:
			text += "Level 5 "
			break;
		case 6:
			text += "Level 6 "
			break;
		default:
			break;
	}
	switch (rate) {
		case "1":
			text += "★☆☆"
			break;
		case "2":
			text += "★★☆"
			break;
		case "3":
			text += "★★★"
			break;
		default:
			text += "☆☆☆"
			break;
	}
	return text
}
async function endmenu(message) {
	paused = true;
	const conf = await popUp(message, "alert")
	window.location.reload()
//	document.getElementById('overlay').style.display = "block";
//	document.getElementById('endmenu').style.display = "flex";
//	document.getElementById('message').innerHTML = message;
}

let helpOpen = false;
let helpButton = document.getElementById('openhelp')
let helpBox = document.getElementById('help')
helpButton.addEventListener("click", helpScreen)

function helpScreen() {
	if (setupOpen) {
		setupScreen()
	}
	switch (helpOpen) {
		case false:
			helpBox.style.visibility = "visible";
			helpBox.addEventListener("click", helpScreen);
			helpButton.setAttribute('class', 'helpclose');
			helpOpen = true;
			break;
		case true:
			helpBox.style.visibility = "hidden";
			helpBox.removeEventListener("click", helpScreen);
			helpButton.removeAttribute('class');
			helpOpen = false;
			break;
	}
}

let setupOpen = false;
let setupButton = document.getElementById('openoptions')
let setupBox = document.getElementById('settings')
setupButton.addEventListener("click", setupScreen)
screen.orientation.addEventListener("change", () => {
	zoom()
});
document.body.addEventListener('resize', zoom);
window.addEventListener('resize', zoom);

function mainUI() {
	//towers
	document.getElementById('arrow').addEventListener('click', shootTower);
	document.getElementById('ice').addEventListener('click', iceTower);
	document.getElementById('fire').addEventListener('click', flameTower);
	document.getElementById('super').addEventListener('click', superTower);
	//controls
	document.getElementById('fast').addEventListener('click', fastForward);
	document.getElementById('next').addEventListener('click', startNext);
	paused = false
}
function fastForward () {
	Tick.changeSpeed()
}

function setupScreen() {
	if (helpOpen) {
		helpScreen()
	}
	switch (setupOpen) {
		case false:
			setupBox.style.visibility = "visible";
			setupButton.setAttribute('class', 'setupclose');
			setupOpen = true;
			break;
		case true:
			setupBox.style.visibility = "hidden";
			setupButton.removeAttribute('class');
			setupOpen = false;
			break;
	}
}

let SFXenabled = true;
let BGMenabled = true;

function disableSFX() {
	switch (SFXenabled) {
		case false:
			document.getElementById("sfx").setAttribute('class', 'enabled');
			document.getElementById("sfx").innerHTML = "SOUND ON";
			SFXenabled = true;
			break;
		case true:
			document.getElementById("sfx").setAttribute('class', 'disabled');
			document.getElementById("sfx").innerHTML = "SOUND OFF";
			SFXenabled = false;
			break;
	}
}
function disableBGM() {
	switch (BGMenabled) {
		case false:
			document.getElementById("music").setAttribute('class', 'enabled');
			document.getElementById("music").innerHTML = "MUSIC ON";
			BGMenabled = true;
			if (bgm) {
				bgm.play()
			}
			break;
		case true:
			document.getElementById("music").setAttribute('class', 'disabled');
			document.getElementById("music").innerHTML = "MUSIC OFF";
			BGMenabled = false;
			if (bgm) {
				bgm.pause()
			}
			break;
	}
}
async function eraseProgress() {
//	const conf = window.confirm("DELETE ALL PROGRESS? \n Atenção: Isso apagará todo o progresso salvo.")
	const conf = await popUp("DELETE ALL PROGRESS?", "selection")
	if (conf) {
		localStorage.clear()
//		alert("Erased")
		window.location.reload()
	}
}
function restart() {
	const conf = window.confirm("QUIT GAME?")
	if (conf) {
		window.location.reload()
	}
}

function zoom() {
	let vw = document.documentElement.clientWidth
	let vh = document.documentElement.clientHeight
	let zoomlevel
	let ds
	let cs
	//	console.log(vw, vh);
	if (vw < vh) {
//		console.log('portrait');

		ds = 640;
		cs = vw
		zoomlevel = cs / ds;
	}
	else {
//		console.log('landscape');
		ds = vh
		cs = 610
		zoomlevel = ds / cs;
	}
//	console.log(zoomlevel);
	document.body.style.MozTransform = 'scale(' + zoomlevel + ')';
	document.body.style.WebkitTransform = 'scale(' + zoomlevel + ')';
}

document.addEventListener('keydown', function (e) {
	switch (e.code) {
		case "KeyR":
			unlockHard()
			break;
		case "Escape":
			setupScreen()
			break;
		default:
			break;
	}
})
document.getElementById('version').addEventListener('click', unlockHard, { once: true })
document.addEventListener('dragstart', function (e) {
	//	console.log("drag");
	e.preventDefault()
})

function unlockHard() {
	localStorage.setItem('stars1', 3)
	localStorage.setItem('stars2', 3)
	localStorage.setItem('stars3', 3)
	localStorage.setItem('stars4', 3)
	localStorage.setItem('stars5', 3)
	localStorage.setItem('stars6', 3)
	window.location.reload()
}
//#endregion

/* function testresume () {
	let stateTest = new state({
		"tiles":[
			{"att":0,"state":0,"coord":0},{"att":0,"state":0,"coord":1},
			{"att":0,"state":0,"coord":2},{"att":0,"state":0,"coord":3},
			{"att":0,"state":0,"coord":4},{"att":0,"state":0,"coord":5},
			{"att":0,"state":0,"coord":6},{"att":0,"state":0,"coord":7},
			{"att":0,"state":0,"coord":8},{"att":0,"state":0,"coord":9},
			{"att":0,"state":0,"coord":10},{"att":0,"state":0,"coord":11},
			{"att":0,"state":0,"coord":12},{"att":0,"state":0,"coord":13},
			{"att":0,"state":0,"coord":14},{"att":0,"state":0,"coord":15},
			{"att":0,"state":0,"coord":16},{"att":0,"state":0,"coord":17},
			{"att":0,"state":0,"coord":18},{"att":0,"state":0,"coord":19},
			{"att":0,"state":0,"coord":20},{"att":0,"state":0,"coord":21},
			{"att":0,"state":0,"coord":22},{"att":0,"state":0,"coord":23},
			{"att":1,"state":0,"coord":24,"center":{"x":288,"y":160},"direction":3},
			{"att":1,"state":0,"coord":25,"center":{"x":352,"y":160},"direction":0},
			{"att":1,"state":0,"coord":26,"center":{"x":416,"y":160},"direction":0},
			{"att":0,"state":0,"coord":27},{"att":0,"state":0,"coord":28},{"att":0,"state":0,"coord":29},
			{"att":0,"state":0,"coord":30},{"att":0,"state":0,"coord":31},{"att":0,"state":0,"coord":32},
			{"att":0,"state":1,"coord":33,"tower":{"coord":33,"range":1.5,"rate":1,"physical":0,"special":4,"position":{"x":192,"y":192},"cooldown":50,"facing":5,"level":0,"sprite":{},"effect":"slow2","projectile":{"image":{},"width":40}}},
			{"att":1,"state":0,"coord":34,"center":{"x":288,"y":224},"direction":3},
			{"att":0,"state":0,"coord":35},{"att":1,"state":0,"coord":36,"center":{"x":416,"y":224},"direction":1},{"att":0,"state":0,"coord":37},{"att":0,"state":0,"coord":38},{"att":0,"state":0,"coord":39},{"att":0,"state":0,"coord":40},{"att":0,"state":0,"coord":41},{"att":1,"state":0,"coord":42,"center":{"x":160,"y":288},"direction":3},{"att":1,"state":0,"coord":43,"center":{"x":224,"y":288},"direction":0},{"att":1,"state":0,"coord":44,"center":{"x":288,"y":288},"direction":0},{"att":0,"state":0,"coord":45},{"att":1,"state":0,"coord":46,"center":{"x":416,"y":288},"direction":1},{"att":0,"state":0,"coord":47},{"att":0,"state":0,"coord":48},{"att":0,"state":0,"coord":49},{"att":0,"state":0,"coord":50},{"att":0,"state":0,"coord":51},{"att":1,"state":0,"coord":52,"center":{"x":160,"y":352},"direction":3},{"att":0,"state":0,"coord":53},{"att":0,"state":0,"coord":54},{"att":0,"state":0,"coord":55},{"att":1,"state":0,"coord":56,"center":{"x":416,"y":352},"direction":1},{"att":0,"state":0,"coord":57},{"att":1,"state":0,"coord":58,"center":{"x":544,"y":352},"direction":3},{"att":1,"state":0,"coord":59,"center":{"x":608,"y":352},"direction":0},{"att":1,"state":0,"coord":60,"center":{"x":32,"y":416},"direction":0},{"att":1,"state":0,"coord":61,"center":{"x":96,"y":416},"direction":0},{"att":1,"state":0,"coord":62,"center":{"x":160,"y":416},"direction":0},{"att":0,"state":0,"coord":63},{"att":0,"state":0,"coord":64},{"att":0,"state":0,"coord":65},{"att":1,"state":0,"coord":66,"center":{"x":416,"y":416},"direction":1},{"att":0,"state":0,"coord":67},{"att":1,"state":0,"coord":68,"center":{"x":544,"y":416},"direction":3},{"att":0,"state":0,"coord":69},{"att":0,"state":0,"coord":70},{"att":0,"state":0,"coord":71},{"att":0,"state":0,"coord":72},{"att":0,"state":0,"coord":73},{"att":0,"state":0,"coord":74},{"att":0,"state":0,"coord":75},{"att":1,"state":0,"coord":76,"center":{"x":416,"y":480},"direction":1},{"att":1,"state":0,"coord":77,"center":{"x":480,"y":480},"direction":0},{"att":1,"state":0,"coord":78,"center":{"x":544,"y":480},"direction":0},{"att":0,"state":0,"coord":79},{"att":0,"state":0,"coord":80},{"att":0,"state":0,"coord":81},{"att":0,"state":0,"coord":82},{"att":0,"state":0,"coord":83},{"att":0,"state":0,"coord":84},{"att":0,"state":0,"coord":85},{"att":0,"state":0,"coord":86},{"att":0,"state":0,"coord":87},{"att":0,"state":0,"coord":88},{"att":0,"state":0,"coord":89}
		],
		"towers":[{"coord":33,"range":1.5,"rate":1,"physical":0,"special":4,"position":{"x":192,"y":192},"cooldown":50,"facing":5,"level":0,"sprite":{},"effect":"slow2","projectile":{"image":{},"width":40}}],
		"initialStage":{"tiles":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,1,0,0,0,1,0,1,1,1,1,1,0,0,0,1,0,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0],"path":[60,61,62,52,42,43,44,34,24,25,26,36,46,56,66,76,77,78,68,58,59],"waves":[[1,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0,0,1],[1,0,1,0,2,0,1,0,1,0,1,0],[1,0,1,0,2,2,1,0,1,0,2],[2,1,1,0,2,2,1,1,1,0,2,0,0,0,1,1,1],[2,1,1,0,2,2,1,1,1,0,2,0,0,0,1,1,1,2,1,1,0,2,2,1,1,1,0,2,0,0,0,1,1,1],[2,1,1,0,2,2,1,1,1,0,2,0,0,0,1,1,1,2,1,1,0,2,2,1,1,1,0,2,0,2,0,1,1,1],[2,2,2,2,2,2,1,1,1,0,2,0,0,0,1,1,1,2,1,1,0,2,2,1,1,1,0,2,2,2,2,1,1,1,2,2,2,1,1,1],[2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,2,2,1,1,1,2,2,2],[3,0,0,0,1,0,1,0,1,0,1,0],[3,0,3,0,0,0,2,0,2,0,2,0],[2,2,2,2,0,0,0,4,4,4,4,4,0,4,4,4,4,0,0,2,2,2,2,0,0,0,4,4,4,4,4,0,4,4,4,4,0,0],[2,2,2,2,1,1,1,1,2,2,0,0,0,4,4,4,4,2,2,2,2,1,1,1,1,2,2,0,0,0,4,4,4,4],[3,0,0,3,0,0,3,0,0,3,0,0,0,0,4,4,4,2,0,2,0,2,0,4,4,4,4],[3,0,0,0,3,0,0,0,0,3,0,0,3,0,0,0,3,0,0,3,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,4,4,4,4,4,4,4,4],[5,0,0,0,5,0,0,0,5,5,0,0,0,5,0,0,0,5],[5,0,3,0,5,0,3,0,0,3,0,5,0,3,0,5],[5,0,3,0,5,0,3,0,5,0,3,0,5,0,3,0,5,3,0,0,0,3,0,0,0,0,3,0,0,3,0,0,0,3,0,0,3,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,4,4,4,4,4,4,4,4],[5,0,5,0,5,0,5,0,5,5,0,5,0,5,0,5,0,5,5,0,0,0,3,0,0,0,0,3,0,0,3,0,0,0,3,0,0,3,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,4,4,4,4,4,4,4,4],[6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6],[6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6]],"len":21,"from":0,"to":2,"bg":"url(assets/img/lvl1bg.png)","gold":15,"short":[],"pathd":[0,0,0,3,3,0,0,3,3,0,0,1,1,1,1,1,0,0,3,3,0],"shortd":[0],"bgm":{}},
		"gold":7,
		"lives":10,
		"cleared":1,
		"bgm":{},
		"time":358,
		"stageId":1,
		"difficultyModifier":false
	});
	stateTest.loadState()
} */

async function confirmImportGame() {
	return true
}
