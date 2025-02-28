require('dotenv').config();
const torrentStream = require('torrent-stream');
const path = require('path');

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
const STREAM_CHUNK_SIZE_BYTES = 10 * 1024 * 1024;
const DOWNLOAD_LOG_INTERVAL = 10;
const DONWLOAD_ENTIRE_FILE_ON_STREAM_START = IS_PROD;

module.exports = (app) => {
	const engines = {};

	app.get('/stream/:videoName', async (req, res) => {
		const videoName = req.params.videoName;
		const magnetURI = VIDEO_NAMES_TO_MAGNET_URIS[videoName];

		if (!magnetURI) {
			return res.status(404).send('Video not found');
		}

		try {
			const engine = await getOrCreateEngine(magnetURI);
			engine.lastUsed = Date.now();

			const videoFile = getBestVideoFile(engine.files);

			if (!videoFile) {
				return res.status(404).send('No video file found in torrent');
			}

			if (DONWLOAD_ENTIRE_FILE_ON_STREAM_START) {
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

			stream.on('error', (err) => {
				console.error('Stream error:', err);
				if (!res.headersSent) {
					res.status(500).send('Streaming error');
				} else {
					res.end();
				}
			});

			stream.pipe(res);
		} catch (err) {
			console.error('GET /stream error:', err);
			if (!res.headersSent) {
				res.status(500).send(`Error: ${err.message}`);
			} else {
				res.end();
			}
		}
	});

	function getBestVideoFile(files) {
		let videoFile = null;
		let maxSize = 0;

		for (const file of files) {
			if (VIDEO_FILES_EXTENSIONS_REGEX.test(file.name)) {
				if (file.length > maxSize) {
					videoFile = file;
					maxSize = file.length;
				}
			}
		}

		return videoFile;
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

	function getOrCreateEngine(magnetURI) {
		const infoHashMatch = magnetURI.match(/btih:([a-zA-Z0-9]+)/i);
		const infoHash = infoHashMatch ? infoHashMatch[1].toLowerCase() : null;

		if (infoHash && engines[infoHash]) {
			return Promise.resolve(engines[infoHash]);
		}

		return new Promise((resolve, reject) => {
			const engine = torrentStream(magnetURI);

			const timeout = setTimeout(() => {
				reject(new Error('Torrent engine initialization timeout'));
			}, 30000);

			engine.on("ready", () => {
				clearTimeout(timeout);
				const engineInfoHash = engine.infoHash;

				if (!engines[engineInfoHash]) {
					console.log(`New torrent engine added: ${engineInfoHash}`);
					engines[engineInfoHash] = engine;
				}

				resolve(engines[engineInfoHash]);
			});

			engine.on("error", (err) => {
				clearTimeout(timeout);
				console.error("Torrent error:", err);
				reject(err);
			});

			let downloadCount = 0;

			engine.on('download', (pieceIndex) => {
				++downloadCount;
				if (downloadCount % DOWNLOAD_LOG_INTERVAL === 0) {
					console.log(`Downloaded ${downloadCount} pieces with torrent engine: ${infoHash}`);
				}
			});
		});
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
}

