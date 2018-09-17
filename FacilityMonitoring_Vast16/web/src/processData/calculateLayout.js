import{clone} from '../processData/processData';
function Graph(data,assistEdges,layout_engine,draw_standalone_nodes){
    var edges = data.edge;
    var nodes = data.node;
    //console.log('Graph layout calculation with engine: '+layout_engine);
    //var engine='neato';
    //var engine='dot';
    var engine=layout_engine;
    var direction='';
    if (engine.indexOf('TB') != -1){
        this.reverse=true;
    }
    else{
        this.reverse=false;
    }
    if (engine.indexOf('Force') != -1){
        engine='neato'; 
    }
    if (engine.indexOf('LR') != -1)
    {
        engine = 'dot';
    }
    if (engine.indexOf('TB') != -1)
    {
        engine = 'dot';
        direction = 'rankdir="TB";';
    }
    //console.log('layout direction '+direction);
    //var engine='circo'; //slow
    this.edges=edges;
    var dotBeginning='digraph{'+direction;
    var dotEnding='}';
    var arrow='->';
    var edgeEnding=';';
    var dot='';
    var invis='[style=invis]';
    dot+=dotBeginning;
    if(draw_standalone_nodes){
        for(var i= 0,len=nodes.length;i<len;i++){
            var node_id=nodes[i]['id'];
            dot+=node_id+';';
        }
    }

    for(var i= 0,len=edges.length;i<len;i++){
        var edge=edges[i];
        var source=String(edge.source);
        var target=String(edge.target);
        var edgeString=source+arrow+target+edgeEnding;
        dot+=edgeString;
    }
    if(assistEdges) {
        for (var i = 0, len = assistEdges.length; i < len; i++) {
            var edge = assistEdges[i];
            var source = String(edge.source);
            var target = String(edge.target);
            var edgeString = source + arrow + target + invis + edgeEnding;
            dot += edgeString;
        }
    }
    dot+=dotEnding;
    //console.log('layout dot string');
    //console.log(dot);
    this.dotString=dot;
    this.svgGraph=function(){
//        console.log(Viz(this.dotString));
        var div=d3.select('body').append('tmpDiv').attr('class','tmpDiv');
        div.html(Viz(this.dotString,{engine:engine}));

//            .html(Viz(this.dotString));
//        document.body.innerHTML +=Viz(this.dotString);
    }
}
function reCalculateLayout(graph,graphData){
    var nodes=graphData.node;
    var edges=graphData.edge;
    //if(this.method=='mst'||this.method=='filterFlow'){
    //    maximalSpanningTree(graphData);
    //}
//    var newGraph=new Graph(graphData.edge, []);
    graph.svgGraph();
    var newSVG=d3.select('.tmpDiv').select('svg');
    //console.log('graph corrdinates extraction: '+graph.reverse);
    var svgData=getSVGData(newSVG,graph.reverse);
    newSVG.remove();
    d3.select('.tmpDiv').remove();
    mergeData(svgData,nodes, edges);
//    reverseXY(nodes,edges);
    //console.trace();
    //console.log('calculating layout for nodes: ');
    //console.log(nodes);
}

function maximalSpanningTree(d){
    //find root;
    var nodes=d.node;
    var edges= d.edge;
    d.originEdge=[];
    d.originEdge=clone(edges,d.originEdge);
    var root;
    var newNodes=[];
    var newEdges=[];
    newNodes=clone(nodes, newNodes);
    for(var i=0;i<nodes.length;i++){
        if(nodes[i].focused=='true'){
            root = nodes[i];
            break;
        }
    }

    //remove all the edges to the root node
    for(var i=0;i<edges.length;i++){
        if(edges[i].target!=parseInt(root.id))newEdges.push(edges[i]);
    }


    //select top flow of every node
    var tmpEdge=[];
    for(var i=0;i<nodes.length;i++){
        if(!(nodes[i].focused=='true')){
            var id=parseInt(nodes[i].id);
            var nodeEdge=[];
            var maxEdge={flow:0};
            for(var j=0;j<newEdges.length;j++){
                if(newEdges[j].target==id){
                    if(newEdges[j].flow>maxEdge.flow)maxEdge=newEdges[j];
                }
            }
            tmpEdge.push(maxEdge);
        }
    }
    d.edge = tmpEdge;
    var edgeDic=getEdgeSourceTargetDic(d.edge);
    var originEdgeDic=getEdgeSourceTargetDic(d.originEdge);
    var otherEdge=[];
    for(var key in originEdgeDic){
        if(!(key in edgeDic)){
            otherEdge.push(originEdgeDic[key])
        }
    }
    d.otherEdge=otherEdge;

}

function mergeData(data,nodes,edges){
    //console.log('entering mergeData')
    //console.log(nodes)
    //console.log(edges)
    var svgNodes=data.svgNodes;
    //console.log(svgNodes)
    var svgEdges=data.svgEdges;
    //console.log(svgEdges)

    for(var i= 0,len=svgEdges.length;i<len;i++){
        var source=svgEdges[i].source;
        var target=svgEdges[i].target;
        for(var j= 0,len1=edges.length;j<len;j++){
            if(source ==edges[j].source&&target==edges[j].target){
                edges[j].assists=svgEdges[i].assists;
                //console.log('setting assists of edge '+source+' -> '+target);
                break;
            }
        }
    }
    for(var key in svgNodes){
        if(nodes[key]){
            nodes[key].x = svgNodes[key].x;
            nodes[key].y = svgNodes[key].y;
        }

    }
}
function getSVGData(svg,reverse){
    var svgNodes={};
    var svgEdges=[];
    svg.selectAll('g')
        .each(function(){
            var thisElem=d3.select(this);
            var thisClass=thisElem.attr('class');
            if(thisClass=='edge'){
                var edge={};
                var edgeValue=thisElem.select('title').text();
                edge.source=parseInt(edgeValue.split('->')[0]);
                edge.target=parseInt(edgeValue.split('->')[1]);
                edge.assists=[];
                var d=thisElem.select('path').attr('d').split('M')[1];
                var firstPoint=d.split('C')[0];
                var point=[];
                if (reverse){
                    point[0]=parseFloat(firstPoint.split(',')[1]);
                    point[1]=parseFloat(firstPoint.split(',')[0]);
                }
                else{
                    point[0]=parseFloat(firstPoint.split(',')[0]);
                    point[1]=parseFloat(firstPoint.split(',')[1]);
                }
                edge.assists.push(point);
                var otherPoints=d.split('C')[1].split(' ');
                for(var i= 0,len=otherPoints.length;i<len;i++){
                    var tmpPoint=[];
                    if (reverse){
                        tmpPoint[1]=parseFloat(otherPoints[i].split(',')[0]);
                        tmpPoint[0]=parseFloat(otherPoints[i].split(',')[1]);
                    }
                    else{
                        tmpPoint[0]=parseFloat(otherPoints[i].split(',')[0]);
                        tmpPoint[1]=parseFloat(otherPoints[i].split(',')[1]);
                    }
                    edge.assists.push(tmpPoint);
                }
                svgEdges.push(edge);

            }
            else if(thisClass=='node'){
                var node={};
                var nodeValue=thisElem.select('title').text();
                node.id=nodeValue;

                if (reverse){
                    node.y=parseFloat(thisElem.select('ellipse').attr('cx'));
                    node.x=parseFloat(thisElem.select('ellipse').attr('cy'));
                }else{
                    node.x=parseFloat(thisElem.select('ellipse').attr('cx'));
                    node.y=parseFloat(thisElem.select('ellipse').attr('cy'));
                }
                svgNodes[nodeValue]=node;
            }
        })
    return {svgNodes:svgNodes,svgEdges:svgEdges};
}
export{
    Graph,
    reCalculateLayout,
    maximalSpanningTree,
    mergeData,
    getSVGData,

}
