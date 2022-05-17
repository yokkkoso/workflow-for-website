import 'dotenv/config.js';

import axios from 'axios';
import { parse } from 'json5';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import { join } from 'node:path';
import process from 'node:process';
import type { Snowflake, APIGuildPreview } from 'discord-api-types/v10';

readFile(join(__dirname, '..', 'guildIds.json5'), 'utf-8').then(async file => {
	const guildIds = parse<Snowflake[]>(file);
	const guildsData: GuildData[] = [];

	for (const guildId of guildIds) {
		const response = await axios.get<APIGuildPreview>(`https://discord.com/api/v10/guilds/${guildId}/preview`, {
				headers: {
					'Authorization': `Bot ${process.env.BOT_TOKEN}`,
					'Content-Type': 'application/json'
				}
			}).catch(() => {});

		if (response?.status !== 200) continue;

		const responseData = response.data;

		guildsData.push({
			id: responseData.id,
			name: responseData.name,
			icon: responseData.icon,
			membersCount: responseData.approximate_member_count
		});

		await wait(30_000);
	}

	await writeFile(join(__dirname, '..', 'guilds.json'), JSON.stringify(guildsData), 'utf8');
});

type GuildData = {
	id: Snowflake;
	name: string;
	icon: string | null;
	membersCount: number;
};
