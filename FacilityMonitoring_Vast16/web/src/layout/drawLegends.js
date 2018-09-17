function drawLegends(){
//     var legend_g=this.legend_g;
//     var color=this.color;
//     if(!legend_g.select('#nontreeLegendText')[0][0]){
//         var svgHeight=parseFloat(d3.select('.graphDiv').select('svg').attr('height'));
//         var initY=svgHeight-95;
//         var initX=40;
//         var legendData=[
//             {
//                 class:'legend',
//                 id:0,
//                 type:'image',
//                 x:initX+10,
//                 y:initY,
//                 width:20,
//                 height:20,
//                 link:'image/star.png',
//                 text:'Influencer'
//             },
//             {
//                 class:'legend',
//                 id:1,
//                 type:'circle',
//                 x:initX+10,
//                 y:initY+30,
//                 r:10,
//                 fill:color.nodeColor,
//                 text:'Cluster'
//             },
//             {
//                 class:'legend',
//                 id:2,
//                 type:'path',
//                 d:'M'+initX+' '+(initY+60)+'L'+(initX+50)+' '+(initY+60),
//                 dash:false,
//                 stroke:color.edgeColor,
//                 opacity:1,
//                 strokeWidth:3+px,
//                 text:'Tree Edges',
//                 textX:initX+64,
//                 textY:initY+65,
//                 textColor:color.nodeLabelColor
//             },
//             {
//                 class:'legend',
//                 id:3,
//                 type:'path',
//                 d:'M'+initX+' '+(initY+85)+'L'+(initX+50)+' '+(initY+85),
//                 dash:true,
//                 stroke:color.edgeColor,
//                 opacity:1,
//                 disableOpacity:0.2,
//                 strokeWidth:3+px,
//                 text:'Nontree Edges',
//                 textX:initX+64,
//                 textY:initY+90,
//                 textColor:color.textDisableColor
//             }
//         ]
//         legend_g.selectAll('whatever')
//             .data(legendData)
//             .enter()
//             .append('g')
//             .each(function(d){
//                 var thisG=d3.select(this)
//                 thisG.attrs({
//                     id:d.class+d.id,
//                     class:d.class+'G'
//                 });
//                 switch (d.type){
//                     case 'image':{
//                         thisG.append('image')
//                             .attrs({
//                                 x:d.x-10,
//                                 y:d.y-10,
//                                 height:d.height,
//                                 width:d.width,
//                                 'xlink:href':d.link
//                             });
//                         thisG.append('text')
//                             .attrs({
//                                 x:d.x+20,
//                                 y:d.y+5
//                             })
//                             .styles({
//                                 fill:color.nodeLabelColor,
//                                 'font-family':'Arial'
//                             })
//                             .html(d.text)
//                         return 1
//                     }
//                     case 'circle':{
//                         thisG.append('circle')
//                             .attrs({
//                                 cx:d.x,
//                                 cy:d.y,
//                                 r:d.r
//                             })
//                             .styles({
//                                 fill:d.fill
//                             });
//                         thisG.append('text')
//                             .attrs({
//                                 x:d.x+20,
//                                 y:d.y+5
//                             })
//                             .styles({
//                                 fill:color.nodeLabelColor,
//                                 'font-family':'Arial'
//                             })
//                             .html(d.text)
//                         return 1
//                     }
//                     case 'path':{
//                         thisG.append('path')
//                             .attrs({
//                                 class:function(d){return d.class;},
//                                 id:function(d){if(d.dash)return 'nontreeLegend';else return 'treeLegend'},
//                                 d:d.d
//                             })
//                             .styles({
//                                 stroke:d.stroke,
//                                 'stroke-width': d.strokeWidth,
// //                                'stroke-dasharray':function(d){
// //                                    if(d.dash){
// //                                        return 5.5
// //                                    }
// //                                },
//                                 opacity:function(d){
//                                     if(d.dash){
//                                         return d.disableOpacity
//                                     }
//                                     else{
//                                         return d.opacity
//                                     }
//                                 },
//                                 cursor:function(d){
//                                     if(d.dash){
//                                         return 'hand'
//                                     }
//                                 }
//                             })
//                             .each(function(d){
//                                 var thisEdge=d3.select(this);
//                                 var marker=thisG.append("svg:defs")
//                                     .append("svg:marker")
//                                     .attr("id", 'legendMarker')
//                                     .attr('class','legend')
//                                     .attr("viewBox", "0 0 10 10")
//                                     .attr("refX", 0)
//                                     .attr("refY", 4)
//                                     .attr("markerWidth", 4)
//                                     .attr("markerHeight", 4)
//                                     .attr("orient", 'auto')
//                                     .append("svg:path")
//                                     .attr('class','legend')
//                                     .attr("d", "M0,0 L0,8 L8,4 L0,0")
//                                     .style("fill",color.edgeColor);
//                                 thisEdge.attr('marker-end','url(#legendMarker)')
//                             });
//                         thisG.append('text')
//                             .attrs({
//                                 id:function(d){if(d.dash)return 'nontreeLegendText';else return 'treeLegendText'},
//                                 x:d.textX,
//                                 y:d.textY
//                             })
//                             .styles({
//                                 fill:function(d){
//                                     return d.textColor
//                                 },
//                                 'font-family':'Arial',
//                                 cursor:function(d){
//                                     if(d.dash){
//                                         return 'hand'
//                                     }
//                                 }
//                             })
//                             .on('click',function(d){
//                                 if(d.dash){
//
//                                     changeNonTreeEdges();
//                                     var thisLegend=d3.select('#nontreeLegendText');
//                                     thisLegend.styles({
//                                         fill:function(d){
//                                             if(d.textColor==color.textDisableColor){
//                                                 d.textColor=color.nodeLabelColor;
//                                                 return d.textColor;
//                                             }
//                                             else {
//                                                 d.textColor = color.textDisableColor;
//                                                 return d.textColor;
//                                             }
//                                         }
//                                     })
//                                 }
//                             })
//                             .html(d.text)
//                         return 1
//                     }
//                 }
//             })
//     }

}
function changeNonTreeEdges(){
    if(optionNumber.edgeFilter==0){
        optionNumber.edgeFilter=1;
        d3.select('.edgeField').selectAll('path')
            .each(function(d){
                if(d.edgeType=='dash'){
                    d3.select(this).styles({
                        visibility:'visible'
                    })
                }
            })
    }
    else{
        optionNumber.edgeFilter=0;
        d3.select('.edgeField').selectAll('path')
            .each(function(d){
                if(d.edgeType=='dash'){
                    d3.select(this).styles({
                        visibility:'hidden'
                    })
                }
            })
    }
}

export {drawLegends,changeNonTreeEdges}