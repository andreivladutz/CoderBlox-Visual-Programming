const BLOCK_NAMES = ["direction", "movement", "talking", "loop", "if", "ifelse", "stop", "keypress", "begin_game"];
const KEY_PRESS_CHARACTERS = ["w", "a", "s", "d", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"];

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

function validateNumberInput(el, codeChain) {
	if (parseFloat(el.value) != parseInt(el.value)) {
		reportInvalidCode(el, "Input value must be a natural number", codeChain);
		return false;
	}
	else if (parseInt(el.value) >= parseInt(el.min) && parseInt(el.value) <= parseInt(el.max)) {
		//in caz ca pana acum a fost input eronat
		el.classList.remove("erroneousStatement");
		el.removeAttribute("title");
		
		return true;
	}
	else {
		reportInvalidCode(el, "Input value must be between " + el.min + " and " + el.max, codeChain);
		return false;
	}
}

/*
	atunci cand avem o expresie vida sau input invalid
	la parsarea unui lant de blocuri de cod o raportam vizual
	si prevenim rularea lantului de cod
*/
function reportInvalidCode(DOMElement, message, codeChain) {
	DOMElement.classList.add("erroneousStatement");
	DOMElement.title = message;
	
	codeChain.preventFromRunning = true;
	LOGGER.error(message);
}

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
		
		if (this.game && this.game.DEBUGGING_CODE_CHAIN)
			this._indexOfCodeChain = this.codeChain._getIndexOfThisChain();
	}
	
	processInput() {}
}

_p = CodeBlockTreeNode.prototype;

/*
	pentru nodurile care nu declanseaza actiuni ce dureaza sa se termine
	emit event-ul de nod executat imediat
*/
_p.execute = function() {
	this.emit(NODE_EXECUTED_EVENT, null);
}

/*
	- primesc un array de DOMElements si in functie de tipul lor
	creez un nod de arbore adecvat
	- daca vreau sa pun nodurile copii in alt array, un al doilea 
	parametru whereToPlace este pus la dispozitie (folositor pt ifelse)
*/
_p.processChildren = function(children, whereToPlace) {
	//LOGGER.log(children);
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
	execute() {
		super.execute();
	}
	
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
		
		this.keyPressInputElement = this.DOMElement.getElementsByClassName("key")[0];
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
		this.game.emit("look", {
			direction : this.direction
		});
		
		if (this.game.DEBUGGING_CODE_CHAIN) {
			LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
			LOGGER.log("LOOKING " + this.direction);
		}
		
		super.execute();
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
		
		validateNumberInput(this.noOfStepsInputElement, this.codeChain);
	}
	
	execute() {
		this.game.emit("move", {
			direction : this.direction,
			noOfSteps : this.noOfSteps
		});
		
		if (this.game.DEBUGGING_CODE_CHAIN) {
			LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
			LOGGER.log("MOVING " +  this.direction + " a number of " + this.noOfSteps + " steps");
		}
		
		setTimeout(function(self) {
			self.emit(NODE_EXECUTED_EVENT, null);
		}, 2000, this);
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
		this.game.emit("talk", {
			speech : this.speech
		});
		
		if (this.game.DEBUGGING_CODE_CHAIN) {
			LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
			LOGGER.log("SAYING " + this.speech);
		}

		super.execute();
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
		
		//pastrez doar fii directi returnati de querySelector
		for (var i = children.length - 1; i >= 0 ; i--)
			if (children[i].parentElement !== this.DOMElement)
				children.splice(i, 1);
		
		super.processChildren(children);
	}
	
	processInput() {
		this.repetitions = parseInt(this.repetitionsInputElement.value);
		
		validateNumberInput(this.repetitionsInputElement, this.codeChain);
	}
	
	//executia consta intr-un DFS repetat de un numar de *repetitions* ori
	//si oprirea executiei DFS-ului principal care a a ajuns in acest nod
	execute() {
		if (this.game.DEBUGGING_CODE_CHAIN) {
			LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
			LOGGER.log("REPEATING FOR " + this.repetitions + " TIMES: ");
		}
		
		
		//creez un dummy node pe care sa rulez DFS-ul de executie al for-ului
		//inserez copiii for-ului in el
		var dummyTreeNode = new CodeBlockTreeNode(null, null, "");
		
		dummyTreeNode.execute = function() {
			this.emit(NODE_EXECUTED_EVENT, null);
		};
		
		for (var childNode of this.children) {
			dummyTreeNode.children.push(childNode);
		}
		
		var self = this;
		
		//DFS-ul la fel ca la arborele mare doar ca repetat	
		//pun referinta la iteratorul generatorului tot in dummyTreeNode
		DFSRunner(
			dummyTreeNode,
			this.codeChain.treeRepresentation,
			CodeChain.executionCallback,
			CodeChain.afterExecutionCallback, 
			dummyTreeNode,
			this.repetitions
		).then(
			function() {
				self.emit(NODE_EXECUTED_EVENT, null);
			},
			function(err) {
				LOGGER.error(err);
			}
		);
		
		this.codeChain.loopsGeneratorIterators.push(dummyTreeNode.generatorIterator);
		
		return STOP_SUBTREE_DFS;
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
		if (!this.leftOperandInputElement) {
			reportInvalidCode(this.DOMElement, "EMPTY OPERATOR NOT ALLOWED!", this.codeChain);
			return;
		}
		
		var leftOperandInputGrandparent = this.leftOperandInputElement.parentElement.parentElement,
			leftOperandInputGrandGrandparent = this.leftOperandInputElement.parentElement.parentElement.parentElement;
		
		if ((this.parent.blockName === "if" 
				&&  leftOperandInputGrandparent !== this.parent.DOMElement)
			|| (this.parent.blockName === "ifelse" 
				&& leftOperandInputGrandGrandparent !== this.parent.DOMElement)) {
			
			reportInvalidCode(this.DOMElement, "EMPTY OPERATOR NOT ALLOWED!", this.codeChain);
			return;
		}
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
			LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
			LOGGER.log (
				"THE EXPRESSION " + this.leftOperandString + " " + this.operatorString + " " + this.rightOperandString
			);
			LOGGER.log (
				"WHERE THE OPERATOR FUNCTION IS " + this.operatorFunction
			)
			LOGGER.log (
				"(" + this.leftOperand + " " + this.operatorString + " " + this.rightOperand + ")" +
				" EVALUATED AS " + this.operatorFunction()
			);
		}
		
		if (this.operatorFunction)
			return this.operatorFunction();
		else 
			throw new Error("EMPTY OPERATOR NOT ALLOWED!");
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
		var exprDOMElement = this.DOMElement.querySelectorAll(CodeChain.SELECTORS[this.blockName]["expression"])[0],
			expression = new Expression(this, exprDOMElement, "expression");;
		
		expression.processInput();
		
		return expression;
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
		
		//pastrez doar fii directi returnati de querySelector
		for (var i = children.length - 1; i >= 0 ; i--)
			if (children[i].parentElement !== this.DOMElement)
				children.splice(i, 1);
		
		super.processChildren(children);
	}
	
	execute() {
		/*
			daca expresia din if se evalueaza ca true
			DFS-ul ce "ruleaza" block chain-ul va continua
			pe copiii if-ului. altfel 
			executia nu mai continua in subarborele if-ului
		*/
		
		super.execute();
		
		try {
			var expressionEvaluation = this.expression.execute();
		}
		catch (err) {
			reportInvalidCode(this.expression.DOMElement, "EMPTY OPERATOR NOT ALLOWED!", this.codeChain);
			return STOP_DFS;
		}
		
		if (!expressionEvaluation) {
			if (this.game.DEBUGGING_CODE_CHAIN) {
				LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
				LOGGER.log("NOT EXECUTING THE IF BODY");
			}
			
			return STOP_SUBTREE_DFS;
		}
		else {
			if (this.game.DEBUGGING_CODE_CHAIN) {
				LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
				LOGGER.log("EXECUTING THE IF BODY");
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
		
		//pastrez doar fii directi returnati de querySelector
		for (var i = ifChildren.length - 1; i >= 0 ; i--)
			if (ifChildren[i].parentElement.parentElement !== this.DOMElement)
				ifChildren.splice(i, 1);
		
		for (var i = elseChildren.length - 1; i >= 0 ; i--)
			if (elseChildren[i].parentElement.parentElement !== this.DOMElement)
				elseChildren.splice(i, 1);
	
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
		
		super.execute();
		
		try {
			var expressionEvaluation = this.expression.execute();
		}
		catch (err) {
			reportInvalidCode(this.expression.DOMElement, "EMPTY OPERATOR NOT ALLOWED!", this.codeChain);
			return STOP_DFS;
		}
		
		if (!expressionEvaluation) {
			this.children = this.elseChildren;
			
			
			if (this.game.DEBUGGING_CODE_CHAIN) {
				LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
				LOGGER.log("EXECUTING THE ELSE BODY");
			}
		}
		else {
			this.children = this.ifChildren;
			
			if (this.game.DEBUGGING_CODE_CHAIN) {
				LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
				LOGGER.log("EXECUTING THE IF BODY");
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
			LOGGER.log("IN CODE CHAIN NO " + this._indexOfCodeChain + ":");
			LOGGER.log("STOPPING THE EXECUTION OF THE CURRENT CHAIN");
		}
		
		super.execute();
		
		return STOP_DFS;
	}
}