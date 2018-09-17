import{clone,getTime,getTimeString,getTimeStringWithoutYear} from '../processData/processData';
function drawIcons(optionNumber,doTransition,transitionType,d){
    var sizeScale=this.sizeScale;
    var color=this.color;
    var focusedNodeData;
    var that=this;
    var nodes= d.node;
    var edges= d.edge;
    var focusedID=this.focusedID;
    var drag=this.drag;
    var timeMeasure=this.timeMeasure;

    var data=this.data;
    var drawnodes=this.drawnodes;
    //var duration=this.duration;
    //var preYearNode=this.preYearNode;
    var nodeClick=this.nodeClick;
    var mouseover=this.mouseover;
    var mouseout=this.mouseout;
    var nodeIconSize=this.nodeIconSize;
    //var screenPreNodes=data.screenPreviousData[focusedID].node;
    var g=drawnodes.append('g').datum({index:2}).attr('id','outerLayer').attr('class','iconLayer');
    g.selectAll('whatever')
        .data(nodes)
        .enter()
        .append('image')
        .call(drag)
        .on('click',function(d){return nodeClick(d,that);})
        .on('mouseover',function(d){return mouseover(d,that);})
        .on('mouseout',function(d){return mouseout(d,that);})
        .each(function(d){
            d.that=that;
            d.nodeIconSize=nodeIconSize;
        })
        .styles({
            cursor:'hand'
        })
        .each(function(d){
            var img=d3.select(this);
           // (d.dataType=='movement')?d.delta=nodeIconSize-1: d.delta=nodeIconSize-3;
            (d.dataType=='movement')?d.delta=nodeIconSize: d.delta=nodeIconSize;
            //(d.dataType=='movement')?d.url='/images/person1.png': d.url='/images/camera2.png';
            if (d.dataType=='movement'){
                d.url='/images/person1.png';
            }
            else if(d.dataType == 'measurement'){
                d.url='/images/camera2.png';
            }
            else if(d.dataType == 'traffic'){
                console.log('dataType '+d.dataType);
                d.url='/images/server.png';
            }
            img.attrs({
                type:'image',
                class:'node',
                x: function(d){d.iconX=d.x-d.delta;return d.iconX;},
                y: function(d){d.iconY=d.y-d.delta;return d.iconY;},
                //cluster: d.oldKey,
                width:function(d){d.iconWidth=d.delta*2;return d.iconWidth+px},
                height:function(d){d.iconHeight=d.delta*2;return d.iconHeight+px},
                'xlink:href': d.url
            });
            d.icon=img;
        });

    //var timeFilterSecond=that.timeFilterSecond||[0,0];
    //var rScale=d3.scaleLinear()
    //    .domain([0,that.topTimeLength||0])
    //    .range([5,30]);
}
export{drawIcons}
