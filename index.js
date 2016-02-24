#!/usr/bin/env node

const program = require('commander');
const _ = require('lodash');
const alltomp3 = require('alltomp3');
const ProgressBar = require('progress');
const chalk = require('chalk');
const tabtab = require('tabtab');
const request = require('request');
const fs = require('fs');

var commandName = 'alltomp3';

if(process.argv.slice(2)[0] === 'completion') return tabtab.complete(commandName, function(err, data) {
    if(err || !data) return;

    var query = _.trim(data.line.replace(commandName, '').replace(/[\\]/g, ''));
    var last = data.line.split(/[^\\] /);
    last = last[last.length-1];
    var requestSuggest = request({
        url: 'http://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=firefox&q=' + encodeURIComponent(query),
        json: true
    }, function(error, response, results) {
        if (results.length == 2) {
            var out = _.map(results[1], function (s) {
                return last.replace(/[\\]/g, '') + s.replace(query, '');
            });
            tabtab.log(out, data);
        }
    });
});

program
    .version('0.0.1')
    .usage('<request ...>')
    .parse(process.argv);

var query = _.join(program.args, ' ');

var lastProgress = 0;
var lastInfos = chalk.bold.white(query);

var dl = alltomp3.findAndDownload(query, "./", function (infos) {
    console.log("\n");
    console.log("File downloaded: " + chalk.bold.yellow(infos.file));
});
dl.on('search-end', function() {

});
dl.on('download', function(infos) {
    bar.tick(infos.progress - lastProgress, {
        operation: chalk.blue("Downloading"),
        infos: lastInfos
    });
    lastProgress = infos.progress;
});
dl.on('download-end', function() {
    lastProgress = 0;
});
dl.on('convert', function(infos) {
    bar.tick(infos.progress - lastProgress, {
        operation: chalk.magenta("Converting"),
        infos: lastInfos
    });
    lastProgress = infos.progress;
});
dl.on('convert-end', function() {

});
dl.on('infos', function(infos) {
    lastInfos = chalk.bold.white(infos.title + ' - ' + infos.artistName);
});

var barOpts = {
    width: 50,
    total: 200,
    clear: true
};
var bar = new ProgressBar(':operation :infos [:bar] :percent :etas', barOpts);

bar.tick(0, {
    operation: chalk.green("Searching"),
    infos: lastInfos
});
