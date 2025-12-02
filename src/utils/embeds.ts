import { EmbedBuilder } from 'discord.js';
import { config } from '../singletons';

export function createGiveawayEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`🎉 ${config.giveawayName}`)
    .setDescription(
      '**Klik tombol "Join Giveaway" untuk ikut serta!**\n\n' +
      `⏰ Berakhir: <t:${Math.floor(new Date(config.endDate).getTime() / 1000)}:F>\n` +
      `📝 Hanya peserta dengan role yang ditentukan yang bisa ikut`
    )
    .setTimestamp();
}

export function createProbabilityEmbed(probability: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#00FFFF')
    .setTitle('📊 Peluang Menang Anda')
    .setDescription(
      `**Probabilitas: ${probability.toFixed(4)}%**`
    )
    .setTimestamp();
}

export function createWinnerEmbed(winnerId: string, giveawayName: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🎊 Pemenang Giveaway!')
    .setDescription(
      `**${giveawayName}**\n\n` +
      `Selamat kepada <@${winnerId}>! 🎉`
    )
    .setTimestamp();
}