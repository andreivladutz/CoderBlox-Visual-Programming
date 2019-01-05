function setListeners() {
	var visible_menu = false;
	document.getElementById("hamburger-icon").addEventListener("click", function(e) { 
		visible_menu = !visible_menu;
		toggleMenu(visible_menu); 
	}, false);
	
	document.getElementById("video-overlay").addEventListener("click", toggleVideoOverlay, false);
	
	document.getElementById("presentation-video").addEventListener("ended", toggleOverlayOnPause, false);
	document.getElementById("presentation-video").addEventListener("pause", toggleOverlayOnPause, false);
}

function toggleMenu(visible) {
	document.querySelector("#about-nav>ul")
		.style.display = (!visible)? "none" : "inline-block";
}
	
function toggleVideoOverlay() {
	var overlay = document.getElementById("video-overlay");
	overlay.classList.toggle("active-video");
	
	var video = document.getElementById("presentation-video");
	
	video.play();
	
	//vreau sa fac overlay-ul sa dispara de tot, nu numai sa nu fie vizibil
	//ca sa am acces la controalele videoului
	setTimeout (function () {
		overlay.style.display = "none";
	}, 500);
}

//for some reason cand dau forward pe video se declanseaza event-ul de pauza
//asa ca astept 0.5s si verific daca chiar a fost apasat butonul de pauza sau nu
function toggleOverlayOnPause() {
	setTimeout (function() {
		if (!document.getElementById("presentation-video").paused)
			return;

		//display-ez overlay-ul din nou chiar daca nu e vizibil
		document.getElementById("video-overlay").style.display = "block";
		document.getElementById("video-overlay").classList.toggle("active-video");
	}, 500);
}