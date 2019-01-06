const _EVENTS_TAB_ID = "EVENTS",
	 _ACTIONS_TAB_ID = "ACTIONS",
	 _CODEFLOW_TAB_ID = "CODEFLOW",
	 _SAVE_BUTTON_ID = "save-progress-button",
	 _PLAY_BUTTON_ID = "playbutton",
	 _PAUSE_BUTTON_ID = "pausebutton",
	 _STOP_BUTTON_ID = "stopbutton",
	 _FULLSCREEN_BUTTON_ID = "fullscreenbutton",
	 _SWITCH_BUTTON_ID = "switch-chara";

class GameUI {
	constructor() {
		[	
			this._EVENTS_TAB, 
			this._ACTIONS_TAB, 
			this._CODEFLOW_TAB, 
			this._SAVE_BUTTON, 
			this._PLAY_BUTTON, 
			this._PAUSE_BUTTON, 
			this._STOP_BUTTON, 
			this._FULLSCREEN_BUTTON, 
			this._SWITCH_BUTTON ] = this.initButtons();
		
		this.canvas = this.initFullContainerCanvas("mainCanvas");
		
		this._FULLSCREEN_CANVAS = false;
		
		this.setListeners();
	};
}

var _p = GameUI.prototype;

_p.initButtons = function() {
	 var buttonsArr = [
		 document.getElementById(_EVENTS_TAB_ID), /*_EVENTS_TAB*/
		 document.getElementById(_ACTIONS_TAB_ID), /*_ACTIONS_TAB*/
		 document.getElementById(_CODEFLOW_TAB_ID), /*_CODEFLOW_TAB*/
		 document.getElementById(_SAVE_BUTTON_ID), /*_SAVE_BUTTON*/
		 document.getElementById(_PLAY_BUTTON_ID), /*_PLAY_BUTTON*/
		 document.getElementById(_PAUSE_BUTTON_ID), /*_PAUSE_BUTTON*/
		 document.getElementById(_STOP_BUTTON_ID), /*_STOP_BUTTON*/
		 document.getElementById(_FULLSCREEN_BUTTON_ID), /*_FULLSCREEN_BUTTON*/
		 document.getElementById(_SWITCH_BUTTON_ID) /*_SWITCH_BUTTON*/
	 ];
	
	return buttonsArr;
}

_p.setListeners = function() {
	this._EVENTS_TAB.onclick = 
		this._ACTIONS_TAB.onclick = this._CODEFLOW_TAB.onclick = this.displayCodeBlocks.bind(this);
}

_p.initFullContainerCanvas = function(canvasId) {
	canvas = document.getElementById(canvasId);
	
	this.resizeCanvas();
	
	window.addEventListener("resize", this.resizeCanvas.bind(this), false);
	
	return canvas;
}

/*functia resize verifica daca canvas-ul este fullscreen sau nu
* si modifica dimensiunile canvas-ului astfel incat sa se adapteze
* la container sau la dimensiunea ecranului(in modul fullscreen)*/
_p.resizeCanvas = function(){
	var new_size = {
		width : (this._FULLSCREEN_CANVAS)? document.body.clientWidth : canvas.parentElement.clientWidth,
		height : (this._FULLSCREEN_CANVAS)? document.body.clientHeight : canvas.parentElement.clientHeight * 0.85
	};
	
	canvas.width = new_size.width;
	canvas.height = new_size.height;
	
	repaintCanvas(canvas);
}

_p.toggleCodeBlocksTab = function(e) {	
	var blocksListStyle = e.currentTarget.nextElementSibling.style,	
		tabStyle = e.currentTarget.style;
	
	[blocksListStyle.visibility, tabStyle.backgroundColor] = 
		(blocksListStyle.visibility === "visible")? ["hidden", ""] : ["visible", "grey"];
}

/*
	pt tabul cu mouseover afisez nextSibling, adica lista cu blocurile de cod din acea categorie
	pt celelalte il ascund
*/
_p.displayCodeBlocks = function(e) {
	if (e.currentTarget.nextElementSibling.style.visibility === "visible")
		return this.toggleCodeBlocksTab(e);
	
	this._TABS = this._TABS? this._TABS : [this._EVENTS_TAB, this._ACTIONS_TAB, this._CODEFLOW_TAB];
	
	var mouseoverIndex = this._TABS.indexOf(e.currentTarget),
		otherTabs = this._TABS.slice(0);
	
	otherTabs.splice(mouseoverIndex, 1);
	
	for (var i = 0; i < otherTabs.length; i++) {
		otherTabs[i].nextElementSibling.style.visibility = "hidden";
		otherTabs[i].style.backgroundColor = "";
	}
	
	this._TABS[mouseoverIndex].nextElementSibling.style.visibility = "visible";
	this._TABS[mouseoverIndex].style.backgroundColor = "grey";
}

/*
	exista un singur tag cu numele categoriei care contine
	toate blocurile din acea categorie de adaugat in pagina
*/
GameUI.appendXMLBlocks = function(xmlDOM, categoryName, whereToAppendID) {
	var whereToAppend = document.getElementById(whereToAppendID),
		divArr = xmlDOM.querySelectorAll(categoryName + ">div." + categoryName);
	
	for (var i = 0; i < divArr.length; i++) {
		var newLi = document.createElement("li");
		
		whereToAppend.appendChild(newLi);
		newLi.innerHTML += divArr[i].outerHTML;
	}
}

// inserez blocurile de cod pe categorii in listele lor din meniu
_p.insertCodeBlocks = function(xmlDOM){
	GameUI.appendXMLBlocks(xmlDOM, "loop", "codeflow_list");
	GameUI.appendXMLBlocks(xmlDOM, "conditional", "codeflow_list");
	GameUI.appendXMLBlocks(xmlDOM, "expression", "codeflow_list");
	GameUI.appendXMLBlocks(xmlDOM, "stop", "codeflow_list");

	GameUI.appendXMLBlocks(xmlDOM, "event", "events_list");

	GameUI.appendXMLBlocks(xmlDOM, "action", "actions_list");
}