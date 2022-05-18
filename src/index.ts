import 'dotenv/config.js';

import axios from 'axios';
import type { Snowflake, APIGuildPreview } from 'discord-api-types/v10';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { setTimeout as wait } from 'node:timers/promises';

void readFile(join(__dirname, '..', 'guilds.json5'), 'utf-8').then(async file => {
	const guildInputData: GuildData[] = JSON.parse(file) as GuildData[];
	const guildsOutputData: GuildData[] = [];

	for (const guild of guildInputData) {
		const response = await axios.get<APIGuildPreview>(`https://discord.com/api/v10/guilds/${guild.id}/preview`, {
				headers: {
					'Authorization': `Bot ${process.env.BOT_TOKEN!}`,
					'Content-Type': 'application/json'
				}
			}).catch(() => {});

		if (response?.status !== 200) {
			guildsOutputData.push({
				id: guild.id,
				name: guild.name,
				icon: guild.icon,
				membersCount: guild.membersCount,
				inviteURL: guild.inviteURL
			});

			continue;
		}

		const responseData = response.data;

		guildsOutputData.push({
			id: responseData.id,
			name: responseData.name,
			icon: convertIconHashToUrl(responseData),
			membersCount: roundMembersCount(responseData.approximate_member_count),
			inviteURL: guild.inviteURL
		});

		await wait(30_000);
	}

	await writeFile(
		join(__dirname, '..', 'guilds.json'),
		JSON.stringify(guildsOutputData.sort((a, b) => b.membersCount - a.membersCount), null, '\t'),
		'utf8'
	);
});

function roundMembersCount (membersCount: number): number {
	if (membersCount < 50) return 100;
	return Math.round(membersCount / 100) * 100;
}

function convertIconHashToUrl (guild: APIGuildPreview): string {
	return guild.icon
		? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}`
		: 'https://cdn.discordapp.com/embed/avatars/0.png';
}

type GuildData = {
	id: Snowflake;
	name: string;
	icon: string | null;
	membersCount: number;
	inviteURL: string;
};
