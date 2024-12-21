import os from 'node:os'
import path from 'node:path'
import util from 'node:util'
import https from 'node:https'
import fs from 'node:fs'

const revision = process.argv[2];
if (!revision) {
	console.error('Usage: npx load-cb <revision> [dir]');
	process.exit(1);
}
const dir = process.argv[3] || '.local-chromium';
const CHROMIUM_PATH = path.join(process.cwd(), dir);
// const infoLink = `https://googlechromelabs.github.io/chrome-for-testing/known-good-revisions-with-downloads.json`

const downloadURLs = {
  linux: 'https://storage.googleapis.com/chromium-browser-snapshots/Linux_x64/%d/chrome-linux.zip',
  darwin: 'https://storage.googleapis.com/chromium-browser-snapshots/Mac/%d/chrome-mac.zip',
  win32: 'https://storage.googleapis.com/chromium-browser-snapshots/Win/%d/chrome-win32.zip',
  win64: 'https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/%d/chrome-win32.zip',
};

function combineUrl(revision) {
  let url = null;
  
	const platform = os.platform();
  if (platform === 'darwin')
    url = downloadURLs.darwin;
  else if (platform === 'linux')
    url = downloadURLs.linux;
  else if (platform === 'win32')
    url = os.arch() === 'x64' ? downloadURLs.win64 : downloadURLs.win32;

  console.assert(url, `Unsupported platform: ${platform}`);

  url = util.format(url, revision);
	return url;
}

function downloadChromium(url) {
	const request = https.get(url, response => {
		if (response.statusCode !== 200) {
			console.error(`Failed to download Chromium r${revision}!`);
			process.exit(1);
		}

		const total = parseInt(response.headers['content-length'], 10);
		let progress = 0;

		response.on('data', chunk => {
			progress += chunk.length;
			progressCallback(progress / total);
		});
		const _path = path.join(CHROMIUM_PATH, `${revision}-chrome.zip`);
		if (!fs.existsSync(CHROMIUM_PATH)) {
			fs.mkdirSync(CHROMIUM_PATH, { recursive: true });
		}
		const file = fs.createWriteStream(_path);
		response.pipe(file);
		file.on('error', err => {
			console.log(err)
		});

		file.on('finish', () => {
			file.close(() => {
				console.log(`Chromium r${revision} downloaded successfully!`);
			});
		});

		file.on('error', () => {
			console.error(`Failed to save Chromium r${revision}!`);
			process.exit(1);
		});
	});

	request.on('error', () => {
		console.error(`Failed to download Chromium r${revision}!`);
		process.exit(1);
	});
}

function progressCallback(progress) {
	const barLength = 50;
	const bar = '='.repeat(Math.floor(progress * barLength));
	const empty = ' '.repeat(barLength - bar.length);
	process.stdout.write(`Downloading Chromium r${revision}: [${bar}${empty}] ${Math.floor(progress * 100)}%\r`);
}

function main() {
	const url = combineUrl(revision);
	downloadChromium(url);
}

main();