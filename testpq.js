
var priorityqueue = require('./priorityqueue');

var pq = priorityqueue.make(function(a,b){return a - b;});

for(var i=0;i<100;++i){
	pq.add(Math.random());
}

while(!pq.empty()){
	console.log('v: ' + pq.pop());
}
