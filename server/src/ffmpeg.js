const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const HLS_TIME = 10;

async function convertToHLS(input, output, resolution) {
	return new Promise((resolve, reject) => {
		const outputDir = path.dirname(output);
		ffmpeg(input, { timeout: 432000 }).addOptions([
			'-profile:v baseline',
			'-level 3.0',
			`-s ${resolution}`,
			'-start_number 0',
			`-hls_time ${HLS_TIME}`,
			'-hls_list_size 0',
			'-f hls'
		]).output(`${outputDir}/output.m3u8`).on('end', () => {
			resolve();
		}).run();
	});
}

module.exports = {
	convertToHLS
}
