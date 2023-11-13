'use strict';
import * as https from 'node:https';
import * as fs from 'node:fs';
import * as net from 'node:net';

import { tail } from './middlewares/tail.mjs';
import { event as file_watcher } from './modules/file_watcher.mjs';
import { event as command_watcher } from './modules/command_watcher.mjs';

//Events list
//file_watcher({ path: '/var/mail', header: 'Новое письмо!' }, sendToMyTelegram);
//file_watcher({ path: '/var/log/auth.log', header: 'Статус пользователя изменился!', middleware: (text) => tail(text, 2) }, sendToMyTelegram);
//file_watcher({ path: '/proc/mdstat', header: 'Состояние рэйда изменилось. Следующая проверка через пол часа.', timeout: 1800000 }, sendToMyTelegram);

command_watcher({ command: 'bash', args: ['test/qq.sh', 'test1', 'test2'], period: 3000, header: 'Проверка', timeout: 36000 }, sendToTestServer);
//command_watcher({ command: 'who', args: ['-q'], period: 1000, header: 'Логин нового пользователя:' }, sendToMyTelegram);

const credentials = JSON.parse(fs.readFileSync('./credentials.json').toString());

let client = null;
function sendToTestServer(msg)
{
	if (!client)
	{
		client = new net.Socket();
		client.connect(8080, 'localhost');
		client.on('connect', () =>
		{
			//console.log('Connection established');
			client.write(msg + '\n*******\n');
		});
		client.on('error', () => console.log('Error occurred'));
		client.on('close', () => console.log('Connection closed'));
	}
	else
	{
		client.write(msg + '\n*******\n');
	}
}

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
