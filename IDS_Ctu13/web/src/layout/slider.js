import{clone} from '../processData/processData';
function clusterSlider(){
    var minID=parseInt(focusedID.split('_')[1]);
    var min=minID/5-1;
    var max=7;
    var k=5;
    $(function(){
        $(".clusterSlider").slider({
            range:'min',
            max:max,
            value:min,
            slide:function(event,ui){
//                console.log(ui.value);
                reLayoutByCluster(event, ui);
            }
        });
        $( ".clusterText" ).html( 5*(parseInt($( ".clusterSlider" ).slider("value"))+1));

    })
}
function reLayoutByCluster(event,ui){
    var cluster=5*(ui.value+1);
    selectedCluster=cluster;
    var urlID=getUrlParam('id');
    var paperID=parseInt(urlID.split('_')[0]);
    $( ".clusterText" ).html(cluster);
    var searchID=String(paperID)+'_'+String(cluster);

    search(searchID);

}
function yearSlider(){
    yearEdgeDic=getYearEdgeRelation();
    var min=10000;
    var max=0;
    for(var key in yearEdgeDic){
        var year=parseInt(key);
        if(year>max)max = year;
        if(year<min)min = year;
    }
    TimeDataHistory={};
    var key=String(min)+'-'+String(max);
    TimeDataHistory[key]={
        nodes:copy(nodes),
        edges:copy(edges)
    };
    $(function() {
        $( "#yearSlider" ).slider({
            range: true,
            min: min,
            max: max,
            values: [ min, max ],
            slide: function( event, ui ) {
                reLayoutByYear(event,ui);

            }
        });

        $( ".yearText" ).html( $( "#yearSlider" ).slider( "values", 0 ) +
            " - " + $( "#yearSlider" ).slider( "values", 1 ) );
    });
}
function reLayoutByYear(event, ui){
    $( ".yearText" ).html(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
    var yearRange={
        min:ui.values[0],
        max:ui.values[1]
    };
    dataFilter(yearRange);
}
function copy(data){
    var result=[];
    for(var i= 0,len=data.length;i<len;i++){
        var ob={};
        for(var key in data[i]){
            ob[key]=data[i][key];
        }
        result.push(ob);
    }
    return result;
}
function dataFilter(yearRange){
    var yearEdgeDic=getYearEdgeRelation();



    var currentData=data.postData[focusedID];
    var nodes=currentData.node;
    var edges=currentData.edge;


//    oldEdges_timeFilter=[];
//    var newEdges_timeFilter=[];
//    oldNodes_timeFilter=[];
//    var newNodes_timeFilter=[];
//    var nodesArray=[];
    var min=yearRange.min;
    var max=yearRange.max;
    var newEdges=[];
    var newNodeList=[];
    var newNodes=[];
    var nodesKey=[];
    var nodesKeyDic={};
    var num=0;
    for(var i=0;i<edges.length;i++){
        var edgeYear=edges[i].weight;
        for(var key in edgeYear){
            var year=parseInt(key);
            if(year>=min&&year<=max){
                //edge and its source and target should be stored

                var newEdge={};
                var source=edges[i].source;
                var target=edges[i].target;
                if(!in_array(source,nodesKey)){
                    nodesKey.push(source);
                    nodesKeyDic[source]=num;

                    nodes[source].id=nodesKeyDic[source]
                    newNodes.push(nodes[source]);
                    num+=1;
                }
                if(!in_array(target,nodesKey)){
                    nodesKey.push(target);
                    nodesKeyDic[target]=num;

                    nodes[target].id=nodesKeyDic[target]
                    newNodes.push(nodes[target]);
                    num+=1;
                }

                newEdge=clone(edges[i],newEdge);
                newEdge.source = nodesKeyDic[newEdge.source];
                newEdge.target = nodesKeyDic[newEdge.target];
                newEdge.nodes[0]=newEdge.source;
                newEdge.nodes[1]=newEdge.target;
                newEdges.push(newEdge);
                break;


            }
        }
    }


    data.timeData[focusedID]={};
    data.timeData[focusedID].node = newNodes;
    data.timeData[focusedID].edge = newEdges;
    data.timeData[focusedID].nodeTimeData = data.postData[focusedID].nodeTimeData;
    data.timeData[focusedID].subNodeTimeData = data.postData[focusedID].subNodeTimeData;

    getRelation(data.timeData[focusedID]);
    var assistEdge=generateAssistEdge(data.timeData[focusedID]);
    var newGraph=new Graph(data.timeData[focusedID].edge,assistEdge);
    reCalculateLayout(newGraph,data.timeData[focusedID]);
    reverseXY(data.timeData[focusedID]);
    coordinateOffset(data.timeData[focusedID]);
    getTimeData(data.timeData[focusedID]);
    if(preFocusedID)
    {
        procrustes(data.timeData[preFocusedID],data.timeData[focusedID]);
        coordinateOffset(data.timeData[focusedID]);
        coordinateOffset(data.timeData[preFocusedID]);
    }

    findCircleEdges(data.postData[focusedID]);

    getCurves(data.timeData[focusedID]);
//    drawAuthorInfo();
    if(focusedID&&preFocusedID){
        var fID=parseInt(focusedID.split('_')[1]);
        var pID=parseInt(preFocusedID.split('_')[1]);
        if(fID>pID){
            //incremental
//            var chlData=data.postData[preFocusedID];
//            var parData=data.postData[focusedID];
            generateTransitionData(data.timeData[focusedID],data.timeData[preFocusedID]);

        }
        else if(fID<pID){
            //decremental
            generateTransitionData(data.timeData[preFocusedID],data.timeData[focusedID]);

        }
    }

    if(focusedID&&preFocusedID){
        layout(optionNumber,false,false,data.timeData[focusedID]);

    }
    else{
        layout(optionNumber,false,false,data.timeData[focusedID]);

    }

//    yearSlider();
//    clusterSlider();
}
export{
    clusterSlider,
    reLayoutByCluster,
    yearSlider,
    reLayoutByYear,
    copy,
    dataFilter
};