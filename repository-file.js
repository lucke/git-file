/////////////////////////////////////////////
//////////////// Class File /////////////////
/////////////////////////////////////////////


var file = function() {
	/* Call to the parent constructor */
	EzWebGadget.call(this, {translatable: false});
}

file.prototype = new EzWebGadget(); /* Extend from EzWebGadget */
file.prototype.resourcesURL = "http://localhost/gadgets/repository-file/";

/******************** OVERWRITE METHODS **************************/
file.prototype.init = function() {

	// Initialize EzWeb variables

	this.repository = "";							// Name of repository
	this.url = "";								// URL to REST API
	this.file= "";
	this.filename = "";
	this.is_configured = false;						// True if repository and URL are set, false otherwise

	this.github = false;							// Github or local acces to repositories

	this.first_load = true;

	this.slotFile = EzWebAPI.createRGadgetVariable("slotFile", this.setFile);
	this.slotRepository = EzWebAPI.createRGadgetVariable("slotRepository", this.setRepository);	// get repository name
	this.slotURL = EzWebAPI.createRGadgetVariable("slotURL", this.setURL);	// get api url

	this.saved_repository = EzWebAPI.createRWGadgetVariable("saved_repository");	// Saved property repository name
	this.saved_url = EzWebAPI.createRWGadgetVariable("saved_url");	// Saved property URL
	this.saved_file = EzWebAPI.createRWGadgetVariable("saved_file");	

	// CONSTANTS. Webpage alternatives (different views)

	this.MAIN_ALTERNATIVE       = 0;
	this.CONFIG_ALTERNATIVE     = 1;

	// User Interface

	this.alternatives = new StyledElements.StyledAlternatives({defaultEffect:"None"});

	// Initialize Main Alternative (view)

	this.mainAlternative = this.alternatives.createAlternative();
  
    	this.restore();				// Load Saved configuration
	this.createUserInterface();		// Create User Interface
	this.reload();				// Reload Gadget
}


file.prototype.createUserInterface = function() {

	var body = document.getElementsByTagName("body")[0];

	// Header (Alternative Switcher)

	var header = document.createElement("div");
	header.id = "header";
	body.appendChild(header);

	var header_left = document.createElement("div");
	header_left.id = "header_left";
	header.appendChild(header_left);
	
	header_left.appendChild(this._createHeaderButton("images/view.png", "View Repository", EzWebExt.bind(function() { 
		this.alternatives.showAlternative(this.MAIN_ALTERNATIVE);
		this.reload();
	}, this)));
	header_left.appendChild(this._createHeaderButton("images/config.png", "Settings", EzWebExt.bind(function() { 
		this.alternatives.showAlternative(this.CONFIG_ALTERNATIVE);
		this.repaint();
	}, this)));


	var content = document.createElement("div");
	content.id = "content";
	body.appendChild(content);
	
	// CONFIGURATION ALTERNAVITE

	var configAlternative = this.alternatives.createAlternative();
	var config_content = document.createElement("div");
       
        configAlternative.appendChild(config_content);
        
        headerrow = document.createElement("div");
        config_content.appendChild(headerrow);
        
        var row = document.createElement("div");
	
	var title = document.createElement("span");
	title.appendChild(document.createTextNode("Este gadget se configura mediante wiring"));


	// Main alternative

	var text_wrapper = document.createElement("div");
	text_wrapper.id = "text_wrapper";




	var info_content = document.createElement("div");
	info_content.id = "info";
	text_wrapper.appendChild(info_content);
//	this.mainAlternative.appendChild(info_content);

	var file_content = document.createElement("textarea");
	file_content.id = "file";
	text_wrapper.appendChild(file_content);
//	this.mainAlternative.appendChild(file_content);

	var height = (document.defaultView.innerHeight - document.getElementById('header').offsetHeight - 25 );
	text_wrapper.style.height = height + 'px';

	this.mainAlternative.appendChild(text_wrapper);

	if(this.is_configured) {
		this.getFile();
	}

	this.alternatives.insertInto(content);


}


file.prototype._createHeaderButton = function(src, title, handler) {
	var div = document.createElement("div");
	EzWebExt.addClassName(div, "image");
	
	var img = document.createElement("img");
	img.src = this.getResourceURL(src);
	img.title = title;
	img.addEventListener("click", handler, false);
	div.appendChild(img);

	return div
}



file.prototype.repaint = function() {
	var height = (document.defaultView.innerHeight - document.getElementById('header').offsetHeight);
//	var height = (document.defaultView.innerHeight - document.getElementById('header').style.height);
	document.getElementById('content').style.height = height + 'px';
	document.getElementById('text_wrapper').style.height = (height-24) + 'px';


	var width  = document.defaultView.innerWidth;
	document.getElementById('text_wrapper').style.width = width + 'px';


	var codeEditor = document.getElementById("frame_file");
	if (codeEditor) {
		codeEditor.style.height = codeEditor.parentNode.offsetHeight + 'px';
		codeEditor.style.width = width + 'px'; // codeEditor.parentNode.offfsetWidth + 'px';
	}

	this.alternatives.repaint();

}

file.prototype.reload = function () {

	if(this.is_configured) {
		this.alternatives.showAlternative(this.MAIN_ALTERNATIVE);
	}
	else {
		this.alternatives.showAlternative(this.CONFIG_ALTERNATIVE);
	}

	this.repaint;

}


file.prototype._createCell = function(element, className) {
	var cell = document.createElement("div");
	var span = document.createElement("span");
	if (element instanceof StyledElements.StyledElement) {
		element.insertInto(span);
	}
	else {
		span.appendChild(element);
	}
	cell.appendChild(span);
	return cell;
}


file.prototype.save = function() {

	this.saved_repository.set(this.repository);
	this.saved_url.set(this.url);
	this.saved_file.set(this.file+";"+this.filename);
	
}

file.prototype.restore = function() {

	if(this.saved_repository.get()!="") {

		var temp = this.saved_file.get().split(";");

		this.repository = this.saved_repository.get();
		this.url = this.saved_url.get();
		this.file = temp[0];
		this.filename = temp[1];
		this.is_configured = true;

	}

}



file.prototype.getFile = function() {

	if (this.github) {
		this.sendGet(this.url+"?github=1&repository="+this.repository+"&op=5&blob="+this.file, this.displayFile, this.displayError, this.displayException);
	}
	else {

		this.sendGet(this.url+"?github=0&repository="+this.repository+"&op=5&blob="+this.file, this.displayFile, this.displayError, this.displayException);

	}
}



file.prototype.displayFile = function(resp) {

	var resp_json = eval('(' + resp.responseText + ')');
	var html;

	html = "<table id=\"info_table\">"
	html+="		<tr>"
	html+="			<td>Mime Type: \""+resp_json.mime+"\"</td>"
	html+="			<td>Size: "+resp_json.size+" Bytes</td>"
	html+="			<td>Filename: "+this.filename+"</td>"
	html+="		</tr>"
	html+="	</table>"



	var extension = this.filename.split(".")[1];
	var highlight = true;

	switch(extension) {

		case("b"):
			extension = "brainfuck";
			break;
		case("bf"):
			extension = "brainfuck";
			break;
		case("c"):
			extension = "c";
			break;
		case("h"):
			extension = "c";
			break;
		case("cpp"):
			extension = "cpp";
			break;
		case("css"):
			extension = "css";
			break;
		case("html"):
			extension = "html";
			break;
		case("java"):
			extension = "java";
			break;
		case("jar"):
			extension = "java";
			break;
		case("js"):
			extension = "js";
			break;
		case("pas"):
			extension = "pas";
			break;
		case("class"):
			extension = "java";
			break;
		case("pl"):
			extension = "perl";
			break;
		case("php"):
			extension = "php";
			break;
		case("py"):
			extension = "python";
			break;
		case("pyc"):
			extension = "python";
			break;
		case("rb"):
			extension = "ruby";
			break;
		case("rbw"):
			extension = "ruby";
			break;
		case("sql"):
			extension = "sql";
			break;
		case("tsql"):
			extension = "tsql";
			break;
		case("vb"):
			extension = "vb";
			break;
		case("xml"):
			extension = "xml";
			break;
		default:
			extension = "";
			highlight = false;
			break;

	}



	document.getElementById('info').innerHTML = html;
//	document.getElementById('file').value = resp_json.data;

	if (this.first_load == false) {

		editAreaLoader.delete_instance("file");
	
	}
	else {
		this.first_load = false;
	}

	editAreaLoader.init({
		id: "file"			// id of the textarea to transform		
		,start_highlight: highlight	// if start with highlight
		,allow_resize: "none"
		,allow_toggle: false
		,word_wrap: true
		,syntax: extension
		,font_size: 8
//		,is_editable: false
		,toolbar: "search, go_to_line, |, select_font,|, change_smooth_selection, highlight, reset_highlight, word_wrap"
	});


	editAreaLoader.setValue("file", resp_json.data)

	this.repaint;

}


file.prototype.displayError = function() {

	this.alert("Error", "No se puede acceder al repositorio", EzWebExt.ALERT_ERROR);
}


file.prototype.displayException = function() {

	this.alert("Exception", "exception", EzWebExt.ALERT_ERROR);
}


file.prototype.setURL = function(msg) {

	file.url = msg;
}

file.prototype.setRepository = function(msg) {

	file.repository = msg;
}

file.prototype.setFile = function(msg) {

	var temp = msg.split(";");

	file.file = temp[0];
	file.filename = temp[1];
	file.save();
	file.getFile();

	file.is_configured = true;	

	file.reload();

}


/* Instanciate the Gadget class */
file = new file();


