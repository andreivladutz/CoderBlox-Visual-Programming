/*
	tin minte evenimentele inregistrate
	pentru a face removeEventListener mai usor
*/
class EventEmiter extends EventTarget {
	constructor() {
		super();
		
		this._registeredListeners = {};
	}
	
	/*
		daca apelez cu doi parametrii = este removeEvList normal
		cu numele de eveniment = sterge toti listenerii pentru acel eveniment
		fara niciun parametru = sterge toti listenerii
	*/
	removeEventListener(eventName, handler) {
		if (!handler) {
			var list = this._registeredListeners;
			if (!eventName) {
				//sterg toate handlerele pentru toate evenimentele
				for (var evName in list)
					for (var i = 0; i < list[evName].length; i++) {
						super.removeEventListener(evName, list[evName][i]);
						list[evName][i] = [];
					}
			}
			else {
				//sterg toate handlerele pentru evenimentul specificat
				for (var i = 0; i < list[eventName].length; i++) {
					super.removeEventListener(eventName, list[eventName][i]);
					list[eventName][i] = [];
				}
			}
		}
		else {
			super.removeEventListener(eventName, handler);
			
			var index = this._registeredListeners[eventName].indexOf(handler);
			this._registeredListeners[eventName].slice(index, 1);
		}
	}
}

_p = EventEmiter.prototype;

_p.emit = function(eventName, detail) {
	this.dispatchEvent(new CustomEvent(eventName, {detail}));
};


//alias
_p.on = _p.addEventListener = function(eventName, handler) {
	if (!this._registeredListeners[eventName])
		this._registeredListeners[eventName] = [];
	
	this._registeredListeners[eventName].push(handler);
	
	EventTarget.prototype.addEventListener.call(this, eventName, handler);
};