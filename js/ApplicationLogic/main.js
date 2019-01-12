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
		url : "resources/BLOCURI_COD.xml"
	},	
	{
		name : "CompatibilityJSON",
		itemType : "XML",
		url : "resources/COMPATIBILITATE.JSON"
	},	
	{
		name : "SelectorsJSON",
		itemType : "XML",
		url : "resources/SELECTORI.JSON"
	}
];

var GAME_REFERENCE;

function init() {
	GAME_REFERENCE = new Game();
	GAME_REFERENCE.startDebuggingCodeChain();
	//GAME_REFERENCE.startDebuggingDragAndDrop();
	
	/*
	canvas.style.position = "absolute";
	canvas.style.top = 0;
	canvas.style.left = 0;
	document.body.appendChild(canvas);
	*/
	
}

var ctx;

function repaintCanvas(canvas) {
	ctx = canvas.getContext("2d");
	
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	drawChara();
}

function drawChara(character = drawChara.character) {
	if (!character || !character._availableResource) return;
	
	drawChara.character = character;
	
	var spriteHeight = Math.floor(character.height / 4), spriteWidth = Math.floor(character.width / 3);
	
	//desenez caracterul in mijlocul canvas-ului
	ctx.drawImage(character, spriteWidth, spriteHeight * 2, spriteWidth, spriteHeight, 
				  Math.floor( canvas.width / 2 - spriteWidth / 2), Math.floor(canvas.height / 2 - spriteHeight / 2), 
				  spriteWidth, spriteHeight);
}