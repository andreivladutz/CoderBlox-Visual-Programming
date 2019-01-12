const outlineMillisecondsTime = 300;

class CodeChain extends EventEmiter {
	constructor(DOMElement) {
		super(DOMElement);
		this.containerElement = DOMElement;
		
		this.treeRepresentation = null;
		
		this.keyPressHandler = null;
	}
	
}

//metoda statica folosita drept callback
//intr-un DFS de executie a arborelui de cod
CodeChain.executionCallback = function(treeNode) {
	return treeNode.execute();
}

CodeChain.afterExecutionCallback = function(treeNode) {}

_p = CodeChain.prototype;

//execut chain-ul curent
_p.runCodeChain = function() {
	this.addOutline = function() {
		this._settedOutlineTime = new Date().getTime(); 
		this.containerElement.style.outlineColor = "red";
		this.containerElement.style.outlineStyle = "solid";
	}

	if (this._clearedOutlineTime 
		&& new Date().getTime() - this._clearedOutlineTime >= outlineMillisecondsTime) {

		this.addOutline();
	}
	else {
		setTimeout(this.addOutline.bind(this), outlineMillisecondsTime);
	}
	
	//vreau ca parametrul startNode sa fie cel default (root-ul)
	DFSRunner(
		this.treeRepresentation, 
		CodeChain.executionCallback, 
		CodeChain.afterExecutionCallback, 
		undefined
	).then(this.onFinishedExecution.bind(this));
}

_p.onFinishedExecution = function() {
	this.removeOutline = function() {
		this._clearedOutlineTime = new Date().getTime(); 
		this.containerElement.style.outlineColor = "";
		this.containerElement.style.outlineStyle = "";
	}
	
	if (new Date().getTime() - this._settedOutlineTime >= outlineMillisecondsTime) {
		this.removeOutline();
	}
	else {
		setTimeout(this.removeOutline.bind(this), outlineMillisecondsTime);
	}
}

/*
	daca primul element din chain nu este un event nu are sens
	sa il parsam deoarece acest chain nu se va executa niciodata
*/
_p.parseTree = function() {
	this._destroyOldTree();
	
	if (this.containerElement.children.length === 0) {
		var index = GAME_REFERENCE.codeChains.indexOf(this);
		
		~index && GAME_REFERENCE.codeChains.splice(index, 1);
		return;
	}
	
	var firstCodeBlock = this.containerElement.firstElementChild;
	
	/*
		daca primul element din chain nu este un event nu are sens
		sa il parsam deoarece acest chain nu se va executa niciodata
	*/
	if (firstCodeBlock._CodeBlockWrapper.blockType != "event")
		return;
	
	this.treeRepresentation = new Tree();
	var eventName = getBlockName(firstCodeBlock);
	
	if (eventName === "begin_game") {
		this.treeRepresentation.root = new EventNode(null, firstCodeBlock, "begin_game");
		this.addEventListener(GAME_START_EVENT,
							  this.runCodeChain.bind(this)
							 );
	}
	else if (eventName === "keypress") {
		this.treeRepresentation.root = new KeyPressEvent(null, firstCodeBlock, "keypress");
		
		this.keyPressHandler = function(e) {
			if (e.key === this.treeRepresentation.root.keyPress)
				this.runCodeChain();
		}
		
		document.body.addEventListener("keydown", this.keyPressHandler.bind(this));
	}
	
	this.treeRepresentation.root.codeChain = this;
	this.treeRepresentation.root.game = GAME_REFERENCE;
	
	this.treeRepresentation.DFS("before", function(treeNode) {
									treeNode.processInput();
									treeNode.processChildren();
								});
}

_p._destroyOldTree = function() {
	if (!this.treeRepresentation || !this.treeRepresentation.root) return;
	
	if (this.treeRepresentation.root.blockName === "begin_game") {
		this.removeEventListener();
	}
	else if (this.treeRepresentation.root.blockName === "keypress") {
		document.body.removeEventListener("keydown", this.keyPressHandler);
	}
	
	this.treeRepresentation.root = null;
	this.treeRepresentation = null;
}

_p.deactivate = function() {
	if (this.treeRepresentation && this.treeRepresentation.root) {
		
		this.treeRepresentation.DFS("after", function(treeNode) {
			treeNode.DOMElement._CodeBlockWrapper._deactivate();
		});
		
		this._destroyOldTree();
	}
}

//doar pentru debugging
_p._getIndexOfThisChain = function() {
	return GAME_REFERENCE.codeChains.indexOf(this);
}