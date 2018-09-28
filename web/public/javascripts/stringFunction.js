var px='px';
String.prototype.visualLength = function(fontFamily,fontSize){
    var ruler = d3.select('#ruler');
    ruler.styles({
        'font-family':fontFamily,
        'font-size':fontSize+px
    });
    ruler.text(this);
    if(ruler._groups[0][0]){
        var width=ruler._groups[0][0].offsetWidth;
        ruler.text('');
        return width;
    }
};
String.prototype.visualHeight = function(fontFamily,fontSize){
    var ruler = d3.select('#ruler');
    ruler.styles({
        'font-family':fontFamily,
        'font-size':fontSize+px
    });
    ruler.text(this);
    if(ruler._groups[0][0]){
        var height=ruler._groups[0][0].offsetHeight;
        ruler.text('');
        return height;
    }
};
String.prototype.toFloat=function(){
    return parseFloat(this);
};
String.prototype.toInt=function(){
    return parseInt(this);
};