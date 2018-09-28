var webpack = require('webpack');
var path = require('path');
var fs=require('fs');
var async=require('async');
var publicPath = 'http://localhost:3001/anomaly/';
var hotMiddlewareScript = 'webpack-hot-middleware/client?reload=true';

var devConfig = {
    entry: {
        "start":["./src/init/start.js","webpack-hot-middleware/client?reload=true"]
        //"event":["./event/controlDivEvents.js","./event/doubleClickEvent.js","./event/dragEvent.js","./event/infoDivEvents.js","./event/reverse.js","./event/yearSliderDragEvent.js","webpack-hot-middleware/client?reload=true"],
        //"class":["./class/directedGraph.js","webpack-hot-middleware/client?reload=true"],
        //"animation":["./animation/animateMode.js","./animation/animationControl.js","webpack-hot-middleware/client?reload=true"],
        //"init":["./src/init/init.js","./src/init/initColor.js","webpack-hot-middleware/client?reload=true"],
        //"initColor":["./src/init/initColor.js","webpack-hot-middleware/client?reload=true"]
        //"layout":["./layout/clickFunction.js","./layout/drawBackgroundYear.js","./layout/drawEdges.js","./layout/drawLabels.js","./layout/drawLegends.js","./layout/drawNodes.js","./layout/drawSize.js","./layout/drawYearAxis.js","./layout/graphLayout.js","./layout/graphLayout_backup.js","./layout/relayout.js","./layout/slider.js","webpack-hot-middleware/client?reload=true"],
        //"modifyLabel":["./modifyLabel/modifyLabel.js","webpack-hot-middleware/client?reload=true"],
        //"math":["./math/mathFunction.js","webpack-hot-middleware/client?reload=true"],
        //"searchInteraction":["./searchInteraction/layout.js","webpack-hot-middleware/client?reload=true"],
        //"processData":["./src/processData/calculateFlowMap.js","./src/processData/calculateLayout.js","./src/processData/getDIC.js","./src/processData/incrementalTree.js","./src/processData/linkPruning.js","./src/processData/processData.js","./src/processData/request.js","./src/processData/temporalSummarization.js","webpack-hot-middleware/client?reload=true"],
        //"setting":["./setting/layoutSetting.js","./setting/server.js","webpack-hot-middleware/client?reload=true"],
        //"citation":["./pageInit/citation.js",hotMiddlewareScript],
        //"graph":["./pageInit/graph.js",hotMiddlewareScript],
        //"index":["./pageInit/index.js",hotMiddlewareScript],
        //"result":["./pageInit/result.js",hotMiddlewareScript],
        //"venuelist":["./pageInit/venuelist.js",hotMiddlewareScript],
        //"venuepapers":["./pageInit/venuepapers.js",hotMiddlewareScript]
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname,'eiffel/'),
        publicPath: publicPath
    },
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }]
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ]
};

module.exports = devConfig;