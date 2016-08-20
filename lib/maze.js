var mbg = {
	// These options can be modified
	aion: 1, // Turns AI on (1) or off (0)
	aispeed: 250, // Sets the speed of the AI in milliseconds
	trail: 1, // Turns red dotted trail on (1) or off (0)
	cornerclick: 1, // Turns corner peel on (1) or off (0)
	usercontrol: 1, // Turns user controls on (1) or off (0)
	instructions: 1, // Turns instructions after corner click on (1) or off (0)
	
	// Do not modify below this line
	rows: 15,
	columns: 15,
	origwidth: 0,
	origheight: 0,
	box: "",
	instance: "",
	playerx: 0,
	playery: 0,
	gameover: 0,
	aiprevious: "",
	above: 0,
	below: 1,
	left : 2,
	right: 3,
	rndseed: 0,
	
	// Clockwise & counter
	dirs: [0,1,2,3],
	undirs: [1,0,3,2],
	
	// Offsets
	delta: { x:[0, 0,-1, 1], y:[-1, 1, 0, 0] },
	stop: "",
	
	// Detects quirks mode
	// BackCompat = quirks
	mode: document.compatMode,
	
	// When corner is clicked
	mazeFront: function() {
		$('.left').css('border-left', '1px solid #000');
		$('.right').css('border-right', '1px solid #000');
		$('.top').css('border-top', '1px solid #000');
		$('.bottom').css('border-bottom', '1px solid #000');
		$('#curl').fadeOut();
		$('#close').fadeIn();
		if (this.instructions)
			$('#instructions').fadeIn();
		$('#content').fadeOut();
	},
	
	// When X is clicked
	mazeBack: function() {
		$('.left').css('border-left', '1px solid #ccc');
		$('.right').css('border-right', '1px solid #ccc');
		$('.top').css('border-top', '1px solid #ccc');
		$('.bottom').css('border-bottom', '1px solid #ccc');
		$('#curl').fadeIn();
		$('#close').fadeOut();
		$('#instructions').fadeOut();
		$('#content').fadeIn();
	},
	
	
	
	// RNG: Not elegant but works
	rnd: function() {
		this.rndseed = (this.rndseed*9301+49297) % 233280;
		return this.rndseed/(233280.0);
	},
	
	
	generator: function(maze) {
		this.stop = true;
		switch(maze.type) {
			case 0:
				var L = new Array();
				var R = new Array();
				for(var x = 0; x < this.columns; x++) { 
					L[x] = x; 
					R[x] = x;
				}
				mbg.cont(function (row) { return this.randMaze(maze, L, R, row) }, this.rows - 1, function () { mbg.startDom(maze) });
				break;
			case 1:
				var stack = [ { x: Math.floor(this.rnd() * this.columns), y: Math.floor(this.rnd() * this.rows), neighbors: this.shuffle(this.dirs) } ] ;
				mbg.cont(function () { return mbg.findExits(maze, stack) }, this.rows * this.columns, function () { mbg.startDom(maze) });
				break;
		}
	},

	// Randomly generates the twists of the maze
	randMaze: function(maze, L, R, y) {
		for(x = 0; x < this.columns; x++) {
			if(ranNum() && (R[x] != (x + 1)) && (x != (this.columns - 1)))  {
				L[R[x]] = L[x+1];
				R[L[x+1]] = R[x];
				R[x] = x+1;
				L[x+1] = x;

				maze.cells[x][y].wall[3] = false;
				maze.cells[x+1][y].wall[2] = false;
			}
			if(ranNum() && R[x] != x) {
				L[R[x]] = L[x];
				R[L[x]] = R[x];
				L[x] = R[x] = x;
			} 
			else  {
				maze.cells[x][y].wall[1] = false;
				maze.cells[x][y+1].wall[0] = false;
			}
			if((x == this.columns - 1) && (y == this.rows - 2)) {
				for(var x = 0; x < this.columns - 1; x++) {
					if(R[x] != x+1) {
						L[R[x]] = L[x+1];
						R[L[x+1]] = R[x];
						R[x] = x+1;
						L[x+1] = x;
						maze.cells[x][this.rows - 1].wall[3] = false;
						maze.cells[x+1][this.rows - 1].wall[2] = false;
					}
				}
			}
		}
		return y + 1;
		function ranNum() {
		   return Math.floor(this.rnd() * 32) > 14;
		}  
	},
	
	// Start creation
	build: function() {
		this.gameover = 0;
		this.playerx = 0;
		this.playery = 0;
		size = 22;
		seed = Math.floor(Math.random() * 1000000000);
		var type = 1;
		this.elem(this.rows, this.columns, size, type, seed);
	},
	
	// Create DOM elements
	// jQuery modifications to menu must be made here
	elem: function(nrows, ncolumns, nsize, ntype, seed) {
		this.rows	 = nrows;
		this.columns  = ncolumns;
		size	 = nsize;
		type	 = ntype;
		this.rndseed = seed;
		this.box   = document.getElementById("box");
		omaze = document.getElementById("maze");
		if(omaze != null) {
			this.box.removeChild(omaze);
		}
		this.box.style.width = ((this.columns * size) + 2) + "px";
		var style = document.styleSheets[0];
		var rules = style.cssRules;
		if ($.browser.msie && this.mode == "BackCompat")
			classAttr = "className";
		else	
			classAttr = "class";
		this.instance = new mbg.maze(type);
		this.instance.build();
	},
	
	// Loops until maze is created
	cont: function(f, done, fc) {
		var max   = 50;
		var count = 0;
		var loop = function (state) {
			while((state = f(state)) != done) {   
				if (count < max) {
					count++;
				} 
				else  {
					count = 0;
					setTimeout(function() { loop(state) }, 0);
					break;
				}
			}
			if(fc && (state == done))  {
				setTimeout(function() { fc() }, 0);
			}
		}
		loop(0);
	},
	
	// Displays the maze
	// jQuery functions post-maze must be made here
	outMaze: function(parent, token) {	
		setTimeout( function() {
			parent.style.visibility = "visible";
			parent.appendChild(token);	
			$('.cell').css('height', size + 'px');
			$('.cell').css('width', size + 'px');
			$('.0x0').addClass('player');
			if (mbg.aion == 1)
				mbg.ai();
			// Fixes margins from going crazy in IE quirks mode
			// This also sometimes makes a horizontal scrollbar appear, so quirks is not ideal
			if ($.browser.msie && mbg.mode == "BackCompat") {
				$('.cell').css('margin-right', '0px');
				$('.cell').css('margin-bottom', '0px');
				$('#box').css('position', 'absolute');
			}
		}, 250);	
	},
	
	
	// Ai initiate
	ai: function() {
		// Randomly choose dir
		this.rndseed = Math.floor(Math.random() * 1000000000);
		this.stop = false;
		var stack = [ { x: this.instance.start.x, y: this.instance.start.y, neighbors: this.shuffle(this.dirs) } ] ;
		setTimeout(function() { mbg.explore(mbg.instance, stack) }, 10);
	},
	
	
	
	// Chooses dir AI goes
	explore: function(maze, stack) {
		if(this.stop) {
			return;	
		}
		var current = stack[stack.length - 1];
		x = current.x;
		y = current.y;
		this.playerx = x;
		this.playery = y;
		neighbors = current.neighbors;
		var cell = maze.cells[x][y];
		// Leave trail
		cell.visited = true;
		$('.' + x + 'x' + y).addClass('player');
		if (this.aiprevious) {
			$('.' + this.aiprevious).removeClass('player');
			if (this.trail)
				$('.' + this.aiprevious).addClass('visited');
		}
		this.aiprevious = x + 'x' + y;
		// If player has lost
		if((x == (this.columns - 1)) && (y == (this.rows - 1))) {
			this.gameover = 1;
			stoptimer = 1;
			this.stop = true;
			return;
		}  
		var found = false;
		while (neighbors.length > 0) {
			dir = neighbors.pop();
			if (cell.wall[dir] == false) {			
				dx = x + this.delta.x[dir];
				dy = y + this.delta.y[dir];
				if (dx >= 0 && dy >= 0 && dx < this.columns && dy < this.rows) {
					if (maze.cells[dx][dy].visited == false) {
						stack.push( { x: dx, y: dy, neighbors: this.shuffle(this.dirs) } );
						found = true;
						break;
					}
				}
			}			  
		}
		if (neighbors.length == 0) {
			if (found == false) {
				stack.pop();
				if ((x == maze.start.x) && (y == maze.start.y)) {
					this.stop = true;
				}
			}
		}
		// Adjust AI speed
		if (! this.stop) {
			setTimeout(function () { mbg.explore(maze, stack) }, mbg.aispeed);
		}
	},
	
	
	
	// Generates maze paths
	findExits: function(maze, stack) {
		var cell = stack[stack.length - 1];
		x = cell.x;
		y = cell.y;
		neighbors = cell.neighbors;
		if(maze.cells[x][y].visited == false) {
			maze.cells[x][y].visited = true;
			maze.visitedCount++;
		}
		while(neighbors.length > 0) {
			dir = neighbors.pop();
			if(neighbors.length == 0) {
				stack.pop();
			}
			dx = x + this.delta.x[dir];
			dy = y + this.delta.y[dir];
			if(dx >= 0 && dy >= 0 && dx < this.columns && dy < this.rows) {
				if(maze.cells[dx][dy].visited == false) {
					maze.cells[x][y].wall[dir] = false;
					maze.cells[dx][dy].wall[this.undirs[dir]] = false;
					stack.push( { x: dx, y: dy, neighbors: this.shuffle(this.dirs) } );
					break;
				}
			}
		}
		return maze.visitedCount;
	},
	
	
	shuffle: function(things) {
		var news = things.slice();
		for(var j, x, i = news.length; i; j = parseInt(mbg.rnd() * i), x = news[--i], news[i] = news[j], news[j] = x);
		return news;
	},
	
	
	// Entire maze
	maze: function(type) {
		this.cells = new Array();
		this.start = {x: 0, y: 0};
		this.end   = {x: mbg.columns - 1, y: mbg.rows - 1};
		this.type  = type;
		this.visitedCount = 0;
		this.build = function() {
			this.startDom(this); 
		}
		this.startDom = function(maze) { 
			mbg.cont( function(column) { return rowInitializer(maze, column) }, mbg.columns, 
						function() { mbg.generator(maze) });	 
		}
		function rowInitializer(maze, x) {
			maze.cells[x] = new Array(mbg.columns);
			for (y = 0; y < mbg.rows; y++) {
				maze.cells[x][y] = new cell();
			}
			return x + 1;
		}
		function cell() {
			this.token = null;
			this.visited = false;
			this.wall = [ true, true, true, true ];
		}
	},
	
	// Builds the maze elements
	startDom: function(maze) {
	
		maze.cells[maze.start.x][maze.start.y].wall[mbg.above] = false;	   
		maze.cells[maze.end.x][maze.end.y].wall[mbg.below]	 = false;  
		var token = document.createElement("div");
		token.setAttribute("id", "maze");
		mbg.cont(function (row) { return mazeRow(maze, token, row) }, mbg.rows, function () { mbg.outMaze(mbg.box, token) });	 
		function mazeRow(maze, token, y) {
			var row = document.createElement("div");
			row.setAttribute(classAttr, "mrow");

			token.appendChild(row);

			mbg.cont(function (column) { return mazeCell(maze, row, column, y) }, mbg.columns);

			return y + 1;
		}
		// Create one cell
		function mazeCell(maze, row, x, y) {
			var cell = maze.cells[x][y];
			cell.token = makeToken(cell.wall, x, y);
			cell.visited = false;
			row.appendChild(cell.token);
			return x + 1;
		}
		function makeToken(wall, x, y) {
			var div = document.createElement("div");
			var classes = "cell";
			if(x == 0)
				classes = classes + (wall[mbg.left] ? " left" : " noleft");
			if(y == 0)
				classes = classes + (wall[mbg.above] ? " top" : " notop");
			if(x < (mbg.columns - 1))
				classes = classes + (wall[mbg.right] ? " right" : " noright");
			else
				classes = classes + (wall[mbg.right] ? " right" : "");
			if(y < (mbg.rows - 1))
				classes = classes + (wall[mbg.below] ? " bottom" : " nobottom");
			else
				classes = classes + (wall[mbg.below] ? " bottom" : "");
			classes = classes + " " + x + "x" + y;
			div.setAttribute(classAttr, classes);
			if ($.browser.msie && mbg.mode == "BackCompat") {
				var span = document.createElement("span");
				div.appendChild(span);
			}
			return div;
		}
	}
	
	
}; // End var mbg


$(document).ready(function() {

	// Upper right corner peel
	$( '#target' ).fold({side: 'right', directory: 'lib'});

	// Saves original window size in case of window resizing later
	mbg.origwidth = $(window).width();
	mbg.origheight = $(window).height();

	// Uses size of window to find correct number of cells to use
	var docwidth = Math.floor($(window).width() / 22);
	var docheight = Math.floor($(window).height() / 22);
	
	// Fix overlay
	$('#overlay').css('height', $(document).height() + 'px');
	$('#contenthide').css('height', $(document).height() + 'px');
	
	// Display corner peel
	if (mbg.cornerclick) {
		$('#curl').show();
	}
	
	// Create maze
	mbg.rows = docheight;
	mbg.columns = docwidth;
	mbg.build();
	
	
	
});



// Resize maze with window doesn't work with IE quirks
if (mbg.mode != "BackCompat") {
	$(window).resize(function() {
		var newheight = Math.floor(($(window).height() * 22) / mbg.origheight);
		var newwidth = Math.floor(($(window).width() * 22) / mbg.origwidth);
		$('.cell').css({ 'height':newheight + 'px', 'width':newwidth + 'px' });
		$('#box').css('width', '100%');
		// Resize overlay
		$('#overlay').css('height', $(document).height() + 'px');
	
	});
}







// Controls
if (mbg.usercontrol) {
	$(document).keydown(function(e) {
		if (mbg.gameover == 0) {
			var classlist = $('.' + mbg.playerx + 'x' + mbg.playery).attr("class");
			
			// Prevent scrolling, hide instructions, stop AI
			if (e.keyCode >= 37 && e.keyCode <= 40) {
				// Doesn't work for some reason?
				$('#instructions').fadeOut('slow');
				e.preventDefault();
				mbg.stop = true;
			}
			
			// Left
			if (e.keyCode == 37 && mbg.playerx > 0) {
				if ($('.' + (mbg.playerx - 1) + 'x' + mbg.playery).attr("class").indexOf("noright") != -1) {
					$('.' + mbg.playerx + 'x' + mbg.playery).removeClass('player');
					if (mbg.trail)
						$('.' + mbg.playerx + 'x' + mbg.playery).addClass('visited');
					mbg.playerx--;
					$('.' + mbg.playerx + 'x' + mbg.playery).addClass('player');

				}
			}
			// Up
			if (e.keyCode == 38 && mbg.playery > 0) {
				if ($('.' + mbg.playerx + 'x' + (mbg.playery - 1)).attr("class").indexOf("nobottom") != -1) {
					$('.' + mbg.playerx + 'x' + mbg.playery).removeClass('player');
					if (mbg.trail)
						$('.' + mbg.playerx + 'x' + mbg.playery).addClass('visited');
					mbg.playery--;
					$('.' + mbg.playerx + 'x' + mbg.playery).addClass('player');
				}
			}
			// Right
			if (e.keyCode == 39 && mbg.playerx < (mbg.columns - 1)) {
				if (classlist.indexOf("noright") != -1) {
					$('.' + mbg.playerx + 'x' + mbg.playery).removeClass('player');
					if (mbg.trail)
						$('.' + mbg.playerx + 'x' + mbg.playery).addClass('visited');
					mbg.playerx++;
					$('.' + mbg.playerx + 'x' + mbg.playery).addClass('player');
				}
			}
			// Down
			if (e.keyCode == 40 && mbg.playery < (mbg.rows - 1)) {
				if (classlist.indexOf("nobottom") != -1) {
					$('.' + mbg.playerx + 'x' + mbg.playery).removeClass('player');
					if (mbg.trail)
						$('.' + mbg.playerx + 'x' + mbg.playery).addClass('visited');
					mbg.playery++;
					$('.' + mbg.playerx + 'x' + mbg.playery).addClass('player');
				}
			}
			
			// If player has won
			if (mbg.playerx == (mbg.columns - 1) && mbg.playery == (mbg.rows - 1)) {
				mbg.gameover = 1;
				
				mbg.stop = true;
			}
			
		}
	});
} // End controls