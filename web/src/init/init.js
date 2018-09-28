import {initColor} from './initColor';
import {search} from '../processData/request';
import {drawAnimateControlPanel,updateAnimation,removeEdges,removeAnimation} from '../animation/animationControl';
import{layout,preLayout,axisLayout,removeSVGElements,pathData,arcPathData,arrowData,getStrokeWidth,greyBackground} from '../layout/graphLayout';
import{filterDataByYear,processData,dataPreProcess,calculateEdgeCitation,getTimeData,coordinateOffset,setInitNodeTransition,setInitEdgeTransition,getRelation,setNodeTransition,getTime} from '../processData/processData';
//import{requestData} from '../processData/request';
import{updateData,linkPruning} from '../processData/linkPruning'
import{reCalculateLayout} from '../processData/calculateLayout'
import{calculateFlowMap} from '../processData/calculateFlowMap';
import{temporalSummarization,getTemporalData} from '../processData/temporalSummarization';
import{drawYearAxis,yearAxisTransition,drawClickYearAxis,addNodeAxis,ButtonController,TabController} from '../layout/drawYearAxis';
import{drawBackgroundYear} from '../layout/drawBackgroundYear';
import{drawEdges,drawEdgeLabel,drawSelfEdgeLabel,drawSelfEdge,getYearEdgeRelation} from '../layout/drawEdges';
import{drawNodes} from '../layout/drawNodes';
import{drawLabels} from '../layout/drawLabels';
import{drawSize} from '../layout/drawSize';
import{drawLegends} from '../layout/drawLegends';
import{drawIcons} from '../layout/drawNodeIcons'
import{nodeClick,recoveryPath,highlightPath,mouseover,mouseout} from '../layout/clickFunction';
import{clusterSummary,nodeList,requestTitleList,nodeValue} from '../event/infoDivEvents';
import{changeAnimateMode,changeToFlipBookMode,changeToMovieMode} from '../animation/animateMode';
import{reLayoutFlowMap} from '../layout/relayout'
import{SizeScale,graphZoom,excalibur,drawProtoLegend} from '../layout/graphLayout';
import{reverseXY} from '../event/reverse';
import{rightPanelLayout} from '../scatter/scatterGraph';
function initFrameIndex(index){
    var that=this;
    var gData=[
        {
            class:'outer edgeG',
            id:index,
            index:index
        },
        {
            class:'outer nodeG',
            id:index,
            index:index
        }
    ];
    var newG=that.svg_g.selectAll('whatever')
        .data(gData)
        .enter()
        .append('g')
        .attrs({
            class:function(d){return d.class},
            index:function(d){return d.index},
            id:function(d){return d.class.split(' ')[1]+ d.id}
        });
    that.drawedges=that.svg_g.select('#edgeG'+index);
    that.drawnodes=that.svg_g.select('#nodeG'+index);
}
function layer(){
    this.data={sourceData:{},postData:{},timeData:{}};
    this.preFocusedID='';
    this.focusedID='';
    this.maxTime={
        'day':0,
        'hour':0,
        'minute':0
    };
    this.minTime={
        'day':10000000,
        'hour':10000000,
        'minute':10000000
    };
    this.subAxisOrder=0;
    this.graphData={};
    this.selectedCluster=5;
    this.tmpNodes={};
    this.tmpCurves={};
    this.requestMethod='ajax';
    //this.SizeScale=SizeScale();
    this.edgeLabelElem=[];
    this.pathElem=[];
    this.textElem=[];
    this.idElem=[];
    this.selfEdgeElem=[];
    this.selfEdgeLabelElem=[];
    this.animateMode='flipBook';
    this.yearDelay=2000;

    this.clusterCount=initCluster;
    this.edgeDuration=1000;
    this.selectedInput=0;
    this.selectedReverse=0;
    this.inputClicked=[1,0,0,0];
    this.transitionFlag=false;
    this.Node={
        newnode: function(){
            var node = {};
            node.id=null;
            node.x=null;
            node.y=null;
//            node.circle = null;
            node.size =null;
            node.lable=null;
            node.lablecreated=false;
//            node.summary='';
            return node
        }
    };
    this.Edge={
        newedge: function(){
            var edge={};
            edge.id=null;
            edge.source=null;
            edge.target=null
            edge.assists=[];
            return edge
        }
    };
    this.relationship={
        newrelation: function(){
            var relation={};
            relation.nodeid=null;
            relation.edges=[];
            return relation
        }
    };
    this.sourceTextDic={
        'aminerV8':'AMiner',
        'citeseerx':'CiteseerX'
    };
    this.nodes=[];
    this.duration=5000;
    this.edges=[];
    this.edgeid=0;
    this.relation=[];
    this.handleRadius = 8;
    this.curves =[];
    this.directionFlag=true;
    this.method='recoveryWeight';
    this.requestMethod='ajax';
    this.ifDrag=false;
    this.ifInitLayout=true;
    this.ifTemporal=false;
    this.drawAnimateControlPanel=drawAnimateControlPanel;
    this.layout=layout;
    this.preLayout=preLayout;
    this.filterDataByYear=filterDataByYear;
    this.axisLayout=axisLayout;
    this.drawYearAxis=drawYearAxis;
    this.processData=processData;
    this.dataPreProcess=dataPreProcess;
    this.calculateEdgeCitation=calculateEdgeCitation;
    this.linkPruning=linkPruning;
    this.updateData=updateData;
    this.reCalculateLayout=reCalculateLayout;
    this.getTimeData=getTimeData;
    this.getTime=getTime;
    this.coordinateOffset=coordinateOffset;
    this.calculateFlowMap=calculateFlowMap;
    this.temporalSummarization=temporalSummarization;
    this.reverseXY=reverseXY;
    this.getTemporalData=getTemporalData;
    this.setInitNodeTransition=setInitNodeTransition;
    this.setInitEdgeTransition=setInitEdgeTransition;
    this.getRelation=getRelation;
    this.removeSVGElements=removeSVGElements;
    this.drawBackgroundYear=drawBackgroundYear;
    this.drawEdges=drawEdges;
    this.drawLabels=drawLabels;
    this.drawNodes=drawNodes;
    this.drawIcons=drawIcons;
    this.drawSize=drawSize;
    this.drawLegends=drawLegends;
    this.drawEdgeLabel=drawEdgeLabel;
    this.drawSelfEdgeLabel=drawSelfEdgeLabel;
    this.drawSelfEdge=drawSelfEdge;
    this.pathData=pathData;
    this.arrowData=arrowData;
    this.nodeClick=nodeClick;
    this.recoveryPath=recoveryPath;
    this.highlightPath=highlightPath;
    this.mouseover=mouseover;
    this.mouseout=mouseout;
    this.clusterSummary=clusterSummary;
    this.nodeList=nodeList;
    this.setNodeTransition=setNodeTransition;
    this.getYearEdgeRelation=getYearEdgeRelation;
    this.getStrokeWidth=getStrokeWidth;
    this.requestTitleList=requestTitleList;
    this.updateAnimation=updateAnimation;
    this.cloneIngoreList=cloneIngoreList;
    this.yearAxisTransition=yearAxisTransition;
    this.changeAnimateMode=changeAnimateMode;
    this.changeToMovieMode=changeToMovieMode;
    this.changeToFlipBookMode=changeToFlipBookMode;
    this.greyBackground=greyBackground;
    this.removeEdges=removeEdges;
    this.removeAnimation=removeAnimation;
    this.reLayoutFlowMap=reLayoutFlowMap;
    this.dataSourceVisibility='hidden';
    this.initFrameIndex=initFrameIndex;
    this.nodeList=nodeList;
    this.nodeValue=nodeValue;
    this.drawClickYearAxis=drawClickYearAxis;
    this.addNodeAxis=addNodeAxis;
    this.rightPanelLayout=rightPanelLayout;
    this.excalibur=excalibur;
    this.drawProtoLegend=drawProtoLegend;

    this.tabID=0;
    this.tabs={};

    this.buttonID=0;
    this.tabID=0;
    this.timeMeasure='minute';
    this.cloneIngoreList=['parent','parents','child','children','parentNode','that'];
    this.dMin=8;
    this.dMax=30;
    this.minMax=30;
    this.db1='anomaly';
    this.db2='citeseerx';
//sizeScale=new SizeScale();
    this.SizeScale=SizeScale;
    this.initCluster='20';
    this.flipBook='flipBook';
    this.movie = 'movie';
    this.method='recoveryWeight';
    this.clusterCount='20';
    this.colorStyle='dark';
    this.currentLayer=leftLayer;
    this.dataID={};
    this.tfidfStatus='block';
    this.freqStatus='none';
    //this.tStart='2:1:0:0';
    //this.tStart='17:1:0:0';
    //this.tStart='18:1:0:0';
    this.tStart='1:1:0:0';
    //this.tEnd='2:23:59:59';
    //this.tEnd='17:23:59:59';
    //this.tEnd='18:23:59:59';
    this.tEnd='1:23:59:59';
    this.timeFilter=[60,1439];
    this.anomalyScore=0.5;
    this.mThres=40;
    this.hThres=40;
    this.fullGraph='1';
    this.filter={};
    this.optionNumber={
        "nodeLabelOption":0,
        "edgeLabelOption":0,
        "edgeThicknessOption":0,
        "style":'dark',
        "clusterNum":20,
        "edgeFilter":0
    };
    //this.server='118.190.210.193';
    //this.server='192.168.4.17';
    //this.server='ngrok.flyroom.info';
    this.server='127.0.0.1';
    //this.port='5006';
    this.port='5020';
    this.scatterPort='5008';
    this.detailTimePort='5015';
    this.colorRingMethod=0.5;
    this.minNodeSize=5;
    this.maxNodeSize=30;
    this.nodeIconSize=10;
    this.radiusDelta=20;
}

var sourceCheckedStatus={
    left:true,
    right:false
};
var px='px';
var timeMeasure='minute';
var cloneIngoreList=['parent','parents','child','children','parentNode','that'];
var dMin=8;
var dMax=30;
var minMax=30;
var db1='anomaly';
var db2='citeseerx';
//sizeScale=new SizeScale();
var initCluster='20';
var leftLayer=new layer();
var rightLayer=new layer();

leftLayer.source=db1;
leftLayer.position='left';
leftLayer.ifLayout=true;
leftLayer.thatLayer=rightLayer;

rightLayer.source=db2;
rightLayer.position = 'right';
rightLayer.ifLayer=false;
rightLayer.thatLayer=leftLayer;

var flipBook='flipBook';
var movie = 'movie';
var method='recoveryWeight';
var clusterCount='20';
var colorStyle='dark';
var currentLayer=leftLayer;
var dataID={};
var tfidfStatus='block';
var freqStatus='none';
//var tStart='17:0:0:0';
//var tStart='18:0:0:0';
//var tStart='2:0:0:0';
var tStart='1:0:0:0';
//var tEnd='17:23:59:59';
//var tEnd='18:23:59:59';
//var tEnd='2:23:59:59';
var tEnd='1:23:59:59';
var anomalyScore=0;
var mThres=40;
var hThres=40;
var corrScore={
    mm:0.5,
    mh:0.5,
    hh:0.5
};
var nodeType={
    m:1,
    h:1
};
var fuseType='origin';
//var corrScore=0.5;
var fullGraph='1';
var filter={};
var SDCloud='211.147.15.14';
var server40='192.168.1.40';
var localServer='127.0.0.1';
var server42='192.168.1.42';
//var ali='118.190.210.193';
//var ali='192.168.4.17';
var ali='127.0.0.1';
//var ali='ngrok.flyroom.info';
//var ali='192.168.4.17';
var server=ali;
var port='5020';
//var port='5006';
filter.timeStart=tStart;
filter.timeEnd=tEnd;

// 9 color schema
// red 359,79.5%,49.8%
// blue 207,54%,46.9%
// green 118,40.6%,48.8%
// purple 292,35.3%,47.3%
// orange 30,100%,50%
// yellow 60,100%,60%
// brown 22,61.2%,40.4%
// pink 328,88.1%,73.7%
// grey 0,0,60%

var color_map = {'VAV REHEAT Damper Position':[[359,79,0],4], 'REHEAT COIL Power':[[118,40,0],3], 'Thermostat Cooling Setpoint':[[292,35,0],1], 'Thermostat Temp':[[30,100,0],2], 'Thermostat Heating Setpoint':[[60,100,0],0],'Human':[[204,54,0],5]};
leftLayer.color_map = color_map;
leftLayer.always_show_nodelabel=true;
leftLayer.node_arc_padding=false;
leftLayer.edge_arc_angle=25;

leftLayer.wedge_falling = true;
leftLayer.edge_show = true;

leftLayer.draw_standalone_nodes=false;

var upper_axis_time_measure= 'hour'
leftLayer.upper_axis_time_measure = upper_axis_time_measure;

console.log(filter)
console.log("filter init timeStart "+tStart);
filter.fullGraph=fullGraph;
filter.mThres=mThres;
filter.hThres=hThres;
filter.corrScore={mm:0.5,mh:0.5,hh:0.5};
filter.anomalyScore=anomalyScore;
filter.fuseType=fuseType;
filter.nodeType=nodeType;
filter.propagate=0;
filter.draw_standalone_nodes=0;
leftLayer.layout_engine='neato';
leftLayer.corrScore=corrScore;
leftLayer.corrScoreCheck={
    mm:1,
    mh:1,
    hh:1
};
leftLayer.filter=filter;
//console.log("leftLayer filter: ")
//console.log(filter)
rightLayer.filter=filter;
//console.log("rightLayer filter: ")
//console.log(filter)
var sources=[];

sources.forEach(function(item,i){
    if(item){
        dataID[item]=getUrlParam(item)
    }

});
var width=document.documentElement.clientWidth;
var height=document.documentElement.clientHeight;
d3.select('body')
    .styles({
        height:height+'px',
        width:width+'px'
    });
var color=initColor('dark');
leftLayer.color=color;
var optionDiv=d3.select('.optionDiv');
var optionData=[
    //{index:3,text:'Label : ',class:'nodeLabel',values:['TF-IDF keywords','Frequent keywords','venue']},
    {
        index:1,text:'Movement Filter : ',title:'Movement Anomaly Score Threshold',class:'mFilter',values:[0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,1.1].map(function(d){if(d==1.1)return "None";else return String(d);}),init:'0.4',
        input:{checked:true,position:'left',key:'m',father:'nodeType'}
    },
    {
        index:2,text:'HVAC Filter : ',title:'HAVC Anomaly Score Threshold',class:'hFilter',values:[0.4,0.5,0.6,0.7,0.8,1.1].map(function(d){if(d==1.1)return "None";else return String(d);}),init:'0.4',
        input:{checked:true,position:'left',key:'h',father:'nodeType'}
    },
    {
        index:3,text:'Move-Move Filter : ', title:'Movement-Movement Correlation Threshold',class:'mmFilter',values:[0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1,1.1].map(function(d){if(d==1.1)return "None";else return String(d);}),init:'0.5',
        input:{checked:true,position:'left',key:'mm',father:'corrScore'}
    },
    {
        index:4,text:'Move-HVAC Filter : ', title:'Movement-HAVC Correlation Threshold',class:'mhFilter',values:[0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1,1.1].map(function(d){if(d==1.1)return "None";else return String(d);}),init:'0.5',
        input:{checked:true,position:'left',key:'mh',father:'corrScore'}
    },
    {
        index:5,text:'HVAC-HVAC Filter : ',title:'HAVC-HAVC Correlation Threshold',class:'hhFilter',values:[0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1,1.1].map(function(d){if(d==1.1)return "None";else return String(d);}),init:'0.5',
        input:{checked:true,position:'left',key:'hh',father:'corrScore'}
    },
    {index:7,text:'Propagation Step: ',title:'Propagation Count Threshold',class:'prop',values:[0,1,2,3,4,5,6,7,8,9,10].map(function(d){return String(d)}),init:'0'},
    {index:6,text:'EdgeType        : ',title:'Edge Type',class:'edgeType',values:['origin','space','time','both'],init:'origin'},
    //{index:8,text:'ringColor : ',class:'ringColor',values:['mid','start','end'],init:'mid'},
    {index:8,text:'Standalone Nodes: ',title:'Show Standalone Nodes',class:'standalone',values:['off','on'],init:'off'},
    {index:9,text:'EdgeLabel       : ',title:'Show Edge Label',class:'edgeLabel',values:['off','on'],init:'off'},
    //{index:10,text:'show edges: ',title:'Show edges ',class:'edgeShowLabel',values:['off','on'],init:'on'},
    //{index:11,text:'Wedges to center: ',title:'Push Wedges to center',class:'edgeShowLabel',values:['off','on'],init:'on'}
    //{index:1,text:'#Cluster : ',class:'cluster',values:[clusterCount]}
    //{index:0,text:'Database : ',',class:':'database',values:['aminerV8','citeseerx']}
].sort(function(a,b){return a.index- b.index});
var fontFamily='Microsoft YaHei';
var fontSize=12;
function reDrawWithFallingWedge(wedgeFalling){
    leftLayer.wedge_falling=wedgeFalling;
    leftLayer.layout(leftLayer.optionNumber,false,false,leftLayer.plot_data);
}
function reDrawWithEdgeShow(edge_show){
    leftLayer.edge_show=edge_show
    leftLayer.layout(leftLayer.optionNumber,false,false,leftLayer.plot_data);
}
function reSearch(){
    leftLayer.data.postData={};
    leftLayer.data.screenPreviousData={};
    leftLayer.data.sourceData={};
    leftLayer.data.timeData={};
    var zoom=leftLayer.svgZoom;
    leftLayer.svg.call(zoom.transform,d3.zoomIdentity
        .scale(1)
        .translate(0, 0));
    console.log("before search leftLayer")
    search([leftLayer]);

    leftLayer.fullGraph=1;
    leftLayer.filter.fullGraph=leftLayer.fullGraph;
    var buttons=leftLayer.buttonController.buttonDic;
    for(var key in buttons) {
        buttons[key].g.remove();
    }
    leftLayer.buttonController.buttonDic={};
    leftLayer.buttonController.nextY=0;
    leftLayer.tabController.layer.selectAll('*').remove();
    leftLayer.tabController.tabDic={};

}
function changeOption(d){
    if(d.fatherID==1){
        leftLayer.filter.mThres=+d.values[d.selectID]*100;
        leftLayer.mThres=+d.values[d.selectID]*100;
        if(d.values[d.selectID]=='None'){
            leftLayer.filter.mThres=110;
            leftLayer.mThres=110;
        }
    }
    else if(d.fatherID==2){
        leftLayer.filter.hThres=+d.values[d.selectID]*100;
        leftLayer.hThres=+d.values[d.selectID]*100;
        if(d.values[d.selectID]=='None'){
            leftLayer.filter.hThres=110;
            leftLayer.hThres=110;
        }
    }
    else if(d.fatherID==3){
        leftLayer.corrScore.mm=+d.values[d.selectID];
        if(d.values[d.selectID]=='None'){
            leftLayer.corrScore.mm='1.1';
        }
        leftLayer.filter.corrScore.mm=leftLayer.corrScore.mm/leftLayer.corrScoreCheck.mm;
    }
    else if(d.fatherID==4){
        leftLayer.corrScore.mh=+d.values[d.selectID];
        if(d.values[d.selectID]=='None'){
            leftLayer.corrScore.mh='1.1';
        }
        leftLayer.filter.corrScore.mh=leftLayer.corrScore.mh/leftLayer.corrScoreCheck.mh;
    }
    else if(d.fatherID==5){
        leftLayer.corrScore.hh=+d.values[d.selectID];
        leftLayer.corrScore.hh=+d.values[d.selectID];
        if(d.values[d.selectID]=='None'){
            leftLayer.corrScore.hh='1.1';
        }
        leftLayer.filter.corrScore.hh=leftLayer.corrScore.hh/leftLayer.corrScoreCheck.hh;
    }
    else if(d.fatherID==6){
        leftLayer.filter.fuseType=+d.values[d.selectID];
        leftLayer.fuseType=+d.values[d.selectID];
    }
    else if(d.fatherID==7){
        leftLayer.filter.propagate=+d.values[d.selectID];
        leftLayer.propagate=+d.values[d.selectID];
    }
    else if(d.fatherID==8){
        var k= d.values[d.selectID];
        if (k=='on'){
            leftLayer.draw_standalone_nodes=true;
            leftLayer.filter.draw_standalone_nodes=1;
        }
        else{
            leftLayer.draw_standalone_nodes=false;
            leftLayer.filter.draw_standalone_nodes=0;
        }
    }
    else if(d.fatherID==9){
        var k= d.values[d.selectID];
        leftLayer.svg.selectAll('.corrScoreValue').styles({
            visibility:function(){
                var vis;
                (k=='on')?vis='visible':vis='hidden';
                return vis;
            }
        })
    }
    else if(d.fatherID==11){
        var k= d.values[d.selectID];
        if (k == 'on')
            reDrawWithFallingWedge(true);
        else
            reDrawWithFallingWedge(false);
    }
    else if(d.fatherID==10){
        var k= d.values[d.selectID];
        if (k == 'on')
            reDrawWithEdgeShow(true);
        else
            reDrawWithEdgeShow(false);
    }
    if(d.fatherID!=9 && d.fatherID!=10 && d.fatherID!=11)reSearch();

}


$(function (){
    $(".left_nav dd ").hover(function(){
        $(".nav_right",this).show();
    });
    $(".left_nav dd ").mouseleave(function(){
        $(".nav_right",this).hide();
    });
});

$(function (){
    $(".hide").click(function(){
        if($(".left_nav dl dd ").css('display')=='none')
            $(".left_nav dl dd ").show();
        else if($(".left_nav dl dd ").css('display')=='block')
            $(".left_nav dl dd ").hide();
        //$(".left_nav dl dd ").attr('display','none');
    });
    /*$(".left_nav dd ").mouseleave(function(){
        $(".nav_right",this).hide();
    });*/
});

/*optionData.forEach(function (e) {
    if(e.input){
        var key= e.key;
        var father= e.father;
        if(e.key=='m'|| e.key=='h'){
            leftLayer.filter[father][key]=1;
        }
        else{
            leftLayer.corrScoreCheck[key]=1;
            leftLayer.filter[father][key]=leftLayer.corrScore[key]/leftLayer.corrScoreCheck[key];
        }
    }
    reSearch();
});*/

var newoptionSVG=d3.select('.left_nav');
var inputDiv=newoptionSVG.select('dl');
inputDiv.selectAll('whatever').data(optionData)
    .enter()
    .append('dd')
    .attr('class',function (d) {
        return 'option'+d.index;
    })
    .append('a')
    .attrs({
        class: "nav_left",
        href:"javascript:"
    })
    .attr('id',function (d) {
        return 'optionId'+d.index;
    })
    .html(function(d){return d.text+d.init;});

inputDiv.selectAll('dd').data(optionData)
    .append('div')
    .attr('class',"nav_right")
    .style('top',function (d,i) {
        if(i==5) return '210px';
        else if(i==7) return '290px'
        else if(i==8) return '320px'
        else if(i==9) return '350px'
        else  return (10+i*21)+'px';
    })
    .each(function (d) {
        var thisG=d3.select(this);
        for (var i=0;i<d.values.length;i++){
            thisG.append('a')
                .attr('href','javascript:')
                .attrs({
                    'father':d.index,
                    'selectId':i
                })
                .html(function(d){return d.values[i];})
                .on('click',function(d){
                    d3.select('#optionId'+d3.select(this).attr('father'))
                        .html(d.text+d.values[d3.select(this).attr('selectId')]);
                    var data={fatherID:parseInt(d3.select(this).attr('father')),selectID:parseInt(d3.select(this).attr('selectId')),values: d.values};
                    changeOption(data);
                    //reSearch();
                });
        }
    });
//change the filter

// click the values
//selectId:j,
//  father: d.index,
/*
var father=parseInt(d3.select(this).attr('father'));//d.index
var selectid=parseInt(d3.select(this).attr('selectid'));// the index of values
    var id=d3.select(this).attr('father');
    var txt = old$(this).text();
    old$("#cite"+id+' a').html(txt);
    var value = old$(this).attr("selectId");
//                    inputselect.val(value);
    old$("#ul"+id).hide();
    var data={fatherID:id,selectID:value,values: d.values};
    changeOption(data);*/




/*optionDiv.selectAll('whatever').data(optionData)
    .enter()
    .append('g')
    .each(function(d,i){
        var thisG=d3.select(this);
        if(d.input){
            var inputDiv=thisG.append('div')
                .attrs({
                    class:'checkBoxDiv'
                })
                .style('float','left');
            inputDiv.append('input')// check box
                .datum(d.input)
                .attrs({
                    type:'checkbox',
                    checked:function(e){return e.checked;}
                })
                .on('change',function(e){
                    var checked=d3.select(this).property("checked");
                    var key= e.key;
                    var father= e.father;
                    if(e.key=='m'|| e.key=='h'){
                        leftLayer.filter[father][key]=+checked;
                    }
                    else{
                        leftLayer.corrScoreCheck[key]=+checked;
                        leftLayer.filter[father][key]=leftLayer.corrScore[key]/leftLayer.corrScoreCheck[key];
                    }
                    reSearch();
                    console.log(leftLayer.filter)
                })

        }
        var maxLabel=d3.max(d.values,function(e){
            return e.visualLength(fontFamily,fontSize);
        });
        thisG
            .append('a')
            .attrs({
                title:d.title,
                class:'selectTextDiv'
            })
            .styles({
                //'margin-left':20+px,
                height:24+px,
                'line-height':24+px,
                float:'left'
            })
            .append('text')
            .html(function(d){return d.text;})
            .styles({
                'font-size':12+px,
                'font-family':'Microsoft YaHei',
                'color':color.optionTextColor
            });
        var newLabelDiv=thisG
            .append('div')
            .attrs({
                id:'selectDiv'+ d.index,
                class:'selectDiv'
            })
            .styles({
                float:'left'
            });
        newLabelDiv.append('cite')
            .attrs({
                class:'cite',
                id:'cite'+ d.index
            })
            .on('click',function(){
                var thisCite=d3.select(this);
                var id=thisCite.attr('id').split('cite')[1];
                var ul = old$("#ul"+id);
                var ul_display=d3.select('#ul'+id).style('display');
                if(ul.css("display")=="none"){
                    ul.slideDown("fast");
                }
                else{
                    ul.slideUp("fast");
                }
            })
            .styles({
                width:maxLabel+30+px,
                height:'24px',
                'line-height':'24px',
                'font-family':'Microsoft YaHei',
                'font-size':12+px,
                color:color.optionTextColor
            })
            .append('a')
            .styles({
                'margin-left':10+px
            })
            .html(function(){
                //console.log(colorStyle)
                if(d.class=='style')return colorStyle;
                if(d.class!='database')return d.init;
                else return getUrlParam('selected');
            });
        var newUL=newLabelDiv.append('ul')
            .attrs({
                class:'ul',
                id:'ul'+ d.index
            })
            .styles({
                width:maxLabel+20+px
            });

        for (var j=0;j< d.values.length;j++){
            newUL.append('li')
                .styles({
                })
                .append('a')
                .styles({
                    width:maxLabel+25+px,
                    height:'24px',
                    'line-height':'24px',
                    'font-family':'Microsoft YaHei',
                    'font-size':12+px
                })
                .attrs({
                    selectId:j,
                    father: d.index,
                    class:function(e,i){if(e.index==100)return 'hasSub';}
                })
                .on('mouseover',function(e,i){
                    var father=parseInt(d3.select(this).attr('father'));
                    var selectid=parseInt(d3.select(this).attr('selectid'));
                    if(father==100&& selectid in [0,1]){
                        var ul = old$("#subUL3_"+selectid);
                        var ul_display=d3.select('#subUL3_'+selectid).style('display');
                        ul.slideDown("fast");

                    }
                })
                .on('mouseout',function(e,i){
                    var father=parseInt(d3.select(this).attr('father'));
                    var fatherLength=d3.select('#ul'+father).style('width').split('px')[0];
                    var selectid=parseInt(d3.select(this).attr('selectid'));
                    if(father==100&& selectid in [0,1]&&d3.event.layerX<parseFloat(fatherLength)-2){
                        console.log(d3.event.layerX);
                        console.log(d3.event.layerY);
                        var ul = old$("#subUL3_"+selectid);
                        var ul_display=d3.select('#subUL3_'+selectid).style('display');
                        ul.hide();
                    }
                })
                .on('click',function(e,i){
                    var father=parseInt(d3.select(this).attr('father'));
                    var selectid=parseInt(d3.select(this).attr('selectid'));
                    if(father==100&& selectid in [0,1]){
                        var ul = old$("#subUL3_"+selectid);
                        var ul_display=d3.select('#subUL3_'+selectid).style('display');
                        if(ul.css("display")=="none"){
                            ul.slideDown("fast");
                        }else{
                            ul.slideUp("fast");
                        }
                    }
                    else{
                        var id=d3.select(this).attr('father');
                        var txt = old$(this).text();
                        old$("#cite"+id+' a').html(txt);
                        var value = old$(this).attr("selectId");
//                    inputselect.val(value);
                        old$("#ul"+id).hide();
                        var data={fatherID:id,selectID:value,values: d.values};
                        changeOption(data);
                    }

                })

                .html(d.values[j]);
        }

        if(d.index==100){
            var subData=[{'value':1,index:d.index,text:'1 keyword'},{'value':2,index:d.index,text:'2 keywords'},{'value':3,index:d.index,text:'3 keywords'}];
            var textLength='3 keywords'.visualLength(fontFamily,fontSize)
            var subUL=newLabelDiv.append('ul')
                .attrs({
                    class:'subUL',
                    id:'subUL'+ d.index+'_0'
                })
                .styles({
                    'margin-left':maxLabel+20+px,
                    width:textLength+5+px,
                    'display':'none'
                });
            var subDataF=[{'value':1,index:d.index,text:'1 keyword'},{'value':2,index:d.index,text:'2 keywords'},{'value':3,index:d.index,text:'3 keywords'}];
            var subULF=newLabelDiv.append('ul')
                .attrs({
                    class:'subUL',
                    id:'subUL'+ d.index+'_1'
                })
                .styles({
                    'margin-left':maxLabel+20+px,
                    width:textLength+5+px,
                    'display':'none'
                });
            subUL.selectAll('whatever').data(subData)
                .enter()
                .append('li')
                .append('a')
                .styles({
                    width:textLength+5+px,
                    height:'24px',
                    'line-height':'24px',
                    'font-family':'Microsoft YaHei',
                    'font-size':12+px
                })
                .attrs({
                    selectId:0,
                    father: function(e){return e.index;},
                    labelLevel:function(e,i){return i;}
                })
                .on('click',function(e,i){
                    var id=d3.select(this).attr('father');
                    //var txt = old$(this).text();
                    old$("#cite"+id+' a').html('TF-IDF keywords');
                    var value = old$(this).attr("selectId");
                    var level=parseInt(d3.select(this).attr('labelLevel'));
//                    inputselect.val(value);
                    old$("#subUL"+id+'_0').hide();
                    old$(".ul").hide();
                    var d={fatherID:id,selectID:value};
                    d3.selectAll('.labelLayer').selectAll('.freq').styles({'visibility':'hidden'});
                    d3.selectAll('.labelLayer').selectAll('.tfidf').styles({'visibility':null});
                    d3.select('.tfidfSummary').style('display','block');
                    d3.select('.freqSummary').style('display','none');
                    tfidfStatus='block';
                    freqStatus='none';
                    if(level==0){
                        d3.selectAll('.labelLayer').selectAll('.TFIDFLevel1').styles({'visibility':'hidden'});
                        d3.selectAll('.labelLayer').selectAll('.TFIDFLevel2').styles({'visibility':'hidden'});
                    }
                    else if(level==1){
                        d3.selectAll('.labelLayer').selectAll('.TFIDFLevel1').styles({'visibility':null});
                        d3.selectAll('.labelLayer').selectAll('.TFIDFLevel2').styles({'visibility':'hidden'});
                    }
                    else if(level==2){
                        d3.selectAll('.labelLayer').selectAll('.TFIDFLevel2').styles({'visibility':null});

                    }

                    changeOption(d);
                })
                //.on('mouseout',function(){
                //    var id=d3.select(this).attr('father');
                //    old$("#subUL"+id+'_0').hide();
                //})
                .html(function(e){return e.text});
            subULF.selectAll('whatever').data(subDataF)
                .enter()
                .append('li')
                .append('a')
                .styles({
                    width:textLength+5+px,
                    height:'24px',
                    'line-height':'24px',
                    'font-family':'Microsoft YaHei',
                    'font-size':12+px
                })
                .attrs({
                    selectId:1,
                    father: function(e){return e.index;},
                    labelLevel:function(e,i){return i;}
                })
                .on('click',function(e,i){
                    var id=d3.select(this).attr('father');
                    //var txt = old$(this).text();
                    old$("#cite"+id+' a').html('Frequent keywords');
                    var value = old$(this).attr("selectId");
                    var level=parseInt(d3.select(this).attr('labelLevel'));
//                    inputselect.val(value);
                    old$("#subUL"+id+'_1').hide();
                    old$(".ul").hide();
                    var d={fatherID:id,selectID:value};
                    d3.selectAll('.labelLayer').selectAll('.tfidf').styles({'visibility':'hidden'});
                    d3.selectAll('.labelLayer').selectAll('.freq').styles({'visibility':null});
                    d3.select('.tfidfSummary').style('display','none');
                    d3.select('.freqSummary').style('display','block');
                    tfidfStatus='none';
                    freqStatus='block';
                    if(level==0){
                        d3.selectAll('.labelLayer').selectAll('.FrequencyLevel1').styles({'visibility':'hidden'});
                        d3.selectAll('.labelLayer').selectAll('.FrequencyLevel2').styles({'visibility':'hidden'});
                    }
                    else if(level==1){
                        d3.selectAll('.labelLayer').selectAll('.FrequencyLevel1').styles({'visibility':null});
                        d3.selectAll('.labelLayer').selectAll('.FrequencyLevel2').styles({'visibility':'hidden'});
                    }
                    else if(level==2){
                        d3.selectAll('.labelLayer').selectAll('.FrequencyLevel2  ').styles({'visibility':null});

                    }
                    changeOption(d);
                })
                //.on('mouseout',function(){
                //    var id=d3.select(this).attr('father');
                //    old$("#subUL"+id+'_1').hide();
                //})
                .html(function(e){return e.text});
        }

        old$(document).click(function(d){
            var target=d3.select(d.target);

            if(target.attr('class')!='hasSub') {
                old$(".ul").hide();
                old$(".subUL").hide();
            }
        });
    });*/
/*var newoptionSVG=d3.select('.left_nav');
var inputDiv=newoptionSVG.append('dl');
inputDiv.selectAll('whatever').data(optionData)
    .enter()
    .each(function (d) {
        var thisG=d3.select(this);
        thisG.append('dd')
            .append('a')
            .attrs({
                class:'left_nav',
                href:"javascript:"
            })
            .append('text')
            .html(function(d){return d.text;});

    });*/

var axisSVG=d3.select('.axisSVG');
var nodeAxisSVG=d3.select('.nodeAxisSVG');
var svg=d3.select('.svg');
var svgs=[axisSVG,nodeAxisSVG,svg];
svgs.forEach(function(svg){
    var height=+svg.style('height').split('px')[0];
    var width=+svg.style('width').split('px')[0];
    svg.attrs({
        height:height,
        width:width
    })
});


leftLayer.axisSVG=axisSVG;
leftLayer.nodeAxisSVG=nodeAxisSVG;
leftLayer.nodeAxisSVGHeight=nodeAxisSVG.style('height').toFloat();
leftLayer.nodeAxisSVGWidth=nodeAxisSVG.style('width').toFloat();
leftLayer.svg=svg;
var svgLayer=svg.append('g');
var svgWidth=leftLayer.svg.style('width').toFloat();
var svgHeight=leftLayer.svg.style('height').toFloat();
var svgBackground=svgLayer.append('g')
    .append('rect')
    .attrs({
        width:svgWidth,
        height:svgHeight
    })
    .styles({
        fill:'transparent',
        cursor:'-webkit-grab'
    })
    .on('click',function(){
        var data=leftLayer.data;
        var currentEdgeSourceTargetDic=leftLayer.currentEdgeSourceTargetDic;
        var focusedID=leftLayer.focusedID;
        d3.selectAll('.clicked')
            .each(function(d){
                if(d.self){
                    //d.self.style('fill',function(d){return "url(#radialGradient"+ d.id+")"});
                    d.self.style('stroke',color.nodeHighlightStroke);
                    d.self.style('stroke-width','0px');
                    d.self.attr('class','node');
                    d.clicked=false;
                }

            });
        d3.selectAll('.subYearPath').remove();
        d3.select('.edgeField').selectAll('path')
            .style('stroke',color.edgeColor)
            .each(function(d){
                if(d.marker)d.marker.style('fill',color.edgeColor);
                if(d.highlightedByNodeDic)delete d.highlightedByNodeDic;
            });

        d3.selectAll('.label').style('fill',color.nodeLabelColor);
        if(data.postData[focusedID].subNodeTimeData){
            var subNodeTimeData=data.postData[focusedID].subNodeTimeData;
            for (var i=0;i<subNodeTimeData.length;i++){
                subNodeTimeData[i][1]=0;
            }
        }
        for(var key in currentEdgeSourceTargetDic){
            if(currentEdgeSourceTargetDic[key].highlightedByNodeDic){
                delete currentEdgeSourceTargetDic[key].highlightedByNodeDic;
            }
        }
        var buttons=leftLayer.buttonController.buttonDic;
        for(var key in buttons) {
            buttons[key].g.remove();
        }
        leftLayer.buttonController.buttonDic={};
        leftLayer.buttonController.nextY=0;
        leftLayer.tabController.layer.selectAll('*').remove();
        leftLayer.tabController.tabDic={};

        removeW2tabs();
        bindW2tabs();
    });
function removeW2tabs(){

    var right=d3.select('.bottomRight');
    right.select('.optionTab').select('.rightTabs').selectAll('*').remove();
    right.select('.scatterDiagram').selectAll('*').remove();
    right.select('.subChart').selectAll('*').remove();
    right.select('.room').selectAll('*').remove();
    w2ui.rightTabs=null;

}
leftLayer.removeW2tabs=removeW2tabs;
leftLayer.background=svgBackground;
leftLayer.time_g=svgLayer.append('g')
    .attrs({
        class:'yearBackground yearBackground_left'
    });
leftLayer.legend_g=svgLayer.append('g')
    .attrs({
        class:'legendDrawer legendDrawer_left'
    });
leftLayer.svg_g=svgLayer
    .append('g')
    .attrs({
        class:'svgDrawer svgDrawer_left'
    });
leftLayer.size={
    width: leftLayer.svg.attr("width")*0.9,
    height:leftLayer.svg.attr("height")*1
};
leftLayer.initFrameIndex(0);
leftLayer.nodeAxisSVG
    .on('click',function(){
        if(d3.select(d3.event.target).attr('class')&&d3.select(d3.event.target).attr('class').split(' ')[0]=='nodeAxisSVG'){
            d3.select(this).select('.dashlinesClicked').remove();
            d3.select(this).select('.valuePointClicked').remove();
            d3.select(this).select('.valueTextClicked').remove();
            leftLayer.drawLineData=0;
        }
    });

var tranShiftHeight=40;
var tranShiftWidth=150;
var fullShiftHeight=30;
var fullShiftWidth=30;
var tranHeight=svgHeight-tranShiftHeight-10;
var tranWidth=svgWidth-tranShiftWidth;
var fullScreenButtonTranWidth=svgWidth-fullShiftWidth;
var fullScreenButtonTranHeight=svgHeight-fullShiftHeight-10;
var gFullScreen=svgLayer.append('g');

var gSizeBar=svgLayer
    .append('g')
    .attrs({
        class:'gSizeBar'
        //transform:'translate('+(tranWidth)+','+(tranHeight)+')'
    });
var gSizeBarBrush=svgLayer.append("g")
    //.attr("transform", 'translate('+(tranWidth)+','+(tranHeight)+')')
    .attr("class", "gSizeBarBrush");
var x=d3.scaleLinear()
    .domain([0,50])
    .range([0,100]);
var xAxis = d3.axisBottom(x).ticks(0);
//.tickValues(x.ticks(1).concat(x.domain()));
var brushed=function(){
    var s=d3.event.selection;
   // var kk=d3.event.transform;
    //console.log(s);
    //console.log(s.map(x.invert));
    var t= s.map(x.invert);
    leftLayer.minNodeSize=t[0];
    leftLayer.maxNodeSize=t[1];
    //leftLayer.nodeIconSize=t[1]+t[0]-25;
    leftLayer.nodeIconSize=t[0]+5;
    var svg=leftLayer.svg;
    var layer=svg.select('.svgDrawer');
    var k=leftLayer.zoomK||1;
   // layer.attr("transform", leftLayer.rScale);
    var rScale=leftLayer.rScale;
    var dSize;
    var delta;
    var nodeR;
    var radiusDelta= t[1];
    //console.log('setting radiusDelta to '+radiusDelta);
    leftLayer.radiusDelta = radiusDelta;
    var dd;
    //console.log('gSizeBrushBar iconSize '+leftLayer.nodeIconSize);
    //console.log('gSizeBrushBar radiusDelta '+radiusDelta);
    if(rScale){
        layer.selectAll('image')
            .attrs({
                x:function(d,i){
                    dd=d;
                    dSize=(leftLayer.nodeIconSize- d.nodeIconSize);
                    d.nodeIconSize=leftLayer.nodeIconSize;
                    d.delta+=dSize;

                    return d.x- d.delta/ k
                },
                y:function(d){return d.y- d.delta/ k},
                width:function(d){d.iconWidth= d.delta*2;return d.iconWidth/ k+px},
                height:function(d){d.iconHeight= d.delta*2;return d.iconHeight/ k+px}
            });
        rScale.range(t);
        layer.selectAll('circle')
            .attr('r',function(d){
                //d.nodeR=rScale(d.tSum)+d.delta*Math.sqrt(2);
                delta=d.delta;
                d.nodeR=rScale(d.nodeR)+d.delta*Math.sqrt(2);
                nodeR=d.nodeR;
                return d.nodeR/ k;
                //return d.nodeR;
            });
        layer.selectAll('.label')
            .attrs({
                "y":function(d){
                    d.labelDeltaY=d.nodeR+ d.AHeight+d.layers_num_in_six_clock*leftLayer.radiusDelta;
                    return d.y+ d.labelDeltaY/ k+px;
                }
            });
       layer.select('.edgeField').selectAll('path')
            .attr('d',function(d){
                return pathData(d, d.that, k);
            })
            .styles({
                'stroke-width':function(d){
                    //console.log(d);
                   // d.stroke_width
                    d.initZoom += dSize / 15;
                    return d.stroke_width/ k * d.initZoom + px;
                }
            });
       //todo


      layer.selectAll('.arc').selectAll('path')
            .attr('d',function (d) {
                //console.log('zooming arc');
                //console.log(d);
                var g=d3.select(this);
                var arc = d3.arc()
                    .outerRadius((dd.nodeR+radiusDelta)/k)
                    .innerRadius((dd.nodeR+2)/k);
                var pie = d3.pie()
                    .sort(null)
                    .value(function(d1) { return d1.anomalyTime; });
                //var arc_data = arc.innerRadius((dd.nodeR+2)/k)
                 //      .outerRadius((dd.nodeR+radiusDelta)/k)(d.data);
                var zoomedInnerR = leftLayer.nodeIconSize*2+2 + radiusDelta *  (d.parentIndex);
                var zoomedOuterR = leftLayer.nodeIconSize*2+2+ radiusDelta * (d.parentIndex + 1)
                var arc_data = arc.innerRadius(zoomedInnerR).outerRadius(zoomedOuterR)(d.data);
                //console.log(arc_data);
                return arc_data
                    
            });
      layer.select('.arrowField').selectAll('path')
          .attr('d',function(d){
              d.initZoom += dSize / 15;
              return arrowData(d, d.that, k,d.initZoom);
          })
          .style('stroke-width',function(d){
            d.initZoom += dSize / 15;
            return d.stroke_width/ k * d.initZoom + px;
        })
    }

};
//console.log(pathData.stroke_width);
var brush = d3.brushX()
    .extent([[0, -5], [100, 5]])
    .on("brush", brushed);

gSizeBar.call(xAxis);
gSizeBarBrush.call(brush)
    .call(brush.move, [x(leftLayer.minNodeSize),x(leftLayer.radiusDelta)]);

var fullScreenState=0;
function fullScreen(obj){
    if (obj.requestFullscreen){
        obj.requestFullscreen();
    }
    else if (obj.mozRequestFullScreen){
        obj.mozRequestFullScreen();
    }
    else if (obj.webkitRequestFullScreen){
        obj.webkitRequestFullScreen();
    }
}
function quitFullScreen(){
    if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    }
    else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
    }
}

    //.attr('transform','translate('+fullScreenButtonTranWidth+','+fullScreenButtonTranHeight+')');
function gTranslation(){
    gSizeBar.attr('transform','translate('+(tranWidth)+','+(tranHeight)+')');
    gSizeBarBrush.attr("transform", 'translate('+(tranWidth)+','+(tranHeight)+')');
    gFullScreen.attr('transform','translate('+fullScreenButtonTranWidth+','+fullScreenButtonTranHeight+')');
    leftLayer.svg.select('.excalibur').attr('transform','translate('+(tranWidth-10)+','+(tranHeight)+')');
    leftLayer.svg.select('.animation').attr('transform','translate('+((tranWidth+tranShiftWidth)/2)+','+(tranHeight)+')');
}
gTranslation();
drawFullScreenIcon(gFullScreen,fullScreenButtonTranWidth,fullScreenButtonTranHeight);
function drawFullScreenIcon(g,x,y){
    document.addEventListener("fullscreenchange", function () {
        fullScreenState = (document.fullscreen)? 1:0;
        gButton.selectAll('.gPart')
            .attr('transform',function(e){
                return 'translate('+(e.translate.x)+','+(e.translate.y)+') rotate('+ ((fullScreenState)*180)+','+(e.rotate.x)+','+(e.rotate.y)+')'
            });
        tranHeight=(svgHeight-tranShiftHeight)*(1-fullScreenState)+(height-tranShiftHeight)*fullScreenState;
        tranWidth=(svgWidth-tranShiftWidth)*(1-fullScreenState)+(width-tranShiftWidth)*fullScreenState;
        fullScreenButtonTranWidth=(svgWidth-fullShiftWidth)*(1-fullScreenState)+(width-fullShiftWidth)*fullScreenState;
        fullScreenButtonTranHeight=(svgHeight-fullShiftHeight)*(1-fullScreenState)+(height-fullShiftHeight)*fullScreenState;
        gTranslation();
    }, false);
    document.addEventListener("mozfullscreenchange", function () {
        fullScreenState = (document.mozFullScreen)? 1:0;
        gButton.selectAll('.gPart')
            .attr('transform',function(e){
                return 'translate('+(e.translate.x)+','+(e.translate.y)+') rotate('+ ((fullScreenState)*180)+','+(e.rotate.x)+','+(e.rotate.y)+')'
            });
        tranHeight=(svgHeight-tranShiftHeight)*(1-fullScreenState)+(height-tranShiftHeight)*fullScreenState;
        tranWidth=(svgWidth-tranShiftWidth)*(1-fullScreenState)+(width-tranShiftWidth)*fullScreenState;
        fullScreenButtonTranWidth=(svgWidth-fullShiftWidth)*(1-fullScreenState)+(width-fullShiftWidth)*fullScreenState;
        fullScreenButtonTranHeight=(svgHeight-fullShiftHeight)*(1-fullScreenState)+(height-fullShiftHeight)*fullScreenState;
        gTranslation();
    }, false);
    document.addEventListener("webkitfullscreenchange", function () {
        fullScreenState= (document.webkitIsFullScreen)? 1:0;
        gButton.selectAll('.gPart')
            .attr('transform',function(e){
                return 'translate('+(e.translate.x)+','+(e.translate.y)+') rotate('+ ((fullScreenState)*180)+','+(e.rotate.x)+','+(e.rotate.y)+')'
            });
        tranHeight=(svgHeight-tranShiftHeight)*(1-fullScreenState)+(height-tranShiftHeight)*fullScreenState;
        tranWidth=(svgWidth-tranShiftWidth)*(1-fullScreenState)+(width-tranShiftWidth)*fullScreenState;
        fullScreenButtonTranWidth=(svgWidth-fullShiftWidth)*(1-fullScreenState)+(width-fullShiftWidth)*fullScreenState;
        fullScreenButtonTranHeight=(svgHeight-fullShiftHeight)*(1-fullScreenState)+(height-fullShiftHeight)*fullScreenState;
        gTranslation();
    }, false);
    document.addEventListener("msfullscreenchange", function () {
        fullScreenState= (document.msFullscreenElement)? 1:0;
        gButton.selectAll('.gPart')
            .attr('transform',function(e){
                return 'translate('+(e.translate.x)+','+(e.translate.y)+') rotate('+ ((fullScreenState)*180)+','+(e.rotate.x)+','+(e.rotate.y)+')'
            });
        tranHeight=(svgHeight-40)*(1-fullScreenState)+(height-40)*fullScreenState;
        tranWidth=(svgWidth-140)*(1-fullScreenState)+(width-40)*fullScreenState;
        fullScreenButtonTranWidth=(svgWidth-fullShiftWidth)*(1-fullScreenState)+(width-fullShiftWidth)*fullScreenState;
        fullScreenButtonTranHeight=(svgHeight-fullShiftHeight)*(1-fullScreenState)+(height-fullShiftHeight)*fullScreenState;
        gTranslation();
    }, false);
    var gButton= g.append('g');

    var l=6;
    var w=14;
    var xs=[-w,w];
    var ys=[-w,w];
    var gBody=gButton.append('g')
        .attr('class','gBody');
    gBody.append('rect')
        .datum({rotate:0})
        .attrs({
            x:-w,
            y:-w,
            width:w*2,
            height:w*2
        })
        .styles({
            fill:'transparent',
            cursor:'hand'
        })
        .on('click',function(d){
            svg.attr('id','fullScreenSVG');
            var full=document.getElementById("fullScreenSVG");
            if(!fullScreenState){
                fullScreen(full);
                svg.styles({
                    width:width+px,
                    height:height+px
                });
            }
            else{
                quitFullScreen();
            }
            d.rotate=1- d.rotate;

        })

    xs.forEach(function(x){
        ys.forEach(function(y){
            var dx=w/x;
            var dy=w/y;
            var gPart=gButton.append('g')
                .datum({translate:{x:x,y:y},rotate:{r:0,x:l*dx*-1,y:l*dy*-1}})
                .attr('class','gPart')
                .attr('transform',function(d){
                    return 'translate('+(d.translate.x)+','+(d.translate.y)+') rotate('+ (d.rotate.r)+','+(d.rotate.x)+','+(d.rotate.y)+')'
                });

            var p={x:dx*l/2*-1,y:dy*l/2*-1};
            var p1={},p2={};
            p1.y=p.y;
            p2.x=p.x;
            p1.x=p.x+l*dx*-1;
            p2.y=p.y+l*dy*-1;
            var lines=[{p1:p,p2:p1},{p1:p,p2:p2}];
            gPart.selectAll('whatever')
                .data(lines)
                .enter()
                .append('path')
                .attr('d',function(d){
                    return 'M'+ d.p1.x+','+ d.p1.y+'L'+ d.p2.x+','+ d.p2.y;
                })
                .styles({
                    'stroke-width':'2px',
                    'stroke':'black'
                })
        })
    })
}
leftLayer.svg
    .attr('class','svg svg_left');

  /*  .append('a')
    .attr('href','javascript:')
    .html(function(d){return 'test';});*/


// d3.selectAll('dd')
//     .data(optionData)
//     .enter()
//     .each(function () {
//         var thisG=d3.select(this);
//         thisG.append('a')
//             .attrs({
//                 class:'left_nav',
//                 href:"javascript:"
//             })
//             //.append('text')
//             .html(function(d){return d.text;});
//     });

function bindW2tabs(){
    window.cnt = 0;
    window.now_active_tab = 'none';
    $('#rightTabs').w2tabs({
        name: 'rightTabs',
        // active: 'tab1',
        tabs: [],
        onClick: function (event) {
            if (now_active_tab !== 'none') {
                d3.select("#scatterDiagram_" + now_active_tab)
                    .style("display", "none");
                d3.select("#subChart_" + now_active_tab)
                    .style("display", "none");
                d3.select("#room_" + now_active_tab)
                    .style("display", "none");
            }
            d3.select("#scatterDiagram_" + event.target)
                .style("display", "block");
            d3.select("#subChart_" + event.target)
                .style("display", "block");
            d3.select("#room_" + event.target)
                .style("display", "block");
            now_active_tab = event.target;
        },
        onClose: function (event) {
            d3.select("#scatterDiagram_" + event.target)
                .remove();
            d3.select("#subChart_" + event.target)
                .remove();
            d3.select("#room_" + event.target)
                .remove();
        }
    });
}
bindW2tabs()
leftLayer.bindW2tabs=bindW2tabs;
//d3.select('body').call(d3.keybinding()
//    .on('←', move(-2, 0))
//    .on('↑', move(0, -2))
//    .on('→', move(2, 0))
//    .on('↓', move(0, 2)));
var titleText='Visual Analysis of Collective Anomalies Through High-Order Correlation Graph';
var titleFamily='Arial Black';
var titleSize=32;
d3.select('.title')
    .append('image')
    .attr('xlink:href','/images/logo.png')
    .attr('class','logo')
    .attrs({
        x:10,
        y:10
       /* width:'20px',
        height:'20px'*/
    });
d3.select('.title')
    .style('line-height',function(){
        return height*0.07+px;
    })
    .append('text')
    .styles({
        'font-family':titleFamily,
        'font-size':titleSize+px,
        'color':color.titleTextColor,
        'margin-left':(width-titleText.visualLength(titleFamily,titleSize))/2+px
    })
    .html(titleText);
leftLayer.buttonController=new ButtonController(leftLayer.nodeAxisSVG);
leftLayer.tabController=new TabController(leftLayer.nodeAxisSVG);
leftLayer.buttonController.tabController=leftLayer.tabController;
leftLayer.tabController.buttonController=leftLayer.buttonController;
leftLayer.dayShift=151;
window.leftLayer=leftLayer;

export{
    sourceCheckedStatus,px,timeMeasure,cloneIngoreList,dMax,dMin,minMax,db1,db2,initCluster,leftLayer,
    rightLayer,flipBook,movie,method,clusterCount,colorStyle,currentLayer,dataID,tfidfStatus,
    tStart,tEnd,anomalyScore,mThres,hThres,corrScore,fullGraph,sources,server,port,bindW2tabs
};
