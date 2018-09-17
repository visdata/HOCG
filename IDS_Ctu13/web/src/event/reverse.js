function reverseData(){
//    if(dataType=='multiple'){
//        for (var j=0;j<json_edges_list.length;j++){
//            reverseXY(json_nodes_list[j],json_edges_list[j]);
//        }
//    }
//    else{
//        reverseXY(nodes,edges);
//    }

    reverseXY(data.postData[focusedID]);
}
function changeColor(text,thisDivClass){
    var anotherText;
    if (thisDivClass=='horizontal'){
        anotherText=d3.select('.verticalText');
    }
    else{
        anotherText=d3.select('.horizontalText');
    }
    var color=text.style('color');
    if(color=='rgb(128, 128, 128)'){
        text.style('color','rgb(255, 255, 255)');
        anotherText.style('color','rgb(128, 128, 128)');

//            .each(function(d){
//                if(d.style('color')=='rgb(128, 128, 128)')d.style('color','rgb(255, 255, 255)');
//                else if(d.style('color')=='rgb(255, 255, 255)')d.style('color','rgb(128, 128, 128)');
//            })
    }


}
function reverse() {
    var thisDiv=d3.select(this);
    var thisDivClass=thisDiv.attr('class');
    var text=thisDiv.select('text');
    if(thisDivClass=='horizontal'&currentDirection=='vertical'){
        currentDirection='horizontal';
        selectedReverse=1;


    }
    else if(thisDivClass=='vertical'&currentDirection=='horizontal'){
        selectedReverse=0;
        currentDirection='vertical';

    }
    changeColor(text,thisDivClass);
    reverseData()
    coordinateOffset(data.postData[focusedID]);

    getCurves(data.postData[focusedID]);
    clear();
    layout(optionNumber,true,'flowMap',data.postData[focusedID]);
}
function reverseXY(d){
    var nodes=d.node;
    var edges=d.edge;
    for (var i=0;i<nodes.length;i++){
        var t=nodes[i].x;
        nodes[i].x=nodes[i].y;
        nodes[i].y=t;
    }
//    for (var i=0;i<curves.length;i++){
//        for (var j=0;j<curves[i].points.length;j++){
//            var t=curves[i].points[j].x;
//            curves[i].points[j].x=curves[i].points[j].y;
//            curves[i].points[j].y=t;
//        }
//    }
    for (var i=0;i<edges.length;i++){
        for(var j=0;j<edges[i].assists.length;j++){
            var t=edges[i].assists[j][0];
            edges[i].assists[j][0]=edges[i].assists[j][1];
            edges[i].assists[j][1]=t;
        }
    }
}
function clear(){
    svg.selectAll('.node').remove();
    svg.selectAll('path').remove();
    svg.selectAll('text').remove();
}
export {
    reverseData,
    changeColor,
    reverse,
    reverseXY,
    clear,
}