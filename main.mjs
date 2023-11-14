'use strict';
import { tail, parseRPItemp } from './middlewares.mjs';
import { testSmart } from './triggers.mjs';
import { send as sendToMyTelegram } from './senders/telegram/send.mjs';
import { event as file_watcher } from './watchers/file_watcher.mjs';
import { event as command_watcher } from './watchers/command_watcher.mjs';

//Events list
/*Проверка системной почты*/
file_watcher(
	{
		path: '/var/mail',
		header: 'Новое письмо!',
		post: (text, fPath) => `Файл: ${fPath}\n${text}`
	}, [sendToMyTelegram]);

/*Сообщение о новых сессиях пользователей*/
file_watcher(
	{
		path: '/var/log/auth.log',
		header: 'Новый логин на сервер!',
		pre: (text) => tail(text, 2),
		trigger: (text) => text.indexOf('New session') !== -1
	}, [sendToMyTelegram]);

/*Изменение статуса райд массива*/
file_watcher(
	{
		path: '/proc/mdstat',
		header: 'Состояние рэйда изменилось. Следующая проверка через пол часа.',
		timeout: 1800000
	}, [sendToMyTelegram]);

/*Отслеживание температуры процессора*/
command_watcher(
	{
		command: 'vcgencmd',
		args: ['measure_temp'],
		period: 30000,
		header: 'Температура процессора превысила 65 градусов!',
		timeout: 180000,
		pre: parseRPItemp,
		trigger: (t) => Number(t) >= 65,
		post: (t) => `t = ${t}°C`
	}, [sendToMyTelegram]);

/*Отслеживание работы жёстких дисков*/
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

/*Отладка*/

/*
import { send as sendToTcp } from './senders/tcp/send.mjs';
command_watcher(
	{
		command: 'bash',
		args: ['test/qq.sh'],
		period: 3000,
		header: 'Важные изменения SMART!',
		post: null,
		trigger: function(smartJson)
		{
			const test = testSmart(smartJson);
			this.post = test.post;
			return test.result;
		},
	}, [sendToTcp]);
*/