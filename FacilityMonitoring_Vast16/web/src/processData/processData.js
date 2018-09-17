import {Graph} from '../processData/calculateLayout';
function getTime(time,measure){
    var m=measure||timeMeasure;
    var times=time.split(':');
    var day=parseInt(times[0]);
    var hour=parseInt(times[1]);
    var minute=parseInt(times[2]);
    var second=parseInt(times[3]);
    var t;
    if(m=='day'){
        t=day;
    }
    else if(m=='hour'){
        t=(day-1)*24+hour;
    }
    else if(m=='minute'){
        t=(day-1)*24*60+hour*60+minute;
    }
    else if(m=='second'){
        t=(day-1)*24*60*60+hour*60*60+minute*60+second;
    }
    //return String(t);
    return t+'';
}
function getTimeStringWithoutYear(time,measure){
    var m=measure||timeMeasure;
    var t;
    var day=0,hour=0,minute=0,second=0;
    if(m=='day'){
        day+=time;
    }
    else if(m=='hour'){
        day+=parseInt(time/24)+1;
        hour=time%24;
    }
    else if(m=='minute'){
        day+=parseInt(time/(24*60))+1;
        time=time%(24*60);
        hour=parseInt(time/60);
        minute=time%60;
    }
    else if(m=='second'){
        day+=parseInt(time/(24*60*60))+1;
        time=time%(24*60*60);
        hour=parseInt(time/(60*60));
        time=time%(60*60);
        minute=parseInt(time/60);
        second=time%60;
    }
    return day+':'+hour+':'+minute+':'+second;
}
function getTimeString(time,measure){
    var m=measure||timeMeasure;
    var t;
    var year=2016,day=151,hour=0,minute=0,second=0;
    if(m=='day'){
        day+=time;
    }
    else if(m=='hour'){
        day+=parseInt(time/24)+1;
        hour=time%24;
    }
    else if(m=='minute'){
        day+=parseInt(time/(24*60))+1;
        time=time%(24*60);
        hour=parseInt(time/60);
        minute=time%60;
    }
    else if(m=='second'){
        day+=parseInt(time/(24*60*60))+1;
        time=time%(24*60*60);
        hour=parseInt(time/(60*60));
        time=time%(60*60);
        minute=parseInt(time/60);
        second=time%60;
    }
    return year+':'+day+':'+hour+':'+minute+':'+second;
}
function processData(d){

    var measure=this.timeMeasure;
    var measures=['day','hour','minute'];
    if(this.requestMethod=='ajax'||this.requestMethod=='local'){
        for(var key in d.cluster){
            var cluster=d.cluster[key];
            var nodeYearInfo={};
            var list=[];
            if(cluster.timeSeries){
                cluster.timeSeries.forEach(function(item){
                    var start=getTime(item.T_start,measure);
                    var end=getTime(item.T_end,measure);
                    for(var i=+start;i<=+end;i++){
                        if(nodeYearInfo[i]){
                            //if(nodeYearInfo[i]<item.weight){
                                nodeYearInfo[i]+=item.weight;
                            //}
                        }
                        else nodeYearInfo[i]=item.weight;
                    }
                });
                cluster.nodeYearInfo=nodeYearInfo;
            }
            cluster.nodeTime={};
            measures.forEach(function(measure){
                if(cluster.timeSeries){
                    var nodeTimeInfo={};
                    cluster.timeSeries.forEach(function(item){
                        var start=getTime(item.T_start,measure);
                        var end=getTime(item.T_end,measure);
                        for(var i=+start;i<=+end;i++){
                            if(nodeTimeInfo[i]){
                                //if(nodeTimeInfo[i]<item.weight){
                                    nodeTimeInfo[i]+=item.weight;
                                //}
                            }
                            else nodeTimeInfo[i]=item.weight;
                        }
                    });
                    cluster.nodeTime[measure]=nodeTimeInfo;
                }
            });
            cluster.size=1;
            cluster.nodeidlist=[];
            cluster.author='';
            cluster.venue='';
            cluster.author_venue={
                author:'',
                venue:''
            }
        }
        for(var i=0;i< d.edge.length;i++){
            var edge= d.edge[i];
            edge.oldWeight={};
            edge.timeInfo={};
            edge.oldTimeInfo={};
            measures.forEach(function(m){
                edge.oldTimeInfo[m]={};
                edge.timeInfo[m]={};
                edge.timeSeries.forEach(function(item){
                    //var sourceT=getTime(item.sourceTime.start,m)+'_'+getTime(item.sourceTime.end,m);
                    //var targetT=getTime(item.targetTime.start,m)+'_'+getTime(item.targetTime.end,m);
                    //var t=sourceT+'-'+targetT;
                    var t=getTime(item.TimeStart,m)+'-'+getTime(item.TimeEnd,m);
                    if(edge.oldTimeInfo[m][t])edge.oldTimeInfo[m][t]+=1;
                    else edge.oldTimeInfo[m][t]=1;
                });
                for(var key in edge.oldTimeInfo[m]){
                    var years;
                    (key.split('-').length==2) ? years=key.split('-'):years=key.split('_');
                    var targetYear=years[1].toInt();
                    if(edge.timeInfo[m][targetYear])edge.timeInfo[m][targetYear]+=edge.oldTimeInfo[m][key];
                    else edge.timeInfo[m][targetYear]=edge.oldTimeInfo[m][key];
                }
            });
            edge.timeSeries.forEach(function(item){
                var t=getTime(item.TimeStart,measure)+'-'+getTime(item.TimeEnd,measure);
                if(edge.oldWeight[t])edge.oldWeight[t]+=1;
                else edge.oldWeight[t]=1;
            });
            edge.weight = {};
            edge.flow=1;
            for(var key in edge.oldWeight){
                var years;
                (key.split('-').length==2) ? years=key.split('-'):years=key.split('_');
                var targetYear=years[1].toInt();
                if(edge.weight[targetYear])edge.weight[targetYear]+=edge.oldWeight[key];
                else edge.weight[targetYear]=edge.oldWeight[key];
            }
        }
    }
    this.fontScale=d3.scaleLinear()
        .domain([40,5])
        .range([20,5]);
    var json_nodes= this.dataPreProcess(d);
    var json_edges=d.edge;
    var fullGraph= d.fullGraph;
    this.data.postData[this.focusedID]={edge:json_edges, node:json_nodes,fullGraph:fullGraph};
    var assistEdge=[];
    var newGraph=new Graph(this.data.postData[this.focusedID],assistEdge,this.layout_engine,this.draw_standalone_nodes);
    this.reCalculateLayout(newGraph,this.data.postData[this.focusedID]);
    this.reverseXY(this.data.postData[this.focusedID]);
    this.getTimeData(this.data.postData[this.focusedID]);
    this.coordinateOffset(this.data.postData[this.focusedID]);
    filterSelfEdge(this.data.postData[this.focusedID]);
    this.setInitNodeTransition(this.data.postData[this.focusedID]);
    this.setInitEdgeTransition(this.data.postData[this.focusedID]);
    this.getRelation(this.data.postData[this.focusedID]);
    getCurves(this.data.postData[this.focusedID]);
    if(this.focusedID&&this.preFocusedID){
        var fID=parseInt(this.focusedID.split('_')[1]);
        var pID=parseInt(this.preFocusedID.split('_')[1]);
        if(fID>pID){
            generateTransitionData(this.data.postData[this.focusedID],this.data.postData[this.preFocusedID]);
        }
        else if(fID<pID){
            generateTransitionData(this.data.postData[this.preFocusedID],this.data.postData[this.focusedID]);
        }
    }
}
function edgeAdjustment(d){
    var edges=d.edge;
    for(var i=0;i<edges.length;i++){
        var edge = edges[i];
        var p=edge.points;
        var x1,y1,x2,y2,r1,r2,dis;
        var last=p.length-1;
        dis=distance(p[0].x,p[0].y,p[last].x,p[last].y);
        r1=sizeScale.sizeScale(p[0].size);
        r2=sizeScale.sizeScale(p[last].size);
//        x1=getstart(p[0].x,p[last].x,r1,dis);
//        y1=getstart(p[0].y,p[last].y,r1,dis);
        x2=getend(p[last].x,p[0].x,r2,dis);
        y2=getend(p[last].y,p[0].y,r2,dis);
        var adjustList=[p[last-3],p[last-2],p[last-1],p[last]];

        var originPoints=adjustPoints(adjustList,{x:x2, y:y2});
        edge.originPoints=originPoints;

    }
}
function adjustPoints(points,point){
    var origin=[];
    origin=clone(points, origin);
    var box=findBoxOfPoints(points);
    points[1].ratioToLeft=(points[1].x-box.x)/box.width;
    points[1].ratioToTop=(points[1].y-box.y)/box.height;
    points[2].ratioToLeft=(points[2].x-box.x)/box.width;
    points[2].ratioToTop=(points[2].y-box.y)/box.height;
    points[3].x=point.x;
    points[3].y=point.y;
    var newBox=findBoxOfPoints(points);
    points[1].x = newBox.width*points[1].ratioToLeft+newBox.x;
    points[2].x = newBox.width*points[2].ratioToLeft+newBox.x;
    points[1].y = newBox.height*points[1].ratioToTop+newBox.y;
    points[2].y = newBox.height*points[2].ratioToTop+newBox.y;
    return origin;
//    svg.selectAll('whatever')
//        .data(points)
//        .enter()
//        .append('circle')
//        .each(function(d){
//            d3.select(this)
//                .attrs({
//                    cx:d.x,
//                    cy:d.y,
//                    r:5
//                })
//                .styles({
//                    fill:'black'
//                })
//        })

}
function filterSelfEdge(d){
    var edge=d.edge
    var newEdge=[]
    for(var i=0;i<edge.length;i++){
        if(edge[i].source!=edge[i].target){
            newEdge.push(edge[i])
        }
    }
    d.edge = newEdge;

}
function countFlow(edges){
    var flow=0;
    for(var i=0;i<edges.length;i++){
        flow+=edges[i].flow;
    }
    return flow;
}
function countYearFlow(edges){
    var flow=0;
    for(var i=0;i<edges.length;i++){
        flow+=edges[i].flow*edges[i].yearWeight;
    }
    return flow;
}
function countCitation(edges){
    var citation=0;
    for(var i=0;i<edges.length;i++){
        citation+=edges[i].citation;
    }
    return citation;
}
function filterDataByYear(d,timeFilter){
    //过滤完之后需要更新id
    var nodes= d.node;
    var edges=d.edge;
    var nodeTimeSeriesDic={};
    var m='second';
    nodes.forEach(function(node){
        var id=node.id;
        node.timeSeries.forEach(function (item) {
            var start=item.T_start;
            var end=item.T_end;
            var key=id+'-'+getTime(start,m)+'-'+getTime(end,m);
            nodeTimeSeriesDic[key]=item;
        });
    });
    //console.log('filterDataByYear nodeTimeSeriesDic');
    //console.log(nodeTimeSeriesDic);
    edges.forEach(function(edge,i){
        var source=edge.source;
        var target=edge.target;

        edge.timeSeries.forEach(function(item,j){
            var sourceTime=item.sourceTime;
            var targetTime=item.targetTime;
            var sourceKey=source+'-'+getTime(sourceTime.start,m)+'-'+getTime(sourceTime.end,m);
            var targetKey=target+'-'+getTime(targetTime.start,m)+'-'+getTime(targetTime.end,m);
	    if (!(sourceKey in nodeTimeSeriesDic)){
                item.sourceTime.anomalyWeight=0;
		//console.log('sourcekey not found in nodeTimeSeriesDic '+sourceKey);
	    }
	    else
                item.sourceTime.anomalyWeight=nodeTimeSeriesDic[sourceKey].weight;
	    if (!(targetKey in nodeTimeSeriesDic)){
                item.targetTime.anomalyWeight=0
		//console.log('targetkey not found in nodeTimeSeriesDic '+sourceKey);
	    }
	    else
                item.targetTime.anomalyWeight=nodeTimeSeriesDic[targetKey].weight;
        });
    });
    //var edgeSet={};
    //var nodesDic={};
    //nodes.forEach(function(node){
    //    node.sourceNodes=[];
    //    node.targetNodes=[];
    //    nodesDic[node.id]=node;
    //});
    //edges.forEach(function (edge) {
    //    var source=edge.source;
    //    var target=edge.target;
    //    var key=source+'-'+target;
    //    if(!edgeSet[key]){
    //        edgeSet[key]=1;
    //        var sn=nodesDic[source];
    //        var tn=nodesDic[target];
    //        sn.targetNodes.push(tn);
    //        tn.sourceNodes.push(sn);
    //        //edge.sourceNode=sn;
    //        //edge.targetNode=tn;
    //    }
    //});
    var newEdges=[];
    var newNodes=[];
    var timeMeasure=this.timeMeasure;
    var animateMode=this.animateMode;
    var flipBook=this.flipBook;
    var movie=this.movie;
    var yearDelay=this.yearDelay;
    var minTime=this.minTime;
    //filter edges
    for(var i=0;i<edges.length;i++) {
        var edge=edges[i];
        if ((edge.sourceTime.start>=timeFilter[0]&&edge.sourceTime.end<=timeFilter[1])||(edge.sourceTime.start<=timeFilter[0]&&edge.sourceTime.end>=timeFilter[1])) {
            if((edge.targetTime.start>=timeFilter[0]&&edge.targetTime.end<=timeFilter[1])||(edge.targetTime.start<=timeFilter[0]&&edge.targetTime.end>=timeFilter[1])){
                newEdges.push(edges[i]);
                newEdges[newEdges.length - 1].delay -= yearDelay * (timeFilter[0] - minTime);
            }
        }
    }
    for(var i=0;i<nodes.length;i++){
        nodes[i].sourceID = false;
        nodes[i].targetID = false;
    }
    for(var i=0;i<newEdges.length;i++){
        var edge=newEdges[i];
        var source=edge.source;
        var target=edge.target;

            if(nodes[source].targetID&&!in_array(target, nodes[source].targetID))
                nodes[source].targetID.push(target);
            else {
                nodes[source].targetID=[target.toString()];
            }

        nodes[target].sourceID=source.toString();
    }
    for(var i=0;i<nodes.length;i++) {

        var j=0;
        var newNodeYearInfo={};
        var len=0;
        var preStatus=minTime;
        if(animateMode==flipBook) {
            for (var key in nodes[i].nodeTime[timeMeasure]) {
                if (key.toInt() < timeFilter[0])preStatus = key.toInt();
                else break;
            }
        }
        else if(animateMode==movie){
            preStatus=timeFilter[0];
        }
        var k=0;
        var newDelay=[];
        var delaySum=0;
        for(var key in nodes[i].nodeTime[timeMeasure]){

            var year=key.toInt();
            if(animateMode==flipBook){
                if(year>=timeFilter[0]&&year<=timeFilter[1]){
                    newNodeYearInfo[key]=nodes[i].nodeTime[timeMeasure][key];
                    newDelay.push(nodes[i].delay[k]);
                    len+=1;
                }
                else if(year<timeFilter[0]){
                    delaySum+=nodes[i].delay[k];
                }
            }
            else{
                if(year>=preStatus&&year<=timeFilter[1]){
                    newNodeYearInfo[key]=nodes[i].nodeTime[timeMeasure][key];
                    newDelay.push(nodes[i].delay[k]);
                    len+=1;
                }
                else if(year<preStatus){
                    delaySum+=nodes[i].delay[k];
                }
            }
            k+=1;
        }
        if(len>0){
//            setNodeTransition(nodes, preYear);
            newDelay[0]+=delaySum;
            newNodes.push(nodes[i]);
	    //console.log('nodes info in filterDataByYear');
	    //console.log(nodes[i]);
            var minKey=100000000;
            var size=0;
            for(var key in newNodeYearInfo){
                //size+=newNodeYearInfo[key];
                var year=key.toInt();
                if(year<minKey)minKey=year;
            }
            if(animateMode==flipBook) {
                for (var key in nodes[i].nodeTime[timeMeasure]) {
                    if (!newNodeYearInfo[key])newNodeYearInfo[minKey] += nodes[i].nodeTime[timeMeasure][key];
                }
            }
            var timeSeries=nodes[i].timeSeries;
            var sizes=[]
            timeSeries.forEach(function (item) {
                var start=+getTime(item.T_start,timeMeasure);
                var end=+getTime(item.T_end,timeMeasure);
		// 			start    end
		// timeFilter[1]
                if(!(timeFilter[1]<=start||timeFilter[0]>=end)){
                    //var tArray=[start,end,timeFilter[0],timeFilter[1]].sort(function(a,b){return d3.ascending(a,b)});
                    //var subSize=((tArray[2]-tArray[1]+1)/(end-start+1))*item.weight;
                    //size+=((tArray[2]-tArray[1]+1)/(end-start+1))*item.weight;
                    sizes.push(item.weight);
		    item.show=true;
                }
		else
		    item.show=false;
            });
            newNodes[newNodes.length-1].nodeTime[timeMeasure]=newNodeYearInfo;
            newNodes[newNodes.length-1].delay=newDelay;
            newNodes[newNodes.length-1].newSize=d3.max(sizes,function(d){return d});
        }
    }
    if(animateMode==flipBook)this.setNodeTransition(newNodes, timeFilter[0]);
    if(animateMode==movie)this.setNodeTransition(newNodes, timeFilter[0]);
//    if(animateMode==movie)setNodeTransition(newNodes, preYear);
    var newD=JSON.parse(JSON.stringify(d));
    newD.node = newNodes;
    newD.edge = newEdges;
    var currentEdgeSourceDic={};
    var currentEdgeSourceTargetDic={};


    var currentEdgeTargetDic={};

    newEdges.forEach(function (edge) {
        var source=edge.source;
        var target=edge.target;
        var key=source+'-'+target;
        if(!currentEdgeSourceTargetDic[key]){
            currentEdgeSourceTargetDic[key]=[edge];
        }
        if(currentEdgeSourceDic[source]){
            if((currentEdgeSourceDic[source]).indexOf(target)==-1){
                currentEdgeSourceDic[source].push(target);
            }
        }
        else{
            currentEdgeSourceDic[source]=[target];
        }
        if(currentEdgeTargetDic[target]){
            if(currentEdgeTargetDic[target].indexOf(source)==-1){
                currentEdgeTargetDic[target].push(source);
            }
        }
        else{
            currentEdgeTargetDic[target]=[source];
        }
    });
    this.currentEdgeSourceTargetDic_axis=currentEdgeSourceTargetDic;
    this.currentEdgeSourceDic_axis=currentEdgeSourceDic;
    this.currentEdgeTargetDic_axis=currentEdgeTargetDic;
    return newD;
}
function setNodeTransition(nodes,preYear){
    var yearDelay=this.yearDelay;
    var timeFilter=this.timeFilter;
    var timeMeasure=this.timeMeasure;
    var maxTime=this.maxTime[timeMeasure];
    var minTime=this.minTime[timeMeasure];
    var timeDic={};
    for(var i=0;i<nodes.length;i++) {
        if(nodes[i].parentNode){
            nodes[i].sourceID = nodes[i].parentNode.id;
            nodes[i].parentNode=null;
//            delete(nodes[i].parentNode);
        }
        if(nodes[i].children){
            nodes[i].targetID=[]
            for(var j=0;j<nodes[i].children.length;j++){
                nodes[i].targetID.push(nodes[i].children[j].id);
            }
            nodes[i].children=null;
//            delete(nodes[i].children);
        }
        var thisYear;
        var lastYear=preYear;
        var sum=0;
//        nodes[i].delay = [];
        nodes[i].delay[0]-=yearDelay*(timeFilter[0]-minTime);
        nodes[i].ratio = [];
        nodes[i].sizeSeries=[];
        var j=0;
        for(var key in nodes[i].nodeTime[timeMeasure]){
            thisYear = parseInt(key);
            sum+=parseInt(nodes[i].nodeTime[timeMeasure][key]);
            var ratio=parseFloat(sum/nodes[i].size);
            nodes[i].sizeSeries.push(sum);
            nodes[i].ratio.push(ratio);
//            if(j==0){
//                var newDelay=yearDelay*(thisYear-lastYear);
//                if(nodes[i].sourceID)newDelay+=1000;
//                nodes[i].delay.push(newDelay);
//            }
//            else{
//                nodes[i].delay.push(yearDelay*(thisYear-lastYear));
//            }
            lastYear=thisYear;
            j+=1;
        }

        if(nodes[i].delay[0]<0){

//            for(var j=1;j<nodes[i].delay.length;j++){
            nodes[i].delay[1]+=nodes[i].delay[0];
//            }
            nodes[i].delay[0]=0;
        }
        nodes[i].sizeRatio=[];
        nodes[i].sizeDelay=[];

        //
        nodes[i].transitionTimeSeries=[];
        nodes[i].transitionTimeSeries[0]=nodes[i].delay[0];
        for (var j=1;j<nodes[i].delay.length;j++){
            nodes[i].transitionTimeSeries[j]=nodes[i].delay[j]+nodes[i].transitionTimeSeries[j-1];
        }

        nodes[i].sizeIncrease=[];
        nodes[i].sizeIncrease[0]=nodes[i].sizeSeries[0];
        nodes[i].sizeIncreaseRatio=[];
        for (var j=1;j<nodes[i].sizeSeries.length;j++){
            nodes[i].sizeIncrease[j]=nodes[i].sizeSeries[j]-nodes[i].sizeSeries[j-1];
        }


        for(var j=0;j<nodes[i].transitionTimeSeries.length;j++){
            var time=nodes[i].transitionTimeSeries[j];
            var nodeID=nodes[i].id;
            var deltaSize=nodes[i].sizeIncrease[j];
            if(!(time in timeDic))timeDic[time]={'sum':0,'list':[]};
            timeDic[time]['list'].push({'id':nodeID,'size':deltaSize});
            timeDic[time]['sum']+=deltaSize;
        }

        nodes[i].sizeRatio=clone(nodes[i].ratio, nodes[i].sizeRatio);
        nodes[i].sizeDelay=clone(nodes[i].delay, nodes[i].sizeDelay);

    }
    var nodesDic={};

    for(var i=0;i<nodes.length;i++){
        id=nodes[i].id;
        nodesDic[id]=nodes[i];
    }
    for(var time in timeDic){
        var obj=timeDic[time];
        var sum=obj['sum'];
        var list=obj['list'];

        var sizeList=[];
        for(var i=0;i<list.length;i++){
            sizeList.push(list[i]['size']);
        }
        var scale=d3.scaleLinear()
            .domain([0,d3.max(sizeList)])
            .range([0.2,1]);
        for(var i=0;i<list.length;i++){
            var id=list[i]['id'];
            var size=list[i]['size'];
            var index=nodesDic[id].transitionTimeSeries.indexOf(parseInt(time));
            var ratio=scale(size);
            if(ratio<0.5)ratio=0.01;
            nodesDic[id].sizeIncreaseRatio[index]=ratio;
            list[i]['ratio']=ratio;
        }
    }
    //console.log(timeDic);
}
function setInitNodeTransition(d){
    var timeMeasure=this.timeMeasure;
    var nodes=d.node;
    for(var i=0;i<nodes.length;i++){
        nodes[i].duration = 100;
        nodes[i].delay=[];
        var preStep;
        preStep=this.minTime;
        var j=0
        for (var key in nodes[i].nodeTime[timeMeasure]){
            var year=key.toInt();
            var delay=this.yearDelay*(year-preStep);
            if(j==0)delay+=1000;
            nodes[i].delay.push(delay);
            preStep=year;
            j+=1;
        }
    }
    for(var i=0;i<nodes.length;i++){
        if(nodes[i].focused=='true'){
            nodes[i].delay[0]-=1000;
            break;
        }
    }
//    nodes[0].delay[0]-=1000;
}
function setInitEdgeTransition(d){
    var timeMeasure=this.timeMeasure;
    var edges=d.edge;
    var newEdges=[];
    var that=this;
    var edgemaxTime=this.maxTime[timeMeasure];
    var edgeminTime=this.minTime[timeMeasure];
//    for(var i=0;i<edges.length;i++){
//        for(var key in edges[i].weight){
//            var year=parseInt(key);
//            if(year>edgemaxTime)edgemaxTime=year;
//            if(year<edgeminTime)edgeminTime=year;
//        }
//    }
    //console.log('setInitEdgeTransition '+edges.length);
    for(var i=0;i<edges.length;i++){
        var totalSum=0;
        for(var key in edges[i].weight){
            totalSum+=parseInt(edges[i].weight[key]);
        }
        var sum=0;
        //console.log('edge '+i+' event len: '+edges[i].timeSeries.length);
        edges[i].timeSeries.forEach(function (item) {
            var newEdge={};
            newEdge=clone(edges[i],newEdge);
            newEdge.timeSeries=[item];
            newEdge.sourceTime={start:+getTime(item.sourceTime.start,timeMeasure),end:+getTime(item.sourceTime.end,timeMeasure)};
            newEdge.targetTime={start:+getTime(item.targetTime.start,timeMeasure),end:+getTime(item.targetTime.end,timeMeasure)};
            newEdge.flow=item.weightRelative;
            newEdge.delay=that.yearDelay*(parseInt(key)-edgeminTime);
            newEdge.ratio=parseFloat(sum/totalSum);
            newEdge.duration=that.edgeDuration;
            newEdge.id=i;
            newEdges.push(newEdge);
        });
        //for(var key in edges[i].weight){
        //    sum+=parseInt(edges[i].weight[key]);
        //    var edge={};
        //    edge=clone(edges[i],edge);
        //    edge.year=parseInt(key);
        //    edge.delay=this.yearDelay*(parseInt(key)-edgeminTime);
        //    edge.ratio=parseFloat(sum/totalSum);
        //    edge.duration=this.edgeDuration;
        //    edge.id=i;
        //    newEdges.push(edge);
        //}
    }
    console.log('setInitEdgeTransition newEdges length '+newEdges.length);
    d.edge=newEdges;
}
function getTimeData(d){
    d.nodeTimeData={};
    var measures=['day','hour','minute'];
    var that=this;
    that.maxTime={};
    that.minTime={};
    that.minCount={};
    that.maxCount={};
    measures.forEach(function (m) {
        var nodeTimeDic={};
        for (var i=0;i<d.node.length;i++){
            //var subNodeTimeDic={};
            for (var key in d.node[i].nodeTime[m]){
                if(nodeTimeDic[key]){
                    //if(nodeTimeDic[key]<d.node[i].nodeTime[m][key]){
                        nodeTimeDic[key]+=d.node[i].nodeTime[m][key];
                    //}
                }
                else nodeTimeDic[key]=d.node[i].nodeTime[m][key];
            }
        }

        var nodeTimeData=[];
        for(var key in nodeTimeDic){
            nodeTimeData.push([parseInt(key), nodeTimeDic[key]]);
        }
        var maxT=+getTime(that.tEnd,m);
        var minT=+getTime(that.tStart,m);
        var maxTime=d3.max(nodeTimeData,function(d){return d[0]});
        var minTime=d3.min(nodeTimeData,function(d){return d[0]});
        var maxCount=d3.max(nodeTimeData,function(d){return d[1]});
        var minCount=d3.min(nodeTimeData,function(d){return d[1]});
        that.maxTime[m]=maxT;
        that.minTime[m]=minT;
        that.maxCount[m]=maxCount;
        that.minCount[m]=minCount;
        for(var i=minTime;i<=maxTime;i++){
            if(!nodeTimeDic[i])nodeTimeDic[i]=0;
        }
        //nodeTimeDic[maxTime+1]=0;
        //that.maxTime[m]+=1;
        nodeTimeData=[];
        for(var key in nodeTimeDic){
            nodeTimeData.push([parseInt(key), nodeTimeDic[key]]);
        }
        nodeTimeData.sort(function(a,b){return a[0]-b[0]});
        d.nodeTimeData[m]={data:nodeTimeData,maxTime:maxTime,maxCount:maxCount,minTime:minTime,minCount:minCount};
    });
    var getNodeTimeData=function(node){
        var subTimeMeasure='second';
        var maxT=+leftLayer.getTime(that.tEnd,subTimeMeasure);
        var minT=+leftLayer.getTime(that.tStart,subTimeMeasure);
        var subNodeTimeDic={};
        var subNodeTimeData=[];
        node.timeSeries.forEach(function (item) {
            var start=+leftLayer.getTime(item.T_start,subTimeMeasure);
            var end=+leftLayer.getTime(item.T_end,subTimeMeasure);
            subNodeTimeData.push([start,0,item.port]);
            subNodeTimeData.push([start,item.weight,item.port]);
            subNodeTimeData.push([end,item.weight,item.port]);
            subNodeTimeData.push([end,0,item.port]);
        });
        var maxC=d3.max(node.timeSeries,function(d){return d.weight});
        var minC=d3.min(node.timeSeries,function(d){return d.weight});
        return {data:subNodeTimeData,maxTime:maxT,maxCount:maxC,minTime:minT,minCount:0,timeMeasure:subTimeMeasure};
    };
    that.getNodeTimeData=getNodeTimeData;
    d.node.forEach(function(node){
        node.getTime=getTime;
        node.timeData=that.getNodeTimeData(node);

    });
    //this.timeFilter=[this.minTime,this.maxTime];
}
function generateTransitionData(chlData,parData){
    //process nodes
    var fID=parseInt(focusedID.split('_')[1]);
    var pID=parseInt(preFocusedID.split('_')[1]);
    var chlNodeIDDic={};
    var parNodeIDDic={};
    var transitionData={node:[],edge:[]};
    for(var i=0;i<chlData.node.length;i++){
        chlNodeIDDic[chlData.node[i].oldKey]=i;
    }
    for(var i=0;i<parData.node.length;i++){
        parNodeIDDic[parData.node[i].oldKey]=i;
    }
    for(var i=0;i<chlData.node.length;i++){
        if(chlData.node[i].oldKey=='300'){
            transitionData.node[i]={};
            transitionData.node[i]=clone(chlData.node[i],transitionData.node[i]);
            transitionData.node[i].x = parData.node[parNodeIDDic['300']].x;
            transitionData.node[i].y = parData.node[parNodeIDDic['300']].y;
        }
        else{
            var chlKey=chlData.node[i].oldKey;
            var parKey=data.incrementalTree[fID][chlKey].parent;
            transitionData.node[i]={};
            transitionData.node[i]=clone(chlData.node[i],transitionData.node[i]);
            transitionData.node[i].x = parData.node[parNodeIDDic[parKey]].x;
            transitionData.node[i].y = parData.node[parNodeIDDic[parKey]].y;
        }
    }
    //process edges
    transitionData.edge=clone(chlData.edge,transitionData.edge);
    for(var i=0;i<transitionData.edge.length;i++){
        var source=transitionData.edge[i].source;
        var target=transitionData.edge[i].target;
        var sourceX=transitionData.node[source].x;
        var sourceY=transitionData.node[source].y;
        var targetX=transitionData.node[target].x;
        var targetY=transitionData.node[target].y;
        transitionData.edge[i].points[0].x = sourceX;
        transitionData.edge[i].points[0].y = sourceY;
        transitionData.edge[i].points[2].x = targetX;
        transitionData.edge[i].points[2].y = targetY;

    }
    tmpNodes=transitionData.node;
    tmpCurves=transitionData.edge;
}
function generateAssistEdge(d){
    var clusterCount=parseInt(focusedID.split('_')[1]);
    var tmpNodeID=clusterCount+1;
    var tmpEdges=[];
//    console.log(d);
//    console.log(data.incrementalTree);
    var tree=data.incrementalTree[parseInt(clusterCount)-5];
    //get node id oldid dic
    var idDic={}
    for (var i=0;i<d.node.length;i++){
        idDic[d.node[i].oldKey]=i;
    }
    if(clusterCount!=5){
        for(var key in tree){
            var newNode=tmpNodeID;
            for(var i=0;i<tree[key].child.length;i++){
                var id=idDic[tree[key].child[i]];
                var newEdge={source:newNode,target:id};
                tmpEdges.push(newEdge);
            }
            tmpNodeID+=1;
        }
    }
    return tmpEdges;
}
function procrustes(graph1,graph2){
    function getNodeKeyDic(graph){
        var dic={};
        for(var i=0;i<graph.node.length;i++){
            var oldKey=graph.node[i].oldKey;
            dic[oldKey]=i;
        }
        return dic;
    }
    var graph1NodeDic=getNodeKeyDic(graph1);
    var graph2NodeDic=getNodeKeyDic(graph2);
//    console.log(graph1, graph2);
//    console.log(data.incrementalTree);
//    if(graph1.node.length<graph2.node.length){
        //small graph to large graph
        //translation
        var totalX=0;
        var totalY=0;
        var k=graph1.node.length+graph2.node.length;
        for(var i=0;i<graph1.node.length;i++){
            totalX+=graph1.node[i].x;
            totalY+=graph1.node[i].y;
        }
        for(var i=0;i<graph2.node.length;i++){
            totalX+=graph2.node[i].x;
            totalY+=graph2.node[i].y;
        }
        var avgX=totalX/k;
        var avgY=totalY/k;
        for(var i=0;i<graph1.node.length;i++){
            graph1.node[i].x-=avgX;
            graph1.node[i].y-=avgY;
        }
        for(var i=0;i<graph2.node.length;i++){
            graph2.node[i].x-=avgX;
            graph2.node[i].y-=avgY;
        }
        //uniform scaling
//    }
//    else{
        //large graph to small graph
//    }

}
function generateNodesDic(nodes){
    var dic={};
    for(var i= 0,len=nodes.length;i<len;i++){
        var key=nodes[i].oldKey;
        var value=nodes[i];
        dic[key]=value;
    }
    return dic
}
function generateTmpNodes(oldNodes,newNodes){
    var oldNodesDic=generateNodesDic(oldNodes);
    var newNodesDic=generateNodesDic(newNodes);
    tmpNodes=[];
    for(var i= 0,len=newNodes.length;i<len;i++){
        var tmp={};
        for(var key in newNodes[i]){
            tmp[key]=newNodes[i][key];
        }
        tmpNodes.push(tmp);
    }
    var t=0;

    for(var key in newNodesDic){
        if(!oldNodesDic[key]){
            var fatherKey=newNodesDic[key].father;
            var father=oldNodesDic[fatherKey];
            tmpNodes[t].x=father.x;
            tmpNodes[t].y=father.y;
        }
        else{
            tmpNodes[t].x = oldNodesDic[key].x;
            tmpNodes[t].y = oldNodesDic[key].y;

        }
        t+=1;

    }
}
function generateTmpCurves(oldCurves,newCurves){
    tmpCurves=[];
    for(var i= 0,len=newCurves.length;i<len;i++){
        var tmp={}
        for(var key in newCurves[i]){
            tmp[key]=newCurves[i][key];
        }
        tmpCurves.push(tmp);
        var id=newCurves[i].id;
        var existFlag=false;
        for(var j= 0,len1=oldCurves.length;j<len1;j++){
            if(oldCurves[j].id==id){
                existFlag=true;
                tmp.points=oldCurves[j].points;
                tmp.opacity=1;
                newCurves[i].opacity=1;
                newCurves[i].delay=0;
                newCurves[i].duration=duration;
                break;
            }

        }
        if(!existFlag){
            tmp.opacity=0;
            newCurves[i].opacity=1;
            newCurves[i].delay=3/4*duration;
            newCurves[i].duration=1/10*duration;
        }

    }
}
function getRelation(d){
    var nodes=d.node;
    var edges=d.edge;
    this.relation={};
    for (var i=0;i<nodes.length;i++)
    {
        var id=nodes[i].id.toInt();
        this.relation[id]=this.relationship.newrelation();
        this.relation[id].nodeid=i;
        for (var j=0;j<edges.length;j++)
        {
            if(edges[j].source==id||edges[j].target==id)
            {
                this.relation[id].edges.push(j);
            }
        }
    }
}
function typeofObj(obj) {
    return Object.prototype.toString.call(obj);
}
function cloneArray(fromObj,toObj){
    for(var j=0;j<fromObj.length;j++){
        var type=typeofObj(fromObj[j]);
        if(type == "[object Object]"){
            toObj[j]={};
            cloneObj(fromObj[j],toObj[j]);
        }
        else if(type == "[object Array]"){
            toObj[j]=[];
            cloneArray(fromObj[j],toObj[j])
        }
        else{
            toObj[j]=fromObj[j];
        }
    }
}
function cloneObj(fromObj,toObj){
    for(var i in fromObj){
        if(!in_array(i, cloneIngoreList)){
            if(typeofObj(fromObj[i])=="[object Object]"){
                toObj[i]={}
                cloneObj(fromObj[i],toObj[i]);
            }
            else if(typeofObj(fromObj[i])=="[object Array]"){
                toObj[i]=[];
                cloneArray(fromObj[i],toObj[i])
            }
            else{
                toObj[i]=fromObj[i];
            }
        }

    }
}
function clone(fromObj,toObj){
    //if (typeofObj(fromObj)=="[object Object]")cloneObj(fromObj,toObj);
    //else if(typeofObj(fromObj)=="[object Array]")cloneArray(fromObj,toObj);
    //else toObj=fromObj;
    return JSON.parse(JSON.stringify(fromObj));

}
function in_array(stringToSearch, arrayToSearch) {
    for (var s = 0; s < arrayToSearch.length; s++) {
        var thisEntry = arrayToSearch[s].toString();
        if (thisEntry == stringToSearch) {
            return true;
        }
    }
    return false;
}
function dataPreProcess(d){
    this.calculateEdgeCitation(d);
    var newId=[];
    var json_nodes=[];
    var i=0;
    this.maxSize=0;
    for (var key in d.cluster){
        var t=String(i);
        i+=1;
        newId[key]=t;
        d.cluster[key].size=1;
        if(d.cluster[key].size>this.maxSize)this.maxSize=d.cluster[key].size;
        d.cluster[key].id = t;
        d.cluster[key].oldKey=key;
        json_nodes[t]=d.cluster[key];
    }
    this.sizeScale=new this.SizeScale(this.maxSize,this);
    for (var i=0;i<d.edge.length;i++){
        var source=parseInt(newId[d.edge[i].source]);
        d.edge[i].source=source;

        var target=parseInt(newId[d.edge[i].target]);
        d.edge[i].target=target;

    }

    //calculate #citation of edge
    return json_nodes;
}
function calculateEdgeCitation(data){
    for(var i=0;i<data['edge'].length;i++){
        var edge=data['edge'][i];
        var flow=edge.flow;
        var source=edge.source;
        var target=edge.target;
        var sourceNode=data['cluster'][source];
        var sourceSize=1;
        var targetNode=data['cluster'][target];
        var targetSize=1;
        var citation=parseInt(flow*Math.sqrt(sourceSize*targetSize));
        data['edge'][i].citation=citation;
    }
}
function initData(nodes,edges) {
    sortByCitations(nodes);
    getData(nodes, edges);
    getRelation();
    coordinateOffset();
    getCurves();
//    splitLabels(nodes, edges);
}
function draw(){
    layout(optionNumber,false,false,data.postData[focusedID]);
}
function sortByCitations(data){
//    console.log(data);
    for (var i=1;i<data.length;i++){
        data[i].nodes.sort(function(a,b){
            return parseInt(b.citation_count)-parseInt(a.citation_count);
        })
    }
//    console.log(data);
}
function coordinate(sx,sy,tx,ty){
    var d=distance(sx,sy,tx,ty);
    var mid_x=(sx+tx)/2;
    var mid_y=(sy+ty)/2;
    var x=mid_x-((2-Math.sqrt(3))/4)*d;
    var y=mid_y-((2*Math.sqrt(3)-3)/4)*d;
    return [x,y];
}
function distance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow((y1-y2),2)+Math.pow((x1-x2),2));
}
function coordinateOffset(d){
    //console.log('coordinateOffset')
    //console.log(this);
    var nodes=d.node;
    var edges=d.edge;
    var screenPreviousData={};
    screenPreviousData=clone(d, screenPreviousData);
    this.data.screenPreviousData={};
    this.data.screenPreviousData[this.focusedID]=screenPreviousData;
    var sizeScale=this.sizeScale;
    var max_x,max_y,min_x,min_y;
    max_x = max_y=-100000;
    min_x = min_y=100000;
    for (var i=0;i<nodes.length;i++){
        if (parseInt(nodes[i].x+sizeScale.sizeScale(nodes[i].size))>max_x){max_x=parseInt(nodes[i].x+sizeScale.sizeScale(nodes[i].size));}
        if (parseInt(nodes[i].y+sizeScale.sizeScale(nodes[i].size)+50)>max_y){max_y=parseInt(nodes[i].y+sizeScale.sizeScale(nodes[i].size)+50);}
        if (parseInt(nodes[i].x-sizeScale.sizeScale(nodes[i].size))<=min_x){min_x=parseInt(nodes[i].x-sizeScale.sizeScale(nodes[i].size));}
        if (parseInt(nodes[i].y-sizeScale.sizeScale(nodes[i].size))<=min_y){min_y=parseInt(nodes[i].y-sizeScale.sizeScale(nodes[i].size));}
    }
    var x_basic=(this.svg.attr("width")-this.size.width)/2;
    var y_basic=(this.svg.attr("height")-this.size.height)/2;
    var x_offset=x_basic-min_x;
    var y_offset=y_basic-min_y;
    var x_zoom=this.size.width/(max_x-min_x);
    var y_zoom=this.size.height/(max_y-min_y);
    for (var i=0;i<nodes.length;i++){
        nodes[i].x+=x_offset;
        nodes[i].y+=y_offset;
    }
    for (var i=0;i<edges.length;i++){
        for (var j=0;j<edges[i].assists.length;j++){
            edges[i].assists[j][0]=parseInt(edges[i].assists[j][0]);
            edges[i].assists[j][1]=parseInt(edges[i].assists[j][1]);
            edges[i].assists[j][0]+=x_offset;
            edges[i].assists[j][1]+=y_offset;
        }
    }
    for (var i=0;i<nodes.length;i++){
        nodes[i].x-=x_basic;
        nodes[i].y-=y_basic;
        nodes[i].x*=x_zoom;
        nodes[i].y*=y_zoom;
        nodes[i].x+=x_basic;
        nodes[i].y+=y_basic;
    }
    for (var i=0;i<edges.length;i++){
        for (var j=0;j<edges[i].assists.length;j++){
            edges[i].assists[j][0]-=x_basic;
            edges[i].assists[j][0]*=x_zoom;
            edges[i].assists[j][0]+=x_basic;
            edges[i].assists[j][1]-=y_basic;
            edges[i].assists[j][1]*=y_zoom;
            edges[i].assists[j][1]+=y_basic;
        }
    }
    d.node=nodes;
    d.edge=edges;
}
function findCircleEdges(d){
    var nodes=d.node;
    var edges=d.edge;
    var edgeSourceTargetDic=getEdgeSourceTargetDic(edges);
    var nodeDic=getNodeDic(nodes);
    for (var i= 0,len=edges.length;i<len;i++){
        var source=edges[i].source;
        var target=edges[i].target;
        if(edgeSourceTargetDic[target])if(edgeSourceTargetDic[target][source]){
            var edge1=edges[i];
            var edge2=edgeSourceTargetDic[target][source];
            var p1={x:nodeDic[nodes[source].oldKey].x,y:nodeDic[nodes[source].oldKey].y};
            var p2={x:nodeDic[nodes[target].oldKey].x,y:nodeDic[nodes[target].oldKey].y};
            var p3={x:nodeDic[nodes[source].oldKey].x,y:nodeDic[nodes[source].oldKey].y};
            var p4={x:nodeDic[nodes[target].oldKey].x,y:nodeDic[nodes[target].oldKey].y};
            var e1={p1:p1,p2:p2};
            var e2={p1:p3,p2:p4};
            var newEdge=moveCircleEdge(e1, e2);
            edges[i].dx=e1.dx;
            edges[i].dy=e1.dy;
            edgeSourceTargetDic[target][source].dx=e2.dx;
            edgeSourceTargetDic[target][source].dy=e2.dy;

        }
    }
}
function getCurves(d){
    var nodes=d.node;
    var edges=d.edge;
    for (var i=0;i<edges.length;i++){
        var dx=0;
        var dy=0;
        if(edges[i].dx)dx=edges[i].dx;
        if(edges[i].dy)dy=edges[i].dy;
        var source_x=parseInt(nodes[edges[i].source].x)+dx;
        var source_y=parseInt(nodes[edges[i].source].y)+dy;
        var target_x=parseInt(nodes[edges[i].target].x)+dx;
        var target_y=parseInt(nodes[edges[i].target].y)+dy;
        var source_size=parseInt(nodes[edges[i].source].size);
        var target_size=parseInt(nodes[edges[i].target].size);
        var source_label=nodes[edges[i].source].label;
        var target_label=nodes[edges[i].target].label;
        var flow=edges[i].flow;
        var edgeType=edges[i].edgeType;
        var citation=edges[i].citation;
        var weight=edges[i].weight;
        var id=edges[i].id;
        var ratio=edges[i].ratio;
        var delay=edges[i].delay;
        var duration=edges[i].duration;
        var assist=coordinate(source_x,source_y,target_x,target_y);
        var year=edges[i].year;
        var structureType;
        var routerClusters=edges[i].routerClusters;
        var timeSeries=edges[i].timeSeries;
        var sourceTime=edges[i].sourceTime;
        var targetTime=edges[i].targetTime;
        if(edges[i].TreeEdge)structureType='treeEdge';
        else if(edges[i].NontreeEdge)structureType='nontreeEdge';
        else structureType='originEdge';
        edges[i]={
            source:edges[i].source,
            target:edges[i].target,
            points:[],
            nodes:[edges[i].source, edges[i].target],
            flow:flow,
            weight:weight,
            id:id,
            citation:citation,
            dx:dx,
            dy:dy,
            assists:edges[i].assists,
            edgeType:edgeType,
            delay:delay,
            duration:duration,
            ratio:ratio,
            year:year,
            structureType:structureType,
            routerClusters:routerClusters,
            timeSeries:timeSeries,
            sourceTime:sourceTime,
            targetTime:targetTime,
            propagate:edges[i].propagate,
            initZoom:1
        };
        var source_text,target_text;
        edges[i].points.push({x:source_x,y:source_y,size:source_size,text:source_label,id:edges[i].source});
        //if(1){
            for (var j=0;j<edges[i].assists.length;j++){
                edges[i].points.push({x:edges[i].assists[j][0],y:edges[i].assists[j][1],size:1,text:"",id:-1});
            }
        //}
       edges[i].points.push({x:target_x,y:target_y,size:target_size,text:target_label,id:edges[i].target});
    }
}
function calculateAssistPoint(x1,y1,x2,y2,x3,y3){
    var x0,y0;//p1p2中点
    var k1,b1 ;//p1p2直线的斜率与常数项
    var k2,b2;// 过p1p2直线中点垂线的斜率与常数项
    var a0,b0,c0;//圆与直线相交的二次方程系数
    var d;//所需距离
    var x4,y4,x5,y5;//解出来的两个点坐标，分列直线左右两侧
    var pi=Math.PI;
    var angle=pi/6;//角度
    var delta;//判别式
    x0 = (x1+x2)/2;
    y0 = (y1+y2)/2;
    k1 = (y2-y1)/(x2-x1);
    b1 = y1-k1*x1;
    k2 = (x1-x2)/(y2-y1);
    b2 = (y1+y2)/2+((x2-x1)*(x2+x1))/(2*(y2-y1));
    d = Math.tan(angle)*Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1))/2;
    a0 = 1+k2*k2;
    b0 = 2*k2*(b2-y0)-2*x0;
    c0 = x0*x0+(b2-y0)*(b2-y0)-d*d;
    delta=Math.sqrt(b0*b0-4*a0*c0);
    x4 = (-b0+delta)/(2*a0);
    y4 = k2*x4+b2;
    x5 = (-b0-delta)/(2*a0);
    y5 = k2*x5+b2;
    var value3,value4,value5;//判断左右
    value3 = k1*x3+b1-y3;
    value4 = k1*x4+b1-y4;
    value5 = k1*x5+b1-y5;
    var right,left;
    right = left = {};
    var p={}//所需结果
    if(value4>value5){
        right.x = x4;
        right.y = y4;
        left.x = x5;
        left.y = y5;
    }
    else{
        left.x = x4;
        left.y = y4;
        right.x = x5;
        right.y = y5;
    }
    if (value3>0){
        return right;
        //p3点在直线右侧
    }
    else if(value3<0){
        return left;
        //p3点在直线左侧
    }
    else{
        if(k1>=0){
            return left;
        }
        else{
            return right;
        }
    }
}
export{
    getTime,
    getTimeStringWithoutYear,
    getTimeString,
    processData,
    adjustPoints,
    filterSelfEdge,
    countFlow,
    countYearFlow,
    countCitation,
    filterDataByYear,
    setNodeTransition,
    setInitNodeTransition,
    setInitEdgeTransition,
    getTimeData,
    generateTransitionData,
    generateAssistEdge,
    procrustes,
    generateNodesDic,
    getRelation,
    typeofObj,
    cloneArray,
    cloneObj,
    clone,
    in_array,
    dataPreProcess,
    calculateEdgeCitation,
    draw,
    sortByCitations,
    coordinate,
    distance,
    coordinateOffset,
    findCircleEdges,
    getCurves
};
