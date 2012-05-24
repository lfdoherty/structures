"use strict";

var _ = require('underscorem');

var uidCounter = 0;

var twomap = require('./twomap');

var MaxCacheAge = 6*1000;

function manageCache(c){
	var found = false;
	var now = Date.now();
	c.all(function(result, aKey, bKey){
		var lastTimeUsed = result[2];
		if(now - lastTimeUsed > MaxCacheAge){
			c.remove(aKey, bKey);
		}else{
			found = true;
		}
	});
	return found;
}
function doCacheManagement(){
	var found = manageCache(unionCache);
	found = manageCache(intersectionCache) || found;
	if(found){//don't schedule the cache management task if there are no caches
		startCacheManagement();
	}
}
var cacheManagementRunning = false;
function startCacheManagement(){
	if(cacheManagementRunning) return;
	cacheManagementRunning = true;
	setTimeout(function(){
		cacheManagementRunning = false;
		doCacheManagement();
	}, 1000);
	
	console.log(JSON.stringify(stats));
}

var unionCache = twomap.make();
var intersectionCache = twomap.make();

var stats = {union: {hit: 0, miss: 0}, intersection: {hit: 0, miss: 0}};

function Set(){
	this.uid = ++uidCounter;
}

function cleanList(s){
	if(s.dirtyList){
		var already = Object.create(null);//this deals with values that were removed, then added, while the list remained dirty (and hence added to the list twice or more)
		var newList = [];
		for(var i=0;i<s.list.length;++i){
			var v = s.list[i];
			if(!already[v]){
				already[v] = true;
				if(s.map[v]) newList.push(v);
			}
		}
		s.list = newList;
		s.dirtyList = false;
	}
}

Set.prototype.get = function(){
	cleanList(this);
	return [].concat(this.list);
}

function cleanLeastAndGreatest(s){

	var cgl = s.least === undefined || s.dirtyList;

	if(!cgl) return;
	
	cleanList(s);
	
	if(s.list.length === 0) return;
	
	var least = s.list[0];
	var greatest = s.list[0];
	for(var i=1;i<s.list.length;++i){
		var v = s.list[i];
		if(least > v) least = v;
		if(greatest < v) greatest = v;
	}
	s.least = least;
	s.greatest = greatest;
}

Set.prototype.least = function(){

	cleanList(this);
	
	if(this.list.length === 0) return;
	
	cleanLeastAndGreatest(this);
	
	return this.least;
}
Set.prototype.greatest = function(){

	cleanList(this);
	
	if(this.list.length === 0) return;
	
	cleanLeastAndGreatest(this);
	
	return this.greatest;
}

Set.prototype.contains = function(v){
	return this.map[v] !== undefined;
}


Set.prototype.add = function(v){
	if(this.map[v]) return;
	
	this.map[v] = true;
	this.list.push(v);

	if(this.least && this.least > v) this.least = v;
	if(this.greatest && this.greatest < v) this.greatest = v;
	
	unionCache.part(this.uid, function(entry, key){
		var resultSet = entry[0];
		var otherSet = entry[1];
		if(!otherSet.map[v]){
			resultSet.map[v] = true;
			resultSet.list.push(v);
		}
	});
	intersectionCache.part(this.uid, function(entry, key){
		var resultSet = entry[0];
		var otherSet = entry[1];
		if(otherSet.map[v]){
			resultSet.map[v] = true;
			resultSet.list.push(v);
		}
	});
}

Set.prototype.remove = function(v){
	if(!this.map[v]) return;
	
	this.map[v] = undefined;
	this.dirtyList = true;//this also dirties least and greatest by implication
	
	unionCache.part(this.uid, function(entry, key){
		var resultSet = entry[0];
		var otherSet = entry[1];
		if(!otherSet.map[v]){
			delete resultSet.map[v];
			resultSet.dirtyList = true;
		}
	});
	intersectionCache.part(this.uid, function(entry, key){
		var resultSet = entry[0];
		var otherSet = entry[1];
		if(otherSet.map[v]){
			delete resultSet.map[v];
			resultSet.dirtyList = true;
		}
	});
}
Set.prototype.getUnion = function(otherSet){
	otherSet = otherSet.actual();
	var cv = unionCache.value(this.uid, otherSet.uid);
	if(cv){
		cv[2] = Date.now();
		++stats.union.hit;	
		return cv[0];
	}

	cv = union(this, otherSet);
	unionCache.set(this.uid, otherSet.uid, [cv, otherSet, Date.now()]);
	startCacheManagement();
	++stats.union.miss;
	return cv;
}
Set.prototype.getUnionAll = function(otherSets){
	var res = this;
	for(var i=0;i<otherSets.length;++i){
		var otherSet = otherSets[i];
		res = res.getUnion(otherSet);
	}
	return res;
}

Set.prototype.getIntersection = function(otherSet){
	otherSet = otherSet.actual();
	var cv = intersectionCache.value(this.uid, otherSet.uid);
	if(cv){
		cv[2] = Date.now();
		++stats.intersection.hit;
		return cv[0];
	}

	cv = intersection(this, otherSet);
	intersectionCache.set(this.uid, otherSet.uid, [cv, otherSet, Date.now()]);
	startCacheManagement();
	++stats.intersection.miss;
	return cv;
}

function union(a, b){
	var s = new Set();
	s.list = [].concat(a.list);
	s.map = Object.create(null);
	for(var i=0;i<a.list.length;++i){
		s.map[a.list[i]] = true;
	}
	for(var i=0;i<b.list.length;++i){
		var v = b.list[i];
		if(!a.map[v]){
			s.list.push(v);
			s.map[v] = true;
		}
	}
	return s;
}
function intersection(a, b){
	var s = new Set();
	s.list = [];
	s.map = Object.create(null);
	
	var main;
	var other;
	if(a.list.length < b.list.length){
		main = a.list;
		other = b.map;
	}else{
		main = b.list;
		other = a.map;
	}
	for(var i=0;i<main.length;++i){
		var v = main[i];
		if(other[v]){
			s.list.push(v);
			s.map[v] = true;
		}
	}
	return s;
}

Set.prototype.size = function(){
	cleanList(this);
	return this.list.length;
}
Set.prototype.invariant = function(){
	return new Invariant(this);
}
Set.prototype.actual = function(){
	return this;
}
function Invariant(s){
	this.s = s;
}
function invariantError(){_.errout('Cannot mutate invariant set');}
Invariant.prototype.add = invariantError;
Invariant.prototype.remove = function(){_.errout('Cannot mutate invariant set');}

Invariant.prototype.getUnion = function(other){
	return new Invariant(this.s.getUnion(other));
}
Invariant.prototype.getIntersection = function(other){
	return new Invariant(this.s.getIntersection(other));
}
Invariant.prototype.size = function(){
	return this.s.size();
}
Invariant.prototype.get = function(){
	return this.s.get();
}
Invariant.prototype.actual = function(){
	return this.s.actual();
}
Invariant.prototype.least == function(){
	return this.s.least();
}
Invariant.prototype.greatest == function(){
	return this.s.least();
}
Invariant.prototype.invariant = function(){return this;}

var emptySet = new Set();
emptySet.list = new Array(0);
emptySet.map = Object.create(null);
var empty = new Invariant(emptySet);

function fromArray(arr){
	var s = new Set();
	s.list = [].concat(arr);
	s.map = Object.create(null);
	for(var i=0;i<arr.length;++i){
		s.map[arr[i]] = true;
	}
	return s;
}
function fromSingle(v){
	var s = new Set();
	s.list = [v];
	s.map = Object.create(null);
	s.map[v] = true;
	return s;
}
function make(){
	var s = new Set();
	s.list = [];
	s.map = Object.create(null);
	return s;
}
exports.make = make;
exports.empty = empty;
exports.fromArray = fromArray;
exports.fromSingle = fromSingle;
