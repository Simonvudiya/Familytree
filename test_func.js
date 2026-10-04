const http = require('http');

const url = 'https://zkwygndhnupmzklcanzo.supabase.co/rest/v1/';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprd3lnbmRobnVwbXprbGNhbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzUxOTQsImV4cCI6MjA3ODk1MTE5NH0.gVurc5Om9MDrFbGcDAyY5PqbH1cM_Huh9WSbH-IcRw8';

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + key
  }
};

const data = JSON.stringify({ family_name: 'Test Family' });

const req = http.request(url + 'rpc/create_family_for_current_user', options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('statusCode:', res.statusCode);
    console.log('response:', body);
  });
});

req.write(data);
req.end();