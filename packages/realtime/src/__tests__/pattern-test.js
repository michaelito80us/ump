// Quick pattern matching test
const pattern = 'ump:realtime:*';
const channel = 'ump:realtime:tournament:test-tournament';

// Convert Redis pattern to regex
const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
const regex = new RegExp(`^${regexPattern}$`);
const matches = regex.test(channel);

console.log('Pattern:', pattern);
console.log('Channel:', channel);
console.log('Regex pattern:', regexPattern);
console.log('Regex:', regex);
console.log('Matches:', matches);
