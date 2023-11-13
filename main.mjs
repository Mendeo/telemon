'use strict';
import * as https from 'node:https';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
//import * as net from 'node:net';

import { tail, parseRPItemp } from './middlewares.mjs';
import { event as file_watcher } from './modules/file_watcher.mjs';
import { event as command_watcher } from './modules/command_watcher.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Events list
/*Проверка системной почты*/
file_watcher(
	{
		path: '/var/mail',
		header: 'Новое письмо!'
	}, sendToMyTelegram);

/*Сообщение о новых сессиях пользователей*/
file_watcher(
	{
		path: '/var/log/auth.log',
		header: 'Статус пользователя изменился!',
		trigger: (text) => text.indexOf('New session') !== -1,
		middleware: (text) => tail(text, 2)
	}, sendToMyTelegram);

/*Изменение статуса райд массива*/
file_watcher(
	{
		path: '/proc/mdstat',
		header: 'Состояние рэйда изменилось. Следующая проверка через пол часа.',
		timeout: 1800000
	}, sendToMyTelegram);

/*Отслеживание температуры процессора*/
command_watcher(
	{
		command: 'vcgencmd',
		args: ['measure_temp'],
		period: 30000,
		header: 'Температура процессора достигла 65 градусов!',
		timeout: 180000,
		trigger: (text) =>
		{
			const tC = parseRPItemp(text);
			return tC >= 65;
		}
	}, sendToMyTelegram);

/*Отладка*/
//file_watcher({ path: 'qq.txt', header: 'Состояние рэйда изменилось. Следующая проверка через пол часа.', trigger: (text) => text.indexOf('!') !== -1, timeout: 5000 }, sendToTestServer);
//command_watcher({ command: 'bash', args: ['test/qq.sh', 'test1', 'test2'], period: 3000, header: 'Проверка', timeout: 10000, trigger: (text) => text.indexOf('@') !== -1 }, sendToTestServer);

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')).toString());

/*Функция для отправки сообщений в tcp (nc -lp 8080)*/
// let client = null;
// function sendToTestServer(msg)
// {
// 	if (!client)
// 	{
// 		client = new net.Socket();
// 		client.connect(8080, 'localhost');
// 		client.on('connect', () =>
// 		{
// 			client.write(msg + '\n*******\n');
// 		});
// 		client.on('error', () => console.log('Error occurred'));
// 		client.on('close', () => console.log('Connection closed'));
// 	}
// 	else
// 	{
// 		client.write(msg + '\n*******\n');
// 	}
// }

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
