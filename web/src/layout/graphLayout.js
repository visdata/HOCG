import {clone, distance} from '../processData/processData';
import {dragmove} from '../event/dragEvent'

function preLayout(d) {
    //console.trace();
    console.log('entering prelayout');
    console.log(d);
    var layoutData = clone(d);
    var timeMeasure = this.timeMeasure;
    var optionNumber = this.optionNumber;
    //this.timeFilter=this.timeFilter||[this.minTime[timeMeasure],this.maxTime[timeMeasure]];
    this.preYear=this.minTime[timeMeasure];
    var newD=this.filterDataByYear(layoutData, this.timeFilter);
    this.plot_data = newD;
    this.layout(optionNumber,false,false,newD);
    this.ifInitLayout=false;
    this.axisLayout(layoutData);
    //this.requestTitleList(this.focusedNodeData,300);
}

function axisLayout(d) {
    this.drawAnimateControlPanel();

    this.drawYearAxis(d);
}

function getMulEdgeSourceTargetDic(edges) {
    var dic = {};
    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        var source = edge.source;
        var target = edge.target;
        var key = source + '_' + target;
        if (dic[key]) {
            dic[key].push(edge);
        }
        else {
            dic[key] = [edge];
        }
    }
    return dic;
}

function graphZoom() {
    var t = d3.event.transform;
    leftLayer.zoomK = t.k;
    leftLayer.background.style('cursor', '-webkit-grabbing');
    var svg = d3.select(this);
    var layer = svg.select('.svgDrawer');
    layer.attr("transform", t);
    /*layer.selectAll('circle')
        .attr('r',function(d){
            return d.nodeR/ t.k;
            //return d.nodeR;
        });
    layer.selectAll('image')
        .attrs({
            x:function(d){return d.x- d.delta/ t.k},
            y:function(d){return d.y- d.delta/ t.k},
            width:function(d){return d.iconWidth/ t.k+px},
            height:function(d){return d.iconHeight/ t.k+px}
        });
    layer.select('.edgeField').selectAll('path')
    .attr('d',function(d){
        console.log(d);
        console.log(d.that);
         return pathData(d, d.that, t.k);
     })
     .styles({
         'stroke-width':function(d){
             return d.stroke_width/ t.k+px;
         }
     });
    layer.selectAll('.label')
        .styles({
            'font-size':function(d){
                return d.fontSize/ t.k+px;
            }
        })
        .attrs({
            "x":function(d){
                return d.x+ d.labelDeltaX/ t.k+px;
            },
            "y":function(d){
                return d.y+ d.labelDeltaY/ t.k+px;
            }
        });
    layer.selectAll('.corrScoreValue')
        .styles({
            'font-size':function(d){
                return d.fontSize/ t.k+px;
            }
        });
    layer.selectAll('.arc').selectAll('path')
        .attr('d',function (d) {
            console.log(d);
            console.log(d);
            return pathData(d, d.that, t.k);
        });*/
}

function generateLegendColor(that) {
    //var dataset=[{color:'hsl(0,50%,50%)',label:'icmp'},
//		 {color:'hsl(204,50%,50%)',label:'tcp:6667'},
//		 {color:'hsl(150,50%,50%)',label:'udp:161'}
    //   ];
    var dataset = [];
    for (var port in that.color_map) {
        var color_info = that.color_map[port][0];
        var item = {};
        item.label = port;
        var main_color = color_info[0];
        var saturation = color_info[1];
        var color = 'hsl(' + main_color + ',' + saturation + '%,50%)';
        item.color = color;
        dataset.push(item);
    }
    return dataset;
}

function drawProtoLegend(optionNumber, doTransition, transitionType, d) {
    var svg = this.svg
    var w = svg.style('width').toFloat();
    var h = svg.style('height').toFloat();
    // add legend
    var dataset = generateLegendColor(this);
    svg.selectAll('.proto_legend').remove();
    var legend = svg.append("g")
        .attr("class", "proto_legend")
        //.attr("x", w - 65)
        //.attr("y", 50)
          .attr("height", 100)
          .attr("width", 100)
    .attr('transform', 'translate(-20,20)')

    var label_max_len = 0;
    for (var i=0;i<dataset.length;i++){
        //console.log(dataset[i].label);
        //console.log(dataset[i].label.length);
        if (dataset[i].label.length > label_max_len)
            label_max_len = dataset[i].label.length;
    }

    var rect_base = 65;
    var rect_offset = (rect_base+rect_base*(label_max_len/15));
    legend.selectAll('rect')
      .data(dataset)
      .enter()
      .append("rect")
          .attr("x", w - rect_offset)
      .attr("y", function(d, i){ return i *  20;})
          .attr("width", 10)
          .attr("height", 10)
          .style("fill", function(d) {
        var color = d.color;
        return color;
      })

    legend.selectAll('text')
      .data(dataset)
      .enter()
      .append("text")
          .attr("x",w - rect_offset+13)
      .attr("y", function(d, i){ return i *  20 + 9;})
          .text(function(d) {
            var text = d.label;
            if (text === 'tcp:6667') {
                text = 'IRC'
            }
            if (text === 'icmp') {
                text = 'ICMP'
            }
            if (text === 'udp:161') {
                text = 'UDP'
            }
            return text;
      });
}


function layout(optionNumber, doTransition, transitionType, d) {
    var that = this;
    //console.log('layout timefilter '+that.timeFilter)
    var zoom = d3.zoom()
        .scaleExtent([-Infinity, +Infinity])
        .on("zoom", graphZoom)
        .on('end', function () {
            leftLayer.background.style('cursor', '-webkit-grab');
        });
    that.svgZoom = zoom;
    var svg = this.svg;
    svg.call(zoom);
    var containers = [svg.svg_g];

    var drawnodes = this.drawnodes;
    var nodes = d.node;
    var minWeight = 0.8;
    var maxWeight = 0;
    var ts = [];
    nodes.forEach(function (t) {
        ts.push(t.timeSeries);
    });
    ts.forEach(function (t) {
        t.forEach(function (t2) {
            if (t2.weight < minWeight) minWeight = t2.weight;
            if (t2.weight > maxWeight) maxWeight = t2.weight;
        });
    });
    //this.ts=nodes.timeSeries;
    /*console.log("min is " + minWeight);
    console.log("max is " + maxWeight);*/

    /*nodes.timeSeries.forEach(function (node) {
         if(node.weight<minWeight) minWeight=node.weight;
         if(node.weight>maxWeight) maxWeight=node.weight;
    });*/
    var drag = d3.drag()
        .subject(function (d) {
            return d;
        })
        .on('drag', dragmove);
    this.drag = drag;
    this.currentData = d;
    this.currentEdgeSourceTargetDic = getMulEdgeSourceTargetDic(d.edge);
    //console.log(d.edge);
    this.getRelation(d);
    if (!d.keepAll) this.removeSVGElements();
    //this.drawBackgroundYear(doTransition);
    this.excalibur(minWeight, maxWeight);

    this.drawNodes(optionNumber,doTransition,transitionType,d,minWeight,maxWeight);
    this.drawLabels(optionNumber,doTransition,transitionType,d);
    this.drawIcons(optionNumber,doTransition,transitionType,d);
    if (!this.hide_edge)
        this.drawEdges(optionNumber,doTransition,transitionType,d);
    this.drawProtoLegend(optionNumber,doTransition,transitionType,d);

    var edge_show=this.edge_show;
    //console.log('edge show '+edge_show);
    this.svg.selectAll('.edgeField').selectAll('path').styles({
            visibility:function(){
                var vis;
                (edge_show)?vis='visible':vis='hidden';
                return vis;
            }
        });
    this.svg.selectAll('.arrowField').selectAll('path').styles({
            visibility:function(){
                var vis;
                (edge_show)?vis='visible':vis='hidden';
                return vis;
            }
        });


    drawnodes.selectAll('#outerLayer')
        .each(function (d) {
            d3.select('.nodeLayer').datum({index: 4});
            d3.select('.labelLayer').datum({index: 6});
            d3.select('.iconLayer').datum({index: 5});
        })
        .sort(function (a, b) {
            return d3.ascending(a.index, b.index);
        });

}

function excalibur(minWeight, maxWeight) {
    //in fact this function should be renamed as colorBar
    var svgWidth = this.svg.style('width').toFloat();
    var svgHeight = this.svg.style('height').toFloat();
    var barHeight = 10;
    var barWidth = 100;
    var marginRight = 150;
    var marginBottom = 20;
    var barData = {
        right: 150,
        bottom: 20,
        barHeight: 10,
        x: svgWidth - marginRight,
        y: svgHeight - marginBottom - barHeight - 10,
        width: barWidth,
        height: barHeight
    };
    if (!this.colorBar) {
        var gExcalibur = this.svg.append('g')
            .datum({x: barData.x, y: barData.y})
            .attr('class', 'excalibur')
            .attr('transform', 'translate(' + barData.x + ',' + barData.y + ')');

        var defs = gExcalibur.append('defs').attr('class', 'colorBarDefs');
        var linearGradient = defs.append('linearGradient')
            .attrs({
                class: 'lg',
                id: 'colorBarLG'
            });
        var lg = defs.append('linearGradient')
            .attrs({
                class: 'rg1',
                id: 'rg1'
            });
        var stopData = [
            {offset: "0%", color: 'rgb(247,247,247)'},
            //{offset:"50%",color:'rgb(247,247,247)'},
            //{offset:"50%",color:'rgb(247,247,247)'},
            {offset: "100%", color: 'rgb(66,146,198)'}
        ];
        linearGradient.selectAll('whatever')
            .data(stopData)
            .enter()
            .append('stop')
            .attrs({
                offset: function (d) {
                    return d.offset;
                },
                'stop-color': function (d) {
                    return d.color
                }
            });
        gExcalibur.append('rect')
            .datum(barData)
            .attrs({
                width: function (d) {
                    return d.width;
                },
                height: function (d) {
                    return d.height;
                }
            })
            .styles({
                fill: 'url(#colorBarLG)'
            });
        this.colorBar = 1;
    }
    if(this.topFilter){
        var format=d3.timeFormat("%b%d %I%p");
        var time=this.topFilter.map(format);
        var size=10;
        var font='Microsoft YaHei';
        var timeTexts=[
            //{text:minWeight,x:-time[0].visualLength(font,size)/2+25,y:25},
            {text:0,x:-time[0].visualLength(font,size)/2+30,y:25},
            //{text:maxWeight,x:barWidth-time[1].visualLength(font,size)/2+25,y:25}
            {text:1,x:barWidth-time[1].visualLength(font,size)/2+30,y:25}
        ];
        this.svg.select('.excalibur')
            .selectAll('text')
            .remove()
        this.svg.select('.excalibur')
            .selectAll('whatever')
            .data(timeTexts)
            .enter()
            .append('text')
            .attrs({
                x: function (d) {
                    return d.x;
                },
                y: function (d) {
                    return d.y;
                }
            })
            .styles({
                'font-size': size + px,
                'font-family': font,
                //display:'none',
                fill: 'black'
            })
            .html(function (d) {
                return d.text
            });
    }


}

function removeDuplicationLabels(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        var id = '#label' + nodes[i].id;
        svg.selectAll(id)
            .each(function (d, i) {
                var thisLabel = d3.select(this);
                if (thisLabel.attr('isBackground')) {
                    thisLabel.remove();
                }
            });
    }
}

function greyBackground() {
    var svg = this.svg;
    var color = this.color;
    var svg_g = this.svg_g;
//    drawnodes.selectAll('.node')
//        .style('fill','lightgrey');
    svg.select('.rectBackground').remove();
    var width = svg.attr('width');
    var height = svg.attr('height');
    var maskingOutData = [
        {
            class: 'outer mask0',
            index: 1,
            x: 0,
            y: 0,
            width: width,
            height: height,
            'fill': color.svgColor,
            'opacity': 0.6,
            rectClass: 'rect'
        },
        {
            class: 'outer mask1',
            index: 3,
            x: 0,
            y: 0,
            width: width,
            height: height,
            'fill': color.svgColor,
            'opacity': 0.75,
            rectClass: 'rect'
        }
    ];
    svg_g.selectAll('whatever')
        .data(maskingOutData)
        .enter()
        .append('g')
        .attrs({
            class: function (d) {
                return d.class
            },
            index: function (d) {
                return d.index
            }
        })
        .each(function (d) {
            d3.select(this)
                .append('rect')
                .attrs({
                    class: function (d) {
                        return d.rectClass
                    },
                    x: function (d) {
                        return d.x
                    },
                    y: function (d) {
                        return d.y
                    },
                    height: function (d) {
                        return d.height
                    },
                    width: function (d) {
                        return d.width
                    }
                })
                .styles({
                    fill: function (d) {
                        return d.fill
                    },
                    opacity: function (d) {
                        return d.opacity
                    }
                })
        });
//    svg_g.append('rect')
//        .attrs({
//            class:'rectBackground',
//            x:0,
//            y:0,
//            width:width,
//            height:height
//        })
//        .styles({
//            'fill':'rgb(15,40,60)',
//            'opacity':0.85
//        });
    svg.selectAll('path').attr('isBackground', 1);
    svg.selectAll('.node').attr('isBackground', 1);
    svg.selectAll('.size').remove();
    svg.selectAll('.label').attr('isBackground', 1);
    this.initFrameIndex(4)


}

function removeSVGElements() {
    var animateMode = this.animateMode;
    var flipBook = this.flipBook;
    var movie = this.movie;
    var svg_g = this.svg_g;
    if (animateMode == flipBook) {
        svg_g.selectAll('g')
            .each(function (d) {
                if (d.index > 0) d3.select(this).remove();
            });
        this.drawnodes = svg_g.select('#nodeG0');
        this.drawedges = svg_g.select('#edgeG0');
        this.drawnodes.selectAll('*').remove();
        this.drawedges.selectAll('*').remove();
    }
    else {
        svg_g.select('#nodeG2').remove();
        svg_g.select('#edgeG2').remove();
        this.drawnodes
            .attr('index', function (d) {
                d.index = 2;
                return d.index
            })
            .attr('id', function (d) {
                return 'nodeG' + d.index
            });
        this.drawedges
            .attr('index', function (d) {
                d.index = 2;
                return d.index
            })
            .attr('id', function (d) {
                return 'edgeG' + d.index
            });
        this.drawedges.select('.edgeField').selectAll('path')
            .each(function (d) {
                d3.select(this)
                    .attrs({
                        class: function (d) {
                            d.class = 'edgeG2' + d.class.split('G4')[1]
                            return d.class
                        }
                    })
            });
        this.drawedges.selectAll('.marker')
            .each(function (d) {
                d3.select(this)
                    .attrs({
                        id: function (d) {
                            d.id = 'edgeG2' + d.id.split('G4')[1]
                            return d.id
                        }
                    })
            });
        this.initFrameIndex(4);
        svg_g.selectAll('.outer')
            .sort(function (a, b) {
                return d3.ascending(a.index, b.index);
            });
    }


//    svg.selectAll('path').remove();
//    svg.selectAll('.edgeLabel').remove();
//    svg.selectAll('.node').remove();
//    svg.selectAll('.label').remove();
//    svg.selectAll('.size').remove();
}

function drawAuthorInfo() {
    var authorDiv = d3.select('.authorDiv');
    authorDiv.selectAll('div').remove();
    if (focusedID.split('_').length == 2) var tmpID = focusedID.split('_')[0];
    if (authorData[tmpID]) {
        var authorInfo = authorData[tmpID];
    }
    else {
        var authorInfo = authorData['default'];
    }
    for (var i = 0; i < 2; i++) {
        var authorDivWidth = authorDiv.style('width').split('px')[0] - 2;
        var authorDivHeight = authorDiv.style('height').split('px')[0];
        var authorInfoDiv = authorDiv.append('div').attr('class', 'authorInfoDiv')
            .styles({
                float: 'left',
                height: authorDivHeight + px,
                width: authorDivWidth / 2 + px
            });
        var lineRatio = 0.75
        if (i == 0) {
            var lineDiv = authorDiv.append('div').styles({
                float: 'left',
                background: 'rgb(35,78,108)',
                width: '2px',
                height: authorDivHeight * lineRatio + px,
                'margin-top': authorDivHeight * (1 - lineRatio) / 2 + px
            });
        }

        var marginRatio = 0.2;
        var imageRatio = 0.6;
        authorInfoDiv.append('div').attr('class', 'imageDiv')
            .styles({
                float: 'left',
                width: authorDivHeight * imageRatio + px,
                height: authorDivHeight * imageRatio + px,
                'margin-left': authorDivHeight * marginRatio + px,
                'margin-top': authorDivHeight * marginRatio + px

            })
            .append('img').attr('class', 'img').attr('src', authorInfo[i].image)
            .styles({
                'border-radius': 5 + px,
                width: authorDivHeight * imageRatio + px,
                height: authorDivHeight * imageRatio + px
            });
        d3.select('.ruler').style('font-size', '14px');
        var authorTextDiv = authorInfoDiv.append('div').attr('class', 'authorTextDiv')
            .styles({
                float: 'left',
                width: authorDivWidth / 2 - authorDivHeight * (marginRatio + 0.05) - authorDivHeight * imageRatio + px,
                height: authorDivHeight * imageRatio + px,
                'margin-top': authorDivHeight * marginRatio + px,
                'margin-left': authorDivHeight * 0.05 + px
            })
        authorTextDiv.append('div').attr('class', 'authorNameDiv').append('text')
            .styles({
                'font-family': 'Microsoft YaHei',
                'font-size': 14 + px
            })
            .html(function (d) {
                return authorInfo[i]['author'] + ':';
            })
        for (var key in authorInfo[i]) {
            if (key != 'author' && key != 'title' && key != 'image')
                authorTextDiv.append('div').attr('class', 'authorNameDiv').append('text')
                    .styles({
                        'font-family': 'Microsoft YaHei',
                        'font-size': function (d) {
                            return 11 + px;
                        }
                    })
                    .html(function (d) {
                        return authorInfo[i][key];
                    })
        }

    }

}

function getstart(origin1, origin2, r, d) {
    if (d != 0) return origin1 + (r / d) * (origin2 - origin1);
    else return origin1;
}

function getend(origin1, origin2, r, d, k) {
//    if(d!=0) return origin1*ratio+origin2*(1-ratio);
    if (d != 0) return origin1 + ((r + 13 / k) / d) * (origin2 - origin1);
    else return origin1;
}

function qBerzier(p0, p1, p2, t) {
    var x = (1 - t) * (1 - t) * p0.x + 2 * t * (1 - t) * p1.x + t * t * p2.x;
    var y = (1 - t) * (1 - t) * p0.y + 2 * t * (1 - t) * p1.y + t * t * p2.y;
    var midpoint = {
        x: x,
        y: y
    }
    return midpoint;
}

function drawLineArrow(x1, y1, x2, y2) {
    var path;
    var slopy, cosy, siny;
    var Par = 10.0;
    var x3, y3;
    slopy = Math.atan2((y1 - y2), (x1 - x2));
    cosy = Math.cos(slopy);
    siny = Math.sin(slopy);

    path = "M" + x1 + "," + y1 + " L" + x2 + "," + y2;

    x3 = (Number(x1) + Number(x2)) / 2;
    y3 = (Number(y1) + Number(y2)) / 2;

    path += " M" + x3 + "," + y3;

    path += " L" + (Number(x3) + Number(Par * cosy - (Par / 2.0 * siny))) + "," + (Number(y3) + Number(Par * siny + (Par / 2.0 * cosy)));

    path += " M" + (Number(x3) + Number(Par * cosy + Par / 2.0 * siny) + "," + (Number(y3) - Number(Par / 2.0 * cosy - Par * siny)));
    path += " L" + x3 + "," + y3;

    return path;
}

function arrowData(d, that, zoomK, initZoom) {
    var slopy, cosy, siny;
    var Par = 10.0;
    var deltax = d.x;
    var deltay = d.y;
    var p = d.points;
    d.type='L';
    if(!initZoom) initZoom=0.6;
    else initZoom=initZoom*0.6;
    switch (d.type) {
        case 'L':{
            var x1,y1,x2,y2,r1,r2,dis;
            var xc,yc;
            var len=p.length;
            len = len-1;
            var k=zoomK||1;
            dis=distance(p[0].x,p[0].y,p[len].x,p[len].y);
            r1 = d.sourceNode.nodeR/k;
            r2 = d.targetNode.nodeR/k;
            dis=0;
            x1=getstart(p[0].x,p[len].x,0,dis);
            y1=getstart(p[0].y,p[len].y,0,dis);
            var p0={x:x1,y:y1};
            x2=getend(p[len].x,p[0].x,0,dis,k);
            y2=getend(p[len].y,p[0].y,0,dis,k);
            var p2={x:x2,y:y2};
            //xc=(x1+x2)/2+(y1-y2)/6;
            var angle=that.edge_arc_angle;
            xc=(x1+x2)/2+(y1-y2)/angle;
            yc=(y1+y2)/2+(x2-x1)/angle;
            //yc=(y1+y2)/2+(x2-x1)/6;
            var p1 = {x: xc, y: yc};
            var midPoint = qBerzier(p0, p1, p2, 0.5)
            slopy = Math.atan2((y1 - y2), (x1 - x2));
            cosy = Math.cos(slopy);
            siny = Math.sin(slopy);
            return [
                'M', midPoint.x, ' ', midPoint.y,
                'L', (Number(midPoint.x) + Number(Par * cosy - (Par / 2.0 * siny)) * initZoom), ' ', Number(midPoint.y) + Number(Par * siny + (Par / 2.0 * cosy)) * initZoom,
                'M', Number(midPoint.x) + Number(Par * cosy + Par / 2.0 * siny) * initZoom, ' ', Number(midPoint.y) - Number(Par / 2.0 * cosy - Par * siny) * initZoom,
                'L', midPoint.x, ' ', midPoint.y,
                /*'T', xc, ' ', yc,
                'T', x2, ' ', y2*/
                //'L', x2, ' ', y2
                //' ', p[len].x, ' ',p[len].y
            ].join('');
        }
    }
}

function pathData(d, that, zoomK) {
    var data = that.data;
    var svg = that.svg;
    var focusedID = that.focusedID;
    var p = d.points;
    var method=that.method;
    d.type='L';
    var flow=d.flow;
    switch (d.type) {
        case 'L':{
            var x1,y1,x2,y2,r1,r2,dis;
            var xc,yc;
            var len=p.length;
            len = len-1;
            var k=zoomK||1;
            dis=distance(p[0].x,p[0].y,p[len].x,p[len].y);
           // r1 = d.sourceNode.nodeR/k;
            //r2 = d.targetNode.nodeR/k;
            r1 = d.sourceNode.nodeR/k;
            r2 = d.targetNode.nodeR/k;
            dis=0;
            x1=getstart(p[0].x,p[len].x,0,dis);
            y1=getstart(p[0].y,p[len].y,0,dis);
            x2=getend(p[len].x,p[0].x,0,dis,k);
            y2=getend(p[len].y,p[0].y,0,dis,k);
            //xc=(x1+x2)/2+(y1-y2)/6;
            var angle=that.edge_arc_angle;
            xc=(x1+x2)/2+(y1-y2)/angle;
            yc=(y1+y2)/2+(x2-x1)/angle;
            //yc=(y1+y2)/2+(x2-x1)/6;
            return [
                'M', x1, ' ', y1,
                'Q', xc, ' ', yc, ' ', x2, ' ', y2
                /*'T', xc, ' ', yc,
                'T', x2, ' ', y2*/
                //'L', x2, ' ', y2
                //' ', p[len].x, ' ',p[len].y
            ].join('');
        }
    }
}

function findBoxOfPoints(points) {
    var maxX = d3.max(points, function (d) {
        return d.x
    })
    var maxY = d3.max(points, function (d) {
        return d.y
    })
    var minX = d3.min(points, function (d) {
        return d.x
    })
    var minY = d3.min(points, function (d) {
        return d.y
    })
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    }
}

function newPathData(d) {
//    console.log(d);
    var p = d.points;
    var flow = d.flow;
    switch (d.type) {
        case 'Q': {

//            console.log(d);
            return [
                'M', p[0].x, ' ', p[0].y,
                'Q', p[1].x, ' ', p[1].y,
                ' ', p[2].x, ' ', p[2].y
            ].join('');

        }


    }
}

function getStrokeWidth(d) {
    var stroke_width;
    //var that= d.that;
    //var flowScale=that.flowScale;
    //var weightScale=that.weightScale;
    //var optionNumber=that.optionNumber;
    //if(optionNumber.edgeThicknessOption==1){
    //    stroke_width= flowScale(d.flow);
    //}
    //else if(optionNumber.edgeThicknessOption==0){
    //    var weightSum=0;
    //    for (var key in d.weight){
    //        weightSum+=d.weight[key];
    //    }
    //    stroke_width= weightScale(weightSum);
    //}
    stroke_width = d.flow * 3 + 1;
    return stroke_width * 0.5;
}

function drawTitle() {
    d3.selectAll('.title').remove();

    drawTitles.selectAll('text').data(['1']).enter()
        .append('text')
        .attrs({
            'x': '95px',
            'y': '50px'
        })
        .text(title);

//    console.log(title);
}

function findFocusedNode() {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].nodes) {
            for (var j = 0; j < nodes[i].nodes.length; j++) {
                if (nodes[i].nodes[j].focus == 'focused') {
                    nodes[i].focused = true;
                }
            }
        }
    }
}

function SizeScale(maxSize, that) {
    this.basicMin = 8;
    this.basicMax = 12;
    this.k = 0;
    var minMax = that.minMax;
    var dMax = that.dMax;
    var dMin = that.dMin;
//    if(requestMethod){
//        if(requestMethod=='local'){
    var max = d3.max([minMax, maxSize]);
    this.sizeScale = function (nodeSize) {
        var r = (dMax - dMin) * (Math.sqrt(nodeSize) / Math.sqrt(max)) + dMin;
        return r;
    };
//        }
//    }
//    else{
//        this.sizeScale=function(nodeSize) {
//            var max=d3.max([minMax,maxSize]);
//            var r=(dMax-dMin)*(Math.log10(nodeSize)/Math.log10(max))+dMin;
//            return r;
//        };
//    }

//    this.sizeScale=function(NodeSize){
//        this.k = 0;
//        while(NodeSize>Math.pow(10,this.k+1)){
//            this.k+=1;
//        }
//        var sizeScale;
//        if(this.k<3){
//            sizeScale=d3.scale.linear()
//                .domain([Math.pow(10,this.k),Math.pow(10,this.k+1)])
//                .range([1.5*Math.sqrt(Math.pow(10,this.k))+12,1.5*Math.sqrt(Math.pow(10,this.k+1))+12]);
//        }
//        else if(this.k>=3&&this.k<=5){
//            sizeScale=d3.scale.linear()
//                .domain([Math.pow(10,this.k),Math.pow(10,this.k+1)])
//                .range([this.basicMin+this.k*10,this.basicMax+this.k*10]);
//        }


//        return sizeScale(NodeSize);
//    }
}

function getSelfData(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].selfEdge) {
            var size = nodes[i].size;
            var r = sizeScale.sizeScale(size);
            var x = nodes[i].x;
            var y = nodes[i].y;
            var d = 2;
            var selfEdgeLabelX = x;
            var selfEdgeLabelY = y - (5 / 3 * r + d);
            nodes[i].selfPathStr = selfPathData(x, y, size);
            nodes[i].selfEdgeLabelX = selfEdgeLabelX;
            nodes[i].selfEdgeLabelY = selfEdgeLabelY;

        }
    }
}

function selfPathData(x, y, size) {
    var r = sizeScale.sizeScale(size);
    var d = 2;
    var pi = Math.PI;
    var degree = 25 / 360 * pi;
    var x1 = x - (r + d) * Math.sin(degree);
    var x2 = x + (r + d) * Math.sin(degree);
    var y1 = y - (r + d);
    var y2 = y - (r + d);
    var rx = r / 3;
    var ry = r / 3;
    return 'M' + x1 + ' ' + y1 + 'A' + rx + ' ' + ry + ' ' + 0 + ' ' + 1 + ' ' + 1 + ' ' + x2 + ' ' + y2;
}

function getSelfEdgeStrokeWidth(d) {
    var stroke_width;
    var that = d.that;
    var optionNumber = that.optionNumber;
    if (optionNumber.edgeThicknessOption == 1) {
        stroke_width = flowScale(d.selfEdge);
//        console.log(d.flow);
//        console.log(d);
    }
    else if (optionNumber.edgeThicknessOption == 0) {
        var weight = parseInt(d.selfEdge * d.size);
        stroke_width = weightScale(weight);
    }
    return stroke_width;
}

function reLayout(d) {
    function generateNodesDic(nodes) {
        var dic = {};
        for (var i = 0, len = nodes.length; i < len; i++) {
            var key = nodes[i].oldKey;
            var value = nodes[i];
            dic[key] = value;
        }
        return dic;
    }

    function generateTmpNodes(oldNodes, newNodes) {
        var oldNodesDic = generateNodesDic(oldNodes);
        var newNodesDic = generateNodesDic(newNodes);
        tmpNodes = [];
        for (var i = 0, len = newNodes.length; i < len; i++) {
            var tmp = {};
            for (var key in newNodes[i]) {
                tmp[key] = newNodes[i][key];
            }
            tmpNodes.push(tmp);
        }
        var t = 0;

        for (var key in newNodesDic) {
            if (!oldNodesDic[key]) {
                var fatherKey = newNodesDic[key].father;
                var father = oldNodesDic[fatherKey];
                tmpNodes[t].x = father.x;
                tmpNodes[t].y = father.y;
            }
            else {
                tmpNodes[t].x = oldNodesDic[key].x;
                tmpNodes[t].y = oldNodesDic[key].y;

            }
            t += 1;

        }
    }

    function generateTmpCurves(oldCurves, newCurves) {
        tmpCurves = [];
        for (var i = 0, len = newCurves.length; i < len; i++) {
            var tmp = {}
            for (var key in newCurves[i]) {
                tmp[key] = newCurves[i][key];
            }
            tmpCurves.push(tmp);
            var id = newCurves[i].id;
            var existFlag = false;
            for (var j = 0, len1 = oldCurves.length; j < len1; j++) {
                if (oldCurves[j].id == id) {
                    existFlag = true;
                    tmp.points = oldCurves[j].points;
                    tmp.opacity = 1;
                    newCurves[i].opacity = 1;
                    newCurves[i].delay = 0;
                    newCurves[i].duration = duration;
                    break;
                }

            }
            if (!existFlag) {
                tmp.opacity = 0;
                newCurves[i].opacity = 1;
                newCurves[i].delay = 3 / 4 * duration;
                newCurves[i].duration = 1 / 10 * duration;
            }

        }
    }

    for (var i = 0; i < document.getElementsByName('clusterButton').length; i++) {
        if (document.getElementsByName('clusterButton')[i].checked == true) {
            var doIncremental = '';
            var newNodes = json_nodes_list[i];
            var newEdges = json_edges_list[i];
            var oldNodes = nodes;
            var oldEdges = edges;
            var oldCurves = curves;
            getData(newNodes, newEdges);
            getRelation();
            coordinateOffset();
            getCurves();
//            drawAuthorInfo();
//                layout(optionNumber,true,doIncremental);
            //console.log(data);
            layout(optionNumber, false, false, data.postData[focusedID]);
            yearSlider();
            if (selectedInput > i) {
                doIncremental = 'decremental';
            }
            else {
                doIncremental = 'incremental';
//                generateTmpNodes(oldNodes,nodes);
//                generateTmpCurves(oldCurves,curves);
//                drawAuthorInfo();
//                layout(optionNumber,true,doIncremental);
//                layout(optionNumber,false,false);
            }
            selectedInput = i;
//            if(inputClicked[i]==0){

//        splitLabels(nodes,edges);

//                inputClicked[i]=1;
            break;

//            }
//            else{
//                initSetting();
//                getData(json_nodes_list[i],json_edges_list[i]);
//                getRelation();
//                getCurves();
//                draw();
//            }

            //            alert(document.getElementsByName('radiobutton')[i].value);
        }
    }
}

function setTransition(div, location, marginLeft, marginTop, isVertical) {//location should be the final place after transition
    var duration = 500;
    if (isVertical) {
        div.transition()
            .duration(duration)
            .styles({
                height: location + px,
                'margin-left': marginLeft + px,
                'margin-top': marginTop + px
            })
    }
    else {
        div.transition()
            .duration(duration)
            .styles({
                width: location + px,
                'margin-left': marginLeft + px,
                'margin-top': marginTop + px
            })
    }

}

function recoverScreen() {
    var duration = 500;
    var bodyDiv = d3.select('.bodyDiv');
    var hiddenDivList = {
        top: ['titleDiv', 'middleTopBarDiv'],
        bottom: ['authorDiv'],
        left: ['leftAndTransitionDiv'],
        right: ['rightDiv']
    };
    var hiddenElementList = ['div', 'text'];
    for (var key in hiddenDivList) {
        for (var i = 0; i < hiddenDivList[key].length; i++) {
            var thisDiv = bodyDiv.select('.' + hiddenDivList[key][i]);
            var originWidth = thisDiv.attr('oldWidth').split('px')[0];
            var originHeight = thisDiv.attr('oldHeight').split('px')[0];
            if (key == 'top') {
                setTransition(thisDiv, originHeight, 0, 0, true);
            }
            else if (key == 'bottom') {
                setTransition(thisDiv, originHeight, 0, 0, true);
            }
            else if (key = 'left') {
                setTransition(thisDiv, originWidth, 0, 0, false);
            }
            else if (key == 'right') {
                setTransition(thisDiv, originWidth, 0, 0, false);
            }
            for (var j = 0, len1 = hiddenElementList.length; j < len1; j++) {
                thisDiv.selectAll(hiddenElementList[j])

                    .styles({
                        display: 'block'
                    });
            }
        }

    }
    var middleDiv = d3.select('.middleDiv');

    middleDiv.transition()
        .duration(duration)
        .styles({
            width: middleDiv.attr('oldWidth'),
            height: middleDiv.attr('oldWidth')
        });
    var top = middleDiv.select('.topControlDiv');
    top.transition()
        .duration(duration).styles({
        width: top.attr('oldWidth')
    });
//
    var bottom = middleDiv.select('.bottomControlDiv');
    bottom.transition()
        .duration(duration).styles({
        width: bottom.attr('oldWidth')
    });
    var svgHeight = usefulHeight - parseFloat(top.style('height').split('px')[0]) - parseFloat(bottom.style('height').split('px')[0]);
    var graphDiv = middleDiv.select('.graphDiv');
    graphDiv.transition()
        .duration(duration)
        .styles({
            width: graphDiv.attr('oldWidth'),
            height: graphDiv.attr('oldHeight')
        });
    var middleSVG = middleDiv.select('svg');
    middleSVG.transition()
        .duration(duration)
        .attrs({
            width: svg.attr('oldWidth'),
            height: svg.attr('oldHeight')
        })
        .each('end', function () {
            size = {
                width: svg.attr('oldWidth') * 0.85,
                height: svg.attr('oldHeight') * 0.7
            };
            coordinateOffset(data.postData[focusedID]);
            getCurves(data.postData[focusedID]);
            //console.log(data);
            layout(optionNumber, true, 'flowMap', data.postData[focusedID]);
        });

}

function getLength(divClass, type) {
    return parseFloat(d3.select('.' + divClass).style(type).split('px')[0]);
}

function fullScreen() {
    var duration = 500
    changeDivList = ['titleDiv', 'middleTopBarDiv', 'authorDiv', 'leftAndTransitionDiv', 'rightDiv', 'middleDiv', 'topControlDiv', 'bottomControlDiv', 'graphDiv'];

    function storeOldDivData(div) {
        div.attr('oldWidth', div.style('width'));
        div.attr('oldHeight', div.style('height'));
    }

    for (var i = 0, len = changeDivList.length; i < len; i++) {
        storeOldDivData(d3.select('.' + changeDivList[i]));
    }
    svg.attr('oldWidth', svg.attr('width'));
    svg.attr('oldHeight', svg.attr('height'));

//    layout(optionNumber);
    var bodyDiv = d3.select('.bodyDiv');
    var hiddenDivList = {
        top: ['titleDiv', 'middleTopBarDiv'],
        bottom: ['authorDiv'],
        left: ['leftAndTransitionDiv'],
        right: ['rightDiv']
    };
    var hiddenElementList = ['div', 'text'];


    var topHeight = getLength('titleDiv', 'height') + getLength('middleTopBarDiv', 'height');
    var bottomHeight = getLength('authorDiv', 'height');
    var leftWidth = getLength('leftAndTransitionDiv', 'width');
    var rightWidth = getLength('rightDiv', 'width');

    for (var key in hiddenDivList) {
        for (var i = 0; i < hiddenDivList[key].length; i++) {
            var thisDiv = bodyDiv.select('.' + hiddenDivList[key][i]);
            if (key == 'top') {
                setTransition(thisDiv, 0, 0, 0, true);
            }
            else if (key == 'bottom') {
                setTransition(thisDiv, 0, leftWidth, topHeight + bottomHeight, true);
            }
            else if (key = 'left') {
                setTransition(thisDiv, 0, 0, 0, false);
            }
            else if (key == 'right') {
                setTransition(thisDiv, 0, leftWidth + rightWidth, 0, false);
            }
            for (var j = 0, len1 = hiddenElementList.length; j < len1; j++) {
                thisDiv.selectAll(hiddenElementList[j])

                    .styles({
                        display: 'none'
                    });
            }
        }


    }
    var middleDiv = d3.select('.middleDiv');

    middleDiv.transition()
        .duration(duration)
        .styles({
            width: usefulWidth + px,
            height: usefulHeight + px
        });
    var top = middleDiv.select('.topControlDiv');
    top.transition()
        .duration(duration).styles({
        width: usefulWidth + px
    });
//
    var bottom = middleDiv.select('.bottomControlDiv');
    bottom.transition()
        .duration(duration).styles({
        width: usefulWidth + px
    });
    var svgHeight = usefulHeight - parseFloat(top.style('height').split('px')[0]) - parseFloat(bottom.style('height').split('px')[0]);
    middleDiv.select('.graphDiv')
        .transition()
        .duration(duration)
        .styles({
            width: usefulWidth + px,
            height: svgHeight + px
        });
    var middleSVG = middleDiv.select('svg');
    middleSVG.transition()
        .duration(duration)
        .attrs({
            width: usefulWidth,
            height: svgHeight
        })
        .each('end', function () {
            size = {
                width: usefulWidth * 0.85,
                height: svgHeight * 0.7
            };
            coordinateOffset(data.postData[focusedID]);
            getCurves(data.postData[focusedID]);
            //console.log(data);
            layout(optionNumber, true, 'flowMap', data.postData[focusedID]);
        });

}

function hsl(h, s, l) {
    //h=1 blue h=0 yellow
    //h=1 s 1->0  h=0 s 0->1
    //l 0.5-1
    var colors = [204, 204];
    //var colors=204;
    var sRange = [1, 0];
    var lRange = [0.9, 0.5];
    var sScale = d3.scaleLinear()
        .domain([0, 1])
        .range(sRange);
    var lScale = d3.scaleLinear()
        .domain([0, 1])
        .range(lRange);
    var value = 'hsl(' + colors[h] + ',' + (sScale(s) * 100) + '%,' + (lScale(l) * 100) + '%)';
    return value
}

export {
    preLayout,
    axisLayout,
    getMulEdgeSourceTargetDic,
    layout,
    greyBackground,
    removeSVGElements,
    getstart,
    getend,
    pathData,
    arrowData,
    findBoxOfPoints,
    getStrokeWidth,
    SizeScale,
    getSelfData,
    selfPathData,
    getSelfEdgeStrokeWidth,
    reLayout,
    setTransition,
    recoverScreen,
    getLength,
    fullScreen,
    hsl,
    drawProtoLegend,
    excalibur
};

