class Game extends EventEmiter {
	constructor() {
		super();
		
		this.DEBUGGING_CODE_CHAIN = false;
		this.DEBUGGING_DRAG_AND_DROP = false;
	}
}

_p = Game.prototype;

_p.startDebuggingCodeChain = function() {
	this.DEBUGGING_CODE_CHAIN = true;
}

_p.startDebuggingDragAndDrop = function() {
	this.DEBUGGING_DRAG_AND_DROP = true;
}