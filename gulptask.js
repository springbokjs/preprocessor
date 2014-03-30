var through = require('through2');
var gutil = require('gulp-util');
var preprocessorCreator = require('./index');

module.exports = function (type, pathResolver, defines, isBrowser) {
    var preprocessor = preprocessorCreator(type, pathResolver);

    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit(
                'error',
                new gutil.PluginError('springbokjs-preprocessor', 'Streaming not supported')
            );
            return cb();
        }

        options.filename = options.filename || file.path;
        try {
            var contents = file.contents.toString();
            file.contents = new Buffer(preprocessor(defines, contents, isBrowser, file.path, callback));
        } catch (err) {
            this.emit('error', new gutil.PluginError('springbokjs-preprocessor', err.toString()));
        }

        this.push(file);
        cb();
    });
};