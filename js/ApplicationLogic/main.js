"use strict";
const RESOURCES = [
	{
		name : "Johnny",
		itemType : "img",
		url : "media/APP/charas/Johnny.png"
	},
	
	{
		name : "John",
		itemType : "img",
		url : "media/APP/charas/John.png"
	},
		
	{
		name : "CodeBlocksXML",
		itemType : "XML",
		url : "BLOCURI_COD.xml"
	}
	
];

function init() {
	var gui = new GameUI();
	
	/*
	canvas.style.position = "absolute";
	canvas.style.top = 0;
	canvas.style.left = 0;
	document.body.appendChild(canvas);
	*/
	
	var resLoad = new ResourceLoader();
	resLoad.addEventListener("loadedJohnny", function(e) { drawChara(e.detail); });
	resLoad.addEventListener("loadedCodeBlocksXML", function(e) { gui.insertCodeBlocks(e.detail.responseXML); });
	resLoad.addEventListener("loadedCodeBlocksXML", function() { boxCodeBlocks(); });
	
	var resources = RESOURCES;
	resLoad.add(resources);
	resLoad.load();
}

/*
	parcurg toate listele de blocuri de cod si le wrappuiesc in obiect-ul codeblock
	ne folosim de regexp pentru a gasi categoria din care face parte un bloc
*/
function boxCodeBlocks() {
	var elem, currList, blocks, lists = ["codeflow_list", "events_list", "actions_list"],
		regExps = [/loop/, /action/, /conditional/, /event/, /expression/, /stop/],
		category = ["loop", "action", "conditional", "event", "expression", "stop"];
	
	for (var listId of lists) {
		currList = document.getElementById(listId);
		
		blocks = currList.querySelectorAll("li>div.code_block");
		
		for (var i = 0; i < blocks.length; i++)
			for (var j = 0; j < regExps.length; j++) {
				if (blocks[i].className.match(regExps[j]) != null)
					new CodeBlock(blocks[i], category[j]);
			}
	}
}

var ctx;

function repaintCanvas(canvas) {
	ctx = canvas.getContext("2d");
	
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	drawChara();
}

function drawChara(character = drawChara.character) {
	if (!character || !character.available) return;
	
	drawChara.character = character;
	
	var spriteHeight = Math.floor(character.height / 4), spriteWidth = Math.floor(character.width / 3);
	
	//desenez caracterul in mijlocul canvas-ului
	ctx.drawImage(character, spriteWidth, spriteHeight * 2, spriteWidth, spriteHeight, 
				  Math.floor( canvas.width / 2 - spriteWidth / 2), Math.floor(canvas.height / 2 - spriteHeight / 2), 
				  spriteWidth, spriteHeight);
}