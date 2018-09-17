function Temporal(data){
    this.temporalDic=data;
    this.temporalList=[];
    this.division={};
    this.init=function(){
        for(var year in this.temporalDic){
            var tmp={
                year:year,
                flow:this.temporalDic[year]
            };
            this.temporalList.push(tmp)
        }
        this.division[1]=[this.temporalList]
    };
    this.divideYear=function(num){
        if(this.division[num]){
            return this.division[num];
        }
        else{
            var preDivision=this.divideYear(num-1);
            var newDivision=this.cut(preDivision);
            this.division[num]=newDivision;
            return newDivision;
        }
    };
    this.cut=function(divsion){
        var newDivisionList=[];
        for(var i=0;i<divsion.length;i++){
            var currentPart=divsion[i];
            var otherParts=[];
            for(var j=0;j<divsion.length;j++){
                if(j!=i)otherParts.push(divsion[j]);
            }
            var len=currentPart.length;
            if(len>=4){
                for(var j=2;j<len-1;j++){
                    var part1=[];
                    var part2=[];
                    for(var k=0;k<j;k++){
                        part1.push(currentPart[k]);
                    }
                    for(var k=j;k<len;k++){
                        part2.push(currentPart[k]);
                    }
                    part1 = this.denseFlow(part1);
                    part2 = this.denseFlow(part2);
                    if(part1.length>1&&part2.length>1){
                        var newDivision=[];
                        newDivision.push(part1);
                        newDivision.push(part2);
                        for(var k=0;k<otherParts.length;k++){
                            newDivision.push(otherParts[k]);
                        }
                        newDivisionList.push(newDivision)
                    }
                }
            }
        }
        var maxFlow=0;
        var maxDivision;
        if(newDivisionList.length>0){
            for(var i=0;i<newDivisionList.length;i++){
                var division=newDivisionList[i];
                var divisionFlow=this.countDivisionFlow(division);
                if(divisionFlow>maxFlow){
                    maxDivision=division;
                    maxFlow=divisionFlow;
                }
            }
            return division;
        }
        else{
            return [];
        }

    };
    this.sortDivision=function(division){
        division.sort(function(a,b){return d3.ascending(a[0].year, b[0].year)});
    };
    this.countDivisionFlow=function(division){
        var sum=0;
        for(var i=0;i<division.length;i++){
            var part=division[i];
            var partFlow=this.countPartFlow(part);
            sum+=partFlow;
        }
        division.smoothFlowCount=sum;
        return sum;
    };
    this.countPartFlow=function(part){
        var sum=0;
        for(var i=0;i<part.length;i++){
            sum+=part[i].flow;
        }
        sum = this.smoothFlow(sum, part.length);
        return sum;
    };
    this.denseFlow=function(part){
        while(part[0]&&part[0].flow==0){
            part = part.slice(1,part.length);
        }
        while(part[part.length-1]&&part[part.length-1].flow==0){
            part = part.slice(0,part.length-1);
        }
        return part;
    };
    this.smoothFlow=function(flow,duration){
        var k=0.5;
        return flow/Math.pow(duration,k)
    };
    this.selectMaxDivision=function(){
        var max=0;
        var maxDivision;
        for(var key in this.division){
            if(key!=1){
                if(this.division[key].smoothFlowCount){
                    if(this.division[key].smoothFlowCount>max){
                        max = this.division[key].smoothFlowCount;
                        maxDivision=this.division[key];
                    }
                }
            }
        }
        this.maxDivision=maxDivision;
    }
}
function temporalSummarization(d){
    var temporalData=this.getTemporalData(d);
    this.temporal=new Temporal(temporalData);
    this.temporal.init();
    this.temporal.divideYear(12);
    this.temporal.selectMaxDivision();
}
function getTemporalData(d){
    var edges=d.edge;
    var temporal={};
    for(var year=this.minTime[timeMeasure];year<=this.maxTime[timeMeasure];year++){
        temporal[year]=0;
    }
    var edgeSumFlow=0
    var temporFlow=0;
    for(var i=0;i<edges.length;i++){

        var edge=edges[i];
        var flow=edge.flow;
        edgeSumFlow+=flow;
        var weight=edge.weight;
        var totalCitation=edge.citation;
        for(var year in weight){
            var subFlow=(weight[year]/totalCitation)*flow;
            temporal[year.toInt()]+=subFlow;
        }
    }
    for(var year in temporal){
        temporFlow+=temporal[year];
    }
//    console.log(temporFlow,edgeSumFlow);
//    console.log(temporal);
    return temporal
}
export{
    Temporal,
    temporalSummarization,
    getTemporalData
}