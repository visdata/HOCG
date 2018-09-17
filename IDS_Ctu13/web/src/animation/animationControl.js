function drawAnimateControlPanel(){
    var that=this;
    var axisSVG=this.axisSVG;
    var svg=this.svg;
    var svgWidth=this.svg.style('width').toFloat();
    var svgHeight=this.svg.style('height').toFloat();
    var marginBottom=40;
    var marginLeft=svgWidth/2;
    if(!this.animateControlG){
        var animateControlG=svg.append('g').attr('class','animation').attr('transform','translate('+marginLeft+','+(svgHeight-marginBottom)+')');
        var imageSize=20;
        var buttonData=[
            {x:-20,y:10,name:'play',url:'/images/play.png',width:imageSize,height:imageSize},
            {x:20,y:10,name:'stop',url:'/images/stop.png',width:imageSize,height:imageSize}
        ];
        animateControlG.selectAll('whatever')
            .data(buttonData)
            .enter()
            .append('image')
            .each(function(d){
                var img=d3.select(this);
                img.attrs({
                    display:'none',
                    type:'controlImage',
                    x: d.x,
                    y: d.y,
                    //cluster: d.oldKey,
                    width: d.width,
                    height: d.height,
                    'xlink:href': d.url
                });
            });
        this.animateControlG=animateControlG;
    }

    //var authorDiv=d3.select('.authorDiv_'+this.position);
    //var width=authorDiv._groups[0][0].clientWidth;
    //var height=authorDiv._groups[0][0].clientHeight*0.5;
    //axisSVG.attrs({
    //    width:width,
    //    height:height
    //});
}
function test(){
    var that=this;
    var axisSVG=this.axisSVG;
    var authorDiv=d3.select('.authorDiv_'+this.position);
    var width=authorDiv._groups[0][0].clientWidth;
    var height=authorDiv._groups[0][0].clientHeight;
    axisSVG.attrs({
        width:width,
        height:height
    });
    console.log('test import')
}
function updateAnimation(flag,that){
    var animateMode=that.animateMode;
    var timeMeasure=that.timeMeasure;
    var optionNumber=that.optionNumber;
    var minTime=that.minTime[timeMeasure];
    var maxTime=that.maxTime[timeMeasure];
    var data=that.data;
    var focusedID=that.focusedID;
    var svg=that.svg;
    var flipBook=that.flipBook;
    var movie=that.movie;
    if(animateMode==flipBook&&!flag){
        if(that.timeFilter[0]==minTime&&that.timeFilter[1]==maxTime){
            that.timeFilter=[minTime,maxTime];
        }
        else{
            that.timeFilter=[that.timeFilter[1],maxTime];
        }
    }

    var timeFilter=that.timeFilter;

    var graphData=JSON.parse(JSON.stringify(data.postData[focusedID]));
    var newD=that.filterDataByYear(graphData, timeFilter,that);
    that.preYear=timeFilter[0];
    var preYear=that.preYear;
    if(timeFilter[0]!=minTime||timeFilter[1]!=maxTime){
        if(animateMode==flipBook&&!flag)newD.keepAll=true;
    }


    if(animateMode==flipBook){
        if(!flag){
            that.layout(optionNumber,true,'flowMap',newD);
        }
        else{
            that.layout(optionNumber,false,false,newD);
        }
    }
    if(animateMode==movie){
//        timeFilter=[minTime,minTime+3];
        that.layout(optionNumber,false,false,newD);
    }
    svg.selectAll('.node')
        .each(function(d){
            var thisNode=d3.select(this);
            if(thisNode.attr('transitionStatus')=='start')thisNode.remove();
        });
}
function playBack(thisNode){
    changeFilter(thisNode,'pause');
    if(animateMode==flipBook){
        //updateAnimation();
        //yearAxisTransition(timeFilter[0],timeFilter[1]);
    }
    else{
        var remainYear=timeFilter[0]-minTime;
        var animationNum=remainYear;
        var currentYearDuration=timeFilter[1]-timeFilter[0];
        timeFilters=[];
        for(var i=0;i<animationNum-1;i++){
//            timeFilters.push([timeFilter[0]+(i+1)*currentYearDuration,timeFilter[1]+(i+1)*currentYearDuration])
            timeFilters.push([timeFilter[0]-(i+1),timeFilter[1]-(i+1)])
        }
        timeFilters.push([minTime,minTime+currentYearDuration]);
        recurMovieTransition(timeFilters);
    }
}
function play(thisNode,that){
    changeFilter(thisNode,'pause');
    var animateMode=that.animateMode;
    var flipBook=that.flipBook;
    var movie=that.movie;
    var maxTime=that.maxTime[timeMeasure];
    var minTime=that.minTime[timeMeasure];
    var temporal=that.temporal;
    var requestMethod=that.requestMethod;
    var ifTemporal=that.ifTemporal;
    that.transitionFlag=true;
//    console.log(timeFilter);
    if(animateMode==flipBook){
        that.updateAnimation(false, that);
        var timeFilter=that.timeFilter;
        that.yearAxisTransition(timeFilter[0],timeFilter[1],that);
    }
    else{
        var remainYear=maxTime-that.timeFilter[1];
        var currentYearDuration=that.timeFilter[1]-that.timeFilter[0];
//        var animationNum=Math.ceil(remainYear/currentYearDuration);
        var animationNum=remainYear;
        var division=temporal.maxDivision;

        that.timeFilters=[];
        var timeFilters=that.timeFilters;
        if(ifTemporal){
            for(var i=1;i<division.length;i++){
                var len=division[i].length;
                timeFilters.push([division[i][0].year.toInt(),division[i][len-1].year.toInt()]);
            }
        }
        else{
            for(var i=0;i<animationNum-1;i++){
//            timeFilters.push([timeFilter[0]+(i+1)*currentYearDuration,timeFilter[1]+(i+1)*currentYearDuration])
                timeFilters.push([that.timeFilter[0]+(i+1),that.timeFilter[1]+(i+1)])
            }
            timeFilters.push([maxTime-currentYearDuration,maxTime]);
        }


        //console.log(timeFilters);
        //console.log(timeFilters);
//        var sliderDuration=yearDelay*currentYearDuration;
        recurMovieTransition(timeFilters,that);


    }
}
function recurMovieTransition(timeFilters,that){
    var yearDelay=that.yearDelay;
    var axisSVG=that.axisSVG;
    var xScale=that.xScale;
    var sliderDuration=yearDelay;
    var timeFilter=that.timeFilter;
    var k=0

    if(timeFilters.length>0){

        axisSVG.select('#leftAxisCircle')
            .transition()
            //                    .delay(k*yearDelay*currentYearDuration)
            .duration(sliderDuration)
            .ease('linear')
            .attrs({
                cx:function(d){
                    d.x = xScale(timeFilters[0][0]);
                    return d.x;
                }
            })
        axisSVG.select('#rightAxisCircle')
            .transition()
            .duration(sliderDuration)
            //                    .delay(k*yearDelay*currentYearDuration)
            .ease('linear')
            .attrs({
                cx:function(d){
                    d.x = xScale(timeFilters[0][1]);
                    return d.x;
                }
            })
            .each('end',function(d){
                that.timeFilter=[timeFilters[0][0],timeFilters[0][1]];
                updateAnimation(false, that);
                timeFilters=timeFilters.splice(1,timeFilters.length-1);

                recurMovieTransition(timeFilters,that)
            })
        axisSVG.select('.movieSlider')
            .transition()
            .duration(sliderDuration)
            //                    .delay(k*yearDelay*currentYearDuration)
            .ease('linear')
            .attrs({
                d: function (d) {
                    d.p1.x=xScale(timeFilters[0][0]);
                    d.p2.x=xScale(timeFilters[0][1]);
                    k+=1;
                    return yearSliderPathData(d);
                }
            })
    }
    else{
        axisSVG.selectAll('.controlButton')
            .each(function(d){
                if(d.name == 'pause'){
                    d3.select(this)
                        .attrs({
                            id:function(d){
                                d.name = 'play';
                                return d.name;
                            }
                        })
                        .styles({
                            filter:function(d){
                                return 'url(#'+ d.name +'_filter)';
                            }
                        })
                }
            });

    }
}
function pause(thisNode,that){
    var name=thisNode.attr('name');
    changeFilter(thisNode,name);
    var adjustData=adjustSliderPosition(false, that);
    var adjustDirection=adjustData.direction;
    var adjustYear=adjustData.year;
    if(adjustDirection=='left'){
        that.removeEdges();
    }
    else{
        updateAnimation(true,that);
//        addNodes(adjustYear);
    }
    that.removeAnimation();
    //console.log(that.timeFilter)
//    console.log('pause');
}
function stop(thisNode,that){
    var axisSVG=that.axisSVG;
    var svg_g=that.svg_g;
    var animateMode=that.animateMode;
    var flipBook=that.flipBook;
    var movie=that.movie;
    var drawnodes=that.drawnodes;
    var drawedges=that.drawedges;
    var data=that.data;
    var focusedID=that.focusedID;
    var minTime=that.minTime;
    axisSVG.selectAll('.controlButton')
        .each(function(d){
            if(d.name == 'pause'){
                d3.select(this)
                    .attrs({
                        id:function(d){
                            d.name = 'play';
                            return d.name;
                        }
                    })
                    .styles({
                        filter:function(d){
                            return 'url(#'+ d.name +'_filter)';
                        }
                    })
            }
        });
    if(animateMode==flipBook){
        drawnodes.selectAll('*').remove();
        drawedges.selectAll('*').remove();
        that.preLayout(data.postData[focusedID]);
    }
    else{
        var adjustData=adjustSliderPosition('stop',that);
        var adjustDirection=adjustData.direction;
        var adjustYear=adjustData.year;
        if(adjustDirection=='left'){
            that.removeEdges();
        }
        else{
//        addNodes(adjustYear);
        }
        svg_g.select('#nodeG2').remove();
        svg_g.select('#edgeG2').remove();
        svg_g.select('#nodeG4').selectAll('*').remove();
        svg_g.select('#edgeG4').selectAll('*').remove();
        //that.timeFilter=[minTime,minTime+3];
        updateAnimation(false, that);
        //that.preLayout(data.postData[focusedID]);
        //that.changeToMovieMode();
    }

}
function temporalTimeLine(thisNode,that){
    thisNode
        .attrs({
            id:function(d){d.name = 'temporalTimeLine';return d.name;}
        })
        .styles({
            filter:function(d){return 'url(#'+ d.name+'_filter)'}
        });
    that.ifTemporal=true;
    that.changeToMovieMode();
//    updateAnimation();
    var division;
    var temporal=that.temporal;
    division=temporal.maxDivision;
    var maxDivision=division;
    maxDivision=[
        [{year:'2007',flow:1},{year:'2010',flow:1}],
        [{year:'2011',flow:1},{year:'2012',flow:1}],
        [{year:'2013',flow:1},{year:'2016',flow:1}]
    ];
    temporal.maxDivision=maxDivision;
    var firstPart=maxDivision[0];
    var timeFilter=that.timeFilter;
    var axisSVG=that.axisSVG;
    var xScale=that.xScale;
    timeFilter=[firstPart[0].year.toInt(),firstPart[firstPart.length-1].year.toInt()];

    axisSVG.select('.movieSlider')
        .transition()
        .duration(100)
        //                    .delay(k*yearDelay*currentYearDuration)
        .ease('linear')
        .attrs({
            d: function (d) {
                d.p1.x=xScale(timeFilter[0]);
                d.p2.x=xScale(timeFilter[1]);
                return yearSliderPathData(d);
            }
        })
        .each('end',function(){
            updateAnimation(false,that);
        })
    axisSVG.select('#leftAxisCircle')
        .transition()
//                    .delay(k*yearDelay*currentYearDuration)
        .duration(100)
        .ease('linear')
        .attrs({

            cx:function(d){
                d.x = xScale(timeFilter[0]);
                return d.x;
            }
        })
        .styles({
            visibility:'visible'
        });
    axisSVG.select('#rightAxisCircle')
        .transition()
        .duration(100)
//                    .delay(k*yearDelay*currentYearDuration)
        .ease('linear')
        .attrs({
            cx:function(d){
                d.x = xScale(timeFilter[1]);
                return d.x;
            }
        });
    axisSVG.select('#leftAxisCircle')
        .attrs({
            'class':'axisCircle axisController',
            index:function(d){return d.index}
        });
    axisSVG.select('#rightAxisCircle')
        .attrs({
            'class':'axisCircle axisController',
            index:function(d){return d.index}
        });
    axisSVG.selectAll('.axisController').sort(function(a,b){
        return d3.descending(a.index,b.index)});


}
function generalTimeLine(thisNode,that){

    thisNode
        .attrs({
            id:function(d){d.name = 'generalTimeLine';return d.name;}
        })
        .styles({
            filter:function(d){return 'url(#'+ d.name+'_filter)'}
        });
    that.ifTemporal=false;
}
function removeEdges(){
    var svg=this.svg;
    svg.selectAll('path')
        .each(function(d){
            var thisEdge=d3.select(this);
            var status=thisEdge.attr('transitionStatus');
            if(status=='start'){
                thisEdge.remove();
            }
        })
}
function addNodes(year){
    var types=['.node','.size','.label'];
    for(var i=0;i<types.length;i++){
        svg.selectAll(types[i])
            .each(function(){
                var thisNode=d3.select(this);
                thisNode.attr('transitionStatus',function(d){
                    var preStatus=minTime;

                    for(var key in nodes[i].nodeTime[timeMeasure]){
                        if(key.toInt()<timeFilter[0])preStatus=key.toInt();
                        else break;
                    }
                    if(firstYear==year-1|| d.transitionStatus=='start'){
                        d.transitionStatus='start';
                        return d.transitionStatus;
                    }
                    else if(d.transitionStatus=='end'){
                        return d.transitionStatus;
                    }
                    else return null;
                });
            });
    }

//        .attr('tmp',function(d){
//            console.log(d)})

//    nodes.attr('tmp',function(d){
//            console.log(d)})
//    var d=data.postData[focusedID];
//    var newD=filterDataByYear(d, [year, year]);
//    newD.passEdge=true;
//    newD.keepAll=true;
//    layout(optionNumber,true,'flowMap',newD);
}
function removeAnimation(){
    var animateMode=this.animateMode;
    var flipBook=this.flipBook;
    var movie=this.movie;
    var svg=this.svg;
    var timeFilter=this.timeFilter;
    if(animateMode==flipBook){
        var types=['.backgroundNode','path','.node','.size','.label'];
        for(var i=0;i<types.length;i++){
            var type=types[i];
            var selector=svg;
            if(type=='path')selector=selector.select('.edgeField');
            selector.selectAll(type)
                .each(function(e,i){
                    var thisObj=d3.select(this);
                    if(thisObj.attr('class')!='legend'){
                        if(thisObj.attr('transitionStatus')==null){
                            console.log(i);
                            thisObj.remove();
                        }
                    }

                })
        }
    }
    svg.select('.rightYear')
        .html(timeFilter[1])
        .transition()
        .duration(100)
        .tween("text", function() {
            var i = d3.interpolateRound(timeFilter[1], timeFilter[1]);
            return function(t) {
                this.textContent = i(t);
            };
        })
    svg.selectAll('.backgroundNode').remove()
//        .each(function(d){
//            var thisNode=d3.select(this);
//            var r=thisNode.attr('r').toFloat();
//            thisNode.transition()
//                .duration(100)
//                .attr('r',r)
//        });
    svg.selectAll('.node')
        .each(function(d){
            var thisNode=d3.select(this);
            thisNode.attrs({
                transitionStatus:'end'
            });
            if(thisNode.attr('r')){
                var r=thisNode.attr('r').toFloat();
                thisNode.transition()
                    .duration(100)
                    .attr('r',r)
            }

        });
    svg.selectAll('.size')
        .each(function(d){
            var thisNode=d3.select(this);
            var size=thisNode.html().toFloat();
            thisNode.attrs({
                transitionStatus:'end'
            })
            thisNode.transition()
                .duration(100)
                .tween("text", function(d) {
                    var i = d3.interpolateRound(size, size);
                    return function(t) {
                        this.textContent = i(t);
                    };
                })
        });
}
function changeFilter(thisNode,id){
    thisNode
        .attr('id',function(d){d.name=id;return d.name});
    thisNode
        .styles({
            filter:'url(#'+id+'_filter)'
        });
}


export {
    test,
    drawAnimateControlPanel,
    updateAnimation,
    play,
    recurMovieTransition,
    pause,
    stop,
    temporalTimeLine,
    generalTimeLine,
    removeEdges,
    removeAnimation,
    changeFilter,
}
