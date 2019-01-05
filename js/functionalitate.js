function addTds() {
	//toate tr-urile cu clasa ExtraTD
	var collect = document.body.getElementsByClassName("ExtraTD");
	
	for (let i = 0; i < collect.length; i++) {
		//copiez primul copil al fratelui de dinaintea tr-ului curent
		var new_td = collect[i].previousElementSibling.children[0].cloneNode(true);
		
		new_td.rowSpan = 1;
		
		//inserez noul td in tr-ul curent
		collect[i].insertBefore(new_td, collect[i].children[0]);
	}
}