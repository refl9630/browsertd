function main() {
    loadScript("assets/js/game.js");
    loadScript("assets/js/screen.js");
    loadScript("assets/js/towers.js");
    loadScript("assets/js/enemies.js");
    loadScript("assets/js/audio.js");
    loadScript("assets/js/level.js");
    //    console.log(confirmImport())
}


function loadScript(path) {
    const element = document.createElement("script");
    let attr = element.setAttribute("src", path);
    element.setAttribute("onload", "confirmImport()");
    //    console.log(element);
    document.head.appendChild(element);
}

async function confirmImport() {
    const cs = await confirmImportGame()
    //    console.log("gm ok", cs)
    const cd = await confirmImportScreen()
    //    console.log("gm ok", cs)
    const cl = await confirmImportTowers()
    //    console.log("tw ok", cl)
    const cm = await confirmImportEnemies()
    //    console.log("en ok", cm)
    const cc = await confirmImportLevel()
    //    console.log("lv ok", cc)
    const ca = await confirmImportAudio()
    //    console.log("au ok", ca)
    if (cs == true && cd == true && cl == true && cm == true && cc == true && ca == true) {
        console.log("all ok");
        
        mainMenu()
    }
}

//blurry overlay
const overlayelement = document.getElementById('overlay')
//let isBlurred = false
function overlayOn () {
	overlayelement.style.display = "block"
//	isBlurred = true
}
function overlayOff () {
	overlayelement.style.display = "none"
//	isBlurred = false
}

main()