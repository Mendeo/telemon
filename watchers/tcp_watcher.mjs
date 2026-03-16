'use strict';
import * as net from 'node:net';
import { runInNewContext } from 'node:vm';
/**
 * Модуль для работы сторонних вотчеров. Они передают информацию на открытый tcp порт на локалхосте.
 * Данный модуль не проверяет отличается ли информация, полученная в прошлый раз от полученной только что, а просто пересылает полученный текст в сендеры.
 * @module watchers/command_watcher
 * @exports event
*/

/**
* Функция для постобработки текста сообщения.
* @callback post
* @param {*} data - Принятый на локалхост текст.
* @returns {string} Обработанный текст.
 */

/**
 * Функция обратного вызова. Вызывается, чтобы сообщить во внешний код об изменении в результате выполнения заданной команды.
 * @callback callback
 * @param {string} subject - Заголовок сообщения.
 * @param {string} msg - Текст сообщения. После обработки post, если эта функция задана.
 */

/**
 * Следит за изменениями результате работы заданной команды. Для этого эта команда переодически вызывается, результаты двух последовательных вызовов сравниваются друг с другом. Обработка начинается, если два последовательных вызова дают разный результат.
 * @param {object} input - Объект с входными параметрами.
 * @param {number} port - Номер порта, который будет слушать telemon.
 * @param {post} [input.post] - Функция для постобработки результата работы команды (после вызова функции trigger).
 * @param {string} [input.subject] - Заголовок. Добавляется к финальному сообщению.
 * @param {callback[]} callbacks - Массив функций обратного вызова, куда будет отправляться сообщение об изменениях в результате выполнения команды.
 */
export function event(input, callbacks)
{
	const server = net.createServer((socket) =>
	{
		console.log('tcp_watcher: new client has been connected.');
		let data = '';
		socket.on('data', (chunk) =>
		{
			data += chunk;
		});
		socket.on('error', (err) =>
		{
			sendToSenders(callbacks, 'Error while tcp watcher', err);
		});

		// Обработка отключения клиента
		socket.on('end', () =>
		{
			const [subject, msg] = getSubjectAndOther(data);
			sendToSenders(callbacks, subject, msg);
		});

		// Таймаут для сокета (опционально)
		socket.setTimeout(10000); // 60 секунд
		socket.on('timeout', () =>
		{
			console.log('tcp_watcher: connection timeout.');
			socket.end();
		});
	});

	// Обработка ошибок сервера
	server.on('error', (err) =>
	{
		console.log('tcp_watcher: Server error', err.message);
	});

	// Запускаем сервер на порту 9873
	const PORT = 9873;
	server.listen(PORT, () => {
		console.log(`TCP сервер запущен на порту ${PORT}`);
		console.log('Ожидание подключений...');
	});

	// Обработка сигналов завершения (Ctrl+C)
	process.on('SIGINT', () => {
		console.log('\nЗавершение работы сервера...');
		server.close(() => {
			console.log('Сервер остановлен');
			process.exit(0);
		});
	});


}

function getSubjectAndOther(text)
{
	const newLineIndex = text.indexOf('\n');
	if (newLineIndex === -1) return [text, ''];
	const subject = text.slice(0, newLineIndex);
	const other = text.slice(newLineIndex);
	return [subject, other];
}

function sendToSenders(senders, subject, msg)
{
	for (let sender of senders)
	{
		if (typeof sender === 'function') sender(subject, msg);
	}
}