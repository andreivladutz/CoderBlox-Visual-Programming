class Queue {
	constructor() {
		this.arr = [];
	}
}

_p = Queue.prototype;

_p.push = function(val) {
	this.arr.push(val);
}

_p.pop = function() {
	return this.arr.shift();
}

_p.empty = function() {
	return (!this.arr.length);
}