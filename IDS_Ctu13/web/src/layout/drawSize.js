import{clone} from '../processData/processData';
function drawSize(optionNumber,doTransition,transitionType,d){
    var nodes= d.node;
    var edges= d.edge;
//    var nodes= [];
//    var edges=[];
//    clone(d.node,nodes);
//    clone(d.edge,edges);
    var data=this.data;
    var that=this;
    var color=this.color;
    var drawnodes=this.drawnodes;
    var nodeClick=this.nodeClick;
    var mouseover=this.mouseover;
    var mouseout=this.mouseout;
    var idElem=this.idElem;
    var focusedID=this.focusedID;
    var svg=this.svg;
    var screenPreNodes=data.screenPreviousData[focusedID].node;
    var fontSize=15;
    var fontFamily='Microsoft YaHei';
    var drag=this.drag;
    var g=drawnodes.append('g');
//    d3.select('.ruler')
//        .styles({
//            'font-size':15+'px',
//            'font-family':'Microsoft YaHei'
//        });
    function sizeTransition(data1,data2){
        g.selectAll('node_size')
            .data(data1)
            .enter()
            .append('text')
            .attrs({
                "x":function(d){return d.x- String(d.size).visualLength(fontFamily,fontSize)/2;},
                "y":function(d){return d.y+7;},
                "id":function(d){return 'size'+d.id},
                "delta_x":function(d){return String(d.size).visualLength(fontFamily,fontSize)/2;},
                "delta_y":function(d){return -7;},
                "class":'size'
            })
        g.selectAll('.size')
            .data(data2)
            .transition()
            .duration(duration)
            .attrs({
                "x":function(d){return d.x- String(d.size).visualLength(fontFamily,fontSize)/2;},
                "y":function(d){return d.y+7;},
                "id":function(d){return d.id},
                "delta_x":function(d){return String(d.size).visualLength(fontFamily,fontSize)/2;},
                "delta_y":function(d){return -7;},
                "class":'size'
            })
    }
    if(doTransition){

        g.selectAll('node_size')
            .data(nodes)
            .enter()
            .append('text')
            .attrs({
                "x":function(d){return d.x- String(d.sizeSeries[0]).visualLength(fontFamily,fontSize)/2;},
                "y":function(d){return d.y+7;},
                "id":function(d){return d.id},
                "delta_x":function(d){return String(d.sizeSeries[0]).visualLength(fontFamily,fontSize)/2;},
                "delta_y":function(d){return -7;},
                "class":'size'
            })
    }
    else{
        g.selectAll('node_size')
            .data(nodes)
            .enter()
            .append('text')
            .attrs({
                "x":function(d){return d.x- String(d.newSize).visualLength(fontFamily,fontSize)/2;},
                "y":function(d){return d.y+7;},
                "id":function(d){return d.id},
                'transitionStatus':'end',
                "delta_x":function(d){return String(d.newSize).visualLength(fontFamily,fontSize)/2;},
                "delta_y":function(d){return -7;},
                "class":function(d){
                    d.class = 'size';
                    return d.class;
                }
            })
    }
    g.selectAll('.size')
        .data(nodes)
        .on('dblclick',doubleClick)
        .on('click',function(d){return nodeClick(d,that);})
        .on('mouseover',function(d){return mouseover(d,that);})
        .on('mouseout',function(d){return mouseout(d,that);})
        .each(function(d){
            d.that=that;
        })
        .call(drag)

        .each(function(d){
            if(d.size==0||d.focused=='true'){
                d3.select(this).remove();
            }
            idElem[d.id]=d3.select(this);
        })
        .style("opacity",1)
        .style("cursor","hand")
        .styles({
            'font-size':15+'px',
            'font-family':'Microsoft YaHei',
            fill:color.sizeLabelColor
        });
    if(transitionType=='flowMap'){
        var sizes=g.selectAll('.size');
        for(var i=0;i<sizes[0].length;i++){

            var size=d3.select(sizes[0][i]);
            var nodeData;
            var tmpSizeSeries=[];
            var tmpDelay=[];
            size.attr('id',function(d){nodeData=d;return d.id});
            tmpSizeSeries=clone(nodeData.sizeSeries,tmpSizeSeries);
            tmpDelay=clone(nodeData.sizeDelay,tmpDelay);
            setSizeTransition(size,1)
            size.attr('id',function(d){d.sizeDelay=tmpDelay;d.sizeSeries=tmpSizeSeries;return d.id;});
        }
    }
    else{
        g.selectAll('.size')
            .html(function(d){
                return d.newSize;
                //add old key to help change label
                //return d.newSize+'-'+ d.oldKey;
            });
    }
    function setSizeTransition(size,preSize){
        var nodeData=size.data()[0];


        if(nodeData.sizeSeries.length>0){
            size.transition()
                .duration(function(d){return d.duration*4;})
                .delay(function(d){return d.sizeDelay[0];})
                .tween("text", function(d) {
                    var i = d3.interpolateRound(preSize, d.sizeSeries[0]);
                    preSize=d.sizeSeries[0];
                    return function(t) {
                        this.textContent = i(t);
                    };
                })
                .attrs({
                    "x":function(d){return d.x- String(d.sizeSeries[0]).visualLength(fontFamily,fontSize)/2;},
                    "delta_x":function(d){return String(d.sizeSeries[0]).visualLength(fontFamily,fontSize)/2;},
                })
                .style("opacity",1)
                .style("cursor","hand")
                .styles({
                    'font-size':15+'px',
                    'font-family':'Microsoft YaHei',
                    fill:color.sizeLabelColor
                })
                .each('start',function(d){
                    var thisNode=d3.select(this);
                    thisNode.attrs({
                        transitionStatus:function(d){
                            d.transitionStatus='start';
                            return d.transitionStatus;
                        }
                    })
                })
                .each('end',function(d){
                    d.sizeDelay=d.sizeDelay.splice(1,d.sizeDelay.length-1);
                    d.sizeDelay[0]-=d.duration*4;
                    d.sizeSeries=d.sizeSeries.splice(1,d.sizeSeries.length-1);
                    setSizeTransition(size,preSize);
                })
        }
        else{
            size.attr('transitionStatus',function(d){
                d.transitionStatus='end';
                return d.transitionStatus;
            })
        }
    }
    svg.selectAll('.node').each(function(d){
        d.idElem=idElem[d.id];
    })


}
export{drawSize}