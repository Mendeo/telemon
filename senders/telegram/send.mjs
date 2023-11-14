'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
import * as https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')).toString());
export function send(msg)
{
	sendToTelegram(msg, credentials.bot_token, credentials.chat_id, (err) =>
	{
		if (err)
		{
			console.log(`Request to Telegram server failed:\n${err}`);
		}
		else
		{
			console.log('Message sent.');
		}
	});
}

function sendToTelegram(msg, botToken, chatId, onAnswer)
{
	let answerTxt = '';
	const postData = JSON.stringify({ text: msg, chat_id: chatId });
	const options =
	{
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	};
	const req = https.request(`https://api.telegram.org/bot${botToken}/sendMessage`, options, (res) =>
	{
		if (res.statusCode === 200)
		{
			res.on('data', (d) =>
			{
				answerTxt += d;
			});
			let isErr = false;
			res.on('error', (err) =>
			{
				isErr = true;
				onAnswer(err);
			});
			res.on('close', () =>
			{
				if (isErr) return;
				let data = {};
				try
				{
					data = JSON.parse(answerTxt);
				}
				catch(e)
				{
					onAnswer(e);
				}
				if (!data.ok)
				{
					onAnswer(data.description);
				}
				else
				{
					onAnswer(null, data);
				}
			});
		}
		else
		{
			onAnswer('Status code: ' + res.statusCode);
		}
	});
	req.on('error', onAnswer);
	req.end(postData);
}