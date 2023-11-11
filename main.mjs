'use strict';
import * as https from 'node:https';
import * as fs from 'node:fs';

import { event as file_watcher, tail } from './modules/file_watcher.mjs';
const onmail = file_watcher;
const onraid = file_watcher;

//Events list
onmail({ path: '/var/mail' }, sendToMyTelegram);
onraid({ path: '/proc/mdstat', timeout: 1800000 }, sendToMyTelegram);

const credentials = JSON.parse(fs.readFileSync('./credentials.json').toString());

function sendToMyTelegram(msg)
{
	sendToTelegram(msg, credentials.bot_token, credentials.chat_id, (err) =>
	{
		if (err)
		{
			console.log(`Запрос неудачный:\n${err}`);
		}
		else
		{
			console.log('Сообщение отправлено.');
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
