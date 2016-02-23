#!/usr/bin/env node

const program = require('commander');
const _ = require('lodash');
const alltomp3 = require('alltomp3');
const ProgressBar = require('progress');
const chalk = require('chalk');

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
