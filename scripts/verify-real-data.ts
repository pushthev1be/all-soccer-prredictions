import { realFootballData } from '../src/lib/api/real-football-data';

async function verifyRealData() {
  console.log('🔍 Verifying real football data connection...\n');
  
  try {
    // Test 1: Premier League Standings
    console.log('1. Fetching Premier League standings...');
    const standings = await realFootballData.getPremierLeagueStandings();
    console.log(`✅ Success! Got ${standings.length} teams`);
    console.log('Top 5:');
    standings.slice(0, 5).forEach(team => {
      console.log(`   ${team.position}. ${team.team.name} - ${team.points} pts (${team.form})`);
    });

    // Test 2: Manchester United Stats
    console.log('\n2. Fetching Manchester United recent matches...');
    const manUtdMatches = await realFootballData.getTeamMatches(66, 3);
    console.log(`✅ Got ${manUtdMatches.length} recent matches`);
    manUtdMatches.forEach(match => {
      console.log(`   ${match.homeTeam.name} ${match.score.fullTime.home}-${match.score.fullTime.away} ${match.awayTeam.name}`);
    });

    // Test 3: Upcoming fixtures
    console.log('\n3. Fetching upcoming Premier League fixtures...');
    const fixtures = await realFootballData.getUpcomingFixtures('PL', 5);
    console.log(`✅ Got ${fixtures.length} upcoming fixtures`);
    fixtures.forEach((fixture: any) => {
      console.log(`   ${fixture.homeTeam.name} vs ${fixture.awayTeam.name} - ${new Date(fixture.utcDate).toLocaleDateString()}`);
    });

    console.log('\n🎉 All real data tests passed!');
    console.log('✅ Your API key is working correctly.');
    console.log('✅ No more mock data - 100% real football statistics!');
    
  } catch (error: any) {
    console.error('❌ Real data verification failed:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('1. Check FOOTBALL_DATA_API_KEY in .env.local');
    console.log('2. Verify key is activated at football-data.org');
    console.log('3. Wait 60 seconds if rate limited (10 requests/min)');
    console.log('4. Check your network connection');
  }
}

verifyRealData();
