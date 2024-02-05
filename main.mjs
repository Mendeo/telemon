'use strict';
import * as middlewares from './middlewares.mjs';
import { testSmart } from './triggers.mjs';
import { send as sendToMyTelegram } from './senders/telegram/send.mjs';
import { event as file_watcher } from './watchers/file_watcher.mjs';
import { event as command_watcher } from './watchers/command_watcher.mjs';

/**
 * Мониторинг сервера на Node.js.
 */

//Оповещение о новой системной почте.
file_watcher(
	{
		path: '/var/mail',
		header: 'Новое письмо!',
		post: (text, fPath) => `Файл: ${fPath}\n${text}`
	}, [sendToMyTelegram]);

//Оповещения о новых сессиях пользователей.
file_watcher(
	{
		path: '/var/log',
		header: 'Новый логин на сервер!',
		pre: (text, fPath, filename) =>
		{
			if (filename === 'auth.log') return middlewares.tail(text, 3);
			return '';
		},
		trigger: (text) => text.indexOf('New session') !== -1
	}, [sendToMyTelegram]);

//Оповещение об изменении статуса райд массива.
command_watcher(
	{
		command: 'cat',
		args: ['/proc/mdstat'],
		period: 60000,
		header: 'Состояние рэйда изменилось. Следующая проверка через час.',
		timeout: 3600000
	}, [sendToMyTelegram]);

// [ Только для Raspberry Pi ] Оповещение о том, что температура процессора превысила заданный порог.
command_watcher(
	{
		command: 'vcgencmd',
		args: ['measure_temp'],
		period: 30000,
		header: 'Температура процессора превысила 65 градусов!',
		timeout: 1800000,
		pre: middlewares.parseRPItemp,
		trigger: (t) => Number(t) >= 70,
		post: (t) => `t = ${t}°C`
	}, [sendToMyTelegram]);

//Оповещение об изменении статуса жёстких дисков (превышение температура и проверка важных SMART параметров).
{
	setDiskWatcher('/dev/sda');
	setDiskWatcher('/dev/sdb');
	function setDiskWatcher(disk)
	{
		command_watcher(
			{
				command: 'smartctl',
				args: ['-a', '-j', '-d', 'sat', disk],
				period: 300000,
				timeout: 1800000,
				header: 'Важные изменения SMART!',
				post: null,
				trigger: function(smartJson)
				{
					const test = testSmart(smartJson);
					this.post = test.post;
					return test.result;
				},
			}, [sendToMyTelegram]);
	}
}

// Оповещение о повышенной нагурзки на ЦП.
command_watcher(
	{
		command: 'uptime',
		period: 150000,
		timeout: 1800000,
		header: 'Повышенная нагрузка на ЦП',
		pre: (text) => middlewares.parseLoadAverageFromUptime(text, 2),
		trigger: (la2) => Number(la2) > 4,
	}, [sendToMyTelegram]);

// Оповещение о превышении трафика.
{
	const s1GiB = 1073741824;
	let sizeAlreadySent = 0;
	let currentSize = 0;

	function getTommorow()
	{
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth();
		const date = now.getDate();
		const tomorrow = new Date(year, month, date + 1);
		return tomorrow - now + 1;
	}

	function getHeader(size)
	{
		return `Превышено ${size} ГиБ трафика.`;
	}

	command_watcher(
		{
			command: 'vnstat',
			args: ['-i', 'eth0', '--json', 'd', '1'],
			period: 1200000,
			timeout: null,
			header: null,
			pre: (text) =>
			{
				const data = JSON.parse(text).interfaces[0].traffic.day[0];
				return { rx: data.rx, tx: data.tx, tot: data.rx + data.tx };
			},
			trigger: function(data)
			{
				if (data.tot < currentSize) sizeAlreadySent = 0;
				currentSize = data.tot;
				if (data.tot > 2 * s1GiB && data.tot <= 4 * s1GiB && sizeAlreadySent < 2)
				{
					this.header = getHeader(2);
					sizeAlreadySent = 2;
					return true;
				}
				if (data.tot > 4 * s1GiB && data.tot <= 6 * s1GiB && sizeAlreadySent < 4)
				{
					this.header = getHeader(4);
					sizeAlreadySent = 4;
					return true;
				}
				if (data.tot > 6 * s1GiB && data.tot <= 8 * s1GiB  && sizeAlreadySent < 6)
				{
					this.header = getHeader(6);
					sizeAlreadySent = 6;
					return true;
				}
				if (data.tot > 8 * s1GiB && data.tot <= 10 * s1GiB  && sizeAlreadySent < 8)
				{
					this.header = getHeader(8);
					sizeAlreadySent = 8;
					return true;
				}
				if (data.tot > 10 * s1GiB)
				{
					this.header = getHeader(10) + ' Это последнее сообщение о превышении трафика на сегодня.';
					sizeAlreadySent = 0;
					this.timeout = getTommorow();
					return true;
				}
				return false;
			},
			post: (data) => `rx: ${middlewares.getStrSize(data.rx)}, tx: ${middlewares.getStrSize(data.tx)}, total: ${middlewares.getStrSize(data.tot)}`
		}, [sendToMyTelegram]);
}
/*Отладка*/

// Отслеживание температуры процессора
// import { send as sendToTcp } from './senders/tcp/send.mjs';
// command_watcher(
// 	{
// 		command: 'bash',
// 		args: ['test/test.sh'],
// 		period: 3000,
// 		header: 'Температура процессора превысила 65 градусов!',
// 		timeout: 10000,
// 		pre: middlewares.parseRPItemp,
// 		trigger: (t) => Number(t) >= 65,
// 		post: (t) => `t = ${t}°C`
// 	}, [sendToTcp, sendToMyTelegram]);
