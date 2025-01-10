class tower {
    constructor(coord, range, rate, phdmg, spdmg) {
        this.coord = coord
        this.range = range
        this.rate = rate
        this.physical = phdmg
        this.special = spdmg
        this.position = findTilePosition(coord)
        this.cooldown = 0
        this.facing = 0
    }
    target() {
        let reach = (this.range * tileSize) + (tileSize*.5);
        let distX;
        let distY;
        if (this.cooldown < 1) {
            let center = findTileCenter(this.coord);
            for (let i = 0; i < deployed.length; i++) {
                if (deployed[i].invulnerable == true) {
                    continue
                }
                const enemy = deployed[i].position;
                const dist = findDelta(center, enemy)
                if (inReach(dist.deltaX, dist.deltaY, reach)) {
                    this.applyEffect(i)
                    this.shoot(i, dist)
                    break
                }
            }
        }
        else {
            this.cooldown -= 1
            if (this.cooldown > 60) {
                this.facing = Math.floor(7 * Math.random())
            }
        }
    }
    shoot(enemy, dist) {
        let unit = deployed[enemy]
        let cooldown = Math.ceil(50 / this.rate)
        let center = findTileCenter(this.coord);
        this.facing = this.facingDirection(dist.deltaX, dist.deltaY, this.range)
//        console.log(this.facing);
        
        drawProjectile(center, dist, this.projectile.image, this.projectile.width, Math.round(this.facing* 0.5))
    
        unit.damage(this.physical, this.special)
        this.cooldown = cooldown
        deployed[enemy] = unit
        if (unit.hp < 1) {
            unit.kill()
            deployed.splice(enemy, 1)
        }
    }
    facingDirection(deltaX, deltaY) {
        // 0 = 0°, 1 = 45°, 2 = 90°, 3 = 135°, 4 = 180°, 5 = 225°, 6 = 270°, 7 = 315°

//        let angle = Math.trunc(Math.abs(((Math.atan2(deltaX, deltaY)*180)/ Math.PI) - 180));
//        let angle = Math.trunc(Math.abs(((Math.atan2(deltaX, deltaY)*4) / Math.PI)- 4));
        let angle = Math.round(Math.abs(((Math.atan2(deltaX, deltaY)*8) / Math.PI)- 8)) % 16;
//        console.log(angle);
        
       return angle
/*         let cutoff = 0.25 * tileSize * this.range
        let sX = Math.sign(deltaX)
        let sY = Math.sign(deltaY)
        if (Math.abs(deltaX) < cutoff) {
            switch (sY) {
                case 1:
                    console.log("down");
                    return 4;
                case -1:
                    console.log("up");
                    return 0;
            }
        }
        else if (Math.abs(deltaY) < cutoff) {
            switch (sX) {
                case 1:
                    console.log("right");
                    return 2;
                case -1:
                    console.log("left");
                    return 6;
            }
        }
        else {
            if (sX == 1) {
                switch (sY) {
                    case 1:
                        return 3;
                    case -1:
                        return 1;
                }
            }
            if (sX == -1) {
                switch (sY) {
                    case 1:
                        return 5;
                    case -1:
                        return 7;
                }
            }
        }  */
    }
    applyEffect(enemy) {
        let unit = deployed[enemy]
        switch (this.effect) {
            case "none":
                return;
            case "slow2":
                unit.slow(2)
                return
            case "slow3":
                unit.slow(3)
                return
            case "burn":
                playSFX("fire", 0)
                unit.burn()
                return
            default:
                return
        }
    }
    findtile() {
        return tileObjects[this.coord]
    }
    draw() {
        let position = findTilePosition(this.coord)

        drawSheetSprite(this.sprite3d, position.x, position.y, tileSize, tileSize, this.facing)
    
    
    //    rotatedSprite(this.sprite, position.x, position.y, tileSize, tileSize, (this.facing * 45))
    
    }
    circlerange() {
        let center = findTileCenter(this.coord);
        let reach = (this.range * tileSize) + 10;
        ctx.strokeStyle = 'rgba(153, 207, 230, 0.5)';
        ctx.lineWidth = 10;
        drawCircle(center.x, center.y, reach)
    }
    levelUp() {
        let nextLevel = this.level + 1
        if (verifyPurchase(this.getType(), nextLevel) == true) {
            this.upgrade(nextLevel)
        }
        closeMenu()
    }
    upgrade(lvl) {
        const stats = towerStats[this.getType()]
        if (lvl > stats.range.length - 1) {
            return
        }
        if ((this.effect == "slow2") && (lvl == 2)) {
            this.effect = "slow3"
        }
        playSFX("build", 0)
        this.level = lvl
        this.range = stats.range[lvl]
        this.rate = stats.rate[lvl]
        this.physical = stats.pdmg[lvl]
        this.special = stats.sdmg[lvl]
//        this.sprite.src = stats.sprite[lvl]
        this.sprite3d.swapSheet(stats.sprite3d[lvl])
    }
    sell() {
        let mytile = new tile(this.coord, 0, 0)
        tileObjects[this.coord] = mytile
        updateGold(Math.floor(towerStats[this.getType()].price[this.level] * .75))
        playSFX("demolish", 0)
        closeMenu()
    }
    showMenu() {
        const cost = towerStats[this.getType()].price[this.level + 1]
        const val = Math.floor(towerStats[this.getType()].price[this.level] * .75)
        let upbtn = document.createElement('button')
        if (cost != undefined) {
            upbtn.setAttribute('onClick', "upgradeMenu(" + this.coord + ")")
            upbtn.innerText = "UPGRADE $" + cost
            tmenu.appendChild(upbtn)
        }
        let sbtn = document.createElement('button')
        sbtn.setAttribute('onClick', "sellMenu(" + this.coord + ")")
        sbtn.innerText = "SELL $" + val
        tmenu.appendChild(sbtn)
        tmenu.style.visibility = "visible"
        let xp = findTilePosition(hovering).x;
        let yp = findTilePosition(hovering).y;
        let offx = tileSize;
        let offy = 0;
        if (xp > canvas.width - (3 * tileSize)) {
            offx = (-200)
        }
        if (yp < tileSize) {
            offy = tileSize
        }
        if (yp > (canvas.height - 200)) {
            offy = tileSize-200 
        }
        tmenu.style.transform = "translate(" + (xp + offx) + "px, " + (yp + offy) + "px)"
    }
    disableTower() {
        this.cooldown = 150
    }
    resetCooldown() {
        this.cooldown = 0
    }
}
class shooter extends tower {
    constructor(coords) {
        super(coords, towerStats["shooter"].range[0], towerStats["shooter"].rate[0], towerStats["shooter"].pdmg[0], towerStats["shooter"].sdmg[0])
        this.level = 0
        this.cooldown = 0
//        const spriteSheetOld = new Image()
        const spriteProjectile = new Image()
//        spriteSheetOld.src = "assets/img/shooteri.png"
        spriteProjectile.src = "assets/img/cannonball.png"
//        this.sprite = spriteSheetOld
        this.effect = "none"
        this.projectile = {
            image: spriteProjectile,
            width: 30
        }
        this.has3dsprite = true
        let myimgsrc = "assets/img/st1_64_4x4grid.png"
        let sheetGrid = [4, 4]
        let mysheet = new spriteSheet(myimgsrc, 64, sheetGrid)
        this.sprite3d = mysheet
    }
    getType() {
        return "shooter"
    }
}
class freezer extends tower {
    constructor(coords) {
        super(coords, towerStats["freezer"].range[0], towerStats["freezer"].rate[0], towerStats["freezer"].pdmg[0], towerStats["freezer"].sdmg[0])
        this.level = 0
        this.cooldown = 0
//        const spriteSheetOld = new Image()
        const spriteProjectile = new Image()
//        spriteSheetOld.src = "assets/img/freezeri.png"
        spriteProjectile.src = "assets/img/iceball.png"
//        this.sprite = spriteSheetOld
        this.effect = "slow2"
        this.projectile = {
            image: spriteProjectile,
            width: 40
        }
        this.has3dsprite = true
        let myimgsrc = "assets/img/fr1_64_4x4grid.png"
        let sheetGrid = [4, 4]
        let mysheet = new spriteSheet(myimgsrc, 64, sheetGrid)
        this.sprite3d = mysheet
    }
    getType() {
        return "freezer"
    }

}
class scorcher extends tower {
    constructor(coords) {
        super(coords, towerStats["scorcher"].range[0], towerStats["scorcher"].rate[0], towerStats["scorcher"].pdmg[0], towerStats["scorcher"].sdmg[0])
        this.level = 0
        this.cooldown = 0
//        const spriteSheetOld = new Image()
        const spriteProjectile = new Image()
//        spriteSheetOld.src = "assets/img/scorcheri.png"
        spriteProjectile.src = "assets/img/fireball.png"
//        this.sprite = spriteSheetOld
        this.effect = "burn"
        this.projectile = {
            image: spriteProjectile,
            width: 45
        }
        this.has3dsprite = true
        let myimgsrc = "assets/img/sc1_64_4x4grid.png"
        let sheetGrid = [4, 4]
        let mysheet = new spriteSheet(myimgsrc, 64, sheetGrid)
        this.sprite3d = mysheet
    }
    getType() {
        return "scorcher"
    }
}
class shredder extends tower {
    constructor(coords) {
        super(coords, towerStats["shredder"].range[0], towerStats["shredder"].rate[0], towerStats["shredder"].pdmg[0], towerStats["shredder"].sdmg[0])
        this.level = 0
        this.cooldown = 0
//        const spriteSheetOld = new Image()
        const spriteProjectile = new Image()
//        spriteSheetOld.src = "assets/img/shredderi.png"
        spriteProjectile.src = "assets/img/darkenergy.png"
//        this.sprite = spriteSheetOld
        this.projectile = {
            image: spriteProjectile,
            width: 30
        }
        this.has3dsprite = true
        let myimgsrc = "assets/img/sh1_64_4x4grid.png"
        let sheetGrid = [4, 4]
        let mysheet = new spriteSheet(myimgsrc, 64, sheetGrid)
        this.sprite3d = mysheet

    }
    getType() {
        return "shredder"
    }
    
}
const towerStats = {
    "shooter": {
        range: [2, 2.5, 3],
        rate: [3, 3, 4],
        pdmg: [4, 5, 7],
        sdmg: [0, 0, 0],
        sprite3d: ["assets/img/st1_64_4x4grid.png", "assets/img/st2_64_4x4grid.png", "assets/img/st3_64_4x4grid.png"],
        price: [10, 25, 250]
    },
    "freezer": {
        range: [1.5, 1.8, 2],
        rate: [1, 1.5, 2],
        pdmg: [0, 1, 2],
        sdmg: [4, 6, 8],
        sprite3d: ["assets/img/fr1_64_4x4grid.png", "assets/img/fr2_64_4x4grid.png", "assets/img/fr3_64_4x4grid.png"],
        price: [12, 30, 350]
    },
    "scorcher": {
        range: [1.3, 1.8, 2],
        rate: [6, 7, 8],
        pdmg: [1, 2, 2],
        sdmg: [1, 3, 4],
        sprite3d: ["assets/img/sc1_64_4x4grid.png", "assets/img/sc2_64_4x4grid.png", "assets/img/sc3_64_4x4grid.png"],
        price: [20, 40, 200],
    },
    "shredder": {
        range: [2.5, 3, 3.5],
        rate: [6, 6, 7],
        pdmg: [5, 8, 8],
        sdmg: [1, 4, 6],
        sprite3d: ["assets/img/sh1_64_4x4grid.png", "assets/img/sh2_64_4x4grid.png", "assets/img/sh3_64_4x4grid.png"],
        price: [150, 250, 600]
    },
}

async function confirmImportTowers() {
    return true
}