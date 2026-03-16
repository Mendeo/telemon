'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
import * as net from 'node:net';

/**
 * Модуль отправки сообщений на TCP сервер. При этом соединение не закрывается после каждой отправки.
 * @module senders/tcp
 * @exports send
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** В эту переменную считываются значения bot token и chat_id из файла credentials.json
 * Шаблон credentials.json представлен в credentials.template.json
 * @type {Object}
 * @property {string} address - Сетевой адрес TCP сервера.
 * @property {string} port - Порт.
*/
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')).toString());

let client = null;
/**
 * Функция для отправки сообщений отправки сообщений на TCP сервер. Поднять сервер для приёма сообщений на порту 8080 можно простой командой "nc -lp 8080".
 * @param {string} subject - Заголовок собщения
 * @param {string} msg - Текст сообщения
 */
export function send(subject, msg)
{
	const full_msg = (subject ? subject + '\n' : '') + msg + '\n*******\n';
	if (!client)
	{
		client = new net.Socket();
		client.connect(credentials.port, credentials.address);
		client.on('connect', () =>
		{
			client.write(full_msg);
		});
		client.on('error', (e) => console.log('Message sending failed ' + e));
		client.on('close', () => console.log('Connection closed'));
	}
	else
	{
		client.write(full_msg);
	}
}