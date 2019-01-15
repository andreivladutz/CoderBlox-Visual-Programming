const _EVENTS_TAB_ID = "EVENTS",
	 _ACTIONS_TAB_ID = "ACTIONS",
	 _CODEFLOW_TAB_ID = "CODEFLOW",
	 _SAVE_BUTTON_ID = "save-progress-button",
	 _PLAY_BUTTON_ID = "startbutton",
	 _STOP_BUTTON_ID = "stopbutton",
	 _FULLSCREEN_BUTTON_ID = "fullscreenbutton",
	 _SWITCH_BUTTON_ID = "switch-chara",
	 _SETTINGS_BUTTON_ID = "settings-button",
	 _LOGGER_BUTTON_ID = "logger-button";

const WASD_RADIO = 0,
	  ARROWS_RADIO = 1;

const FULLSCREEN_ICON_SRC = "media/APP/buttons/fullscreen.png",
	  MINIMISE_ICON_SRC = "media/APP/buttons/minimise.png",
	  TOGGLE_FULLSCREEN_IMG_ID = "toggleFullscreenImg";

//constante pentru localStorage (cheile in care salvez)
const FPS_RANGE_KEY = "fpsRange",
	  SHOW_KEYBOARD_CHECKBOX_KEY = "keyboardCheckbox",
	  WASD_KEYBOARD_RADIO_KEY = "wasdRadio",
	  SELECTED_CHARACTER_KEY = "selectedCharacter";

class GameUI {
	constructor(game) {
		this.game = game;
		this.virtualKeyboard = new VirtualKeyboard();
		
		[	
			this._EVENTS_TAB, 
			this._ACTIONS_TAB, 
			this._CODEFLOW_TAB, 
			this._SAVE_BUTTON, 
			this._PLAY_BUTTON,
			this._STOP_BUTTON, 
			this._FULLSCREEN_BUTTON, 
			this._SWITCH_BUTTON,
			this._SETTINGS_BUTTON,
			this._LOGGER_BUTTON ] = this.initButtons();
		
		this.canvas = this.initFullContainerCanvas("mainCanvas");
		
		this._FULLSCREEN_CANVAS = false;
		
		//LOGGER-ul
		this.textAreaElement = null;
		
		//FieldSet-ul care va contine setarile
		this.fieldSet = null;
		//Range-ul pentru FPS
		this.rangeElement = null;
		this.labelRangeElement = null;
		//Checkbox-ul pentru afisare tastatura virtuala
		this.checkboxElement = null;
		//cele doua radio buttons -> daca tastatura virtuala ar trebui sa contina
		//sagetelele sau wasd
		this.radioElements = [];
		
		this.createElements();
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
		 document.getElementById(_STOP_BUTTON_ID), /*_STOP_BUTTON*/
		 document.getElementById(_FULLSCREEN_BUTTON_ID), /*_FULLSCREEN_BUTTON*/
		 document.getElementById(_SWITCH_BUTTON_ID), /*_SWITCH_BUTTON*/
		 document.getElementById(_SETTINGS_BUTTON_ID), /*_SETTINGS_BUTTON*/
		 document.getElementById(_LOGGER_BUTTON_ID), /*_LOGGER_BUTTON*/
	 ];
	
	return buttonsArr;
};

_p.setListeners = function() {
	this._EVENTS_TAB.onclick = 
		this._ACTIONS_TAB.onclick = this._CODEFLOW_TAB.onclick = this.displayCodeBlocks.bind(this);
	
	var self = this;
	
	this._PLAY_BUTTON.addEventListener("click", function() {
		self.handlePlayButtonPress();
		self.game.emit(GAME_START_EVENT, null);
	});
	
	this._STOP_BUTTON.addEventListener("click", function() {
		self.handleStopButtonPress();
		self.game.emit(GAME_STOP_EVENT, null);
	});
	
	this._FULLSCREEN_BUTTON.addEventListener("click", this.toggleFullScreenCanvas.bind(this));
	
	this.rangeElement.addEventListener("change", this.onFPSRangeChange.bind(this));
	this.checkboxElement.addEventListener("change", console.log);
	this.radioElements[0].addEventListener("change", console.log);
	this.radioElements[1].addEventListener("change", console.log);
	
	this._LOGGER_BUTTON.addEventListener("click", this.toggleLogger.bind(this));	
	
	this._SETTINGS_BUTTON.addEventListener("click", this.toggleSettings.bind(this));
};

_p.toggleSettings = function() {
	if (this.fieldSet.style.display) {
		this._hideLogger();
		this._showSettings();
	}
	else {
		this._hideSettings();
	}
}

_p.toggleLogger = function() {
	if (this.textAreaElement.style.display) {
		this._hideSettings();
		this._showLogger();
	}
	else {
		this._hideLogger();
	}
}

_p._hideSettings = function() {
	this.fieldSet.style.display = "none";
}

_p._showSettings = function() {
	this.fieldSet.style.display = "";
	
}

_p._hideLogger = function() {
	this.textAreaElement.style.display = "none";
}

_p._showLogger = function() {
	this.textAreaElement.style.display = "";
}

_p.onFPSRangeChange = function() {
	this.labelRangeElement.innerHTML = "Animation frames = " + 
		this.rangeElement.value + "FPS";
}

_p.createElements = function() {
	this.fieldSet = document.createElement("FIELDSET");
	var charactersTab = document.getElementById("characters");
	charactersTab.appendChild(this.fieldSet);
	
	this.fieldSet.style.display = "none";
	
	var legend = document.createElement("LEGEND");
	legend.innerHTML = "SETARI";
	this.fieldSet.appendChild(legend);
	
	this.textAreaElement = document.createElement("TEXTAREA");
	this.rangeElement = document.createElement("INPUT");
	this.checkboxElement = document.createElement("INPUT");
	this.radioElements[0] = document.createElement("INPUT");
	this.radioElements[1] = document.createElement("INPUT");
	
	var checkboxLabel = document.createElement("LABEL");
	var radioLabel1 = document.createElement("LABEL");
	var radioLabel2 = document.createElement("LABEL");
	this.labelRangeElement = document.createElement("LABEL");
	
	checkboxLabel.htmlFor = "checkboxKeyboard";
	
	checkboxLabel.innerHTML = "Afiseaza tastatura virtuala";
	radioLabel1.innerHTML = "WASD";
	radioLabel2.innerHTML = "Sagetele";
	
	this.rangeElement.type = "range";
	this.checkboxElement.type = "checkbox";
	this.radioElements[0].type = "radio";
	this.radioElements[1].type = "radio";
	
	this.rangeElement.min = "30";
	this.rangeElement.max = "60";
	this.rangeElement.step = "15";
	
	this.onFPSRangeChange();
	
	this.rangeElement.id = "rangeFPS";
	this.checkboxElement.id = "checkboxKeyboard";
	this.radioElements[0].id = "radioWASD";
	this.radioElements[1].id = "radioArrows";
	
	this.rangeElement.className = "dynamicInput";
	this.checkboxElement.className = "dynamicInput";
	this.radioElements[0].className = "dynamicInput";
	this.radioElements[1].className = "dynamicInput";

	this.textAreaElement.readOnly = true;
	this.textAreaElement.placeholder = "AICI VOR FI AFISATE LOG-URILE DIN APLICATIE.";
	this.textAreaElement.style.display = "none";
	
	this.radioElements[0].name = "keyboardRadio";
	this.radioElements[1].name = "keyboardRadio";
	
	this.radioElements[0].value = "WASD";
	this.radioElements[1].value = "ARROWS";
	
	this.radioElements[0].checked = true;
	
	charactersTab.appendChild(this.textAreaElement);
	
	this.fieldSet.appendChild(this.labelRangeElement);
	this.fieldSet.appendChild(this.rangeElement);
	this.fieldSet.appendChild(checkboxLabel);
	this.fieldSet.appendChild(this.checkboxElement);
	this.fieldSet.appendChild(radioLabel1);
	this.fieldSet.appendChild(this.radioElements[0]);
	this.fieldSet.appendChild(radioLabel2);
	this.fieldSet.appendChild(this.radioElements[1]);
	
	LOGGER = new Logger(this.textAreaElement);
}

_p.toggleFullScreenCanvas = function() {
	var toggleFullscreenImg = document.getElementById(TOGGLE_FULLSCREEN_IMG_ID);
	
	if (!this._FULLSCREEN_CANVAS) {
		toggleFullscreenImg.src = MINIMISE_ICON_SRC;
		
		this.canvas.style.position = "absolute";
		this.canvas.style.top = 0;
		this.canvas.style.left = 0;
		document.body.appendChild(this.canvas);
		
		document.body.appendChild(this._PLAY_BUTTON);
		document.body.appendChild(this._STOP_BUTTON);
		
		this._FULLSCREEN_CANVAS = true;
	}
	
	else {
		var gameSection = document.getElementById("game");
		toggleFullscreenImg.src = FULLSCREEN_ICON_SRC;
		
		this.canvas.style.position = "";
		this.canvas.style.top = "";
		this.canvas.style.left = "";
		gameSection.appendChild(this.canvas);
		
		gameSection.appendChild(this._PLAY_BUTTON);
		gameSection.appendChild(this._STOP_BUTTON);
		
		this._FULLSCREEN_CANVAS = false;
	}
	
	this.resizeCanvas();
}

_p.initFullContainerCanvas = function(canvasId) {
	this.canvas = document.getElementById(canvasId);
	
	this.resizeCanvas();
	
	window.addEventListener("resize", this.resizeCanvas.bind(this), false);
	
	return this.canvas;
};

/*functia resize verifica daca canvas-ul este fullscreen sau nu
* si modifica dimensiunile canvas-ului astfel incat sa se adapteze
* la container sau la dimensiunea ecranului(in modul fullscreen)*/
_p.resizeCanvas = function() {
	function viewportSize() {
		return {
			width : Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
			height : Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
		};
	}
	
	var new_size = (this._FULLSCREEN_CANVAS)
		? viewportSize() : 
		{
			width :  this.canvas.parentElement.clientWidth,
			height : this.canvas.parentElement.clientHeight * 0.85
		};
	
	this.canvas.width = new_size.width;
	this.canvas.height = new_size.height;
	
	repaintCanvas(this.canvas);
};

_p.handlePlayButtonPress = function() {
	this._PLAY_BUTTON.style.display = "none";
	this._STOP_BUTTON.style.display = "inline-block";
}

_p.handleStopButtonPress = function() {
	this._PLAY_BUTTON.style.display = "";
	this._STOP_BUTTON.style.display = "";
}

_p.toggleCodeBlocksTab = function(e) {	
	var blocksListStyle = e.currentTarget.nextElementSibling.style,	
		tabStyle = e.currentTarget.style;
	
	[blocksListStyle.visibility, tabStyle.backgroundColor] = 
		(blocksListStyle.visibility === "visible")? ["hidden", ""] : ["visible", "grey"];
};

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
};

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
};

// inserez blocurile de cod pe categorii in listele lor din meniu
_p.insertCodeBlocks = function(xmlDOM){
	GameUI.appendXMLBlocks(xmlDOM, "loop", "codeflow_list");
	GameUI.appendXMLBlocks(xmlDOM, "conditional", "codeflow_list");
	GameUI.appendXMLBlocks(xmlDOM, "expression", "codeflow_list");
	GameUI.appendXMLBlocks(xmlDOM, "stop", "codeflow_list");

	GameUI.appendXMLBlocks(xmlDOM, "event", "events_list");

	GameUI.appendXMLBlocks(xmlDOM, "action", "actions_list");
};