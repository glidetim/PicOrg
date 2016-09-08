
//
// FILESORT.JS
//
// Script to organize files on your operating system.  given a source directory and a destination directory,
// this will copy or move all the files form source into the destination and place them in folders based
// on year and month
//
// - 2015
// ---- January
// ---- February
// - 2011
// ---- November
// ---- December
//
// Only creates folders as needed. 
// 
// Command Line options
//
// --srcdir <full path to source directory>
// --destdir <full path to destination directory>
// --picdir <relative path based on the base directory in the source code below (argv.picdir)
// -m  indicates move files instead of copying (file is moved, and does not remain in original directory). Default is to copy.
// -f  indicates to overwrite existing files of the same name.  Default is to not copy over existing files with the same name.


var fs = require("fs.extra");

var _ = require("underscore");
var async = require("async");
var moment = require("moment");
var argv = require("minimist")(process.argv.slice(2));
var mv = require("mv");

var ROOTPATH = "C:/Users/Tim/Pictures/TestFileSort";
var NEW_PATH = "C:/Users/Tim/Pictures/Auto-Organized";
var DO_MOVE = false;
var FORCE_COPY = false;

if (argv.picdir) {
	ROOTPATH = "C:/Users/Tim/Pictures/" + argv.picdir;
}
if (argv.srcdir) {
	ROOTPATH = argv.srcdir;
}
if (argv.destdir) {
	NEW_PATH = argv.destdir;
}
if (argv.m) {
	DO_MOVE = true;
}
if (argv.f) {
	FORCE_COPY = true;
}

var PROCESSING = {};
var FILE_RECORDS = [];

var STATS = {
	candidates: 0,
	copied: 0,
	notCopied: 0
}

// start the party
checkCreateDirSync(NEW_PATH);
processDirectory(ROOTPATH);
var globalTimer = setInterval(checkComplete, 200);

function checkComplete() {

	if (Object.keys(PROCESSING).length == 0) {
		clearInterval(globalTimer);
		console.log(FILE_RECORDS.length + " files ready to process");
		STATS.candidates = FILE_RECORDS.length;
		console.log("Copying Files...");
		//
		// copy files to new directories
		copyFilesToNewLocation(NEW_PATH, FILE_RECORDS, DO_MOVE, function(err) {
			if (err) {
				console.log("A file failed to copy, aborted. ERR=" + err);
				process.exit(2);
			} else {
				console.log("\nSUCCESS, " + STATS.copied + " files copied, " + STATS.notCopied + " files not copied/ignored");
				process.exit(0);
			}
		});
	} else {
		console.log("still working...");
	}
}

function processDirectory(dir) {

	if (dir === NEW_PATH) {
		console.log("Source Directory is same as destination directory.  Ignoring");
	} else {
		PROCESSING[dir] = "processing";
		_processDirectory(dir, function(err, data) {
			console.log("");
			console.log("Directory: " + dir + " processed successfully");
			console.log("Created " + data.length + " records");

			FILE_RECORDS = FILE_RECORDS.concat(data);
			delete PROCESSING[dir];
		});
	}	
}

function _processDirectory(dir, pdCallback) {

	console.log ("Reading Directory: " + dir);
	var timer = setInterval(function(){process.stdout.write(".");}, 500);

	fs.readdir(dir, function(err, files) {
	    if (err) {
	        console.log ("Error reading directory: " + dir);
	        console.log(err);
	        process.exit(1);
	    }

	    clearInterval(timer);

	    console.log(files.length + " files found");
	    console.log("Processing Files");

	    async.map(files, function(file, callback) {

	    	var fileObj = {};
	    	fileObj.fullPath = dir + "/" + file;

			fs.stat(fileObj.fullPath, function(err, stats) {
				if (stats.isDirectory()) {
					//
					// don't copy the destination directory
					if (fileObj.fullPath !== NEW_PATH) {
						processDirectory(fileObj.fullPath);
					} else {
						console.log ("Found destination path in source path, ignoring");
					}
					callback(null, null);  // turn directory into NULL
				} else if (stats.isFile()) {
					fileObj.year = moment(stats.mtime).format("YYYY");
					fileObj.month = moment(stats.mtime).format("MMMM");
					callback(null, fileObj);
					return;
				} else {
					callback(null, null);
					return;
				}	
			});
	    }, function(err, results) {
	    	pdCallback(err, results)
	    });
	});
}	

// doMove means mv, not cp
//
function copyFilesToNewLocation(path, files, doMove, cfCallback) {

	// loop through all files, and copy from old location (stored in file record) to 
	// new location which is path/year/month.  Check for existence of directory to create it
	// if needed
			

	function postProcess(fullPath, err, callback) {
		if (err) {
			console.log(fullPath + " :: " + err);
			STATS.notCopied++;
		} else {
			STATS.copied++;
		}
		callback(err);
		return;
	}

	var q = async.queue(function(task, callback) {

		checkCreateDirSync(task.yearDir);
		checkCreateDirSync(task.monthDir);
		process.stdout.write (".");

		if (doMove) {
			mv(task.file.fullPath, task.monthDir + task.filename, {mkdirp:true, clobber:FORCE_COPY}, function(err) {
				return postProcess(task.file.fullPath, err, callback);
			});
		} else {
			fs.copy(task.file.fullPath, task.monthDir + task.filename, function(err) {
				return postProcess(task.file.fullPath, err, callback);
			});
		};

	}, 100);

	q.drain = function() {
		cfCallback(null);
	}

	files.forEach(function(file) {
		// ignore null entries
		if (file) {

			var yearDir = path + "/" + file.year;
			var monthDir = yearDir + "/" + file.month;
			var filename = file.fullPath.slice(file.fullPath.lastIndexOf("/"));
			var jobObject = {
				yearDir: yearDir,
				monthDir: monthDir,
				filename: filename,
				file: file
			};

			q.push(jobObject, function(err) {

			});
		}
	});
}


function checkCreateDirSync(path) {

	try {
		return fs.statsSync(path).isDirectory();
	} catch(e) {
		//
		// create the directory
		try {
			return fs.mkdirSync(path);
		} catch(e) {
			return false;
		}	
	}	

}