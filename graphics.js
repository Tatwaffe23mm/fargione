/*********************************
* Build the dashboard GUI
*
*
********************************/

function PlotBubbleTest(id, w, h){
	// Make the plot as large a the parent object allows
	this.parent = document.getElementById(id.substr(1, id.length-1));
	if (typeof w === "undefined"){ this.w = this.parent.offsetWidth; } else { this.w = w};
	if (typeof h === "undefined"){ this.h = this.w ; } else { this.h = h};	

	this.plot = function(io, res){
	
		// Set local variables
		nI          = io.nIndividuals;
		t0          = io.t0;
		time        = io.dt;

		// debugger
		//Print line chart for asset growth
		var formatYear = d3.format("4d");

		var margin= {top: 10, right: 30, bottom: 30, left: 40},
			width = this.w - margin.left - margin.right,
			height= this.h - margin.top - margin.bottom;


		// debugger;
		// d3.range(100).map(function(i) { return {assetShare: val[i]}; })
		val = transposem(res.percentiles);
		nodes = d3.range(100).map(function(i) { return {assetShare: val[i]}; })
		var	color = d3.scale.category10();
		var cmap = [];
		for (i=0; i<100; i += 10){
			for (j=0; j<10; j++){
				cmap[i+j] = i/10;
				}
		}
			
		// Interpolates the dataset for the given (fractional) year.
		var radiusScale = d3.scale.sqrt().domain([0, 1]).range([0, 75]);

		var force = d3.layout.force()
			.gravity(0.025)
			.charge(function(d, i) { return -radiusScale( Math.sqrt( d.assetShare[0] / Math.PI ) );})
			.nodes(nodes)
			.on("tick", tick)
			.size([width, height]);
			
		//Sets the root node for the quadtree algo
		var root = nodes[99];

		// Restart the force layout.
		force.nodes(nodes).start();

		// Create the svg element
		var svg = d3.select(id).append("svg:svg")
			.attr("width", this.w)
			.attr("height", this.h);
		
		// Initialize all circles
		
		var circles = svg.selectAll("circle")
			.data(nodes)
			.enter()
			.append("svg:circle")
			.attr("r", function(d) { return radiusScale( Math.sqrt( d.assetShare[0] / Math.PI ) ); })
			.style("fill", function(d, i) { return color(cmap[i]); });
			// .attr("r", function(d) { return radiusScale(d.assetShare[0]); })
			
		circles.append("text")
			.attr("dy", ".3em")
			.style("text-anchor", "middle")
			.text(function(d) { return i; });
		
		var label = svg.append("text")
		.attr("class", "year_label")
		.attr("text-anchor", "end")
		.attr("y", height )
		.attr("x", width)
		.text(io.t0);
		
		animation_time = io.dt*1000;
		
		label.transition()
		  .duration(animation_time)
		  .ease("linear")
		  .tween("year", tweenYear);
		  
		layout();
		  
		function layout(){
			force.start();
			for (var i = 0; i < 100; ++i) force.tick();
			force.stop();
		}
		  
		function tweenYear() {
			var year = d3.interpolateNumber(0, io.dt-1) ;
			return function(t) { displayYear(year(t)); };
		}		  
	  
		// Updates the display to show the specified year.
		var yr = 0;
		function displayYear(year) {
			yr = Math.round(year);
			// rA = function (d) { Math.sqrt( d.assetShare[yr] / Math.PI) };
			circles = svg.selectAll("circle");
			circles.transition()
				.duration(animation_time/io.dt % 1)
				.attr("r", function(d) {return  radiusScale( Math.sqrt( Math.abs( d.assetShare[yr] ) / Math.PI ) );})
			force.charge( function(d) {return  -radiusScale( Math.sqrt( Math.abs( d.assetShare[yr] + .01 ) / Math.PI ) );})
			label.text(yr+1);
			layout();
			//circles.each( function( d ) {d.radius = d[showYear]["radius"];	})
		}
		
		// Apply function on each tick
		function tick() {
			svg.selectAll("circle")
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
		}
	}
}



// %TODO: Put hovering functions into object method
function onmouseover(d, i) {
    var currClass = d3.select(this).attr("class");
	var fract = d3.select(this).attr("fract");
    d3.select(this)
        .attr("class", currClass + " current");
    
    // var fract = $(this).attr("fract");
    // var countryVals = startEnd[countryCode];
    // var percentChange = 100 * (countryVals['endVal'] - countryVals['startVal']) / countryVals['startVal'];
    
    // var blurb = '<h2>Fractile' + fract + '</h2>';
    blurb += "<p>Fractile " + fract + "</p>";
    
    // $("#explanation").hide();
    // $("#explanation").html(blurb);
}

function onmouseout(d, i) {
    var currClass = d3.select(this).attr("class");
    var prevClass = currClass.substring(0, currClass.length-8);
    d3.select(this)
        .attr("class", prevClass);
    // $("#blurb").text("hi again");
    $("#explanation").show();
    $("#explanation").html('');
}


function plotStreamGraph(id, io, res, w, h){
	// Make the plot as large a the parent object allows
	this.parent = document.getElementById(id.substr(1, id.length-1));
	if (typeof w === "undefined"){ this.w = this.parent.offsetWidth; } else { this.w = w};
	if (typeof h === "undefined"){ this.h = this.w / 16 * 9; } else { this.h = h};	

// Set local variables
nI          = io.nIndividuals;
t0          = io.t0;
time        = io.dt;

// var pdata = d3.range(100).map(function(i) { return createLayerObject(res.percentiles,i); })
var pdata = d3.range(10).map(function(i) { return createLayerObject(res.deciles,i); });
var mdata = d3.range(10).map(function(i) { return createMaxObject(res.deciles,i);});

//TODO: Plot a marker with the occurence of the max. share of each group
	// var trans = transposem(res.deciles);
	// var li = trans.length;
	// var max=[];
	// for (i=0; i<li; i++){
		// mx = d3.max(trans[i]);
		// idx = trans[i].indexOf(mx)
		// max[i] = idx;
	// }

// debugger
//Print line chart for asset growth
var formatYear = d3.format("4d");

var margin= {top: 10, right: 30, bottom: 30, left: 40},
	width = this.w - margin.left - margin.right,
	height= this.h - margin.top - margin.bottom;

stack = d3.layout.stack().offset("wiggle"),
layer0 = stack(pdata);

// debugger;
// layer0 = stack(psum);


var x = d3.scale.linear()
    .range([0, width])
	.domain([t0, t0+time]);

var y = d3.scale.linear()
    .domain([0, 2])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
	.tickFormat(formatYear);
	
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");		

var color = d3.scale.linear()
    .range(["#FF8C55", "#935A3E"]);

var area = d3.svg.area()
    .x(function(d,i) { return x(i+t0); })
    .y0(function(d) { return y(d.y0); })
    .y1(function(d) { return y(d.y + d.y0); });

var svg = d3.select(id).append("svg")
    .attr("width", this.w)
    .attr("height", this.h)
	.attr("class", "share")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.selectAll("path")
    .data(layer0)
  .enter().append("path")
    .attr("d", area)
    .style("fill", function() { return color(Math.random()); })
	.attr("class","quantile")
	.attr("fract", i)
	.on("mouseover", onmouseover)
    .on("mouseout", onmouseout);
	
// %TODO: Apply a marker for the year of the max. asset share	
// var marker = svg.selectAll(".dot")
	// .data(mdata)
    // .enter().append("circle")
    // .attr("class", "dot")
    // .attr("r", 3.5)
    // .attr("cx", function(d) { return x(d.x); })
    // .attr("cy", function(d) { return y(d.y); })
    // .style("fill", function(d) { return color(d.y); });	
	
// Add the axis and the axis labels
svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);
	
// svg.append("g")
      // .attr("class", "y axis")
      // .call(yAxis)			
}

// %TODO: Put hovering functions into object method
function onmouseover(d, i) {
    var currClass = d3.select(this).attr("class");
	var fract = d3.select(this).attr("fract");
    d3.select(this)
        .attr("class", currClass + " current");
    
    // var fract = $(this).attr("fract");
    // var countryVals = startEnd[countryCode];
    // var percentChange = 100 * (countryVals['endVal'] - countryVals['startVal']) / countryVals['startVal'];
    
    // var blurb = '<h2>Fractile' + fract + '</h2>';
    blurb += "<p>Fractile " + fract + "</p>";
    
    // $("#explanation").hide();
    // $("#explanation").html(blurb);
}

function onmouseout(d, i) {
    var currClass = d3.select(this).attr("class");
    var prevClass = currClass.substring(0, currClass.length-8);
    d3.select(this)
        .attr("class", prevClass);
    // $("#blurb").text("hi again");
    $("#explanation").show();
    $("#explanation").html('');
}



function plotShare(id, io, res, w, h){
// Set local variables
nI          = io.nIndividuals;
t0          = io.t0;
time        = io.dt;


//transpose plotdata
var plotdata =  transposem(res.deciles);
var plotdata2 =  transposem(res.percentiles);

//Print line chart for asset growth
var formatYear = d3.format("4d");

var margin= {top: 10, right: 30, bottom: 30, left: 40},
	width = w - margin.left - margin.right,
	height= h - margin.top - margin.bottom;

var xscale = d3.scale.linear()
    .range([0, width])
	.domain([t0, t0+time]);

var yscale = d3.scale.linear()
    .range([height, 0])
	.domain([0, 1]);
	
var xAxis = d3.svg.axis()
    .scale(xscale)
    .orient("bottom")
	.tickFormat(formatYear);
	
var yAxis = d3.svg.axis()
    .scale(yscale)
    .orient("left");	

var svg = d3.select(id).append("svg")
    .attr("width", w)
    .attr("height", h)
	.attr("class", "growth")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var g = svg.append("svg:g")
    .attr("transform", "translate(0," + 0 + ")");	
	
var line = d3.svg.line()
	.x(function(d,i) { 
		// verbose logging to show what's actually being done
		// console.log('Plotting X value for data point: ' + d + ' using index: ' + i + ' to be at: ' + xscale(i+t0) + ' using our xScale.');
		// return the X coordinate where we want to plot this datapoint
		return xscale(i+t0); 
	})
	.y(function(d) { 
		// verbose logging to show what's actually being done
		// console.log('Plotting Y value for data point: ' + d + ' to be at: ' + yscale(d) + " using our yScale.");
		// return the Y coordinate where we want to plot this datapoint
		return yscale(d); 
	})			
    // .x(function(data) { return data[0][i]; })
    // .y(function(data) { return data[1][i]; })
	.interpolate("line");

// for (i=0; i<10; i++){	
	// g.append("path")
		// .attr("d", line(plotdata[i]));
// }

	g.append("path").transition()
			.duration(500)
			.delay(function(d, i) { return i * 10; })
		.attr("d", line(plotdata[9]))

for (i=0; i<9; i++){	
	g.append("path")
		.transition()
			.duration(500)
			.delay(function(d, i) { return i * 10; })
		.attr("d", line(plotdata[i]));
}

// Add the axis and the axis labels
svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);

svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)				  
}

function plotMeanAssetGrowth(id, io, res, w, h){
// Set local variables
nI          = io.nIndividuals;
t0          = io.t0;
time        = io.dt;
plotdata	= res.rtotalAssets;
assets      = res.assets;
maxAsset    = res.maxAsset;
numberOfIndidualPathsToShow= 50;


//Print line chart for asset growth
var formatYear = d3.format("4d");

var margin= {top: 10, right: 30, bottom: 30, left: 40},
	width = w - margin.left - margin.right,
	height= h - margin.top - margin.bottom;

var xscale = d3.scale.linear()
    .range([0, width])
	.domain([t0, t0+time]);

var yscale = d3.scale.linear()
    .range([height, 0])
	.domain([0, d3.max(plotdata)]);
	
var xAxis = d3.svg.axis()
    .scale(xscale)
    .orient("bottom")
	.tickFormat(formatYear);
	
var yAxis = d3.svg.axis()
    .scale(yscale)
    .orient("left");	

var svg = d3.select(id).append("svg")
    .attr("width", w)
    .attr("height", h)
	.attr("class", "growth")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var g = svg.append("svg:g")
    .attr("transform", "translate(0," + 0 + ")");	
	
var line = d3.svg.line()
	.x(function(d,i) { 
		// verbose logging to show what's actually being done
		// console.log('Plotting X value for data point: ' + d + ' using index: ' + i + ' to be at: ' + xscale(i+t0) + ' using our xScale.');
		// return the X coordinate where we want to plot this datapoint
		return xscale(i+t0); 
	})
	.y(function(d) { 
		// verbose logging to show what's actually being done
		// console.log('Plotting Y value for data point: ' + d + ' to be at: ' + yscale(d) + " using our yScale.");
		// return the Y coordinate where we want to plot this datapoint
		return yscale(d); 
	})			
    // .x(function(data) { return data[0][i]; })
    // .y(function(data) { return data[1][i]; })
	.interpolate("linear");
	
g.append("path")
	.attr("d", line(plotdata));

// Print numberOfIndidualPathsToShow selected paths of individuals over time
var idata = new Array();
for (i=0; i<nI; i=i+nI/numberOfIndidualPathsToShow){
	for (yr=0; yr<time; yr++){
		idata[yr] = assets[yr][i]*1/plotdata[yr];
	}
	// debugger;
	g.append("path")
		.attr("class", "line2")
		.attr("d", line(idata));
}
	
// Add the axis and the axis labels
g.append("path")
	.attr("class", "top")
	.attr("d", line(maxAsset));
	
svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);

svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)				  
}


// Define the object constructor for the histogram plot
function PlotHist(id, w, h){
	// Make the plot as large a the parent object allows
	this.parent = document.getElementById(id.substr(1, id.length-1));
	if (typeof w === "undefined"){ this.w = this.parent.offsetWidth; } else { this.w = w};
	if (typeof h === "undefined"){ this.h = this.w / 16 * 9; } else { this.h = h};		
	
	this.plot = function (io, plotdata){
	
		//Set local variables
		this.nI       = io.nIndividuals;
		this.t0       = io.t0;
		this.time     = io.dt;
		this.plotdata = plotdata;

		// A formatter for counts.
		this.formatCount  = d3.format(",.0f");
		this.formatPercent= d3.format(".1%");
		this.formatYear   = d3.format("d");

		// Set the  space for the histogram in a margin object
		this.margin = {top: 10, right: 30, bottom: 30, left: 40};
		this.width  = this.w - this.margin.left - this.margin.right;
		this.height = this.h - this.margin.top - this.margin.bottom;
			
		// Create the svg element for the histogram here	
		this.svg = d3.select(id).append("svg")
			.attr("width", this.w )
			.attr("height", this.h)
			.attr("class", "hist");

		xscale = d3.scale.linear()
			.domain([0,15])
			.range([0, this.width]);

		this.histBins = d3.range(0, 15.2, .2);	// Needs to be End of range +1 bin-width. Otherise one bin is missing
		histCounts = d3.layout.histogram()
			.bins(this.histBins)
			.frequency(false)
			(this.plotdata[this.time-1]);
			
		yscale = d3.scale.linear()
			.domain([0, .3])
			.range([this.height, 0]);

		xAxis = d3.svg.axis()
			.scale(xscale)
			.orient("bottom");
			
		yAxis = d3.svg.axis()
			.scale(yscale)
			.orient("left");

		var svg = d3.select("svg.hist")
			.append("g")
			.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");	
			
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + this.height + ")")
			.call(xAxis);

		svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(0,0)")			
			.call(yAxis);	
			
		this.svg   = svg;
		this.xAxis = xAxis;
		this.yAxis = yAxis
		this.xscale= xscale;
		this.yscale= yscale;   

		bar = svg.selectAll(".bar") // Create group element with name bar, which holds the rectangle and the text
			.data(histCounts)
		  .enter().append("g")
			.attr("class", "bar")
			.attr("transform", function(d) { return "translate(" + xscale(d.x) + "," + yscale(d.y) + ")"; });

		height = this.height; //needs to be declared separately, otherwise this.height is tried to be found the function context
		bar.append("rect")	// Create the rectangle, which represents the bar
			.attr("x", 1)
			.attr("width", xscale(histCounts[0].dx) - 1)
			.attr("height", function(d) { return height - yscale(d.y); });

		nI = this.nI; //needs to be declared separately, otherwise this.height is tried to be found the function context
		this.plotPercentValues();	
			
		this.svg.append("g")
			.attr("class", "annotation")
			.append("text")
			.attr("transform", "translate("+ 2 +","+ 10 +")")
			.text("Population: " + this.formatCount(this.nI));

		this.svg.append("g")
			.attr("class", "annotation")
			.append("text")
			.attr("transform", "translate("+ 2 +","+ 30 +")")
			.text("Year: " + this.formatYear(this.t0+this.time) + " ("+ this.time +")");	
		return this.svg
	}
	
	this.plotPercentValues = function (){
		// Set function local variables
		nI           = this.nI;
		xscale       = this.xscale;
		formatPercent= this.formatPercent;
		bar          = this.svg.selectAll(".bar");
		//Apply percent values to each bar higher than 1%
		bar.selectAll("text").remove();	//Delete old text values if there ar any and apply new ones
		bar.filter(function(d) { return d.y >= .01; })
			.append("text")
			.attr("dy", ".35em")
			.attr("transform", function(d) { return "translate(" + xscale(histCounts[0].dx)/2 + "," + 35  + ")rotate(-90)"; })
			.text(function(d) { return formatPercent(d.y); });	
	}
	
	this.update = function (selYear){
		this.selYear = selYear;
		
		//Get some local variables from this object properties
		plotdata= this.plotdata[this.selYear];
		xscale  = this.xscale;
		height  = this.height;
		nI      = this.nI;
		bar     = this.svg.selectAll(".bar"); // Create group element with name bar, which holds the rectangle and the text
		rect    = this.svg.selectAll("rect");
		text    = this.svg.selectAll("text");
		
		// Refresh the counts
		histCounts = d3.layout.histogram()
			.bins(this.histBins)
			.frequency(false)
			(plotdata);
	
		// Update the yscale	
		yscale = this.yscale;
		// yscale = d3.scale.linear()
			// .domain([0, .25])
			// .range([this.height, 0]);
			
		//Update the group element data and apply a transition effect
		bar.data(histCounts);
		bar.transition()
			.duration(500)
			.delay(function(d, i) { return i * 10; })
			.attr("transform", function(d) { return "translate(" + xscale(d.x) + "," + yscale(d.y) + ")"; });			
		
		//Update the rectangle element data and apply a transition effect		
		rect.data(histCounts);
		rect.transition()
			.duration(500)
			.delay(function(d, i) { return i * 10; })
			  .attr("height", function(d) { return height - yscale(d.y); });
			  
		//Update the percent values
		this.plotPercentValues();	  
		
		// Update the year annotation %TODO: Put the year in a h2 element
		text.lastChild().text("Year: " + this.formatYear(this.t0+this.selYear) + " ("+ this.selYear +")");			  
	  
	}
}
function updHist(sliderObj, hist, res){
var sh = sliderObj;
var year = sh.slider("option","value");
var histBins = d3.range(0, 15, .25);
var data = d3.layout.histogram()
    .bins(histBins)
    (res.assets[year]);
var bar = hist.selectAll(".bar").remove()
    .data(data)
	.enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) { return "translate(" + xscale(d.x) + "," + yscale(d.y) + ")"; });

bar.append("rect")
    .attr("x", 1)
    .attr("width", xscale(data[0].dx) - 1)
    .attr("height", function(d) { return height - yscale(d.y); });
}

//transpose plotdata
function transposem(matrix){
	var m = matrix.length;
	var n = matrix[0].length;
	var mout = new Array(n);
	for (i=0; i<n; i++){
		mout[i] = d3.range(m);
		for (j=0; j<m; j++){
			mout[i][j] = matrix[j][i];
		}
	}	
	return mout;
}

//function to create a stacked area layer object
function createLayerObject(quantiles,i){
	var li = quantiles.length;
	var a = [];
	for (j=0; j<li; j++){
			a[j] = quantiles[j][i];
	}
	return a.map(function(d, i) { return {x: i, y: d}; });
}

function createMaxObject(quantiles,i){
	var trans = transposem(quantiles);
	var li = trans.length;
	var x=[];
	for (i=0; i<li; i++){
		max = d3.max(trans[i]);
		idx = trans[i].indexOf(max)
		x[idx] = max;
	}
	return x.map(function(d, i) { return {x: i, y: d}; });
}
