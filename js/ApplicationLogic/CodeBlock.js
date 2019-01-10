const DROPPABLE_ZONE_ID = "dragandrop-zone";

class CodeBlock extends InputHandler {
	constructor(DOMElement, type) {
		super(DOMElement);
		this.DOMElement = DOMElement;
		//pentru a fi usor sa obtin obiectul wrapper
		//stiind doar elementul dom
		this.DOMElement._CodeBlockWrapper = this;
		
		//orice block chain este wrapp-uit intr-un div parinte
		//ce va fi folosit sa mutam tot block chain-ul
		this.DOMWrapper = null;
		
		if (!CodeBlock.DROPPABLE_ZONE)
			CodeBlock.DROPPABLE_ZONE = document.getElementById(DROPPABLE_ZONE_ID);
		
		if (!CodeBlock.DROPPABLE_ZONE_COLOR) {
			CodeBlock.DROPPABLE_ZONE_COLOR = 
				window.getComputedStyle(CodeBlock.DROPPABLE_ZONE).backgroundColor;
		}
		
		this.blockType = type;
		this._startedMoving = false;
		this._neverMoved = true;
		
		this._movable = false;
		this._draggingWholeChain = false;
		this._wholeChainDraggable = false;
		
		//pozitia initiala a pointerului pe element cand se incepe dragging-ul
		this._initialPointerOffset = null;
		
		this.addListeners();
		
		//retin blocurile atasate de blocul curent
		this.parentBlock = null;
		this.belowBlock = null;
		this.aboveBlock = null;
	}
}

CodeBlock.CONCATENATION_DISTANCE_THRESHOLD = 10;

_p = CodeBlock.prototype;

//listenerele custom
_p.addListeners = function() {
	//permit click si mousemove pentru selectie pe inputurile si selectiile din element
	this.allowDomDefaultOnChildern(["select", "input"]);
	
	this.on("down", this._startDragging.bind(this));
	this.on("up", this._endDragging.bind(this));
	this.on("move", this._updateDragging.bind(this));
};

//stergem elementul si listenerele
_p._deactivate = function() {
	this.removeEventListener();
	this.DOMElement.parentElement.removeChild(this.DOMElement);
}

//clonez elementul DOM si obiectul pentru a-l inlocui 
//pe cel selectat care va fi "dragg-uit"
_p._clone = function() {
	var clonedEl = this.DOMElement.cloneNode(true);
	
	return new CodeBlock(clonedEl, this.blockType);
};

//ascund el temporar pentru a obtine elementul de sub el
_p._getElementUnderPoint = function(x, y) {
	this.DOMElement.style.display = "none";
	var el = document.elementFromPoint(x, y);
	this.DOMElement.style.display = "";
	
	return el;
}

/*
	aboveOrBelow va fi "top" pentru above
	sau "bottom" pentru below
*/
_p._findAboveBelowElement = function(x, y, aboveOrBelow) {
	var elBelow = null;
	
	for (
		var threshold = - CodeBlock.CONCATENATION_DISTANCE_THRESHOLD;
		threshold <= CodeBlock.CONCATENATION_DISTANCE_THRESHOLD;
		threshold++) {
	
		var el = this._getElementUnderPoint(x, y + threshold);
		
		//am gasit un element la distanta <= 5px de elementul curent
		if (el && (el = this._getCodeBlockFromChild(el))) {
			el = el.DOMElement;
			//verific daca distanta e relativa la partea de sus/jos a elementului gasit
			var foundY = el.getBoundingClientRect()[aboveOrBelow];

			if (Math.abs(foundY - y) <= CodeBlock.CONCATENATION_DISTANCE_THRESHOLD)
				return el;
		}
	}
	
	return null;
}

//pentru a verifica daca pot face drop in locul curent
_p._getElementsUnderDrag = function(e) {
	var leftCornerCoords = {
		x : e.detail.x - this._initialPointerOffset.x,
		y : e.detail.y - this._initialPointerOffset.y
	}, 
		position = {};
	
	position.inside = this._getElementUnderPoint(leftCornerCoords.x, leftCornerCoords.y);
	position.above = this._findAboveBelowElement(leftCornerCoords.x, leftCornerCoords.y, "top");
	position.below = this._findAboveBelowElement(leftCornerCoords.x, leftCornerCoords.y, "bottom");
	
	return position;
}

//verificam daca ne aflam in zona de lucru
_p._inDroppableZone = function(e) {
	var leftCornerCoords = {
		x : e.detail.x - this._initialPointerOffset.x,
		y : e.detail.y - this._initialPointerOffset.y
	};
	
	var belowElement = this._getElementUnderPoint(leftCornerCoords.x, leftCornerCoords.y);
	
	while (belowElement) {
		if (belowElement === CodeBlock.DROPPABLE_ZONE) {
			return true;
		}
		
		belowElement = belowElement.parentElement;
	}
	
	return false;
}

_p._computeInitialPickup = function(e) {
	var rect = this.DOMElement.getBoundingClientRect();
	
	this._initialPointerOffset = {
		x : e.detail.x - rect.left,
		y : e.detail.y - rect.top
	}
	
	return rect;
}

/*
	inceputul drag-ului
*/
_p._makeElementMovable = function(e) {
	if (this._startedMoving) return;
	
	this._startedMoving = true;
	
	var rect = this._computeInitialPickup(e),
		above = this.aboveBlock,
		below = this.belowBlock;
	
	//cand scot elementul dintr-o lista concatenata de blocuri
	//trebuie sa ma asiguri ca acestea continua sa pointeze corect la vecini
	above && (above.belowBlock = below);
	below && (below.aboveBlock = above);
	
	if (this.blockType === "expression" && this.parentBlock !== null) {
		var emptyExpr = document.createElement("div");
		emptyExpr.className = "code_block expression empty_expression";
		
		this.DOMElement.parentElement.replaceChild(emptyExpr, this.DOMElement);
	}
	else if (above === null && below === null && this.parentBlock !== null) {
		var emptyDiv = document.createElement("div");
		emptyDiv.className = "empty";
		emptyDiv.style.backgroundColor = CodeBlock.DROPPABLE_ZONE_COLOR;
		
		this.DOMElement.parentElement.replaceChild(emptyDiv, this.DOMElement);
	}
	
	this.aboveBlock = null;
	this.belowBlock = null;
	this.parentBlock = null;
	
	this.DOMElement.style.position = "absolute";
	this.DOMElement.style.zIndex = "1000";
	this.DOMElement.style.top = rect.top + "px";
	this.DOMElement.style.left = rect.left + "px";
	
	//am scos elementul din wrapper-ul DOM daca este cazul
	document.body.appendChild(this.DOMElement);
	
	//daca wrapper-ul ramane gol
	if (this.DOMWrapper && this.DOMWrapper.children.length == 0)
		this.DOMWrapper.parentElement.removeChild(this.DOMWrapper);
	
	this.DOMWrapper = null;
};

/*
	sfarsitul drag-ului daca avem unde sa facem drop
	howToInsert = "above", "below", sau "replace"
	element = elementul fata de care se face insertia
*/
_p._makeElementUnmovable = function(e, howToInsert, element) {
	if (!this._startedMoving) return;
	
	this._startedMoving = false;
	
	this.DOMElement.style.position = "";
	this.DOMElement.style.zIndex = "";
	this.DOMElement.style.top = "";
	this.DOMElement.style.left = "";
	
	if (howToInsert) {
		var parent = element.parentNode,
			boxedElement = element._CodeBlockWrapper,
			//loop, if primul caz, al doilea caz ifelse
			boxedParent = (element.parentElement._CodeBlockWrapper || element.parentElement.parentElement._CodeBlockWrapper);

		if (howToInsert == "above") {
			parent.insertBefore(this.DOMElement, element);

			//introduc elementul curent deasupra altui element
			//deci elementul curent va avea dedesubt acest element
			this.belowBlock = boxedElement;
			
			//cel deasupra caruia introduc noul element
			//putea avea alt element deasupra inainte
			this.oldAbove = boxedElement.aboveBlock;
			this.aboveBlock = this.oldAbove;
			this.oldAbove && (this.oldAbove.belowBlock = this);

			//vechiul element va avea deasupra elementul curent
			boxedElement.aboveBlock = this;

			if (boxedParent)
				this.parentBlock = boxedParent;
			else {
				//daca nu avem boxedParent inseamna ca avem block chaining
				//si parintele elementului deasupra caruia inseram este divul wrapper
				this.DOMElement.style.display = "block";
				this.DOMWrapper = boxedElement.DOMWrapper;
			}
		}
		else if (howToInsert == "below") {
			var nextSibling = element.nextElementSibling;
			parent.insertBefore(this.DOMElement, nextSibling);

			//simetric cazului anterior
			this.aboveBlock = boxedElement;
			
			this.oldBelow = boxedElement.belowBlock;
			this.belowBlock = this.oldBelow;
			this.oldBelow && (this.oldBelow.aboveBlock = this);

			boxedElement.belowBlock = this;

			if (boxedParent)
				this.parentBlock = boxedParent;
			else {
				this.DOMElement.style.display = "block";
				this.DOMWrapper = boxedElement.DOMWrapper;
			}
		}
		else if (howToInsert == "replace") {
			parent.replaceChild(this.DOMElement, element);
			
			if (boxedElement)
				boxedElement.parentBlock = null;
			
			//setez parintele bloc pe fostul parinte al elementului
			//sau pe parintele parintelui(in cazul ifelse)
			this.parentBlock = (parent._CodeBlockWrapper || parent.parentElement._CodeBlockWrapper);
		}
	}
	
	//partea "goala" trebuie sa fie de culoarea fundalului
	var emptyBlocks = this.DOMElement.getElementsByClassName("empty");
	
	for (var empty of emptyBlocks)
		empty.style.backgroundColor = CodeBlock.DROPPABLE_ZONE_COLOR;
}

_p._dropDOMWrapperToDroppableZone = function(e) {
	var dropRect = CodeBlock.DROPPABLE_ZONE.getBoundingClientRect(),
		top = e.detail.y - dropRect.top - this._initialPointerOffset.y,
		left = e.detail.x - dropRect.left - this._initialPointerOffset.x;
	
	this.DOMWrapper.style.position = "absolute";
	
	this.DOMWrapper.style.top = top + "px";
	this.DOMWrapper.style.left = left + "px";
	
	CodeBlock.DROPPABLE_ZONE.appendChild(this.DOMWrapper);
}

//daca elementul este drag-uit pe zona de lucru
_p._attachToDroppableZone = function(e) {
	//de fiecare data cand atasam un bloc la droppable zone este creat un
	//div wrapper ca in caz de chaining toate blocurile sa stea grupate
	var codeElementWrapper = document.createElement("div");
	codeElementWrapper.appendChild(this.DOMElement);
	this.DOMWrapper = codeElementWrapper;
	
	this._dropDOMWrapperToDroppableZone(e);
	
	this.DOMElement.style.display = "block";
}

/*
	verific daca blocul curent este compatibil fata de alt bloc
	typeOfCompatibilty = "above", "below" sau "inside"
*/
_p._checkBlockCompatibility = function(typeOfCompatibilty, otherBlock) {
	//cu acest regexp verificam daca tipul blocului curent se afla printre
	//tipurile de blocuri acceptate de celalalt bloc
	var regEx = new RegExp(this.blockType),
		compatibleTypes = CodeBlock.COMPATIBILITY_RULES[otherBlock.blockType][typeOfCompatibilty].join(" ");
	
	//sirul compatibleTypes este vid
	if (typeOfCompatibilty === "inside" && !compatibleTypes)
		return true;
	
	return regEx.test(compatibleTypes);
	
	return false;
}

/*
	functia primeste un element dom si daca este fiu al
	unui bloc de cod returneaza wrapper-ul blocului de cod,
	
	daca nu returneaza null
*/
_p._getCodeBlockFromChild = function(el) { 
	while (el) {
		if (el._CodeBlockWrapper)
			return el._CodeBlockWrapper;
		
		el = el.parentElement;
	}
	
	return null;
}

_p._bubbleToParrent = function(e) {
	if (this.parentBlock)
		this.parentBlock.emit("up", e.detail);
}

_p._startDragging = function(e) {
	//elementul este primul dintr-un block chain
	//cand il draguim nu vrem sa se miste doar el ci tot chain-ul
	if (this.DOMWrapper 
		&& this.DOMWrapper.firstElementChild === this.DOMElement
	    && this.DOMWrapper.children.length > 1) {
		
		this._wholeChainDraggable = true;
	}
	else {
		//elementul are potentialul de a se misca
		//dar nu aplicam logica de inceput de miscare decat
		//dupa ce am observat primul event de tipul miscare
		this._movable = true;
	}
}; 

_p._endDragging = function(e) {
	//elementul pierde potentialul de a se misca
	this._movable = false;
	this._wholeChainDraggable = false;
	
	if (!this._draggingWholeChain && !this._startedMoving)
		this._bubbleToParrent(e);
	
	if (this._draggingWholeChain) {
		this.DOMWrapper.style.display = "none";
		if (this._inDroppableZone(e)) {
			this.DOMWrapper.style.display = "";
			this._dropDOMWrapperToDroppableZone(e);	
		}
		else {
			this.DOMWrapper.parentElement.removeChild(this.DOMWrapper);
		}
			
		this._draggingWholeChain = false;
	}
	
	if (!this._startedMoving) return;
	
	var elUnderDrag = this._getElementsUnderDrag(e);
	
	var blocksUnderDrag = {
		inside : this._getCodeBlockFromChild(elUnderDrag.inside),	
		above : this._getCodeBlockFromChild(elUnderDrag.above),	
		below : this._getCodeBlockFromChild(elUnderDrag.below)	
	};
	
	this._printDetailsOnDebugging(e);
	
	if (this._inDroppableZone(e) && elUnderDrag.inside) {
		//blocul de sub element este .empty sau .expression
		if (/\bempty\b/.test(elUnderDrag.inside.className) && this._checkBlockCompatibility("inside", blocksUnderDrag.inside)) {
			this._makeElementUnmovable(e, "replace", elUnderDrag.inside);
		}
		
		else if (/expression/.test(elUnderDrag.inside.className) && this.blockType === "expression") {
			this._makeElementUnmovable(e, "replace", elUnderDrag.inside);
		}

		/*
			daca sunt direct deasupra droppable zone
			sau sunt in interiorul unui bloc compatibil cu cel curent
			sau inside-ul este gol (a.k.a. nu este un bloc care contine alte blocuri)
		*/
		else if (elUnderDrag.inside === CodeBlock.DROPPABLE_ZONE 
					|| this._checkBlockCompatibility("inside", blocksUnderDrag.inside)
					|| (blocksUnderDrag.inside && CodeBlock.COMPATIBILITY_RULES[blocksUnderDrag.inside.blockType]["inside"].length == 0)) {
			//sunt deasupra unui bloc si am compatibilitate cu el
			//de asemenea, daca blocul deasupra caruia ma situez are un bloc deasupra la randul lui
			//trebuie sa verific compatibilitatea de "below" cu blocul de deasupra
			if (blocksUnderDrag.above 
				&& this._checkBlockCompatibility("above", blocksUnderDrag.above) 
				&& (blocksUnderDrag.above.aboveBlock == null 
					|| this._checkBlockCompatibility("below", blocksUnderDrag.above.aboveBlock))) {
				
				this._makeElementUnmovable(e, "above", blocksUnderDrag.above.DOMElement);
			}
			
			//simetric cazului anterior
			else if (blocksUnderDrag.below 
				&& this._checkBlockCompatibility("below", blocksUnderDrag.below) 
				&& (blocksUnderDrag.below.belowBlock == null 
					|| this._checkBlockCompatibility("above", blocksUnderDrag.below.belowBlock))) {
				
				this._makeElementUnmovable(e, "below", blocksUnderDrag.below.DOMElement);
			}
			
			else {
				this._makeElementUnmovable();
				this._attachToDroppableZone(e);
			}
		}
		else {
			this._makeElementUnmovable();
			this._attachToDroppableZone(e);
		}
	}
	else 
		this._deactivate();
}; 

_p._updateDragging = function(e) {
	if (!this._wholeChainDraggable && !this._movable) return;
	
	if (this._movable && !this._startedMoving) {
		//prima data cand se misca elementul este atunci cand il 
		//selectam din meniu sa-l draguim in zona de lucru
		//copiem elementul si il punem in locul celui pe care il mutam
		if (this._neverMoved) {
			this._neverMoved = false;
			var newBlock = this._clone();

			var el = this.DOMElement;
			el.parentElement.appendChild(newBlock.DOMElement);
		}

		this._makeElementMovable(e);
	}
	
	if (this._wholeChainDraggable && !this._draggingWholeChain) {
		this._draggingWholeChain = true;
		
		this._computeInitialPickup(e);
		document.body.appendChild(this.DOMWrapper);
		
		this.DOMWrapper.style.zIndex = "999";
	}
	
	if (this._draggingWholeChain) {
		this.DOMWrapper.style.left =  e.detail.x - this._initialPointerOffset.x + "px";
		this.DOMWrapper.style.top = e.detail.y - this._initialPointerOffset.y + "px";
	}
	else {
		this._printDetailsOnDebugging(e);
		this.DOMElement.style.left = e.detail.x - this._initialPointerOffset.x + "px";
		this.DOMElement.style.top = e.detail.y - this._initialPointerOffset.y + "px";
	}
};

_p._printDetailsOnDebugging = function(e) {
	if (!GAME_REFERENCE.DEBUGGING_DRAG_AND_DROP) return;
	
	var elUnderDrag = this._getElementsUnderDrag(e);
	
	var blocksUnderDrag = {
		inside : this._getCodeBlockFromChild(elUnderDrag.inside),	
		above : this._getCodeBlockFromChild(elUnderDrag.above),	
		below : this._getCodeBlockFromChild(elUnderDrag.below)	
	};
	
	var blocksNames = {
		inside : blocksUnderDrag.inside? blocksUnderDrag.inside.blockType : null,
		above : blocksUnderDrag.above? blocksUnderDrag.above.blockType : null,
		below : blocksUnderDrag.below? blocksUnderDrag.below.blockType : null
	}
	
	console.log("DOM ELEMENTS UNDER DRAG:");
	console.log(elUnderDrag);
	
	console.log("CODE BLOCKS UNDER DRAG:");
	console.log(blocksUnderDrag);
	
	console.log("CODE BLOCKS NAMES UNDER DRAG:");
	console.log(blocksNames);
}