var _FULLSCREEN_CANVAS;
var character;

function init() {
	_FULLSCREEN_CANVAS = false;
	
	character = new Image();
	
	var canvas = initFullContainerCanvas("mainCanvas");
	
	(new Promise(
		function(resolve, reject) {
			character.onload = function(e) {
				resolve(e);
			}
			character.onerror = function(e) {
				reject(e);
			}
			character.src = "media/APP/charas/Johnny.png";
		})).then(function onFulfilled(response) {
				character.available = true;
				drawChara(canvas, canvas.getContext("2d"));
			},
				function onRejected(response) {
					console.error(response);
			});
}

function repaintCanvas(canvas, ctx) {
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	drawChara(canvas, ctx);
}

function drawChara(canvas, ctx) {
	if (!character.available) return;
	var spriteHeight = Math.floor(character.height / 4), spriteWidth = Math.floor(character.width / 3);
	
	//desenez caracterul in mijlocul canvas-ului
	ctx.drawImage(character, spriteWidth, spriteHeight * 2, spriteWidth, spriteHeight, 
				  canvas.width / 2 - spriteWidth / 2, canvas.height / 2 - spriteHeight / 2, 
				  spriteWidth, spriteHeight);
}

function initFullContainerCanvas(canvasId) {
	var canvas = document.getElementById(canvasId);
	var ctx = canvas.getContext("2d");
	
	resizeCanvas(canvas, ctx);
	
	window.addEventListener("resize", function() {
		resizeCanvas(canvas, ctx);
	}, false);
	
	return canvas;
}

/*functia resize verifica daca canvas-ul este fullscreen sau nu
* si modifica dimensiunile canvas-ului astfel incat sa se adapteze
* la container sau la dimensiunea ecranului(in modul fullscreen)*/
function resizeCanvas(canvas, ctx) {
	var new_size = {
		width : (_FULLSCREEN_CANVAS)? document.body.clientWidth : canvas.parentElement.clientWidth,
		height : (_FULLSCREEN_CANVAS)? document.body.clientHeight : canvas.parentElement.clientHeight * 0.85
	};
	
	canvas.width = new_size.width;
	canvas.height = new_size.height;
	
	repaintCanvas(canvas, ctx);
}