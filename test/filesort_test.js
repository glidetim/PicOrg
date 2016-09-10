//
// TEST for Filesort
//
var filesortUtil = require("./../filesort_util.js");
var assert = require("assert");


describe ("Filesort Util Unit Tests", function() {

	describe ("ValidateAgainstFilename", function() {
		it ("should extract the month and date from the filename in the form IMG_yyyymmdd_...", function() {
			var fileObj = {
					file: "IMG_20151203_otherstuff.gif",
					year: "2014",
					month: "November"
			}
			filesortUtil.validateAgainstFilename(fileObj);
			assert.equal(fileObj.year, "2015");
			assert.equal(fileObj.month, "December");
		});
		it ("should extract the month and date from the filename in the form VID_yyyymmdd_...", function() {
			var fileObj = {
					file: "VID_20151203_otherstuff.gif",
					year: "2014",
					month: "November"
			}
			filesortUtil.validateAgainstFilename(fileObj);
			assert.equal(fileObj.year, "2015");
			assert.equal(fileObj.month, "December");
		});
		it ("should not extract an illegal month", function() {
			var fileObj = {
					file: "IMG_20151403_otherstuff.gif",
					year: "2014",
					month: "November"
			}
			filesortUtil.validateAgainstFilename(fileObj);
			assert.equal(fileObj.year, "2014");
			assert.equal(fileObj.month, "November");
		});
		it ("should not extract an illegal year", function() {
			var fileObj = {
					file: "IMG_15341403_otherstuff.gif",
					year: "2014",
					month: "November"
			}
			filesortUtil.validateAgainstFilename(fileObj);
			assert.equal(fileObj.year, "2014");
			assert.equal(fileObj.month, "November");
		});
		it ("should extract month and date in the form yyyymmdd_...", function() {
			var fileObj = {
					file: "20150803_otherstuff.gif",
					year: "2014",
					month: "November"
			}
			filesortUtil.validateAgainstFilename(fileObj);
			assert.equal(fileObj.year, "2015");
			assert.equal(fileObj.month, "August");
		});
	});


});
