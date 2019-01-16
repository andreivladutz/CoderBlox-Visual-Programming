class Animator {
	constructor() {
		this.animationStartTime = NaN;
		this.animationRunning = false;
		
		this.duration = NaN;
		this.noOfLoops = 1;
		this.loopsDone = 0;
		
		this.onEndHandler = null;
		this.onUpdatePropertySetters = [];
	}
}

_p = Animator.prototype;

_p._throwIfStarted = function() {
	if (this.animationRunning)
		throw new Error("Animation already started!");
};

_p.start = function() {
	this._throwIfStarted();
	
	//daca valoarea e diferita de ea insasi e NaN
	if (this.duration != this.duration)
		throw new Error("Animation started without setted duration!");
	
	this.animationStartTime = new Date().getTime();
	this.animationRunning = true;
	this.loopsDone = 0;
};

_p.stop = function() {
	this.animationStartTime = NaN;
	this.duration = NaN;
	this.noOfLoops = 1;
	this.animationRunning = false;
	
	this.onEndHandler && this.onEndHandler();
};

_p.setDuration = function(duration) {
	this.duration = duration;
}

_p.setNumberOfLoops = function(loops) {
	this.noOfLoops = loops;
}

_p.getFraction = function() {
	var currTime = new Date().getTime(),
		delta = currTime - this.animationStartTime;
	
	this.loopsDone = Math.floor(delta / this.duration);
	
	//in caz ca delta a depasit durata totala a animatiei
	delta %= this.duration;
	
	//daca facem (delta modulo durata) nu vom avea niciodata fractia = 1
	//de asemenea daca animatia este la ultimul loop vrem sa ramana in starea finala
	if ((this.loopsDone && this.loopsDone === delta / this.duration)
		|| this.loopsDone >= this.noOfLoops) {
		
		return 1;
	}
	else
		return delta / this.duration;
};

_p.update = function() {
	if (!this.animationRunning)
		return;
	
	var fraction = this.getFraction();
	
	for (var updateHandler of this.onUpdatePropertySetters) {
		var currentValue = 
			updateHandler.startValue + fraction * (updateHandler.endValue - updateHandler.startValue);
		
		updateHandler.setter(Math.round(currentValue));
	}
	
	//animatia s-a terminat
	if (this.loopsDone >= this.noOfLoops) {
		this.stop();
	}
};

_p.setOnEndHandler = function(handler) {
	this.onEndHandler = handler;
};

/*
	primeste un array de obiecte de forma :
	{
		setter : functieSetter,
		startValue : valoarea initiala a animatiei,
		endValue : valoarea finala a animatiei
	}
	
	si in functia update va apela functieSetter(valoare curenta)
*/
_p.setOnUpdateHandlers = function(propertySettersArr) {
	this.onUpdatePropertySetters = propertySettersArr;
};

_p.setDuration = function(duration) {
	this.duration = duration;
};