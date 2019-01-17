const NO_OF_DIRECTIONS = 4,
	  FRAMES_PER_DIRECTION = 3;

const LOOKING_UP = 0,
	  LOOKING_RIGHT = 1,
	  LOOKING_DOWN = 2,
	  LOOKING_LEFT = 3,
	  STANDSTILL_POSITION = 1;

const DISTANCE_TRAVELED_ONE_STEP = 50,
	  DURATION_ONE_STEP = 250;

class Character {
	constructor(game, canvas, name, headDOMImg) {
		this.game = game;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.headDOMImg = headDOMImg;
		
		this.spriteSheetManager = null;
		this.selectedCharaName = "";
		
		//obiectul din array-ul CHARACTERS care are imaginea spriteSheet
		//si detalii despre caracterul curent
		this.characterObject = null;
		this.spriteSheetImg = null;
		this.headImgSrc = "";
		
		this.switchCharacter(name);
		
		//am coada de actiuni. pe masura ce se lanseaza evenimente
		//de miscare, vorbire sau schimbarea directiei fac push in coada
		this.actionsToExecute = new Queue();
		
		//o sa avem doua animatoare => unul pentru a updata frame-urile caracterului
		//si celalat updateaza pozitia caracterului
		this.spriteAnimator = new Animator();
		this.positionAnimator = new Animator();
		
		this.x = 0;
		this.y = 0;
		
		this.moving = false;
		this.talking = false;
		this.currentText = "";
		this.clearTextTimeoutId = null;
		
		this.direction = LOOKING_DOWN;
		this.currentFrame = STANDSTILL_POSITION;
		
		this.defaultPosition();
		this.drawCharacter();
		
		this._updateIntervalId = null;
		
		this.game.on("move", this.scheduleAction.bind(this, "move"));
		this.game.on("look", this.scheduleAction.bind(this, "look"));
		this.game.on("talk", this.scheduleAction.bind(this, "talk"));
		
		this.game.on(GAME_START_EVENT, this.setUpdate.bind(this));
		this.game.on(GAME_STOP_EVENT, this.clearUpdate.bind(this));
	}
}

_p = Character.prototype;

_p.getXRelativeToLeftBorder = function() {
	return Math.floor(this.x - this.spriteSheetManager.anchorX);
}

_p.getXRelativeToRightBorder = function() {
	return Math.floor(this.x + this.spriteSheetManager.anchorX);
}

_p.getYRelativeToTopBorder = function() {
	return Math.floor(this.y - this.spriteSheetManager.anchorY / 1.25);
}

_p.getYRelativeToBottomBorder = function() {
	return Math.floor(this.y);
}

_p.switchCharacter = function(name) {
	this.selectedCharaName = name;
	
	//schimb resursele pentru caracterul curent
	this.characterObject = CHARACTERS[this.selectedCharaName];
	this.spriteSheetImg = this.characterObject["spriteResource"];
	this.headImgSrc = this.characterObject["headImage"];
	
	if (!this.spriteSheetManager)
		this.spriteSheetManager = new SpriteSheet(
			this.canvas, 
			this.spriteSheetImg, 
			NO_OF_DIRECTIONS, 
			FRAMES_PER_DIRECTION
		);
	
	//schimb imaginea spritesheet
	this.spriteSheetManager.setSpriteImage(this.spriteSheetImg);
	
	//schimb imaginea ce arata capul caracterului curent
	this.headDOMImg.src = this.headImgSrc;
	this.headDOMImg.title = "Caracterul " + name + " este selectat";
}

//pozitionarea default este pe mijlocul canvas-ului
_p.defaultPosition = function() {
	this.x = this.canvas.width / 2;
	this.y = this.canvas.height / 2;
	
	this.direction = LOOKING_DOWN;
}

//regula de trei simpla pentru a pastra pozitia relativa in canvas
_p.repositionAfterCanvasResize = function() {
	//evit impartirea cu 0 sau daca una dintre marimile curente ale canvas-ului este 0
	if (!this.canvas.width || !this.canvas.height 
		|| !this.canvas._oldWidth || !this.canvas._oldHeight)
		return;
	
	this.x = (this.canvas.width * this.x) / this.canvas._oldWidth;
	this.y = (this.canvas.height * this.y) / this.canvas._oldHeight;
}

_p.drawCharacter = function() {
	if (!this.moving) {
		this.currentFrame = STANDSTILL_POSITION;
	}
	else {
		//animatoarele se ocupa de currentFrame
		//si pozitia x, y a caracterului pe ecran
		this.spriteAnimator.update();
		this.positionAnimator.update();
	}
	
	this.ctx.fillStyle = "white";
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	this.spriteSheetManager.drawFrame(this.x, this.y, this.direction, this.currentFrame);
	
	if (this.talking)
		this.say();
}

/*
	Setez handlere pentru animator si ii dau drumu
	pentru a vedea caracterul nostru updatat trebuie sa apelam Animator.update() (in drawCharacter)
	
	Daca directia caracterului este spre stanga sau spre dreapta atunci updatam X-ul la deplasare
	Daca directia caracterului este spres sus sau spre jos atunci updatam Y-ul la deplasare
*/
_p.moveSteps = function(noOfSteps, blockNode) {
	function updateFrame(currentFrame) {
		this.currentFrame = currentFrame;
	}
	
	var updatePosition,
		startCoordinate,
		endCoordinate,
		distance = DISTANCE_TRAVELED_ONE_STEP * noOfSteps;
	
	if (this.direction === LOOKING_RIGHT || this.direction === LOOKING_LEFT) {
		updatePosition = function(currentX) {
			this.x = currentX;
		}
		
		startCoordinate = this.x;
		
		//daca merge spre dreapta creste x-ul
		//daca merge spre stanga scade x-ul
		endCoordinate = (this.direction === LOOKING_RIGHT)
			? this.x + distance
			: this.x - distance;
	}
	else if (this.direction === LOOKING_DOWN || this.direction === LOOKING_UP) {
		updatePosition = function(currentY) {
			this.y = currentY;
		}
		
		startCoordinate = this.y;
		
		//daca merge in jos creste y-ul
		//daca merge in sus scade y-ul
		endCoordinate = (this.direction === LOOKING_DOWN)
			? this.y + distance
			: this.y - distance;
	}
	
	this.spriteAnimator.setOnUpdateHandlers([
		{
			setter : updateFrame.bind(this),
			startValue : 0,
			endValue : FRAMES_PER_DIRECTION - 1
		}
	]);	
	
	this.positionAnimator.setOnUpdateHandlers([
		{
			setter : updatePosition.bind(this),
			startValue : startCoordinate,
			endValue : endCoordinate
		}
	]);
	
	function setEndPosition() {
		this.moving = false;
		this.currentFrame = STANDSTILL_POSITION;
		
		//daca primesc ca parametru nodul blocului care a declansat miscarea
		//atunci il notific cand s-a terminat actiunea
		if (blockNode) {
			blockNode.emit(NODE_EXECUTED_EVENT, null);
		}
	}
	
	this.spriteAnimator.setOnEndHandler(setEndPosition.bind(this));
	
	this.moving = true;
	
	this.spriteAnimator.setDuration(DURATION_ONE_STEP);
	this.spriteAnimator.setNumberOfLoops(noOfSteps);
	
	this.positionAnimator.setDuration(DURATION_ONE_STEP * noOfSteps);
	
	this.spriteAnimator.start();
	this.positionAnimator.start();
}

_p.changeDirection = function(newDirection, blockNode) {
	this.direction = newDirection;
	
	if (blockNode)
		blockNode.emit(NODE_EXECUTED_EVENT, null);
} 

_p.say = function(text = this.currentText) {	
	if (!text)
		return;
	
	//creez un dummy div pentru a verifica cat ocupa textul
	var dummyDiv = document.createElement("div");
	
	dummyDiv.innerHTML = text;
	dummyDiv.style.visibility = "hidden";
	dummyDiv.style.position = "absolute";
	dummyDiv.style.fontSize = "1em";
	dummyDiv.style.fontFamily = "Code";
	
	document.body.appendChild(dummyDiv);
	
	var style = window.getComputedStyle(dummyDiv),
		textWidth = parseInt(style.width),
		textHeight = parseInt(style.height);
	
	dummyDiv.innerHTML = "W";
	style = window.getComputedStyle(dummyDiv);
	var oneLetterWidth = parseInt(style.width),
		oneLetterHeight = parseInt(style.height);
	
	document.body.removeChild(dummyDiv);
	
	var onTheRightX = this.x + this.spriteSheetManager.anchorX - 10,
		onTheLeftX = this.x - this.spriteSheetManager.anchorX + 10,
		y = this.y - this.spriteSheetManager.anchorY + 10,
		outOfCanvasY = textHeight + oneLetterHeight + 3;
	
	y = Math.max(y, outOfCanvasY);
	
	//textboxul ramane in canvas pana trece de y-ul caracterului
	//dupa care urca odata cu caracterul(daca acesta iese din ecran)
	if (y >= this.y - 10)
		y = this.y - 10;
	
	var rightDelta = this.canvas.width - (onTheRightX + textWidth + oneLetterWidth),
		leftDelta = onTheLeftX - (textWidth + oneLetterWidth),
		howMuchExitsRight = (rightDelta < 0)? Math.abs(rightDelta) : 0,
		howMuchExitsLeft = (leftDelta < 0)? Math.abs(leftDelta) : 0;
	
	//textul intra mai bine in partea dreapta
	if (howMuchExitsRight <= howMuchExitsLeft)
		this.drawTextBoxOnTheRight(text, onTheRightX, y, textWidth, textHeight, oneLetterWidth, oneLetterHeight);
	else 
		this.drawTextOnTheLeft(text, onTheLeftX, y, textWidth, textHeight, oneLetterWidth, oneLetterHeight);
}

_p.drawTextBoxOnTheRight = function(text, x, y, textWidth, textHeight, oneLetterWidth, oneLetterHeight) {
	this.ctx.font = "1em Code";
	this.ctx.fillStyle = "black";
	this.ctx.fillText(text, x + oneLetterWidth / 2, y - oneLetterHeight / 2);
	
	this.ctx.lineJoin = "round";
	this.ctx.lineWidth = 3;
	
	this.ctx.strokeRect(x, y, textWidth + oneLetterWidth, -textHeight - oneLetterHeight);
	
	this.ctx.beginPath();
	this.ctx.strokeStyle = "white";
	this.ctx.moveTo(x + oneLetterWidth - 1, y);
	this.ctx.lineTo(x + 2, y);
	this.ctx.lineWidth = 4;
	this.ctx.stroke();
	this.ctx.closePath();
	
	this.ctx.beginPath();
	this.ctx.lineWidth = 3;
	this.ctx.strokeStyle = "black";
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(x - 3, y + 10);

	this.ctx.lineTo(x + oneLetterWidth, y);
	this.ctx.stroke();
	this.ctx.closePath();
}

_p.drawTextOnTheLeft = function(text, x, y, textWidth, textHeight, oneLetterWidth, oneLetterHeight) {
	this.ctx.font = "1em Code";
	this.ctx.fillStyle = "black";
	this.ctx.fillText(text, (x - textWidth - oneLetterWidth) + oneLetterWidth / 2, y - oneLetterHeight / 2);
	
	this.ctx.lineJoin = "round";
	this.ctx.lineWidth = 3;
	
	this.ctx.strokeRect(x, y, -textWidth - oneLetterWidth, -textHeight - oneLetterHeight);
	
	this.ctx.beginPath();
	this.ctx.strokeStyle = "white";
	this.ctx.moveTo(x - 2, y);
	this.ctx.lineTo(x - oneLetterWidth + 1, y);
	this.ctx.lineWidth = 4;
	this.ctx.stroke();
	this.ctx.closePath();
	
	this.ctx.beginPath();
	this.ctx.lineWidth = 3;
	this.ctx.strokeStyle = "black";
	this.ctx.moveTo(x, y);
	this.ctx.lineTo(x + 3, y + 10);

	this.ctx.lineTo(x - oneLetterWidth, y);
	this.ctx.stroke();
	this.ctx.closePath();
}

_p.scheduleAction = function(typeofAction, event) {
	this.actionsToExecute.push({
		typeofAction,
		detail : event.detail
	});
}

_p.setUpdate = function() {
	//timpul de update va fi in functie de FPS-urile selectate
	this._updateIntervalId = 
		setInterval
		(
			this.update.bind(this),
			1000 / this.game.getAnimationFPS()
		);
}

_p.clearUpdate = function() {
	clearInterval(this._updateIntervalId);
	this._updateIntervalId = null;
	
	this.spriteAnimator.stop();
	this.positionAnimator.stop();
	
	this.defaultPosition();
	this.drawCharacter();
	
	this.actionsToExecute = new Queue();
}

_p.update = function() {
	//daca nu a inceput deja o actiune de miscare
	if (!this.moving && !this.actionsToExecute.empty()) {
		var action = this.actionsToExecute.pop(),
			detail = action.detail;
		
		if (action.typeofAction === "move") {
			if (detail.direction === "left") {
				this.changeDirection(LOOKING_LEFT);
			}
			else if (detail.direction === "right") {
				this.changeDirection(LOOKING_RIGHT);
			}
			else if (detail.direction === "down") {
				this.changeDirection(LOOKING_DOWN);
			}
			else if (detail.direction === "up") {
				this.changeDirection(LOOKING_UP);
			}
			
			this.drawCharacter();
			
			this.moveSteps(detail.noOfSteps, detail.blockNode);
		}
		else if (action.typeofAction === "look") {
			if (detail.direction === "left") {
				this.changeDirection(LOOKING_LEFT, detail.blockNode);
			}
			else if (detail.direction === "right") {
				this.changeDirection(LOOKING_RIGHT, detail.blockNode);
			}
			else if (detail.direction === "down") {
				this.changeDirection(LOOKING_DOWN, detail.blockNode);
			}
			else if (detail.direction === "up") {
				this.changeDirection(LOOKING_UP, detail.blockNode);
			}
		}
		else if (action.typeofAction === "talk") {
			//daca nu am terminat de "zis" ce ziceam inainte
			//anulez timeout-ul vechi ce oprea vorbirea si doar suprascriu ce zic acum
			if (this.talking) {
				clearTimeout(this.clearTextTimeoutId);
			}
			
			this.talking = true;
			this.currentText = detail.speech;
			
			//setez un timeout ce clear-uieste currentText si seteaza this.talking pe fals
			this.clearTextTimeoutId = setTimeout(
				function(self) {
					self.talking = false;
					self.currentText = "";
				},
				2000,
				this
			);
			
			detail.blockNode.emit(NODE_EXECUTED_EVENT, null);
		}
	}
	
	this.drawCharacter();
}