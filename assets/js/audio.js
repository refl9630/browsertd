//#region SOUND

const SFX = {
	click: new Audio('assets/sfx/SELECT.mp3'),
	build: new Audio('assets/sfx/CONSTRUCTION.mp3'),
	demolish: new Audio('assets/sfx/DEBRIS.mp3'),
	armor: new Audio('assets/sfx/METAL_IMPACT.mp3'),
	damage: new Audio('assets/sfx/STAB.mp3'),
	slow: new Audio('assets/sfx/SHATTER.mp3'),
	fire: new Audio('assets/sfx/WHOOSH.mp3'),
	nodamage: new Audio('assets/sfx/MUFFLED.mp3'),
	boom: new Audio('assets/sfx/EXPLOSION.mp3'),
	death1: new Audio('assets/sfx/DEATH.mp3'),
	death2: new Audio('assets/sfx/DEATH2.mp3'),
	death3: new Audio('assets/sfx/DEATH3.mp3'),
	death4: new Audio('assets/sfx/DEATH4.mp3')
}
const music = {
	horn: new Audio('assets/music/HORN.mp3'),
	lvl1: new Audio('assets/music/Aventura.mp3'),
	lvl2: new Audio('assets/music/Quebra-Cabecas.mp3'),
	lvl3: new Audio('assets/music/Dream.mp3'),
	lvl4: new Audio('assets/music/Batalha.mp3')
}
function bgmReady() {
	if (bgm.readyState >= 3) {
		return true;
	}
	else {
		console.log("waiting");
		return false;
	}
}

//audio
function deathGrunt() {
	let random = Math.round(Math.random() * (4 - 1)) + 1;
	switch (random) {
		case 1:
			playSFX('death1', 0);
			break;
		case 2:
			playSFX('death2', 0);
			break;
		case 3:
			playSFX('death3', 0);
			break;
		case 4:
			playSFX('death4', 0);
			break;
	}

}
const playSFX = (mysound, t) => {
	if (SFXenabled) {
		SFX[mysound].currentTime = t;
		SFX[mysound].play();
	}
}
function fadeInMusic() {
	if (BGMenabled) {
		bgm.volume = 0;
		bgm.play();
		for (let i = 0; i < 20; i++) {
			setTimeout(function () {
				if (activeWave == false) {
					bgm.volume = (i * .05);
				};
			}, (i * 200))
		}
	}
}
function fadeOutMusic() {
	if (BGMenabled) {
		for (let i = 0; i < 20; i++) {
			let vol = 1 - (i * .05)
			setTimeout(function () { bgm.volume = vol; }, (i * 200))
		}
		setTimeout(function () { if (activeStage == true) { bgm.pause(); }; }, 9800)
	}
}

//#endregion

async function confirmImportAudio () {
	return true
}