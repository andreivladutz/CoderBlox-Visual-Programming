class VirtualKeyboard extends InputHandler {
	constructor() {
		super(document.createElement("DIV"));
		
		this.keyboardContainer = null;
		this.upKey = null;
		this.downKey = null;
		this.leftKey = null;
		this.rightKey = null;
		
		this.currentlyWASD = true;
		
		this.createKeyboard();
		this.setWASDKeys();
		
		if (isTouchDevice()) 
			this.allowClickEventsOnChildren();
		
		this.on("move", this.dragKeyboard);
	}
	
	createKeyboard() {
		this.keyboardContainer = this._element;
		this.keyboardContainer.id = "keyboardContainer";
		
		this.upKey = document.createElement("DIV");
		this.downKey = document.createElement("DIV");
		this.leftKey = document.createElement("DIV");
		this.rightKey = document.createElement("DIV");
		
		this.keyboardContainer.appendChild(this.upKey);
		this.keyboardContainer.appendChild(this.leftKey);
		this.keyboardContainer.appendChild(this.downKey);
		this.keyboardContainer.appendChild(this.rightKey);
		
		document.body.appendChild(this.keyboardContainer);
	}
	
	setKeys(upCode, leftCode, downCode, rightCode) {
		var w = document.createTextNode(upCode),
			a = document.createTextNode(leftCode),
			s = document.createTextNode(downCode),
			d = document.createTextNode(rightCode);
		
		this.upKey.innerHTML = "";
		this.downKey.innerHTML = "";
		this.leftKey.innerHTML = "";
		this.rightKey.innerHTML = "";

		this.upKey.appendChild(w);
		this.downKey.appendChild(s);
		this.leftKey.appendChild(a);
		this.rightKey.appendChild(d);
		
		this.upKey.addEventListener("click", this.handleUpKeyPress.bind(this));
		this.downKey.addEventListener("click", this.handleDownKeyPress.bind(this));
		this.leftKey.addEventListener("click", this.handleLeftKeyPress.bind(this));
		this.rightKey.addEventListener("click", this.handleRightKeyPress.bind(this));
	}
	
	handleKeyPress(e) {
		e.target.classList.add("keyPressed");
		
		setTimeout(function() {
			e.target.classList.remove("keyPressed");
		}, 250);
	}
	
	dispatchKeyUpEvent(keyName) {
		//Emit eventul de keyup cu numele tastei virtuala apasata
		var keyEvent = new KeyboardEvent("keyup", {key : keyName});
		document.body.dispatchEvent(keyEvent);
	}
	
	handleUpKeyPress(e) {
		this.handleKeyPress(e);
		
		var upName;
		if (this.currentlyWASD)
			upName = "w";
		else
			upName = "ArrowUp";
		
		this.dispatchKeyUpEvent(upName);
	}
	
	handleDownKeyPress(e) {
		this.handleKeyPress(e);
		
		var downName;
		if (this.currentlyWASD)
			downName = "s";
		else
			downName = "ArrowDown";
		
		this.dispatchKeyUpEvent(downName);
	}
	
	handleLeftKeyPress(e) {
		this.handleKeyPress(e);
		
		var leftName;
		if (this.currentlyWASD)
			leftName = "a";
		else
			leftName = "ArrowLeft";
		
		this.dispatchKeyUpEvent(leftName);
	}
	
	handleRightKeyPress(e) {
		this.handleKeyPress(e);
		
		var rightName;
		if (this.currentlyWASD)
			rightName = "d";
		else
			rightName = "ArrowRight";
		
		this.dispatchKeyUpEvent(rightName);
	}
	
	setWASDKeys() {
		this.currentlyWASD = true;
		
		this.setKeys("W", "A", "S", "D");
	}
	
	setArrowKeys() {
		this.currentlyWASD = false;
		
		this.setKeys(decodeURI("%E2%86%91"), decodeURI("%E2%86%90"), decodeURI("%E2%86%93"), decodeURI("%E2%86%92"));
	}
	
	dragKeyboard(e) {
		var style = window.getComputedStyle(this.keyboardContainer),
			left = parseInt(style.left),
			top = parseInt(style.top);
		
		this.keyboardContainer.style.top = top + e.detail.deltaY + "px";
		this.keyboardContainer.style.left = left + e.detail.deltaX + "px";
	}
	
	setPositionInPage(left, top) {
		this.keyboardContainer.style.left = left;
		this.keyboardContainer.style.top = top;
	}
}