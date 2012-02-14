
/*
Combines the functionality of a set and the caching of generators keyed to each set member.
*/

var _ = require('underscorem');

function load(s, maxSize, gen, defaultFunc){

	_.assertInt(maxSize);
	_.assertFunction(gen);
	_.assertFunction(defaultFunc);
	
	var funcs = Object.create(null);
	for(var i=0;i<s.keys.length;++i){
		var key = s.keys[i];
		var id = s.ids[key];
		funcs[id] = gen(key);
	}
	
	function evict(){
		var min = 4294967295;
		var minIndex;
		for(var i=0;i<s.keys.length;++i){
			var key = s.keys[i];
			var c = s.counts[key];
			if(c < min){
				min = c;
				minIndex = i;
			}
		}
		var key = s.keys[minIndex];
		delete s.counts[key];
		var id = s.ids[key];
		delete s.ids[key];
		delete funcs[id];
		s.keys.splice(minIndex, 1);
		s.lowerCountBound = min;
		--s.size;
		return id;
	}

	var h = {
		id: function(key){
			return s.ids[key] || 0;
		},
		has: function(key){
			return s.counts[key] !== undefined;
		},
		use: function(key){
			var c = s.counts[key];
			if(c === undefined){
				++s.size;
				s.counts[key] = 1;
				s.keys.push(key);
				var id = s.idCounter;
				++s.idCounter;
				s.ids[key] = id;
				funcs[id] = gen(key);
				return true;
			}else{
				++s.counts[key];
			}
		},
		shrink: function(){
			var removed = [];
			while(s.size > maxSize){
				removed.push(evict());
			}
			return removed;
		},
		get: function(id){
			_.assertInt(id);
			var f = funcs[id];
			if(f === undefined){
				return defaultFunc;
			}
			return f;
		},
		eachKey: function(cb){
			for(var i=0;i<s.keys.length;++i){
				var key = s.keys[i];
				cb(key);
			}
		}
	};
	return h;
}

function loadState(json){
	var state = {
		keys: json.keys,
		counts: Object.create(null),
		ids: Object.create(null),
		size: json.size,
		idCounter: json.idCounter,
		lowerCountBound: json.lowerCountBound,
		evictRoller: json.evictRoller
	}
	for(var i=0;i<json.keys.length;++i){
		var key = json.keys[i];
		counts[key] = json.counts[key];
		ids[key] = json.ids[key];
	}
	return state;
}

exports.make = function(maxSize, gen, defaultFunc){
	_.assertInt(maxSize);
	_.assertFunction(gen);
	_.assertFunction(defaultFunc);
	
	var state = {
		keys: [],
		funcs: Object.create(null),
		counts: Object.create(null),
		ids: Object.create(null),
		size: 0,
		idCounter: 1,
		lowerCountBound: 0,
		evictRoller: 0
	};
	return load(state, maxSize, gen, defaultFunc);
};
exports.load = function(json, maxSize, gen, defaultFunc){
	return load(loadState(json), maxSize, gen, defaultFunc);
}
