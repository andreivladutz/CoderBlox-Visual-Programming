class CodeBlock extends InputHandler {
	constructor(DOMElement, type) {
		super(DOMElement);
		this.DOMElement = DOMElement;
		
		this.blockType = type;
		this._movable = false;
		this._neverMoved = true;
		
		this.addListeners();
		this.allowDomDefaultOnChildern(["select", "input"]);
	}
}

_p = CodeBlock.prototype;

_p.addListeners = function() {
	this.on("down", this._startDragging.bind(this));
	this.on("up", this._endDragging.bind(this));
	this.on("move", this._updateDragging.bind(this));
};

_p._clone = function() {
	var clonedEl = this.DOMElement.cloneNode(true);
	
	return new CodeBlock(clonedEl, this.blockType);
};

_p._makeElementMovable = function(e) {
	if (this._movable) return;
	
	this._movable = true;
	
	var rect = this.DOMElement.getBoundingClientRect();
	
	this.DOMElement.style.position = "absolute";
	this.DOMElement.style.zIndex = "1000";
	this.DOMElement.style.top = rect.top + "px";
	this.DOMElement.style.left = rect.left + "px";
	
	document.body.appendChild(this.DOMElement);
};

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
	
	console.log("END");
}; 

_p._updateDragging = function(e) {
	
	console.log("UPDATE");
}; 