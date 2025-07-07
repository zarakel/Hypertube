require('dotenv').config();
const torrentStream = require('torrent-stream');
const path = require('path');
const express = require('express');
const router = express.Router();

const IS_PROD = process.env.NODE_ENV === 'production';
const VIDEO_NAMES_TO_MAGNET_URIS = {
	"bigBuckBunny": 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent',
	"cosmos": 'magnet:?xt=urn:btih:c9e15763f722f23e98a29decdfae341b98d53056&dn=Cosmos+Laundromat&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fcosmos-laundromat.torrent',
	"sintel": 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent',
	"tears": 'magnet:?xt=urn:btih:209c8226b299b308beaf2b9cd3fb49212dbd13ec&dn=Tears+of+Steel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Ftears-of-steel.torrent',
}
const ENGINE_CLEANUP_INTERVAL = 30 * 1000; //NOTE: 30 seconds
const ENGINE_CLEANUP_TIMEOUT = 30 * 1000; //NOTE: 30 seconds
const VIDEO_FILES_EXTENSIONS_REGEX = /\.(mp4|ogg|webm)$/i;
const SUBTITLE_FILES_EXTENSIONS_REGEX = /\.(srt|vtt)$/i;
const STREAM_CHUNK_SIZE_BYTES = 10 * 1024 * 1024;
const DOWNLOAD_LOG_INTERVAL = 10;
const DOWNLOAD_ENTIRE_VIDEO_ON_STREAM_START = IS_PROD;

const engines = {};

router.get('/:videoName', async (req, res) => {
	const videoName = req.params.videoName;
	const magnetURI = VIDEO_NAMES_TO_MAGNET_URIS[videoName];

	if (!magnetURI) {
		return res.status(404).send('Video not found');
	}

	try {
		const engine = await getOrCreateEngine(magnetURI);
		const videoFile = getBiggestFileByExtension(engine.files, VIDEO_FILES_EXTENSIONS_REGEX);

		if (!videoFile) {
			return res.status(404).send('No video file found in torrent');
		}

		if (DOWNLOAD_ENTIRE_VIDEO_ON_STREAM_START) {
			videoFile.select();
		}

		const fileSize = videoFile.length;
		const videoFileExtension = path.extname(videoFile.name);
		const range = req.headers.range;
		const [start, end] = getBytesRange(range, fileSize);
		const contentLength = end - start + 1;

		res.writeHead(206, {
			'Content-Range': `bytes ${start}-${end}/${fileSize}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': contentLength,
			'Content-Type': `video/${videoFileExtension}`,
			'Cache-Control': 'public, max-age=3600',
			'Connection': 'keep-alive'
		});

		console.log(`Streaming ${videoFile.name} bytes ${start.toLocaleString()}-${end.toLocaleString()} (/ ${fileSize / 1024 / 1024} MB)`);
		console.log(`(Range: ${range?.toLocaleString()}, Content-Length: ${(contentLength / 1024 / 1024).toFixed(2)} MB)`);

		const stream = videoFile.createReadStream({ start, end });

		stream.on('data', () => {
			engine.lastUsed = Date.now();
		});

		stream.on('error', (err) => {
			console.error('Stream error:', err);
			stream.unpipe(res);
			stream.destroy();

			if (!res.headersSent) {
				res.status(500).send('Streaming error');
			}
		});

		stream.pipe(res);
	} catch (err) {
		trySendErrorResponse(res, err, req);
	}
});

router.get('/:videoName/subtitle/:subtitleName', async (req, res) => {
	const videoName = req.params.videoName;
	const subtitleName = req.params.subtitleName;
	const magnetURI = VIDEO_NAMES_TO_MAGNET_URIS[videoName];

	if (!magnetURI) {
		return res.status(404).send('Video not found');
	}

	try {
		const engine = await getOrCreateEngine(magnetURI);
		const subtitleFile = engine.files.find(file => file.name === subtitleName);
		subtitleFile.select();

		if (!subtitleFile) {
			return res.status(404).send('No subtitle file found in torrent');
		}

		res.setHeader('Content-Type', 'text/vtt');

		if (subtitleFile.name.endsWith('.srt')) {
			let data = '';
			subtitleFile.createReadStream()
				.on('data', chunk => data += chunk)
				.on('end', () => {
					//NOTE: SRT to VTT conversion
					const vtt = 'WEBVTT\n\n' + data
						.replace(/\r\n/g, '\n')
						.replace(/\r/g, '\n')
						.replace(/(\d+\s*)\n(\d{2}:\d{2}:\d{2}),(\d{3}) --> (\d{2}:\d{2}:\d{2}),(\d{3})/g,
							'$2.$3 --> $4.$5');
					res.end(vtt);
				});

			return;
		}

		subtitleFile.createReadStream().pipe(res);
	} catch (err) {
		trySendErrorResponse(res, err, req);
	}
});

router.get('/:videoName/subtitles', async (req, res) => {
	const videoName = req.params.videoName;
	const magnetURI = VIDEO_NAMES_TO_MAGNET_URIS[videoName];

	if (!magnetURI) {
		return res.status(404).send('Video not found');
	}

	try {
		const engine = await getOrCreateEngine(magnetURI);
		const subtitleFiles = getAllFilesByExtension(engine.files, SUBTITLE_FILES_EXTENSIONS_REGEX);

		const subtitles = subtitleFiles.map(file => {
			const lang = guessLanguageFromFilename(file.name);
			return {
				lang,
				path: `/stream/${videoName}/subtitle/${encodeURIComponent(file.name)}`
			};
		});

		res.json(subtitles);
	} catch (err) {
		trySendErrorResponse(res, err, req);
	}
});

function getBiggestFileByExtension(files, extensionRegex) {
	const filteredFiles = getAllFilesByExtension(files, extensionRegex);

	if (filteredFiles.length === 0) {
		return null;
	}

	return filteredFiles.reduce((largest, file) => {
		return file.length > largest.length ? file : largest;
	});
}

function getAllFilesByExtension(files, extensionRegex) {
	return files.filter(file => extensionRegex.test(file.name));
}

function guessLanguageFromFilename(filename) {
	const languageMatch = filename.match(/[\.\-_]([a-z]{2,3})(?:[\.\-_]|$)/i);
	return languageMatch ? languageMatch[1].toLowerCase() : 'unknown';
}

function getBytesRange(range, fileSize) {
	let start, end;

	if (range) {
		const parts = range.replace(/bytes=/, "").split("-");
		start = parseInt(parts[0], 10);

		if (parts[1]) {
			end = parseInt(parts[1], 10);
		} else {
			end = Math.min(start + STREAM_CHUNK_SIZE_BYTES, fileSize - 1);
		}
	} else {
		start = 0;
		end = Math.min(STREAM_CHUNK_SIZE_BYTES, fileSize - 1);
	}

	return [start, end];
}

function trySendErrorResponse(res, err, req) {
	console.error(`Error in ${req.method} ${req.originalUrl}:`, err);

	if (!res.headersSent) {
		res.status(500).send(`Error: ${err.message}`);
	}
	else {
		res.end();
	}
}

async function getOrCreateEngine(magnetURI) {
	const infoHashMatch = magnetURI.match(/btih:([a-zA-Z0-9]+)/i);
	const infoHash = infoHashMatch ? infoHashMatch[1].toLowerCase() : null;
	const engine = engines[infoHash];

	if (engine) {
		engine.lastUsed = Date.now();

		return engines[infoHash];
	}

	engines[infoHash] = new Promise((resolve, reject) => {
		const engine = torrentStream(magnetURI);

		const timeout = setTimeout(() => {
			reject(new Error('Torrent engine initialization timeout'));
		}, 30000);

		engine.on("ready", () => {
			clearTimeout(timeout);
			console.log(`New torrent engine added: ${infoHash}`);
			engines[infoHash] = engine;
			engine.lastUsed = Date.now();
			engines[infoHash] = engine;
			resolve(engine);
		});

		engine.on("error", (err) => {
			clearTimeout(timeout);
			console.error("Torrent error:", err);
			reject(err);
		});

		let downloadCount = 0;

		engine.on('download', (pieceIndex) => {
			engine.lastUsed = Date.now();
			++downloadCount;
			if (downloadCount % DOWNLOAD_LOG_INTERVAL === 0) {
				console.log(`Downloaded ${downloadCount} pieces with torrent engine: ${infoHash}`);
			}
		});
	});

	return engines[infoHash];
}

function enginesCleanup() {
	console.log("Running torrent engine cleanup check...");
	const now = Date.now();
	Object.keys(engines).forEach(infoHash => {
		const engine = engines[infoHash];
		if (engine.lastUsed && (now - engine.lastUsed) > ENGINE_CLEANUP_TIMEOUT) {
			console.log(`Destroying idle engine: ${infoHash}`);
			engine.destroy();
			delete engines[infoHash];
		}
	});
}

setInterval(enginesCleanup, ENGINE_CLEANUP_INTERVAL);

module.exports = router;
