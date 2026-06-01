const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5074/api/auth/login', {
      email: 'admin@rescuesystem.com',
      password: 'Password123!'
    });
    const token = loginRes.data.data.accessToken;
    const teamId = '5F549564-8B17-4EA9-9BAD-BB48DA82619C';
    const missionsRes = await axios.get(`http://localhost:5074/api/RescueTeam/${teamId}/missions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(missionsRes.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
