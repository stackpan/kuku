import { Client, TextChannel } from 'discord.js';
import { giveawayRepository, participantRepository } from '../singletons';
import { Giveaway, WeightedRolesGiveaway } from '../types';
import createWinnerEmbed from '../components/embeds/giveaway-winner';

export class GiveawayScheduler {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async start() {
    const giveaways = await giveawayRepository.getAll();
    for (const giveaway of giveaways) {
      this.schedule(giveaway);
    }
  }

  schedule(giveaway: Giveaway | WeightedRolesGiveaway) {
    const now = new Date();
    const delay = giveaway.endsAt.getTime() - now.getTime();

    if (delay <= 0) {
      this.endGiveaway(giveaway);
    } else {
      console.log(`Scheduling giveaway ${giveaway.name} to end in ${delay / 1000} seconds`);
      setTimeout(() => this.endGiveaway(giveaway), delay);
    }
  }

  private async endGiveaway(giveaway: Giveaway | WeightedRolesGiveaway) {
    try {
      const participants = await participantRepository.getAll(giveaway.messageId);

      const channel = await this.client.channels.fetch(giveaway.channelId) as TextChannel;
      if (!channel) {
        console.error(`Channel ${giveaway.channelId} not found for giveaway ${giveaway.messageId}`);
        await giveawayRepository.delete(giveaway.messageId);
        return;
      }

      if (participants.length === 0) {
        await channel.send(`Giveaway **${giveaway.name}** has ended. No participants joined.`);
      } else {
        let winnerUserId: string;

        if (giveaway.activeWeightedRolesConfigId && 'weightedRoles' in giveaway && giveaway.weightedRoles.length > 0) {
          const pool: string[] = [];
          for (const p of participants) {
            const roleConfig = giveaway.weightedRoles.find(r => r.roleId === p.roleId);
            const weight = roleConfig ? roleConfig.weightNormalized : 1;
            for (let i = 0; i < weight; i++) {
              pool.push(p.userId);
            }
          }

          if (pool.length === 0) {
            // Should not happen if participants > 0 and default weight is 1
            const winner = participants[Math.floor(Math.random() * participants.length)];
            winnerUserId = winner.userId;
          } else {
            winnerUserId = pool[Math.floor(Math.random() * pool.length)];
          }
        } else {
          const winner = participants[Math.floor(Math.random() * participants.length)];
          winnerUserId = winner.userId;
        }

        const winner = await this.client.users.fetch(winnerUserId);

        if (!winner) {
          console.error(`User ${winnerUserId} not found for giveaway ${giveaway.messageId}`);
          return;
        }

        const embed = createWinnerEmbed({
          userId: winner.id,
          userAvatar: winner.avatarURL(),
          giveawayName: giveaway.name,
        });

        await channel.send({
          embeds: [embed]
        });
      }

      await giveawayRepository.delete(giveaway.messageId);
      console.log(`Giveaway ${giveaway.name} ended and deleted.`);

    } catch (error) {
      console.error(`Failed to end giveaway ${giveaway.messageId}:`, error);
    }
  }
}
