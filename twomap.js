
var _ = require('underscorem');

function TwoMap(){
	this.data = Object.create(null);
}

TwoMap.prototype.value = function(aKey, bKey){
	var m = this.data[aKey];
	if(m === undefined) return;
	return m[bKey];
}
TwoMap.prototype.remove = function(aKey, bKey){
	var m = this.data[aKey];
	if(m === undefined) _.errout('cannot remove non-existent pair (' + aKey + ',*(' + bKey + '))');
	if(m[bKey] === undefined) _.errout('cannot remove non-existent pair (' + aKey + ',' + bKey + ')');
	delete m[bKey];
	if(Object.keys(m).length === 0){
		delete this.data[aKey];
	}
}
TwoMap.prototype.set = function(aKey, bKey, value){
	var m = this.data[aKey];
	if(m === undefined) m = this.data[aKey] = Object.create(null);
	m[bKey] = value;
}
TwoMap.prototype.part = function(aKey, cb){
	var m = this.data[aKey];
	if(m !== undefined){
		var keys = Object.keys(m);
		for(var i=0;i<keys.length;++i){
			var k = keys[i];
			cb(m[k], k);
		}
	}
}
TwoMap.prototype.partRef = function(aKey){
	var m = this.data[aKey];
	if(m === undefined){
		m = this.data[aKey] = Object.create(null);
	}
	return m;
}

TwoMap.prototype.has = function(aKey, bKey){
	var m = this.data[aKey];
	if(m === undefined) return false;
	return m[bKey] !== undefined;
}


TwoMap.prototype.all = function(cb){
	var aKeys = Object.keys(this.data);
	for(var i=0;i<aKeys.length;++i){
		var aKey = aKeys[i];
		var m = this.data[aKey];
		var bKeys = Object.keys(m);
		for(var j=0;j<bKeys.length;++j){
			var k = bKeys[j];
			cb(m[k], aKey, k);
		}
	}
}
exports.make = function(){
	return new TwoMap();
}
