class Logger {
	constructor(element) {
		this.textAreaElement = element;
	}
	
	print(text) {
		this.textAreaElement.value += text + "\n";
	}
	
	log(value) {
		if (typeof(value) === "object")
			value = JSON.stringify(value);
		
		this.print(value);
	} 
	
	error(value) {
		this.textAreaElement.value += "ERROR: ";
		this.log(value);
	} 
}