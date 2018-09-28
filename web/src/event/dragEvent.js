function dragmove(d) {
    //console.log(d);
    var that= d.that;
    that.ifDrag=true;
    that.markerAdjust=false;
    var pathData=that.pathData;
    var arrowData=that.arrowData;
    var relation=that.relation;
    var currentData=that.currentData;
    var ralation=that.relation;
    var edges=currentData.edge;
    var nodes=currentData.node;
//    console.log(d);
    var oldX= d.x;
    var oldY= d.y;
    d.x = d3.event.x;
    d.y = d3.event.y;
    var x= d.x;
    var y= d.y;
    var x1=x-oldX;
    var y1=y-oldY;
    var delta_x;
    var delta_y;
    var k=that.zoomK||1;

    for (var i=0;i<relation[d.id].edges.length;i++){
        for (var j=0;j<edges[relation[d.id].edges[i]].nodes.length;j++){
            if(d.id==edges[relation[d.id].edges[i]].nodes[j]){
                break;
            }
        }

        var dx=0;
        var dy=0;
        var edge=edges[relation[d.id].edges[i]];
        //if(edges[i].dx)dx = edges[i].dx/k;
        //if(edges[i].dy)dy = edges[i].dy/k;
        var points=edges[relation[d.id].edges[i]].points;
        var length = edges[relation[d.id].edges[i]].points.length;

        if(j==1) {
            points[length - 1].x +=d3.event.dx+dx;
            points[length - 1].y +=d3.event.dy+dy;
        }
        else{
            points[j].x += d3.event.dx+dx;
            points[j].y += d3.event.dy+dy;

        }
        var edgeLabelX=(points[0].x+points[length-1].x)/2;
       // d.points[0]=points[0];
        var edgeLabelY=(points[0].y+points[length-1].y)/2;
       // d.points[d.points.length-1]=points[length-1];
        if(edge.edgeLabel){
            edge.edgeLabel.attrs({
                x:edgeLabelX,
                y:edgeLabelY
            })
        }

    }

    d.self.attrs({cx: d.x, cy: d.y});
   // d.self.attrs({'transform': 'translate(' + d.x + ',' + d.y +')'});
    if(d.arc) d.arc.attrs({'transform': 'translate(' + d.x + ',' + d.y +')'});
    //console.log(d.arrow);

    if(d.arrow){
        for(var i=0,len=d.arrow.length;i<len;i++){
            d.arrow[i].arrow.attr('d',function (d) {
                return arrowData(d,that,k,d.initZoom);
            })
        }
    }
    //if(d.icon)d.icon.attrs({x: d.x- d.delta/k,y: d.y- d.delta/k});
    if(d.icon)d.icon.attrs({x: d.x- d.delta,y: d.y- d.delta});
    if(d.propagate_circle)d.propagate_circle.attrs({cx: d.x,cy: d.y});
    if(d.pathElem)for (var i= 0,len= d.pathElem.length;i<len;i++){
        d.pathElem[i].attr('d',function(d){
                return pathData(d,that,k);
            })
            .style("stroke-dasharray", function(d){
                if(d.propagate){
                    return '5,5';
                }
            });
    }
    if(d.textElem){
        for (var i=0;i< d.textElem.textElem.length;i++){
            //console.log(d.textElem.textElem[i].attr("delta_x"),d.textElem.textElem[i].attr("delta_y"));
            delta_x=d.textElem.textElem[i].attr("delta_x");
            delta_y=d.textElem.textElem[i].attr("delta_y");
            d.textElem.textElem[i].attrs({
                x:function(d){
                    var new_x = x+d.fullLabelDeltaX/k;
                    //console.log('new_x : '+new_x);
                    return new_x;
                },
                y:function(d){
                    var new_y = y+ d.labelDeltaY/k;
                    //console.log('new_y : '+new_y);
                    return new_y;
                }
            })
            //console.log(d.textElem.textElem[i].attr("delta_x"),d.textElem.textElem[i].attr("delta_y"));
        }
    }
    //if(d.idElem){
    //    delta_x= d.idElem.attr("delta_x");
    //    delta_y= d.idElem.attr("delta_y");
    //    d.idElem.attrs({
    //        x:function(d){return x-delta_x;},
    //        y:function(d){return y-delta_y;}
    //    })
    //}
    //if(d.selfEdgeElem){
    //    var selfPath=selfPathData(x, y, d.size);
    //    d.selfEdgeElem.attrs({
    //        d:selfPath
    //    });
    //}
    //if(d.selfEdgeLabelElem){
    //    var oriX=parseInt(d.selfEdgeLabelElem.attr('x'));
    //    var oriY=parseInt(d.selfEdgeLabelElem.attr('y'));
    //    d.selfEdgeLabelElem.attrs({
    //        x:oriX+x1,
    //        y:oriY+y1
    //    })
    //}

    var str_size= d.size.toString();
//    console.log(d.size, str_size.length);
//    console.log(d.idElem);
//    console.log(d.textElem.textElem[0].attr("x"));
//    that.ifDrag=false;

}
export {dragmove}
