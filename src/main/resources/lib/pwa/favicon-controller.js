var mustache = require('/lib/mustache');

exports.get = function (req) {
    var res = mustache.render(resolve('../../assets/icons/favicon.ico'), {});

    return {
        body: res,
        contentType: 'image/x-icon',
        postProcess: false
    };
};
