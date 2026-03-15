'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nodemailer = require("nodemailer");

/**
 * Модуль отправки сообщений в телеграм
 * @module senders/email
 * @exports send
*/

/** В эту переменную считываются значения логина и пароля из файла credentials.json
 * Шаблон credentials.json представлен в credentials.template.json
 * @type {Object}
 * @property {string} login - Логин на SMTP сервер.
 * @property {string} password - Пароль от SMTP сервера.
 * @property {string} to - Кому посылать сообщение
*/
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')).toString());

/**
 * Отправляет заданное сообщение в телеграм. Куда отправлять определяется в переменной credentials
 * @param {string} msg - Текст сообщения
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
