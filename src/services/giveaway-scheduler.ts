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
            // We need to pick unique winners from the pool
            // Since the pool contains duplicates for weights, we need to be careful
            // Simple approach: pick random index, add to winners, if already winner, pick again
            // But if pool is large, this might be slow? Not really for discord bot scale usually.
            // Better: Filter pool after picking? No, that changes probabilities.
            // Actually, standard weighted random selection without replacement.

            // Clone pool to avoid modifying original if needed (not needed here)
            const currentPool = [...pool];

            while (winnerIds.size < winnerCount && currentPool.length > 0) {
              const index = Math.floor(Math.random() * currentPool.length);
              const winnerId = currentPool[index];

              if (!winnerIds.has(winnerId)) {
                winnerIds.add(winnerId);
              }

              // Remove all instances of this user from pool to simulate "without replacement"
              // This is important because if we just ignore duplicates in `winnerIds` set but keep them in pool,
              // the user still has "tickets" in the pool, increasing chance of "wasted" picks,
              // but more importantly, does it affect probability for others?
              // Yes, if I have 100 tickets and you have 1, and I win one slot, my remaining 99 tickets shouldn't compete for the second slot if I can't win twice.
              // So we must remove all my tickets.

              // Optimization: filter in place or create new array
              // For performance, maybe just filtering is fine.
              // If pool is huge, this is heavy. But let's assume reasonable size.
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

        const embed = createWinnerEmbed({
          winnerIds: Array.from(winnerIds),
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
