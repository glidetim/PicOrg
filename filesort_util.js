
//
// FILESORT_UTIL.JS
//

var fs = require("fs.extra");
var async = require("async");
var mv = require("mv");


function validateAgainstFilename(fileObj) {

	var month, year;
	var months = [	"January", "February", "March", "April", "May", "June",
					"July", "August", "September", "October", "November", "December"];

	// too short
	if (fileObj.file.length < 9) {
		return;
	}
	// check for yyyymmdd_
	var prefix = fileObj.file.slice(0,fileObj.file.lastIndexOf("_"));

	// check for variant IMG_yyyymmdd or VID_yyymmdd
	if (prefix.slice(0,4)==="IMG_" || prefix.slice(0,4)==="VID_") {
		prefix = prefix.slice(4);
	}
	if (prefix.length != 8) {
		return;
	}

	year = parseInt(prefix.slice(0, 4));
	month = parseInt(prefix.slice(4,6));

	if (year > 1995 && year < 2050 && month >= 1 && month <= 12) {
		fileObj.year = year.toString();
		fileObj.month = months[month-1];
		return;
	}
	return;
}
// doMove means mv, not cp
//
function copyFilesToNewLocation(files, options, stats, cfCallback) {

	// loop through all files, and copy from old location (stored in file record) to 
	// new location which is path/year/month.  Check for existence of directory to create it
	// if needed
			

	function postProcess(fullPath, err, callback) {
		if (err) {
			console.log(fullPath + " :: " + err);
			stats.notCopied++;
		} else {
			stats.copied++;
		}
		callback(err);
		return;
	}

	var q = async.queue(function(task, callback) {

		checkCreateDirSync(task.yearDir);
		checkCreateDirSync(task.monthDir);
		process.stdout.write (".");

		if (options.moveNotCopy) {
			mv(task.file.fullPath, task.monthDir + task.filename, {mkdirp:true, clobber:options.forceCopy}, function(err) {
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

			var yearDir = options.path + "/" + file.year;
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

module.exports.validateAgainstFilename = validateAgainstFilename;
module.exports.checkCreateDirSync = checkCreateDirSync;
module.exports.copyFilesToNewLocation = copyFilesToNewLocation;
