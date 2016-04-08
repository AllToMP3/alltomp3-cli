#!/usr/bin/env node

const program = require('commander');
const _ = require('lodash');
const alltomp3 = require('alltomp3');
const ProgressBar = require('progress');
const chalk = require('chalk');
const tabtab = require('tabtab');
const request = require('request');
const fs = require('fs');
const maxSimultaneous = 4; // maximum number of parallel convertions

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

var dl;
var queryType = alltomp3.typeOfQuery(query);

if (queryType == 'playlist-url') {
    dl = alltomp3.downloadPlaylist(query, './', function(infos, error) {

    }, maxSimultaneous);

    function getName(infos) {
        var out = '';
        if (infos.infos && infos.infos.title) {
            out += infos.infos.title;
        } else if (infos.title) {
            out += infos.title;
        }

        if (infos.artistName || (infos.infos && infos.infos.artistName)) {
            if (out) {
                out += ' - ';
            }
            if (infos.infos && infos.infos.artistName) {
                out += infos.infos.artistName;
            } else {
                out += infos.artistName;
            }
        }

        return chalk.bold.white(out);
    }

    var barInfos = {
        downloadi: 0,
        downloadt: '',
        converti: 0,
        convertt: '',
        toti: 0
    };
    var urls;

    dl.on('download', function(index) {
        if (!urls[index].progress.lastdownload) {
            urls[index].progress.lastdownload = 0;
        }
        barInfos.downloadt = getName(urls[barInfos.downloadi-1]);
        bar.tick((urls[index].progress.download.progress - urls[index].progress.lastdownload)/barInfos.toti, barInfos);
        urls[index].progress.lastdownload = urls[index].progress.download.progress;
    });
    dl.on('download-end', function() {

    });
    dl.on('convert', function(index) {
        if (!urls[index].convertStarted) {
            urls[index].convertStarted = true;
            barInfos.converti++;
        }
        if (!urls[index].progress.lastconvert) {
            urls[index].progress.lastconvert = 0;
        }
        barInfos.convertt = getName(urls[barInfos.converti-1]);
        bar.tick((urls[index].progress.convert.progress - urls[index].progress.lastconvert)/barInfos.toti, barInfos);
        urls[index].progress.lastconvert = urls[index].progress.convert.progress;
    });
    dl.on('convert-end', function(index) {

    });
    dl.on('error', function(index) {

    });
    dl.on('infos', function(index) {

    });
    dl.on('list', function(urlss) {
        urls = urlss;
        barInfos.toti = urls.length;
        barInfos.totii = urls.length;
    });
    dl.on('begin-url', function(index) {
        barInfos.downloadi++;
    });
    dl.on('end-url', function(index) {

    });

    var barOpts = {
        width: 50,
        total: 200,
        clear: true
    };
    var bar = new ProgressBar(chalk.blue('Downloading') + ' :downloadi/:toti :downloadt\n' + chalk.magenta('Converting') + ' :converti/:totii :convertt\n[:bar] :percent :etas', barOpts);

    bar.tick(0, {
        downloadi: '?',
        downloadt: '',
        converti: '?',
        convertt: '',
        toti: '?',
        totii: '?'
    });
} else {
    if (queryType == 'text') {
        dl = alltomp3.findAndDownload(query, "./", function (infos, error) {
            if (error !== undefined) {
                bar.tick(200);
                console.log(chalk.bold.red(error));
                return;
            }
            console.log("\n");
            console.log("File downloaded: " + chalk.bold.yellow(infos.file));
        });
    } else {
        dl = alltomp3.downloadAndTagSingleURL(query, "./", function (infos) {
            console.log("\n");
            console.log("File downloaded: " + chalk.bold.yellow(infos.file));
        });
    }

    var lastProgress = 0;
    var lastInfos = chalk.bold.white(query);

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
    dl.on('error', function() {

    });

    var barOpts = {
        width: 50,
        total: 200,
        clear: true
    };
    var bar = new ProgressBar(':operation :infos \n[:bar] :percent :etas', barOpts);

    bar.tick(0, {
        operation: chalk.green("Searching"),
        infos: lastInfos
    });
}
