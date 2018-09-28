import{clone} from '../processData/processData';
function getGraphInfo(nodes,edges){
    var result={nodes:0,edges:0,citation:0,flow:0,yearFlow:0};
    result.nodes = nodes.length;
    result.edges = edges.length;
    result.citation = countCitation(edges);
    result.flow = countFlow(edges);
    result.yearFlow = countYearFlow(edges);
    return result;
}
function printGraphInfo(info){
    console.log('-----------------------------');
    for(var key in info){
        console.log(key+info[key]);
    }
    console.log('-----------------------------');
}
function linkPruning(){
    /*
     let the edge with the smallest weight be (i,j).
     If remove (i,j) does not make the current graph disconnected
     (here connected means that there is a path from the source to every node),
     we remove it. If there is a path in the current graph  from  i  to  j,
     we  add  the  weight  of  the  edge  to  each edge along the path.
     We update the edge weights and repeat this process. At the end of this process we have a spanning tree
    */

//        1. build graph structure and functions，node,edge, node parents,node children,add edge,delete edge,graph connection
    var data=this.data.postData[this.focusedID]
    var removeSelfEdgeResult=removeSelfEdge(data.edge);
    data.edge = removeSelfEdgeResult.edge;
    data.selfEdge = removeSelfEdgeResult.selfEdge;
    this.directedGraph=new DirectedGraph(data);
    this.directedGraph.init();
    data.originGraphInfo=getGraphInfo(this.directedGraph.nodes,this.directedGraph.edges);
    var paperCount=0;
    for(var i=0;i<this.directedGraph.nodes.length;i++){
        paperCount+=this.directedGraph.nodes[i].size;
    }
    data.originGraphInfo.paperCount=paperCount;
//    printGraphInfo(originGraphInfo);
//    originNodes=directedGraph.nodes.length;
//    originEdges=directedGraph.edges.length;
//    originCitation=countCitation(directedGraph.edges);
//    originFlow=countFlow(directedGraph.edges);
//    originYearFlow=countYearFlow(directedGraph.edges);
//
//    console.log('#node:'+originNodes);
//    console.log('#edge:'+originEdges);
//    console.log('total citation:'+originCitation);
//    console.log('total flow rate:'+originFlow);
//    console.log('total year flow rate:'+originYearFlow);
    if(!this.directedGraph.checkConnection())alert('original graph does not connected');
//        2. begin to remove edges so we can get the spanning tree
//    if(requestMethod=='local')method='mst';
    else{
        if(this.method=='filterFlow'){
            this.directedGraph.filterTopFlow(1);
            this.updateData(data,this.directedGraph);
            console.log('filter flow graph info:');
            //data.filterFlowGraphInfo=getGraphInfo(this.directedGraph.nodes, this.directedGraph.edges);
//        printGraphInfo(filterFlowGraphInfo);
//        filterFlowNodes=directedGraph.nodes.length;
//        filterFlowEdges=directedGraph.edges.length;
//        filterFlowCitation=countCitation(directedGraph.edges);
//        filterFlowFlow=countFlow(directedGraph.edges);
//        filterFlowYearFlow=countYearFlow(directedGraph.edges);

//        console.log('#node:'+filterFlowNodes);
//        console.log('#edge:'+filterFlowEdges);
//        console.log('total citation:'+filterFlowCitation);
//        console.log('total flow rate:'+filterFlowFlow);
//        console.log('total year flow rate:'+filterFlowYearFlow);

        }
        else if(this.method=='recoveryWeight'){
            this.directedGraph.generateSpanningTree();
            //data.recoveryWeightGraphInfo=getGraphInfo(this.directedGraph.nodes,this.directedGraph.edges);
//        printGraphInfo(recoveryWeightGraphInfo);
            this.updateData(data,this.directedGraph);

        }
        else if(this.method=='mst'){
            this.directedGraph.generateMaximalSpanningTree();
            //data.mstGraphInfo=getGraphInfo(this.directedGraph.maximalSpanningTree.nodes, this.directedGraph.maximalSpanningTree.edges);
//        printGraphInfo(mstGraphInfo);
            this.updateData(data,this.directedGraph.maximalSpanningTree);
        }
    }
    if(!this.directedGraph.checkConnection())alert('original graph does not connected');
    //if(this.source=='citeseerx'){
    //    console.log('citeseerx pruned data')
        //console.log(this.directedGraph);
        //console.log(this.directedGraph.nodes);
        //this.directedGraph.edges.forEach(function(edge){
        //    console.log(edge.source+'_'+edge.target);
        //})

    //}
    //console.log(directedGraph);


//    var treeEdges=directedGraph.spanningTree.deletedTreeEdges;
//    for(var i=0;i<treeEdges.length;i++){
//        console.log('edge'+(i+1));
//        for(var year in treeEdges[i].originEdge.weight){
//            console.log(year);
//        }
//    }


}
function updateData(data,graph){
    data.node=[];
    data.edge=[];
    data.node=clone(graph.nodes,data.node);
    data.edge=clone(graph.edges,data.edge);
//        data.node = graph.nodes;
//        data.edge = graph.edges;
    if(this.method=='mst'){
        data.deletedTreeEdges=graph.deletedTreeEdges;
        data.deletedNonTreeEdges=graph.deletedNonTreeEdges;
    }
    else{
        data.deletedTreeEdges = graph.spanningTree.deletedTreeEdges;
        data.deletedNonTreeEdges=graph.spanningTree.deletedNonTreeEdges;
    }

    this.maxTime=graph.maxTime;
    this.minTime=graph.minTime;
    for(var i=0;i<data.node.length;i++){
        if(data.node[i].parents){
            data.node[i].parents[0]=null;
//                delete(data.node[i].parents[0]);
        }
        if(data.node[i].children){
            data.node[i].children=null;
//                delete(data.node[i].children);
        }
    }
}
function removeSelfEdge(edges){
    var newEdges=[];
    var selfEdges=[];
    for(var i=0;i<edges.length;i++){
        if(edges[i].source==edges[i].target){
            selfEdges.push(edges[i]);
        }
        else{
            newEdges.push(edges[i]);
        }
    }
    return {edge:newEdges,selfEdge:selfEdges};
}
function linkPruningOld(data){
    var removeSelfEdgeResult=removeSelfEdge(data.edge);
    data.edge = removeSelfEdgeResult.edge;
    data.selfEdge = removeSelfEdgeResult.selfEdge;
    directedGraph=new DirectedGraph(data);
    directedGraph.init();
    if(!directedGraph.checkConnection())alert('original graph does not connected');
    directedGraph.filterTopFlow(1.5);
    data.node = directedGraph.nodes;
    data.edge = directedGraph.edges;
    data.deletedTreeEdges = directedGraph.spanningTree.deletedTreeEdges;
    data.deletedNonTreeEdges=directedGraph.spanningTree.deletedNonTreeEdges;
    maxTime=directedGraph.maxTime;
    minTime=directedGraph.minTime;
    for(var i=0;i<data.node.length;i++){
        if(data.node[i].parents){
            data.node[i].parents[0]=null;
//            delete(data.node[i].parents[0]);
        }
        if(data.node[i].children){
            data.node[i].children=null;
//            delete(data.node[i].children);
        }
    }
//    setNodeWeight(data);
//    data['edge'].sort(function(a,b){
//        return b.flow*b.BFSWeight-a.flow*a.BFSWeight;
//    });
////    console.log(data);
//    var k;
//    for(var key in data['cluster']){
////        console.log('cluster key:'+key);
//        if(key!='300'){
//            k = parseInt(key.split('-')[0])+1;
////            console.log('cluster length:'+k);
//            break;
//        }
//    }
//    var deleted=[];
//    while(data['edge'].length>1.5*k){
//        deleted.push(data['edge'][data['edge'].length-1]);
//        data['edge'].pop();
//    }
////    console.log('prune over');
//
//    var visitedTree={};
//    var treeNum=0;
//    for(var key in data['cluster']){
//        if(!visitedTree[key]){
//            var visitedNode=getNodesByAssignRoot(data,key);
//            for(var i=0;i<visitedNode.length;i++){
//                if(!visitedTree[visitedNode[i]]){
//                    visitedTree[visitedNode[i]] = {nodes:visitedNode,num:treeNum};
//                }
//            }
//            treeNum+=1;
//        }
//    }
//    var newTree={};
//    for (var key in visitedTree){
//        newTree[visitedTree[key].num]=visitedTree[key].nodes;
//    }
//    visitedTree=newTree;
//    var rootTree=[];
//    var otherTrees=[];
//    for(var key in visitedTree){
//        for (var i=0;i<visitedTree[key].length;i++){
//            if(visitedTree[key][i]=='300')
//            {
//                rootTree=visitedTree[key];
//                delete visitedTree[key];
//                break;
//            }
//
//        }
//    }
//    for (var key in visitedTree){
//        otherTrees.push(visitedTree[key]);
//    }
//
//
//
//    var visitedNode=getNodes(data);
//    var reachableEdge=[];
//    for(var i= 0,len=data['edge'].length;i<len;i++){
//        if(!in_array(data['edge'][i].source,visitedNode)||!in_array(data['edge'][i].target,visitedNode)){
//            deleted.push(data['edge'][i]);
//        }
//        else{
//            reachableEdge.push(data['edge'][i]);
//        }
//    }
////    data['edge']=reachableEdge;
//    var nodeStep=[];
//    visitedNode=[];
//    for(var key in data['cluster']){
//        var E=[];
//        var S=[];
//        var target=key;
//        for(var i= 0,len=reachableEdge.length;i<len;i++){
//            if(reachableEdge[i].target==target&&reachableEdge[i].source!=reachableEdge[i].target){
//                S.push(reachableEdge[i]);
//            }
//        }
//        for(var i= 0,len=deleted.length;i<len;i++){
//            if(deleted[i].target==target&&deleted[i].source!=deleted[i].target){
//                E.push(deleted[i]);
//            }
//        }
//        E.sort(function(a,b){
//            return b.flow*b.BFSWeight-a.flow*a.BFSWeight;
//        });
//        if(S.length==0&&E.length>=1){
//            for(var i= 0,len=E.length;i<len;i++){
//                if(E[i].source!=E[i].target){
//                    visitedNode=getNodes(data);
//                    if(in_array(E[i].source,visitedNode)){
//                        data['edge'].push(E[i]);
//                        visitedNode=getNodes(data);
//                        var recovery=String(E[i].source)+'->'+String(E[i].target);
////                        console.log('recover edge:'+recovery);
//                        break;
//                    }
//                }
//            }
//        }
//    }
//
//    var newEdge=[];
//    for(var i= 0,len=data['edge'].length;i<len;i++){
//        if(data['edge'][i].source!=data['edge'][i].target){
//            var edge=Edge.newedge();
//            for(var key in data['edge'][i]){
//                edge[key]=data['edge'][i][key];
//            }
//            newEdge.push(edge);
//        }
//        else deleted.push(data['edge'][i]);
//    }
//    data['edge']=newEdge;
//
//    //test the top k flow in deleted
//    deleted.sort(function(a,b){return b.flow*b.BFSWeight-a.flow*a.BFSWeight;});
////    for(var i= 0,count=0;i<deleted.length;i++){
////        if(count==10)break;
////        var edge=deleted[i];
////        var source=edge.source;
////        var target=edge.target;
////        if(in_array(source,visitedNode)&&target!=source){
////            data['edge'].push(edge);
////            count+=1;
////        }
////
////    }
//
//    var tmpEdgeString=[];
//    var tmpEdge=[];
//    var tmpNode={};
//    for(var i=0;i<data['edge'].length;i++){
//        var edgeString=data['edge'][i].source+'->'+data['edge'][i].target;
//        if(!in_array(edgeString,tmpEdgeString)){
//            tmpEdge.push(data['edge'][i]);
//            tmpEdgeString.push(edgeString);
//            if(!tmpNode[data['edge'][i].source])tmpNode[data['edge'][i].source]=data['cluster'][data['edge'][i].source];
//            if(!tmpNode[data['edge'][i].target])tmpNode[data['edge'][i].target]=data['cluster'][data['edge'][i].target];
//        }
//    }
//    data['edge']=tmpEdge;
//    data['cluster']=tmpNode;
//    //    console.log('visitedNode:\n'+visitedNode);
//    visitedNode=getNodes(data);
//    reachableEdge=[];
//    for(var i= 0,len=data['edge'].length;i<len;i++){
//        if(!in_array(data['edge'][i].source,visitedNode)||!in_array(data['edge'][i].target,visitedNode)){
//            deleted.push(data['edge'][i]);
//        }
//        else{
//            reachableEdge.push(data['edge'][i]);
//        }
//    }
//    data['edge']=reachableEdge
//
//    deleted.sort(function(a,b){return b.flow-a.flow;});
//    for (var key in data['cluster']){
//        for (var i=0;i<deleted.length;i++){
//            if(deleted[i].source==key&&deleted[i].target==key){
//                data['cluster'][key].selfEdge=deleted[i].flow;
//            }
//        }
//    }

}
function getNodesByAssignRoot(data,root){
    data['edge'].sort(function(a,b){
        return b.flow- a.flow;
    });
    var nodeStep=[];
    var visitedNode=[];
    nodeStep.push(root);
    while(nodeStep[0]){
        var newStep=[];
        for(var i=0;i<nodeStep.length;i++){
            var step=nodeStep[i];
            if(!in_array(step,visitedNode)){
                visitedNode.push(step);
                for(var j=0;j<data['edge'].length;j++){
                    var edge=data['edge'][j];
                    var source=edge.source;
                    var target=edge.target;
                    if(source==step&&!in_array(target,visitedNode)){
                        newStep.push(edge.target);
                    }
                }
            }
        }
        nodeStep=newStep;
    }
    return visitedNode;
}
function getNodes(data){
    data['edge'].sort(function(a,b){
        return b.flow- a.flow;
    });
    var nodeStep=[];
    var visitedNode=[];
    var root=300;
    nodeStep.push(root);
    while(nodeStep[0]){
        var newStep=[];
        for(var i=0;i<nodeStep.length;i++){
            var step=nodeStep[i];
            if(!in_array(step,visitedNode)){
                visitedNode.push(step);
                for(var j=0;j<data['edge'].length;j++){
                    var edge=data['edge'][j];
                    var source=edge.source;
                    var target=edge.target;
                    if(source==step&&!in_array(target,visitedNode)){
                        newStep.push(edge.target);
                    }
                }
            }
        }
        nodeStep=newStep;
    }
    return visitedNode;
}
function setNodeWeight(data){
    data['edge'].sort(function(a,b){
        return b.flow- a.flow;
    });
    var nodeStep=[];
    var visitedNode=[];

    var rootWeight=1;
    var k=0.1;
    var level=0;
    var root=300;
    nodeStep.push(root);
    while(nodeStep[0]){
        var newStep=[];
        for(var i=0;i<nodeStep.length;i++){
            var step=nodeStep[i];
            if(!in_array(step,visitedNode)){
                visitedNode.push(step);
                if(!data['cluster'][step].BFSWeight)data['cluster'][step].BFSWeight=rootWeight*Math.pow(k, level);

                for(var j=0;j<data['edge'].length;j++){
                    if(data['edge'][j].source==step&&!data['edge'][j].BFSWeight)data['edge'][j].BFSWeight=rootWeight*Math.pow(k, level);
                    var edge=data['edge'][j];
                    var source=edge.source;
                    var target=edge.target;
                    if(source==step&&!in_array(target,visitedNode)){
                        newStep.push(edge.target);
                    }
                }
            }
        }
        level+=1
        nodeStep=newStep;
    }
    return visitedNode;
}
function linkPruning_su(data){


//    console.log(data);
    data['edge'].sort(function(a,b){
        return b.flow-a.flow;
    });
//    console.log(data);
    var k;
    for(var key in data['cluster']){
//        console.log('cluster key:'+key);
        if(key!='300'){
            k = parseInt(key.split('-')[0])+1;
//            console.log('cluster length:'+k);
            break;
        }
    }
    var deleted=[];
    while(data['edge'].length>2*k){
        deleted.push(data['edge'][data['edge'].length-1]);
        data['edge'].pop();
    }
//    console.log('prune over');
    var visitedNode=getNodes(data);
    var reachableEdge=[];
    for(var i= 0,len=data['edge'].length;i<len;i++){
        if(!in_array(data['edge'][i].source,visitedNode)||!in_array(data['edge'][i].target,visitedNode)){
            deleted.push(data['edge'][i]);
        }
        else{
            reachableEdge.push(data['edge'][i]);
        }
    }
    data['edge']=reachableEdge;
    var nodeStep=[];
    visitedNode=[];
    for(var key in data['cluster']){
        var E=[];
        var S=[];
        var target=key;
        for(var i= 0,len=data['edge'].length;i<len;i++){
            if(data['edge'][i].target==target&&data['edge'][i].source!=data['edge'][i].target){
                S.push(data['edge'][i]);
            }
        }
        for(var i= 0,len=deleted.length;i<len;i++){
            if(deleted[i].target==target&&deleted[i].source!=deleted[i].target){
                E.push(deleted[i]);
            }
        }
        E.sort(function(a,b){
            return b.flow-a.flow;
        });
        if(S.length==0&&E.length>=1){
            for(var i= 0,len=E.length;i<len;i++){
                if(E[i].source!=E[i].target){
                    visitedNode=getNodes(data);
                    if(in_array(E[i].source,visitedNode)){
                        data['edge'].push(E[i]);
                        visitedNode=getNodes(data);
                        var recovery=String(E[i].source)+'->'+String(E[i].target);
//                        console.log('recover edge:'+recovery);
                        break;
                    }
                }
            }
        }
    }

    var newEdge=[];
    for(var i= 0,len=data['edge'].length;i<len;i++){
        if(data['edge'][i].source!=data['edge'][i].target){
            var edge=Edge.newedge();
            for(var key in data['edge'][i]){
                edge[key]=data['edge'][i][key];
            }
            newEdge.push(edge);
        }
    }
    data['edge']=newEdge;

    //test the top k flow in deleted
    deleted.sort(function(a,b){return b.flow-a.flow});
    for(var i= 0,count=0;i<deleted.length;i++){
        if(count==10)break;
        var edge=deleted[i];
        var source=edge.source;
        var target=edge.target;
        if(in_array(source,visitedNode)&&target!=source){
            data['edge'].push(edge);
            count+=1;
        }

    }

    var tmpEdgeString=[];
    var tmpEdge=[];
    var tmpNode={};
    for(var i=0;i<data['edge'].length;i++){
        var edgeString=data['edge'][i].source+'->'+data['edge'][i].target;
        if(!in_array(edgeString,tmpEdgeString)){
            tmpEdge.push(data['edge'][i]);
            tmpEdgeString.push(edgeString);
            if(!tmpNode[data['edge'][i].source])tmpNode[data['edge'][i].source]=data['cluster'][data['edge'][i].source];
            if(!tmpNode[data['edge'][i].target])tmpNode[data['edge'][i].target]=data['cluster'][data['edge'][i].target];
        }
    }
    data['edge']=tmpEdge;
    data['cluster']=tmpNode;
    //    console.log('visitedNode:\n'+visitedNode);
    visitedNode=getNodes(data);
    reachableEdge=[];
    for(var i= 0,len=data['edge'].length;i<len;i++){
        if(!in_array(data['edge'][i].source,visitedNode)||!in_array(data['edge'][i].target,visitedNode)){
            deleted.push(data['edge'][i]);
        }
        else{
            reachableEdge.push(data['edge'][i]);
        }
    }
    data['edge']=reachableEdge



}
export{
    getGraphInfo,
    printGraphInfo,
    linkPruning,
    updateData,
    removeSelfEdge,
    getNodes
};