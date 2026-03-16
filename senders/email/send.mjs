'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
import * as nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const transporter = nodemailer.createTransport(
	{
		host: credentials.smtp,
		port: credentials.port,
		secure: true,
		auth:
		{
			user: credentials.login,
			pass: credentials.password,
		},
	});

/**
 * Отправляет заданное сообщение на электронную почту.
 * @param {string} subject - Тема письма
 * @param {string} msg - Текст письма
 */
export function send(subject, msg)
{
	const mailDetails =
	{
		from: credentials.from,
		to: credentials.to,
		subject,
		text: msg,
	};
	transporter.sendMail(mailDetails).then((info)=>
	{
		console.log(`The message ${info.messageId} was sent successfully to e-mail`);
	},
	(err) =>
	{
		console.log(`Error while sending to e-mail:\n${err}`);
	});
}
