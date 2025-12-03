import { loadConfig } from '../../src/config';
import { Connection } from '../../src/database/connection';
import { calculateProbability } from '../../src/utils/probability';

const db = new Connection();

const config = loadConfig();
db.getAllParticipants().then((participants) => {
    const roleId = '1445293303753867346';
    const probability = calculateProbability(roleId, config, participants);

    console.log(`Role: ${roleId}\nWeight: ${config.roleWeights[roleId]}\nTotal participants: ${participants.length}\nProbability: ${probability}`);
})

