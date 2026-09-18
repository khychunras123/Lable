const token = '8694331932:AAEif5VMmmF2ohUprtQxEeQHMPT1kvBGJ6M';
const chatId = '-5139897271';
const phone = '085467475(Cellcard)';
const rawDigits = phone.replace(/[^0-9]/g, '');
const intlPhone = rawDigits.startsWith('0') ? '855' + rawDigits.slice(1) : rawDigits;
const tgChatUrl = `https://t.me/+${intlPhone}`;
const telUrl = `tel:${rawDigits}`;

const text = `🔔 <b>មានការទម្លាក់ Order ថ្មី! (New Order Drop)</b> 📦

📦 <b>ACC Bot</b> [admin]
✅ សូមបងពិនិត្យលេខទូរស័ព្ទ និងទីតាំងម្ដងទៀតបង 🙏
📑 <b>Page:</b> INO Tech Studio
👤 <b>អតិថិជន:</b> Seng Leang
📞 <b>លេខទូរស័ព្ទ:</b> <a href="${telUrl}"><b>${phone}</b></a> <i>(ចុចដើម្បី Call)</i>
📍 <b>ទីតាំង:</b> សៀមរាប
🏠 <b>អាសយដ្ឋាន:</b> សៀមរាប ចុងកៅស៊ូ

------------- <b>ផលិតផល</b> -------------
1. ATTACK SHARK L50 PRO | Black x1 = $52.00

💰 <b>សរុប:</b>
- <b>តម្លៃសរុប: $52.00</b>
- 💵 <b>ស្ថានភាពបង់ប្រាក់:</b> Paid (ABA Bank (ACC Store) ($))

🚚 <b>វិធីសាស្ត្រដឹកជញ្ជូន:</b> វីរៈប៊ុនថាំ (VET)
📅 18/09/2026 18:37

អរគុណបង 🙏🥰 | ID: <b>#F38BA5</b>`;

fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '💬 ចុចឆាត Telegram ទៅកាន់អតិថិជន', url: tgChatUrl }]
      ]
    }
  })
}).then(r => r.json()).then(data => {
  console.log('Result:', JSON.stringify(data, null, 2));
  process.exit(0);
});
