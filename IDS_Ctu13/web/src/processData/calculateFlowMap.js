import{clone} from '../processData/processData';
function calculateFlowMap(d,relayout){
    var sizeScale=this.sizeScale;
    var directedGraph=this.directedGraph;
    var method=this.method;
    var edgeDuration=this.edgeDuration;
    var nodes=d.node;
    var edges=d.edge;
    var otherEdges=d.otherEdge;
    var treeEdges= d.deletedTreeEdges;
    var nonTreeEdges=d.deletedNonTreeEdges;
    getNodeRelation(nodes, edges);
    var edgeDic=getEdgeSourceTargetDic(edges);
    //find root
    var root;
    for(var i=0;i<nodes.length;i++){
        if(nodes[i].focused=='true')root = nodes[i];
    }
    root.y=this.svg.attr('height').toFloat()/2;

    var cluster={};
    generateCluster(root,cluster);
    generateNodes(cluster);
    getClusterBoundAndCenter(cluster);
    var subClusters=cluster.subClusters;
    for(var i=0;i<subClusters.length;i++){
        generateAssistNode(root, subClusters[i]);
    }
    cluster.isRoot = true;
    cluster.x = cluster.oriX;
    cluster.y = cluster.oriY;
    if(relayout){
        useCurrentNodePosition(cluster)
    }
    generateBezierNode(cluster);
    updateNodes(cluster);
//    d.edge=recoverEdges(otherEdges,edges);

    recoverTreeEdges(d);

    var recoverEdgeGraphInfo=getGraphInfo(d.node, d.edge);
    d.recoverEdgeGraphInfo=recoverEdgeGraphInfo;
//    printGraphInfo(recoverEdgeGraphInfo);
//    if(optionNumber.edgeFilter==1){
    if(method!='mst'){
        recoverNonTreeEdges(d);
    }
//    }
//    recoverNonTreeEdgeFlow=countFlow(edges);
    setDelay(cluster);
    setEdgeDuration(edges);
    function useCurrentNodePosition(cluster){
        if(cluster.subClusters){
            cluster.x = cluster.oriX;
            cluster.y = cluster.oriY;
            for(var i=0;i<cluster.subClusters.length;i++){
                useCurrentNodePosition(cluster.subClusters[i])
            }
        }
    }
    function setEdgeDuration(edges){
        for(var i=0;i<edges.length;i++){
            edges[i].duration=edgeDuration;
        }
    }
    function setDelay(cluster){
        function setEdgeDelay(cluster){
            if(cluster.subClusters){
                for(var i=0;i<cluster.subClusters.length;i++){
                    var key=cluster.originNodeID+'_'+cluster.subClusters[i].originNodeID;
                    var edge=edgeDic[key];
                    edge.delay = cluster.delay;
                    setDelay(cluster.subClusters[i]);
                }
            }
        }
//        console.log(cluster);
        if(cluster.isRoot){
            cluster.delay=0;
            var nodeID=parseInt(cluster.originNodeID);
            nodes[nodeID].delay=cluster.delay;
            nodes[nodeID].duration = 100;
            setEdgeDelay(cluster);
        }
        else{
            if(cluster.parentCluster){

                cluster.delay=200+cluster.parentCluster.delay;
                var nodeID=parseInt(cluster.originNodeID);
                nodes[nodeID].delay=cluster.delay;
                nodes[nodeID].duration = 100;
                setEdgeDelay(cluster);
            }
        }
//        if(cluster.subClusters){
//            for(var i=0;i<cluster.subClusters.le)
//        }

    }
    function updateNodes(cluster){

        if(cluster.subClusters){
            var nodeID=parseInt(cluster.originNodeID);
            if(cluster.x&&cluster.y){
                nodes[nodeID].x=cluster.x;
                nodes[nodeID].y=cluster.y;
            }
            for(var i=0;i<cluster.subClusters.length;i++){
                updateNodes(cluster.subClusters[i]);
            }
        }


    }
    function generateBezierNode(cluster){

        var pi=Math.PI;
        function setAssistNode(edge,p1,p2){
            var x1=p1.x;
            var x2=p2.x;
            var y1=p1.y;
            var y2=p2.y;
            edge.assists=[[x1,y1],[x2,y2]];
        }
        if(cluster.subClusters){
            var sourceID=cluster.originNodeID;
            var p0={x:cluster.x, y:cluster.y};
            var maxWeight=0;
            var maxCluster;
            var kNum=0;
            for(var i=0;i<cluster.subClusters.length;i++){
                if(cluster.subClusters[i].weight>maxWeight){
                    maxWeight=cluster.subClusters[i].weight;
                    maxCluster = cluster.subClusters[i];
                    kNum = i;
                }
            }
            var maxID=maxCluster.originNodeID;
            var p1={}
            if(maxCluster.nodes){
                p1 = {x:maxCluster.x,y:maxCluster.y};
            }
            else if(maxCluster.node){
                p1 = {x:maxCluster.oriX,y:maxCluster.oriY};
            }
            var maxCtrlPoint1={};
            var maxCtrlPoint2={};
            if(cluster.parentCluster){
                var preCtrlPoint=cluster.preControlPoint;
                var line1=get2PointFun(preCtrlPoint,p0);


                if(!line1.vertical){
                    var k=line1.k;
                    var angel=Math.atan(k);
                    var maxControlPoint1Length=getDistance(p0, p1)*cluster.preCtrlPointRatio;
                    maxCtrlPoint1.x = p0.x+maxControlPoint1Length*Math.cos(angel);
                    maxCtrlPoint1.y = p0.y+maxControlPoint1Length*Math.sin(angel);

                }
                else{
                    var maxControlPoint1Length=getDistance(p0, p1)*cluster.preCtrlPointRatio;
                    maxCtrlPoint1.x = p0.x;
                    maxCtrlPoint1.y = p0.y+maxControlPoint1Length;
                }
                maxCtrlPoint2=ratioPoint(p0, p1, 1/3);
            }
            else{
                //rootCluster
                if(cluster.subClusters){



                    maxCtrlPoint1=ratioPoint(p0, p1,2/3);
                    maxCtrlPoint2=ratioPoint(p0, p1,1/3);

                }
            }
            maxCluster.preControlPoint=maxCtrlPoint2;
            maxCluster.preCtrlPointRatio=getDistance(maxCtrlPoint2,p1)/getDistance(p0, p1);
            var vec1=new vector(p0, p1);
            var lineVec1=get2PointFun(p0,p1);
            var k1=lineVec1.k;
            var key=sourceID+'_'+maxID;
            setAssistNode(edgeDic[key],maxCtrlPoint1,maxCtrlPoint2);
            var p3=maxCtrlPoint1;
            var p4={};
            for(var i=0;i<cluster.subClusters.length;i++){
                if(i!=kNum){
                    var p2;
                    if(cluster.subClusters[i].nodes){
                        p2={x:cluster.subClusters[i].x,y:cluster.subClusters[i].y};
                    }
                    else if(cluster.subClusters[i].node){
                        p2 = {x:cluster.subClusters[i].oriX, y:cluster.subClusters[i].oriY};
                    }
                    var pt=ratioPoint(p0, p2, 1/3);
                    var dist=getDistance(p0, pt);

                    var vec2=new vector(p0, p2);
                    var lineVec2=get2PointFun(p0,p2);
                    var k2=lineVec2.k;

                    var angle=angleBetween(vec1, vec2);
                    var vecToX=new vector({x:0,y:0},{x:1,y:0});
                    var angleToX=angleBetween(vec2, vecToX);
                    var halfAngle=angle/2;

                    if(k1==0){
                        if(k2>0){
                            p4.x = p0.x+dist*Math.cos(halfAngle);
                            p4.y = p0.y+dist*Math.sin(halfAngle);
                        }
                        else if(k2<0){
                            p4.x = p0.x+dist*Math.cos(halfAngle);
                            p4.y = p0.y-dist*Math.sin(halfAngle);
                        }
                        else{
                            console.log('k1==k2 should not happen')
                        }
                    }
                    else if(k1>0){
                        if(k2>0){
                            if(k2>k1){
                                p4.x = p0.x+dist*Math.cos(angleToX-halfAngle);
                                p4.y = p0.y+dist*Math.sin(angleToX-halfAngle);
                            }
                            else if(k2<k1){
                                p4.x = p0.x+dist*Math.cos(angleToX+halfAngle);
                                p4.y = p0.y+dist*Math.sin(angleToX+halfAngle);
                            }

                        }
                        else if(k2<=0){
                            p4.x = p0.x+dist*Math.cos(halfAngle-angleToX);
                            p4.y = p0.y+dist*Math.sin(halfAngle-angleToX);
                        }

                    }
                    else if(k1<0){
                        if(k2>=0){
                            p4.x = p0.x+dist*Math.cos(halfAngle-angleToX);
                            p4.y = p0.y+dist*Math.sin(halfAngle-angleToX);
                        }
                        else if(k2<0){
                            if(k2<k1){
                                p4.x = p0.x+dist*Math.cos(angleToX-halfAngle);
                                p4.y = p0.y-dist*Math.sin(angleToX-halfAngle);
                            }
                            else if(k2>k1){
                                p4.x = p0.x+dist*Math.cos(angleToX-halfAngle);
                                p4.y = p0.y-dist*Math.sin(angleToX+halfAngle);
                            }

                        }
                    }

                    var newKey=sourceID+'_'+cluster.subClusters[i].originNodeID;
                    cluster.subClusters[i].preControlPoint={};
                    cluster.subClusters[i].preControlPoint=clone(p4,cluster.subClusters[i].preControlPoint);
                    cluster.subClusters[i].preCtrlPointRatio=getDistance(p4, p2)/getDistance(p0, p2);
                    setAssistNode(edgeDic[newKey],p3, p4);

                }
            }
            for(var i=0;i<cluster.subClusters.length;i++){
                generateBezierNode(cluster.subClusters[i]);
            }
        }


    }
    function generateAssistNode(node,cluster){
        if(cluster.subClusters){
            //get p0
            var p0=node;
            //get p1
            var maxWeight=0;
            var maxCluster;
            var k=0;
            for(var i=0;i<cluster.subClusters.length;i++){
                if(cluster.subClusters[i].weight>maxWeight){
                    maxWeight=cluster.subClusters[i].weight;
                    maxCluster = cluster.subClusters[i];
                    k = i;
                }
            }
            var bounds1=maxCluster.bounds;
            var line1={p1:p0, p2:maxCluster.center};
            var p1=getRectangleLineCrossPoint(bounds1, line1);

            //get p2

            var otherNodesBound=cluster.subClusters[0].bounds;
            for(var i=1;i<cluster.subClusters.length;i++){
                if(i!=k){
                    otherNodesBound=mergeRect(otherNodesBound,cluster.subClusters[i].bounds);
                }
            }
            var otherNodesCenter={x:otherNodesBound.x+otherNodesBound.width/2,y:otherNodesBound.y+otherNodesBound.height/2};
            var bounds2=otherNodesBound;
            var line2={p1:p0, p2:otherNodesCenter};
            var p2=getRectangleLineCrossPoint(bounds2,line2);

            var dist1=getDistance(p0, p1);
            var dist2=getDistance(p0, p2);
            var JumpCount={count:2};
            function recurJumpCluster(cluster,count){
                var newCount=count;
                if(cluster.subClusters){
                    var maxWeight=0;
                    var maxCluster;
                    for(var i=0;i<cluster.subClusters.length;i++){
                        if(cluster.subClusters[i].weight>maxWeight){
                            maxWeight=cluster.subClusters[i].weight;
                            maxCluster = cluster.subClusters[i];
                        }
                    }
                    count.count+=1;
                    recurJumpCluster(maxCluster,count)
                }


            }

            recurJumpCluster(cluster, JumpCount);

            if(JumpCount.count>2)JumpCount.count-=1;
            var shortestDist=d3.min([dist1, dist2])/JumpCount.count;
//        var biggerCluster=d3.max([cluster.subCluster1,cluster.subCluster2],function(d){return d.size});

            var p3=maxCluster.center;
            var biggerDist=getDistance(p0, p3);
            var bigFraction=parseFloat(shortestDist/biggerDist);
            var parentFraction=1-bigFraction;
            var x=p0.x*parentFraction+p3.x*bigFraction;
            var y=p0.y*parentFraction+p3.y*bigFraction;
            cluster.x=x;
            cluster.y=y;
            var newNode={x:x, y:y};
            for(var i=0;i<cluster.subClusters.length;i++){
                generateAssistNode(newNode,cluster.subClusters[i]);
            }
        }
    }
    function recoverEdges(otherEdge,edges){
        function recurSourceNode(sourceNode,targetID){
            if(sourceNode.children){
                for(var i=0;i<sourceNode.children.length;i++){

                }
            }
        }
        for(var i=0;i<otherEdge.length;i++){
            var sourceID=otherEdge[i].source;
            var sourceNode=nodes[sourceID];
            var targetID=otherEdge[i].target;
            recurSourceNode(sourceNode,targetID);
        }

//        return edges;


    }
    function recoverNonTreeEdges(d){
        function getLine(sourceID,targetID){
            return {p1:nodes[sourceID],p2:nodes[targetID]};
        }
        var edgeSourceTargetDic=directedGraph.edgeSourceTargetDic;
        var edges=d.edge;
        var nodes=d.node;
        var nonTreeEdges=d.deletedNonTreeEdges;
        var nonCrossEdges=[];

        for(var i=0;i<nonTreeEdges.length;i++){
            var sourceID=nonTreeEdges[i].source;
            var targetID=nonTreeEdges[i].target;
            var line1=getLine(sourceID,targetID);
            var crossCount=0;
            for(var j=0;j<edges.length;j++){
                var originSourceID=edges[j].source;
                var originTargetID=edges[j].target;
                var line2=getLine(originSourceID,originTargetID);
                var checkCross=get2LineCrossPoint(line1, line2);
                if(checkCross.isPointInLine1&&checkCross.isPointInLine2){
                    crossCount+=1;
                }
            }
//            if(crossCount <=3 ){
                nonCrossEdges.push(nonTreeEdges[i]);
//            }
        }
        //console.log(nonCrossEdges);
        for(var i=0;i<nonCrossEdges.length;i++){
            var source=nonCrossEdges[i].source;
            var target=nonCrossEdges[i].target;
            var sourceEdge,targetEdge;
            if(nodes[source]&&nodes[target]){
                for(var j=0;j<edges.length;j++){
                    if(edges[j].source == source){
                        sourceEdge=edges[j];
                    }
                    if(edges[j].target == target){
                        targetEdge=edges[j];
                    }
                }
                if(sourceEdge&&targetEdge){
//                    if(nodes[source].x<nodes[target].x){
//                        var newAssistNode=[sourceEdge.assists[0],targetEdge.assists[1]];
//                        nonCrossEdges[i].assists=newAssistNode;
//                        nonCrossEdges[i].edgeType='dash';
//                    }
//                    else{
                        var p1=ratioPoint(nodes[source],nodes[target],2/3);
                        var p2=ratioPoint(nodes[source],nodes[target],1/3);
                        nonCrossEdges[i].assists=[[p1.x, p1.y],[p2.x, p2.y]];
                        nonCrossEdges[i].edgeType='dash';
                        nonCrossEdges[i].NontreeEdge=true;
//                    }
                    edges.push(nonCrossEdges[i]);
                }
            }

        }

    }
    function recoverTreeEdges(d){
        var edges=d.edge;
        var edgeSourceTargetDic=getEdgeSourceTargetDic(edges);

        var treeEdges=d.deletedTreeEdges;
        var nontreeEdges=d.deletedNonTreeEdges;
        var len1,len2;
        var newDeletedEdges=[];
        var tmpEdges=[];
        newDeletedEdges=clone(treeEdges,newDeletedEdges);
        len1 = newDeletedEdges.length;
        len2 = tmpEdges.length;
        while(len1!=len2){
            len1 = newDeletedEdges.length;
            tmpEdges=[];
            for(var i=0;i<newDeletedEdges.length;i++){
                var flag;
                var originEdge;
                var newPath;
                var originSource;
                var originTarget;
                var originKey;
                if(method=='recoveryWeight'){
                    originEdge=newDeletedEdges[i].originEdge;
                    newPath=newDeletedEdges[i].newPath;
                    flag=true;
                    originSource=originEdge.source;
                    originTarget=originEdge.target;


                    originKey=originSource+'_'+originTarget;

//                    flag = false;
                    for(var j=0;j<newPath.edges.length;j++){
                        var newEdge=newPath.edges[j];
                        var newSource=newEdge.source;
                        var newTarget=newEdge.target;
                        var newKey=newSource+'_'+newTarget;
                        if(!edgeSourceTargetDic[newKey]){
                            flag = false;
                            break;
                        }
                    }
                }
                else{
                    originEdge=newDeletedEdges[i];
                    originSource=originEdge.source;
                    originTarget=originEdge.target;
                    originKey=originSource+'_'+originTarget;
                    flag=false;
                }

                if(flag == false){
                    var dijPath;
                    if(method=='mst')dijPath=directedGraph.maximalSpanningTree.findMaxPathBetween(originSource, originTarget);
                    else dijPath=directedGraph.findMaxPathBetween(originSource, originTarget);
                    if(dijPath[0]){
                        newPath = dijPath[0];
                        flag = true;
                    }
                }
                if(flag == true){
                    var assists=[];
                    var routerClusters=[]
                    for(var j=0;j<newPath.length;j++){
                        routerClusters.push(newPath.edges[j].source);
                        var source=newPath.edges[j].source;
                        var sourceNode=[nodes[source].x, nodes[source].y];
                        var target=newPath.edges[j].target;
                        var targetNode=[nodes[target].x,nodes[target].y];
                        var tmpKey=source+'_'+target;
                        assists.push(sourceNode);
                        for(var k=0;k<edgeSourceTargetDic[tmpKey].assists.length;k++){
                            assists.push(edgeSourceTargetDic[tmpKey].assists[k]);
                        }
                        assists.push(targetNode);

                    }
                    routerClusters.push(originEdge.target);

                    assists=assists.slice(1,assists.length);
                    assists=assists.slice(0,assists.length-1);

                    originEdge.assists=assists;
                    originEdge.TreeEdge=true;
                    originEdge.routerClusters=routerClusters;
//                    edgeSourceTargetDic[originKey]=originEdge;
                    edges.push(originEdge);

                }
                else{
                    tmpEdges.push(newDeletedEdges[i]);
                }

            }
            newDeletedEdges=[];
            newDeletedEdges=clone(tmpEdges,newDeletedEdges);
            len2 = newDeletedEdges.length;
        }
        for(var i=0;i<tmpEdges.length;i++){
            nontreeEdges.push(tmpEdges[i].originEdge);
        }

    }
    function generateNodes(cluster){
        if(cluster.subClusters){
            cluster.nodes = [];
            for(var i=0;i<cluster.subClusters.length;i++){
                cluster.nodes=cluster.nodes.concat(generateNodes(cluster.subClusters[i]));
                var weight=0;
                for(var j=0;j<cluster.nodes.length;j++){
                    weight+=cluster.nodes[j].size;
                }
                cluster.weight=weight;

            }
            return cluster.nodes;
        }
        else{
            cluster.weight = cluster.node.size;
            return [cluster.node];
        }
    }
    function getClusterBoundAndCenter(cluster){
        if(cluster.nodes){
            var minX=d3.min(cluster.nodes,function(d){return d.x-sizeScale.sizeScale(d.size)});
            var minY=d3.min(cluster.nodes,function(d){return d.y-sizeScale.sizeScale(d.size)});
            var maxX=d3.max(cluster.nodes,function(d){return d.x+sizeScale.sizeScale(d.size)});
            var maxY=d3.max(cluster.nodes,function(d){return d.y+sizeScale.sizeScale(d.size)});
            cluster.bounds = {
                x:minX,
                y:minY,
                width:maxX-minX,
                height:maxY-minY
            }
            cluster.center={
                x:minX+(maxX-minX)/2,
                y:minY+(maxY-minY)/2
            }
            for(var i=0;i<cluster.subClusters.length;i++){
                getClusterBoundAndCenter(cluster.subClusters[i]);
            }
        }
        else if(cluster.node){
            cluster.bounds={
                x:cluster.node.x-sizeScale.sizeScale(cluster.node.size),
                y:cluster.node.y-sizeScale.sizeScale(cluster.node.size),
                width:sizeScale.sizeScale(cluster.node.size)*2,
                height:sizeScale.sizeScale(cluster.node.size)*2
            }
            cluster.center={
                x:cluster.node.x,
                y:cluster.node.y
            }
        }
    }
    function generateCluster(node,cluster){
        if(node.children){
            cluster.subClusters=[];
            cluster.originNodeID=node.id;
            cluster.oriX=node.x;
            cluster.oriY=node.y;
            for(var i=0;i<node.children.length;i++){
                var newCluster={};
                newCluster.parentCluster=cluster;
                cluster.subClusters.push(newCluster);
                generateCluster(node.children[i],newCluster);
            }
        }
        else{
            cluster.node=node;
            cluster.originNodeID=node.id;
            cluster.oriX=node.x;
            cluster.oriY=node.y;
        }

    }
//    recurTree(root);
//    for(var j=0;j<edges.length;j++){
//        var source=nodes[edges[j].source];
//        var target=nodes[edges[j].target];
//        var sid=source.id;
//        var tid=target.id;
//        processEdge(source,target);
//    }
    //update node x,y
//    for(var j=0;j<edges.length;j++){
//
//    }
    function recurTree(node){

        if(node.children){
            for(var i=0;i<node.children.length;i++){
                var child=node.children[i];
                if(child.children){
                    var grandChildren=child.children;
                    var maxGrandChild;
                    var maxFlow=0;
                    for(var j=0;j<grandChildren.length;j++){
                        var source=child.id;
                        var target=grandChildren[j].id;
                        var key=String(source)+'_'+String(target);
                        var edge=edgeDic[key];
                        var flow=edge.flow;
                        if(flow>maxFlow){
                            maxFlow=flow;
                            maxGrandChild=grandChildren[j];
                        }
                    }
                    var p1={x:node.x,y:node.y};
                    var p2={x:maxGrandChild.x, y:maxGrandChild.y};
                    var p3={x:child.x, y:child.y};
                    var p4=getPointToLineCrossPoint(p1,p2, p3);
                    child.x = p4.x;
                    child.y = p4.y;
                }
                recurTree(node.children[i]);

            }
        }
        else {
            return;
        }
    }
    function processEdge(source,target){

        if(!source.parentNode){
            //this is root need to generate a grandparent
            var children=source.children;
            var avgX=0,avgY=0;
            for(var i=0;i<children.length;i++){
                avgX+=children[i].x;
                avgY+=children[i].y;
            }
            avgX/=children.length;
            avgY/=children.length;
            var thisVector=vector({x:source.x,y:source.y},{x:avgX,y:avgY});
            var normalized=getNormalized(thisVector);
            var reverseNormalized={x:normalized.x*-1,y:normalized.y*-1};
            var x=source.x+10*reverseNormalized.x;
            var y=source.y+10*reverseNormalized.y;
            var grandParent={x:x, y:y};
        }
        else{
            grandParent=source.parentNode;
        }
        var parent = {x:source.x, y:source.y};
        var shiftPoint=false;

        if(source.parentNode){
            var n2=source.parentNode;
            var otherEdgeItems;
            if(source.children){
                var sourceID=source.id;
                var targetID=target.id;
                if(source.children.length>1){
                    var countX= 0,countY=0;
                    for(var i=0;i<source.children.length;i++){
                        if(source.children[i].id!=targetID){
                            countX+=source.children[i].x;
                            countY+=source.children[i].y;
                        }

                    }
                    countX/=source.children.length-1;
                    countY/=source.children.length-1;
                    var thisEdgeVec=vector(source,target);
                    var otherEdgeVec=vector(source, {x:countX,y:countY});
                    var thisEdgeVec3d=vector3d(getNormalized(thisEdgeVec).x, -1*getNormalized(thisEdgeVec).y,0);
                    var otherEdgeVec3d=vector3d(getNormalized(otherEdgeVec).x, -1*getNormalized(otherEdgeVec).y,0);
                    var crossResult=vector3dCross(thisEdgeVec3d,otherEdgeVec3d);
                    var grandToParent=vector(grandParent,parent);
                    var shiftX=-1*getNormalized(grandToParent).y;
                    var shiftY=-1*getNormalized(grandToParent).x;
                    var shiftDir={x:shiftX,y:shiftY};
                    if(crossResult.z<0){
                        shiftDir.x*=-1;
                        shiftDir.y*=-1;
                    }


                }

            }

        }

        var child= {x:target.x, y:target.y};
        var grandChild;
        if(target.children){
            var grandChildEdges=target.children;
            var maxFlow=0;
            var maxEdge;
            for(var i=0;i<target.children.length;i++){
                var key=String(target.id)+'_'+String(target.children[i].id);
                var tmpEdge=edgeDic[key];
                var edgeFLow=tmpEdge.flow;
                if(edgeFLow>maxFlow){
                    maxFlow=edgeFLow;
                    maxEdge=tmpEdge;
                }
            }
            grandChild={x:nodes[maxEdge.target].x,y:nodes[maxEdge.target].y};

        }
        else{
            var parentToChild=vector(parent,child);
            var pToCDir=getNormalized(parentToChild);
            var grandParentToParent=vector(grandParent,parent);
            var gpToPDir=getNormalized(grandParentToParent);
            var angleBetween=absAngleBetween(parentToChild,grandParentToParent);
            var x=pToCDir.x*Math.cos(-angleBetween)-pToCDir.y*Math.sin(-angleBetween);
            var y=pToCDir.x*Math.sin(-angleBetween)-pToCDir.y*Math.cos(-angleBetween);
            grandChild={x:child.x+10*x, y:child.y+10*y};
        }
        var sourceID=source.id;
        var targetID=target.id;
        var key=String(sourceID)+'_'+String(targetID);
        var edge=edgeDic[key];
        var fourPoints=[];
        fourPoints.push(grandParent);
        fourPoints.push(parent);
        fourPoints.push(child);
        fourPoints.push(grandChild);

        computeOneSpline(grandParent,parent,child,grandChild,edge,target);
        var parentGrandDist=getDistance(grandParent,parent);
        var grandToParent= vector(grandParent,parent);
        var collX=parentGrandDist*getNormalized(grandToParent).x+parent.x;
        var collY=parentGrandDist*getNormalized(grandToParent).y+parent.y;

        var collinShift={x:collX, y:collY};
//        edge.assists[1][0]=collX;
//        edge.assists[1][1]=collY;
//        source.x=collX;
//        source.y=collY;
//        target.x = edge.assists[2][0];
//        target.y = edge.assists[2][1];

    }


}
function computeOneSpline(p0,p1,p2,p3,edge,target){
    var ctrlX1=-p0.x/6+p1.x+p2.x/6;
    var ctrlX2=-p1.x/6+p2.x+p3.x/6;
    var ctrlY1=-p0.y/6+p1.y+p2.y/6;
    var ctrlY2=-p1.y/6+p2.y+p3.y/6;
    edge.assists=[[p0.x,p0.y],[ctrlX1,ctrlY1],[ctrlX2,ctrlY2],[p3.x,p3.y]];
//    edge.assists=[[p0.x,p0.y],[p1.x,p1.y],[p2.x,p2.y],[p3.x,p3.y]];


}
function getEdgeSourceTargetDic(edges){
    var dic={}
    for(var i=0;i<edges.length;i++){
        var source=edges[i].source;
        var target=edges[i].target;
        var key=String(source)+'_'+String(target);
        dic[key]=edges[i];
    }
    return dic;
}
function getNodeRelation(nodes,edges){
    for(var i=0;i<edges.length;i++){
        var source=edges[i].source;
        var target=edges[i].target;
        //console.log(source+'->'+target);
        nodes[target].parentNode=nodes[source];
        if(nodes[source].children)nodes[source].children.push(nodes[target]);
        else nodes[source].children=[nodes[target]];
    }
}
function updateEdges(d){
    var nodes=d.node;
    var edges=d.edge;
    var newEdges=[];
    for(var i=0;i<nodes.length;i++){
        newEdges=newEdges.concat(nodes[i].edges);
    }
    for(var i=0;i<newEdges.length;i++){
        var points=newEdges[i];
        var assists=[];
        for(var j=1;j<points.length-1;j++){
            assists.push([points[j].x, points[j].y]);
        }
        newEdges.assists=assists;
        var source=parseInt(newEdges[i][0].id);
        var target=parseInt(newEdges[i][newEdges[i].length-1].id);
        var newEdge={points:points,assists:assists,source:source, target:target};
        newEdges[i]=newEdge;
    }
    var edgesDic={};
    for(var i=0;i<edges.length;i++){
        var source=edges[i].source;
        var target=edges[i].target;
        var key=String(source)+'_'+String(target);
        edgesDic[key]=i;
    }

    edges.sort(function(a,b){return a.source- b.source});
    edges.sort(function(a,b){return a.target- b.target});
    newEdges.sort(function(a,b){return a.source- b.source});
    newEdges.sort(function(a,b){return a.target- b.target});
    for(var i=0;i<edges.length;i++){
        edges[i].assists=newEdges[i].assists;
        edges[i].points = newEdges[i].points;
    }
    var tmpEdges=[];
    for(var i=0;i<edges.length;i++){
        var source=edges[i].source;
        var target=edges[i].target;
        var key=String(source)+'_'+String(target);
        var j=edgesDic[key];
        tmpEdges[j]=edges[i];
    }
    d.edge = tmpEdges
}
function hierarchicalClustering(node){
    var root=node;
    root.isRoot=true;
    root.equalThis=function(cluster){
        if(cluster.type =='node'){
              if(cluster.isRoot==true)return true;
              else return false;
        }
        else return false;
    };

    var leafNodes=root.targets;
    var clusterList=[];
    var clusterCollection=[];

    //create init cluster for every node.
    var rootCluster=new Cluster(root, false,false);
    var id=0;
    rootCluster.id=id;
    id+=1;
    clusterList.push(rootCluster);
    for(var i=0;i<leafNodes.length;i++){
        var targetCluster=new Cluster(leafNodes[i],false,false);
        targetCluster.id = id;
        clusterList.push(targetCluster);
        id+=1;
    }

    //do hierarchicalClustering

    //calculate distance between every two nodes.
    //O(n)=n*n*n
    while(clusterList.length>1){
        var distanceList=[];
        //find closest pair of clusters

        for(var i=0;i<clusterList.length;i++){
            for(var j=i+1;j<clusterList.length;j++){
                var p1=clusterList[i].center;
                var p2=clusterList[j].center;
                var distance=getDistance(p1, p2);
                var distancePair={distance:distance,cluster1:clusterList[i],cluster2:clusterList[j]};
                distanceList.push(distancePair);
            }
        }
        distanceList.sort(function(a,b){
            return a.distance-b.distance;
        });
        var closestPair=distanceList[0];
        var c1=closestPair.cluster1;
        var c2=closestPair.cluster2;
        //remove this two clusters
        var newClusterList=[];
        for(var i=0;i<clusterList.length;i++){
            if(clusterList[i].id!=c1.id&&clusterList[i].id!=c2.id){
                newClusterList.push(clusterList[i]);
            }
        }
        clusterList=newClusterList;

        //if either of two clusters include root node add another cluster into collection and root as new cluster

        if(root.equalThis(c1)||root.equalThis(c2)){
            var newCluster;
            if(root.equalThis(c1)){
                clusterCollection.push(c2)
            }
            else if(root.equalThis(c2)){
                clusterCollection.push(c1)
            }
            newCluster=rootCluster;
        }
        else{
            newCluster=new Cluster(false,c1, c2);
            newCluster.id=id;
            id+=1;
        }
        clusterList.push(newCluster);

    }
    return clusterCollection;




}
function calculateFlowPoint(clusterTree){
    var rootNode=clusterTree;
//    console.log(clusterTree);
    var clusters=clusterTree.clusterResult;
    clusterTree.edges=[];
    for(var i=0;i<clusters.length;i++){
        var cluster=clusters[i];
        //a cluster only contain one node
//        if(!(cluster.cluster1||cluster.cluster2)){
            //do nothing
//        }
        countClusterSize(cluster);

        processCluster(rootNode,cluster);
        var edges=clusterTree.edges;
        var flowEdge=collectFlowPoint(rootNode,cluster);
        clusterTree.edges=edges.concat(flowEdge);

    }

}
function countClusterSize(cluster){
    if(cluster.subCluster1&&cluster.subCluster2){
        cluster.size=countClusterSize(cluster.subCluster1)+countClusterSize(cluster.subCluster2);
        return cluster.size;
    }
    else{
        return cluster.size;
    }
}
function processCluster(parNode,cluster){
    function getNewNode(p0,p1,p2){
        var dist1=getDistance(p0, p1);
        var dist2=getDistance(p0, p2);
        var shortestDist=d3.min([dist1, dist2])/2;
//        var biggerCluster=d3.max([cluster.subCluster1,cluster.subCluster2],function(d){return d.size});
        var biggerCluster;
        if(cluster.subCluster1.size>=cluster.subCluster2.size){biggerCluster=cluster.subCluster1;}
        else biggerCluster=cluster.subCluster2;

        var p3=biggerCluster.center;
        var biggerDist=getDistance(p0, p3);
        var bigFraction=parseFloat(shortestDist/biggerDist);
        var parentFraction=1-bigFraction;
        var x=p0.x*parentFraction+p3.x*bigFraction;
        var y=p0.y*parentFraction+p3.y*bigFraction;
        var newNode={x:x, y:y,subCluster1:cluster.subCluster1,subCluster2:cluster.subCluster2};
        return newNode;
    }
    if(cluster.subCluster1||cluster.subCluster2){
        var type1=cluster.subCluster1.type;
        var type2=cluster.subCluster2.type;
        var typeArray=[type1, type2];
        if(in_array('node',typeArray)&&!in_array('cluster',typeArray)){
            //a cluster only contains nodes
            var p0={x:parNode.x,y:parNode.y};
            var p1=cluster.subCluster1.center;
            var p2=cluster.subCluster2.center;

            var newNode=getNewNode(p0, p1, p2);
            cluster.nextNode=newNode;
            cluster.subCluster1='';
            cluster.subCluster2='';


        }
        else if(in_array('cluster',typeArray)&&!in_array('node',typeArray)){
            //a cluster only contains clusters
            var p0={x:parNode.x, y:parNode.y};
            var bounds1=cluster.subCluster1.bounds;
            var bounds2=cluster.subCluster2.bounds;
            var line1={p1:p0, p2:cluster.subCluster1.center};
            var line2={p1:p0, p2:cluster.subCluster2.center};
            var p1=getRectangleLineCrossPoint(bounds1, line1);
            var p2=getRectangleLineCrossPoint(bounds2, line2);
            var newNode=getNewNode(p0, p1, p2);
            cluster.nextNode=newNode;
            processCluster(newNode,cluster.subCluster1);
            processCluster(newNode,cluster.subCluster2);
            cluster.subCluster1='';
            cluster.subCluster2='';

        }
        else if(in_array('cluster',typeArray)&&in_array('node',typeArray)){
            //a cluster contains a node and a cluster
            if(cluster.subCluster1.type =='cluster'){
                var clus=cluster.subCluster1;
                var node=cluster.subCluster2;
            }
            else if(cluster.subCluster1.type =='node'){
                var clus=cluster.subCluster2;
                var node=cluster.subCluster1;
            }
            var p0={x:parNode.x, y:parNode.y};
            var p1=node.center;
            var bounds=clus.bounds;
            var line={p1:p0, p2:clus.center};
            var p2=getRectangleLineCrossPoint(bounds, line);
            var newNode=getNewNode(p0, p1, p2);
            cluster.nextNode=newNode;
            processCluster(newNode,clus);
            cluster.subCluster1='';
            cluster.subCluster2='';
        }
    }
}
function collectFlowPoint(root,cluster){
    function recurCluster(cluster){
        if(cluster.nextNode){
            tmpEdge.push({x:cluster.nextNode.x, y:cluster.nextNode.y});
            function judgeCluster(cluster){
                if(cluster.type =='node'){
                    var tmpPoint={x:cluster.cluster.x, y:cluster.cluster.y,id:cluster.cluster.id};
                    var edge=[];
                    edge=clone(tmpEdge,edge);
                    edge.push(tmpPoint);
                    flowEdge.push(edge);
                }
                else{
                    recurCluster(cluster);
                }
            }
            judgeCluster(cluster.nextNode.subCluster1);
            judgeCluster(cluster.nextNode.subCluster2);

        }
        else{
            var tmpPoint={x:cluster.cluster.x, y:cluster.cluster.y,id:cluster.cluster.id};
            var edge=[];
            edge=clone(tmpEdge,edge);
            edge.push(tmpPoint);
            flowEdge.push(edge);
        }
    }
    var flowEdge=[];
    var rootPoint={x:root.x, y:root.y,id:root.id};
    var tmpEdge=[];
    tmpEdge.push(rootPoint);
    recurCluster(cluster);
    return flowEdge;

}
export{
    calculateFlowMap,
    computeOneSpline,
    getEdgeSourceTargetDic,
    getNodeRelation,
    updateEdges,
    hierarchicalClustering,
    calculateFlowPoint,
    countClusterSize,
    processCluster,
    collectFlowPoint
};