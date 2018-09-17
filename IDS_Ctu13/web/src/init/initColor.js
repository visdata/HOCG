function initColor(colorStyle){
    var color={};
    //this color style is dark
    if(colorStyle=='dark'){
        color.titleTextColor='rgb(25,114,165)';
        color.titleDivColor='rgb(140,160,170)';

//        color.authorDivColor='rgb(50,70,90)';
//        color.authorDivColor='rgb(15,40,60)';
        color.authorDivColor='rgb(140,160,170)';

        color.mainTransition1='rgb(25,35,45)';
        color.mainTransition2='rgb(50,70,90)';

        color.whiteBarTransition1='rgb(127,127,127)';
        color.whiteBarTransition2='rgb(255,255,255)';

        color.greyBarTransition1='rgb(74, 90, 103)';
        color.greyBarTransition2='rgb(140, 160, 170)';

        color.optionTextColor='white';
        color.screenTextColor='white';
        color.nodeLabelColor='black';
        color.panelTitleColor='white';
        color.nodeLabelHighlightColor='rgb(255, 140, 0)';
        color.nodeLabelHighlightStroke='red';

        color.svgColor='rgb(15,40,60)';
//        color.axisSVGColor='rgb(140,160,170)';
        color.nodeColor ='rgb(70,190,210)';
        //color.nodeColor ='red';
        color.nodeHighlightColor='white';
        //color.nodeHighlightColor='red';
        color.nodeGreyColor ='rgb(190,200,200)';
        //color.nodeGreyColor ='rgb(255,20,147)';
        //color.nodeHighlightStroke='red';
        color.nodeHighlightStroke='rgb(255, 140, 0)';//node highlight
        //color.edgeColor='rgb(8,52,123)';
        //color.edgeColor='rgb(100,100,100)';// edge color
        //color.edgeColor='rgb(255,137,137)';
        //color.edgeColor='deepgrey';
        color.edgeColor='rgb(165,165,165)';// edge color

        color.edgeHightLightColor='rgb(255, 140, 0)';// edge highlight

        color.sizeLabelColor='black';

        color.yearSliderHighlightColor='red';
        color.yearSliderColor='rgb(40,120,200)';
        color.axisTickColor='rgb(15,40,60)';
        color.axisColor='rgb(15,40,60)';
        color.yearPathColor='rgb(15,40,60)';
        color.yearPathHighlightColor='white';
        color.yearPathHighLightStroke='red';

        color.valuePoint='blue';
        color.valuePointHighlight='red';
        color.dashLineColor='black';
        color.buttonHighlight='rgb(75,164,214)';
        color.buttonLight='rgb(153,211,248)';

        color.textDisableColor='grey';

        color.buttonStyle={
            on:{
                div:'rgb(185,200,200)',
                text:'rgb(10,40,60)'
            },
            off:{
                div:'rgb(50,70,90)',
                text:'rgb(135,155,165)'
            }
        }


        color.divRender={};
        color.divRender.highlight={
            textColor:'rgb(16,38,51)',
            bodyDivBackground:color.greyBarTransition2,
            titleDivBackground:color.greyBarTransition2,
            transitionDivBackground:'-webkit-linear-gradient(right, '+color.greyBarTransition2+','+color.greyBarTransition1+')',
            lineBackground:color.greyBarTransition2,
            leftLineBackground:color.greyBarTransition2,
            transitionLineBackground:'-webkit-linear-gradient(right, '+color.greyBarTransition2+','+color.greyBarTransition1+')'
        };
        color.divRender.recovery={
            textColor:'white',
            bodyDivBackground:color.mainTransition2,
            titleDivBackground:color.mainTransition2,
            transitionDivBackground:'-webkit-linear-gradient(right, '+color.mainTransition2+','+color.mainTransition1+')',
            lineBackground:color.mainTransition2,
            leftLineBackground:color.greyBarTransition2,
            transitionLineBackground:'-webkit-linear-gradient(right, '+color.mainTransition2+','+color.mainTransition1+')'
        };
    }
    else if(colorStyle=='light'){
        color.titleTextColor='rgb(26,48,72)';
        color.titleDivColor='rgb(170,190,200)';

        //color.authorDivColor='rgb(50,70,90)';
        color.authorDivColor='rgb(216,235,241)';
        color.svgColor='rgb(255,255,255)';
//        color.axisSVGColor='rgb(140,160,170)'


        color.mainTransition1='rgb(160,170,180)';
        color.mainTransition2='rgb(216,235,240)';

        color.whiteBarTransition1='rgb(180,180,180)';
        color.whiteBarTransition2='rgb(255,255,255)';

        color.greyBarTransition1='rgb(140, 155, 160)';
        color.greyBarTransition2='rgb(200, 220, 225)';

        color.optionTextColor='rgb(15,40,60)';
        color.screenTextColor='rgb(15,40,60)';
        color.nodeLabelColor='black';
        color.panelTitleColor='rgb(15,40,60)';
        color.nodeLabelHighlightColor='red';
        color.nodeLabelHighlightStroke='red';


        color.nodeColor ='rgb(70,190,210)';//blue
        color.nodeHighlightColor='rgb(50,70,90)';//deepgray
        color.nodeGreyColor ='rgb(150,240,250)';//lightblue

        color.nodeHighlightStroke='red';
//        color.edgeColor='yellow';
//        color.edgeColor='rgb(102,194,165)';
//        color.edgeColor='rgb(252,141,98)';
//        color.edgeColor='rgb(31,120,180)';
        color.edgeColor='rgb(190,186,218)';
//        color.edgeColor='rgb(255,255,179)';
        color.edgeHightLightColor='red';

        color.sizeLabelColor='white';

        color.yearSliderHighlightColor='red';
        color.yearSliderColor='rgb(40,120,200)';
        color.axisTickColor='rgb(15,40,60)';
        color.yearPathColor='rgb(140,160,160)';
        color.yearPathHighlightColor='white';
        color.yearPathHighLightStroke='red';

        color.textDisableColor='grey';

        color.buttonStyle={
            on:{
                div:'rgb(60,100,120)',
                text:'rgb(255,255,255)'
            },
            off:{
                div:'rgb(140,160,170)',
                text:'rgb(60,90,110)'
            }
        }


        color.divRender={};
        color.divRender.highlight={
            textColor:'rgb(16,38,51)',
            bodyDivBackground:color.greyBarTransition2,
            titleDivBackground:color.greyBarTransition2,
            transitionDivBackground:'-webkit-linear-gradient(left, '+color.greyBarTransition2+','+color.greyBarTransition1+')',
            lineBackground:color.greyBarTransition2,
            leftLineBackground:color.greyBarTransition2,
            transitionLineBackground:'-webkit-linear-gradient(left, '+color.greyBarTransition2+','+color.greyBarTransition1+')'
        };
        color.divRender.recovery={
            textColor:'black',
            bodyDivBackground:color.mainTransition2,
            titleDivBackground:color.mainTransition2,
            transitionDivBackground:'-webkit-linear-gradient(left, '+color.mainTransition2+','+color.mainTransition1+')',
            lineBackground:color.mainTransition2,
            leftLineBackground:color.greyBarTransition2,
            transitionLineBackground:'-webkit-linear-gradient(left, '+color.mainTransition2+','+color.mainTransition1+')'
        };
    }
    return color;
}
export {initColor};