'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
import * as https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @module
*/

/** Считываются значения bot token и chat_id из файла credentials.json
 * @type {Object}
 * @property {string} bot_token - Токен для телеграм бота.
 * @property {string} chat_id - сhat id - кому посылать сообщение.
*/
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')).toString());

/**
 * Отправляет заданное сообщение в телеграм. Куда отправлять определяется в переменной credentials
 * @param {string} msg - Текст сообщения
 * [credentials]
 */
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

/**
 * @callback onAnswer
 * @param {string} err - Сообщение об ошибке (это может ошибка доступа к телеграм серверу, или сервер сообщил об ошибке)
 * @param {object} data - Успешный ответ от телеграм сервера в виде объекта.
 */
/**
 * Отправляет заданное сообщение в телеграм. Куда отправлять определяется в параметрах этой функции.
 * @param {string} msg - Текст сообщения
 * @param {string} botToken - Токен для телеграм бота.
 * @param {string} chatId - сhat id - кому посылать сообщение.
 * @param {onAnswer} onAnswer - Вызывается после ответа от сервера телеграм.
 */
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