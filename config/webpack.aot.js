//var webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { merge } = require("webpack-merge");
const AngularCompilerPlugin = require("@ngtools/webpack").AngularCompilerPlugin;
const commonConfig = require("./webpack.common.js");
const helpers = require("./helpers");
var path = require('path');

/* var aotPlugin = new AotPlugin({
    tsConfigPath: 'tsconfig.aot.json',
    entryModule: helpers.root('src/angular/app/app.module#AppModule')
}); */

module.exports = merge(commonConfig, {
    mode: "development",

    entry: {
        vendor: "./src/angular/vendor.aot.ts",
        app: "./src/angular/main.aot.ts",
    },

    optimization: {
        minimize: false,
        splitChunks: {
            chunks: 'all'
        }
    },

    output: {
        path: path.resolve(__dirname, "build/resources/main/assets"),
        publicPath: "assets/",
        filename: "js/[name].js",
        chunkFilename: "js/[id].chunk.js",
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [{
                    loader: "@ngtools/webpack",
                }]
            },
        ],
    },

    plugins: [
        new AngularCompilerPlugin({
            tsConfigPath: "tsconfig.aot.json",
            entryModule: helpers.root("src/angular/app/app.module#AppModule"),
        }),
        new HtmlWebpackPlugin({
            template: "src/main/resources/site/pages/pwa/pwa.ejs",
            filename: "../site/pages/pwa/pwa.html",
            chunks: ["app", "vender"],
        }),
    ],
});

// Fix for AotPlugin Error: Cannot read property 'getSourceFile' of undefined
// https://github.com/angular/angular-cli/issues/5329?platform=hootsuite
/*aotPlugin._compilerHost._resolve = function (path_to_resolve) {
    path_1 = require("path");
    path_to_resolve = aotPlugin._compilerHost._normalizePath(path_to_resolve);
    if (path_to_resolve[0] == '.') {
        return aotPlugin._compilerHost._normalizePath(path_1.join(aotPlugin._compilerHost.getCurrentDirectory(), path_to_resolve));
    }
    else if (path_to_resolve[0] == '/' || path_to_resolve.match(/^\w:\//)) {
        return path_to_resolve;
    }
    else {
        return aotPlugin._compilerHost._normalizePath(path_1.join(aotPlugin._compilerHost._basePath, path_to_resolve));
    }
};*/
