function drawLabels(optionNumber,doTransition,transitionType,d){
    var data=this.data;
    var that=this;
    var color=this.color;
    var timeMeasure=this.timeMeasure;
    var sizeScale=this.sizeScale;
    var drawnodes=this.drawnodes;
    var focusedID=this.focusedID;
    //var screenPreNodes=data.screenPreviousData[focusedID].node;
    var nodeClick=this.nodeClick;
    var mouseover=this.mouseover;
    var mouseout=this.mouseout;
    that.textElem.forEach(function (elem) {
        elem.textElem=[];
    });
    var drag=this.drag;
    var preYearNode=this.preYearNode;
    var clusterSummary=this.clusterSummary;
    var nodeList=this.nodeList;
    var nodes= d.node;
    //console.log(nodes);
    var edges=d.edge;
    var fontSize=16;
    var fontFamily='Microsoft YaHei';
    var g=drawnodes.append('g')
        .datum({index:0}).attr('id','outerLayer')
        .attr('class','labelLayer');


    var x;
    if(nodes.length>20){
        x = 2;
    }
    else{
        x = 2;
    }
    nodes.forEach(function(node){
        if(node.focused=='true'){
            node.frequencyKeywords=node.keywords;
        }
    });
    function getAuthorVenue(d,i){
//        console.log(d);
        var author=d.author_venue.author;
        var venue=d.author_venue.venue;
        var label=[author, venue];
        return label[i];
    }
    function setLabelAttributes(nodes){
        //console.log('drawLabel : setLabelAttributes');
        //console.log(nodes);
        g.selectAll('node_label')
            .data(nodes).enter()
            .append('g')
            .each(function(){
                var thisLabelG=d3.select(this);
                var visiblity_flag='hidden'
                if(that.always_show_nodelabel){
                    visiblity_flag='visible';
                }
                thisLabelG.append('text')
                    .styles({
                        'visibility':visiblity_flag,
                        'font-size':function(d){d.fontSize=fontSize;return fontSize+'px'},
                       // 'font-family':'Microsoft YaHei',
                        'font-family':'Times New Roman',
                        fill:function(){
                            return color.nodeLabelColor;
                        }
                    })
                    .html(function(d,j){
                        var n;
                        if(d.dataType=='movement'){
                            n=2;
                        }
                        else n=1;
                        d.nodeName=d.nodeName.substring(0,n).toUpperCase()+ d.nodeName.substring(n);
                        // 修改
                        d.nodeName = d.nodeName
                        d.oriFullName= d.nodeFullName;
                        d.nodeFullName=d.nodeFullName.substring(0,n).toUpperCase()+ d.nodeFullName.substring(n);
                        var show_name=d.nodeName;
                        if(d.dataType == 'traffic'){
                            show_name=show_name.substring(4);
                        }
                        d.show_name = show_name;
                        return show_name;
                    })
                    .attrs({
                        "x":function(d){
                            var len=d.show_name.visualLength(fontFamily,fontSize);
                            var len1= d.show_name.visualLength(fontFamily,fontSize);
                            d.labelDeltaX=-len/2;
                            d.fullLabelDeltaX=-len1/2;
                            return d.x+ d.labelDeltaX+2;

                        },
                        "y":function(d){
                            //return d.y+ d.nodeR;
                            //console.log('drawLabel ');
                            //console.log(d);
                            d.AHeight='A'.visualHeight(fontFamily,fontSize)-5;
                            //d.labelDeltaY=d.nodeR+ d.AHeight+d.layers_num*that.radiusDelta;
                            d.labelDeltaY=d.nodeR+ d.AHeight+d.layers_num_in_six_clock*that.radiusDelta;
                            return d.y+ d.labelDeltaY;
                        },
                        "delta_x":function(d){
                            if(optionNumber.nodeLabelOption ==0){
                                if(d.keywords[i]&&d.keywords[i].length>2){
                                    return d.keywords[i].visualLength(fontFamily,fontSize)/2;
                                }
                            }
                            else if(optionNumber.nodeLabelOption ==1){
                                if(d.id!=0){
                                    var label=getAuthorVenue(d,i)
                                    if(label){
                                        return label.visualLength(fontFamily,fontSize)/2;
                                    }
                                }
                            }
                        },
                        "delta_y":function(d){return -(sizeScale.sizeScale(d.size)+(i+1)*'A'.visualHeight());},
                        "id":function(d){return 'label'+d.id},
                        "disable":true,
                        "class":"label TFIDFLevel"+i+' tfidf'
                    })
                    //.on('dblclick',doubleClick)
                    .on('click',function(d){return nodeClick(d,that);})
                    .on('mouseover',function(d){return mouseover(d,that);})
                    .on('mouseout',function(d){return mouseout(d,that);})
                    .each(function(d){
                        d.that=that;
                    })
                    .call(drag)
                    .style('cursor','hand')
                    .each(function(d,i){
                        if(d.size==0){
                            d3.select(this).remove();
                        }
                        if(that.textElem[d.id]==null){
                            that.textElem[d.id]={
                                textElem:[],
                                id: d.id
                            };
                            that.textElem[d.id].textElem.push(d3.select(this));
                        }
                        else{
                            that.textElem[d.id].textElem.push(d3.select(this));
                        }

                    });

            })

    }
    //for (var i=0;i<3;i++){
    var i=0
        if(doTransition){
            if(transitionType=='flowMap'){
                setLabelAttributes(nodes);

                g.selectAll('.label')
                    .style('fill','none')
                    .transition()
                    .delay(function(d){return d.delay[0];})
                    .duration(function(d){return d.duration;})
                    .style('fill',function(){
//                        if(i ==0){
//                            console.log('firstLabel')
//                            return color.nodeLabelColor;
//                        }
//                        else return 'none';
                        return color.nodeLabelColor;
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
                        var thisNode=d3.select(this);
                        thisNode.attrs({
                            transitionStatus:function(d){
                                d.transitionStatus='end';
                                return d.transitionStatus;
                            }
                        })
                    })
            }

        }
        else{
            setLabelAttributes(nodes);
            g.selectAll('.label').attr('transitionStatus','end');
        }


    //}
}

export {drawLabels}
