import {getSelfEdgeStrokeWidth,getStrokeWidth} from './graphLayout'
function drawEdges(optionNumber,doTransition,transitionType,d){
    this.pathElem=[];
    this.tmpEdgeAssistCount=0;
    var that=this;
    var color=this.color;
    var pathElem=this.pathElem;
    var tmpEdgeAssistCount=this.tmpEdgeAssistCount;
    var data=this.data;
    var focusedID=this.focusedID;
    var drawedges=this.drawedges;
    var nodes=d.node;
    var edges=d.edge;
    var drag=this.drag;
    var pathData=this.pathData;
    var arrowData=this.arrowData;
    var duration=this.duration;
    var textElem=this.textElem;
    var relation=this.relation;

    var screenPreEdges=data.screenPreviousData[focusedID].edge;
    var edgeFlowList=[];
    var edgeWeightList=[];
    var edgeLabelElem=this.edgeLabelElem;
    var drawEdgeLabel=this.drawEdgeLabel;
    var weightSum=0;
    var drawnodes=this.drawnodes;

    var nodesDic={};
    nodes.forEach(function (node) {
        nodesDic[node.id]=node;
    });
    //var nodeTimeSeriesDic={};
    //nodes.forEach(function(node){
    //    var id=node.id;
    //    node.timeSeries.forEach(function (item) {
    //        var start=item.T_start;
    //        var end=item.T_end;
    //        var key=id+'-'+start+'-'+end;
    //        nodeTimeSeriesDic[key]=item;
    //    });
    //});
    edges.forEach(function(edge){
        //var source=edge.source;
        //var target=edge.target;
        //edge.timeSeries.forEach(function(item){
        //    var sourceTime=item.sourceTime;
        //    var targetTime=item.targetTime;
        //    var sourceKey=source+'-'+sourceTime.start+'-'+sourceTime.end;
        //    var targetKey=target+'-'+targetTime.start+'-'+targetTime.end;
        //    item.sourceTime.anomalyWeight=nodeTimeSeriesDic[sourceKey].weight;
        //    item.targetTime.anomalyWeight=nodeTimeSeriesDic[targetKey].weight;
        //});
        edge.points.forEach(function(point){
            var nodeID=point.id;
            if(nodeID!=-1){
                var node=nodesDic[nodeID];
                point.size=node.nodeR;
            }

        });
    });
    //edges.forEach(function(edge){
    //    edge.timeSeries.forEach(function (t) {
    //        console.log(t.weightRelative);
    //    })
    //})
    for (var i=0;i<edges.length;i++){
        edgeFlowList.push(edges[i].flow);
        for (var key in edges[i].weight){

//            edgeYearList.push(key);
            weightSum+=edges[i].weight[key];
        }
        edgeWeightList.push(weightSum);
    }

//    console.log(edgeYearDic);
//    drawYearAxis(edgeYearList);

    if(!(that.flowScale)&&!(that.flowScale)){
        that.flowScale=d3.scaleLinear()
            .domain([d3.min(edgeFlowList),d3.max(edgeFlowList)])
            .range([2,6]);
        that.weightScale=d3.scaleLinear()
            .domain([d3.min(edgeWeightList),d3.max(edgeWeightList)])
            .range([2,6]);
    }



    var markerSize=25;
    var arrowElem=[];
    var g=drawedges.append('g').attr('class','edgeField');
    var gg=drawedges.append('g').attr('class','arrowField');
    var markerG= drawedges.append('g').attr('class','markerField');
    var currentLevel=drawedges.attr('id');
    var arrowG=gg.selectAll('path')
        .data(edges)
        .enter()
        .append('path')
        .attrs({
            class:function (d,i) {
                d.levelIndex=0;
                d.class =currentLevel+'path'+i;
                return d.class;
            },
            id:function(d){
                return 's'+d.source+'_t'+d.target;
            },
            source:function(d){
                return d.source;
            },
            target:function(d){
                return d.target;
            }
        })
        .style("stroke",color.edgeColor)
        .style('fill','none')
        .style("stroke-width",function(d){
            //console.log(d.flow);
            d.that=that;
            var stroke_width=getStrokeWidth(d);
            d.stroke_width=stroke_width;
            return d.stroke_width;
        })
        .attr('d',function (d) {
            return arrowData(d,that);
        })
        .each(function (d) {
            arrowElem.push({
                source:d.source,
                target:d.target,
                arrow:d3.select(this)
            });
        })
        .call(drag);



        var svgEdges=g.selectAll('path.curves').data(edges)
        .enter().append('path')
        .attrs({
            class: function(d, i) {
                d.levelIndex=0;
                d.class =currentLevel+'path'+i;

                return d.class;
            },
//            d: function(d,i){return pathData(curves[i])},
//            d: pathData,
            id:function(d){
                var yearID='';
                for(var key in d.weight){
                    yearID+=key+'_';
                }
//                console.log(d.weight);
                return yearID;
            },
            //year:function(d){return d.year;},
            source:function(d){
               // console.log(d.source);
                return d.source;},

            target:function(d){return d.target; }
//            nodes:function(d){return d.nodes;}
        })
//        .attr("marker-end","url(#markerArrow)")
//        .style("opacity",function(d){
//            if(d.edgeType=='dash'){
//                return 0.2;
//            }
//        })
        .style("visibility",function(d){
            if(d.edgeType=='dash'){
                return 'hidden';
            }
            else{
                return 'visible';
            }
        })
//        .style("stroke","rgb(0,220,225)")
        .style("stroke",color.edgeColor)
        .style('fill','none')
        .style("stroke-width",function(d){
//            if(d.edgeType=='dash'){
//                return 1;
//            }
//            else{
            d.that=that;
                var stroke_width=getStrokeWidth(d);
//            console.log(stroke_Fwidth);
            d.stroke_width=stroke_width;
                return d.stroke_width;
//            }

        })
        .style("stroke-dasharray",function(d){
            if(d.propagate){
                return '5,5';
            }
        })
//        .style("stroke-dasharray",'5,5')
        .each(function (d,i) {
            d.that=that;
            var stroke= 1*getStrokeWidth(d);

            var size=13/(stroke);
            //draw marker

            var marker=markerG.append("svg:defs").selectAll("marker")
                .data([{marker:1}])
                .enter().append("svg:marker")
                .attr("id", function(d){d.id = currentLevel+"markerArrow"+i+'_'+that.focusedID;return d.id;})
                .attr('class','marker')
                .attr("viewBox", "0 0 10 10")
                .attr("refX", 0)
                .attr("refY", 4)
                .attr("markerWidth", size)
                .attr("markerHeight", size)
                .attr("orient", 'auto')
                .append("svg:path")
//                .attr("d", "M0,3 L0,8 L8,3 L0,3")
                .attr("d", "M0,0 L0,8 L8,4 L0,0")
                .style("fill",color.edgeColor);
            var thisEdge=d3.select(this);
////            thisEdge.old_points=d.points.concat();
//            marker.style("fill","rgb(0,220,225)");
////            console.log(marker);
            d.marker=marker;
            //thisEdge.attr("marker-end",function(){return "url(#"+currentLevel+"markerArrow"+i+'_'+that.focusedID+")"});
            pathElem.push(thisEdge);



        });
    if(doTransition){
        if(transitionType = 'flowMap'){
//            console.log(edges);
            g.selectAll('path')
                .each(function(d){
                    d.marker.style('fill','none')
                })
            g.selectAll('path')
                .attr('d',function(d){
                    return pathData(d,that);
                })
                .style("stroke-dasharray", function(d){
                    var thisEdge=d3.select(this);
                    var edgeLength=thisEdge.node().getTotalLength();
                    return edgeLength;
                })
                .style("stroke-dashoffset", function(d){
                    var thisEdge=d3.select(this);
                    var edgeLength=thisEdge.node().getTotalLength();
                    d.dashOffset=edgeLength;
                    return d.dashOffset;
                })
                .transition()
//                .delay(0)
//                .duration(2000)
                .delay(function(d){
                    return d.delay;})
                .duration(function(d){
                    return d.duration;})
                .ease("linear")
                .style("stroke-dasharray", function(d){
                    var thisEdge=d3.select(this);
                    var edgeLength=thisEdge.node().getTotalLength();
                    return edgeLength;
                })
                .style("stroke-dashoffset", function(d){
//                    console.log('setFinalOffset');
                    d.dashOffset=0;
                    return d.dashOffset;
                })
                .each('start',function(d){
                    var thisEdge=d3.select(this);
                    var originStrokeWidth=thisEdge.style('stroke-width');
                    thisEdge.attrs({
                        transitionStatus:function(d){
                            d.transitionStatus='start';
                            return d.transitionStatus;
                        },
                        'originStrokeWidth':originStrokeWidth,
                    })
                    .styles({
                        'stroke':'red',
                        'stroke-width':'3px'
                    });
                    if(d.marker)d.marker.attrs({
                        transitionStatus:function(d){
                            d.transitionStatus='start';
                            return d.transitionStatus;
                        }
                    })
                })
                .each('end',function(d){
                    d.marker.style('fill',color.edgeColor)
                    var thisEdge=d3.select(this);
                    var originStrokeWidth=thisEdge.attr('originStrokeWidth');

                    thisEdge.attrs({
                        transitionStatus:function(d){
                            d.transitionStatus='end';
                            return d.transitionStatus;
                        }
                    })
                    .styles({
                        'stroke':'yellow',
                        'stroke-width':originStrokeWidth
                    });
                    if(d.marker)d.marker.attrs({
                        transitionStatus:function(d){
                            d.transitionStatus='end';
                            return d.transitionStatus;
                        }
                    })
                })



        }
    }
    else{
        svgEdges.data(edges)
            .attrs({
                d:function(d){
                    return pathData(d,that);
                },
                transitionStatus:'end'
            })
            .each(function(d){
                var thisEdge=d3.select(this);
                var edgeClass=thisEdge.attr('class');
                //var pathData=thisEdge.attr('d').split('M')[1].split(' ');
                //var textX=(parseFloat(pathData[0])+parseFloat(pathData[2]))/2;
                //var textY=(parseFloat(pathData[1])+parseFloat(pathData[3]))/2;

                //var edgeLabel=drawEdgeLabel(optionNumber.edgeLabelOption,d.flow,d.citation,textX,textY,edgeClass,d.dx, d.dy);
//                edgeLabel.attr('dx',d.dx);
//                edgeLabel.attr('dy',d.dy);
//                thisEdge.edgeLabel=edgeLabel;
                var maxScore=0;
                d.timeSeries.forEach(function (item) {
                    (maxScore<item.weightRelative)?maxScore=item.weightRelative:maxScore=maxScore;
                });
                var points= d.points;
                var sp=points[0];
                var tp=points[points.length-1];
                var mid={x:(sp.x+tp.x)/2,y:(sp.y+tp.y)/2,fontSize:12};
                var edgeLabel=drawedges.append('text')
                    .datum(mid)
                    .attrs({
                        class:'corrScoreValue',
                        x:function(e){return e.x;},
                        y:function(e){return e.y;}
                    })
                    .styles({
                        'visibility':'hidden',
                        'font-size':function(e){return e.fontSize+px;},
                        'font-family':'Microsoft YaHei',
                        'color':'black'
                    })
                    .html((maxScore).toFixed(2));


                thisEdge.attrs({
                    dx:d.dx,
                    dy:d.dy
                });
                d.edgeLabel=edgeLabel;
                edgeLabelElem.push(edgeLabel);

            });


    }

    this.getYearEdgeRelation();
    drawnodes.select('.nodeLayer')
        .selectAll('.node')
        .each(function(d){
            d.arrow=[];
            d.pathElem=[];
            d.textElem={
                textElem:[],
                id: d.id
            };
            for(var i=0;i<arrowElem.length;i++){
                if(d.id == arrowElem[i].source || d.id== arrowElem[i].target){
                    d.arrow.push(arrowElem[i]);
                }
            }
            d.self=d3.select(this);
            if(textElem[d.id])d.textElem.textElem=textElem[d.id].textElem;
            for(var j=0;j<relation[d.id].edges.length;j++){
                d.edgeLabelElem.push(edgeLabelElem[relation[d.id].edges[j]]);
                d.pathElem.push(pathElem[relation[d.id].edges[j]]);
            }
        });
//    changeEdge(2004);
}
function drawEdgeLabel(option,flow,citation,textX,textY,edgeClass,dx,dy){
    var fontSize=14;
    var drawedges=this.drawedges;
    if(option ==1){
        var txt=drawedges.append('text').attr('class','edgeLabel').attr('id','edgeLabel'+edgeClass)
            .attrs({
                dx:dx,
                dy:dy,
                x:textX,
                y:textY
            })
            .html(citation)
            .styles({
                'font-family':'Microsoft Yahei',
                'font-size':fontSize+px,
                fill:'yellow'
            });

    }
    else if(option ==2){
        var txt=drawedges.append('text').attr('class','edgeLabel').attr('id','edgeLabel'+edgeClass)
            .attrs({
                dx:dx,
                dy:dy,
                x:textX,
                y:textY
            })
            .html(flow)
            .styles({
                'font-family':'Microsoft Yahei',
                'font-size':fontSize+px,
                fill:'yellow'
            });
    }
    return txt;
}
function getYearEdgeRelation(){
    var yearEdgeDic={};
    var edgeClassList=[];
    var edges=d3.selectAll('path')
        .each(function(d){
            var thisEdge=d3.select(this);
            var id=thisEdge.attr('id');
            var edgeClass=thisEdge.attr('class');
            if(edgeClass)edgeClassList.push(edgeClass);
            if(id){
                var yearID=id.split('_');
                yearID.pop();
                for(var i= 0,length=yearID.length;i<length;i++){
                    if(!yearEdgeDic[yearID[i]]){
                        yearEdgeDic[yearID[i]]=[];
                        yearEdgeDic[yearID[i]].push(thisEdge)
                    }
                    else{
                        yearEdgeDic[yearID[i]].push(thisEdge);
                    }
                }
            }
        });
//    console.log(yearEdgeDic);
//    console.log(edgeClassList);
    return yearEdgeDic;
}
function drawSelfEdgeLabel(option,flow,weight,textX,textY,edgeClass){
    var fontSize=14;
    var drawedges=this.drawedges;
    var color=this.color;
    if(option ==1){
        d3.select('.ruler').style('font-size',fontSize+px);
        var dx=String(weight).visualLength()/2;
        var txt=drawedges.append('text').attr('class','selfEdgeLabel').attr('id','selfEdgeLabel'+edgeClass)
            .attrs({

                x:textX-dx,
                y:textY
            })
            .html(weight)
            .styles({
                'font-family':'Microsoft Yahei',
                'font-size':fontSize+px,
                fill:color.edgeColor
            });

    }
    else if(option ==2){
        d3.select('.ruler').style('font-size',fontSize+px);

        var dx=String(flow).visualLength()/2;

        var txt=drawedges.append('text').attr('class','selfEdgeLabel').attr('id','selfEdgeLabel'+edgeClass)
            .attrs({

                x:textX-dx,
                y:textY
            })
            .html(flow)
            .styles({
                'font-family':'Microsoft Yahei',
                'font-size':fontSize+px,
                fill:color.edgeColor
            });
    }
    return txt;
}
function drawSelfEdge(optionNumber,doTransition,transitionType,data){
    var nodes= data.node;
    var edges= data.edge;
    d3.selectAll('.selfEdge').remove();
    d3.selectAll('.selfEdgeLabel').remove();

    getSelfData(nodes);
    drawselfedges.selectAll('selfEdge').data(nodes)
        .enter()
        .append('g')
        .each(function(d) {
            var thisG = d3.select(this);
            if (d.selfEdge > 0) {
                thisG.append('path')
                    .attr('d', function (d) {
                        return d.selfPathStr;
                    })
                    .attr('class','selfEdge')
                    .attr('stroke-width', '2px')
                    .style('stroke', color.edgeColor)
                    .attr('fill', 'none')
                    .each(function (d, i) {
                        selfEdgeElem[d.id]=d3.select(this);
                        var selfLabel=drawSelfEdgeLabel(optionNumber.edgeLabelOption,d.selfEdge,parseInt(d.selfEdge*d.size),d.selfEdgeLabelX,d.selfEdgeLabelY,'selfEdge');
                        selfEdgeLabelElem[d.id]=selfLabel;
                        var stroke = getSelfEdgeStrokeWidth(d);

                        var size = 13 / (stroke);
                        var marker = svg.append("svg:defs")
                            .append("svg:marker")
                            .attr("id", "selfMarkerArrow" + i)
                            .attr('class', 'marker')
                            .attr("viewBox", "0 0 10 10")
                            .attr("refX", 0.2)
                            .attr("refY", 1.1)
                            .attr("markerWidth", size)
                            .attr("markerHeight", size)
                            .attr("orient", 'auto')
                            .append("svg:path")
                            .attr("d", "M0,1 L0,2.666 L2.666,1 L0,1")
                            .style("fill", "rgb(0,220,225)");
                        var thisEdge = d3.select(this);
//            thisEdge.old_points=d.points.concat();
                        marker.style("fill", "rgb(0,220,225)");
//            console.log(marker);
                        thisEdge.marker = marker;
//                        thisEdge.attr("marker-end", function () {
//                            return "url(#selfMarkerArrow" + i + ")"
//                        });thisEdge.attr("marker-end", function () {
//                            return "url(#selfMarkerArrow" + i + ")"
//                        });
                    });

            }

        })
    d3.selectAll('.node').each(function(d){
        if(selfEdgeElem[d.id])d.selfEdgeElem=selfEdgeElem[d.id];
        if(selfEdgeLabelElem[d.id])d.selfEdgeLabelElem=selfEdgeLabelElem[d.id];
    })
}
export {
    drawEdges,
    drawEdgeLabel,
    getYearEdgeRelation,
    drawSelfEdgeLabel,
    drawSelfEdge
}
