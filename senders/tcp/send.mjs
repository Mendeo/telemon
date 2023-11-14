'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
import * as net from 'node:net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')).toString());

/*Функция для отправки сообщений в tcp (nc -lp 8080)*/
let client = null;
export function send(msg)
{
	if (!client)
	{
		client = new net.Socket();
		client.connect(credentials.port, credentials.address);
		client.on('connect', () =>
		{
			client.write(msg + '\n*******\n');
		});
		client.on('error', (e) => console.log('Отправка сообщение на TCP сервер неудачна. ' + e));
		client.on('close', () => console.log('Connection closed'));
	}
	else
	{
		client.write(msg + '\n*******\n');
	}
}