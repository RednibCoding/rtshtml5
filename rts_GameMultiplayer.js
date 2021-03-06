//Game
function Game(){
	//tableau de coordonnées des unités
	this.tCoordUnit=Array();
	//tableau de corrdonnées des batiments/arbres/mine d'or
	this.tCoordBuild=Array();
	//le mode en cours 
	this.mode='';
	//l'element selectionné (unité/batiment...)
	this.tSelected=new Array();
	//le batiment selectionné à construire
	this.buildcreation='';
	//le tableau des cases visibles sur la carte
	this.tVisible=Array();
	//le tableau des cases enemies visibles sur la carte
	this.tObscurity=Array();
	//tableau contenant tous les batiments (utilisé pour reconstruire la map lors d'un scroll)
	this.tBuild=Array();
	//idem pour les unités
	this.tUnit=Array();
	
	this.onMouseOver=0;
	
	this.shiftClicked=0;
	
	this.mouseCoordX='';
	this.mouseCoordY='';
	this.mouseX='';
	this.mouseY='';
	
	this.team='';
    
    var tTeam=Array('blue','red','green','yellow');
    this.tRessource=Array();
    for(var i=0;i<tTeam.length;i++){
		//ressources
		
		this.tRessource[tTeam[i] ]=Array();
		this.tRessource[tTeam[i] ]['or']=250;
		this.tRessource[tTeam[i] ]['wood']=150;
		this.tRessource[tTeam[i] ]['beer']=20;
	}
	
	this.tQG=Array();
	this.tQG['blue']=Array();
	this.tQG['blue']['QG']=Array();
	this.tQG['blue']['QG']['x']=0;
	this.tQG['blue']['QG']['y']=0;
	
	
    this.bSound=1;
    
    this.oSound;
    
    socket=io.connect('http://localhost:1337');
    
    socket.on('setTeam',function(team){
		oGame.setTeam(team);
	});
	socket.on('createUnit',function(id, team,name,x,y){
		console.log('socket creation unit '+team+' '+name+' '+id+' '+x+' '+y);
		var aUnit=new Unit(name,team);
		aUnit.x=x;
		aUnit.y=y;
		aUnit.id=id;
		aUnit.build();
		
		oGame.tUnit.push(aUnit);
	});
	socket.on('unit.setTarget',function(id,x,y){
		oGame.getUnitById(id).setTarget(x,y);
	});
	socket.on('saveUnit',function(id,x,y){
		if(!oGame.tCoordUnit[y]){
			oGame.tCoordUnit[y]=Array();
		}
		oGame.tCoordUnit[y][x]=oGame.getUnitById(id);
	});
	
	socket.on('unit.build',function(id,x,y){
		var oUnit=oGame.getUnitById(id);
		oUnit.clear();
		oUnit.x=x;
		oUnit.y=y;
		oUnit.build();
		console.log('local unit.build'+ id +' '+x+' '+y);
	});
	socket.on('unit.animate',function(id,action){
		var oUnit=oGame.getUnitById(id);
		oUnit.animate(action);
	});
	
	socket.on('oBuild.build',function(id,x,y){
		var oBuild=oGame.getBuildById(id);
		oBuild.clear();
		oBuild.x=x;
		oBuild.y=y;
		oBuild.build();
	});
	socket.on('oBuild.animate',function(id,action){
		var oBuild=oGame.getBuildById(id);
		if(oBuild){
			oBuild.animate(action);
		}else{
			console.log('oBuild animate id non trouve '+id);
		}
	});
	
	socket.on('unit.setCycle',function(id,toX,toY,fromX,fromY,sObject){
		var oUnit=oGame.getUnitById(id);
		oUnit.setCycle(toX,toY,fromX,fromY,sObject);
	});
	
	
	socket.on('this.addRessource',function(team,ressource,nb){
		oGame.addRessource(team,ressource,nb);
	});
	
	socket.on('this.useRessource',function(team,ressource,nb){
		oGame.useRessource(team,ressource,nb);
	});
	
	socket.on('this.drawSelected',function(){
		oGame.drawSelected();
	});

	socket.on('unit.buildOn',function(id,name,x,y){
		var aBuild=new Buildcreation(name);
		aBuild.x=x;
		aBuild.y=y;
		
		var oUnit=oGame.getUnitById(id);
		oUnit.buildOn(aBuild);
	});
	
	socket.on('oBuild.update',function(id,field,value){
		var oBuild=oGame.getBuildById(id);
		if(field=='level'){
			oBuild.level=value;
			console.log('obuild update ' + id+' '+field+'='+value);
		}
	});
	
	socket.on('oGame.createBuild',function(id,team,name,x,y){
		
		var aBuild=new Build(name,team);
		aBuild.x=x;
		aBuild.y=y;
		aBuild.id=id;
		aBuild.build();
		
		if(name=='QG'){
			oGame.setQG(team,x,y);
		}
		
		oGame.tBuild.push(aBuild);
		
	});
	
	socket.on('oGame.setQG',function(team,x,y){
		oGame.setQG(team,x,y);
	});
	
    
}
Game.prototype={
	setTeam:function(team){
		this.team=team;
		
		//socket=io.connect('http://localhost:1337');
		
		if(team=='blue'){
			setTimeout(run,fps);
		}
		
		var tTeam=Array('blue','red','green','yellow');
		for(var i=0;i<tTeam.length;i++){
			var a = getById('button-'+tTeam[i]);
			if(tTeam[i]==team){
				a.className='buttonOn';
			}else{
				a.className='button';
			}
		}
		
		console.log('setTeam : '+team);
		oGame.buildRessource();
		
		refresh();
	},
	newGame:function(){
		socket.send('newGame');
	},
	setQG:function(team,x,y){
		this.tQG[team]=Array();
		this.tQG[team]['QG']=Array();
		this.tQG[team]['QG']['x']=x;
		this.tQG[team]['QG']['y']=y;
	},
	getQGx:function(team){
		return this.tQG[team]['QG']['x'];
	},
	getQGy:function(team){
		return this.tQG[team]['QG']['y'];
	},
	getUnitById:function(id){
		for(var i=0;i< this.tUnit.length;i++){
			if(this.tUnit[i].id==id){
				return this.tUnit[i];
			}
		}
	},
	getBuildById:function(id){
		for(var i=0;i< this.tBuild.length;i++){
			if(this.tBuild[i].id==id){
				return this.tBuild[i];
			}
		}
	},
	createBuildBroadcast:function(team,name,x,y){
		socket.emit('oGame.createBuildBroadcast',team,name,x,y);
	},
	createUnitBoadcast:function(team,name,x,y){
		socket.emit('oGame.createUnitBroadcast',team,name,x,y);
	},
	switchSound:function(object){
		if(object.checked){
			this.enableSound();
		}else{
			this.disableSound();
		}
	},
	enableSound:function(){
		this.bSound=1;
	},
	disableSound:function(){
		this.bSound=0;
	},
	drawDirection:function(){
		oLayer_cadre.clear();
		//left
		oLayer_cadre.drawRect(0,0,10,oLayer_map.height,'#eeaf17','#eeaf17');
		//right
		oLayer_cadre.drawRect(oLayer_map.width-10,0,10,oLayer_map.height,'#eeaf17','#eeaf17');
		//bottom
		oLayer_cadre.drawRect(0,oLayer_map.height-10,100,10,'#eeaf17','#eeaf17');
		oLayer_cadre.drawRect(500,oLayer_map.height-10,300,10,'#eeaf17','#eeaf17');
		//top
		oLayer_cadre.drawRect(0,0,oLayer_map.width,10,'#eeaf17','#eeaf17');
	},
	goLeft:function(){
		if(currentX-1 < 0){
			return ;
		}
		
		currentX-=1;
		this.rebuild();
		oLayer_cadre.drawRect(0,0,10,oLayer_map.height,'#eeaf17','#eeaf17');
	},
	goRight:function(){
		if(currentX+1+maxX > map.tMap[0].length){
			return ;
		}
		
		currentX+=1;
		this.rebuild();
		oLayer_cadre.drawRect(oLayer_map.width-10,0,10,oLayer_map.height,'#eeaf17','#eeaf17');
	},
	goDown:function(){
		if(currentY+1+maxY > map.tMap.length){
			return ;
		}
		
		currentY+=1;
		this.rebuild();
		oLayer_cadre.drawRect(0,oLayer_map.height-10,100,10,'#eeaf17','#eeaf17');
		oLayer_cadre.drawRect(500,oLayer_map.height-10,300,10,'#eeaf17','#eeaf17');
	},
	goUp:function(){
		if(currentY-1 < 0){
			return ;
		}
		
		currentY-=1;
		this.rebuild();
		oLayer_cadre.drawRect(0,0,oLayer_map.width,10,'#eeaf17','#eeaf17');
	},
	rebuild:function(){
		map.rebuild();
		map.buildApercuCadre();
		
		oLayer_building.clear();
		for(var i=0;i< this.tBuild.length;i++){
			this.tBuild[i].build();
		}
		oLayer_perso.clear();
		for(var i=0;i< this.tUnit.length;i++){
			this.tUnit[i].build();
		}
		this.displayVisibility();
	},
	displayVisibility:function(){
		oLayer_brouillard.clear();
		oLayer_brouillard.drawRect(0,0,oLayer_map.width,oLayer_map.height,'#222222','#000000');
		for(var y=0;y< maxY;y++){
			for(var x=0;x<maxX;x++){
				if(this.tVisible[y+currentY] && this.tVisible[y+currentY][x+currentX] ){
					oLayer_brouillard.clearRect((x 	)*widthCase,(y)*heightCase,widthCase,heightCase);
				}
			}
		}
	},
	setVisibility:function(x,y){

		for(var i=-2;i<3;i++){
			if(!this.tVisible[y+i]){
				this.tVisible[y+i]=Array();
			}
			if(!this.tObscurity[y+i]){
				this.tObscurity[y+i]=Array();
			}
			
			for(var j=-2;j<3;j++){
	
				this.tVisible[y+i][x+j]=1;
				this.tObscurity[y+i][x+j]=1;
				
				map.setVisibility(x+j,y+i);
			}
		}
		
		
	},
	checkCoord:function(x,y){
		y=parseInt(y+0);
		x=parseInt(x+0);
		if(this.tCoordBuild[ y ] && this.tCoordBuild[ y ][ x ] && this.tCoordBuild[ y ][ x ]!=''){
			console.log('not libre tCoordBuild[ '+y+' ][ '+x+' ]');
			return false;
		}
		
		if(this.tCoordUnit[ y ] && this.tCoordUnit[ y ][ x ] && this.tCoordUnit[ y ][ x ]!=''){
			console.log('not libre tCoordUnit[ '+y+' ][ '+x+' ]');
			return false;
		}
		
		if(map.tMap[y] && map.tMap[y][x] && map.tMap[y][x]==3){
		
			return true;
			
		}
		return false;

	},
	checkCoordVisible:function(x,y){
		y=parseInt(y+0);
		x=parseInt(x+0);
		if(this.tVisible[ y ] && this.tVisible[ y ][ x ] && this.tVisible[ y ][ x ]==1){
			//console.log('visible visible tVisible[ '+y+' ][ '+x+' ]');
			return true;
		}
		return false;
	},
	getXmouse:function(e){
		if(e && e.x!=null && e.y!=null){
			return e.x +document.body.scrollLeft;
		}else{
			return e.clientX +document.body.scrollLeft;
		}
	},
	getYmouse:function(e){
		if(e && e.x!=null && e.y!=null){
			return e.y + document.body.scrollTop;
		}else{
			return e.clientY + document.body.scrollTop;
		}
	},
	getX:function(e){
		var x=this.getXmouse(e);
		x=parseInt( x/widthCase);
	
		return x+currentX;
	},
	getY:function(e){
		var y=this.getYmouse(e);
		y=parseInt( y/widthCase);
		
		return y+currentY;
	},
	
	getXApercu:function(e){
		var x=this.getXmouse(e)-700;
		x=parseInt( x/map.miniWidth);
	
		return x;
	},
	getYApercu:function(e){
		var y=this.getYmouse(e)-622;
		y=parseInt( y/map.miniWidth);
		
		return y;
	},
	
	isWalkable:function(x,y){
		if(this.tCoordBuild[y] && this.tCoordBuild[y][x] && this.tCoordBuild[y][x]!=''){
			return false;
		}
		
		if(this.tCoordUnit[y] && this.tCoordUnit[y][x] && this.tCoordUnit[y][x]!=''){
			return false;
		}
		return true;
	},
	socketSetTarget:function(oUnit,x,y){
		socket.emit('unit.setTargetBroadcast',oUnit.id,x,y)
	},
	goto:function(x,y){
		//recuperation de batiment sur ces coordonnées
		var aBuild=this.getBuild(x,y);
		if(aBuild){
		console.log('build: '+aBuild.name);
		}
		//si une unité est sélectionnée et que le batiment cliqué est une mine ou du bois
		if(this.tSelected.length && aBuild && ( aBuild.name=='or' || aBuild.name=='wood'  )){
			//on créé une ronde du bois/or vers le QG
			//pour alimenter les ressources Or/bois
			
			console.log('a cliquer sur or');	
			
			for(var i=0;i<this.tSelected.length;i++){
			
				//on indique que la destination de cycle c'est la mine d'or ou l'arbre
				var cycleToX=x;
				var cycleToY=y;

				//on indique que la provenance du cycle c'est le QG
				var cycleFromX=this.getQGx(this.team);
				var cycleFromY=this.getQGy(this.team);
				
				this.tSelected[i].setCycleBroadcast(cycleToX,cycleToY,cycleFromX,cycleFromY,aBuild.name);

				//on donne comme cible de deplacement la mine d'or/l'arbre cliqué
				this.tSelected[i].setTargetBroadcast(cycleToX,cycleToY);
			}
		}else if(this.tSelected.length && aBuild && ( aBuild.name=='Houblon')){
			//on créé une ronde du bois/or vers le QG
			//pour alimenter les ressources Or/bois
			
			for(var i=0;i<this.tSelected.length;i++){
			
				//on indique que la destination de cycle c'est la mine d'or ou l'arbre
				var cycleToX=x;
				var cycleToY=y;

				//on indique que la provenance du cycle c'est la brasserie
				var cycleFromX=-1;
				var cycleFromY=-1;
				
				for(var j=0;j< this.tBuild.length;j++){
					if(this.tBuild[j].name=='Brasserie'){
						cycleFromX=this.tBuild[j].x;
						cycleFromY=this.tBuild[j].y;
					}
				}
				
				if(cycleFromX < 0){
					alert('Il vous manque une brasserie');
				}
				
				this.tSelected[i].setCycle(cycleToX,cycleToY,cycleFromX,cycleFromY,aBuild.name);

				//on donne comme cible de deplacement la mine d'or/l'arbre cliqué
				this.tSelected[i].setTargetBroadcast(cycleToX,cycleToY);
			}	
		}else if(this.tSelected.length && aBuild && ( aBuild.name=='QG' )){	
			
			for(var i=0;i<this.tSelected.length;i++){
				//si une des unités séléctionné transporte une ressource
				if(this.tSelected[i].or || this.tSelected[i].wood){
					//on donne comme cible de deplacement la mine d'or/l'arbre cliqué
					this.tSelected[i].setTargetBroadcast(aBuild.x,aBuild.y);
				}

			}

		}else if(this.isWalkable(x,y) && this.tSelected.length){
			for(var i=0;i <this.tSelected.length;i++){
				this.tSelected[i].clearCycle();
				//si la case est accessible, on y indique à l'unité d'y aller
				 
				this.tSelected[i].setTargetBroadcast(x,y);
			}
		}
	},
	//appelé lors d'un clic droit sur le canvas (pour un deplacement d'unité)
	clickdroit:function(e){
		//recuperation des coordonnées "tableau" x y
		var x=this.getX(e);
		var y=this.getY(e);

		this.goto(x,y);
		console.log('goto '+x+' '+y);
		return false;

	},
	clickdroitApercu:function(e){
		//recuperation des coordonnées "tableau" x y
		var x=this.getXApercu(e);
		var y=this.getYApercu(e);
		
		this.goto(x,y);
		return false;
	},
	clickApercu:function(e){
		//recuperation des coordonnées "tableau" x y
		var x=this.getXApercu(e);
		var y=this.getYApercu(e);
		
		currentX=x-(10);
		currentY=y-(10);
		
		if(currentX < 0 ){ currentX=0;}
		if(currentY < 0 ){ currentY=0;}
		
		sDirection='refresh';
		
		refresh();
	},
	//appelée lors d'un clic gauche sur le canvas (sélection d'une unité/batiment)
	click:function(e){
		//recuperation des coordonnées "tableau" x y
		var x=this.getX(e);
		var y=this.getY(e);
		
		
		//si l'utilisateur a séléctionné un batiment à construire
		if(this.buildcreation!=''){
			
			//on veririfie ensuite les coordonnées 
			//des 4 cases nécéssaires à la construction du batiment
			var ok=1;
			if(!oGame.checkCoordVisible(x,y) || !oGame.checkCoord(x,y) ){
				ok=0;
			}else if(!oGame.checkCoordVisible(x+1,y) || !oGame.checkCoord(x+1,y) ){
				ok=0;
			}else if(!oGame.checkCoordVisible(x,y+1) || !oGame.checkCoord(x,y+1) ){
				ok=0;
			}else if(!oGame.checkCoordVisible(x+1,y+1) || !oGame.checkCoord(x+1,y+1) ){
				ok=0;
			}
			
			if(!ok){
				//si une des cases indisponible, on annule
				return;
			}
			
			//si c'est ok, on efface la selection d'emplacement
			this.buildcreation.clear();
			//on indique à l'unité qui doit construire
			//le batiment à construire
			this.tSelected[0].buildOnBroadcast(this.buildcreation);
			
			//on annule la construction en cours
			this.buildcreation='';
			
			return;
			 
		} 
		
		//on recherche si il y a quelquechose aux coordonnées
		var oUnit=this.getUnit(x,y);
		var oBuild=this.getBuild(x,y);
		
		//si il y a une unité
		if(oUnit && oUnit.team==this.team){
			//si la touche shift n'est pas cliqué en efface le tableau de sélection
			if(!this.shiftClicked){
				this.clearSelect();
			}
			//on selectionne celle-ci
			this.select(oUnit);
		}else if(oBuild && oBuild.team==this.team){
			this.clearSelect();
			//si  il y a un batiment,
			//on le selectionne
			this.select(oBuild);
		}else{
			//sinon on supprime la selection sur le canvas
			console.log('pas trouve');
			this.clearSelect();
		}
	},
	keydown:function(e){
		var touche = e.keyCode;

		//si shirt, on enregistre que shift est pressé
		if(touche==16){
			this.shiftClicked=1;
		}
	},
	keyup:function(e){
		this.shiftClicked=0;
	},
	saveBuild:function(oBuild){
        //on recupere les coordonnées du batiment 
        var y=parseInt(oBuild.y);
        var x=parseInt(oBuild.x);
            
		//on enregistre dans un tableau indexé
		//les nouvelles coordonnées
		if(!this.tCoordBuild[y]){
			this.tCoordBuild[y]=Array();
		}
		
		if(oBuild.name=='wood'){
			//si c'est un arbre: on prend qu'une case pas 4
			this.tCoordBuild[y][x]=oBuild;
			return;
		}
		
		
		if(!this.tCoordBuild[y+1]){
			this.tCoordBuild[y+1]=Array();
		}
		this.tCoordBuild[y][x]=oBuild;
		this.tCoordBuild[y+1][x]=oBuild;
		this.tCoordBuild[y+1][x+1]=oBuild;
		this.tCoordBuild[y][x+1]=oBuild;
		
	},
	clearBuild:function(oBuild){
		var y=oBuild.y;
		var x=oBuild.x;
		
		this.tCoordBuild[y][x]='';
	},
	removeBuild:function(oBuild){
		var tBuildTmp=Array();
		for(var i=0;i<this.tBuild.length;i++){
			if(this.tBuild[i].x != oBuild.x || this.tBuild[i].y != oBuild.y){
				tBuildTmp.push(this.tBuild[i]);
			}
		}
		this.tBuild=tBuildTmp;
		
		this.tCoordBuild[oBuild.y][oBuild.x]='';
	},
	getBuild:function(x,y){
		y=parseInt(y);
		x=parseInt(x);
		
		if(this.tCoordBuild[y] &&  this.tCoordBuild[y][x]){
			return this.tCoordBuild[y][x];
		}
		return null;
	},
	clearUnit:function(oUnit){
		
		var y=oUnit.getY();
		var x=oUnit.getX();
		
		if(!this.tCoordUnit[y]){ return; }
		
		this.tCoordUnit[y][x]='';
		//console.log('saveUnit '+y+' '+x);
		
		//this.setVisibility(x,y);
	},
	removeUnit:function(oUnit){
		var tUnitTmp=Array();
		for(var i=0;i<this.tUnit.length;i++){
			if(this.tUnit[i].getX() != oUnit.getX() || this.tUnit[i].getY() != oUnit.getY()){
				tUnitTmp.push(this.tUnit[i]);
			}
		}
		this.tUnit=tUnitTmp;
		
		this.tCoordUnit[oUnit.getY()][oUnit.getX()]='';
	},
	saveUnit:function(oUnit){
		//on recupere les coordonnées de l'unité
		var y=oUnit.getY();
		var x=oUnit.getX();
		
		//on enregistre dans un tableau indexé
		//les nouvelles coordonnées
		if(!this.tCoordUnit[y]){
			this.tCoordUnit[y]=Array();
		}
		this.tCoordUnit[y][x]=oUnit;
		
		//socket.emit('saveUnit',oUnit.id,oUnit.x,oUnit.y);
		
		//on rend la zone visible 
		//que si c'est une unité de notre équipe
		if(oUnit.team==this.team){
			this.setVisibility(x,y);
		}
		
		oGame.displayVisibility();
	},
	getUnit:function(x,y){
		//console.log('search x:'+x+' '+y);
		if(this.tCoordUnit[y] &&  this.tCoordUnit[y][x]){
			return this.tCoordUnit[y][x];
		}
		return null;
	},
	chooseMove:function(){
		this.mode='move';
	},
	clearSelect:function(){
		//on efface le calque
		oLayer_select.clear();
		this.tSelected=new Array();
		//on efface le bloc du bas
		this.resetNav();
	},
	select:function(oMix){
		//on enregistre l'unité/batiment
		this.tSelected.push(oMix);
		
		//on demande son dessin
		this.drawSelected();
		
		//on affiche la navigation
		oMix.buildNav();
	},
	drawSelectedBroadcast:function(){
		socket.emit('this.drawSelectedBroadcast');
	},
	drawSelected:function(){
		//on dessine le mouseover
		this.drawMouseOver();
		
		//on efface le calque
		oLayer_select.clear();
		
		for(var i=0;i<this.tSelected.length;i++){
			//on dessine un cadre sur un des calques au dimension de l'élement
			oLayer_select.drawRectStroke((this.tSelected[i].x-currentX)*widthCase,(this.tSelected[i].y-currentY)*heightCase,this.tSelected[i].width,this.tSelected[i].height,'#880044',3);
		}
	},
	drawMouseOver:function(){
		oLayer_cursor.clear();
		if(this.onMouseOver==0){
			return;
		}
		
		if(!this.checkCoordVisible(this.mouseCoordX,this.mouseCoordY)){
			return false;
		}

		var oBuild=this.getBuild(this.mouseCoordX,this.mouseCoordY);
		var oUnit=this.getUnit(this.mouseCoordX,this.mouseCoordY);
		
		var sColor='#ffffff';
		
		if(oBuild){
			if(oBuild.name=='or'){
				sColor='yellow';
			}else if(oBuild.name=='wood'){
				sColor='#01ad4e';
			}else if(oBuild.team!=this.team){
				sColor='red';
			}
			this.strokeMouseOver(oBuild,sColor);
		}else if(oUnit){
			if(oUnit.team!=this.team){
				sColor='red';
			}
			this.strokeMouseOver(oUnit,sColor);
		}
	},
	strokeMouseOver:function(oMix,sColor){
		oLayer_cursor.drawRectStroke((oMix.x-currentX)*widthCase,(oMix.y-currentY)*heightCase,oMix.width,oMix.height,sColor,3);
	},
	resetNav:function(){
		getById('nav').innerHTML='';
	},
	refreshBuild:function(){
            
		for(var i=0;i< this.tBuild.length;i++){
			var oBuild= this.tBuild[i];
			
			if(oBuild.name=='or'){
				oBuild.animateBroadcast('normal');
			}else if(oBuild.level < 0){
                //oBuild.updateBroadcast('level',oBuild.level+1);	  
                oBuild.animateBroadcast('building');
                  
                //console.log('update broadcast: level='+(oBuild.level+1));
                           
			}else if(oBuild.name!='wood'){
				oBuild.animateBroadcast('normal');
				
			}
		
		}
                
	},
	refreshUnit:function(){
		
		/*map.fillObscurity();
		
		for(var i=0;i< this.tBuild.length;i++){
			if(this.team==this.tBuild[i].team){
				this.tBuild[i].clearObscurity();
			}
		}*/
		
		//on boucle sur les unités existantes
		for(var i=0;i< this.tUnit.length;i++){
			var oUnit= this.tUnit[i];
			if(oUnit.life <=0){ continue;}
			
			if(this.team==oUnit.team){
				oUnit.clearObscurity();
			}
			
			var iAttack=0;
			//recherche si unité à porté d'attaque
			var tAttak=[
						[-1,-1],
						[0,-1],
						[1,-1],

						[-1,0],
						[1,0],

						[-1,+1],
						[0,+1],
						[1,+1],
			];
			for(var j=0;j<tAttak.length;j++){
				var oUnit2=this.getUnit(oUnit.getX()+tAttak[j][0],oUnit.getY()+tAttak[j][1]);
				//si unité enemie
				if(oUnit2 && oUnit2.team!=oUnit.team){
					iAttack=1;       
					break;
				}
			}

			if(iAttack && this.getRessource(oUnit.team,'beer') > oUnit.costBeer ){    

				this.useRessourceBroadcast(oUnit.team,'beer',oUnit.costBeer);

				oUnit.animateBroadcast('attack');

				//on decremente l'enemie de la puissance d'attaque
				oUnit2.life-=oUnit.attak;
				if(oUnit2.life <=0){
					oUnit.animateBroadcast('walking');
					oUnit2.animateBroadcast('dead');      
					//si unite dead, on l'efface du jeu
					oUnit2.clear();
					oGame.removeUnit(oUnit2);

				}
				//si l'unité doit se rendre quelques part
			}else if(oUnit.targetX!='' && oUnit.targetY!='' && (oUnit.targetX!=oUnit.getX() || oUnit.targetY!=oUnit.getY() ) ){
			
				var vitesse=1;
				var vitesse2=vitesse*-1;
				
				//on efface le dessin sur le calques
				oUnit.clear();
				
				var lastX=oUnit.x;
				var lastY=oUnit.y;
				
				//on initialise les nouvelles coordonnées
				var newX=oUnit.x;
				var newY=oUnit.y;
				
				//on fait evoluer les coordonnées vers la destination
				if(oUnit.targetX!='' && oUnit.getX() < oUnit.targetX ){
					newX+=vitesse;
				}else if(oUnit.targetX!='' && oUnit.getX() > oUnit.targetX ){
					newX-=vitesse;
				}
				if(oUnit.targetY!='' && oUnit.getY() < oUnit.targetY ){
					newY+=vitesse;
				}else if(oUnit.targetY!='' && oUnit.getY() > oUnit.targetY ){
					newY-=vitesse;
				}
				
				//on verifie si aux coordonnées cible, il y a un batiment
				var aBuild=this.getBuild(newX,newY);
				
				if(aBuild && aBuild.name=='Brasserie' && oUnit.cycleToX!=''){
					oUnit.x=newX;
					oUnit.y=newY;
					
					//on definit la nouvelle cible
					oUnit.setTargetBroadcast(oUnit.cycleToX,oUnit.cycleToY);
					
					//si l'unité transportait de l'or
					if(oUnit.houblon >0){
						//on ajoute une ressource or
						this.addRessourceBroadcast(oUnit.team,'beer',oUnit.houblon);
					}

					//on reset les ressources de l'unité
					oUnit.houblon=0;
					
				}else if(aBuild && aBuild.name=='QG' && oUnit.cycleToX!=''){
					oUnit.x=newX;
					oUnit.y=newY;
					
					//on definit la nouvelle cible
					oUnit.setTargetBroadcast(oUnit.cycleToX,oUnit.cycleToY);
					
					//si l'unité transportait de l'or
					if(oUnit.or >0){
						//on ajoute une ressource or
						this.addRessourceBroadcast(oUnit.team,'or',oUnit.or);
					}else 	if(oUnit.wood >0){
						//idem pour le bois
						this.addRessourceBroadcast(oUnit.team,'wood',oUnit.wood);
					}

					//on reset les ressources de l'unité
					oUnit.or=0;
					oUnit.wood=0;
					
				
				//si hors cycle mais que l'on demande à une unité de se rendre au QG pour vider ses poches
				}else if(aBuild && aBuild.name=='QG' && (oUnit.or || oUnit.wood)){
				
					//si l'unité transportait de l'or
					if(oUnit.or >0){
						//on ajoute une ressource or
						this.addRessourceBroadcast(oUnit.team,'or',oUnit.or);
					}else 	if(oUnit.wood >0){
						//idem pour le bois
						this.addRessourceBroadcast(oUnit.team,'wood',oUnit.wood);
					}

					//on reset les ressources de l'unité
					oUnit.or=0;
					oUnit.wood=0;
					
					//oUnit.buildNav();
				
				//si la cible c'est un arbre et que le compteur est inferieur à N
				}else if(aBuild && aBuild.name=='wood' && oUnit.counter < 8  && oUnit.cycleToX!=''){
					     
					//on met en place un compteur 
					//pour que la ressources mette du temps
					//a recuperer la ressource
					oUnit.counter+=1;
					
					oUnit.buildBroadcast();
					//on créé l'animation de bois
					oUnit.animateBroadcast('wood');
					
					continue;
					
				//si le compteur est superieur à N
				}else if(aBuild && aBuild.name=='wood' && oUnit.counter >= 8 && oUnit.cycleToX!=''){
					//on indique à l'unité qu'elle transporte 10
					oUnit.wood=10;
					//oUnit.buildNav();
					
					//a chaque iteration on decremente la ressource
					aBuild.ressource-=10;
					//si l'arbre est épuisé, on le supprime de la carte
					if(aBuild.ressource<=0){
						aBuild.clear();
						oGame.removeBuild(aBuild);
						
						//on définit un nouvel arbre à prendre en compte
						var tWood=[
							[-1,-1],
							[0,-1],
							[1,-1],
							
							[-1,0],
							[1,0],
							
							[-1,+1],
							[0,+1],
							[1,+1],
						];
						for(var i=0;i<tWood.length;i++){
							var oBuild2=this.getBuild(aBuild.x+tWood[i][0],aBuild.y+tWood[i][1]);
							if(oBuild2 && oBuild2.name=='wood'){
								oUnit.cycleToX=oBuild2.x;
								oUnit.cycleToY=oBuild2.y;
								
								break;
							}
						}
					}
					
					//on remet le compteur à 0
					oUnit.counter=0;
					
					//on redéfinit la nouvelle cible (c'est un cycle)
					oUnit.setTargetBroadcast(oUnit.cycleFromX,oUnit.cycleFromY);
                                        
                    oUnit.animateBroadcast('walking');
				
				//si la cible c'est une mine d'or et que le compteur est inferieur à N
				}else if(aBuild && aBuild.name=='or' && oUnit.counter < 8  && oUnit.cycleToX!=''){
                                    
                    oUnit.animateBroadcast('mining');
					//on met en place un compteur 
					//pour que la ressources mette du temps
					//a recuperer la ressource
					oUnit.counter+=1;
					
					continue;
				//si le compteur est superieur à N
				}else if(aBuild && aBuild.name=='or' && oUnit.counter >= 8  && oUnit.cycleToX!=''){
					//on indique à l'unité qu'elle transporte 10
					oUnit.or=10;
					//oUnit.buildNav();
					
					oUnit.x=newX;
					oUnit.y=newY;
					
					//on remet le compteur à 0
					oUnit.counter=0;
					
					//on redéfinit la nouvelle cible (c'est un cycle)
					oUnit.setTargetBroadcast(oUnit.cycleFromX,oUnit.cycleFromY);
                                        
                    oUnit.animateBroadcast('walking');
				
				//si la cible c'est du houblon et que le compteur est inferieur à N
				}else if(aBuild && aBuild.name=='Houblon' && oUnit.counter < 8  && oUnit.cycleToX!=''){
                                    
                    oUnit.animateBroadcast('houblon');
					//on met en place un compteur 
					//pour que la ressources mette du temps
					//a recuperer la ressource
					oUnit.counter+=1;
					
					continue;
				//si le compteur est superieur à N
				}else if(aBuild && aBuild.name=='Houblon' && oUnit.counter >= 8  && oUnit.cycleToX!=''){
					//on indique à l'unité qu'elle transporte 1
					oUnit.houblon=1;
					
					oUnit.x=newX;
					oUnit.y=newY;
					
					//on remet le compteur à 0
					oUnit.counter=0;
					
					//on redéfinit la nouvelle cible (c'est un cycle)
					oUnit.setTargetBroadcast(oUnit.cycleFromX,oUnit.cycleFromY);
                                        
                    oUnit.animateBroadcast('walking');
				
				}else if(this.checkCoord(newX,newY)){
					//si la coordonnées est libre
					oUnit.x=newX;
					oUnit.y=newY;
				}else if(this.checkCoord(oUnit.x,newY)){
					//si la coordonnées est libre (cas d'un evitement d'obstacle)
					oUnit.y=newY;
				}else if(this.checkCoord(newX,oUnit.y)){
					//si la coordonnées est libre (cas d'un evitement d'obstacle)
					oUnit.x=newX;
				}else if(this.checkCoord(newX,oUnit.y)){
					//si la coordonnées est libre (cas d'un evitement d'obstacle)
					oUnit.x=newX;
				}else if(this.checkCoord(oUnit.x+vitesse2,oUnit.y)){
					//si la coordonnées est libre (cas d'un evitement d'obstacle)
					oUnit.x=oUnit.x+vitesse2;
				}else if(this.checkCoord(oUnit.x,oUnit.y+vitesse2)){
					//si la coordonnées est libre (cas d'un evitement d'obstacle)
					oUnit.y=oUnit.y+vitesse2;
				}
				
				//on dessine l'unité
				oUnit.buildBroadcast();
				oUnit.animateBroadcast('walking');
				
				//console.log('recalcul');
				//on met à jour la partie visible de la carte
				
			}else if(oUnit.cycleFromX!='' && (oUnit.targetX==oUnit.getX() || oUnit.targetY==oUnit.getY() ) ){
				
				//si arrivee a destination et cycle 
				oUnit.animateBroadcast('stand');
				
				if(oUnit.cycleObject=='wood'){
					oUnit.clearCycle();
				}else if(oUnit.cycleFromX==oUnit.getX() && oUnit.cycleFromY==oUnit.getY() ){
					oUnit.setTargetBroadcast(oUnit.cycleToX,oUnit.cycleToY);
				}else{
					oUnit.setTargetBroadcast(oUnit.cycleFromX,oUnit.cycleFromY);
				}
			}else{
				oUnit.animateBroadcast('stand');
				
			}
		
			
			
			if(oUnit && oUnit.team!=this.team){
				//recherche si unité adverse à proximitée
				var tMove=[
							[-2,-2],
							[-1,-2],
							[0,-2],
							[1,-2],
							[2,-2],
				
							[-2,-1],
							[-1,-1],
							[0,-1],
							[1,-1],
							[2,-1],
							
							[-2,0],
							[-1,0],
							[1,0],
							[2,0],
							
							
							[-2,+1],
							[-1,+1],
							[0,+1],
							[1,+1],
							[2,+1],
							
							[-2,+2],
							[-1,+2],
							[0,+2],
							[1,+2],
							[2,+2],
				];
				for(var j=0;j<tMove.length;j++){
					var oUnit2=this.getUnit(oUnit.getX()+tMove[j][0],oUnit.getY()+tMove[j][1]);
					//si unité enemie
					if(oUnit2 && oUnit2.team!=oUnit.team){
						//l'unité se rapproche pour attaquer
						oUnit.setTargetBroadcast(oUnit2.getX(),oUnit2.getY() );
						break;
					}
				}
				
			}
			
		}
		
		
		
		//on redessine le cadre de selection
		this.drawSelectedBroadcast();
		
	},
	createBuild:function(name){
		var oBuildcreation = new Buildcreation(name);
		oBuildcreation.build();
		
		this.buildcreation=oBuildcreation;
		 
	},
	mousemove:function(e){
		
		this.mouseCoordX=this.getX(e);
		this.mouseCoordY=this.getY(e);
		
		this.mouseX=this.getXmouse(e);
		this.mouseY=this.getYmouse(e);
		
		this.onMouseOver=0;
		
		sDirection='';
		if(this.buildcreation){
			//si une construction est en cours
		
			//on recupere les coordonnées
			var x=this.mouseCoordX;
			var y=this.mouseCoordY;
			
			//on efface la derniere position de la construction théorique
			this.buildcreation.clear();
			//on deplace le plan aux nouvelles coordonnées
			this.buildcreation.x=x;
			this.buildcreation.y=y;
			//on affiche le plan
			this.buildcreation.build();
		
		}else if(this.mouseX > 0 && this.mouseX < oLayer_map.width && this.mouseY > 0 && this.mouseY < oLayer_map.height){
			this.onMouseOver=1;
		}
		
	},
	addRessourceBroadcast:function(team,ressource,nb){
		socket.emit('this.addRessourceBroadcast',team,ressource,nb);
	},
	addRessource:function(team,ressource,nb){
		this.tRessource[team][ressource]+=nb;
		this.buildRessource();
	},
	useRessourceBroadcast:function(team,ressource,nb){
		socket.emit('this.useRessourceBroadcast',team,ressource,nb);
	},
	useRessource:function(team,ressource,nb){
		this.tRessource[team][ressource]-=nb;
		this.buildRessource();
	},
	getRessource:function(team,ressource){
		if(!this.tRessource[team]){
			console.log('ressource introuvable pour '+team);
		}
		return this.tRessource[team][ressource];
	},
	
	mouseout:function(){
		this.onMouseOver=0;
	},
	buildRessource:function(){
		console.log('buildRessource');
		var a=getById('menu');
		if(a && this.team!=''){
			var sHtml='';
			sHtml+='<span style="border:2px solid #444;background:yellow;padding:0px 4px">&nbsp;</span>';
			sHtml+=' Or: '+this.getRessource(this.team,'or');
			sHtml+=' <span style="padding:0px 10px">&nbsp;</span>';
			sHtml+='<span style="border:2px solid #444;background:brown;padding:0px 4px">&nbsp;</span>';
			sHtml+=' Bois: '+this.getRessource(this.team,'wood');
			sHtml+=' <span style="padding:0px 10px">&nbsp;</span>';
			sHtml+='<span style="border:2px solid #444;background:orange;padding:0px 4px">&nbsp;</span>';
			sHtml+=' Bierre: '+this.getRessource(this.team,'beer');
			
			
			sHtml+=' <span style="padding:0px 10px">&nbsp;</span>';
			
			a.innerHTML=sHtml;
			
		} 
	}
        
        
};
