
var set = require('./sets');

function bench(f, desc){
	var start = Date.now();
	f();
	var end = Date.now();
	console.log('did ' + desc + ' in ' + (end-start) + 'ms.');
}


var testSet = set.make();

var N = 1*1000*1000;

bench(function(){
	for(var i=0;i<N;++i){
		testSet.add(i);
	}
	var res = testSet.get();
}, N + ' adds');

bench(function(){
	for(var i=0;i<N;++i){
		testSet.remove(i);
	}
	var res = testSet.get();
}, N + ' removes');

bench(function(){
	var s = set.make();
	for(var i=0;i<N;++i){
		s.add(i);
	}
	for(var i=N;i<N*2;++i){
		s.add(i);
		s.remove(i-N);
	}
	var res = s.get();
}, N + ' add+removes');

var delays = [];
var s1 = set.make();
var s2 = set.make();

var HalfN = Math.floor(N/2);
for(var i=0;i<N;++i){
	s1.add(i);
	s2.add(i+HalfN);
}

N = 100;
var remaining = N;

function doUnion(){
	if(remaining <= 0){
		finishUnion();
		return;
	}
	var start = Date.now();
	var res = s1.getUnion(s2);
	//var resList = res.get();
	var end = Date.now();
	delays.push(end-start);
	--remaining;
	setTimeout(doUnion, 10);
}

function finishUnion(){
	var totalDelay = 0;
	for(var i=0;i<delays.length;++i){
		totalDelay += delays[i];
	}
	delays.sort(function(a, b){return a-b;})
	var median = delays[Math.floor(delays.length/2)];
	console.log('time to compute union, average: ' + (totalDelay/N) + 'ms, median: ' + median + 'ms (N = ' + N + ')');
	
	doInterferedUnion();
}
doUnion();




//UNION DURING INTERFERENCE

N = 100;
var interferedRemaining = N;

function doInterferedUnion(){
	if(interferedRemaining <= 0){
		finishInterferedUnion();
		return;
	}
	var start = Date.now();
	s1.add(Math.floor(Math.random()*1000000000));
	var res = s1.getUnion(s2);
	//var resList = res.get();
	var end = Date.now();
	delays.push(end-start);
	--interferedRemaining;
	setTimeout(doInterferedUnion, 10);
}

function finishInterferedUnion(){
	var totalDelay = 0;
	for(var i=0;i<delays.length;++i){
		totalDelay += delays[i];
	}
	delays.sort(function(a, b){return a-b;})
	var median = delays[Math.floor(delays.length/2)];
	console.log('time to compute interfered union, average: ' + (totalDelay/N) + 'ms, median: ' + median + 'ms (N = ' + N + ')');
}
