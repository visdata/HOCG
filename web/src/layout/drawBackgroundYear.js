function drawBackgroundYear(transition){
//    var initX=300;
//    var initY=250;
    var dataSourceVisibility=this.dataSourceVisibility;
    var focusedID=this.focusedID;
    var time_g=this.time_g;
    var timeFilter=this.timeFilter;
    var animateMode=this.animateMode;
    var flipBook=this.flipBook;
    var movie=this.movie;
    var timeMeasure=this.timeMeasure;
    var minTime=this.minTime[timeMeasure];
    var maxTime=this.maxTime[timeMeasure];
    var initX=30;
    var initY=30;
    var family='Arial';
    var size='30';
    var weight='bold';
    var color='grey';
    var textValue;
    if(focusedID.split('_')[0]=='twitter'){
        var july='July';
        var julyLen=july.visualLength(family,size);
        time_g.append('text')
            .attrs({
                class:'july',
                x:initX,
                y:initY
            })
            .styles({
                'font-size':size,
                'font-family': family,
                'font-weight':weight,
                'fill':color
            })
            .html(july)
        initX+=julyLen+20;

//        textValue=['July'+timeFilter[0]+' ',' - ',' July'+timeFilter[1]];
    }
//    else{
        textValue=[String(timeFilter[0]),' - ',String(timeFilter[1])];
//    }
    var textData=[
        {
            type:'leftYear',
            value:textValue[0],
            x:initX,
            y:initY,
            size:size,
            family:family,
            weight:weight,
            color:color
        },
        {
            type:'middleText',
            value:textValue[1],
            x:initX+textValue[0].visualLength(family,size),
            y:initY,
            size:size,
            family:family,
            weight:weight,
            color:color
        },
        {
            type:'rightYear',
            value:textValue[2],
            x:initX+textValue[0].visualLength(family,size)+textValue[1].visualLength(family,size),
            y:initY,
            size:size,
            family:family,
            weight:weight,
            color:color
        }
    ];
    var yearLength='2000-2000'.visualLength(family,size);
    var yearHeight='2000-2000'.visualHeight(family,size);
    var sourceText=this.sourceTextDic[this.source];
    var sourceLength=sourceText.visualLength(family,size);
    var sourceX=initX+yearLength/2-sourceLength/2;
    var sourceY=initY+yearHeight+5;

    if(transition){
        if(animateMode==flipBook){
            time_g.select('.rightYear')
                .html(function(d){

                    if(timeFilter[1]==maxTime&&timeFilter[0]==minTime){
                        d.value=String(minTime);
                    }
                    else{
                        d.value=String(timeFilter[0]);
                    }
                    return d.value;
                })
                .transition()
                .ease('linear')
                .delay(1000)
                .duration(function(d){
                    if(timeFilter[1]==maxTime&&timeFilter[0]==minTime){
                        return 2000*(maxTime- minTime)
                    }
                    else{
                        return 2000*(maxTime- timeFilter[0])
                    }

                })
                .tween("text", function() {
                    if(timeFilter[1]==maxTime&&timeFilter[0]==minTime){
                        var i = d3.interpolateRound(minTime, maxTime);
                        return function(t) {
                            this.textContent = i(t);
                        };
                    }
                    else{
                        var i = d3.interpolateRound(timeFilter[0], maxTime);
                        return function(t) {
                            this.textContent = i(t);
                        };
                    }
                })
        }
        else{

        }
    }
    else{
        time_g.selectAll('*')
            .each(function(d){
                if(d3.select(this).attr('class')!='july'){
                    d3.select(this).remove()
                }
            });
        time_g.append('text')
            .styles({
                'font-family':family,
                'font-size':size,
                'font-weight':weight,
                fill:color,
                visibility:dataSourceVisibility
            })
            .attrs({
                class:'dataSource',
                x:sourceX,
                y:sourceY
            })
            .html(sourceText);
        time_g.selectAll('whatever')
            .data(textData)
            .enter()
            .append('text')
            .each(function(d){
                d3.select(this)
                    .attrs({
                        class:d.type,
                        x:d.x,
                        y:d.y
                    })
                    .styles({
                        'font-size':d.size,
                        'font-family': d.family,
                        'font-weight':d.weight,
                        'fill':d.color
                    })
                    .html(d.value)
            })

    }

}

export {drawBackgroundYear};