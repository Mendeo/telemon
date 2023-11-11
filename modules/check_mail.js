'use strict';
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
		}
	}, 500);
});