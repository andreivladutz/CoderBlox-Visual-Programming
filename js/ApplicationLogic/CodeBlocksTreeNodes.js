const BLOCK_NAMES = ["direction", "movement", "talking", "loop", "if", "ifelse", "stop", "keypress", "begin_game"];
const KEY_PRESS_CHARACTERS = ["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"];

var BLOCK_NAME_REGEXP = (function() {
	var arr = [];
	
	for (var name of BLOCK_NAMES) {
		arr.push(new RegExp("\\b" + name + "\\b"));
	}
	
	return arr;
})();

//obtin tipul exact al blocului de cod
function getBlockName(el) {
	for (var i = 0; i < BLOCK_NAME_REGEXP.length; i++)
		if (BLOCK_NAME_REGEXP[i].test(el.className))
			return BLOCK_NAMES[i];
};

/*
	primului nod dintr-un arbore ii vor trebui atribuite direct :
		-codeChain
		-game
*/
class CodeBlockTreeNode extends TreeNode {
	constructor(parent, element, blockName) {
		super(parent);
		
		this.DOMElement = element;
		this.blockName = blockName;
		
		//nodul curent este in acelasi lant de cod cu parintele sau
		this.codeChain = parent? parent.codeChain : null;
		this.game = parent? parent.game : null;
	}
	
	processInput() {}
}

_p = CodeBlockTreeNode.prototype;

/*
	- primesc un array de DOMElements si in functie de tipul lor
	creez un nod de arbore adecvat
	- daca vreau sa pun nodurile copii in alt array, un al doilea 
	parametru whereToPlace este pus la dispozitie (folositor pt ifelse)
*/
_p.processChildren = function(children, whereToPlace) {
	console.log(children);
	
	for (var child of children) {
		var name = getBlockName(child), newTreeNode;
		
		if (name === "direction")
			newTreeNode = new DirectionAction(this, child, name);
		else if (name === "movement")
			newTreeNode = new MovementAction(this, child, name);
		else if (name === "talking")
			newTreeNode = new TalkingAction(this, child, name);
		else if (name === "loop")
			newTreeNode = new Loop(this, child, name);
		else if (name === "if")
			newTreeNode = new IfConditional(this, child, name);
		else if (name === "ifelse")
			newTreeNode = new IfElseConditional(this, child, name);
		else if (name === "stop")
			newTreeNode = new Stop(this, child, name);
		
		if (whereToPlace) {
			whereToPlace.push(newTreeNode);
		}
		else {
			this.children.push(newTreeNode);
		}
	}
};

/***************
*  EVENIMENTE  *
***************/
class EventNode extends CodeBlockTreeNode {
	constructor(parent, element, blockName) {
		super(parent, element, blockName);
	}
	
	//event-ul in sine nu face nimic special
	execute() {}
	
	processChildren() {
		var children = Array.from(
			this.DOMElement.parentElement.querySelectorAll(CodeChain.SELECTORS["event"]["contained"])
		);
		
		//pastrez doar fratii directi returnati de querySelector
		for (var i = children.length - 1; i >= 0 ; i--)
			if (children[i].parentElement !== this.DOMElement.parentElement)
				children.splice(i, 1);
		
		super.processChildren(children);
	}
};

class KeyPressEvent extends EventNode {
	constructor(parent, element, blockName) {
		super(parent, element, blockName);
		
		this.keyPressInputElement = document.getElementsByName("key")[0];
		this.keyPress = "";
	}
	
	processInput() {
		this.keyPress = this.keyPressInputElement.value;
	}
}


/***************
*	 ACTIUNI   *
***************/
class ActionNode extends CodeBlockTreeNode {
	constructor(parent, element, blockName) {
		super(parent, element, blockName);
	}
	
	//actiunile nu mai contin alte blocuri de cod
	processChildren() {}
};

class DirectionAction extends ActionNode {
	constructor(parent, element, blockName) {
		super (parent, element, blockName);
		
		this.directionInputElement = this.DOMElement.getElementsByClassName("direction")[0];
		this.direction = "";
	}
	
	processInput() {
		this.direction = this.directionInputElement.value;
	}
	
	execute() {
		this.game.emit("look", this.direction);
		
		if (this.game.DEBUGGING_CODE_CHAIN)
			console.log("LOOKING " + this.direction);
	}
};

class MovementAction extends ActionNode {
	constructor(parent, element, blockName) {
		super (parent, element, blockName);
		
		this.directionInputElement = this.DOMElement.getElementsByClassName("direction")[0];
		this.direction = "";
		
		this.noOfStepsInputElement = this.DOMElement.getElementsByClassName("no_steps")[0];
		this.noOfSteps = 0;
	}
	
	processInput() {
		this.direction = this.directionInputElement.value;
		this.noOfSteps = parseInt(this.noOfStepsInputElement.value);
	}
	
	execute() {
		this.game.emit("move", {
			direction : this.direction,
			noOfSteps : this.noOfSteps
		});
		
		if (this.game.DEBUGGING_CODE_CHAIN)
			console.log("MOVING " +  this.direction + " a number of " + this.noOfSteps + " steps");
	}
};

class TalkingAction extends ActionNode {
	constructor(parent, element, blockName) {
		super (parent, element, blockName);
		
		this.speechInputElement = this.DOMElement.getElementsByClassName("speech")[0];
		this.speech = "";
	}
	
	processInput() {
		this.speech = this.speechInputElement.value;
	}
	
	execute() {
		this.game.emit("talk", this.speech);
		
		if (this.game.DEBUGGING_CODE_CHAIN)
			console.log("SAYING " + this.speech);
	}
};

/***************
*	  LOOP     *
***************/
class Loop extends CodeBlockTreeNode {
	constructor(parent, element, blockName) {
		super(parent, element, blockName);
		
		this.repetitionsInputElement = this.DOMElement.getElementsByClassName("loop_input")[0];
		this.repetitions = 0;
	}
	
	processChildren() {
		var children = Array.from(
			this.DOMElement.querySelectorAll(CodeChain.SELECTORS["loop"]["contained"])
		);
		console.log ("FOUND LOOP CHILDREN :");
		console.log (children);
		
		//pastrez doar fii directi returnati de querySelector
		for (var i = children.length - 1; i >= 0 ; i--)
			if (children[i].parentElement !== this.DOMElement)
				children.splice(i, 1);
		
		console.log ("AFTER LOOP CHILDREN :");
		console.log (children);
		
		super.processChildren(children);
	}
	
	processInput() {
		this.repetitions = parseInt(this.repetitionsInputElement.value);
	}
	
	//executia consta intr-un DFS repetat de un numar de *repetitions* ori
	//si oprirea executiei DFS-ului principal care a a ajuns in acest nod
	execute() {
		if (this.game.DEBUGGING_CODE_CHAIN)
			console.log("REPEATING FOR " + this.repetitions + " TIMES: ");
		
		for (var i = 0; i < this.repetitions; i++) {
			for (var childNode of this.children) {
				//DFS-ul la fel ca la arborele mare doar ca repetat
				this.codeChain.treeRepresentation.DFS(
					this.codeChain.executionCallback, childNode);
			}
		}
		
		return STOP_DFS;
	}
};

/***************
*  EXPRESSION  *
***************/
class Expression extends CodeBlockTreeNode {
	constructor(parent, element, blockName) {
		super(parent, element, blockName);
		
		this.leftOperandInputElement = this.DOMElement.getElementsByClassName("left_operand")[0];
		this.leftOperandString = "";
		this.leftOperand = NaN;
		
		this.rightOperandInputElement = this.DOMElement.getElementsByClassName("right_operand")[0];
		this.rightOperandString = "";
		this.rightOperand = NaN;
		
		this.operatorInputElement = this.DOMElement.getElementsByClassName("operator")[0];
		this.operatorString = "";
		this.operatorFunction = null;;
	}
	
	processInput() {
		this.leftOperandString = this.leftOperandInputElement.value;
		this.rightOperandString = this.rightOperandInputElement.value;
		this.operatorString = this.operatorInputElement.value;
		
		var funcExpr;
		/*
			initializam evaluarea diferit in functie de valoarea operatorului
		*/
		if (this.operatorString === "<")
			funcExpr = function() {
				return this.leftOperand < this.rightOperand;
			}
		else if (this.operatorString === ">")
			funcExpr = function() {
				return this.leftOperand > this.rightOperand;
			}
		else if (this.operatorString === "<=")
			funcExpr = function() {
				return this.leftOperand <= this.rightOperand;
			}
		else if (this.operatorString === ">=")
			funcExpr = function() {
				return this.leftOperand >= this.rightOperand;
			}
			
		this.operatorFunction = funcExpr;
	}
	
	//execute va returna true sau fals in functie de evaluarea expresiei
	execute() {
		if (this.leftOperandString === "left-border")
			this.leftOperand = 0;
		else if (this.leftOperandString === "right-border")
			this.leftOperand = 100;
		else if (this.leftOperandString === "top-border")
			this.leftOperand = 0;
		else if (this.leftOperandString === "bottom-border")
			this.leftOperand = 100;
		
		if (this.rightOperandString === "left-border")
			this.rightOperand = 0;
		else if (this.rightOperandString === "right-border")
			this.rightOperand = 100;
		else if (this.rightOperandString === "top-border")
			this.rightOperand = 0;
		else if (this.rightOperandString === "bottom-border")
			this.rightOperand = 100;
		
		if (this.game.DEBUGGING_CODE_CHAIN) {
			console.log (
				"THE EXPRESSION " + this.leftOperandString + " " + this.operatorString + " " + this.rightOperandString
			);
			console.log (
				"WHERE THE OPERATOR FUNCTION IS" + this.operatorFunction
			)
			console.log (
				"(" + this.leftOperand + " " + this.operatorString + " " + this.rightOperand + ")" +
				" EVALUATED AS " + this.operatorFunction()
			);
		}
		
		return this.operatorFunction();
	}
};

/***************
* CONDITIONALS *
***************/
class ConditionalNode extends CodeBlockTreeNode {
	constructor(parent, element, blockName) {
		super(parent, element, blockName);
	
		this.expression = this.initExpression();
	}
	
	initExpression() {
		var exprDOMElement = this.DOMElement.querySelectorAll(CodeChain.SELECTORS[this.blockName]["expression"])[0];
		return new Expression(this, exprDOMElement, "expression");
	}
};

class IfConditional extends ConditionalNode {
	constructor(parent, element, blockName) {
		super(parent, element, blockName);
	}
		
	processChildren() {
		var children = Array.from(
			this.DOMElement.querySelectorAll(CodeChain.SELECTORS["if"]["contained"])
		);
		
		console.log ("FOUND MAINIF CHILDREN :");
		console.log (children);
		
		//pastrez doar fii directi returnati de querySelector
		for (var i = children.length - 1; i >= 0 ; i--)
			if (children[i].parentElement !== this.DOMElement)
				children.splice(i, 1);
		
		console.log ("AFTER MAINIF CHILDREN :");
		console.log (children);
		
		super.processChildren(children);
	}
	
	execute() {
		/*
			daca expresia din if se evalueaza ca true
			DFS-ul ce "ruleaza" block chain-ul va continua
			pe copiii if-ului. altfel 
			executia nu mai continua in subarborele if-ului
		*/
		if (!this.expression.execute()) {
			if (this.game.DEBUGGING_CODE_CHAIN) {
				console.log("NOT EXECUTING THE IF BODY");
			}
			
			return STOP_DFS;
		}
		else {
			if (this.game.DEBUGGING_CODE_CHAIN) {
				console.log("EXECUTING THE IF BODY");
			}
		}
	}
};

class IfElseConditional extends ConditionalNode {
	constructor(parent, element, blockName) {
		super(parent, element, blockName);
			
		this.ifChildren = [];
		this.elseChildren = [];
	}
		
	processChildren() {
		var ifChildren = Array.from(
			this.DOMElement.querySelectorAll(CodeChain.SELECTORS["ifelse"]["if"])
		),
			elseChildren = Array.from(
			this.DOMElement.querySelectorAll(CodeChain.SELECTORS["ifelse"]["else"])
		);
		
		console.log ("FOUND IF CHILDREN :");
		console.log (ifChildren);
		
		console.log ("FOUND ELSE CHILDREN :");
		console.log (elseChildren);
		
		//pastrez doar fii directi returnati de querySelector
		for (var i = ifChildren.length - 1; i >= 0 ; i--)
			if (ifChildren[i].parentElement.parentElement !== this.DOMElement)
				ifChildren.splice(i, 1);
		
		for (var i = elseChildren.length - 1; i >= 0 ; i--)
			if (elseChildren[i].parentElement.parentElement !== this.DOMElement)
				elseChildren.splice(i, 1);
		
		console.log ("AFTER IF CHILDREN :");
		console.log (ifChildren);
		
		console.log ("AFTER ELSE CHILDREN :");
		console.log (elseChildren);
		
		super.processChildren(ifChildren, this.ifChildren);
		super.processChildren(elseChildren, this.elseChildren);
		
		this.children = this.ifChildren.concat(this.elseChildren);
	}
	
	execute() {
		/*
			daca expresia din if se evalueaza ca true
			DFS-ul ce "ruleaza" block chain-ul va continua
			pe copiii if-ului. altfel 
			executia va continua pe copiii else-ului
		*/
		if (!this.expression.execute()) {
			this.children = this.elseChildren;
			
			
			if (this.game.DEBUGGING_CODE_CHAIN) {
				console.log("EXECUTING THE ELSE BODY");
			}
		}
		else {
			this.children = this.ifChildren;
			
			if (this.game.DEBUGGING_CODE_CHAIN) {
				console.log("EXECUTING THE IF BODY");
			}
		}
	}
};

/*******
* STOP *
*******/
class Stop extends CodeBlockTreeNode {
	constructor(parent, element, blockName) {
		super(parent, element, blockName);
	}
	
	//nu are copii
	processChildren() {}
	
	//DFS-ul de executie va fi oprit
	execute() {
		if (this.game.DEBUGGING_CODE_CHAIN) {
			console.log("STOPPING THE EXECUTION OF THE CURRENT CHAIN");
		}
		return STOP_DFS;
	}
}