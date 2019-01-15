class ResourceLoaderBase extends EventEmiter {
	constructor() {
		super();
		this.loadedItems = 0;
		this.totalItems = 0;
		this.totalItemsToLoad = 0;
		
		this._resources = [];
		this._resourceObjects = {};
	}
}

_p = ResourceLoaderBase.prototype;

/*
	obj = obiectul ce va fi incarcat
	onLoadedSetter = functia asincron ce apeleaza resolve la incarcare
	onFailSetter = functia asincron ce apeleaza reject cu o eroare la incarcare
	beginLoading = functia ce incepe incarcarea asincron
*/
_p._addItem = function(obj, onLoadedSetter, onFailSetter, beginLoading) {
	this._resources.push({
		resourceObject : obj,
		onLoadedSetter, 
		onFailSetter, 
		beginLoading
	});
	
	this.totalItems++;
}

_p.updateProgress = function() {
	LOGGER.log ("Loaded " + this.loadedItems + " out of " + this.totalItemsToLoad);
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
	this.totalItemsToLoad = 0;
	
	for (var i = 0; i < this._resources.length; i++) {
		//daca aceasta resursa a fost incarcata deja sarim peste ea
		if (this._resources[i].resourceObject._availableResource)
			continue;
		
		this.totalItemsToLoad++;
		
		let currRes = this._resources[i], self = this;
		
		new Promise(function(resolve, reject) {
			currRes.onLoadedSetter(resolve);
			currRes.onFailSetter(reject);
			
			currRes.beginLoading();
		}).then(
			function fulfillment(response) {
				//handlere apelate pt cand resursa s-a incarcat
				response.loadedObject._availableResource = true;
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
	
	this.updateProgress();	
}

class ResourceLoader extends ResourceLoaderBase {
	constructor() {
		super();
	}
}

_p = ResourceLoader.prototype;

/*
	loader-ul va emite obiectul Image la incarcare
*/
_p.addImage = function(name, url) {
	var img = this._resourceObjects[name] = new Image();
	img._availableResource = false;
	
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
	
	this._addItem(img, onLoadedSetter, onFailSetter, beginLoading);
}

/*
	loader-ul va emite obiectul xhttp la incarcare
	
	itemType va fi JSON sau XML
*/
_p.addXML = function(name, itemType, url) {
	var xhttp = this._resourceObjects[name] = new XMLHttpRequest();
	
	if (itemType === "JSON")
		xhttp.overrideMimeType("application/json");
	
	xhttp._availableResource = false;
	
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
	
	this._addItem(xhttp, onLoadedSetter, onFailSetter, beginLoading);
}

/*
	name = identificator pentru obiectul incarcat(folosit la get)
	itemType = img, XML sau JSON
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
			else if (paramArr[i].itemType == "XML" || paramArr[i].itemType == "JSON")
				this.addXML(paramArr[i].name, paramArr[i].itemType, paramArr[i].url);
	}
	
	if (itemType == "img")
		this.addImage(name, url);
	else if (itemType == "XML" || itemType == "JSON")
		this.addXML(name, itemType, url);
	
}