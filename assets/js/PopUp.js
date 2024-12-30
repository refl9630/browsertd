async function popUp (message, type) {

	document.getElementById("pop").innerHTML = "\
	<p>" + message +  "</p>\
	<button type=\"button\">X</button>\
	<button type=\"button\">✓</button>"

	const conf = document.getElementById('pop');
	overlayOn()
	conf.style.visibility = "visible"
	const btns = conf.querySelectorAll('button')
	if (type != 'selection') {
		btns[0].style.display = "none"
		btns[1].innerHTML = "OK"
	}
	else {
		btns[0].style.visibility = "visible"
		btns[1].innerHTML = "✓"
	}

	btns[0].addEventListener("click",function(){
          document.dispatchEvent(
            new CustomEvent('choice', { detail:false })
          )
        },{ once: true })
	btns[1].addEventListener("click",function(){
          document.dispatchEvent(
            new CustomEvent('choice', { detail:true })
          )
    	},{ once: true })
	
	return new Promise((resolve,reject)=>{ 
        document.addEventListener("choice",function(e){
            overlayOff()
			resolve(e.detail)
        },{ once: true })
    })
}

