const DROPPABLE_ZONE_ID = "dragandrop-zone";

class CodeBlock extends InputHandler {
	constructor(DOMElement, type) {
		super(DOMElement);
		this.DOMElement = DOMElement;
		//pentru a fi usor sa obtin obiectul wrapper
		//stiind doar elementul dom
		this.DOMElement._CodeBlockWrapper = this;
		
		if (!CodeBlock.DROPPABLE_ZONE)
			CodeBlock.DROPPABLE_ZONE = document.getElementById(DROPPABLE_ZONE_ID);
		
		if (!CodeBlock.DROPPABLE_ZONE_COLOR) {
			CodeBlock.DROPPABLE_ZONE_COLOR = 
				window.getComputedStyle(CodeBlock.DROPPABLE_ZONE).backgroundColor;
		}
		
		this.blockType = type;
		this._movable = false;
		this._neverMoved = true;
		
		//pozitia initiala a pointerului pe element cand se incepe dragging-ul
		this._initialPointerOffset = null;
		
		this.addListeners();
		//permit click si mousemove pentru selectie pe inputurile si selectiile din element
		this.allowDomDefaultOnChildern(["select", "input"]);
		
		//retin blocurile atasate de blocul curent
		this.beforeBlocks = [];
		this.insideBlocks = [];
		this.afterBlocks = [];
	}
}

CodeBlock.CONCATENATION_DISTANCE_THRESHOLD = 10;

_p = CodeBlock.prototype;

//listenerele custom
_p.addListeners = function() {
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
		if (el) {
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
		if (belowElement === CodeBlock.DROPPABLE_ZONE)
			return true;
		
		belowElement = belowElement.parentElement;
	}
	return false;
}

/*
	inceputul drag-ului
*/
_p._makeElementMovable = function(e) {
	if (this._movable) return;
	
	this._movable = true;
	
	var rect = this.DOMElement.getBoundingClientRect();
	
	this._initialPointerOffset = {
		x : e.detail.x - rect.left,
		y : e.detail.y - rect.top
	}
	
	this.DOMElement.style.position = "absolute";
	this.DOMElement.style.zIndex = "1000";
	this.DOMElement.style.top = rect.top + "px";
	this.DOMElement.style.left = rect.left + "px";
	
	document.body.appendChild(this.DOMElement);
};

/*
	sfarsitul drag-ului daca avem unde sa facem drop
	howToInsert = "above", "below", "replace" sau "append"
	element = elementul fata de care se face insertia
*/
_p._makeElementUnmovable = function(e, howToInsert, element) {
	if (!this._movable) return;
	
	this._movable = false;
	
	this.DOMElement.style.position = "";
	this.DOMElement.style.zIndex = "";
	this.DOMElement.style.top = "";
	this.DOMElement.style.left = "";
	
	var parent = element.parentNode;
	
	if (howToInsert == "above")
		parent.insertBefore(this.DOMElement, element);
	else if (howToInsert == "below") {
		var nextSibling = element.nextElementSibling;
		parent.insertBefore(this.DOMElement, nextSibling);
	}
	else if (howToInsert == "replace")
		parent.replaceChild(this.DOMElement, element);
	else if (howToInsert == "append")
		element.appendChild(this.DOMElement);
	
	//partea "goala" trebuie sa fie de culoarea fundalului
	var emptyBlocks = this.DOMElement.getElementsByClassName("empty");
	
	for (var empty of emptyBlocks)
		empty.style.backgroundColor = CodeBlock.DROPPABLE_ZONE_COLOR;
}

//daca elementul este drag-uit pe zona de lucru
_p._attachToDroppableZone = function(e) {
	var dropRect = CodeBlock.DROPPABLE_ZONE.getBoundingClientRect(),
		top = e.detail.y - dropRect.top - this._initialPointerOffset.y,
		left = e.detail.x - dropRect.left - this._initialPointerOffset.x;
	
	top = Math.max(top, 0);
	left = Math.max(left, 0);
	
	this.DOMElement.style.position = "absolute";
	
	this.DOMElement.style.top = top + "px";
	this.DOMElement.style.left = left + "px";
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

_p._startDragging = function(e) {
	if (this._neverMoved) {
		this._neverMoved = false;
		var newBlock = this._clone();
		
		var el = this.DOMElement;
		el.parentElement.appendChild(newBlock.DOMElement);
	}
	
	this._makeElementMovable(e);
}; 

_p._endDragging = function(e) {
	if (!this._movable) return;
	
	var elUnderDrag = this._getElementsUnderDrag(e);
	
	var blocksUnderDrag = {
		inside : this._getCodeBlockFromChild(elUnderDrag.inside),	
		above : this._getCodeBlockFromChild(elUnderDrag.above),	
		below : this._getCodeBlockFromChild(elUnderDrag.below)	
	};
	
	console.log(elUnderDrag);
	console.log(blocksUnderDrag);
	
	if (this._inDroppableZone(e) && elUnderDrag.inside) {
		//blocul de sub element este .empty sau .expression
		if (/\bempty\b/.test(elUnderDrag.inside.className) && this._checkBlockCompatibility("inside", blocksUnderDrag.inside)) {
			this._makeElementUnmovable(e, "replace", elUnderDrag.inside);
		}
		
		else if (/expression/.test(elUnderDrag.inside.className) && this.blockType === "expression") {
			this._makeElementUnmovable(e, "replace", elUnderDrag.inside);
		}

		
		else {
			this._makeElementUnmovable(e, "append", CodeBlock.DROPPABLE_ZONE);
			this._attachToDroppableZone(e);
		}
	}
	else 
		this._deactivate();
}; 

_p._updateDragging = function(e) {
	var elUnderDrag = this._getElementsUnderDrag(e);
	
	var blocksUnderDrag = {
		inside : this._getCodeBlockFromChild(elUnderDrag.inside),	
		above : this._getCodeBlockFromChild(elUnderDrag.above),	
		below : this._getCodeBlockFromChild(elUnderDrag.below)	
	};
	
	blocksUnderDrag.inside = blocksUnderDrag.inside? blocksUnderDrag.inside.blockType : null;
	blocksUnderDrag.above = blocksUnderDrag.above? blocksUnderDrag.above.blockType : null;
	blocksUnderDrag.below = blocksUnderDrag.below? blocksUnderDrag.below.blockType : null;
	
	console.log(elUnderDrag);
	console.log(blocksUnderDrag);
	
	this.DOMElement.style.left = e.detail.x - this._initialPointerOffset.x + "px";
	this.DOMElement.style.top = e.detail.y - this._initialPointerOffset.y + "px";
}; 