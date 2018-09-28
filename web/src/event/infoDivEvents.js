function requestTitleList(d,clusterId){
    var timeFilter=this.timeFilter;
    var source=this.source;
    var clusterCount=this.clusterCount;
    var that=this;
    var rootID=getUrlParam(source+'_id');
    var pageSize=50;
    var year=0;
    var requestData={
        page_size:pageSize,
        year:year,
        rootID:rootID,
        clusterCount:clusterCount,
        selectedCluster:clusterId,
        source:source,
        timeFilter:timeFilter

    };
    var url='http://'+server+':'+port+'/GetCluster/';
    var success=function(data){
        //console.log(data)
        //data=JSON.parse(data);
        d.nodes=data;
        if(currentLayer){
            clusterSummary(d);
            that.nodeList(d);
        }

    };
    //ajax(url, success,requestData);
}
function processVenue(d){
    d.venueList=[]
    var venueDic={};
    for(var i=0;i<d.nodeidlist.length;i++){
        var id= d.nodeidlist[i];
        if(venueList[id]){
            if(venueList[id].venue){
                var venue=venueList[id]['venue'];
                if(venueDic[venue])venueDic[venue]+=1;
                else venueDic[venue]=1
            }


        }
        else{
            for(var key in venueDic){
                venueDic[key]+=1;
                break;
            }
        }
    }
    for (var venue in venueDic){
        d.venueList.push({venue:venue, count:venueDic[venue]});
    }
    d.venueList.sort(function(a,b){return d3.descending(a.count, b.count)})
//    console.log(d.venueList);
}
function clusterSummary(d){
    var that= d.that;
    var color=that.color;
    var rightContent=d3.select('.rightContentDiv');
    var rightWidth=rightContent.style('width').split('px')[0];
    var rightHeight=rightContent.style('height').split('px')[0];
    //console.log('current right content height'+rightHeight)
    //console.log('current right content width'+rightWidth)
//    var clusterSummaryHeight=rightHeight*0.13;
//    var clusterSummaryWidth=rightWidth;
//    var topMargin=rightWidth*0.05;
    //processVenue
//    processVenue(d)
//    var venueList=d.venueList;

    d3.select('.CSDTitleDiv').remove();
    d3.select('.CSDBodyDiv').remove();
    d3.select('.NVDTitleDiv').remove();
    d3.select('.NVDBodyDiv').remove();
    var clusterSummary=d3.select('.clusterSummaryDiv')
        .styles({
            width:rightWidth+px,
            height:'auto',
            //position:'absolute',
            //left:0+px,
            //top:topMargin+px
        });
    var CSDTitleDiv=clusterSummary.append('div')
        .styles({
            //'margin-top':rightWidth*0.05+px
            //combine with init.js line 297
        })
        .attr('class','CSDTitleDiv');
    var CSDBodyDiv=clusterSummary.append('div').attr('class','CSDBodyDiv')
        .styles({
            'margin-top':rightWidth*0.05+px
        });

    CSDTitleDiv.append('text')
        .styles({
            'margin-left':rightMarginLeft+px,
            'font-family':'Arial Black',
            'font-size':'16px',
            'color':color.panelTitleColor
        })
        .html('<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Selected Group');
    CSDBodyDiv.append('div').attr('class','clusterInfoDiv').append('text')
        .styles({
            'margin-left':rightMarginLeft+px,
            'margin-top':rightWidth*0.05+px,
            'font-family':'Arial ',
            'font-size':'14px',
            'color':color.panelTitleColor
        })
        .html(function(){return '<b>Group Size: </b>'+d.size;})
    CSDBodyDiv.append('div').attr('class','clusterInfoDiv').append('div')
        .styles({
            //'word-break':'break-all',
            'margin-left':rightMarginLeft+px,
            'margin-top':rightWidth*0.05+px,
            'font-family':'Arial ',
            'font-size':'14px',
            'color':color.panelTitleColor
        })
        .append('g')
        .each(function(){
            var g=d3.select(this);
            g.append('text')
                .html('<b>Content Summary: </b>')
            g.append('text')
                .style('display',tfidfStatus)
                .attr('class','tfidfSummary')
                .html(function(){
//            if(d.focused=='true'){
////                if(authorData[focusedID]){
////                    return '<b>Paper Title: </b>'+authorData[focusedID][0].field+','+authorData[focusedID][1].field;
////                }
////                else{
////                    return '<b>Paper Title: </b>'+authorData['default'][0].field+','+authorData['default'][1].field;
////                }
//            }
//            else{
                    var str = '';
                    var keywords= d.keywords;
                    for (var i= 0,len= keywords.length;i<len;i++){
                        if(keywords[i]){
                            if(i!=len-1){
                                if(i>=3&&(i+1)%4==0){
                                    str+=keywords[i];
                                    str+=' ';
                                }
                                else{
                                    str+=keywords[i];
                                    str+=' ';
                                }

                            }
                            else if(i==len-1){
                                str+=keywords[i];
                            }
                        }
                    }
                    return str;
                    //}
                })
            g.append('text')
                .attr('class','freqSummary')
                .style('display',freqStatus)
                //.style('visibility','hidden')
                .html(function(){
//            if(d.focused=='true'){
////                if(authorData[focusedID]){
////                    return '<b>Paper Title: </b>'+authorData[focusedID][0].field+','+authorData[focusedID][1].field;
////                }
////                else{
////                    return '<b>Paper Title: </b>'+authorData['default'][0].field+','+authorData['default'][1].field;
////                }
//            }
//            else{
                    var str = '';
                    var keywords= d.frequencyKeywords;
                    for (var i= 0,len= keywords.length;i<len;i++){
                        if(keywords[i]){
                            if(i!=len-1){
                                if(i>=3&&(i+1)%4==0){
                                    str+=keywords[i];
                                    str+=' ';
                                }
                                else{
                                    str+=keywords[i];
                                    str+=' ';
                                }

                            }
                            else if(i==len-1){
                                str+=keywords[i];
                            }
                        }
                    }
                    return str;
                    //}
                })
        })



//    if(venueList.length>=3){
//        CSDBodyDiv.append('div').attr('class','clusterInfoDiv').append('div')
//            .styles({
//                'margin-left':rightMarginLeft+px,
//                'margin-top':rightWidth*0.05+px,
//                'font-family':'Arial ',
//                'font-size':'14px',
//                'color':color.panelTitleColor
//            })
//            .html(function(d){
//
//                var venueStr=''
//                for(var i=0;i<3;i++){
//                    venueStr+=venueList[i].venue+'('+venueList[i].count+')'+' ';
//                }
//                return '<b>Venue: </b>'+venueStr
//            })
//    }

//    CSDBodyDiv.append('div').attr('class','clusterInfoDiv').append('div')
//        .styles({
//            'margin-left':rightMarginLeft+px,
//            'margin-top':rightWidth*0.05+px,
//            'font-family':'Arial ',
//            'font-size':'14px',
//            'color':'white'
//        })
//        .html(
//        function(){
//            return '<b>Max Citation: </b>'+d.nodes[0].citation_count;
//        }
//    )
//    CSDBodyDiv.append('div').attr('class','clusterInfoDiv').append('div')
//        .styles({
//            'margin-left':rightMarginLeft+px,
//            'margin-top':rightWidth*0.05+px,
//            'font-family':'Arial ',
//            'font-size':'14px',
//            'color':'white'
//        })
//        .html(
//        function(){
//            var len=d.nodes.length;
//            var sum=0;
//            var avg;
//            for(var i= 0;i<len;i++){
//                if(parseInt(d.nodes[i].citation_count)>0){
//                   sum+=parseInt(d.nodes[i].citation_count);
//                }
//            }
//            avg = sum/len;
//            return '<b>Average Citation: </b>'+avg.toFixed(2);
//        }
//    )
}
function nodeList(d){
    var that=this;
    var color=that.color;
    var nodeValue=that.nodeValue;
//    console.log(d.id);
//    nodeValue(d);
    selectedNode=d.id;
    var CSDHeight=d3.select('.clusterSummaryDiv')[0][0].offsetHeight;

    var leftDiv=d3.select('.rightContentDiv');
    var leftHeight=leftDiv.style('height').split('px')[0];
    var leftWidth=leftDiv.style('width').split('px')[0];

    var leftContentWidth=d3.select('.leftTopBarDiv').style('width').split('px')[0];
    var leftTransitionWidth=leftWidth-leftContentWidth;
//    var leftTransitionWidth=d3.select('.leftTransitionTopBarDiv').style('width').split('px')[0];
//    var ruler=d3.select('.ruler');
//    console.log(leftWidth,leftContentWidth,leftTransitionWidth);
    var fontFamily='Arial Black';
    var fontSize=16;
//    ruler.styles({
//        'font-family':'Arial Black',
//        'font-size':'16px'
//    });
    var title='Selected Papers';

    var titleHeight=title.visualHeight(fontFamily,fontSize);
    var LeftRatio=0.114;
    var titleTopRatio=0.114;
    var bodyMargin=0.03*leftWidth;

    d3.select('.NLDTitleDiv').remove();
    d3.select('.NLDTransitionDiv').remove();
    d3.select('.NLDBodyDiv').remove();
    var nodeList=d3.select('.nodeListDiv')
        .styles({
            height:'60%',
            //height:leftHeight-CSDHeight+px,
            'margin-top':leftWidth*0.05+px
        })
        //.styles({
        //    'margin-top':50+px
        //})
//        .attr('onkeydown','keyboardEvent(event.keyCode||event.which);')
//        .attr('tabindex',1);
    var leftRatio=(leftContentWidth/leftWidth)*100;
    var transitionRatio=100-leftRatio;
    var transitionMethod='-webkit-linear-gradient';
    var NLDBodyBackground=transitionBackground(transitionMethod,'left',transitionRatio,color.mainTransition1,color.mainTransition2)
    //console.log(NLDBodyBackground);
    //NLDBodyBackground='-webkit-linear-gradient(left,rgb(50,70,90) 0%,rgb(50,70,90) '+leftRatio+'%,rgb(50,70,90) '+leftRatio+'%,rgb(25,35,45) 100%)'

//  var NLDBodyBackground1='-webkit-linear-gradient(left,rgb(50,70,90) 0%,rgb(50,70,90) '+leftRatio+'%,rgb(143, 162, 168) '+leftRatio+'%,rgb(74, 90, 103) 100%)'

    var NLDTitleDiv=nodeList.append('div').attr('class','NLDTitleDiv')
        .styles({
//            float:'left',
            background:NLDBodyBackground,
//            position:'absolute',
            width:leftWidth+px,
            height:titleHeight+px
//            left:leftWidth*LeftRatio+px,
//            top:leftWidth*titleTopRatio+px
        });

    var NLDBodyDiv=nodeList.append('div').attr('class','NLDBodyDiv')
        .on('mouseover',function(){
            var thisDiv=d3.select(this);
            thisDiv.styles({
//                background:NLDBodyBackground1,
                'overflow-y':'scroll'
            });
//            console.log(thisDiv);
//            console.log(this);
        })
        .on('mouseout',function(){
            var thisDiv=d3.select(this);
            thisDiv.styles({
//                background:NLDBodyBackground,
                'overflow-y':'hidden'
            })
        })
        .styles({
//            position:'absolute',
            'overflow-y':'hidden',
            'overflow-x':'hidden',
            background:NLDBodyBackground,
            width:leftWidth+px,
            //height:leftHeight-titleHeight-CSDHeight+px
            height:'100%'
//            'margin-left':leftWidth*LeftRatio+px
//            top:leftWidth*titleTopRatio+leftWidth*0.1+px
        });

    var listData=[];
    var pageSize=50;
    if (d.nodes.length<pageSize)pageSize=d.nodes.length;
    for (var i=0;i<pageSize;i++){
        listData[i]={};
        listData[i].paperID = d.nodes[i].id;
        listData[i].paperTitle=d.nodes[i].title;
    }
    NLDTitleDiv.append('text')
        .styles({
            'margin-left':leftTransitionWidth+px,
            'font-family':'Arial Black',
            'font-size':'16px',
            'color':color.panelTitleColor
        })
        .html(title);
    for(var i= 0,length=listData.length;i<length;i++){

        var TitleDiv=NLDBodyDiv.append('div')
            .attr('class','nodeTitleDiv')
            .attr('id',function(){maxListID=i;return 'listID'+i;})
            .attr('paperID',listData[i].paperID)
            .attr('cursor','hand')
            .styles({
                width:leftWidth+px,
                height:'auto',
                background: color.mainTransition2
//                'margin-bottom':bodyMargin+px
            })
            .on('click',nodeValue);

//        .each(function(d,i){
//            if(i==0){
//                var thisDiv=d3.select(this);
//                thisDiv.attr('id','firstPaper');
//            }
//        })
//        NLDTitleDiv.append('div')
//            .styles({
//                float:'left',
//                background:'rgb(50,70,90)',
//                width:
//            })
        var textDiv=TitleDiv.append('div')
            .attr('class','leftTextDiv')
            .styles({
                float:'right',
                background:color.mainTransition2,
                width:leftContentWidth-leftTransitionWidth+px,
                'margin-top':bodyMargin/2+px,
                'margin-right':leftTransitionWidth+px
            });

        textDiv.append('text')
            .attr('class','nodeTitleText')
            .attr('style','cursor: pointer; fill: rgb(0, 0, 0);')
            .styles({

                'font-family':'Microsoft YaHei',
                'font-size':'14px',
                'color':color.panelTitleColor
            })
            .html(listData[i].paperTitle);
//        console.log(textDiv[0][0].offsetHeight);
        var transitionHeight=textDiv[0][0].offsetHeight;
        TitleDiv.styles({
            height:transitionHeight+bodyMargin+px
        })
        var transitionDiv=TitleDiv.append('div')
            .attr('class','leftTransitionDiv')
            .styles({
                float:'right',
                width:leftTransitionWidth+px,
                height:transitionHeight+bodyMargin+px,
                'background-image':'-webkit-linear-gradient(right, '+color.mainTransition2+','+color.mainTransition1+')'
            })
        if (i<length-1){
            var leftAndTransitionLineDiv=NLDBodyDiv.append('div')
                .attr('id',function(){return 'lineID'+i;})
                .styles({
                    width:leftWidth+px,
                    height:1+px
                });
            var leftLineDiv=leftAndTransitionLineDiv.append('div')
                .attr('class','leftLineDiv')
                .styles({
                    float:'right',
                    width:leftContentWidth-leftTransitionWidth+px,
                    height:1+px,
                    background:color.greyBarTransition2,
                    'margin-right':leftTransitionWidth+px
//                    'margin-bottom':bodyMargin+px
                });
            var leftTransitionLineDiv=leftAndTransitionLineDiv.append('div')
                .attr('class','leftTransitionLineDiv')
                .styles({
                    float:'right',
                    width:leftTransitionWidth+px,
                    height:1+px,
                    'background-image':'-webkit-linear-gradient(right, '+color.mainTransition2+','+color.mainTransition1+')'


                })
        }
    }

    var firstPaper=document.getElementById('listID0');
//    console.log(firstPaper.id);
    selectedID=0;
//    var firstPaper=d3.select("#firstPaper");
    firstPaper.click();
//        .on('click',nodeValue);



}
function nodeValue(d){
///*
    var that= d.that;
    var color=that.color;
    var rightContent=d3.select('.leftAndTransitionContentDiv');
    var rightWidth=rightContent.style('width').split('px')[0];
    var rightHeight=rightContent.style('height').split('px')[0];
    var marginBottom=rightWidth*0.114;
    function DivRender(){
        this.highLight=color.divRender.highlight;
        this.recovery=color.divRender.recovery;
        this.manner='';
        this.render=function(div,lineDiv){
            var styleData;
            if(this.manner=='highLight'){
                styleData=this.highLight;
            }
            else if(this.manner=='recovery'){
                styleData=this.recovery;
            }
            var titleDiv=div.select('.leftTextDiv');
            var transitionDiv=div.select('.leftTransitionDiv');
            var text=titleDiv.select('.nodeTitleText');
            text.styles({
                color:styleData.textColor
            })
            div.styles({
                background:styleData.bodyDivBackground
            });
            titleDiv.styles({
                background:styleData.titleDivBackground
            });
            transitionDiv.styles({
                'background-image':styleData.transitionDivBackground

            });
            for (var i=0;i<2;i++){
                if(lineDiv[i][0][0]){
                    var leftLine=lineDiv[i].select('.leftLineDiv');
                    var leftTransition=lineDiv[i].select('.leftTransitionLineDiv');
                    lineDiv[i].styles({
                        background:styleData.lineBackground
                    });
                    leftLine.styles({
                        background:styleData.leftLineBackground
                    });
                    leftTransition.styles({
                        'background-image':styleData.transitionLineBackground
                    })

                }
            }
        }
    }
    var render=new DivRender();

    var selectedDiv=d3.select('#listID'+selectedID);
    var selectedLine=[d3.select('#lineID'+(selectedID-1)),d3.select('#lineID'+selectedID)];
    render.manner='recovery';
    render.render(selectedDiv,selectedLine);

//        .style('background','rgb(50,70,90)')
    var thisDiv=d3.select(this);
    var paperID=thisDiv.attr('paperid');
    var url='http://'+server+':'+port+'/GetNode/';
    var success=function(data){
        //if(typeofObj(data)=='[object String]')data = JSON.parse(data);
        var paper=data;
        var id=parseInt(thisDiv.attr('id').split('D')[1]);
        var thisLine=[d3.select('#lineID'+(id-1)),d3.select('#lineID'+id)];
        render.manner='highLight';
        render.render(thisDiv,thisLine);


        selectedID=id;

//    thisDiv.style('background','#34b9f7');



//    }
//    console.log(nodes[selectedNode].nodes[thisDiv.attr('listId')]);
//    console.log(thisDiv.attr('listId'));
        d3.select('.NVDTitleDiv').remove();
        d3.select('.NVDBodyDiv').remove();
//    console.log(thisDiv);
//    var text=thisDiv.select('text');
        var title=paper.title;
        var abstract=paper.abstract;
        var authors=paper.authors;
        var year=paper.year;
        var citation=paper.citation;
        var field=paper.field;
        var venue=paper.venue;
//    console.log(title);

        var nodeValue=d3.select('.nodeValueDiv')
            .styles({
                'margin-right':rightMarginLeft+px,
                //position:'absolute',
                width:rightWidth,
                height:'100%',
                'margin-top':0+px
            });
//    var NVDTitleDiv=nodeValue.append('div').attr('class','NVDTitleDiv');
        var NVDTitleDiv=nodeValue.append('div').attr('class','NVDTitleDiv');
        NVDTitleDiv.append('text')
            .styles({
                'font-family':'Arial Black',
                'font-size':'16px',
                'color':color.panelTitleColor
            })
            .html('Selected Paper');

        var NVDBodyDiv=nodeValue.append('div').attr('class','NVDBodyDiv');
        var textList=['Title: ','Authors: ','Year: ','Citation: ','Venue: ','Abstract: '];
        var valueList=[title,authors,year,citation,venue,abstract];
        for (var i= 0,length=textList.length;i<length;i++){
            var newDiv=NVDBodyDiv.append('div')
                .attrs({
                    class:'nodeValueItemDiv'
                })
                .styles({
                    'margin-top':10+px
                })
                .append('text')
                .styles({
                    'font-family':'Arial Black',
                    'font-size':'14px',
                    'color':color.panelTitleColor
                })
                .html(textList[i]);
            newDiv.append('text')
                .styles({
                    'font-family':'Microsoft YaHei',
                    'font-size':'14px',
                    'color':color.panelTitleColor
                })
                .html(valueList[i]);
        }
        var safeHeight=rightHeight*3/5;
        var NVDHeight=d3.select('.NVDBodyDiv')[0][0].offsetHeight;
        if(NVDHeight>safeHeight){
            NVDBodyDiv.styles({
                height:'90%',
                overflow:'hidden'
            })
                .on('mouseover',function(){
                    d3.select(this).style('overflow-y','scroll');
                })
                .on('mouseout',function(){
                    d3.select(this).style('overflow','hidden');
                })
        }
    }
    var source=currentLayer.source;
    ajax(url, success,{id:paperID,source:source});

//*/
}
export {
    requestTitleList,
    processVenue,
    clusterSummary,
    nodeList,
    nodeValue
}