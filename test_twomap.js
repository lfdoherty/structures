
function bench(f, desc){
	var start = Date.now();
	f();
	var end = Date.now();
	console.log('did ' + desc + ' in ' + (end-start) + 'ms.');
}


var twomap = require('./twomap');

var t = twomap.make();

var K = 100;
var N = 1000*1000;

bench(function(){
	for(var i=0;i<K;++i){
		for(var j=0;j<N;++j){
			t.set(i, j, i*j);
		}
	}
}, K + '*' + N + ' sets');
