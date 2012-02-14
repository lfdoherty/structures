
function make(maxSize){

	var keys = [];
	var m = {};
	var counts = {};
	var size = 0;

	var hooks = [];
	
	var lowerCountBound = 0;
	
	function evict(){
		var min = 4294967295;
		var minIndex;
		for(var i=0;i<keys.length;++i){
			var key = keys[i];
			var c = counts[key];
			if(c < min){
				min = c;
				minIndex = i;
			}
		}
		var key = keys[minIndex];
		delete counts[key];
		delete m[key];
		keys.splice(minIndex, 1);
		lowerCountBound = min;
	}
	
	var h = {
		use: function(key, value){
			var c = counts[key];
			if(c === undefined){
				if(size < maxSize || Math.random() < 1/(1+lowerCountBound)){
					if(size === maxSize) evict();
					else ++size;
					counts[key] = 1;
					m[key] = value;
					keys.push(key);
				}
			}else{
				++counts[key];
			}
		},
		get: function(key){
			return m[key];
		}
	};
	return h;
}

exports.make = make;
