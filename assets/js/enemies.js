class enemyunit {
	constructor(health, speed, armor, defense, resistance, size, active, reward, basedmg, shortcut) {
		switch (hardMode) {
			case false:
				this.maxhp = health;
				this.hp = health;
				break
			case true:
				let hhealth = Math.floor(health * 1.5)
				this.maxhp = hhealth;
				this.hp = hhealth;
				break
		}
		this.spd = speed;
		this.arm = armor;
		this.def = defense;
		this.res = resistance;
		this.size = size
		this.reward = reward
		this.basedmg = basedmg
		this.invulnerable = false;
		// modificador aleatório de posição
		this.positionOffsetX = getRandom(-10, 10)
		this.positionOffsetY = getRandom(-10, 10)
		this.skill = null

		let unitpath;
		if (active == true) {
			switch (shortcut) {
				case true:
					unitpath = activeStage.short;
					break;
				case false:
					unitpath = activeStage.path;
					break;
			};
			this.pathtile = unitpath[0];
			this.path = unitpath
			this.shortcut = shortcut
			this.walked = 0;
			this.pathswalked = 0;
		}
	};
	setProgress(t, w) {
		this.pathswalked = t
		this.walked = w
		this.pathtile = this.path[t];
		this.movement()
	}
	setSkill(skill) {
		this.skill = skill
	}
	movement() {
		let acc = this.spd / (2 * 50)
		if (this.effect == "slow") {
			if (this.slcount > 120) {
				acc = 0;
			}
			else {
				acc = (this.spd * 0.50) / (2 * 50)
			}
			this.slcount -= 1
			if (this.slcount <= 0) {
				this.effect = "none"
			}
		}
		this.walked += acc
		if (this.walked >= 1) {
			this.walked = 0
			this.pathswalked += 1;
			if (this.pathswalked > this.path.length) {
				return
			}
			this.pathtile = this.path[this.pathswalked];
		}
		let position = this.moveOffset()
		this.position = position

		drawSprite(position.x, position.y, this.size, this.size, this.sprite, this.effect)
	}
	getSteps() {
		switch (this.shortcut) {
			case true:
				return activeStage.shortd;
			case false:
				return activeStage.pathd;
		};
	}

	getFrom(pathtile) {
		let x = pathtile.center.x + this.positionOffsetX
		let y = pathtile.center.y + this.positionOffsetY
		let d = this.getSteps()[this.pathswalked]
		switch (d) {
			case 0:
				x -= tileSize;
				break;
			case 1:
				y -= tileSize;
				break;
			case 2:
				x += tileSize;
				break;
			case 3:
				y += tileSize;
				break;
		}
		return { x, y }
	}
	moveOffset() {
		let initial;
		let x;
		let y;
		let offset = Math.round(tileSize * this.walked)
		let d
		if (this.pathswalked >= this.path.length) {
			initial = tileObjects[this.path[this.path.length - 1]].center
			let lastmove = (activeStage.to + 2) % 4
			d = lastmove
		}
		else {
			initial = this.getFrom(tileObjects[this.pathtile])
			d = this.getSteps()[this.pathswalked]
		}
		let oldx = initial.x + this.positionOffsetX
		let oldy = initial.y + this.positionOffsetY
		switch (d) {
			case 0:
				x = oldx + offset;
				y = oldy
				break;					//to right
			case 1:
				y = oldy + offset;
				x = oldx
				break;					//down
			case 3:
				y = oldy - offset;
				x = oldx
				break;					//up
			case 2:
				x = oldx - offset;
				y = oldy
				break;					//left
			default:
				x = oldx;
				y = oldy
				break
		}
		return { x, y }
	}
	slow(seconds) {

		playSFX("slow", 0.04)
		this.effect = "slow"
		this.slcount = 50 * seconds
	}
	burn() {
		playSFX("fire", 0.03)
		if (this.arm >= 1) {
			this.arm -= 1
		}
		if (this.effect == "slow") {
			this.slcount -= 10
		}
	}
	damage(ph, sp) {
		let dmg = 0
		let p = ph - this.def - this.arm   			//dano fisico - defesa - armadura
		let s = sp - this.res						//dano elemental - resistencia
		if (p > 0) {
			dmg += p
		}											//dano fisico 
		else if ((p <= 0) && (this.arm > 0)) {
			playSFX("armor", 0)
		}											//dano fisico absorvido pela armadura
		if (s > 0) {
			dmg += s
		}											//dano elemental
		if (dmg == 0) {
			playSFX("nodamage", 0.06)
		}											//dano negado
		else {
			playSFX("damage", 0.03)
		}											//dano
		this.hp -= dmg;
	}
	kill() {
		let scorev = (this.path.length - this.pathswalked) * this.basedmg
		updateScore(scorev)
		updateGold(this.reward)
		switch (this.skill) {
			case "trojan":
				this.activateTrojan()
				break;
			case "blast":
				this.activateBlast()
				break;
			default:
				deathGrunt()
				deathAnimation(this.position)
				break;
		}
	}
}
// low hp, good spd, no armor, low def, no res
class footsoldier extends enemyunit {
	constructor() {
		super(8, 4, 0, 0, 0, 30, true, 2, 1, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/footsoldier.png"
		this.sprite = spriteSheet
	}
}
// mid hp, mid spd, low armor, low def, no res
class knight extends enemyunit {
	constructor() {
		super(15, 3, 4, 0, 0, 36, true, 3, 2, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/knight.png"
		this.sprite = spriteSheet
	}
}
// good hp, low spd, good armor, low def, no res
class heavy extends enemyunit {
	constructor() {
		super(60, 2, 20, 2, 0, 50, true, 15, 2, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/heavy.png"
		this.sprite = spriteSheet
	}
}
// low hp, high spd, no armor, low def, mid res
class scout extends enemyunit {
	constructor() {
		super(6, 6, 0, 1, 3, 20, true, 2, 1, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/scout.png"
		this.sprite = spriteSheet
	}
}
// high hp, low spd, no armor, mid def, no res
class goliath extends enemyunit {
	constructor() {
		super(130, 2, 0, 3, 0, 50, true, 20, 3, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/goliath.png"
		this.sprite = spriteSheet
	}
}
// epic hp, low spd, no armor, low def, high res
class paladin extends enemyunit {
	constructor() {
		super(200, 2, 0, 1, 5, 40, true, 30, 5, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/paladin.png"
		this.sprite = spriteSheet
	}
}
// low hp, high spd, no armor, low def, low res, shortcuts
class acrobat extends enemyunit {
	constructor() {
		super(8, 6, 0, 1, 1, 20, true, 3, 1, true);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/acrobat.png"
		this.sprite = spriteSheet
	}
}
// good hp, good spd, low armor, no def, mid res, shortcuts
class rider extends enemyunit {
	constructor() {
		super(35, 3, 6, 0, 3, 35, true, 10, 3, true);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/rider.png"
		this.sprite = spriteSheet
	}
}
// good hp, mid spd, epic armor, no def, high res
class juggernaut extends enemyunit {
	constructor() {
		super(80, 2, 50, 0, 5, 60, true, 30, 4, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/knight.png"
		this.sprite = spriteSheet
	}
}
// high hp, mid spd, no armor, no def, high res, summons small trap 
class trojan extends enemyunit {
	constructor() {
		super(150, 2, 0, 0, 5, 60, true, 30, 5, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/woodhorse.png"
		this.sprite = spriteSheet
		this.setSkill('trojan')
		this.trapwave = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 4, 0, 4, 0, 4, 0, 4]
	}
	activateTrojan() {
		const tileprog = this.pathswalked
		const partprog = this.walked
		for (let i = 0; i < this.trapwave.length; i++) {
			const tunit = this.trapwave[i];
			const delay = i * 2
			if (tunit != 0) {
				queueSummon(tunit, tileprog, partprog, delay)
			}
		}
	}
}
// epic hp, low spd, no armor, low def, high res, summons medium trap 
class transport extends enemyunit {
	constructor() {
		super(200, 1, 0, 2, 5, 60, true, 30, 5, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/br.png"
		this.sprite = spriteSheet
		this.setSkill('trojan')
		this.trapwave = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4]
	}
	activateTrojan() {
		const tileprog = this.pathswalked
		const partprog = this.walked
		let timer = 15 * tickLength
		for (let i = 0; i < this.trapwave.length; i++) {
			const tunit = this.trapwave[i];
			const delay = i * 2
			if (tunit != 0) {
				queueSummon(tunit, tileprog, partprog, delay)
			}
		}
	}
}
// good hp, mid spd, good armor, low def, no res, explosion trap
class bomber extends enemyunit {
	constructor() {
		super(60, 3, 20, 2, 0, 70, true, 15, 2, false);
		let spriteSheet = new Image()
		spriteSheet.src = "assets/img/bomb.png"
		this.sprite = spriteSheet
		this.setSkill('blast')
	}
	activateBlast() {
		let boom = this.pathtile
		drawBlast(this.position.x, this.position.y, 1)
		playSFX("boom", 0)
		const adjacent = [(boom - gridX - 1), (boom - gridX), (boom - gridX + 1), (boom - 1), (boom + 1), (boom + gridX - 1), (boom + gridX), (boom + gridX + 1)]
		//		console.log(adjacent)
		for (let i = 0; i < adjacent.length; i++) {
			const adjtile = tileObjects[adjacent[i]];
			//			console.log(adjtile);
			if (adjtile.state == 1) {
				for (let j = 0; j < myTowers.length; j++) {
					const tow = myTowers[j];
					if (tow.coord == adjacent[i]) {
						tow.disableTower()
						//					console.log("disabled", tow);
					}
				}
			}
		}
	}
}


async function confirmImportEnemies() {
	return true
}