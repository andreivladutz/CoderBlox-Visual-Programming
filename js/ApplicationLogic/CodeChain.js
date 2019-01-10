class CodeChain extends EventEmiter {
	constructor(DOMElement) {
		super(DOMElement);
		this.containerElement = DOMElement;
		
		this.treeRepresentation = null;
	}
	
}

_p = CodeChain.prototype;

/*
	daca primul element din chain nu este un event nu are sens
	sa il parsam deoarece acest chain nu se va executa niciodata
*/
_p.parseTree = function() {
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
	}
	else if (eventName === "keypress") {
		this.treeRepresentation.root = new KeyPressEvent(null, firstCodeBlock, "keypress");
	}
	
	this.treeRepresentation.root.codeChain = this;
	this.treeRepresentation.root.game = GAME_REFERENCE;
	
	this.treeRepresentation.DFS(function(treeNode) {
									treeNode.processInput();
									treeNode.processChildren();
								});
}