class SpriteSheet {
	constructor(canvas, spriteImg, totalDirections, framesPerDirection) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		
		this.spriteImg = spriteImg;
		this.totalDirections = totalDirections;
		this.framesPerDirection = framesPerDirection;
		
		this.imgWidth = this.spriteImg.width;
		this.imgHeight = this.spriteImg.height;
		
		this.frameWidth = Math.floor(this.imgWidth / framesPerDirection);
		this.frameHeight = Math.floor(this.imgHeight / totalDirections);
		
		this.anchorX = Math.floor(this.frameWidth / 2);
		this.anchorY = this.frameHeight;
	}
}

_p = SpriteSheet.prototype;

_p.setSpriteImage = function(newImg) {
	this.spriteImg = newImg;
}

_p.drawFrame = function(x, y, currentDirection, currentFrame) {
	this.ctx.drawImage(
		this.spriteImg,
		this.frameWidth * currentFrame,
		this.frameHeight * currentDirection,
		this.frameWidth,
		this.frameHeight,
		Math.floor(x - this.anchorX),
		Math.floor(y - this.anchorY),
		this.frameWidth,
		this.frameHeight
	);
}