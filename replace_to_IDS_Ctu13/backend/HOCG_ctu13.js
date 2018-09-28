// socket used to provide HOCG main graph data


var express = require('express');
var app = express();
var moment = require('moment');
var MongoClient = require('mongodb').MongoClient;
var mongoUser='root';
var mongoPwd='vis_ali_mongo';
//var url = 'mongodb://'+mongoUser+':'+mongoPwd+'@'+'172.17.0.1:27017/admin';
var url = 'mongodb://'+mongoUser+':'+mongoPwd+'@'+'127.0.0.1:27017/admin';
var url = 'mongodb://127.0.0.1:27017/admin';
//var url = 'mongodb://'+mongoUser+':'+mongoPwd+'@'+'ngrok.flyroom.info:27017/admin';
//var url = 'mongodb://'+mongoUser+':'+mongoPwd+'@'+'127.0.0.1';
var set=require('d3-collection').set;
var async=require('async');
var natural = require('natural'),
    stemmer = natural.LancasterStemmer;

//var database_name='anomaly_graph4';
//var database_name='vast_anomaly_graph';
//var scenario_num=11
//var scenario_num=9
var scenario_num=10
//var database_name='ctu13_anomaly_graph_'+scenario_num;
//var database_name='ctu13_anomaly_graph_'+scenario_num+'';
//var database_name='anomaly_graph4'
//var database_name='vast16_graph'
var database_name='ctu13_anomaly_graph_'+scenario_num+'';

var connectMongo=function(){
    console.log("connecting to mongodb");
    MongoClient.connect(url, function(err, db) {
        console.log("try to connect mongodb with status "+err);
    });
};
connectMongo()
var compareTime = function(time1, time2){	// time1 > time2 : 1; time1 = time2 : 0; time1 < time2 : -1
	time1 = time1.split(':');
	time2 = time2.split(':');
	for ( var i = 0; i < time1.length; i++){
		time1[i] = parseInt(time1[i]);
		time2[i] = parseInt(time2[i]);
		if ( time1[i] > time2[i]) return 1;
		else if ( time1[i] < time2[i]) return -1;
	}
	return 0;
};
var periodsIntersect = function(period1S, period1E, period2S, period2E){
	if (compareTime(period1S, period2S) * compareTime(period1S, period2E) <= 0 || compareTime(period1E, period2S) * compareTime(period1E, period2E) <= 0) return 1;
	else if(compareTime(period1S, period2S) >= 0 && compareTime(period1E, period2E) <= 0) return 1;
	else if(compareTime(period1S, period2S) <= 0 && compareTime(period1E, period2E) >= 0) return 1;
	else return 0;
};

var get_minutes = function(T_start, T_end){
    var result = [];
    var start_time = moment('2016:08:'+T_start,'YYYY:MM:D:H:m:s');
    var end_time = moment('2016:08:'+T_end,'YYYY:MM:D:H:m:s');
    var cur_time = moment('2016:08:'+T_start,'YYYY:MM:D:H:m:s');
    while(cur_time.isBefore(end_time)){
        result.push([cur_time.date(),cur_time.hour(),cur_time.minute()]);
        cur_time.add(1,'m');
    }
    return result;
}

console.log(get_minutes('1:0:0:0','1:5:59:59'));

var get_hours = function(T_start, T_end){
    result = [];
    day1 = parseInt(T_start.split(':')[0]);
    hour1 = parseInt(T_start.split(':')[1]);
    if (T_end == 'EOD') T_end = [T_end.split(':')[0],'23','59','59'].join(':');
    day2 = parseInt(T_start.split(':')[0]);
    hour2 = parseInt(T_end.split(':')[1]);
    if (day1 == day2){
        for ( var hour = hour1; hour <= hour2; hour++){
        	result.push([day1,hour]);
        }
    }
    else{
        for (var hour = hour1; hour < 25; hour++){
        	result.push([day1,hour]);
        }
        for (var date = day1 + 1; date < day2; date++)
            for (var hour = 0; hour < 24; hour++)
                result.push([date,hour]);
        for (var hour = 0; hour <= hour2; hour++){
        	result.push([day2, hour]);
        }
    }
    return result;
}

var limitTime = function(limleft, limright, timeleft, timeright){
	var drop = 0;
	if (compareTime(timeright, limright) >= 0){
		timeright = limright;
	}
	if (compareTime(timeleft, limright) >= 0){
		timeleft = limright;
	}
	if (compareTime(timeright, limleft) <= 0){
		timeright = limleft;
	}
	if (compareTime(timeleft, limleft) <= 0){
		timeleft = limleft;
	}
	if ( (timeleft == limleft && timeright == limleft) || (timeright == limright && timeleft == limright)) drop = 1;
	return [drop, timeleft, timeright]
};

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.get('/test', function (req, res) {
    console.log(req.query);
    res.json({
        'hhh':'hello'
    })

});

console.log('server starting');
app.get('/GetAnomalyGraph',function(req,res){
        console.log('In GetAnomalyGraph')
	var query=req.query;
	var restartParam = 0.6;
	console.log("Incoming Query "+query.timeStart+'->'+query.timeEnd);
	var maxIter = query.propagate;
		
        console.log('maxIter:  '+maxIter);
	MongoClient.connect(url, function(err, db) {
    	if (maxIter == 0){
	    	db = db.db(database_name);
			var anomaly_threshold = parseFloat(query.anomalyScore);
	        var m_threshold = parseInt(query.mThres);
	        var h_threshold = parseInt(query.hThres);
	        var timeStart = query.timeStart;
	        var timeEnd = query.timeEnd;
	        var corrScore = JSON.parse(query.corrScore);
	        var nodeType = JSON.parse(query.nodeType);
	        var fuseType = query.fuseType;
	        var fullGraphFlag = parseInt(query.fullGraph);
	        
	        if (!anomaly_threshold) anomaly_threshold = 0;
	        if (!timeStart) timeStart = '1:0:0:0';
	        if (!timeEnd)	timeEnd = '14:23:59:59';
			if (!corrScore)corrScore = {'mm':0, 'mh':0, 'hh':0};
	        if (!fullGraphFlag) fullGraphFlag = 0;
	    	if (!nodeType) nodeType = {'m':1, 'h':1};
	        if (fuseType != 'space' && fuseType != 'time' && fuseType != 'spacetime') fuseType = 'original'; 
	        if (err)res.json({error: err});
		}
		else{
			db = db.db(database_name);
	        var anomaly_threshold = parseFloat(query.anomalyScore);
	        var m_threshold = parseInt(query.mThres);
	        var h_threshold = parseInt(query.hThres);
	        var timeStart = query.timeStart;
	        var timeEnd = query.timeEnd;
		//console.log('corrScore: #'+str(query.corrScore)+'#')
	        //var corrScore = JSON.parse(query.corrScore);
	        var corrScore = query.corrScore;
	        //var nodeType = JSON.parse(query.nodeType);
	        var nodeType = query.nodeType;
	        var fuseType = query.fuseType;
	        var maxIter = query.propagate;		//new
	        var detectNodeNumM = query.detectNodeNumM;
	        var detectNodeNumH = query.detectNodeNumH;
	        var originalTimeEnd = '';
	        var timeEndFlag = 0;
	        var datenum = parseInt(timeEnd.split(':')[0]);
	        var fullGraphFlag = parseInt(query.fullGraph);
	        
	        if (!anomaly_threshold) anomaly_threshold = 0;
	        if (!timeStart) timeStart = '1:0:0:0';
	        if (!timeEnd)	timeEnd = '14:23:59:59';
	        if (parseInt(timeEnd.split(':')[0]) < 2) {
	        	datenum = 2;
	        }
			if (!corrScore)corrScore = {'mm':0, 'mh':0, 'hh':0};
	        if (!fullGraphFlag) fullGraphFlag = 0;
	    	if (!nodeType) nodeType = {'m':1, 'h':1};
	        if (fuseType != 'space' && fuseType != 'time' && fuseType != 'spacetime') fuseType = 'original'; 
	        
	        if (datenum <= 0) res.send('timeStart date need to be bigger than 1');
	        if (!maxIter) maxIter = 5;
	        if (!detectNodeNumM) detectNodeNumM = 5;	
	        if (!detectNodeNumH) detectNodeNumH = 5;
		}
    	
    	var get_fullGraph = function(node_data, nodeType){
		    fullGraph = {};
		    //console.log('flyroom: In get_fullGraph with number of nodes: '+node_data.length)
		    for ( var i = 0; i < node_data.length; i++){
		    	node_index = node_data[i]['nodeIndex'];
		    	//console.log('flyroom: In loop of getting nodes: '+node_index)
		    	//if (nodeType['m'] == 0 && node_index[0] == 'm') continue;
		    	//if (nodeType['h'] == 0 && node_index[0] == 'h') continue;
		    	//console.log('flyroom: node '+node_index+' timeSeries length '+node_data[i]['timeSeries'].length)
		    	
		    	for ( var j = 0; j < node_data[i]['timeSeries'].length; j++){
		    		record = node_data[i]['timeSeries'][j];
		    		//times = get_hours(record['T_start'], record['T_end']);
		    		times = get_minutes(record['T_start'], record['T_end']);
		    		times.forEach(function(time){
		    			key = time[0] + '-' + time[1] + '-' + time[2];
					//console.log('times info for this record '+key)
		    			if (!fullGraph[key]){
		    				fullGraph[key] = 1;
		    			}
		    			else{
		    				//if (fullGraph[key] < record['weight']) fullGraph[key] = record['weight'];
		    				fullGraph[key] += 1;
		    			}
		    		})
		    	}
		    }
		    fullGraph_keys = Object.keys(fullGraph);
	            console.log('flyroom fullGraph_keys '+fullGraph_keys)
		    fullGraph_array = [];
		    for ( var i = 17; i < 20; i++){
		    	for ( var j = 0; j < 24; j++){
		    	    for ( var m = 0; m < 60; m++){
		    		key = i + '-' + j + '-' +m;
		    		if(fullGraph_keys.indexOf(key) == -1) continue;
                                var minutes = m+60*(j+24*(i-1));
		    		fullGraph_array.push([minutes, fullGraph[key]]);
                            }
		    	}
		    }
		    console.log('flyroom: returned fullgraph of size: '+fullGraph_array.length)
		    return fullGraph_array
		}
    	
        var getNodes=function(callback){
	    console.log('m_threshold '+m_threshold);
	    console.log('h_threshold '+h_threshold);
            var collection=db.collection('node_filtered_h' + h_threshold + '_m' + m_threshold);
			collection.find({'timeSeries':{'$elemMatch':{'weight': {'$gte': anomaly_threshold}}}}).toArray(function(err,docs){
                if (!fullGraphFlag) 
			fullGraph = [];
                else 
			fullGraph = get_fullGraph(docs, nodeType);
		var node_list = [];
		var node_data = {};
		if(err)
			res.json({'error':err});
		console.log('flyroom: getNodes docs length: '+docs.length)

                for(var i = 0; i < docs.length; i++){
                    node_index = docs[i]['nodeIndex'];
                	//if (nodeType['m'] == 0 && node_index[0] == 'm') continue;
                	//if (nodeType['h'] == 1) continue;
                	
                    node_name = docs[i]['nodeName'];
                    temp_data = JSON.parse(JSON.stringify(docs[i]));
                    temp_data['timeSeries'] = [];
                    
                    for(var j = 0; j < docs[i]['timeSeries'].length; j++){
                    	current_record = docs[i]['timeSeries'][j];
                    	var virtual_end_day = [current_record['T_start'].split(':')[0],'23','59','59'].join(':');
                    	
                    	if( current_record['T_end'] == 'EOD') {
                    		current_record['T_end'] = virtual_end_day;
                    		current_record['EOD'] = 1;
                    	}
                    	else 
				current_record['EOD'] = 0;
                    	
                    	if (compareTime(current_record['T_end'], timeStart) < 0 || compareTime(current_record['T_start'], timeEnd) > 0){
                    		continue;
                    	}
                    	
                    	if (compareTime(current_record['T_end'], timeEnd) >= 0) current_record['T_end'] = timeEnd;
                    	if (compareTime(current_record['T_start'], timeStart) <= 0) current_record['T_start'] = timeStart;
                    	if (current_record['T_start'] == current_record['T_end']) continue;
                    	
                    	temp_data['timeSeries'].push(current_record);
                    }
                    if( temp_data.timeSeries.length != 0){
                    	node_data[node_index] = temp_data;
	                    if(!(node_index in node_list)){
	                    	node_list.push(node_index);
	                    }
	                }
                }
                console.log('getNodes returned node_list length '+node_list.length);
	            callback(null, node_list, node_data, fullGraph);
			});
            
        };

        var getEdges=function(node_list, node_data, fullGraph, callback){
            var collection=db.collection('edge_filtered_h' + h_threshold + '_m' + m_threshold);
            collection.find({'source':{'$in':node_list}, 'target':{'$in':node_list}}).toArray(function(err,docs){
	       	    edge_data = [];
	            if(err)
			res.json({'error':err});
		    console.log('flyroom getEdges docs length '+docs.length)
	            for ( var i = 0; i < docs.length; i++){
                    	temp_data = JSON.parse(JSON.stringify(docs[i]));
                    	temp_data['timeSeries'] = [];
                    
                    	var current_corrScore = 0;
                	if ( temp_data['EdgeType'] == 'movement') current_corrScore = corrScore['mm'];
                	else if ( temp_data['EdgeType'] == 'measurement') current_corrScore =  corrScore['hh'];
                	else if ( temp_data['EdgeType'] == 'mixed') current_corrScore = corrScore['mh'];
	            	for ( var j = 0; j < docs[i]['timeSeries'].length; j++){
                    		current_record = docs[i]['timeSeries'][j];
                    		var virtual_end_day = [current_record['TimeStart'].split(':')[0],'23','59','59'].join(':');
                    		if (compareTime(current_record['TimeEnd'], timeStart) < 0 || compareTime(current_record['TimeStart'], timeEnd) > 0){
                    			continue
                    		}
                    	
				if (current_record['TimeEnd'] == 'EOD') current_record['TimeEnd'] = virtual_end_day;
				if (current_record['sourceTime']['end'] == 'EOD') current_record['sourceTime']['end'] = virtual_end_day;
				if (current_record['targetTime']['end'] == 'EOD') current_record['targetTime']['end'] = virtual_end_day;
				if (compareTime(current_record['TimeEnd'], timeEnd) >= 0) current_record['TimeEnd'] = timeEnd;
				if (compareTime(current_record['TimeStart'], timeStart) <= 0) current_record['TimeStart'] = timeStart;
                    	
				var drop1 = 0;
				var drop2 = 0;
                    		[drop1, current_record['sourceTime']['start'],current_record['sourceTime']['end']] = limitTime(timeStart, timeEnd,current_record['sourceTime']['start'],current_record['sourceTime']['end']);
                    		[drop2, current_record['targetTime']['start'],current_record['targetTime']['end']] = limitTime(timeStart, timeEnd, current_record['targetTime']['start'],current_record['targetTime']['end']);
                    		if (drop1 == 1 || drop2 == 1) continue;
                    	
                    		if (fuseType == 'space') current_record['weightRelative'] = current_record['weightRelative'] * current_record['spatialValue'];
                    		else if (fuseType == 'time') current_record['weightRelative'] = current_record['weightRelative'] * current_record['temporalValue'];
                    		else if (fuseType == 'spacetime') current_record['weightRelative'] = current_record['weightRelative'] * current_record['spatialValue'] * current_record['temporalValue'];
                    		if (current_record['weightRelative'] < current_corrScore) continue;
                    	
                    		temp_data['timeSeries'].push(current_record);
                    	}
                    if( temp_data.timeSeries.length != 0){
                    	edge_data.push(temp_data);
                    }
                }
                
                edge_node_list = [];
                edge_data.forEach(function(edge){
                	if (edge_node_list.indexOf(edge['source']) == -1) edge_node_list.push(edge['source']);
                	if (edge_node_list.indexOf(edge['target']) == -1) edge_node_list.push(edge['target']);
                });
                node_list.forEach(function(nodeIndex){
                	if (edge_node_list.indexOf(nodeIndex) == -1) delete node_data[nodeIndex]
                });
                
                
                
	            console.log('final response '+JSON.stringify(query),'nodes:',Object.keys(node_data).length,'edges:',Object.keys(edge_data).length);
                if ( maxIter == 0) res.json({"nodes": node_data, "edges": edge_data, 'fullGraph':fullGraph});
	            else{
	        		var node_from_edge = {};
	        		Object.keys(node_data).forEach(function(nodeIndex){
	        			var maxWeight = 0;
	        			for ( var i = 0; i < node_data[nodeIndex]['timeSeries'].length; i++){
	        				if(node_data[nodeIndex]['timeSeries'][i]['weight'] > maxWeight) maxWeight = node_data[nodeIndex]['timeSeries'][i]['weight'];
	        			}
	        			node_from_edge[nodeIndex] = maxWeight;
	        		});
	            	callback(null, node_from_edge, node_data, edge_data, fullGraph);
	            }
	            //console.log(JSON.stringify(query),'nodes:',node_list.length,'edges:',docs.length);
	        });
        };
        
        var BNpropagate = function(initNodes, node_data_original, edge_data_original, fullGraph_original, callback){
	        var collection = db.collection('historical_graph_14');
	        
	        var initializeGraph = function(initNodes, allNodes){
				var initNodeslist = Object.keys(initNodes);
	        	lastGraph = {};
	        	for ( var i = 0; i < allNodes.length; i++){
	        		var nodeIndex = allNodes[i]['nodeIndex']
	        		if ( initNodeslist.indexOf(nodeIndex) >= 0){
						lastGraph[nodeIndex] = {'anomalySum': initNodes[nodeIndex], 'seeds': {}};
						lastGraph[nodeIndex]['seeds'][nodeIndex] = initNodes[nodeIndex];
	        		}else lastGraph[nodeIndex] = {'anomalySum': 0, 'seeds': {}};
	        	}
	        	return lastGraph;
	        };
	        
	        var calcSeedAnomalySum = function(graph, initNodes){
				var initNodeslist = Object.keys(initNodes);
	        	var seedAnomalySum = 0;
	        	for ( var i = 0; i < initNodeslist.length; i++){
	        		if (initNodeslist[i][0] == 'm') seedAnomalySum += graph[initNodeslist[i]]['anomalySum'];
	        		//seedAnomalySum += graph[initNodeslist[i]]['anomalySum'];
	        	}
	        	return seedAnomalySum;
	        };
	        
	        var initializeInfoMap = function(allNodes){
	    		infoMap = {};
	        	for ( var i = 0; i < allNodes.length; i++){
	        		nodeIndex= allNodes[i]['nodeIndex'];
	        		infoMap[nodeIndex] = allNodes[i];
	        	}
	        	return infoMap;
	        };
	        
	        var calc_bp_graph = function(nodeIndex, infoMap, lastGraph){
	    		currentGraph = {};
	    		// initialize currengraph
	    		Object.keys(lastGraph).forEach(function(nodeIndex){
					currentGraph[nodeIndex] = {'anomalySum': 0, 'seeds': {}};
		    	});
		    	
		    	// restart
		    	for ( var i = 0; i < Object.keys(lastGraph).length; i++){
		    		var nodeIndex = Object.keys(lastGraph)[i];
			    	if ( Object.keys(lastGraph[nodeIndex]['seeds']).length == 0) continue;
		    		Object.keys(lastGraph[nodeIndex]['seeds']).forEach(function(seedIndex){
		    			var restartValue = lastGraph[nodeIndex]['seeds'][seedIndex] * restartParam;
		    			if ( Object.keys(currentGraph[seedIndex]['seeds']).indexOf(seedIndex) != -1) {
		    				currentGraph[seedIndex]['seeds'][seedIndex] += restartValue;
		    				currentGraph[seedIndex]['anomalySum'] += restartValue;
		    			}
		    			else {
		    				currentGraph[seedIndex]['seeds'][seedIndex] = restartValue;
		    				currentGraph[seedIndex]['anomalySum'] += restartValue;
		    			}
		    		});
		    	};
		    	
		    	// propagate
		    	for ( var i = 0; i < Object.keys(lastGraph).length; i++){
		    		var nodeIndex = Object.keys(lastGraph)[i];
		    		var propSum = lastGraph[nodeIndex]['anomalySum'] * ( 1 - restartParam );
		    		outEdges = infoMap[nodeIndex]['outEdge'];
		    		var seedKeylist = Object.keys(lastGraph[nodeIndex]['seeds']);
		    		for ( var j = 0; j < outEdges.length; j++){
		    			[targetIndex, weight] = outEdges[j];
		    			for ( var k = 0; k < seedKeylist.length; k++){
		    				var seedIndex = seedKeylist[k];
		    				var propTarget = ( lastGraph[nodeIndex]['seeds'][seedIndex] * ( 1 - restartParam ) * weight ) / infoMap[nodeIndex]['WeightedOutDegree'];
			    			if ( Object.keys(currentGraph[targetIndex]['seeds']).indexOf(seedIndex) != -1) {
			    				currentGraph[targetIndex]['seeds'][seedIndex] += propTarget;
			    				currentGraph[targetIndex]['anomalySum'] += propTarget;
			    			}
			    			else {
			    				currentGraph[targetIndex]['seeds'][seedIndex] = propTarget;
			    				currentGraph[targetIndex]['anomalySum'] += propTarget;
			    			}
			    		}
		    		}
		    	}
	        	return currentGraph;
	        };
	        collection.find({}).toArray(function(err,docs){
	        	var infoMap = initializeInfoMap(docs);
	        	var firstGraph = initializeGraph(initNodes, docs);
	        	var lastGraph = initializeGraph(initNodes, docs);
	        	var name_nodeindex_map = require('./data/nodeindex_name_map.json');
	        	var initSeedAnomalySum = calcSeedAnomalySum(firstGraph, initNodes);
	        	console.log('initSeed:', initSeedAnomalySum);
		        for ( var iter = 0; iter < maxIter; iter++){
		    		var currentGraph = calc_bp_graph(nodeIndex, infoMap, lastGraph);
		    		lastGraph = JSON.parse(JSON.stringify(currentGraph));
		        }
        		var lastSeedAnomalySum = calcSeedAnomalySum(currentGraph, initNodes);
        		var seedSumRatio = initSeedAnomalySum / lastSeedAnomalySum;
	        	console.log('finalSeed:', lastSeedAnomalySum);
		        var outputGraph = JSON.parse(JSON.stringify(currentGraph));
        		Object.keys(outputGraph).forEach(function(nodeIndex){
	    			outputGraph[nodeIndex] = outputGraph[nodeIndex]['anomalySum'];
	    		});
	    		console.log('afterBP, outputGraph node num:',Object.keys(outputGraph).length);
	    		callback(null, outputGraph, initNodes, infoMap, node_data_original, edge_data_original, fullGraph_original);
		    });
		}
		
		var PropOutput = function(outputGraph, initNodes, infoMap, node_data_original, edge_data_original, fullGraph_original){
			var filter_outputGraph_with_detectNum_and_initNodes = function(outputGraph, initNodes, detectNodeNumM, detectNodeNumH){
	        	initKeylist = Object.keys(initNodes);
	        	outputGraph_new = {};
	        	Object.keys(outputGraph).forEach(function(nodeIndex){
	        		if ( initKeylist.indexOf(nodeIndex) == -1 ) outputGraph_new[nodeIndex] = outputGraph[nodeIndex];
	        	});
	        	sortableM = [];
	        	sortableH = [];
	        	for ( var i = 0; i < Object.keys(outputGraph_new).length; i++){
	        		var key = Object.keys(outputGraph_new)[i];
	        		var value = outputGraph_new[key];
	        		if ( key[0] == 'h') sortableH.push([key, value]);
	        		if ( key[0] == 'm') sortableM.push([key, value]);
	        	}
	        	sortableM.sort(function(a, b) {
				    return b[1] - a[1];
				});
				sortableH.sort(function(a, b) {
				    return b[1] - a[1];
				});
				var resultM = {};
				for ( var i = 0 ; i < detectNodeNumM; i++){
					var current = sortableM[i];
					if ( current[1] == 0) break;
					resultM[current[0]] = current[1];
				}
				
				var resultH = {};
				for ( var i = 0 ; i < detectNodeNumH; i++){
					var current = sortableH[i];
					if ( current[1] == 0) break;
					resultH[current[0]] = current[1];
				}
	        	return [resultM, resultH];
	        };
	        
	    	var nodeIndex_to_nodedata = function(outputGraph, mainInfoMap){
	    		var keylist = Object.keys(outputGraph);
	    		var nodes = [];
	    		for ( var i = 0; i < keylist.length; i++){
	    			data = mainInfoMap[keylist[i]];
	    			record = {'weight': 0, 'SpaceRoom': 'Null', 'SpaceFloor': 'Null', 'SpaceZone': 'Null', 'T_start': timeStart, 'T_end': timeEnd,
	    		'Variable': ['Null', 'Null', 'Null']};
	    			node = {'nodeIndex': keylist[i], 'nodeName': data['nodeName'], 'dataType': data['dataType'], 'nodeFullName': data['nodeFullName'],
	    			'categories': data['categories'], 'timeSeries': [record], 'propagate': 1};
	    			nodes.push(node);
	    		}
	    		return nodes;
	    	};
	    	
	        var find_edge_by_new_nodes = function(newNodes, initNodes, infoMap, node_data){		// need to be tested
	        	var edges = [];
	        	var infoMap_keylist = Object.keys(infoMap);
	        	var init_keylist = Object.keys(initNodes);
	        	var new_keylist = Object.keys(newNodes);
	        	for ( var i = 0; i < new_keylist.length; i++){
	        		if (infoMap_keylist.indexOf(new_keylist[i]) == -1){
	        			console.log('error');
	        			continue;
	        		}
	        		inEdges = infoMap[new_keylist[i]]['inEdge'];
	        		var maxcouple = ['', 0];
	        		for ( var j = 0; j < inEdges.length; j++){
	        			var inEdge = inEdges[j];
	        			if ( inEdge[1] > maxcouple[1] && init_keylist.indexOf(inEdge[0]) != -1) maxcouple = inEdge;
	        		}
	        		if ( maxcouple[0] != ''){
	        			var EdgeType = '';
	        			var record = {};
	        			if ( maxcouple[0][0] == 'h' && new_keylist[i][0] == 'h') EdgeType = 'measurement';
	        			else if ( maxcouple[0][0] == 'm' && new_keylist[i][0] == 'm') EdgeType = 'movement';
	        			else EdgeType = 'mixed';
	        			
	        			var sourceTimeStart = node_data[maxcouple[0]]['timeSeries'][0]['T_start'];
	        			var sourceTimeEnd = node_data[maxcouple[0]]['timeSeries'][0]['T_end'];
	        			
	        			record = { 'temporalValue': 0, 'spatialValue': 0, 'categoricalValue': 0, 'weightAbsolute': 0, 'weightRelative': Math.round(maxcouple[1] * 100)/100, 
	        				'TimeStart': timeStart, 'TimeEnd': timeEnd, 'sourceTimeIndex': 0, 'targetTimeIndex': 0, 
		        			'sourceTime': {'start': sourceTimeStart, 'end': sourceTimeEnd}, 'targetTime': {'start': timeStart, 'end': timeEnd}}
						var edge = { 'source': maxcouple[0], 'target': new_keylist[i], 'EdgeType': EdgeType, 'propagate': 1, 'timeSeries': [record]};
						edges.push(edge);
	        		}
	        	}
	        	return edges;
	    	};
	    	
	    	var collection = db.collection('node_basic_info');
	        outputGraphCopy = JSON.parse(JSON.stringify(outputGraph));
	        
	        // filter by detectnum
	        [outputGraphM, outputGraphH] = filter_outputGraph_with_detectNum_and_initNodes(outputGraph, initNodes, detectNodeNumM, detectNodeNumH);
	        // filter by detectnum
	        
	        
	        // change below for outputGraphM,H
	        console.log('after filter with initAscore and initNodes, outputGraph num:' , Object.keys(outputGraph).length);
	        collection.find({'nodeIndex':{'$in':Object.keys(outputGraphH).concat(Object.keys(outputGraphM))}}).toArray(function(err,docs){
	    		var mainInfoMap = {};
	    		docs.forEach(function(record){
	    			nodeIndex = record['nodeIndex'];
	    			mainInfoMap[nodeIndex] = record;
	        	});
		        var outputNodesH = nodeIndex_to_nodedata(outputGraphH, mainInfoMap);
		        var outputNodesM = nodeIndex_to_nodedata(outputGraphM, mainInfoMap);
		        var outputEdgesH = find_edge_by_new_nodes(outputGraphH, initNodes, infoMap, node_data_original);
		        var outputEdgesM = find_edge_by_new_nodes(outputGraphM, initNodes, infoMap, node_data_original);
		        
		        for ( var i = 0; i < outputNodesH.length; i++){
		        	node_data_original[outputNodesH[i]['nodeIndex']] = outputNodesH[i];
		        };
		        for ( var i = 0; i < outputNodesM.length; i++){
		        	node_data_original[outputNodesM[i]['nodeIndex']] = outputNodesM[i];
		        };
		        
		        edge_data_original = edge_data_original.concat(outputEdgesM).concat(outputEdgesH);
		        // change up
		        res.json({"nodes": node_data_original, "edges": edge_data_original, "fullGraph": fullGraph_original});
	        });
		};
		
		if (maxIter == 0) async.waterfall([getNodes, getEdges]);
		else async.waterfall([getNodes, getEdges, BNpropagate, PropOutput]);
    });
});

app.listen(5020);
