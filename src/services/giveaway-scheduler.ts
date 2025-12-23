import { Client, TextChannel, ActionRowBuilder } from 'discord.js';
import { giveawayRepository, participantRepository } from '../singletons';
import { Giveaway, WeightedRolesGiveaway } from '../types';
import createWinnerEmbed from '../components/embeds/giveaway-winner';
import moment from 'moment';

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
    const now = moment();
    const endsAt = moment(giveaway.endsAt);
    const delay = endsAt.diff(now);

    console.log(`[Scheduler] Checking ${giveaway.messageId}: Now=${now.format()}, EndsAt=${endsAt.format()}, Delay=${delay}`);

    if (delay <= 0) {
      this.endGiveaway(giveaway);
    } else {
      console.log(`Scheduling giveaway ${giveaway.messageId} to end in ${delay / 1000} seconds`);
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

      try {
        const giveawayMessage = await channel.messages.fetch(giveaway.messageId);
        if (giveawayMessage) {
          const disabledRows = giveawayMessage.components.map(row => {
            const newRow = ActionRowBuilder.from(row as any);
            newRow.components.forEach((component: any) => component.setDisabled(true));
            return newRow;
          });
          await giveawayMessage.edit({ components: disabledRows as any });
        }
      } catch (error) {
        console.warn(`Failed to disable buttons for giveaway ${giveaway.messageId}:`, error);
      }

      if (participants.length === 0) {
        await channel.send(`Giveaway **${giveaway.name}** has ended. No participants joined.`);
      } else {
        const winnerIds: Set<string> = new Set();
        const winnerCount = Math.min(giveaway.winnerCount, participants.length);

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
            // Fallback if pool is empty for some reason
            while (winnerIds.size < winnerCount) {
              const winner = participants[Math.floor(Math.random() * participants.length)];
              winnerIds.add(winner.userId);
            }
          } else {
            const currentPool = [...pool];

            while (winnerIds.size < winnerCount && currentPool.length > 0) {
              const index = Math.floor(Math.random() * currentPool.length);
              const winnerId = currentPool[index];

              if (!winnerIds.has(winnerId)) {
                winnerIds.add(winnerId);
              }

              for (let i = currentPool.length - 1; i >= 0; i--) {
                if (currentPool[i] === winnerId) {
                  currentPool.splice(i, 1);
                }
              }
            }
          }
        } else {
          // Simple random selection without replacement
          const participantsCopy = [...participants];
          while (winnerIds.size < winnerCount && participantsCopy.length > 0) {
            const index = Math.floor(Math.random() * participantsCopy.length);
            const winner = participantsCopy[index];
            winnerIds.add(winner.userId);
            participantsCopy.splice(index, 1);
          }
        }

        const winners = await Promise.all(Array.from(winnerIds).map(winnerId => channel.guild.members.fetch(winnerId)));

        await channel.send({
          content: `# 🎊 Giveaway Ended!\n**Giveaway:** ${giveaway.name}\n\nCongratulations! Here are the winners: 🎉\n${Array.from(winnerIds).map((winnerId, index) => `${index + 1}. <@${winnerId}>`).join('\n')}`,
          reply: {
            messageReference: giveaway.messageId,
          },
          embeds: winners.map((winner, index) => createWinnerEmbed({
            color: winner.displayHexColor,
            number: index + 1,
            winnerId: winner.id,
            winnerUsername: winner.user.username,
            winnerGuildAvatarUrl: winner.user.avatarURL(),
            winnerRoleId: participants.find(p => p.userId === winner.id)?.roleId!,
            winnerRequest: participants.find(p => p.userId === winner.id)?.requests.find(r => r.winAtPosition === index + 1)?.content || '',
          }))
        });
      }
    } catch (error) {
      console.error(`Failed to end giveaway ${giveaway.messageId}:`, error);
    }
  }
}
