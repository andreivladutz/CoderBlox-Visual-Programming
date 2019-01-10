const STOP_DFS = true;

//nu are camp de valoare. va fi folosit derivat
class TreeNode {
	constructor(parent) {
		this.parent = parent;
		this.children = [];
	}
}

class Tree {
	constructor() {
		this.root = null;
	}
}

_p = Tree.prototype;

_p.DFS = function(callback, currentNode = this.root) {
	if (callback(currentNode) == STOP_DFS)
		return;
	
	for (var child of currentNode.children)
		this.DFS(callback, child);
}