class ResourceLoaderBase extends EventEmiter {
	constructor() {
		super();
		this.loadedItems = 0;
		this.totalItems = 0;
		this._resources = [];
	}
}

_p = ResourceLoaderBase.prototype;

/*
	onLoadedSetter = functia asincron ce apeleaza resolve la incarcare
	onFailSetter = functia asincron ce apeleaza reject cu o eroare la incarcare
	beginLoading = functia ce incepe incarcarea asincron
	onFulfilled = functia ce este apelata cu rezultatul incarcarii(parametrul lui resolve)
	onRejected = functia ce este apelata cu eroarea(parametrul lui reject)
*/
_p._addItem = function(onLoadedSetter, onFailSetter, beginLoading) {
	this._resources.push({
		onLoadedSetter, 
		onFailSetter, 
		beginLoading
	});
	
	this.totalItems++;
}

_p.updateProgress = function() {
	console.log ("Loaded " + this.loadedItems + " out of " + this.totalItems);
}

/*
	pentru fiecare dintre resurse apelez seterele ce vor apela asincron
		resolve -> daca s-au incarcat cu succes
		reject -> daca a esuat incarcarea
	si declansez incarcarea
	
	in primul lant then apelez handlere-le pentru incarcare/eroare a resursei
	in al doilea lant then afisez erori la consola sau in caz de reusita
	updatez bara de incarcare  
*/
_p.load = function() {
	this.loadedItems = 0;
	
	this.updateProgress();
	
	for (var i = 0; i < this._resources.length; i++) {
		let currRes = this._resources[i], self = this;
		
		new Promise(function(resolve, reject) {
			currRes.onLoadedSetter(resolve);
			currRes.onFailSetter(reject);
			
			currRes.beginLoading();
		}).then(
			function fulfillment(response) {
				//handlere apelate pt cand resursa s-a incarcat
				response.loadedObject.available = true;
				self.emit("loaded" + response.resourceName, response.loadedObject);
				
				 ++self.loadedItems;
			},
			function rejection(response) {
				//handlere apelate pt cand resursa nu a reusit sa se incarce
				self.emit("error" + response.resourceName, response.error);
				
				return response.error;
			}
		).then(
			this.updateProgress.bind(this), 
			function onError(err) {
				console.error(err);
			}
		);		
	}
	
}

class ResourceLoader extends ResourceLoaderBase {
	constructor() {
		super();
		
		this._resourceObjects = {};
	}
}

_p = ResourceLoader.prototype;

/*
	loader-ul va emite obiectul Image la incarcare
*/
_p.addImage = function(name, url) {
	var img = this._resourceObjects[name] = new Image();
	img.available = false;
	
	function onLoadedSetter(resolve) {
		img.onload = function() {
			resolve({
				loadedObject : this,
				resourceName : name
			});
		}
	} 
	
	function onFailSetter(reject) {
		img.onerror = function(e) {
			reject({
				error : e,
				resourceName : name
			});
		}
	} 
	
	function beginLoading() {
		img.src = url;
	}
	
	this._addItem(onLoadedSetter, onFailSetter, beginLoading);
}

/*
	loader-ul va emite obiectul xhttp la incarcare
*/
_p.addXML = function(name, url) {
	var xhttp = this._resourceObjects[name] = new XMLHttpRequest();
	xhttp.available = false;
	
	function onLoadedSetter(resolve) {
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && (this.status == 200 || this.status == 0))
				resolve({
					loadedObject : this,
					resourceName : name
				});
		}
	} 
	
	function onFailSetter(reject) {
		xhttp.onerror = function(e) {
			reject({
				error : e,
				resourceName : name
			});
		}
	} 
	
	function beginLoading() {
		xhttp.open("GET", url, true);
		xhttp.send();
	}
	
	this._addItem(onLoadedSetter, onFailSetter, beginLoading);
}

/*
	name = identificator pentru obiectul incarcat(folosit la get)
	itemType = img sau XML
	url = sursa fisierului
	
	sau
	
	array de obiecte cu proprietatile acestea
*/
_p.add = function(name, itemType, url) {
	if (arguments.length == 1 && (arguments[0] instanceof Array)) {
		var paramArr = arguments[0];
		
		for (var i = 0; i < paramArr.length; i++)
			if (paramArr[i].itemType == "img")
				this.addImage(paramArr[i].name, paramArr[i].url);
			else if (paramArr[i].itemType == "XML")
				this.addXML(paramArr[i].name, paramArr[i].url);
	}
	
	if (itemType == "img")
		this.addImage(name, url);
	else if (itemType == "XML")
		this.addXML(name, url);
	
}