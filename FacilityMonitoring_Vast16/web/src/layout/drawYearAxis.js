import {getTime,getTimeString,getTimeStringWithoutYear} from '../processData/processData';
import {search} from '../processData/request';
import {updateAnimation} from '../animation/animationControl';
import {clone} from '../processData/processData';
import {ajax} from '../processData/request'

function drawYearAxis(data) {
    var timeMeasure=this.timeMeasure;
    var d=data.nodeTimeData[timeMeasure];
    var tData=data.nodeTimeData[timeMeasure].data;
    var svg=this.axisSVG;
    var allData=data.fullGraph;
    var that=this;
    var tStart=that.tStart;
    var tEnd=that.tEnd;
    var nodeTimeData=d;
    var parseDate = d3.timeParse("%Y:%j:%H:%M:%S");
    var formatDay=d3.timeFormat("%j");
    var formatHMS=d3.timeFormat(":%H:%M:%S");
    var t=[this.tStart,this.tEnd];
    console.log("drawYearAxis incoming time range "+this.tStart+'->'+this.tEnd);
    var t=[parseDate(getTimeString(getTime(t[0],'second'),'second')),parseDate(getTimeString(getTime(t[1],'second'),'second'))];

    var dataSet=[];
    //console.log("flyroom drawYearAxis tData ");
    //console.log(tData);
    //console.log(allData);
    //console.log(timeMeasure);
    //console.log(that.upper_axis_time_measure);
    //for(var j=0;j<tData.length;j++){
    for(var j=0;j<allData.length;j++){
	dataSet.push([parseDate(getTimeString(parseInt(allData[j][0]),that.upper_axis_time_measure)),allData[j][1]]);
    }

    var currentData=[];
    dataSet.forEach(function (item) {
        if(item[0].getTime()>=t[0].getTime()&&item[0].getTime()<=t[1].getTime()){
            currentData.push(item);
        }
    });

    var maxCount=d3.max(dataSet, function (e) {
        return e[1];
    });
    var minCount=d3.min(dataSet, function (e) {
        return e[1];
    });
    var animateMode=this.animateMode;

    this.preYearPath=false;

    var subYearPathDataList=[[]];
    var yearPathDataList=[];
    var k=0;
    var svgHeight=+svg.attr('height');
    var margin2 = {top: 0.15, right: 0.1, bottom: 0.55, left: 0.4},
        margin = {top: 0.55, right: 0.1, bottom: 0.15, left: 0.4};
    for(var key in margin){
        margin[key]*=svgHeight;
    }
    for(var key in margin2){
        margin2[key]*=svgHeight;
    }
    var width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        height2 = +svg.attr("height") - margin2.top - margin2.bottom;


    var x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear()
            .domain([0,maxCount])
            .range([height, 0]),
        y2 = d3.scaleLinear()
            .domain([0,maxCount])
            .range([height2, 0]);

    var xAxis = d3.axisBottom(x).tickSize(3),
        xAxis2 = d3.axisBottom(x2).tickSize(3),
        yAxis = d3.axisLeft(y).ticks(2),
        yAxis2=d3.axisLeft(y2).ticks(2);
    that.focusX=x;
    that.focusY=y;
    that.contextX=x2;
    that.contextY=y2;
    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();
        var newDomain=s.map(x2.invert);
        x.domain(newDomain);
        var currentData=[];
        dataSet.forEach(function (item) {
            if(item[0].getTime()>=newDomain[0].getTime()&&item[0].getTime()<=newDomain[1].getTime()){
                currentData.push(item);
            }
        });
        y.domain([0, d3.max(currentData, function(d) { return d[1]; })]);
	//console.log('drawYearAxis: brushed ');
	//console.log(focus);
        focus.select(".area").attr("d", area);
        focus.select(".axis--x").call(xAxis);
        focus.select(".axis--y").call(yAxis);
    }
    function brushedEnd(){
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();
        //svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
        //    .scale(width / (s[1] - s[0]))
        //    .translate(-s[0], 0));
        var time=s.map(x2.invert);
        var day=time.map(formatDay).map(function(d){return +d-151;});
        var t=time.map(formatHMS);
    	//console.log("flyroom drawYearAxis:brushedEnd incoming time t "+t)
        var timeFilter=[+getTime(day[0]+t[0],'second'),+getTime(day[1]+t[1],'second')];
        tStart=getTimeStringWithoutYear(timeFilter[0],'second');
        tEnd=getTimeStringWithoutYear(timeFilter[1],'second');
    	//console.log("flyroom drawYearAxis:brushedEnd incoming time range "+tStart+'->'+tEnd)
        //console.log(that.tStart);
        that.tStart=tStart;
        that.tEnd=tEnd;
        that.filter.timeStart=tStart;
        that.filter.timeEnd=tEnd;
        //console.log(that.tStart);
        //that.timeFilter=[+getTime(day[0]+t[0],timeMeasure),+getTime(day[1]+t[1],timeMeasure)];
        //leftLayer.filter.fullGraph=fullGraph;
        that.timeFilterSecond=timeFilter;
        that.topTimeLength=that.timeFilterSecond[1]-that.timeFilterSecond[0];
        that.data.postData={};
        that.data.screenPreviousData={};
        that.data.sourceData={};
        that.data.timeData={};
        var layers=[that];
        var buttons=that.buttonController.buttonDic;
        for(var key in buttons){
            buttons[key].g.remove();
        }
        that.buttonController.buttonDic={};
        that.buttonController.nextY=0;
        that.tabController.layer.selectAll('*').remove();
        that.tabController.tabDic={};
        var zoom=that.svgZoom;
        that.svg.call(zoom.transform,d3.zoomIdentity
            .scale(1)
            .translate(0, 0));
	//console.log("drawYearAxis BrushEnd");
	//console.log(that);
	console.log('drawYearAxis selecting time range in axis: '+tStart+' -> '+tEnd);
        search(layers);
    }
    function focusBrushing(){
        if(d3.event.sourceEvent && d3.event.sourceEvent.type==="zoom") return;
        var s=d3.event.selection|| x.range();
        var time= s.map(x.invert);
        var tabC=that.tabController;
        var tabDic=tabC.tabDic;
        var domain= s.map(x.invert);
        for(var key in tabDic){
            //console.log(key);
            tabDic[key].axisList.forEach(function (axis) {
                var x=axis.x;
                var y=axis.y;
                x.domain(domain);
                var xAxis = d3.axisBottom(x);
                var height=axis.height;
                var data=axis.data;
                var area = d3.area()
                    .curve(d3.curveMonotoneX)
                    .x(function(d) { return x(d[0]); })
                    .y0(height)
                    .y1(function(d) { return y(d[1]); });
                axis.self.select('.areaBottom').datum(data).attr('d',area);
                axis.self.select('.axis--x').call(xAxis)
            });
            tabDic[key].edgeList.forEach(function (edge) {
                var x1=edge.preX;
                var x2=edge.latestX;
                var m1=edge.preMargin;
                var m2=edge.latestMargin;
                var t1=edge.data.source.t;
                var t2=edge.data.target.t;
                var data=edge.data;
                x1.domain(domain);
                x2.domain(domain);
                data.source.x=x1(t1)+m1.left;
                data.target.x=x2(t2)+m2.left;
                edge.self.datum(data)
                    .attr('d',function(d){
                        var mid={x: (d.source.x+ d.target.x)/2,y:(d.source.y+ d.target.y)/2};
                        return 'M'+ d.source.x+','+ d.source.y+'L'+mid.x+','+mid.y+' '+d.target.x+','+ d.target.y;
                        //return 'M'+ d.source.x+','+ d.source.y+'L'+ d.target.x+','+ d.target.y;
                    })
                    .each(function(d){
                        d3.select(this).attr("marker-mid",function(d){return d.marker;});
                    });


            })
        }
    }
    function focusBrushed(){

        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = getBrushExtent('focusBrush') || x.range();
        //var s = d3.brushSelection(focus.select('.focusBrush').node()) || x.range();
        var time=s.map(x.invert);
        var day=time.map(formatDay).map(function(d){return +d-151;});
        var t=time.map(formatHMS);
        var timeFilter=[+getTime(day[0]+t[0],timeMeasure),+getTime(day[1]+t[1],timeMeasure)];
        var timeFilterSecond=[+getTime(day[0]+t[0],'second'),+getTime(day[1]+t[1],'second')];
	//console.log('focusBrushed');
	//console.log(timeFilter);
        that.topFilter=time;
        that.timeFilter=timeFilter;
        that.timeFilterFocus=timeFilterSecond;
        //that.timeFilterSecond=timeFilterSecond;
        //console.log(time);
        //console.log(that.timeFilter)
        updateAnimation(true,that);
        //console.log(.map(formatDay).map(function(d){return +d-151;}));
    }
    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        focus.select(".area").attr("d", area);
        focus.select(".axis--x").call(xAxis); // todo
        context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }
    var brush = d3.brushX()
        .extent([[0, 2], [width, height2]])
        .on("brush", brushed)
        .on("end",function(){
            brushed();
            brushedEnd();
            //focusBrushed();
        });
    var focusBrush=d3.brushX()
        .extent([[0,2],[width,height]])
        //.on("start",function(){console.log('start')})
        .on("brush", function(){
            focusBrushing();
            focusBrushed();
            //focusBrushed();
        })
        .on("end", focusBrushed);
    that.brush=brush;
    that.focusBrush=focusBrush;
    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        //.on("zoom", function(){
        //    zoomed();
        //})
        .on("zoom.end",function(){
            zoomed();
            focusBrushed();
        });

    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x(d[0]); })
        .y0(height)
        .y1(function(d) { return y(d[1]); });

    var area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x2(d[0]); })
        .y0(height2)
        .y1(function(d) {
            return y2(d[1]);
        });

    svg.append("defs").append("clipPath")
        .attr("id", "clipTop")
        .append("rect")
        .attr("width", width)
        .attr("height", height);
    var focus,context;
    if(this.fullGraph==1){
        svg.selectAll('*').remove();
        focus = svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin.left + "," + (margin.top-6).toString() + ")");
        context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top/2 + ")");
    }
    else{
        focus=svg.select('.focus');
        focus.selectAll('*').remove();
        context=svg.select('.context');
    }
    if(!that.timeDomain)that.timeDomain=d3.extent(dataSet, function(d) { return d[0]; })
    x.domain(that.timeDomain);
    y.domain([0, d3.max(currentData, function(d) { return d[1]; })]);
    x2.domain(x.domain());
    //y2.domain(y.domain());

    focus.append("path")
        .datum(dataSet)
        .attr("class", "area")
        .attr("d", area);

    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);
    var focusBrushG=focus.append("g")
        .attr("class", "focusBrush")
        .call(focusBrush)
        .call(focusBrush.move, x.range());
    var zoomRect=focus.append("g")
        .append("rect");
    zoomRect.attr("class", "zoom")
        .attr("width", width)
        .attr("height", 20)
        .attr("transform", "translate(" + 0 + "," + height + ")")
        .call(zoom);
    //zoomRect.on('mousedown.zoom', null)
    //    .on('mousemove.zoom', null)
    //    .on('touchstart.zoom', null);
    //console.log('dataSet in drawing axis');
    //console.log(dataSet);

    if(this.fullGraph==1){
        this.fullGraph=0;
        context.append("path")
            .datum(dataSet)
            .attr("class", "area")
            .attr("d", area2);

        context.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);
        context.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis2);

        context.append("g")
            .attr("class", "brush")
            .call(brush)
            //.call(brush.move, x2.range())
            //.call(brush.move, [x2(t[0]),x2(t[1])]);
            // 设置上侧时间轴初始选取范围
            .call(brush.move, [x2(t[0]),x2(t[1])]);

    }
    else{
        //var s = getBrushExtent('context');
        var s = d3.brushSelection(d3.select('.context').select('.brush').node());
        //console.log(s.map(x2.invert));
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }
    //this.drawNodeTimeDataSet(dataSet,'yearPath');


    //axisSVG.selectAll('text')
    //    .styles({
    //        'fill':color.axisTickColor,
    //        'font-family':'Arial',
    //        'font-weight':'bold'
    //    });
    //this.yearPosition={};
    //for(var year=minTime;year<=maxTime;year++){
    //    this.yearPosition[year]=[xScale(year-0.5),xScale(year+0.5)]
    //}

}
function yearAxisTransition(start,end,that){

    var axisSVG=that.axisSVG;
    var animateMode=that.animateMode;
    var flipBook=that.flipBook;
    var movie=that.movie;
    var xScale=that.xScale;
    var yScale=that.yScale;
    var minTime=that.minTime[timeMeasure];
    var maxTime=that.maxTime[timeMeasure];
    var transitionFlag=that.transitionFlag;
    var timeFilter=that.timeFilter;
//  var len=arguments.length;
    axisSVG.select('#leftAxisCircle')
        .attrs({
            cx:function(d){
                if(animateMode==flipBook){
//                    if(len>0){
                    d.x=xScale(minTime)
                    return xScale(minTime);
//                    }
//                    else return d.x;
                }
                else{
                    d.x=xScale(start)
                    return xScale(start)
                }
            }
        })
        .transition()
        .ease('linear')
        .duration(function(d){
            if(animateMode==flipBook){
//                if(len>0){
                    return (end-start)*2000;
//                }
//                else return d.duration;
            }
            else{
                return (end-start)*2000;
            }

        })
        .attrs({
            cx:function(d){
                if(animateMode==flipBook){
                    d.x=xScale(minTime)
                    return xScale(minTime);
                }
                else{
                    d.x=xScale(start)
                    return xScale(start)
                }
            }
        });
    axisSVG.select('#rightAxisCircle')
        .attrs({
            cx:function(d){
                if(animateMode==flipBook){
                    d.x = xScale(start);
                    return xScale(start);
                }
                else{
                    d.x = xScale(end);
                    return xScale(end)
                }
            }
        })
        .transition()
        .ease('linear')
        .duration(function(d){
            return (end-start)*2000;
        })
        .attrs({
            cx:function(d){
                d.x = xScale(end);
                return xScale(end)
            }
        })
        .each('end',function(){
            transitionFlag=false;
            timeFilter=[minTime,maxTime];
            var button=axisSVG.select('.controlButton');
            if(button.attr('id')=='pause'){
                var name=button.attr('name');
                changeFilter(button,name);
            }
        });

}
function ButtonController(svg){
    this.layer=svg.append('g').attr('class','buttons');
    this.svgHeight=+svg.attr('height');
    this.svgWidth=+svg.attr('width');
    this.buttonDic={};
    this.buttonList=[];
    this.nextX=0;
    this.nextY=0;
    this.textSize=10;
    this.textFamily='Microsoft YaHei';
    //this.nextY=this.svgHeight*0.2;
    this.buttonWidth=80;
    this.buttonHeight=this.svgHeight*0.14;
    this.changeTab=function(){};
    this.clickAreaWidth=8;
    this.currentButton='';
    this.moveButton=function(button){
        var clickAreaWidth=this.clickAreaWidth;
        //console.log(button);
        var that=this;
        var t=d3.transition()
            .duration(100)
            .ease(d3.easeLinear);
        button.g.select('.axisButtonBody')
            .transition(t)
            .attrs({
                y:function(d){d.y-=that.buttonHeight;return d.y;}
            });
        button.g.select('.axisButtonText')
            .transition(t)
            .attrs({
                y:function(d){d.textY-=that.buttonHeight;return d.textY;}
            });
        button.g.select('.axisButtonClickArea')
            .transition(t)
            .attrs({
                y:function(d){d.clickAreaY-=that.buttonHeight;return d.clickAreaY;}
            });
        button.g.select('.axisButtonClickX1')
            .transition(t)
            .attrs({
                d:function(d){return 'M'+ d.clickAreaX+','+ d.clickAreaY+'L'+(d.clickAreaX+clickAreaWidth)+','+(d.clickAreaY+clickAreaWidth);}
            })
        button.g.select('.axisButtonClickX2')
            .transition(t)
            .attrs({
                d:function(d){return 'M'+ (d.clickAreaX+clickAreaWidth)+','+ d.clickAreaY+'L'+(d.clickAreaX)+','+(d.clickAreaY+clickAreaWidth);}
            })
    };
    this.addButton=function(button){
        var color=leftLayer.color;
        var that=this;
        var g=this.layer.append('g').attr('class','button').attr('id','button'+button.id);

        var change=function(d){
            var tabController= d.father.tabController;
            var tabs=tabController.tabDic;
            for(var id in tabs){
                if(id!= d.id){
                    tabs[id].g.styles({
                        visibility:'hidden'
                    });
                }
                else{
                    tabs[id].g.styles({
                        visibility:null
                    })
                }
            }
            for(var id in that.buttonDic){
                if(button.id!=id){
                    that.buttonDic[id].g.select('.axisButtonBody')
                        .styles({
                            fill:color.buttonLight
                        })
                }
            }
            button.g.select('.axisButtonBody')
                .styles({
                    fill:color.buttonHighlight
                })

        };
        var remove=function(d){
            var tabC= d.father.tabController;
            var buttonC= d.father.buttonController;
            var tabs= tabC.layer;
            var buttons= buttonC.layer;
            var tabDic=tabC.tabDic;
            var buttonDic=buttonC.buttonDic;
            var removeID= d.id;
            tabs.select('#tab'+removeID).remove();
            buttons.select('#button'+removeID).remove();
            delete tabDic[removeID];
            delete buttonDic[removeID];
            for(var bID in buttonDic){
                if(+bID>+removeID){
                    buttonC.moveButton(buttonDic[bID]);
                }
            }
            buttonC.nextY-=buttonC.buttonHeight;

        };
        var rect=g.datum(button).append('rect');

        rect
            .attrs({
                class:'axisButtonBody',
                x:that.nextX,
                y:function(d){d.y=that.nextY;return d.y},
                width:that.buttonWidth,
                height:that.buttonHeight
            })
            .styles({
                fill:color.buttonHighlight,
                cursor:'hand'
            })
            .on('click',change);
        var texts=button.text.split('_');
        var textHeight=this.textSize;
        //var textHeight=button.text.visualHeight(this.textFamily,this.textSize);
        var emptyHeight=(that.buttonHeight-texts.length*textHeight)/(texts.length+1);
        var textData=[];
        texts.forEach(function (text,i) {
            var t={};
            t.text=text;
            t.textLength=text.visualLength(that.textFamily,that.textSize);
            t.x=(that.buttonWidth- t.textLength)/2+that.nextX;
            t.y=(i+1)*textHeight+(i+1)*emptyHeight+that.nextY;
            t.father=button.father;
            t.id=button.id;
            textData.push(t)

        });
        //var maxLength=d3.max(texts,function(d){return d.textLength;});
        var svgTexts=g.selectAll('whatever')
            .data(textData)
            .enter()
            .append('text')
            .attrs({
                class:'axisButtonText',
                x:function(d){return d.x;},
                y:function(d){return d.y;}
            })
            .styles({
                'font-size':this.textSize+px,
                'font-family':that.textFamily,
                fill:'white',
                cursor:'hand'
            })
            .html(function(d){return d.text;})
            .on('click',change);
        var clickRect=g.datum(button).append('rect');
        var rectLength=this.clickAreaWidth;
        clickRect
            .attrs({
                class:'axisButtonClickArea',
                id:button.id,
                x:function(d){d.clickAreaX=that.nextX+that.buttonWidth-rectLength/2-rectLength;return d.clickAreaX},
                y:function(d){d.clickAreaY=that.nextY+rectLength/2;return d.clickAreaY},
                width:rectLength,
                height:rectLength
            })
            .styles({
                fill:'transparent',
                cursor:'hand'
            })
            .on('click',remove);
        var clickXg= g.append('g');
        clickXg.append('path')
            .attrs({
                class:'axisButtonClickX1',
                d:function(d){return 'M'+ d.clickAreaX+','+ d.clickAreaY+'L'+(d.clickAreaX+rectLength)+','+(d.clickAreaY+rectLength);}
            })
            .styles({
                fill:'none',
                'stroke-width':1,
                stroke:'white',
                cursor:'hand'
            })
            .on('click',remove);
        clickXg.append('path')
            .attrs({
                class:'axisButtonClickX2',
                d:function(d){return 'M'+ (d.clickAreaX+rectLength)+','+ d.clickAreaY+'L'+(d.clickAreaX)+','+(d.clickAreaY+rectLength);}
            })
            .styles({
                fill:'none',
                'stroke-width':1,
                stroke:'white',
                cursor:'hand'
            })
            .on('click',remove);
        that.nextY+=that.buttonHeight;
        button.g=g;
        that.buttonDic[button.id]=button;
        that.currentButton=button;
    };
    this.removeButton=function(button){

    };
}
function NodeAxisButton(father,name){
    this.id=father.buttonID;
    father.buttonID+=1;
    this.father=father;
    this.text=name;
}
function TabController(svg){
    this.layer=svg.append('g').attr('class','tabs');
    this.tabDic={};
    this.tabList=[];
    //this.visTab='';
    this.changeTab=function(){

    };
    this.addTab=function(tab){
        var g=this.layer.datum(tab).append('g').attr('class','tab').attr('id',function(d){return 'tab'+d.id;});
        var tabID=tab.id;
        this.tabDic[tabID]=tab;
        this.tabList.push(tab);
        tab.g=g;
    };
    this.removeTab=function(tab){

    };
    this.show=function(tab){
        tab.g.styles({
            visibility:null
        });
        for(var id in this.tabDic){
            if (id!=tab.id){
                this.tabDic[id].g.styles({
                    visibility:'hidden'
                })
            }
        }
        this.visTab=tab;
        var bc=leftLayer.buttonController;
        for(var id in bc.buttonDic){
            if(id!=bc.currentButton.id){
                bc.buttonDic[id].g.select('.axisButtonBody')
                    .styles({
                        fill:leftLayer.color.buttonLight
                    })
            }
        }
        bc.currentButton.g.select('.axisButtonBody')
            .styles({
                fill:leftLayer.color.buttonHighlight
            })
    }

}

function drawAreaChart(gBackground,dataSet,area,clipID){
        var backgroundPath=gBackground.append("path")
            .datum(dataSet)
            .attr("class", "areaBottom")
            .attr("d", area)
            .attr("fill", function(d, i) {
                 var color_map={'udp:161':'red','icmp':'blue','tcp:6667':'green'};
                 return color_map[d[i][2]];
            })
            .styles({
                'stroke':'rgb(8,52,123)',
                'clip-path':'url(#'+clipID+')',
                'stroke-width': '2px'
            });
        return backgroundPath;
}

function greyness_to_hsl_color(color_info){
         var main_color = color_info[0];
         var saturation = color_info[1];
         var ret_color = 'hsl('+main_color+','+saturation+'%,60%)';
         return ret_color;
    }

function drawAreaChartByPort(that,gBackground,dataSet,area,clipID){
        //console.log('entering drawAreaCharByPort');
        //console.log(gBackground);
        var newDataset=[];
        for(var i=0;i<dataSet.length;i+=4){
            var cur_data=[];
            cur_data.push(dataSet[i]);
            cur_data.push(dataSet[i+1]);
            cur_data.push(dataSet[i+2]);
            cur_data.push(dataSet[i+3]);
            newDataset.push(cur_data);
        }
        var backgroundPath=gBackground.selectAll('path')
            .data(newDataset).enter()
            .append('path')
            .attr("class", "areaBottomItem")
            .attr("d", area)
            .attr("fill", function(d, i) {
                 var color_map = that.color_map;
                 var port = d[0][2];
                 var ret_color = greyness_to_hsl_color(color_map[port][0]);
                 //console.log('drawAreaChartByPort item fill');
                 //console.log(ret_color);
                 return ret_color;
            })
            .styles({
                'stroke':'rgb(8,52,123)',
                'clip-path':'url(#'+clipID+')',
                'stroke-width': '.5px'
            });
        console.log('temp backgroundPath:',backgroundPath)
        return backgroundPath;
}

function NodeAxisTab(father){
    this.id=father.tabID;
    father.tabID+=1;
    this.father=father;
    this.order=0;
    this.g='';
    this.latestName='';
    this.axisList=[];
    this.axisDic={};
    this.edgeList=[];
    this.edgeDic=[];
    this.drawAxis=function(e){
        var d= e.timeData;
        var that=this.father;
        var order=this.order;
        var svg=that.nodeAxisSVG;
        var color=that.color;
        var tabID=this.id;
        var nodeIndex=e.nodeIndex;
        var svgWidth=that.nodeAxisSVGWidth;
        var svgHeight=that.nodeAxisSVGHeight;
        var thisTab=this;
        if(order>2){
            svg.styles({
                height:(svgHeight+svgHeight*0.23*(order-2))+px
            });
            d3.select('.nodeTimeChart')
                .styles({
                    'overflow-y':'scroll'
                });
        }
        else{
            svg.styles({
                height:svgHeight+px
            });
            d3.select('.nodeTimeChart')
                .styles({
                    'overflow-y':'hidden'
                });
        }
        var nodeTimeData=d;
        var padding=30;
        var g=this.g;
        var minTime=d.minTime;
        var maxTime= d.maxTime;
        var maxCount=d.maxCount;
        var minCount=d.minCount;
        var dataSet= clone(d.data);
        var subTimeMeasure= d.timeMeasure;
        var timeFilter=that.timeFilter;
        var originMeasure=that.timeMeasure;
        var subYearPathDataList=[[]];
        var yearPathDataList=[];
        var k=0;
        var axisHeight=0.15;
        var barHeight=0.08;
        var marginLeft=0.4;
        var marginRight=0.1;
        var name=this.latestName;
        var clipID="clipBottom_"+tabID+'_'+nodeIndex;
        var edgeClipID='edgeClip_'+tabID;
        this.edgeClipID=edgeClipID;
        var axis=new TabAxis();

        var margin = {
            top: barHeight*(order+1)+axisHeight*order,
            right: marginRight,
            bottom: 1-(axisHeight+barHeight)*(order+1),
            left: marginLeft
        };
        for(var key in margin){
            margin[key]*=svgHeight;
        }
        margin.left = 120;
        var width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom;
        var parseDate = d3.timeParse("%Y:%j:%H:%M:%S");
        var newDataSet=[];
        if(e.propagate==1&& dataSet.length==4){
            dataSet[1][1]=0.1;
            dataSet[2][1]=0.1;
        }
        console.log('Raw data in NodeAxisTab e');
        console.log(e);
        dataSet.forEach(function(item){
            var timeStr=getTimeString(parseInt(item[0]),subTimeMeasure);
            item[0]= parseDate(timeStr);
            item[1]= +item[1];
            item[2]= item[2];
            newDataSet.push(item);
        });
        dataSet=newDataSet;
        //console.log(dataSet);
        var x = d3.scaleTime().range([0, width]),
            x2 = d3.scaleTime().range([0, width]),
            y = d3.scaleLinear().range([height, 0])
                .domain([0,1]);
        var xAxis = d3.axisBottom(x),
            yAxis = d3.axisLeft(y)
                .ticks(3);

        var area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(function(d) { 
                return x(d[0]); 
            })
            .y0(height)
            .y1(function(d) { return y(d[1]); });

        var gClip=this.gClip||g.append("defs");
        this.gClip=gClip;
        gClip.append("clipPath")
            .attr("id", clipID)
            .append("rect")
            .attrs({
                //x:margin.left,
                //y:margin.top
            })
            .attr("width", width+1)
            .attr("height", height);
        if(!this.edgeClip){
            this.edgeClip=gClip.append('clipPath')
                .attr('id',edgeClipID)
                .append('rect')
                .attrs({
                    x:margin.left,
                    y:margin.top
                })
                .attr('width',width+1)
                .attr('height',height*10);
        }
        var focus = g.append("g")
            .attr("class", "nodeFocus")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        x.domain([parseDate(getTimeString(parseInt(timeFilter[0]),originMeasure)),parseDate(getTimeString(parseInt(timeFilter[1]),originMeasure))]);
        x2.domain([parseDate(getTimeString(parseInt(timeFilter[0]),originMeasure)),parseDate(getTimeString(parseInt(timeFilter[1]),originMeasure))]);
        //x.domain(d3.extent(dataSet, function(d) { return d[0]; }));
        //y.domain([0, d3.max(dataSet, function(d) { return d[1]; })]);
        // var textSize='12px';
        var textSize='1rem';
        var textFamily='Microsoft YaHei';
        var domainX= x.domain();
        var domainY= y.domain();
        //the rect is use to fill the empty area to call the zoom func
        var axisBackground=focus.append('rect')
            .attrs({
                class:'axisBackground',
                width:width,
                height:height
            })
            .style('fill','transparent');
        focus.append('text')
            .datum({
                text:name,
                x:x(domainX[0])+10,
                y:y(domainY[1])+15
            })
            .attrs({
                class:'axisName',
                x:function(d){return d.x;},
                y:function(d){return d.y;}
            })
            .styles({
                'font-size':textSize,
                'font-family':textFamily
            })
            .html(function(d){return d.text;});
        var gBackground=focus.append('g')
            .datum({index:2})
            .attr('class','areaG sort');
        /*console.log(dataset);
        console.log(area);*/
        var backgroundPath = drawAreaChartByPort(that,gBackground,dataSet,area,clipID);
        var gDblClick=focus.append('g')
            .datum({index:0})
            .attr('class','areaG sort')
        gDblClick.append("path")
            .datum(dataSet)
            .attr("class", "areaBottom")
            .attr("d", area)
            .styles({
                'clip-path':'url(#'+clipID+')',
                fill: 'transparent'
            })
            .each(function(d){
                d.x=x;
                d.x2=x2;
                d.y=y;
                d.xAxis=xAxis;
                d.margin=margin;
                d.height=height;
                d.self=focus;
                d.nodeFullName= e.nodeFullName;
                d.oriFullName= e.oriFullName;
                d.dataType= e.dataType;
                d.focus=focus;
                d.axis=axis;
                d.background=axisBackground;
                d.backgroundPath=backgroundPath;

            })
            .on('mousemove',function(d){
                var p=[d3.event.layerX- d.margin.left,d3.event.layerY- d.margin.top];
                var timeX=d.x.invert(p[0]);
                var weight=0;
                for(var i=0;i< d.length;i++){
                    if(i+1<d.length){
                        if(timeX.getTime()>=d[i][0].getTime()&&timeX.getTime()<=d[i+1][0].getTime()){
                            if(d[i][1]>0&&d[i+1][1]>0){
                                weight=d[i][1];
                            }
                        }
                    }
                }
                var lineData=[
                    {
                        x: d.x,
                        y: d.y,
                        p1:{x: d.x.domain()[0],y: weight},
                        p2:{x: timeX,y: weight},
                        path:function(){return 'M'+ this.x(this.p1.x)+','+ this.y(this.p1.y)+'L'+ this.x(this.p2.x)+','+ this.y(this.p2.y);}
                    },
                    {
                        x: d.x,
                        y: d.y,
                        p1:{x: timeX,y: weight},
                        p2:{x: timeX,y: 0},
                        path:function(){return 'M'+ this.x(this.p1.x)+','+ this.y(this.p1.y)+'L'+ this.x(this.p2.x)+','+ this.y(this.p2.y);}
                    }
                ];
                if(e.propagate==1)weight=0;
                d.lineData=lineData;
                d.self.select('.dashLines').remove();
                d.self.select('.valuePoint').remove();
                d.self.select('.valueText').remove();
                d.self.append('g')
                    .datum({index:1})
                    .attr('class','dashLines sort')
                    .selectAll('whatever')
                    .data(lineData)
                    .enter()
                    .append('path')
                    .each(function(e){
                        e.father=d;
                    })
                    .attr('d',function(e){
                        return e.path();
                    })
                    .styles({
                        fill:'none',
                        stroke:color.edgeColor,
                        'stroke-width':2+px,
                        'stroke-dasharray':3+px
                    });
                d.self.append('g')
                    .attr('class','valuePoint')
                    .selectAll('whatever')
                    .data([lineData[0]])
                    .enter()
                    .append('circle')
                    .attrs({
                        cx:function(e){return e.x(e.p2.x);},
                        cy:function(e){return e.y(e.p2.y);},
                        r:2
                    })
                    .style('fill',color.valuePoint);
                d.self.append('g')
                    .attr('class','valueText')
                    .selectAll('whatever')
                    .data([lineData[0]])
                    .enter()
                    .append('text')
                    .attrs({
                        x:function(e){return e.x(e.p2.x);},
                        y:function(e){return e.y(e.p2.y);}
                    })
                    .styles({
                        'font-size':'10px'
                    })
                    .html(weight);
                d.textWeight=weight;
                d.focus.selectAll('.sort')
                    .sort(function(a,b){return d3.descending(a.index, b.index);});
                //var parseDate = d3.timeParse("%Y:%j:%H:%M:%S");
                var formatDay=d3.timeFormat("%j");
                var formatHMS=d3.timeFormat(":%H:%M:%S");
                //var formatTime=d3.timeFormat("%j:%H:%M:%S")
                d.clickTime=(+formatDay(timeX)-151)+formatHMS(timeX);
            })
            .on('mouseout',function(d){
                d.self.select('.dashLines').remove();
                d.self.select('.valuePoint').remove();
                d.self.select('.valueText').remove();
            })
            .on('dblclick',function(d){
                leftLayer.drawLineData=0;
                d.background.styles({
                    cursor:'-webkit-grab'
                });
                var fixEdge=function(){
                    var tabC=that.tabController;
                    var tabDic=tabC.tabDic;
                    for(var key in tabDic){
                        tabDic[key].edgeList.forEach(function (edge) {
                            var x1=edge.preX;
                            var x2=edge.latestX;
                            var m1=edge.preMargin;
                            var m2=edge.latestMargin;
                            var t1=edge.data.source.t;
                            var t2=edge.data.target.t;
                            var data=edge.data;
                            //x1.domain(domain);
                            //x2.domain(domain);
                            data.source.x=x1(t1)+m1.left;
                            data.target.x=x2(t2)+m2.left;
                            edge.self.datum(data)
                                .attr('d',function(d){
                                    var mid={x: (d.source.x+ d.target.x)/2,y:(d.source.y+ d.target.y)/2};
                                    return 'M'+ d.source.x+','+ d.source.y+'L'+mid.x+','+mid.y+' '+d.target.x+','+ d.target.y;
                                    //return 'M'+ d.source.x+','+ d.source.y+'L'+ d.target.x+','+ d.target.y;
                                })
                        });
                    }
                };
                var thisArea=d3.select(this);
                d.axis.type='detail';
                var requestEdges=[];
                var m=leftLayer.filter.mThres;
                var h=leftLayer.filter.hThres;
                var deleteKeys=[];
                for(var key in d.axis.edgeDic){
                    var s=+key.split('_')[0];
                    var t=+key.split('_')[1];
                    if(thisTab.axisDic[s].type=='detail'&&thisTab.axisDic[t].type=='detail'){
                        //d.axis.edgeDic[key].

                        var source=thisTab.axisDic[s].nodeIndex;
                        var target=thisTab.axisDic[t].nodeIndex;
                        var sType,tType;
                        (thisTab.axisDic[s].nodeType='movement')?sType=1:sType=0;
                        (thisTab.axisDic[t].nodeType='movement')?tType=1:tType=0;

                        var corrValue;
                        var edgeType=sType+tType;
                        if(edgeType==0)corrValue=leftLayer.filter.corrScore.hh;
                        if(edgeType==1)corrValue=leftLayer.filter.corrScore.mh;
                        if(edgeType==2)corrValue=leftLayer.filter.corrScore.mm;
                        var reqEdge={
                            source:source,
                            target:target,
                            corrValue:corrValue
                        };
                        requestEdges.push(reqEdge);
                        deleteKeys.push(key);
                        d.axis.edgeDic[key].forEach(function (edge) {
                            edge.self.remove();
                        })
                        if(thisTab.axisDic[s].edgeDic[key])delete thisTab.axisDic[s].edgeDic[key]
                        if(thisTab.axisDic[t].edgeDic[key])delete thisTab.axisDic[t].edgeDic[key]
                    }
                }
                deleteKeys.forEach(function (key) {
                    delete thisTab.edgeDic[key];
                });
                var url='http://'+that.server+':'+that.detailTimePort+'/AnomalyDistribute';
                var data={dataType: d.dataType,varName: d.oriFullName};
                data.m_threshold=m;
                data.h_threshold=h;
                data.corrValue=0;
                data.filter={
                    space:0,
                    time:0,
                    category:0
                };
                data.edges=requestEdges;
                var success=function(data){
                    d.timeSeries=data.node.timeSeries;
                    console.log(data);
                    var timeData=that.getNodeTimeData(d).data;
                    var newDataSet=[];
                    timeData.forEach(function(item){
                        var timeStr=getTimeString(parseInt(item[0]),subTimeMeasure);
                        item[0]= parseDate(timeStr);
                        item[1]= +item[1];
                        newDataSet.push(item);
                    });
                    timeData=newDataSet;
                    timeData.x=dataSet.x;
                    timeData.x2=dataSet.x2;
                    timeData.y=dataSet.y;
                    timeData.margin=dataSet.margin;
                    timeData.height=dataSet.height;
                    timeData.self=dataSet.self;
                    timeData.nodeFullName=dataSet.nodeFullName;
                    timeData.oriFullName=dataSet.oriFullName;
                    timeData.dataType=dataSet.dataType;
                    timeData.focus=dataSet.focus;
                    timeData.fullDomain= d3.extent(timeData,function(d){return d[0];})
                    //var maxTimeRange=[+getTime('1:0:0:0','second'),+getTime('14:23:59:59','second')];
                    var maxTimeDomain=[parseDate('2016:152:0:0:0'),parseDate('2016:165:23:59:59')];
                    var oriDomain= d.x.domain();
                    d.x.domain(maxTimeDomain);
                    d.x2.domain(maxTimeDomain);
                    d.focus.select('.axis--x').call(d.xAxis);
                    var zoomed=function(){
                        d.background.styles({
                            cursor:'-webkit-grabbing'
                        });
                        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
                        var t = d3.event.transform;
                        d.x.domain(t.rescaleX(d.x2).domain());
                        thisArea.datum(timeData)
                            .attr("d", area);
                        d.backgroundPath.datum(timeData)
                            .attr("d", area);

                        d.self.select('.dashlinesClicked').remove();
                        d.self.select('.valuePointClicked').remove();
                        d.self.select('.valueTextClicked').remove();
                        d.focus.select(".axis--x").call(d.xAxis);

                        if(leftLayer.drawLineData){
                            d.lineData[0].p1.x= d.lineData[0].x.domain()[0];
                            d.self.append('g')
                                .datum({index:1})
                                .attr('class','dashlinesClicked sort')
                                .selectAll('whatever')
                                .data(d.lineData)
                                .enter()
                                .append('path')
                                .each(function(e){
                                    e.father=d;
                                })
                                .attr('d',function(e){
                                    return e.path();
                                })
                                .styles({
                                    fill:'none',
                                    stroke:color.edgeColor,
                                    'stroke-width':2+px,
                                    'stroke-dasharray':3+px
                                });
                            d.self.append('g')
                                .attr('class','valuePointClicked')
                                .selectAll('whatever')
                                .data([d.lineData[0]])
                                .enter()
                                .append('circle')
                                .attrs({
                                    cx:function(e){return e.x(e.p2.x);},
                                    cy:function(e){return e.y(e.p2.y);},
                                    r:2
                                })
                                .style('fill',color.valuePoint);
                            d.self.append('g')
                                .attr('class','valueTextClicked')
                                .selectAll('whatever')
                                .data([d.lineData[0]])
                                .enter()
                                .append('text')
                                .attrs({
                                    x:function(e){return e.x(e.p2.x);},
                                    y:function(e){return e.y(e.p2.y);}
                                })
                                .styles({
                                    'font-size':'10px'
                                })
                                .html(d.textWeight);
                        }


                        fixEdge()
                    };
                    var zoom= d3.zoom()
                        .scaleExtent([1, Infinity])
                        .translateExtent([[0, 0], [width, height]])
                        .extent([[0, 0], [width, height]])
                        .on("zoom", zoomed)
                        .on('end',function(){
                            d.background.styles({
                                cursor:'-webkit-grab'
                            });
                        });
                    thisArea.datum(timeData)
                        .attr("d", area)
                        .on('dblclick',function(){});
                    d.backgroundPath.datum(timeData)
                        .attr("d", area)
                        .on('dblclick',function(){});
                    var s= oriDomain.map(d.x);
                    d.focus.call(zoom)
                        .on("dblclick.zoom", null)
                        .call(zoom.transform, d3.zoomIdentity
                        .scale(width / (s[1] - s[0]))
                        .translate(-s[0], 0));
                    fixEdge();
                    console.log(data.edges);
                    if(data.edges){
                        data.edges.forEach(function (edge) {
                            console.log('--------------start--------------');
                            edge.timeSeries.forEach(function(time){
                                var sourceTime=time.sourceTime.start+'-'+time.sourceTime.end;
                                var targetTime=time.targetTime.start+'-'+time.targetTime.end;
                                var edgeKey=sourceTime+'->'+targetTime;
                                console.log(edgeKey+' weight: '+time.weightRelative);
                                //console.log(time.weightRelative);
                            })
                            console.log('--------------end--------------');
                            thisTab.addEdge(edge);
                        })
                    }

                };
                ajax(url,success,data);
                console.log('dblclick');

                d.self.select('.dashLines').remove();
                d.self.select('.valuePoint').remove();
                d.self.select('.valueText').remove();
                d.self.select('.dashlinesClicked').remove();
                d.self.select('.valuePointClicked').remove();
                d.self.select('.valueTextClicked').remove();
                that.removeW2tabs();
                that.bindW2tabs();
            })
            .on('click',function(d){
                console.log('click');
                var data={
                    dataType: d.dataType,
                    time: d.clickTime,
                    varName: d.oriFullName,
                    rawData:d
                };
                that.rightPanelLayout(data);
                d.self.select('.dashlinesClicked').remove();
                d.self.select('.valuePointClicked').remove();
                d.self.select('.valueTextClicked').remove();
                d.self.select('.dashLines').attr('class','dashlinesClicked sort');
                d.self.select('.valuePoint').attr('class','valuePointClicked')
                    .select('circle')
                    .style('fill',color.valuePointHighlight);
                d.self.select('.valueText').attr('class','valueTextClicked');
                leftLayer.drawLineData=1;
                //console.log(data);
            })
            .style();

        focus.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        focus.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis);

        if(this.latestX)this.preX=this.latestX;
        this.latestX=x;
        if(this.latestY)this.preY=this.latestY;
        this.latestY=y;
        if(this.latestMargin)this.preMargin=this.latestMargin;
        if(this.latestAxis)this.preAxis=this.latestAxis;
        this.latestAxis=axis;
        this.latestMargin={
            left:margin.left,
            top:margin.top
        };
        axis.x=x;
        axis.y=y;
        axis.id=order;
        axis.self=focus;
        axis.area=area;
        axis.xAxis=xAxis;
        axis.height=height;
        axis.data=dataSet;
        axis.type='merged';

        axis.nodeIndex= e.nodeIndex;
        axis.nodeType= e.nodeType;

        this.axisList.push(axis);
        this.axisDic[axis.id]=axis;
        this.order+=1;



    };
    this.addEdge=function(e){
        console.log('entering left-below node detail addEdge');
        console.log(e);
        var that=this;
        var timeMeasure='second';
        var key=this.latestNode+'-'+this.preNode;
        var edges=this.father.currentEdgeSourceTargetDic_axis[key];
        console.log(edges);
        var edge=edges[0];
        edge.newTimeSeries = edge.timeSeries;
        if(e){edge.newTimeSeries= e.timeSeries;}
        var parseDate = d3.timeParse("%Y:%j:%H:%M:%S");
        var formatDay=d3.timeFormat("%j");
        var formatHMS=d3.timeFormat(":%H:%M:%S");
        var s = d3.brushSelection(d3.select('.focus').select('.focusBrush').node());
        var xS=this.latestX;
        var yS=this.latestY;
        var axisS=this.latestAxis;
        var xT=this.preX;
        var yT=this.preY;
        var axisT=this.preAxis;
        var x=this.father.focusX;
        var y=this.father.focusY;
        var edgeKey=axisS.id+'_'+axisT.id;
        this.edgeDic[edgeKey]=[];
        var time=s.map(x.invert);
        var day=time.map(formatDay).map(function(d){return +d-151;});
        var t=time.map(formatHMS);
        var timeFilter=[+getTime(day[0]+t[0],timeMeasure),+getTime(day[1]+t[1],timeMeasure)];
        var newEdges=[];
        var layoutTime;
        if(axisS.type=='detail'&&axisS.type=='detail'){
            layoutTime=edge.newTimeSeries;
        }
        else layoutTime=edge.timeSeries;

        console.log('addEdge, layoutTime');
        console.log(layoutTime);
        layoutTime.forEach(function (item) {
            var sourceT=item.sourceTime;
            var targetT=item.targetTime;
            var sStart=+getTime(sourceT.start,timeMeasure);
            var sEnd=+getTime(sourceT.end,timeMeasure);
            var tStart=+getTime(targetT.start,timeMeasure);
            var tEnd=+getTime(targetT.end,timeMeasure);
    	    //console.log("flyroom drawYearAxis:addEdge incoming time range "+this.tStart+'->'+this.tEnd)/

            var inFilter=function(filter,v){
                if(v>=filter[0]&&v<=filter[1]){return 1;}
                else return 0;
            };
            var vs=[sStart,sEnd,tStart,tEnd];
            var flag=1;
            //vs.forEach(function (v) {
            //    flag*=inFilter(timeFilter,v);
            //});
            var spaceFilter=0.1;
            var temporalFilter=0;

            //console.log('space value: '+item.spatialValue);
            console.log('temporal value: '+item.temporalValue);
            //console.log('weight: '+item.weightRelative);
            if(flag==1){
                //if(item.spatialValue>=spaceFilter&&item.temporalValue>=temporalFilter){
                 //   item.visible='visible';
                //}
                //else
		 //    item.visible='hidden';
                //item.opacity=item.weightAbsolute*20;
                item.opacity=1;
                (item.opacity>1)?item.opacity =1:item.opacity+=0;
                var sourceTime=parseDate(getTimeString(parseInt((sStart+sEnd)/2),timeMeasure));
                var targetTime=parseDate(getTimeString(parseInt((tStart+tEnd)/2),timeMeasure));
		console.log('nodeAxisTab edge anomalyWeight');
		console.log(item.sourceTime.anomalyWeight);
                newEdges.push({
                    //source:{x:xS(sourceTime)+that.latestMargin.left,y:yS(item.sourceTime.anomalyWeight||0.5)+that.latestMargin.top,t:sourceTime},
                    source:{x:xS(sourceTime)+that.latestMargin.left,y:yS(item.sourceTime.anomalyWeight||0.5)+that.latestMargin.top,t:sourceTime},
                    target:{x:xT(targetTime)+that.preMargin.left,y:yT(0)+that.preMargin.top,t:targetTime},
                    weight:item.weightAbsolute*4,
                    visible:item.visible,
                    opacity:item.opacity
                });
            }
        });
        var g=that.g;
        console.log('addEdge, newEdges');
        console.log(newEdges);

        g.selectAll('whatever')
            .data(newEdges)
            .enter()
            .append('path')
            .attrs({
                d:function(d){
                    var mid={x: (d.source.x+ d.target.x)/2,y:(d.source.y+ d.target.y)/2};
                    return 'M'+ d.source.x+','+ d.source.y+'L'+mid.x+','+mid.y+' '+d.target.x+','+ d.target.y;
                }
            })
            .styles({
                'clip-path':'url(#'+that.edgeClipID+')',
                stroke:leftLayer.color.edgeColor,
                'stroke-width':function(d){return d.weight+'px';},
                visibility:function(d){return d.visible;},
                opacity:function(d){return d.opacity;}
            })
            //.style("stroke-dasharray", function(d){
            //    if(edge.propagate){
            //        return '5,5';
            //    }
            //})
            .each(function(d,i){

                var markerdefs=g.append("svg:defs");
                var marker=markerdefs.append("svg:marker")
                    .datum({marker:1})
                    .attr("id", function(e){e.id = "subEdge"+i+'_tab'+that.id;return e.id;})
                    .attr('class','subEdgeMarker')
                    .attr("viewBox", "0 0 10 10")
                    .attr("refX", 0)
                    .attr("refY", 4)
                    .attr("markerWidth", 11/ d.weight)
                    .attr("markerHeight", 11/ d.weight)
                    .attr("orient", 'auto')
                    .append("svg:path")
                    .attr("d", "M0,0 L0,8 L8,4 L0,0")
                    .style("fill",that.father.color.edgeColor);
                var thisEdge=d3.select(this);
                thisEdge.attr("marker-mid",function(){return "url(#"+"subEdge"+i+'_tab'+that.id+")"});
                d.marker="url(#"+"subEdge"+i+'_tab'+that.id+")";

                var tabEdge=new TabEdge();
                tabEdge.self=d3.select(this);
                tabEdge.data=d;
                tabEdge.preX=xS;
                tabEdge.latestX=xT;
                tabEdge.preMargin=that.preMargin;
                tabEdge.latestMargin=that.latestMargin;
                tabEdge.sourceAxis=axisS;
                tabEdge.targetAxis=axisT;
                tabEdge.markerID= d.marker;
                if(!axisS.edgeDic[edgeKey])axisS.edgeDic[edgeKey]=[];
                axisS.edgeDic[edgeKey].push(tabEdge);
                if(!axisT.edgeDic[edgeKey])axisT.edgeDic[edgeKey]=[];
                axisT.edgeDic[edgeKey].push(tabEdge);
                that.edgeList.push(tabEdge);
                that.edgeDic[edgeKey].push(tabEdge);
            });
        //that.timeFilter=timeFilter;
    }
}
function TabAxis(){
    this.id=''
    this.x='';
    this.y='';
    this.self = '';
    this.area='';
    this.edgeDic={}
}
function TabEdge(){
    this.data='';
    this.x='';
    this.y='';
    this.self='';
}
function addNodeAxis(d){
    var data=d.timeData;
    //judge if need create a new tab
    var that= d.that;
    //var name= d.nodeName;
    var name= d.show_name;
    var id= d.id;
    var newTabFlag=true;

    var buttonController=that.buttonController;
    var tabController=that.tabController;

    if(tabController.visTab){
        var latestNodeID=tabController.visTab.latestNode;
        var latestNodeTargets=that.currentEdgeSourceDic_axis[latestNodeID];
        if(latestNodeTargets&&latestNodeTargets.indexOf(+id)!=-1){
            newTabFlag=false;
        }
    }
    if(tabController.visTab){
        var latestNodeID=tabController.visTab.latestNode;
        var latestNodeSources=that.currentEdgeTargetDic_axis[latestNodeID];
        console.log('In addNodeAxis latestNodeSources: '+latestNodeSources);
        console.log('In addNodeAxis id: '+id);
        if(latestNodeSources&&latestNodeSources.indexOf(+id)!=-1){
            newTabFlag=false;
        }
    }
    console.log('In addNodeAxis newTabFlag: '+newTabFlag);
    var tab;
    if(newTabFlag){
        var button=new NodeAxisButton(that,name);
        buttonController.addButton(button);
        tab=new NodeAxisTab(that);
        tab.latestName=name;
        tab.latestNode=id;
        tabController.addTab(tab);
        tab.drawAxis(d);
        tabController.show(tab);
    }
    else{
        tab=tabController.visTab;
        tab.latestName=name;
        tab.preNode=tab.latestNode;
        tab.latestNode=id;
        tab.drawAxis(d);
        tab.addEdge();
        tabController.show(tab);

    }


    //


}
function drawClickYearAxis(d,that){
    var order=that.subAxisOrder;

    var svg=that.nodeAxisSVG;
    var svgWidth=parseFloat(svg.style('width'));
    var svgHeight=parseFloat(svg.style('height'));
    var nodeTimeData=d;
    var padding=30;

    var minTime=d.minTime;
    var maxTime= d.maxTime;
    var maxCount=d.maxCount;
    var minCount=d.minCount;
    var xScale = d3.scaleLinear()
        .domain([minTime,maxTime])
        .range([padding,svgWidth-padding]);

    var yScale = d3.scaleLinear()
        .domain([0,maxCount])
        .range([(svgHeight-padding),padding]);
    var dataSet= d.data;
    //console.log(dataSet);
    var subYearPathDataList=[[]];
    var yearPathDataList=[];
    var k=0;
    var axisHeight=0.23;
    var barHeight=0.07;
    var marginLeft=0.7;
    var marginRight=0.1;
    var margin = {
        top: barHeight*(order+1)+axisHeight*order,
        right: marginRight,
        bottom: 1-(axisHeight+barHeight)*(order+1),
        left: marginLeft
    };
    for(var key in margin){
        margin[key]*=svgHeight;
    }
    var width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
    var parseDate = d3.timeParse("%Y:%j:%H:%M:%S");
    dataSet.forEach(function(item){
        //console.log(item);
        var timeStr=getTimeString(parseInt(item[0]),'minute');
        item[0]= parseDate(timeStr);
        item[1]= +item[1];
    });
    var x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(x).Fon
    var yAxis = d3.axisLeft(y)
            .ticks(3);
    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x(d[0]); })
        .y0(height)
        .y1(function(d) { return y(d[1]); });
    svg.append("defs").append("nodeClipPath")
        .attr("id", "nodeClip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "nodeFocus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    x.domain(d3.extent(dataSet, function(d) { return d[0]; }));
    y.domain([0, d3.max(dataSet, function(d) { return d[1]; })]);
    focus.append("path")
        .datum(dataSet)
        .attr("class", "area")
        .attr("d", area);

    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .attr('font-size','20px');

        focus.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);


    that.subAxisOrder+=1;


    // d3.selectAll("axis axis--x text")
    //     .attr('font-size', '20')
    // d3.selectAll("g.axis axis--x text")
    //     .attr('font-size', '20')
    // d3.selectAll("g.axis axis--y text")
    //     .attr('font-size', '20')
    // d3.selectAll("text")
    //     .attr('font-size', '20')
}
function getBrushExtent(brushClass){
    var left=+d3.select('.'+brushClass).select('.handle--w').attr('x')+3;
    var right=+d3.select('.'+brushClass).select('.handle--e').attr('x')+3;
    return [left,right];
}
function drawNodeTimeDataSet(dataSet,pathClass){
    //var axisSVG=this.axisSVG;



}
export{
    drawYearAxis,
    yearAxisTransition,
    ButtonController,
    NodeAxisButton,
    TabController,
    NodeAxisTab,
    addNodeAxis,
    drawClickYearAxis,
    getBrushExtent,
    drawNodeTimeDataSet
}
