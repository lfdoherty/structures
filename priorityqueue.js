

function binaryInsert(arr, value, comparator) {
	var low = 0, 
	 	high = arr.length - 1;

	var i;	
	while (low <= high) {
		i = Math.floor((low + high) / 2);
		var comparison = comparator(arr[i], value);
		if (comparison < 0) { low = i + 1; continue; };
		if (comparison > 0) { high = i - 1; continue; };
		low = i;
		break;
	}

	arr.splice(low, 0, value);
};

exports.make = function(indexFunction){

	var list = [];
	
	return {
		add: function(value){
			binaryInsert(list, value, indexFunction);
		},
		pop: function(){//remove last value
			return list.pop();
		},
		shift: function(){//remove first value
			return list.shift();
		},
		size: function(){return list.length;},
		list: function(){return [].concat(list);},
		empty: function(){return list.length === 0;}
	};
}
