const NODE_EXECUTED_EVENT = "finished_execution",
	  NODE_ERROR_EVENT = "failed_execution";
const STOP_DFS = -1, STOP_SUBTREE_DFS = 0;

var unboundGeneratorDFS;

/*
	functia ruleaza DFS-ul generator pas cu pas. la fiecare pas primeste Promise-ul ce asteapta
	sa se execute nodul curent (in cazul nostru se "executa codul" din blocul de cod).
	cand Promise-ul a fost rezolvat (i.e. s-a terminat executia nodului) trece la pasul urmator.
	
	toate sunt wrap-uite intr-un promise(de la primul apel al lui step) ce va fi rezolvat cand se va
	termina executia completa a DFS-ului (sau va fi oprit)
	
	bindToTree = arborele ce va fi this in generator
	restul parametrilor = parametrii DFS-ului
	startNode poate fi omis (default va fi root)
*/
function DFSRunner(bindToTree, beforeCallback, afterCallback, startNode) {
	var genIterator = unboundGeneratorDFS.call(bindToTree, beforeCallback, afterCallback, startNode);
	
	function step(action, args) {
		try {
			var yielded = genIterator[action](args);
		}
		//in cazul aparitiei unei erori in generator
		catch(err) {
			Promise.reject(err);
		}
		
		if (yielded.done) {
			return yielded.value;
		}
		else {
			return Promise.resolve(yielded.value).then(
				function(value) {
					return step("next", value);
				},
				//in cazul aparitiei unei erori in promise, o "aruncam" inapoi in generator
				function(error) {
					return step("throw", error);
				}
			);
		}
	}
	
	//incepem executia DFS-ului. valoarea returnata va fi un promise ce se va rezolva
	//la sfaristul executiei DFS-ului
	return step("next").then(
		function(resp) {
			//dupa ce iesim din recursie vrem sa resetam DFSAborted
			if (!startNode || startNode === bindToTree.root) {
				//stiu ca resetez dupa ce am terminat DFS-ul pe tot arborele
				//nu doar pe subarbore (de exemplu loop)
				bindToTree._DFSAborted = false;
			}
			return resp;
		},
		function(err) {
			return err;
		}
	);
}

/*
	nu are camp de valoare. va fi folosit ca baza pentru alte clase
	unele noduri declanseaza actiuni asincron. trebuie sa "ascultam" pe nod
	daca actiunea s-a terminat pentru a continua (folositor pt generatorDFS)
*/
class TreeNode extends EventEmiter {
	constructor(parent) {
		super();
		this.parent = parent;
		this.children = [];
	}
}

class Tree {
	constructor() {
		this.root = null;
		
		this._DFSAborted = false;
	}
}

_p = Tree.prototype;

_p.generatorDFS = unboundGeneratorDFS = function*(beforeCallback, afterCallback, currentNode = this.root) {
	if (this._DFSAborted) {
		return;
	}
	
	var executionPromise = new Promise(function(resolve, reject) {
			currentNode.on(NODE_EXECUTED_EVENT, resolve);
			currentNode.on(NODE_ERROR_EVENT, reject);
		}),
		returnedVal = beforeCallback(currentNode);
	
	//returnez un promise ce va fi rezolvata atunci cand nodul s-a
	//terminat de executat(folositor pentru actiunile ce dureaza sa se termine)
	yield executionPromise;
		
	
	//opreste DFS-ul doar pe executia curenta
	if (returnedVal === STOP_SUBTREE_DFS) {
		afterCallback(currentNode);
		return;
	}
	//opreste tot DFS-ul
	else if (returnedVal === STOP_DFS) {
		this._DFSAborted = true;
		afterCallback(currentNode);
		return;
	}
	
	for (var child of currentNode.children) {
		//un copil a oprit executia dfs-ului
		if (this._DFSAborted) {
			afterCallback(currentNode);
			return;
		}
		
		yield* this.generatorDFS(beforeCallback, afterCallback, child);
	}
	
	afterCallback(currentNode);
}

/*
	DFS pe arbore cu optiunea de a apela callback-ul inainte de a face DFS
	pe copii sau de a apela callback-ul dupa ce DFS-ul a parcurs copiii.
	
	whereToCall = "after" sau "before"
*/
_p.DFS = function(whereToCall, callback, currentNode = this.root) {
	if (whereToCall === "before")
		callback(currentNode);
	
	for (var child of currentNode.children) {
		this.DFS(whereToCall, callback, child);
	}
	
	if (whereToCall === "after")
		callback(currentNode);
}