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
		itemType : "JSON",
		url : "resources/COMPATIBILITATE.JSON"
	},	
	{
		name : "SelectorsJSON",
		itemType : "JSON",
		url : "resources/SELECTORI.JSON"
	}
];

var GAME_REFERENCE, LOGGER;

window.onload = function init() {
	GAME_REFERENCE = new Game();
	GAME_REFERENCE.startDebuggingCodeChain();
	//GAME_REFERENCE.startDebuggingDragAndDrop();
}