/*********************************
* Calculate the chance driven development of assets over time
*
*
********************************/

function Init(){
// Initialize basic variables and array data in a new input object
// mu: mean of the return rate, defaults to 5%
// sigma: variation of the return rate: the larger the more the return rate varies over the population. default set to .3.
// nI: Size of the population, defaults to 100,000
	
		this.nIndividuals      = 1e4;		// Size of the population, the more the smoother the results. 1000...100000
		this.t0                = 1950; 		// Start Year
		this.today             = new Date();//  Default end year
		this.mu                = 0.05; 		// Default average rate of return
		this.sigma             = .25; 		// Default variance for the rate of return
		this.t1                = this.today.getFullYear()+36; // Set the default end year to the actual year
		this.dt                = this.t1 - this.t0;	// Simulation time span. Max. 150 years
		this.variableReturnRate= false;  	// Set the type of the return rate
		this.taxState          = false;  	// set to true if taxes are applied
		if (this.taxState == true){
			//Get the tax application range from a range slider element
			this.ts0 = 0;	//Start of the tax application
			this.ts1 = this.dt	// End of the tax application
			this.tax = .05; // Default tax value
			this.taxThreshold = .99 // The richest one percent by default
			this.collectedTax = zeros(this.dt, this.nIndividuals)
		}
		console.info("Start: " + this.t0 + " End: " + this.t1 + " DT: " + this.dt);  

	//debugger;
	console.info("Input/Output object succesfully created");
	return this;
}

//Object constructor for the simulation Object

function Sim(io){
	
//Initialisation method which creates all necessary variables and array
	this.initArrays = function(io) {
		nI    = io.nIndividuals;
		start = io.t0;
		end   = io.t1;
		time  = io.dt;
		mu    = io.mu;
		sigma = io.sigma;
		this.assets      = new Array(time);              //Array for the individual assets per individual
		this.sassets     = new Array(time);              //Array for the sortes values
		this.rAssets     = new Array(time);              //Array for the relative assets per individual
		this.assets[0]   = d3.range(nI).map(function () {return 1;}),   //result matrix for the indivdual assets
		this.rAssets[0]  = d3.range(nI).map(function () {return 1/nI;}), //result matrix for the indivdual relative assets
		this.totalAssets = new Array(io.dt),             //Line vector for the sum of all assets per year
		this.rtotalAssets= new Array(io.dt);            //Line vector for the relative amount of all assets per year
		this.deciles     = new Array(time);       		//Array holding the cumulativeshares of each decile
		this.percentiles = new Array(time);       		//Array holding the cumulativeshares of each percentile
		this.maxAsset 	 = new Array(time);				// Array for the max. Asset per year
		//%TODO Only recompute if the size of the random matrix has changed or the mu or sigma values changed
		this.returns     = randnmatrix(time, nI, 1+mu, sigma),   		//Initial random matrix
		console.info("Result object created");
		// Create the tax matrices
		if (io.taxState == true){
			// Tax on high assets
			this.ass2Tax = new Array(time);	// Asset owners, who have to pay taxes
			this.paidTax = zeros(time,nI);	// Amount of paid tax, based on asset
		}
	return this;
	}

	// Calculation method performing all necessary calculations
	this.calc = function (io) {
		// Put object variables into more handy temporary ones
		a     = this.assets;
		sa    = this.sassets;
		ra    = this.rAssets;
		r     = this.returns; 
		ta    = this.totalAssets;
		rta   = this.rtotalAssets;
		d     = this.deciles;
		p     = this.percentiles ;
		time  = io.dt;
		nI	  = io.nIndividuals
		ta[0] = nI;
		rta[0]= 1;
		d[0] = d3.range(10).map(function() {return .1} );
		p[0] = d3.range(100).map(function(){return .01} );
	

		//Calculate the normally distributed return rates for each individual in each year
		var mRR = new Array(time);

		// create normally distributed return rate vector and safe it into an array
		// can become very time consuming for large populations and time ranges
		// %TODO: Put this stuff into the init section
		if (io.variableReturnRate === true){
			for (t=1; t<time; t++) {
				// Just for the interested, overlay an oscillation over the mean of the return rate to make it time dependent.
				period = 10;
				omega = 2 * Math.PI/period;
				mRR[i] = 1 + mu + (.9 * mu * Math.cos(omega * i ));
				r[i] = d3.range(nI).map(d3.random.normal(mRR[i], sigma));
				d3.select("#settings").html( "Variable rate of return over time");
				console.info("Year: " + (start + i + 1) + " Return Rate: " + mRR[i] - 1 );
			}
			this.mRR = mRR;
			}else{
			console.info("Constant avg. return rate/Year from: " + start + " until " + end + " Return Rate: " + mu );
		}

		// Calculate for each year the cumulated asset growth, 
		// based on the normal distributed return rates in each year of the simulation
		switch (io.taxState) {
			case false:
				for (t = 1; t<time; t++){	
					// debugger;
					this.calcWithoutTaxes(t, nI);
				}
				break;
			case true:
				for (t = 1; t<time; t++){	
					if (time >= io.ts0 && time <= io.ts1){
						this.calcWithTaxes(t, nI);
					}else{
						this.calcWithoutTaxes(t, nI);
					}
				}
				break;
		}			
		
		this.bestPerformer = a[time-1].indexOf(this.maxAsset[time-1]);
		console.info("Highest assets after "+ time + " years: " + this.maxAsset);
		console.info("Individuum: " + this.bestPerformer);

		//Create an array with the cumulated results
		this.cumDec = sumQuantiles(this.deciles);
		this.cumPerc = sumQuantiles(this.percentiles);

		// this.maxD = maxQuantiles(this.deciles);
		
		//Finish and pass the results
		return this;
	}
		
	this.calcAnnualStats = function (t, nI) {
		// Now do the usual stuff
		ta[t] = d3.sum(a[t]);     		// Calculate the cumulated assets
		rta[t]= ta[t]/ta[0];    		// Calculate the relative growth of the total asset sum
		ra[t] = mmult(a[t], d3.range(nI).map(function () {return 1/ta[t];})); // Calculate the relative fraction of each individual	
		this.maxAsset[t] = d3.max(a[t]);	// Maximum asset per year
		
		// Get the cumulated assets for the richest 1% and all deciles.
		var cumPAsset = new Array(100);	//temporary Array for Percentiles
		var cumDAsset = new Array(10);	//temporary Array for Deciles
		console.info("Start calc. of cum. assets")
		//Sort all individuals after assets ascending
		sa[t] = ra[t].sort(compareNumbers);	
		//Loop over the sorted array and extract the cumulative asset shares of each percentile 
		for (n=0; n<nI; n=n+nI/100){
			cumPAsset[n*100/nI] = d3.sum(sa[t].slice(n, n+nI/100));
			//console.log("P"+ n + ": " + cumAsset[n]);
		}
		//Loop over the sorted array and extract the cumulative asset shares of each decile
		for (i=0; i<100; i=i+10){
			cumDAsset[i/10] = d3.sum(cumPAsset.slice(i, i+10));
			//console.log("D"+ i + ": " + cumDAsset[i]);
		}	
		p[t] = cumPAsset;
		d[t] = cumDAsset;		
	}			
		
	// Calculate the annual asset groth without taxes
	this.calcWithoutTaxes = function (t, nI) {
			a[t]  = mmult(r[t-1], a[t-1]); 	// Calculate the annual growth
			this.calcAnnualStats(t, nI);
		}
		
	// Calculate the annual asset groth with taxes
	this.calcWithTaxes = function (t, nI) {
		a[t]  = mmult(r[t-1], a[t-1]); 	// Calculate the annual growth
		// Invoke taxes
		as = a[t].sort(compareNumbers); 					// Sort all asset owners
		threshold = as[io.taxThreshold * nI];	// The limit over which a person has to pay taxes
		for (n=0; n<nI; n++){
			if (a[t][n]>= threshold)
			this.paidTax[t][n] = a[t][n] * io.tax;
			a[t][n] = a[t][n] * (1 - io.tax); 
		}
		// Now reapplay the tax money and redistribute it equally over the population
		sumOfCollectedTax = d3.sum(this.paidTax[t]);
		for (n=0; n<nI; n++){
			a[t][n] = a[t][n] + sumOfCollectedTax / nI; 
		}
		this.calcAnnualStats(t, nI);
	}
		
	// Calculate some basic matrices, like the cumulated asset and the share per individuum	

		
		
	// Update method
	this.update = function (io){
		
		this.initArrays(io);
		this.calc(io);	
		}
	
	// Call the Array initialisation method on first object instantiation
	this.initArrays(io);	
}




//Function to update the simulation with a new set of input data for time and population
function updateSim(sliderObj, ioObj, resObj){
// Set function variables and result matrices
res = resObj;
io = ioObj;
io.nIndividuals = sliderObj.slider("option","value"); // Get the new value for the population size
nI    = io.nIndividuals;
start = io.t0;
end   = io.t1;
time  = io.dt;
mu    = io.mu;
sigma = io.sigma;
//Create a result object
// if (typeof res === "undefined"){
	var res         = new Object();
	res.assets      = new Array(time);        						//Array for the individual assets per individual
	res.sassets     = new Array(time);        						//Array for the sortes values
	res.rAssets     = new Array(time);        						//Array for the relative assets per individual
	res.assets[0]   = d3.range(nI).map(function () {return 1;}),  	//result matrix for the indivdual assets
	res.rAssets[0]  = d3.range(nI).map(function () {return 1/nI;}), //result matrix for the indivdual relative assets
	res.totalAssets = new Array(io.dt),       						//Line vector for the sum of all assets per year
	res.rtotalAssets= new Array(io.dt);      						//Line vector for the relative amount of all assets per year
	res.deciles		= new Array(time);								//Array holding the cumulativeshares of each decile
	res.percentiles	= new Array(time);								//Array holding the cumulativeshares of each percentile
	res.returns     = randnmatrix(time, nI, 1+mu, sigma),   		//Initial random matrix
	console.info("Result object created");
// }
// Put object variables into more handy names
a     = res.assets;
sa    = res.sassets;
ra    = res.rAssets;
r     = res.returns; 
ta    = res.totalAssets;
rta   = res.rtotalAssets;
d     = res.deciles;
p     = res.percentiles ;
ta[0] = nI;
rta[0]= 1;

//Calculate the normally distributed return rates for each individual in each year
var mRR = new Array(time);

// create normally distributed return rate vector and safe it into an array
// %TODO: Put this stuff into the init section
if (io.variableReturnRate === true){
	for (i=1; i<time; i++) {
		// Just for the interested, overlay an oscillation over the mean of the return rate to make it time dependent.
		period = 10;
		omega = 2 * Math.PI/period;
		mRR[i] = 1 + mu + (.9 * mu * Math.cos(omega * i ));
		r[i] = d3.range(nI).map(d3.random.normal(mRR[i], sigma));
		d3.select("#settings").html( "Variable rate of return over time");
		console.info("Year: " + (start + i + 1) + " Return Rate: " + mRR[i] - 1 );
	}
	res.mRR = mRR;
	}else{
	console.info("Constant avg. return rate/Year from: " + start + " until " + end + " Return Rate: " + mu );
}

// Calculate for each year the cumulated asset growth, 
// based on the normal distributed return rates in each year of the simulation
for (t = 1; t<time; t++){	
	// debugger;
	a[t]  = mmult(r[t-1], a[t-1]); 	// Calculate the annual growth
	ta[t] = d3.sum(a[t]);     		// Calculate the cumulated assets
	rta[t]= ta[t]/ta[0];    		// Calculate the relative growth of the total asset sum
	ra[t] = mmult(a[t], d3.range(nI).map(function () {return 1/ta[t];})); // Calculate the relative fraction of each individual
}

// Find the best performer
res.maxAsset = [1];
for (t=1; t<time; t++){
		// find the best performer for each year
		res.maxAsset[t] = d3.max(a[t]);
}
res.bestPerformer = a[time-1].indexOf(res.maxAsset[time-1]);
console.info("Highest assets after "+ time + " years: " + res.maxAsset);
console.info("Individuum: " + res.bestPerformer);

// Get the cumulated assets for the richest 1% and all deciles.
for (t=0; t<time; t++){
	var cumPAsset = new Array(100);	//temporary Array for Percentiles
	var cumDAsset = new Array(10);	//temporary Array for Deciles
	console.info("Start calc. of cum. assets")
	//Sort all individuals after assets ascending
	sa[t] = ra[t].sort(compareNumbers);	
	//Loop over the sorted array and extract the cumulative asset shares of each percentile 
	for (i=0; i<nI; i=i+nI/100){
		cumPAsset[i*100/nI] = d3.sum(sa[t].slice(i, i+nI/100));
		//console.log("P"+ i + ": " + cumAsset[i]);
	}
	//Loop over the sorted array and extract the cumulative asset shares of each decile
	for (i=0; i<100; i=i+10){
		cumDAsset[i/10] = d3.sum(cumPAsset.slice(i, i+10));
		//console.log("D"+ i + ": " + cumDAsset[i]);
	}	
	p[t] = cumPAsset;
	d[t] = cumDAsset;
	
	console.info("Simulation updated")
}

//Create an array with the cumulated results
res.cumDec = sumQuantiles(res.deciles);
res.cumPerc = sumQuantiles(res.percentiles);

res.maxD = maxQuantiles(res.deciles);

//Finish and pass the results
}


//Helper functions
//Function to create a m,n matrix containing zeros
function zeros(m, n){
	var matrix = new Array(m);
	for (i=0; i<m; i++){
		matrix[i] = d3.range(n).map(function (){ return 0;});
	}
	return matrix;
}

//Function to create a m,n matrix containing random values
function randnmatrix(m, n, mu, sigma){
	var matrix = new Array(m);
	for (i=0; i<m; i++){
		matrix[i] = d3.range(n).map(d3.random.normal(mu, sigma));
	}
	console.info("Random matrix of size " + m + "x" + n + " created")
	return matrix;
}

//Function to multiply elementwise! two m,n matrices or vectors
function mmult(mat1, mat2){
	ni = mat1.length;
	//Check size integrity
	if (ni != mat2.length || mat1[0].length != mat2[0].length){
		 // debugger;
		 throw "Error: Matrices or vectors must be of the same size. M1:" + mat1.length + " M2:" + mat2.length;
		 return;
	}
	if (mat1[0].length === undefined){
		matrix = new Array(ni);
		for (i=0; i<ni; i++){
			matrix[i] = mat1[i] * mat2[i];
		}		
		console.info("Multiplied two vectors")
	}else{
		nj = mat2.length;
		for (i=0; i<ni; i++){
			matrix = zeros(ni, nj);
			for (j=0; j<nj; j++){
				matrix[i][j] = mat1[i][j] * mat2[i][j];
			}
		}		
	console.info("Multiplied elementwise two matrices")
	}
	return matrix;
}

//Function to compare numbers
function compareNumbers(a, b) {
  return a - b;
}

//Calculate the cumulate sum of the quantiles
function sumQuantiles(quantiles){
	li = quantiles.length;
	lj = quantiles[0].length;
	var qsum = new Array(li);
	for (i=0; i<li; i++){
		qsum[i] = new Array(lj);		//Array of length 10 or 100
		qsum[i][0] = quantiles[i][0];	//In case of i=0 the base value is the value itself
		for (j=1; j<lj; j++){	
			qsum[i][j] = quantiles[i][j] + qsum[i][j-1];	// Calculate the cumulated sum of the quantiles
		}
	}
	return qsum;
}

//Function to retrieve year and index of the max. of the asset share for a given quantile
function maxQuantiles(quantiles){
	li = quantiles.length;
	lj = quantiles[0].length;
	var qmax = new Array(lj);
	for (j=0; i<lj; j++){
		
		
	}	
}
