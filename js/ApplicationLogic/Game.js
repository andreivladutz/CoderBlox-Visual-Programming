const GAME_START_EVENT = "gamestart",
	  GAME_STOP_EVENT = "gamestop";

const CHARACTER_NAMES = ["John", "Johnny"],
	  DEFAULT_CHARACTER_NAME = "Johnny",
	  DOM_HEAD_IMG_ID = "chara-head",
	  MAIN_CANVAS_ID = "mainCanvas";

var CHARACTERS = {
	  "John" : {
		  "headImage" : "media/APP/charas/John-head.png",
		  //aici va fi obiectul img al sprite-ului dupa ce s-a incarcat
		  "spriteResource" : null
	  },
	  "Johnny" : {
		  "headImage" : "media/APP/charas/Johnny-head.png",
		  "spriteResource" : null
	  }
  };

class Game extends EventEmiter {
	constructor() {
		super();
		
		this.finishedLoadingCharasPromises = [];
		
		this.gui = new GameUI(this);
		this.resLoad = this._loadResources();
		this.character = null;
		this.selectedCharaName = this._loadSelectedCharacter();
		
		this.running = false;
		
		//toate chain-urile de blocuri create vor fi adaugate aici 
		this.codeChains = [];
		
		//cand toate blocurile de cod au terminat de executat s-a sfarsit jocul
		this.finishGamePromises = [];
		
		this.DEBUGGING_CODE_CHAIN = false;
		this.DEBUGGING_DRAG_AND_DROP = false;
		
		this._addCustomListeners();
	}
}

_p = Game.prototype;

_p._loadResources = function() {
	var resLoad = new ResourceLoader(),
		self = this;
	
	resLoad.addEventListener("loadedCodeBlocksXML", function(e) { self.gui.insertCodeBlocks(e.detail.responseXML); });
	resLoad.addEventListener("loadedCodeBlocksXML", this._boxCodeBlocks);
	resLoad.addEventListener("loadedCompatibilityJSON", this._setCodeBlocksCompatibility);
	resLoad.addEventListener("loadedSelectorsJSON", this._setCodeBlocksSelectors);
	
	//fac cate un promise pt fiecare caracter si astept sa se incarce toate caracterele
	for (let charaName of CHARACTER_NAMES) {
		this.finishedLoadingCharasPromises.push(
			new Promise(function(resolve, reject) {
				resLoad.addEventListener("loaded" + charaName, function(e) {
					CHARACTERS[charaName]["spriteResource"] = e.detail;
					
					resolve(e);
				});
			})
		);
	}
	
	Promise.all(this.finishedLoadingCharasPromises)
		.then(this._onLoadedCharacters.bind(this));

	resLoad.add(RESOURCES);
	resLoad.load();
	
	return resLoad;
}

_p._onLoadedCharacters = function() {
	this.character = new Character(
		this, 
		document.getElementById(MAIN_CANVAS_ID),
		this.selectedCharaName, 
		document.getElementById(DOM_HEAD_IMG_ID)
	);
}

//cand apas butonul de schimbat caracterul => 
//trec la urmatorul caracter in lista de nume de caractere
_p.changeCharacter = function() {
	var ind = CHARACTER_NAMES.indexOf(this.selectedCharaName);
	
	this.character.switchCharacter(
		(this.selectedCharaName = CHARACTER_NAMES[++ind % 2])
	);
	
	this.character.drawCharacter();
}

//daca nu am salvat deja caracterul intr-o alta 
//sesiune atunci returnez caracterul default
_p._loadSelectedCharacter = function() {
	var characterName = localStorage.getItem(SELECTED_CHARACTER_KEY);
	
	return (characterName)? characterName : DEFAULT_CHARACTER_NAME;
}

_p._saveSelectedCharacter = function() {
	localStorage.setItem(SELECTED_CHARACTER_KEY, this.selectedCharaName);
}

/*
	parcurg toate listele de blocuri de cod si le wrappuiesc in obiect-ul codeblock
	ne folosim de regexp pentru a gasi categoria din care face parte un bloc
*/
_p._boxCodeBlocks = function() {
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

_p._setCodeBlocksSelectors = function(e) {
	var xhttp = e.detail;
	
	CodeChain.SELECTORS = JSON.parse(xhttp.responseText);
}

_p._setCodeBlocksCompatibility = function(e) {
	var xhttp = e.detail;
	
	CodeBlock.COMPATIBILITY_RULES = JSON.parse(xhttp.responseText);
}

_p._addCustomListeners = function() {
	this.on(GAME_START_EVENT, this._startGame);
	this.on(GAME_STOP_EVENT, this._stopGame);
}

_p.startDebuggingCodeChain = function() {
	this.DEBUGGING_CODE_CHAIN = true;
}

_p.startDebuggingDragAndDrop = function() {
	this.DEBUGGING_DRAG_AND_DROP = true;
}

_p.getAnimationFPS = function() {
	return parseInt(this.gui.rangeElement.value);
}

_p._startGame = function() {
	if (this.running) return;
	
	this.running = true;
	
	for (var codeChain of this.codeChains) {
		codeChain.parseTree();
		codeChain.emit(GAME_START_EVENT, null);
	}
	
	//astept sa se termine toate blocurile de cod de rulat
	//Promise.all(this.finishGamePromises).then(this.emit.bind(this, GAME_STOP_EVENT, null));
}

_p._stopGame = function() {
	if (!this.running) return;
	
	this.running = false;
	
	this.gui.handleStopButtonPress();
	
	for (var codeChain of this.codeChains) {
		codeChain.interruptCodeExecution();
	}
}