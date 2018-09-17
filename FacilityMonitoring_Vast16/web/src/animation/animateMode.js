import{clone} from '../processData/processData';
function changeAnimateMode(){
    var animateMode=this.animateMode;
    var flipBook=this.flipBook;
    var movie=this.movie;
    //console.log(this);
    if(animateMode == flipBook) {
        this.changeToMovieMode();

    }
    else if(animateMode==movie){
        this.changeToFlipBookMode();
    }
}
function changeToMovieMode(){
    this.animateMode = this.movie;
    var timeMeasure=this.timeMeasure;
    var that=this;
    var timeFilter=this.timeFilter;
    var minTime=this.minTime[timeMeasure];
    var maxTime=this.maxTime[timeMeasure];
    var axisSVG=this.axisSVG;
    var xScale=this.xScale;
    var yScale=this.yScale;
    var color=this.color;
    var yearSliderDrag=this.yearSliderDrag;
    d3.select('.movieModeDiv')
        .style('background',color.buttonStyle.on.div);
    d3.select('.movieModeText')
        .style('color',color.buttonStyle.on.text);
    d3.select('.flipBookModeDiv')
        .style('background',color.buttonStyle.off.div);
    d3.select('.flipBookModeText')
        .style('color',color.buttonStyle.off.text);
    if(timeFilter){
        if(timeFilter[0]==minTime&&timeFilter[1]==maxTime){
            var defaultYearDuration=3;
            var rYear=defaultYearDuration+minTime;
            axisSVG.select('#rightAxisCircle')
                .attrs({
                    cx:function(d){d.x = xScale(rYear);return d.x;}
                });
            timeFilter[1]=rYear;
        }
        var left = axisSVG.select('#leftAxisCircle');
        var right = axisSVG.select('#rightAxisCircle');
        var leftX = parseFloat(left.attr('cx'));
        var rightX = parseFloat(right.attr('cx'));
        var y = parseFloat(left.attr('cy'));
        var movieSliderData=[{
            p1:{
                x:leftX,
                y:y
            },
            p2:{
                x:rightX,
                y:y
            },
            index:1
        }];

        axisSVG.selectAll('whatever')
            .data(movieSliderData)
            .enter()
            .append('path')
            .attr('class','movieSlider axisController')
            .attr('index',1)
            .attr('id','movieSlider')
            .styles({
                'stroke-width':4,
                'stroke':'white'
            })
            .attr('d',function(d){
                var e={};
                clone(d, e);
                var avg=(d.p1.x+d.p2.x)/2;
                e.p1.x = avg;
                e.p2.x = avg;
                return yearSliderPathData(e);
            })
            .transition()
            .duration(100)
            .attr('d', yearSliderPathData)
            .styles({
                'stroke-width':4,
                'stroke':'white',
                'cursor':'hand'
            })
            .each('end',function(){
                var ids=['leftAxisCircle','rightAxisCircle'];
                //axisSVG.selectAll('whatever')
                //    .data(ids)
                //    .enter()
                //    .append('use')
                //    .attr('xlink:href',function(d){
                //        return '#'+d;
                //    });
                axisSVG.select('#leftAxisCircle')
                    .attr('class','axisCircle axisController')
                    .style('filter','url(#moveToLeft_filter)')
                    .style('visibility','visible');
                axisSVG.select('#rightAxisCircle')
                    .attr('class','axisCircle axisController')
                    .style('filter','url(#moveToRight_filter)');
                axisSVG.selectAll('.axisController').sort(function(a,b){
                    return d3.descending(a.index,b.index);
                });
            });
        axisSVG.select('.movieSlider')
            .on('mouseover',function(d){
                d3.select(this)
                    .transition()
                    .duration(100)
                    .style('stroke-width',8)
            })
            .on('mouseout',function(d){
                d3.select(this)
                    .transition()
                    .duration(100)
                    .style('stroke-width',4)
            })
            .each(function(d){
                d.that=that;
            })
            .call(yearSliderDrag);
        this.greyBackground();
        updateAnimation(false, that);
    }



}

function changeToFlipBookMode(){
    var drawnodes=this.drawnodes;
    var drawedges=this.drawedges;
    var data=this.data;
    var focusedID=this.focusedID;
    var axisSVG=this.axisSVG;
    var color=this.color;
    this.animateMode=this.flipBook;
    drawnodes.selectAll('*').remove();
    drawedges.selectAll('*').remove();
    this.preLayout(data.postData[focusedID]);
    d3.select('.movieModeDiv')
        .style('background',color.buttonStyle.off.div);
    d3.select('.movieModeText')
        .style('color',color.buttonStyle.off.text);
    d3.select('.flipBookModeDiv')
        .style('background',color.buttonStyle.on.div);
    d3.select('.flipBookModeText')
        .style('color',color.buttonStyle.on.text);
    axisSVG.select('.movieSlider').remove();
    axisSVG.selectAll('.axisCircle')
        .style('filter','url(#leftOrRight_filter)');
}

export {
    changeAnimateMode,
    changeToMovieMode,
    changeToFlipBookMode,
}