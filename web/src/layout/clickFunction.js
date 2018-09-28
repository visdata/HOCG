import{addNodeAxis} from './drawYearAxis';
function nodeClick(d,that){
    //console.log(d);
    var axisSVG=that.axisSVG;
    var svg=that.svg;
    var data=that.data;
    var color=that.color;
    var nodeClass=d.self.attr('class');
    var focusedID=that.focusedID;
    if(nodeClass=='node') {
        var i= d.id;
        var c="label"+i;
        var p=document.getElementById(c);
        p.style.visibility="visible";
        d.self.style('stroke-width','0px');
        d.self.attr('class','node clicked');
        d.self.style('stroke',color.nodeHighlightStroke);
        d.self.style('stroke-width','2px');
        //d.self.style('visibility','visible');
        if(d.textElem)for(var i=0;i<d.textElem.textElem.length;i++){
            d.textElem.textElem[i]
                .styles({
                    'fill':color.nodeLabelHighlightColor
                });
        }

        /*d3.selectAll(".label TFIDFLevel0 tfidf").styles({
               visibility: function () {
                   console.log("yse");
                   return 'visible';
               }
           });*/
    }
    else if(nodeClass=='node clicked'){
        //d.self.style('fill',function(d){return "url(#linearGradient"+ d.id+")"});
        d.self.style('stroke',color.nodeHighlightStroke);
        d.self.style('stroke-width','0px');
       // d.edgeLabelElem.style('visibility','visible');
        d.self.attr('class','node');
        if(d.textElem)for(var i=0;i<d.textElem.textElem.length;i++){
            d.textElem.textElem[i].styles({
                'fill':color.nodeLabelHighlightColor
            });
        }
       /* d.self.style('visibility',function () {
            return visible;
        });*/
    }
    svg.selectAll('.linearGradient')
        .each(function(){
            d3.select(this).selectAll('stop')
                .each(function(d,i){
                    var thisStop=d3.select(this);
                    if(i == 1||i == 2)thisStop.attr('offset',0);
                })
        });
    //that.requestTitleList(d, clusterID);
    var name= d.nodeName;
    that.addNodeAxis(d);
    //that.rightPanelLayout({});
    //console.log(d.id);
    //console.log(d.timeSeries);
    //that.drawClickYearAxis(d.timeData['minute'],that);
}
function ifObjectHasProperty(obj){
    var flag=false;
    for(var key in obj){
        flag=true;
        break
    }
    return flag
}
function recoveryPath(d){
    var directedGraph=this.directedGraph;
    var color=this.color;
    var currentEdgeSourceTargetDic=this.currentEdgeSourceTargetDic;
    var thisID=parseInt(d.id);
    var rootID=directedGraph.root.id.toInt();
    var backPath=directedGraph.findMaxPathBetween(rootID,thisID);
    if(backPath.length>0){
        for(var i=0;i<backPath[0].edges.length;i++){
            var edge=backPath[0].edges[i];
            var source=edge.source;
            var target=edge.target;
            var key=source+'_'+target;
            var currentEdges=[];
            if(currentEdgeSourceTargetDic[key]){
                currentEdges=currentEdgeSourceTargetDic[key];
                for(var j=0;j<currentEdges.length;j++){
                    if(currentEdges[j].highlightedByNodeDic[thisID]){
                        delete currentEdges[j].highlightedByNodeDic[thisID];
                    }
                    if(!ifObjectHasProperty(currentEdges[j].highlightedByNodeDic)){
                        var pathClass='.'+currentEdges[j].class;
                        var path=d3.select(pathClass)
                            .each(function(d){
                                d.levelIndex=0
                            })
                            .styles({
                                stroke:color.edgeColor
                            });
                        var pathMarker=path.data()[0].marker;
                        pathMarker.styles({
                            fill:color.edgeColor
                        });
                    }


                }
            }
        }
    }
}
function highlightPath(d){
    var that=this;
    var color=this.color;
    var directedGraph=this.directedGraph;
    var currentEdgeSourceTargetDic=this.currentEdgeSourceTargetDic;
    var thisID=parseInt(d.id);
    var rootID=directedGraph.root.id.toInt();
    var backPath=directedGraph.findMaxPathBetween(rootID,thisID);
    if(backPath.length>0){
        for(var i=0;i<backPath[0].edges.length;i++){
            var edge=backPath[0].edges[i];
            var source=edge.source;
            var target=edge.target;
            var key=source+'_'+target;
            var currentEdges=[];
            if(currentEdgeSourceTargetDic[key]){
                currentEdges=currentEdgeSourceTargetDic[key];
                for(var j=0;j<currentEdges.length;j++){
                    if(currentEdges[j].highlightedByNodeDic){
                        currentEdges[j].highlightedByNodeDic[thisID]=1;
                    }
                    else{
                        currentEdges[j].highlightedByNodeDic={};
                        currentEdges[j].highlightedByNodeDic[thisID]=1;
                    }
                    var pathClass='.'+currentEdges[j].class;
                    var path=d3.select(pathClass)
                        .each(function(d){
                            d.levelIndex=1
                        })
                        .styles({
                            stroke:color.edgeHightLightColor
                        });
                    var pathMarker=path.data()[0].marker;
                    pathMarker.styles({
                        fill:color.edgeHightLightColor
                    });
                }
            }
        }
        that.drawedges.select('.edgeField').selectAll('path')
            .sort(function(a,b){
                return d3.ascending(a.levelIndex,b.levelIndex);
            });
    }

}
function mouseover(d,that){
    var k=leftLayer.zoomK||1;
    var transitionFlag=that.transitionFlag;
    var color=that.color;
    if(transitionFlag==false){
        var i= d.id;
        var c="label"+i;
        var p=document.getElementById(c);
        var visibility_flag="visible";
        p.style.visibility="visible";
        function changeNode(d,that,changePath){
            if(d.self){
                d.self.style('stroke',color.nodeHighlightStroke);
                d.self.style('stroke-width','3px');
            }
            if(d.textElem)for(var i=0;i<d.textElem.textElem.length;i++){
                d.textElem.textElem[i]
                    .styles({
                        'fill':color.nodeLabelHighlightColor
//                'stroke':color.nodeLabelHighlightStroke,
//                'stroke-width':1+px
                    })
                    .attr('x',function(e){return e.x+ e.fullLabelDeltaX/k;})
                    //.html(function(e){return e.nodeFullName;});
                    .html(function(e){return e.show_name;});
            }
            if(d.pathElem&&changePath)for(var i=0;i<d.pathElem.length;i++){
                d.pathElem[i].style('stroke',color.edgeHightLightColor);
                d.pathElem[i].each(function(p){
                    p.levelIndex=1;
                    if(p.marker){
                        p.marker.style('fill',color.edgeHightLightColor)
                    }
                });
                that.drawedges.select('.edgeField').selectAll('path')
                    .sort(function(a,b){
                        return d3.ascending(a.levelIndex,b.levelIndex);
                    });
            }
            if(d.arrow && changePath)for(var i=0;i<d.arrow.length;i++){
                //if( d.arrow[i].source == d.id || d.arrow[i].target == d.id)
                    d.arrow[i].arrow.style('stroke',color.edgeHightLightColor);
            }
            if(d.idElem)d.idElem.style('fill',color.sizeLabelColor);
        }
        changeNode(d,that,true);
        d.sourceNodes.forEach(function (node) {
            changeNode(node,that);
        });
        d.targetNodes.forEach(function(node){
            changeNode(node,that);
        });


    }


}
function mouseout(d,that){
    var k=leftLayer.zoomK||1;
    var transitionFlag=that.transitionFlag;
    var color=that.color;

    if(transitionFlag==false){
        var nodeClass=d.self.attr('class');
        var visibility_flag = 'hidden';
        if (that.always_show_nodelabel){
            visibility_flag='visible';
        }
        if(nodeClass=='node') {
            var i= d.id;
            var c="label"+i;
            var p=document.getElementById(c);
            p.style.visibility=visibility_flag;
        }
        if(nodeClass=='node clicked') {
            var i= d.id;
            var c="label"+i;
            var p=document.getElementById(c);
            p.style.visibility="visible";
        }
        function changeNode(d,that,changePath){
            var thisnode=d3.select(this);
            if(d.self.attr('class')=='node'){
                d.self.style('stroke','none');
                d.self.style('stroke-width','0px');
                if(d.idElem)d.idElem.style('fill',color.sizeLabelColor);
                if(d.textElem)for(var i=0;i<d.textElem.textElem.length;i++){
                    d.textElem.textElem[i]
                        .styles({
                            'fill':color.nodeLabelColor
                        })
                        .attr('x',function(e){return e.x+ e.labelDeltaX/k;})
                        .html(function(e){return e.show_name;});
                }
            }
            else{
                if(d.textElem)for(var i=0;i<d.textElem.textElem.length;i++){
                    d.textElem.textElem[i]
                        .attr('x',function(e){return e.x+ e.labelDeltaX/k;})
                        .html(function(e){return e.show_name;});
                }
            }
            if(d.pathElem&&changePath)for(var i=0;i<d.pathElem.length;i++){
//            d.pathElem[i].style('stroke','rgb(0,220,225)');
                if(!ifObjectHasProperty(d.pathElem[i].data()[0].highlightedByNodeDic)){
                    d.pathElem[i].style('stroke',color.edgeColor);
                    d.pathElem[i].each(function(p){
                        if(p.marker){
                            p.marker.style('fill',color.edgeColor)
                        }
                    })
                }

            }
            if(d.arrow && changePath)for(var i=0;i<d.arrow.length;i++){
                //if( d.arrow[i].source == d.id || d.arrow[i].target == d.id)
                d.arrow[i].arrow.style('stroke',color.edgeColor);
            }
            that.drawedges.select('.edgeField').selectAll('path')
                .each(function(d){
                    d.levelIndex=0
                });
        }
        changeNode(d,that,true);
        d.sourceNodes.forEach(function (node) {
            changeNode(node,that);
        });
        d.targetNodes.forEach(function(node){
            changeNode(node,that);
        });
    }




}
export {
    nodeClick,
    ifObjectHasProperty,
    recoveryPath,
    highlightPath,
    mouseover,
    mouseout
}
