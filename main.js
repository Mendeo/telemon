'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');
const input = 'test';//process.argv[2];

fs.watch(input, (eventType, filename)=>
{
	console.log(eventType);
	setTimeout(() =>
	{
		const fPath = path.join(input, filename);
		if (fs.existsSync(fPath))
		{
			const fileData = fs.readFileSync(fPath).toString();
			sendToMyTelegram(fileData);
			fs.rmSync(fPath);
		}
	}, 500);
});

function sendToMyTelegram(msg)
{
	sendToTelegram(msg, BOT_TOKEN, CHAT_ID, (err) =>
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
